"use client";

import { useEffect, useRef, useState, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, ArrowRight, Loader2 } from "lucide-react";
import { AuthService } from "@/services/AuthService";
import { useToast } from "@/contexts/ToastContext";
import { Logo } from "@/components/shared/Logo";
import { SyncingLoader } from "@/components/shared/SyncingLoader";
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
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-[#f8fafc] px-4 py-8 text-center text-[#181716] overflow-hidden">
      {/* Background Inflixo "I" Logo Mark & Radiating Waves */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
        {/* Top-Left Inflixo "I" Logo Watermark */}
        <div className="absolute -top-12 -left-12 sm:-top-16 sm:-left-16 text-[#3a2447] opacity-[0.06] -rotate-12">
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[320px] h-[320px] sm:w-[460px] sm:h-[460px]"
          >
            {/* Concentric Radiating Outer Squircle Echoes */}
            <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <rect x="-30" y="-30" width="160" height="160" rx="44" strokeOpacity="0.65" />
              <rect x="-65" y="-65" width="230" height="230" rx="60" strokeOpacity="0.45" />
              <rect x="-105" y="-105" width="310" height="310" rx="80" strokeOpacity="0.3" />
              <rect x="-155" y="-155" width="410" height="410" rx="104" strokeOpacity="0.18" />
            </g>

            {/* Inflixo Outer Stadium Link Frame */}
            <g stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M 28 42 L 28 24 C 28 14 38 10 50 10 C 62 10 72 14 72 24 L 72 42" />
              <path d="M 28 58 L 28 76 C 28 86 38 90 50 90 C 62 90 72 86 72 76 L 72 58" />
              <path d="M 28 34 C 28 38 34 42 40 42" />
              <path d="M 72 34 C 72 38 66 42 60 42" />
              <path d="M 28 66 C 28 62 34 58 40 58" />
              <path d="M 72 66 C 72 62 66 58 60 58" />
            </g>

            {/* Inflixo Center Letter 'I' */}
            <g fill="currentColor">
              <rect x="36" y="25" width="28" height="7" rx="3.5" />
              <rect x="45.5" y="32" width="9" height="36" rx="4.5" />
              <rect x="36" y="68" width="28" height="7" rx="3.5" />
            </g>
          </svg>
        </div>

        {/* Bottom-Right Inflixo "I" Logo Watermark */}
        <div className="absolute -bottom-16 -right-16 sm:-bottom-20 sm:-right-20 text-[#3a2447] opacity-[0.05] rotate-12">
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[360px] h-[360px] sm:w-[500px] sm:h-[500px]"
          >
            {/* Concentric Radiating Outer Squircle Echoes */}
            <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <rect x="-30" y="-30" width="160" height="160" rx="44" strokeOpacity="0.65" />
              <rect x="-65" y="-65" width="230" height="230" rx="60" strokeOpacity="0.45" />
              <rect x="-105" y="-105" width="310" height="310" rx="80" strokeOpacity="0.3" />
              <rect x="-155" y="-155" width="410" height="410" rx="104" strokeOpacity="0.18" />
            </g>

            {/* Inflixo Outer Stadium Link Frame */}
            <g stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M 28 42 L 28 24 C 28 14 38 10 50 10 C 62 10 72 14 72 24 L 72 42" />
              <path d="M 28 58 L 28 76 C 28 86 38 90 50 90 C 62 90 72 86 72 76 L 72 58" />
              <path d="M 28 34 C 28 38 34 42 40 42" />
              <path d="M 72 34 C 72 38 66 42 60 42" />
              <path d="M 28 66 C 28 62 34 58 40 58" />
              <path d="M 72 66 C 72 62 66 58 60 58" />
            </g>

            {/* Inflixo Center Letter 'I' */}
            <g fill="currentColor">
              <rect x="36" y="25" width="28" height="7" rx="3.5" />
              <rect x="45.5" y="32" width="9" height="36" rx="4.5" />
              <rect x="36" y="68" width="28" height="7" rx="3.5" />
            </g>
          </svg>
        </div>
      </div>

      {/* SINGLE UNIFIED WHITE CARD */}
      <div className="relative z-10 w-full max-w-[450px] rounded-[26px] border border-[#E7E3DC] bg-white p-6 sm:p-8 space-y-5 text-center shadow-[0_6px_30px_rgba(0,0,0,0.035)] my-auto">
        {/* 1. Header: Logo (100px x 100px) & Badge */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className="flex items-center justify-center">
            <Logo size="xl" orientation="vertical" />
          </div>

          <span className="inline-block rounded-full bg-[#3a2447]/[0.08] px-3.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-[#3a2447]">
            VERIFICATION
          </span>
        </div>

        {/* 2. Heading & Subtitle */}
        <div className="space-y-1.5 pt-0.5">
          <h1 className="font-display text-2xl sm:text-[26px] font-extrabold text-[#181716] tracking-tight leading-tight">
            Check your email
          </h1>
          <p className="text-xs sm:text-[13px] font-normal text-[#54514D] max-w-sm mx-auto leading-relaxed">
            We sent a 4-digit verification code to{" "}
            <span className="font-semibold text-[#181716]">
              {email || "your email"}
            </span>
          </p>
        </div>

        {/* 4-Digit OTP Input Boxes */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-center gap-2.5 sm:gap-3.5">
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
                className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl border text-center text-xl font-bold transition-all duration-150 outline-none ${errorMessage
                  ? "border-[#ef4444] bg-rose-50/20 text-[#ef4444] ring-2 ring-rose-100"
                  : d
                    ? "border-[#3a2447] bg-white text-[#181716] ring-2 ring-[#3a2447]/15"
                    : "border-[#cbd5e1] bg-[#f8fafc] text-[#181716] focus:border-[#3a2447] focus:bg-white focus:ring-2 focus:ring-[#3a2447]/10"
                  }`}
              />
            ))}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <p className="text-xs font-semibold text-[#ef4444] text-center animate-fade-in pt-1">
              {errorMessage}
            </p>
          )}

          {/* Code Sent Notification Banner */}
          {codeSent && (
            <p className="text-xs font-semibold text-[#3a2447] bg-[#3a2447]/[0.06] border border-[#3a2447]/20 py-1.5 px-3 rounded-xl text-center animate-fade-in">
              New verification code sent 📩
            </p>
          )}
        </div>

        {/* Verify & Continue Button */}
        <button
          type="button"
          disabled={!isOtpComplete || submitting}
          onClick={() => submit(digits.join(""))}
          className={`w-full inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-xs sm:text-sm h-11 transition-all cursor-pointer shadow-xs active:scale-98 ${isOtpComplete && !submitting
            ? "bg-[#3a2447] text-white hover:bg-[#2c1937]"
            : "bg-[#3a2447]/30 text-white/80 cursor-not-allowed"
            }`}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <span>Verify &amp; Continue</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        {/* Resend Countdown Timer */}
        <div className="pt-3 border-t border-[#E7E3DC] text-center text-xs font-medium text-[#54514D]">
          {countdown > 0 ? (
            <p>
              Didn&apos;t receive code? Resend in{" "}
              <span className="font-mono font-bold text-[#3a2447]">
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
                className="font-bold text-[#3a2447] hover:text-[#2c1937] underline cursor-pointer"
              >
                {resending ? "Sending..." : "Resend Code"}
              </button>
            </p>
          )}
        </div>

        {/* Change Email Pill (below didn't receive code and above secure footer) */}
        <div className="pt-0.5 flex items-center justify-center">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#3a2447]/[0.06] px-3.5 py-1 text-xs font-medium text-[#54514D] hover:bg-[#3a2447]/10 hover:text-[#3a2447] transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Change email address</span>
          </button>
        </div>

        {/* Security Footer inside card */}
        <div className="pt-2.5 border-t border-[#E7E3DC]/80">
          <p className="inline-flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#6B5A5D] text-center">
            <Lock className="h-3.5 w-3.5 text-[#6B5A5D]" />
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
