"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, Edit3, ShieldCheck, Clock } from "lucide-react";
import { AuthService } from "@/services/AuthService";
import { useToast } from "@/contexts/ToastContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { OtpInput, OtpInputHandle } from "@/components/auth/OtpInput";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { InlineAlert } from "@/components/ui/InlineAlert";

const OTP_LENGTH = 4;
const INITIAL_COUNTDOWN = 30;
const MAX_ATTEMPTS = 5;

export default function VerifyOtpPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(INITIAL_COUNTDOWN);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [isShaking, setIsShaking] = useState(false);
  const [resendNotification, setResendNotification] = useState(false);
  const otpInputRef = useRef<OtpInputHandle>(null);

  // Guard: if already logged in -> /dashboard. If no pending email -> /login
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "Verify your email — Inflixo";
    }

    if (AuthService.isLoggedIn()) {
      router.replace("/dashboard");
      return;
    }

    const pending = AuthService.getPendingEmail();
    if (!pending) {
      router.replace("/login");
      return;
    }
    setEmail(pending);
  }, [router]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const submitCode = async (code: string) => {
    if (submitting || code.length !== OTP_LENGTH) return;
    if (attemptsLeft <= 0) {
      setErrorMessage("Too many attempts. Please request a new code.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const { hasProfile, isExistingProfile } = await AuthService.verifyOtp(code);
      setSubmitting(false);

      const profileExists = Boolean(hasProfile || isExistingProfile);

      if (profileExists) {
        showToast("Welcome back! Redirecting to Studio 🎉");
        router.push("/dashboard");
      } else {
        showToast("Email verified! Let's set up your profile ✨");
        router.push("/onboarding");
      }
    } catch (err: any) {
      setSubmitting(false);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 380);

      // Clear boxes and focus the first box
      otpInputRef.current?.clearAndFocus();

      const nextAttempts = Math.max(0, attemptsLeft - 1);
      setAttemptsLeft(nextAttempts);

      if (nextAttempts <= 0) {
        setErrorMessage("Too many attempts. Please request a new code.");
        setCountdown(0); // enable resend button immediately
      } else {
        const isExpired = err?.message && err.message.toLowerCase().includes("expired");
        if (isExpired) {
          setErrorMessage("This code has expired. Please request a new one.");
          setCountdown(0);
        } else {
          setErrorMessage("That code didn't match. Try again.");
        }
      }
    }
  };

  async function handleResend() {
    if (resending || !email) return;
    setResending(true);
    setErrorMessage("");

    try {
      await AuthService.requestOtp(email);
      setCountdown(INITIAL_COUNTDOWN);
      setAttemptsLeft(MAX_ATTEMPTS);
      otpInputRef.current?.clearAndFocus();
      setResendNotification(true);
      setTimeout(() => setResendNotification(false), 4000);
      showToast("New code sent! 📩");
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  const isComplete = digits.every((d) => d.trim() !== "");
  const isInputsDisabled = attemptsLeft <= 0 || submitting;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timerFormatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <AuthLayout showBackToHome={false}>
      <AuthCard
        eyebrow="VERIFICATION"
        eyebrowIcon={<ShieldCheck className="h-3.5 w-3.5 text-[#7A2253]" />}
        title="Check your email"
        subtitle={
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs sm:text-sm text-[#52525B]">
              We sent a 4-digit code to{" "}
              <strong className="font-bold text-[#18181B]">{email}</strong>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="ml-2 inline-flex items-center gap-0.5 text-xs font-bold text-[#7A2253] underline hover:opacity-80 cursor-pointer"
                title="Edit email address"
              >
                <Edit3 className="h-3 w-3" />
                <span>Edit</span>
              </button>
            </p>
          </div>
        }
        footer={
          <p className="inline-flex items-center justify-center gap-1.5 text-center text-xs font-medium text-[#71717A]">
            <Lock className="h-3.5 w-3.5 text-[#71717A]" />
            <span>Secure passwordless sign-in by Inflixo</span>
          </p>
        }
      >
        <div className="space-y-4">
          {/* Info pill */}
          <div className="flex justify-center">
            <Chip
              variant="pill"
              icon={<Clock className="h-3.5 w-3.5 text-[#7A2253]" />}
              className="text-[11.5px] sm:text-xs"
            >
              Code expires in 10 minutes. It usually arrives in a few seconds.
            </Chip>
          </div>

          {/* Resend notification alert */}
          {resendNotification && (
            <InlineAlert variant="info" className="text-left">
              New code sent. Check your inbox!
            </InlineAlert>
          )}

          {/* OTP Input Boxes */}
          <div className="py-1">
            <OtpInput
              ref={otpInputRef}
              length={OTP_LENGTH}
              value={digits}
              disabled={isInputsDisabled}
              hasError={Boolean(errorMessage)}
              isShaking={isShaking}
              onChange={(next) => {
                setDigits(next);
                if (errorMessage) setErrorMessage("");
              }}
              onComplete={submitCode}
            />

            {/* Error Message */}
            {errorMessage && (
              <p
                role="alert"
                aria-live="assertive"
                className="mt-2 text-xs font-semibold text-[#DC2626]"
              >
                {errorMessage}
              </p>
            )}

            {/* Attempts Remaining: Muted text, NOT red */}
            {attemptsLeft < MAX_ATTEMPTS && attemptsLeft > 0 && (
              <p className="mt-1 text-xs font-medium text-[#52525B]">
                {attemptsLeft} {attemptsLeft === 1 ? "attempt" : "attempts"} left
              </p>
            )}
          </div>

          {/* Verify & continue Button */}
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            loading={submitting}
            disabled={!isComplete || submitting || attemptsLeft <= 0}
            onClick={() => submitCode(digits.join(""))}
          >
            {submitting ? (
              "Verifying…"
            ) : (
              <span className="inline-flex items-center gap-1.5">
                Verify &amp; continue <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          {/* Resend section */}
          <div className="space-y-1.5 pt-1 text-center text-xs font-medium text-[#52525B]">
            {countdown > 0 && attemptsLeft > 0 ? (
              <p>
                Didn&apos;t get it? Resend code in{" "}
                <span className="font-mono font-bold text-[#7A2253]">
                  {timerFormatted}
                </span>
              </p>
            ) : (
              <p>
                Didn&apos;t get it?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="font-bold text-[#7A2253] underline hover:opacity-80 cursor-pointer disabled:opacity-50"
                >
                  {resending ? "Sending code…" : "Resend code"}
                </button>
              </p>
            )}

            <p className="text-[11px] text-[#71717A] sm:text-xs">
              Check your spam or Promotions folder.
            </p>
          </div>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
