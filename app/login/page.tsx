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
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-[#FAF9F6] px-4 py-8 text-center text-[#181716] overflow-hidden">
      {/* Subtle Ambient Background Light */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-80 bg-gradient-radial from-[#F5F3ED] to-transparent blur-3xl" />

      <div className="relative z-10 w-full max-w-[440px] space-y-6">
        {/* 1. Header Branding */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Logo size="md" />
            <span className="rounded-full bg-[#803D63]/[0.09] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#803D63] border border-[#803D63]/20">
              CREATOR
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#181716] tracking-tight">
              Create your Inflixo
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#54514D] max-w-xs mx-auto leading-relaxed">
              One link for your content, fanbase &amp; original series.
            </p>
          </div>
        </div>

        {/* 2. Main Centered Login Card */}
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-7 sm:p-8 shadow-xs space-y-5 text-left">
          {/* Trust Pill */}
          <div className="flex items-center gap-1.5 rounded-full bg-[#803D63]/[0.09] border border-[#803D63]/20 px-3 py-1 text-[11px] font-semibold text-[#803D63]">
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
              leftIcon={<Mail className="h-4 w-4 text-[#797570]" />}
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
              className="bg-[#803D63] text-white font-bold hover:bg-[#6F3456] transition-all h-11 text-xs sm:text-sm rounded-xl cursor-pointer shadow-xs"
            >
              <span>Send Verification Code</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </form>

          {/* Feature Highlights List */}
          <div className="pt-4 border-t border-[#E7E3DC] space-y-2 text-xs font-medium text-[#54514D]">
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
        <p className="text-[11px] font-medium text-[#797570] text-center leading-relaxed px-4">
          By continuing, you agree to Inflixo&apos;s{" "}
          <Link href="/terms" className="underline hover:text-[#181716] font-semibold">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-[#181716] font-semibold">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
