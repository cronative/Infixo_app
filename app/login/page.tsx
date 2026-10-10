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

  // Prefill email if returning from OTP screen via "Edit"
  useState(() => {
    if (typeof window !== "undefined") {
      const pending = AuthService.getPendingEmail();
      if (pending) setEmail(pending);
    }
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      setError("Enter your email");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 350);
      return;
    }

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
      router.push(`/verify-otp?email=${encodeURIComponent(trimmed)}`);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to send verification code. Please try again.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 350);
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-[#FFFCFB] px-4 py-6 sm:py-10 text-[#18181B] font-sans">
      {/* Background with warm grid, watermark removed to prevent cut-off */}
      <CreatorGridBackground showWordmark={false} />

      {/* UNIFIED CENTER CARD: EXACT 420px WIDTH & 24px CORNER RADIUS */}
      <div className="relative z-10 my-auto flex min-h-[530px] w-full max-w-[420px] flex-col justify-between rounded-[24px] border border-[#E4E4E7] bg-white/95 p-6 text-center shadow-[0_20px_60px_-15px_rgba(122,34,83,0.1)] backdrop-blur-xl transition-all sm:min-h-[560px]">
        
        {/* TOP BLOCK: Header & Trust Badge */}
        <div>
          {/* 1. Header: Logo & Badge */}
          <div className="flex flex-col items-center text-center">
            <Logo size="lg" orientation="vertical" />
            <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#F7EDEF] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#7A2253]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Creator Studio</span>
            </div>
          </div>

          {/* 2. Headline & Subtitle */}
          <div className="mt-4 space-y-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#18181B] sm:text-[26px]">
              Sign in or Sign up
            </h1>
            <p className="mx-auto max-w-[340px] text-xs font-medium leading-relaxed text-[#52525B] sm:text-sm">
              Your videos, in order. Like a show.
            </p>
          </div>

          {/* 3. Passwordless Trust Pill (min 12px font) */}
          <div className="mx-auto mt-3.5 flex w-fit items-center justify-center gap-1.5 rounded-full bg-zinc-100 px-3.5 py-1 text-xs font-semibold text-[#52525B]">
            <Zap className="h-3.5 w-3.5 fill-[#7A2253] text-[#7A2253]" />
            <span>Passwordless • 4-digit OTP • Instant access</span>
          </div>
        </div>

        {/* MIDDLE BLOCK: Form, Google Sign-in & Creator Micro-Chips */}
        <div className="my-auto py-2">
          {/* 4. Form with noValidate to prevent browser error tooltips */}
          <form onSubmit={handleSubmit} noValidate className="space-y-3 text-left">
            <div className="w-full space-y-1.5">
              <label
                htmlFor="creator-email-input"
                className="block text-xs font-bold text-[#52525B]"
              >
                Creator Email
              </label>

              <div
                className={`flex h-11 items-center rounded-xl border bg-white px-3.5 transition-all duration-150 focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/15 ${
                  error ? "border-rose-500 bg-rose-50/20" : "border-[#E4E4E7]"
                } ${isShaking ? "animate-shake" : ""}`}
              >
                <Mail className="mr-2.5 h-4 w-4 shrink-0 text-[#71717A]" />
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
                  className="h-full w-full min-w-0 flex-1 bg-transparent text-sm font-medium text-[#18181B] outline-none placeholder:text-[#71717A]"
                />
              </div>

              {error && (
                <p role="alert" aria-live="assertive" className="animate-fade-in pt-0.5 text-xs font-semibold text-rose-500">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="tap-scale flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#7A2253] hover:bg-[#631841] text-sm font-bold text-white shadow-md shadow-[#7A2253]/25 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Usually arrives in a few seconds...</span>
                </>
              ) : (
                <>
                  <span>Get Login Code</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Google Sign-in Option temporarily hidden as requested */}
          {/*
          <div className="relative my-3 flex items-center justify-center">
            <div className="w-full border-t border-[#E4E4E7]" />
            <span className="absolute bg-white px-2 text-[12px] font-medium text-[#71717A]">or</span>
          </div>

          <button
            type="button"
            onClick={() => showToast("Google Sign-in is coming soon! Use OTP for instant access. 🚀")}
            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-[#E4E4E7] bg-white text-sm font-bold text-[#18181B] shadow-xs transition-colors hover:bg-zinc-50 hover:border-zinc-300"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>
          */}

          {/* 5. Creator Micro-Badges: Shipped features only (Video Series, Shop, Rate Cards) */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-xs font-semibold text-[#52525B]">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#E4E4E7] bg-zinc-50 px-3 py-1">
              🎬 Video Series
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#E4E4E7] bg-zinc-50 px-3 py-1">
              🛍️ Shop
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#E4E4E7] bg-zinc-50 px-3 py-1">
              💼 Rate Cards
            </span>
          </div>
        </div>

        {/* BOTTOM BLOCK: Legal Text (min 12px) */}
        <div className="border-t border-[#E4E4E7] pt-3.5">
          <p className="text-center text-xs font-medium text-[#71717A]">
            By continuing, you agree to Inflixo&apos;s{" "}
            <Link href="/terms" className="text-[#52525B] underline hover:text-[#7A2253]">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-[#52525B] underline hover:text-[#7A2253]">
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
