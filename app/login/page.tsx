"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowRight, Loader2, Check, Zap, Sparkles } from "lucide-react";
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
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-[#f8fafc] px-4 py-8 text-center text-[#181716]">
      <CreatorGridBackground showWordmark />
      {/* Background Inflixo "I" Logo Mark & Radiating Waves */}
      <div className="hidden">
        {/* Top-Left Inflixo "I" Logo Watermark */}
        <div className="absolute -top-12 -left-12 sm:-top-16 sm:-left-16 text-[#151933] opacity-[0.06] -rotate-12">
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
        <div className="absolute -bottom-16 -right-16 sm:-bottom-20 sm:-right-20 text-[#151933] opacity-[0.05] rotate-12">
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
      <div className="relative z-10 my-auto w-full max-w-[430px] rounded-[28px] border border-white/80 bg-white/70 p-5 text-center shadow-[0_26px_90px_rgba(21,25,51,0.12)] backdrop-blur-xl sm:p-7">
        {/* 1. Header: Logo (Vertical: 100px x 100px Icon on top, Inflixo text below) & Creator Greeting */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center">
            <Logo size="xl" orientation="vertical" />
          </div>

          <div className="mt-5 w-full">
            <div className="rounded-[18px] border border-[#151933]/10 bg-[#151933]/[0.035] px-4 py-4 text-center shadow-inner shadow-white/70">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#151933] shadow-sm">
                <Sparkles className="h-3 w-3" />
                Creator first
              </div>
              <p className="text-[13px] font-extrabold text-[#151933]">
                Your old videos can still find new fans.
              </p>
              <p className="mx-auto mt-1.5 max-w-[310px] text-[12px] font-medium leading-relaxed text-[#5d6575]">
                Save your YouTube, Instagram and Facebook video links as clean series that fans can open anytime.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Creator-focused Headline & Subtitle */}
        <div className="mt-8 space-y-2">
          <h1 className="font-display text-[28px] font-black leading-[1.05] tracking-tight text-[#181716] sm:text-[32px]">
            Build your creator link
          </h1>
          <p className="mx-auto max-w-[350px] text-[13px] font-medium leading-relaxed text-[#5d6575] sm:text-sm">
            Organize your uploaded video links into playlists, show your fanbase, and look ready for brands.
          </p>
        </div>

        {/* 3. Trust Pill */}
        <div className="mx-auto mt-5 flex w-fit items-center justify-center gap-1.5 rounded-full bg-[#151933]/[0.07] px-4 py-1.5 text-xs font-bold text-[#54514D]">
          <Zap className="h-3.5 w-3.5 text-[#151933] fill-[#151933] shrink-0" />
          <span>No password • OTP login • Under 60 seconds</span>
        </div>

        {/* 4. Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-3.5 text-left">
          <div className="w-full space-y-2">
            <label
              htmlFor="creator-email-input"
              className="block text-xs font-bold text-[#54514D]"
            >
              Creator email address
            </label>

            <div
              className={`flex h-12 items-center rounded-[14px] border px-3.5 bg-[#f8fafc] transition-all duration-200 focus-within:border-[#151933] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#151933]/10 ${error
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
                className="h-full w-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#181716] outline-none placeholder:text-[#94a3b8]"
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
            className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-[#151933] text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(21,25,51,0.18)] transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-[0_18px_34px_rgba(21,25,51,0.22)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:translate-y-0"
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
        <div className="mt-7 space-y-3 border-t border-[#E7E3DC] pt-4 text-left">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#151933]/10 text-[#151933]">
              <Check className="h-3 w-3 stroke-[2.5]" />
            </span>
            <span className="text-[13px] font-semibold text-[#54514D]">
              Turn uploaded videos into neat series
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#151933]/10 text-[#151933]">
              <Check className="h-3 w-3 stroke-[2.5]" />
            </span>
            <span className="text-[13px] font-semibold text-[#54514D]">
              Show Instagram, Facebook and YouTube audience
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#151933]/10 text-[#151933]">
              <Check className="h-3 w-3 stroke-[2.5]" />
            </span>
            <span className="text-[13px] font-semibold text-[#54514D]">
              Add collab packages, rate cards and links
            </span>
          </div>
        </div>

        {/* 6. Legal Text Inside Single Card */}
        <div className="mt-5 border-t border-[#E7E3DC]/80 pt-4">
          <p className="text-[11px] font-medium text-[#6B5A5D] text-center leading-relaxed">
            By continuing, you agree to Inflixo&apos;s{" "}
            <Link href="/terms" className="text-[#151933] underline hover:text-brand-hover font-medium">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-[#151933] underline hover:text-brand-hover font-medium">
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
