"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Mail, CheckCircle2, Play, Users } from "lucide-react";
import { AuthSplitLayout } from "@/layouts/AuthSplitLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthService } from "@/services/AuthService";
import { useToast } from "@/contexts/ToastContext";

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
      setError("Enter a valid email address");
      return;
    }
    setError("");
    setLoading(true);
    await AuthService.requestOtp(trimmed);
    setLoading(false);
    showToast("Verification OTP sent to your email");
    router.push("/verify-otp");
  }

  return (
    <AuthSplitLayout>
      <div className="space-y-6 text-left">
        {/* Headline & Subtitle */}
        <div className="space-y-1.5">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl leading-tight">
            Create your Inflixo
          </h1>
          <p className="text-sm font-medium text-[#4B5563] leading-snug">
            One beautiful home for everything you create.
          </p>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Trust Badge Above Input */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-[11px] font-bold text-[#803D63]">
            <span>⚡ Password-free login • New here? We’ll set up your profile next.</span>
          </div>

          <Input
            type="email"
            name="email"
            label="Creator Email"
            placeholder="name@gmail.com"
            leftIcon={<Mail className="h-4 w-4 text-slate-400" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            autoFocus
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
            className="bg-[#803D63] text-white font-bold hover:bg-[#6B3252] transition-colors h-12 text-sm rounded-xl cursor-pointer shadow-none"
          >
            Send Secure Code →
          </Button>
        </form>

        {/* Clean Checklist Section */}
        <div className="pt-5 border-t border-[#E5E7EB] space-y-2.5 text-sm font-medium text-gray-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#803D63] shrink-0" />
            <span>Manage your live Total Fanbase</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#803D63] shrink-0" />
            <span>Organize OTT series &amp; episodes</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#803D63] shrink-0" />
            <span>Instant 60-second setup for new creators</span>
          </div>
        </div>

        {/* Compact Mobile Creator Preview (Visible on Mobile only) */}
        <div className="lg:hidden mt-8 pt-4 border-t border-[#E5E7EB]">
          <div className="rounded-2xl bg-[#0F172A] p-4 text-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                  alt="Maya"
                  className="h-9 w-9 rounded-full object-cover border border-white/20"
                />
                <div>
                  <p className="text-xs font-bold text-white">Maya</p>
                  <p className="text-[10px] font-medium text-purple-200">@maya · Travel Creator</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-[#803D63] px-2 py-0.5 rounded-full text-white">
                126K Fanbase
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-800/80 p-2 text-[11px] font-bold">
              <div className="flex items-center gap-1.5">
                <Play className="h-3.5 w-3.5 fill-white text-white" />
                <span>Kashmir Diaries</span>
              </div>
              <span className="text-[10px] text-purple-200 font-medium">S1 · 5 Eps</span>
            </div>
          </div>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
