"use client";

import { useEffect, useRef, useState, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AuthSplitLayout } from "@/layouts/AuthSplitLayout";
import { Button } from "@/components/ui/Button";
import { AuthService } from "@/services/AuthService";
import { OnboardingService } from "@/services/OnboardingService";
import { useToast } from "@/contexts/ToastContext";

const OTP_LENGTH = 4;
const COUNTDOWN_SECONDS = 30;

export default function VerifyOtpPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const pending = AuthService.getPendingEmail();
    if (!pending) {
      router.replace("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
    setEmail(pending);
  }, [router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const submit = async (code: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { isExistingProfile, onboardingStep } = await AuthService.verifyOtp(code);
      setSubmitting(false);

      if (isExistingProfile || onboardingStep === "finish") {
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
        showToast(`Email verified! Resuming setup at ${onboardingStep} ✨`);
        router.push(targetRoute);
      }
    } catch (err: any) {
      setSubmitting(false);
      showToast(err.message || "OTP verification failed", "error");
    }
  };

  function handleChange(index: number, value: string) {
    const clean = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
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
    const lastIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
    inputsRef.current[lastIndex]?.focus();
    if (pasted.length === OTP_LENGTH) submit(pasted);
  }

  function handleResend() {
    setCountdown(COUNTDOWN_SECONDS);
    setDigits(Array(OTP_LENGTH).fill(""));
    inputsRef.current[0]?.focus();
    showToast("A new 4-digit code was sent", "info");
  }

  return (
    <AuthSplitLayout>
      <button
        onClick={() => router.push("/login")}
        className="mb-6 flex h-9 w-9 items-center justify-center rounded-full border border-inflixo-border text-inflixo-navy hover:bg-surface-muted"
        aria-label="Back"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <h1 className="font-display text-3xl font-medium tracking-tight text-inflixo-navy sm:text-[36px]">
        Check your inbox
      </h1>
      <p className="mt-2 text-[15px] text-muted">
        We sent a temporary 4-digit code to <span className="font-semibold text-inflixo-navy">{email || "your email"}</span>.
      </p>

      <div className="mt-8 flex justify-center gap-3 sm:gap-4">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className="h-16 w-16 rounded-2xl border-2 border-inflixo-border bg-white text-center text-2xl font-black text-inflixo-navy shadow-sm outline-none transition-all focus:border-inflixo-purple focus:shadow-[0_0_0_4px_rgba(109,40,217,0.15)]"
          />
        ))}
      </div>

      <Button
        fullWidth
        size="lg"
        className="mt-6"
        loading={submitting}
        disabled={digits.some((d) => !d)}
        onClick={() => submit(digits.join(""))}
      >
        Submit
      </Button>

      <div className="mt-6 text-center">
        {countdown > 0 ? (
          <p className="text-sm text-muted">
            Resend code in <span className="font-semibold text-inflixo-navy">0:{countdown.toString().padStart(2, "0")}</span>
          </p>
        ) : (
          <button onClick={handleResend} className="text-sm font-semibold text-inflixo-purple hover:text-inflixo-purple-dark">
            Resend Code
          </button>
        )}
      </div>
    </AuthSplitLayout>
  );
}
