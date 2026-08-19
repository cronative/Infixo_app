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
const COUNTDOWN_SECONDS = 28;

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
    }, 150);
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

      if (isExistingProfile || onboardingStep === "finish") {
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
        {/* Back Button */}
        <div>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-[#651FFF] transition-colors cursor-pointer"
            aria-label="Back to login"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Heading & Email Description */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-[#0F172A]">
              Check your email
            </h1>
            <Mail className="h-6 w-6 text-[#651FFF] shrink-0" />
          </div>

          <div className="text-sm font-medium text-[#475569]">
            <p>We sent a 4-digit code to</p>
            <p className="font-bold text-[#0F172A] mt-0.5 truncate">{email || "your email"}</p>
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
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                aria-label={`Digit ${i + 1}`}
                className={`h-14 w-14 sm:h-16 sm:w-16 rounded-2xl border text-center text-2xl font-black text-[#0F172A] bg-white shadow-xs outline-none transition-all duration-150 ${
                  errorMessage
                    ? "border-red-400 bg-red-50/20 text-red-600"
                    : d
                    ? "border-[#651FFF] ring-2 ring-purple-500/20 bg-purple-50/30"
                    : "border-slate-200 focus:border-[#651FFF] focus:ring-4 focus:ring-purple-500/15"
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
          className={`font-bold transition-all py-3.5 text-sm rounded-full cursor-pointer ${
            isOtpComplete && !submitting
              ? "bg-[#651FFF] text-white shadow-md shadow-purple-600/20 hover:bg-[#500CD6] hover:scale-[1.01]"
              : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
          }`}
        >
          {submitting ? "Verifying..." : "Verify & Continue →"}
        </Button>

        {/* Resend Code Section */}
        <div className="text-center text-xs font-semibold text-slate-500">
          {countdown > 0 ? (
            <p>
              Didn&apos;t get it? Resend in{" "}
              <span className="font-mono font-bold text-slate-700">
                00:{countdown.toString().padStart(2, "0")}
              </span>
            </p>
          ) : (
            <p>
              Didn&apos;t get it?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="font-bold text-[#651FFF] hover:underline cursor-pointer"
              >
                {resending ? "Sending..." : "Resend code"}
              </button>
            </p>
          )}
        </div>

        {/* Muted Security Badge */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            <span>Secure password-free sign in</span>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
