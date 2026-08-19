"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { AdminService } from "@/services/AdminService";
import { Logo } from "@/components/shared/Logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (AdminService.isLoggedIn()) {
      router.replace("/admin/dashboard");
    }
  }, [router]);

  function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    setTimeout(() => {
      const success = AdminService.login(email, password);
      if (success) {
        router.push("/admin/dashboard");
      } else {
        setError("Email or password is incorrect.");
        setSubmitting(false);
      }
    }, 350);
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#FAFAFC] px-4 py-8 text-[#0F172A] selection:bg-purple-100 selection:text-[#6C2BFF] relative overflow-hidden">
      {/* Very subtle purple radial background glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(108,43,255,0.06)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-[460px] space-y-6">
        {/* 1. BRAND HEADER */}
        <div className="flex flex-col items-center text-center space-y-2">
          {/* Logo + Subtle ADMIN Pill */}
          <div className="flex items-center justify-center gap-2">
            <Logo size="md" />
            <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-[#6C2BFF] border border-purple-100/80">
              ADMIN
            </span>
          </div>

          <div className="space-y-0.5 pt-1">
            <h1 className="font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Admin Portal
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage Inflixo platform operations.
            </p>
          </div>
        </div>

        {/* 2. LOGIN CARD */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm shadow-slate-200/50 space-y-6 text-left">
          <div className="space-y-1">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Welcome back
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Sign in to continue to Inflixo Admin.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs font-semibold text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* 3. EMAIL FIELD */}
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="block text-xs font-bold text-slate-700">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@inflixo.com"
                  className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm font-semibold text-slate-900 placeholder-slate-400 transition-all focus:border-[#6C2BFF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6C2BFF]/20"
                />
              </div>
            </div>

            {/* 4. PASSWORD FIELD */}
            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-xs font-bold text-slate-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-10 pr-10 text-sm font-semibold text-slate-900 placeholder-slate-400 transition-all focus:border-[#6C2BFF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6C2BFF]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* 5. SIGN IN BUTTON */}
            <button
              type="submit"
              disabled={submitting}
              className="tap-scale h-13 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6C2BFF] hover:bg-[#581cdb] text-sm font-bold text-white shadow-sm transition-all disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </>
              )}
            </button>

            {/* 6. SECURITY MESSAGE */}
            <div className="pt-1 text-center">
              <p className="text-xs font-medium text-slate-400">
                🔒 Authorized access only
              </p>
            </div>
          </form>
        </div>

        {/* 7. FOOTER */}
        <div className="text-center pt-2">
          <p className="text-xs text-slate-400 font-medium">
            © 2026 Inflixo · TrustIQ Labs
          </p>
        </div>
      </div>
    </div>
  );
}
