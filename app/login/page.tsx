"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Sparkles, ArrowRight, Loader2, Check } from "lucide-react";
import { AuthService } from "@/services/AuthService";
import { useToast } from "@/contexts/ToastContext";
import { Logo } from "@/components/shared/Logo";

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
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-[#fbfbfb] px-4 py-8 text-center text-[#241618] overflow-hidden">
      {/* Subtle Ambient Warmth */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-80 bg-[radial-gradient(ellipse_at_top,#fbfbfb_0%,transparent_70%)] blur-2xl" />

      <div className="relative z-10 w-full max-w-[440px] space-y-6">
        {/* 1. Header Branding (Stagger 1 & 2) */}
        <div className="flex flex-col items-center text-center space-y-2 animate-fade-up [animation-delay:0.05s]">
          <div className="flex items-center justify-center gap-2">
            <Logo size="md" />
            <span className="rounded-full bg-[#f3dde057] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#8C3F4D]">
              CREATOR
            </span>
          </div>

          <div className="space-y-1 pt-1 animate-fade-up [animation-delay:0.15s]">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#241618] tracking-tight">
              Claim your Inflixo
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#6B5A5D] max-w-xs mx-auto leading-relaxed">
              One link for your content, fanbase &amp; original series.
            </p>
          </div>
        </div>

        {/* 2. Main Centered Login Card (Stagger 3) */}
        <div className="rounded-[18px] border border-[#E4DAD5] bg-[#FFFFFF] p-6 sm:p-8 space-y-5 text-left animate-fade-up [animation-delay:0.25s]">
          {/* Trust Pill */}
          <div className="flex items-center gap-1.5 rounded-full bg-[#f3dde057] px-3 py-1 text-[11px] font-semibold text-[#8C3F4D]">
            <Sparkles className="h-3 w-3 text-[#B85C6B] shrink-0" />
            <span>Password-free login • Fast 60s setup</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="w-full text-left space-y-1.5">
              <label
                htmlFor="creator-email-input"
                className="block text-xs font-semibold text-[#6B5A5D]"
              >
                Creator email address
              </label>

              <div
                className={`flex h-11 items-center rounded-[10px] border px-3.5 bg-[#FFFFFF] transition-all duration-200 focus-within:border-[#B85C6B] focus-within:ring-3 focus-within:ring-[#f3dde057] ${error
                  ? "border-[#C1443A] bg-[#fbfbfb]"
                  : "border-[#E4DAD5]"
                  } ${isShaking ? "animate-shake" : ""}`}
              >
                <Mail className="mr-2.5 h-4 w-4 shrink-0 text-[#6B5A5D]" />
                <input
                  id="creator-email-input"
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={email}
                  disabled={loading}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  autoFocus
                  className="h-full w-full min-w-0 flex-1 bg-transparent text-xs sm:text-sm font-medium text-[#241618] outline-none placeholder:text-[#6B5A5D]/60"
                />
              </div>

              {error && (
                <p className="text-xs font-semibold text-[#C1443A] pt-0.5 animate-fade-in">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#B85C6B] hover:bg-[#8C3F4D] text-[#fbfbfb] font-semibold text-xs sm:text-sm h-11 transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed active:scale-98"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Feature Highlights List (Stagger 4, 5, 6) */}
          <div className="pt-5 border-t border-[#E4DAD5] space-y-2.5 text-xs font-medium text-[#6B5A5D]">
            <div className="flex items-center gap-2.5 animate-fade-up [animation-delay:0.35s]">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#B85C6B] text-[#fbfbfb] shrink-0">
                <Check className="h-2.5 w-2.5 stroke-[3]" />
              </span>
              <span className="text-[#241618]">Unified fanbase reach across platforms</span>
            </div>
            <div className="flex items-center gap-2.5 animate-fade-up [animation-delay:0.45s]">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#B85C6B] text-[#fbfbfb] shrink-0">
                <Check className="h-2.5 w-2.5 stroke-[3]" />
              </span>
              <span className="text-[#241618]">Bingeable OTT-style series</span>
            </div>
            <div className="flex items-center gap-2.5 animate-fade-up [animation-delay:0.55s]">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#B85C6B] text-[#fbfbfb] shrink-0">
                <Check className="h-2.5 w-2.5 stroke-[3]" />
              </span>
              <span className="text-[#241618]">Rate cards &amp; brand briefs, built in</span>
            </div>
          </div>
        </div>

        {/* 3. Footer Links */}
        <p className="text-[11px] font-medium text-[#6B5A5D] text-center leading-relaxed px-4 animate-fade-up [animation-delay:0.65s]">
          By continuing, you agree to Inflixo&apos;s{" "}
          <Link href="/terms" className="underline hover:text-[#241618] font-semibold">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-[#241618] font-semibold">
            Privacy Policy
          </Link>
          .
        </p>
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
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-up {
          animation: fadeUp 0.55s ease forwards;
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
          .animate-fade-up,
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
