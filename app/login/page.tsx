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
        {/* Heading */}
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-black tracking-tight text-[#0F172A] sm:text-4xl">
            Create your Inflixo.
          </h1>
          <p className="text-base font-bold text-slate-800">
            Your content. Your fanbase. <span className="text-[#651FFF]">One link.</span>
          </p>
          <p className="text-xs font-medium text-slate-500">
            One beautiful home for everything you create.
          </p>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <Input
            type="email"
            name="email"
            placeholder="Enter your email"
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
            className="bg-[#651FFF] text-white font-bold shadow-md shadow-purple-600/20 hover:bg-[#500CD6] hover:scale-[1.01] active:scale-[0.99] transition-all py-3.5 text-sm rounded-full cursor-pointer"
          >
            Continue with email →
          </Button>

          <p className="text-[11px] text-center font-medium text-slate-400">
            No password needed. We&apos;ll email you a secure code.
          </p>
        </form>

        {/* Short Benefit Checklist */}
        <div className="pt-5 border-t border-slate-100 space-y-2.5 text-xs font-bold text-slate-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>One link for everything</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Show your total fanbase</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Turn your content into Series</span>
          </div>
        </div>

        {/* Compact Mobile Creator Preview (Visible on Mobile only) */}
        <div className="lg:hidden mt-8 pt-4 border-t border-slate-100">
          <div className="rounded-2xl bg-gradient-to-br from-[#651FFF] to-[#500CD6] p-4 text-white space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                  alt="Maya"
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-white/30"
                />
                <div>
                  <p className="text-xs font-black text-white">Maya</p>
                  <p className="text-[10px] font-medium text-purple-200">@maya · Travel Creator</p>
                </div>
              </div>
              <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full text-white backdrop-blur-xs">
                126K Total Fanbase
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white/10 p-2 text-[11px] font-bold backdrop-blur-xs">
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
