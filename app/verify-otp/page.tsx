"use client";

import { useEffect, useRef, useState, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Lock } from "lucide-react";
import { AuthSplitLayout } from "@/layouts/AuthSplitLayout";
import { Button } from "@/components/ui/Button";
import { AuthService } from "@/services/AuthService";
import { useToast } from "@/contexts/ToastContext";

import { SyncingLoader } from "@/components/shared/SyncingLoader";

const OTP_LENGTH = 4;
const COUNTDOWN_SECONDS = 30;

export default function VerifyOtpPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount & retrieve pending email
  useEffect(() => {
    const pending = AuthService.getPendingEmail();
    if (!pending) {
      router.replace("/login");
      return;
    }
    setEmail(pending);

    const timer = setTimeout(() => {
      inputsRef.current[0]?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [router]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const submit = async (code: string) => {
    if (submitting || code.length !== OTP_LENGTH) return;
    setSubmitting(true);
    setErrorMessage("");

    try {
      const { isExistingProfile, onboardingStep } = await AuthService.verifyOtp(code);

      if (onboardingStep === "finish") {
        showToast("Welcome back! Syncing your profile 🎉");
        router.push("/dashboard");
      } else {
        const stepRoutes: Record<string, string> = {
          profile: "/onboarding/profile",
          socials: "/onboarding/socials",
          theme: "/onboarding/themes",
          series: "/onboarding/series",
          subscription: "/onboarding/subscription",
        };

        const targetRoute = stepRoutes[onboardingStep] || "/onboarding/profile";
        showToast("Email verified! Resuming setup ✨");
        router.push(targetRoute);
      }
    } catch {
      setSubmitting(false);
      setErrorMessage("That code doesn't look right. Try again.");
    }
  };

  function handleChange(index: number, value: string) {
    const clean = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    setErrorMessage("");

    if (clean && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
    if (next.every((d) => d !== "")) {
      submit(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((d, i) => (next[i] = d));
    setDigits(next);
    setErrorMessage("");
    const lastIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
    inputsRef.current[lastIndex]?.focus();
    if (pasted.length === OTP_LENGTH) {
      submit(pasted);
    }
  }

  async function handleResend() {
    if (countdown > 0 || resending) return;
    setResending(true);
    try {
      if (email) {
        await AuthService.requestOtp(email);
      }
      setCountdown(COUNTDOWN_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(""));
      setErrorMessage("");
      setCodeSent(true);
      setTimeout(() => setCodeSent(false), 3000);
      inputsRef.current[0]?.focus();
    } catch (err: any) {
      showToast(err?.message || "Failed to resend code", "error");
    } finally {
      setResending(false);
    }
  }

  const isOtpComplete = digits.every((d) => d !== "");

  if (submitting) {
    return <SyncingLoader message="Verifying OTP & syncing your creator profile..." fullScreen />;
  }

  return (
    <AuthSplitLayout>
      <div className="space-y-6 text-left">
        {/* Back / Change Email Button */}
        <div>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-purple-200 hover:bg-purple-50 hover:text-[#803D63] transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>← Change email</span>
          </button>
        </div>

        {/* Heading & Email Description */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
              Check your email
            </h1>
            <Mail className="h-5 w-5 text-[#803D63] shrink-0" />
          </div>

          <div className="text-xs sm:text-sm font-medium text-[#4B5563]">
            <p>We sent a 4-digit code to</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-bold text-[#111827] truncate">{email || "your email"}</span>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-xs font-bold text-[#803D63] hover:underline shrink-0"
              >
                (Change)
              </button>
            </div>
          </div>
        </div>

        {/* 4-Digit OTP Input Boxes */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-center gap-3 sm:gap-3.5">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={1}
                autoFocus={i === 0}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                aria-label={`Digit ${i + 1}`}
                className={`h-14 w-14 sm:h-16 sm:w-16 rounded-xl border text-center text-2xl font-bold text-[#111827] bg-white outline-none transition-all duration-150 ${
                  errorMessage
                    ? "border-red-400 bg-red-50/20 text-red-600"
                    : d
                    ? "border-[#803D63] ring-2 ring-[#803D63]/20 bg-purple-50/30"
                    : "border-[#E5E7EB] focus:border-[#803D63] focus:ring-2 focus:ring-[#803D63]/20"
                }`}
              />
            ))}
          </div>

          {/* Invalid OTP Error Message */}
          {errorMessage && (
            <p className="text-xs font-semibold text-red-500 text-center animate-fade-in pt-1">
              {errorMessage}
            </p>
          )}

          {/* Code Sent Toast Banner */}
          {codeSent && (
            <p className="text-xs font-bold text-emerald-600 text-center animate-fade-in pt-1">
              New code sent ✓
            </p>
          )}
        </div>

        {/* Verify & Continue Button */}
        <Button
          fullWidth
          size="lg"
          loading={submitting}
          disabled={!isOtpComplete || submitting}
          onClick={() => submit(digits.join(""))}
          className={`font-bold transition-colors h-12 text-sm rounded-xl cursor-pointer shadow-none ${
            isOtpComplete && !submitting
              ? "bg-[#803D63] text-white hover:bg-[#6D3254]"
              : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
          }`}
        >
          {submitting ? "Verifying..." : "Verify & Continue →"}
        </Button>

        {/* Resend Code 30-Second Countdown Timer Section */}
        <div className="text-center text-xs font-medium text-[#4B5563]">
          {countdown > 0 ? (
            <p>
              Didn&apos;t receive code? Resend in{" "}
              <span className="font-mono font-bold text-[#111827]">
                00:{countdown.toString().padStart(2, "0")}
              </span>
            </p>
          ) : (
            <p>
              Didn&apos;t receive code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="font-bold text-[#803D63] hover:underline cursor-pointer"
              >
                {resending ? "Sending..." : "Resend Code"}
              </button>
            </p>
          )}
        </div>

        {/* Muted Security Badge */}
        <div className="pt-4 border-t border-[#E5E7EB] text-center">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
            <Lock className="h-3.5 w-3.5 text-gray-400" />
            <span>Secure passwordless 1-click sign in</span>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
