"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowRight, Loader2, Sparkles, Zap } from "lucide-react";
import { AuthService } from "@/services/AuthService";
import { useToast } from "@/contexts/ToastContext";
import { Logo } from "@/components/shared/Logo";
import { CreatorGridBackground } from "@/components/shared/CreatorGridBackground";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

    if (!validEmail) {
      setError("Please enter a valid email address");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 350);
      return;
    }

    setError("");
    setLoading(true);

    try {
      await AuthService.requestOtp(trimmed);
      setLoading(false);
      showToast("Verification code sent! 📩");
      router.push("/verify-otp");
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to send verification code. Please try again.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 350);
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-[#f8fafc] px-4 py-6 sm:py-10 text-[#181716]">
      <CreatorGridBackground showWordmark />

      {/* UNIFIED CENTER CARD: EXACT 420px WIDTH & MATCHING FIXED HEIGHT FOR BOTH SCREENS */}
      <div className="relative z-10 my-auto flex min-h-[530px] w-full max-w-[420px] flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white/95 p-5 text-center shadow-[0_20px_60px_-15px_rgba(4,48,132,0.12)] backdrop-blur-xl transition-all sm:min-h-[550px] sm:p-6">
        
        {/* TOP BLOCK: Header & Trust Badge */}
        <div>
          {/* 1. Header: Logo & Badge */}
          <div className="flex flex-col items-center text-center">
            <Logo size="lg" orientation="vertical" />
            <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#043084]/[0.07] px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-[#043084]">
              <Sparkles className="h-3 w-3" />
              <span>Creator Studio</span>
            </div>
          </div>

          {/* 2. Creator-Focused Punchy Headline & Subtitle */}
          <div className="mt-3.5 space-y-1">
            <h1 className="font-display text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              Sign in or Sign up
            </h1>
            <p className="mx-auto max-w-[340px] text-xs font-medium leading-relaxed text-slate-500 sm:text-[13px]">
              Your video series, total fanbase &amp; brand rate cards in one clean link.
            </p>
          </div>

          {/* 3. Passwordless Trust Pill */}
          <div className="mx-auto mt-3 flex w-fit items-center justify-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
            <Zap className="h-3 w-3 fill-[#043084] text-[#043084]" />
            <span>Passwordless • 4-digit OTP • Instant access</span>
          </div>
        </div>

        {/* MIDDLE BLOCK: Form & Creator Micro-Chips */}
        <div className="my-auto py-2">
          {/* 4. Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5 text-left">
            <div className="w-full space-y-1">
              <label
                htmlFor="creator-email-input"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
              >
                Creator Email
              </label>

              <div
                className={`flex h-11.5 items-center rounded-xl border bg-slate-50/80 px-3.5 transition-all duration-150 focus-within:border-[#043084] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#043084]/10 ${
                  error ? "border-rose-500 bg-rose-50/30" : "border-slate-300"
                } ${isShaking ? "animate-shake" : ""}`}
              >
                <Mail className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
                <input
                  id="creator-email-input"
                  type="email"
                  name="email"
                  placeholder="yourname@gmail.com"
                  value={email}
                  disabled={loading}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  autoFocus
                  autoComplete="email"
                  className="h-full w-full min-w-0 flex-1 bg-transparent text-base font-semibold text-slate-900 outline-none placeholder:text-slate-400 sm:text-sm"
                />
              </div>

              {error && (
                <p className="animate-fade-in pt-0.5 text-xs font-semibold text-rose-500">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="tap-scale flex h-11.5 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#043084] text-sm font-bold text-white shadow-md shadow-[#043084]/20 transition-all hover:bg-[#032363] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending code...</span>
                </>
              ) : (
                <>
                  <span>Get Login Code</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* 5. Creator Micro-Badges (Tight, minimal 1-row layout) */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100/90 px-2.5 py-1 text-slate-600">
              🎬 Video Series
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100/90 px-2.5 py-1 text-slate-600">
              📈 Total Fanbase
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100/90 px-2.5 py-1 text-slate-600">
              💼 Rate Cards
            </span>
          </div>
        </div>

        {/* BOTTOM BLOCK: Legal Text */}
        <div className="border-t border-slate-100 pt-3">
          <p className="text-center text-[11px] font-medium text-slate-400">
            By continuing, you agree to Inflixo&apos;s{" "}
            <Link href="/terms" className="text-slate-600 underline hover:text-[#043084]">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-slate-600 underline hover:text-[#043084]">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.32s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-shake,
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
