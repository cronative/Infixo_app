"use client";

import { useEffect, useRef, useState, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, Loader2, ShieldCheck, Edit3 } from "lucide-react";
import { AuthService } from "@/services/AuthService";
import { useToast } from "@/contexts/ToastContext";
import { Logo } from "@/components/shared/Logo";
import { SyncingLoader } from "@/components/shared/SyncingLoader";
import { CreatorGridBackground } from "@/components/shared/CreatorGridBackground";
import { debugLog, debugError } from "@/lib/debugLogger";

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
      debugLog("VERIFY_OTP_PAGE", "verifyOtp returned:", { isExistingProfile, onboardingStep });

      if (onboardingStep === "finish" || isExistingProfile) {
        debugLog("VERIFY_OTP_PAGE", "Established creator -> Redirecting to /dashboard");
        showToast("Welcome back! Redirecting to Dashboard 🎉");
        router.push("/dashboard");
      } else {
        const stepRoutes: Record<string, string> = {
          username: "/onboarding/username",
          profile: "/onboarding/profile",
          socials: "/onboarding/socials",
          subscription: "/onboarding/subscription",
        };

        const targetRoute = stepRoutes[onboardingStep] || "/onboarding/username";
        debugLog("VERIFY_OTP_PAGE", `New / Incomplete profile -> Redirecting to: ${targetRoute}`);
        showToast("Email verified! Resuming setup ✨");
        router.push(targetRoute);
      }
    } catch (err: any) {
      debugError("VERIFY_OTP_PAGE", "Verification error:", err?.message);
      setSubmitting(false);
      setErrorMessage(err?.message || "Invalid verification code. Please check your email.");
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
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-[#f8fafc] px-4 py-6 sm:py-10 text-[#181716]">
      <CreatorGridBackground showWordmark />

      {/* UNIFIED CENTER CARD: EXACT 420px WIDTH & MATCHING FIXED HEIGHT FOR BOTH SCREENS */}
      <div className="relative z-10 my-auto flex min-h-[530px] w-full max-w-[420px] flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white/95 p-5 text-center shadow-[0_20px_60px_-15px_rgba(4,48,132,0.12)] backdrop-blur-xl transition-all sm:min-h-[550px] sm:p-6">
        
        {/* TOP BLOCK: Header & Verification Info */}
        <div>
          {/* 1. Header: Logo & Badge */}
          <div className="flex flex-col items-center text-center">
            <Logo size="lg" orientation="vertical" />
            <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#043084]/[0.07] px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-[#043084]">
              <ShieldCheck className="h-3 w-3" />
              <span>Verification</span>
            </div>
          </div>

          {/* 2. Headline & Subtitle with Quick Inline Email Edit */}
          <div className="mt-3.5 space-y-1">
            <h1 className="font-display text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              Enter 4-digit code
            </h1>
            <div className="mx-auto flex max-w-[340px] items-center justify-center gap-1.5 text-xs font-medium text-slate-500 sm:text-[13px]">
              <span>Sent to</span>
              <span className="font-bold text-slate-800 truncate max-w-[190px]">
                {email || "your email"}
              </span>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="inline-flex items-center gap-0.5 font-bold text-[#043084] underline hover:text-[#032363] cursor-pointer text-[11px]"
                title="Change email address"
              >
                <Edit3 className="h-3 w-3" />
                <span>Edit</span>
              </button>
            </div>
          </div>

          {/* 3. Expiry Pill (Matches Login Trust Pill) */}
          <div className="mx-auto mt-3 flex w-fit items-center justify-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
            <Lock className="h-3 w-3 text-[#043084]" />
            <span>One-time password • Valid for 10 minutes</span>
          </div>
        </div>

        {/* MIDDLE BLOCK: 4-Digit OTP Boxes, Submit Button & Resend */}
        <div className="my-auto py-2">
          <div className="space-y-2">
            <div className="flex justify-center gap-2.5 sm:gap-3">
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
                  className={`h-13 w-12 rounded-xl border text-center text-2xl font-black transition-all duration-150 outline-none sm:h-14 sm:w-14 ${
                    errorMessage
                      ? "border-rose-500 bg-rose-50/30 text-rose-600 ring-2 ring-rose-200"
                      : d
                        ? "border-[#043084] bg-white text-slate-900 ring-4 ring-[#043084]/12 shadow-sm"
                        : "border-slate-300 bg-slate-50/80 text-slate-900 focus:border-[#043084] focus:bg-white focus:ring-4 focus:ring-[#043084]/10"
                  }`}
                />
              ))}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <p className="animate-fade-in pt-0.5 text-xs font-semibold text-rose-500">
                {errorMessage}
              </p>
            )}

            {/* Code Sent Notification Banner */}
            {codeSent && (
              <p className="animate-fade-in rounded-lg border border-[#043084]/20 bg-[#043084]/5 px-3 py-1.5 text-center text-xs font-bold text-[#043084]">
                New verification code sent 📩
              </p>
            )}
          </div>

          {/* 4. Verify & Open Studio Button */}
          <button
            type="button"
            disabled={!isOtpComplete || submitting}
            onClick={() => submit(digits.join(""))}
            className={`tap-scale mt-3.5 flex h-11.5 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.98] ${
              isOtpComplete && !submitting
                ? "bg-[#043084] text-white shadow-[#043084]/20 hover:bg-[#032363]"
                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Verify &amp; Open Studio</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {/* 5. Resend Countdown Timer */}
          <div className="mt-3.5 text-center text-xs font-medium text-slate-500">
            {countdown > 0 ? (
              <p>
                Didn&apos;t get code? Resend in{" "}
                <span className="font-mono font-bold text-[#043084]">
                  00:{countdown.toString().padStart(2, "0")}
                </span>
              </p>
            ) : (
              <p>
                Didn&apos;t get code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="cursor-pointer font-bold text-[#043084] underline hover:text-[#032363]"
                >
                  {resending ? "Sending..." : "Resend Code"}
                </button>
              </p>
            )}
          </div>
        </div>

        {/* BOTTOM BLOCK: Security Footer Inside Card */}
        <div className="border-t border-slate-100 pt-3">
          <p className="inline-flex items-center justify-center gap-1.5 text-center text-[11px] font-medium text-slate-400">
            <Lock className="h-3 w-3 text-slate-400" />
            <span>Secure passwordless verification by Inflixo</span>
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
