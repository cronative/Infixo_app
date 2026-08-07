"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, Check, LogOut } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { ProgressSteps } from "@/components/onboarding/ProgressSteps";
import { OnboardingStep } from "@/types";
import { storage, STORAGE_KEYS } from "@/utils/storage";
import { AuthService } from "@/services/AuthService";
import { useToast } from "@/contexts/ToastContext";

const PRODUCT_TAGLINES = [
  "✨ The ultimate link-in-bio platform built for modern creators",
  "🎬 Showcase your OTT video series with seasons & episodes",
  "📈 Combine all your social stats into one powerful reach number",
  "👑 Customize your public page with stunning creator themes",
  "🚀 Share your single link across Instagram, YouTube & TikTok",
  "📊 Track your total combined audience growth in real time",
];

function TaglineRotator() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prevIndex) => (prevIndex + 1) % PRODUCT_TAGLINES.length);
        setVisible(true);
      }, 250);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center overflow-hidden px-2 text-center min-h-[24px]">
      <p
        className={`text-xs sm:text-sm font-bold text-inflixo-purple-dark transition-all duration-300 transform ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        }`}
      >
        {PRODUCT_TAGLINES[index]}
      </p>
    </div>
  );
}

export function OnboardingLayout({
  step,
  children,
  preview,
  footer,
  fullWidth = false,
}: {
  step: OnboardingStep;
  children: ReactNode;
  preview?: ReactNode;
  footer?: ReactNode;
  fullWidth?: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const isFullWidthStep = fullWidth || !preview;

  useEffect(() => {
    const pendingEmail = storage.get<string>(STORAGE_KEYS.otpEmail, "");
    if (pendingEmail) setEmail(pendingEmail);
  }, []);

  function handleSaveAndLogout() {
    AuthService.logout();
    showToast("Your progress is saved safely! See you soon 👋");
    router.push("/login");
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Header section with Top Navbar + Verified OTP Email Badge + Step Navigation */}
      <header className="sticky top-0 z-30 border-b border-inflixo-border bg-white/95 backdrop-blur-md safe-top">
        {/* Top Navbar Row */}
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8 border-b border-inflixo-border/60">
          {/* Left: Logo + Post-OTP Badge */}
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
              <Check className="h-3 w-3 stroke-[3]" />
              Verified OTP Account
            </span>
          </div>

          {/* Center: Logged-In Email Display Badge */}
          {email && (
            <div className="flex items-center gap-2 rounded-full border border-inflixo-border bg-surface-muted/80 px-3 py-1 text-xs font-semibold text-inflixo-navy shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-muted text-[11px] font-medium hidden sm:inline">Signed in as:</span>
              <span className="font-bold text-inflixo-purple truncate max-w-[180px] sm:max-w-xs">{email}</span>
            </div>
          )}

          {/* Right: Save & Logout */}
          <button
            onClick={handleSaveAndLogout}
            className="tap-scale flex shrink-0 items-center gap-1.5 rounded-full border border-inflixo-border bg-surface-muted/60 px-3.5 py-1.5 text-xs font-bold text-inflixo-navy transition-all hover:border-inflixo-purple/40 hover:bg-inflixo-purple-light/50 hover:text-inflixo-purple-dark shadow-2xs"
          >
            <LogOut className="h-3.5 w-3.5 text-inflixo-purple" />
            <span>Save &amp; logout</span>
          </button>
        </div>

        {/* Subheader bar below Top Navbar containing step progress */}
        <div className="bg-surface-muted/60 px-5 py-3 sm:px-8 border-b border-inflixo-border/60">
          <div className="mx-auto max-w-6xl flex items-center justify-between">
            <ProgressSteps current={step} />
          </div>
        </div>
      </header>

      {isFullWidthStep ? (
        /* Full Screen / Full Width Layout for Subscription & Finish steps */
        <div className="mx-auto max-w-[95%] w-full px-5 pb-16 pt-6 sm:px-8 sm:pb-20 sm:pt-8">
          <main key={step} className="onboarding-step-enter w-full">
            {children}
          </main>
        </div>
      ) : (
        /* Split Layout with 50-50 wide desktop split */
        <div className="mx-auto flex max-w-7xl w-full flex-col lg:flex-row gap-8">
          {/* Form column */}
          <main className="flex-1 px-5 pb-16 pt-6 sm:px-8 sm:pb-20 sm:pt-8 lg:w-[50%]">
            <div key={step} className="onboarding-step-enter">{children}</div>
          </main>

          {/* Live preview column (desktop only, sticky & wide) */}
          {preview && (
            <aside className="hidden flex-1 border-l border-slate-200/80 bg-slate-50/50 px-6 py-10 lg:block pb-20 lg:w-[50%] min-w-[440px]">
              <div className="sticky top-28 w-full flex flex-col items-center">{preview}</div>
            </aside>
          )}
        </div>
      )}

      {/* Mobile compact preview */}
      {!isFullWidthStep && preview && (
        <div className="border-t border-inflixo-border bg-surface-muted/50 px-5 py-6 lg:hidden mb-12">
          {preview}
        </div>
      )}
    </div>
  );
}

