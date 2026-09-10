"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowRight, Loader2, Check, Zap } from "lucide-react";
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

      {/* SINGLE UNIFIED WHITE CARD: Everything from Logo to Legal Text inside */}
      <div className="relative z-10 w-full max-w-[450px] rounded-[26px] border border-[#E7E3DC] bg-white p-6 sm:p-8 space-y-5 text-center shadow-[0_6px_30px_rgba(0,0,0,0.035)] my-auto">
        {/* 1. Header: Logo (Vertical: 100px x 100px Icon on top, Inflixo text below) & Creator Greeting */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className="flex items-center justify-center">
            <Logo size="xl" orientation="vertical" />
          </div>

          <div className="pt-1 w-full">
            <div className="rounded-2xl bg-[#3a2447]/[0.05] border border-[#3a2447]/10 p-3 sm:p-3.5 text-center space-y-1.5">
              <p className="text-xs sm:text-[13px] font-bold text-[#3a2447]">
                👋 Hello, Creator!
              </p>
              <p className="text-xs font-medium text-[#181716] leading-relaxed">
                Thank you for creating, inspiring, and entertaining every day. ❤️
              </p>
              <p className="text-[11px] font-normal text-[#54514D] leading-relaxed">
                Together, we’ll grow India’s content creation industry and build something bigger for every creator. 🇮🇳
              </p>
            </div>
          </div>
        </div>

        {/* 2. Creator-focused Headline & Subtitle */}
        <div className="space-y-1.5 pt-0.5">
          <h1 className="font-display text-2xl sm:text-[26px] font-extrabold text-[#181716] tracking-tight leading-tight">
            Your creator profile starts here
          </h1>
          <p className="text-xs sm:text-[13px] font-normal text-[#54514D] max-w-sm mx-auto leading-relaxed">
            Showcase your audience, content and brand collaborations in one professional public profile.
          </p>
        </div>

        {/* 3. Trust Pill */}
        <div className="flex items-center justify-center gap-1.5 rounded-full bg-[#3a2447]/[0.06] px-3.5 py-1 text-xs font-medium text-[#54514D] mx-auto w-fit">
          <Zap className="h-3.5 w-3.5 text-[#3a2447] fill-[#3a2447] shrink-0" />
          <span>Password-free login • Under 60 seconds</span>
        </div>

        {/* 4. Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-0.5 text-left">
          <div className="w-full space-y-1.5">
            <label
              htmlFor="creator-email-input"
              className="block text-xs font-semibold text-[#54514D]"
            >
              Creator email address
            </label>

            <div
              className={`flex h-11 items-center rounded-xl border px-3.5 bg-[#f8fafc] transition-all duration-200 focus-within:border-[#3a2447] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#3a2447]/10 ${error
                ? "border-[#ef4444] bg-rose-50/20"
                : "border-[#cbd5e1]"
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
                className="h-full w-full min-w-0 flex-1 bg-transparent text-xs sm:text-sm font-medium text-[#181716] outline-none placeholder:text-[#94a3b8]"
              />
            </div>

            {error && (
              <p className="text-xs font-semibold text-[#ef4444] pt-0.5 animate-fade-in">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#3a2447] hover:bg-[#2c1937] text-white font-semibold text-xs sm:text-sm h-11 transition-all cursor-pointer shadow-xs disabled:opacity-75 disabled:cursor-not-allowed active:scale-98"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>Continue with Email</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* 5. 3 Benefit Checkpoints */}
        <div className="pt-3 border-t border-[#E7E3DC] space-y-2 text-left">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3a2447]/10 text-[#3a2447] shrink-0">
              <Check className="h-3 w-3 stroke-[2.5]" />
            </span>
            <span className="text-xs font-medium text-[#54514D]">
              Instagram/Facebook follower counts
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3a2447]/10 text-[#3a2447] shrink-0">
              <Check className="h-3 w-3 stroke-[2.5]" />
            </span>
            <span className="text-xs font-medium text-[#54514D]">
              YouTube subscriber count
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3a2447]/10 text-[#3a2447] shrink-0">
              <Check className="h-3 w-3 stroke-[2.5]" />
            </span>
            <span className="text-xs font-medium text-[#54514D]">
              Series, packages aur rate cards
            </span>
          </div>
        </div>

        {/* 6. Legal Text Inside Single Card */}
        <div className="pt-2.5 border-t border-[#E7E3DC]/80">
          <p className="text-[11px] font-medium text-[#6B5A5D] text-center leading-relaxed">
            By continuing, you agree to Inflixo&apos;s{" "}
            <Link href="/terms" className="text-[#3a2447] underline hover:text-[#2c1937] font-medium">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-[#3a2447] underline hover:text-[#2c1937] font-medium">
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
