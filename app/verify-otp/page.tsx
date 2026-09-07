"use client";

import { useEffect, useRef, useState, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AuthService } from "@/services/AuthService";
import { useToast } from "@/contexts/ToastContext";
import { Logo } from "@/components/shared/Logo";
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

      if (onboardingStep === "finish" || isExistingProfile) {
        showToast("Welcome back! Redirecting to Dashboard 🎉");
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
    } catch (err: any) {
      setSubmitting(false);
      setErrorMessage(err?.message || "Invalid OTP code. Please check your email and try again.");
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
    return <SyncingLoader message="Verifying OTP & syncing your creator profile..." fullScreen hideProgressBar={true} />;
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-[#FAF9F6] px-4 py-8 text-center text-[#181716] overflow-hidden">
      {/* Subtle Ambient Background Light */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-80 bg-gradient-radial from-[#F5F3ED] to-transparent blur-3xl" />

      <div className="relative z-10 w-full max-w-[440px] space-y-6">
        {/* 1. Header Branding */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Logo size="md" />
            <span className="rounded-full bg-[#803D63]/[0.09] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#803D63] border border-[#803D63]/20">
              VERIFICATION
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#181716] tracking-tight">
              Check your email
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#54514D] max-w-xs mx-auto leading-relaxed">
              We sent a 4-digit code to <span className="font-bold text-[#181716]">{email || "your email"}</span>
            </p>
          </div>
        </div>

        {/* 2. Main Centered Card */}
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-7 sm:p-8 shadow-xs space-y-5 text-center">
          {/* Change Email Pill */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#F8F7F3] px-3 py-1 text-xs font-semibold text-[#54514D] border border-[#E7E3DC] hover:bg-[#E7E3DC] hover:text-[#181716] transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Change email address</span>
            </button>
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
                  className={`h-14 w-14 sm:h-15 sm:w-15 rounded-xl border text-center text-2xl font-bold text-[#181716] bg-white outline-none transition-all duration-150 ${
                    errorMessage
                      ? "border-rose-400 bg-rose-50/20 text-[#C2414B] ring-2 ring-rose-200"
                      : d
                      ? "border-[#803D63] ring-1 ring-[#803D63] bg-[#803D63]/5"
                      : "border-[#E7E3DC] focus:border-[#803D63] focus:ring-2 focus:ring-[#803D63]/15"
                  }`}
                />
              ))}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <p className="text-xs font-semibold text-[#C2414B] text-center animate-fade-in pt-1">
                {errorMessage}
              </p>
            )}

            {/* Code Sent Toast Banner */}
            {codeSent && (
              <p className="text-xs font-semibold text-emerald-600 text-center animate-fade-in pt-1">
                New verification code sent ✓
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
            className={`font-bold transition-all h-11 text-xs sm:text-sm rounded-xl cursor-pointer ${
              isOtpComplete && !submitting
                ? "bg-[#803D63] text-white hover:bg-[#6F3456] shadow-xs"
                : "bg-[#F8F7F3] text-[#797570] border border-[#E7E3DC] cursor-not-allowed shadow-none"
            }`}
          >
            <span>Verify &amp; Continue</span>
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>

          {/* Resend Countdown Timer */}
          <div className="text-center text-xs font-medium text-[#797570] pt-1">
            {countdown > 0 ? (
              <p>
                Didn&apos;t receive code? Resend in{" "}
                <span className="font-mono font-bold text-[#181716]">
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
        </div>

        {/* 3. Footer */}
        <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#797570] text-center">
          <Lock className="h-3 w-3 text-[#797570]" />
          <span>Secure passwordless verification by Inflixo</span>
        </p>
      </div>
    </div>
  );
}
