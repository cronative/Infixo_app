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
  "✨ The ultimate Inflixo Creator Page built for modern creators",
  "🎬 Showcase your OTT video series with seasons & episodes",
  "📈 Combine all your social stats into one powerful reach number",
  "👑 Customize your public page with stunning creator themes",
  "🚀 Share your single link across Instagram, YouTube & Facebook",
  "📊 Track your total combined audience fanbase in real time",
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
      {/* Fixed Header section with Top Navbar + Step Navigation */}
      <header className="fixed top-0 left-0 w-full z-50 border-b border-gray-200 bg-white safe-top shadow-2xs">
        {/* Top Navbar Row */}
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-3.5 py-2.5 sm:px-8 border-b border-slate-100">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <Logo size="sm" />
          </div>

          {/* Center: Subtle Verified Email Indicator */}
          {email && (
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-2xs">
              <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
              <span className="truncate max-w-[140px] sm:max-w-xs">{email}</span>
            </div>
          )}

          {/* Right: Save & Logout */}
          <button
            onClick={handleSaveAndLogout}
            className="tap-scale flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-100 shadow-2xs"
          >
            <LogOut className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Save &amp; logout</span>
            <span className="sm:hidden">Logout</span>
          </button>
        </div>

        {/* Subheader bar below Top Navbar containing step progress */}
        <div className="bg-white px-3.5 py-2.5 sm:px-8">
          <div className="mx-auto max-w-6xl flex items-center justify-between">
            <ProgressSteps current={step} />
          </div>
        </div>
      </header>

      {/* Main Content Area with Top Padding for Fixed Header */}
      <div className="pt-28 sm:pt-32">
        {isFullWidthStep ? (
          /* Full Screen / Full Width Layout for Subscription & Finish steps */
          <div className="mx-auto max-w-full sm:max-w-[95%] w-full px-3 pb-16 pt-4 sm:px-8 sm:pb-20 sm:pt-4">
            <main key={step} className="onboarding-step-enter w-full">
              {children}
            </main>
          </div>
        ) : (
          /* Split Layout with 50-50 wide desktop split */
          <div className="mx-auto flex max-w-7xl w-full flex-col lg:flex-row gap-8">
            {/* Form column */}
            <main className="flex-1 px-3 pb-16 pt-4 sm:px-8 sm:pb-20 sm:pt-4 lg:w-[50%]">
              <div key={step} className="onboarding-step-enter">{children}</div>
            </main>

            {/* Live preview column (desktop only, sticky top-32 h-fit) */}
            {preview && (
              <aside className="hidden flex-1 border-l border-slate-200/80 bg-slate-50/50 px-6 py-8 lg:block pb-20 lg:w-[50%] min-w-[440px]">
                <div className="sticky top-32 h-fit w-full flex flex-col items-center">{preview}</div>
              </aside>
            )}
          </div>
        )}
      </div>

      {/* Mobile compact preview */}
      {!isFullWidthStep && preview && (
        <div className="border-t border-inflixo-border bg-surface-muted/50 px-2.5 py-5 lg:hidden mb-12">
          {preview}
        </div>
      )}
    </div>
  );
}

