"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthService } from "@/services/AuthService";
import { useToast } from "@/contexts/ToastContext";
import { Logo } from "@/components/shared/Logo";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!validEmail) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await AuthService.requestOtp(trimmed);
      setLoading(false);
      showToast("Verification OTP sent to your email! 📩");
      router.push("/verify-otp");
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to send verification code. Please try again.");
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#F6EBF1]/60 via-slate-50 to-white px-4 py-8 text-center text-slate-900 overflow-hidden">
      {/* Ambient Maroon Background Glow Orbs */}
      <div className="pointer-events-none absolute -top-24 -left-20 h-96 w-96 rounded-full bg-[#803D63]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl" />

      <div className="relative z-10 w-full max-w-[460px] space-y-6">
        {/* 1. Header Branding */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Logo size="md" />
            <span className="rounded-full bg-[#F6EBF1] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#803D63] border border-[#E8DCE4]">
              CREATOR
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Create your Inflixo
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-xs mx-auto leading-relaxed">
              One link for your content, fanbase &amp; original series.
            </p>
          </div>
        </div>

        {/* 2. Main Centered Login Card */}
        <div className="rounded-[32px] border border-[#E8DCE4] bg-white/95 p-7 sm:p-9 shadow-2xl shadow-[#803D63]/5 backdrop-blur-xl space-y-5 text-left">
          {/* Trust Pill */}
          <div className="flex items-center gap-1.5 rounded-full bg-[#F6EBF1] border border-[#E8DCE4] px-3 py-1 text-[11px] font-bold text-[#803D63]">
            <Sparkles className="h-3 w-3 text-[#803D63] shrink-0" />
            <span>Password-free login • Fast 60s setup</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              name="email"
              label="Creator Email Address"
              placeholder="name@example.com"
              leftIcon={<Mail className="h-4 w-4 text-slate-400" />}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              error={error}
              autoFocus
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              className="bg-[#803D63] text-white font-bold hover:bg-[#6D3254] transition-all h-12 text-xs sm:text-sm rounded-2xl cursor-pointer shadow-md shadow-[#803D63]/20 hover:scale-[1.01]"
            >
              <span>Send Verification Code</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </form>

          {/* Feature Highlights List */}
          <div className="pt-4 border-t border-[#E8DCE4]/60 space-y-2 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#803D63] shrink-0" />
              <span>Unified Live Total Fanbase Reach</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#803D63] shrink-0" />
              <span>Binge-worthy OTT Series &amp; Episode player</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#803D63] shrink-0" />
              <span>Sponsorship rate cards &amp; brand collaboration briefs</span>
            </div>
          </div>
        </div>

        {/* 3. Footer Links */}
        <p className="text-[11px] font-medium text-slate-400 text-center leading-relaxed px-4">
          By continuing, you agree to Inflixo&apos;s{" "}
          <Link href="/terms" className="underline hover:text-slate-600 font-semibold">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-slate-600 font-semibold">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
