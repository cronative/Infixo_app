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
        className={`text-xs sm:text-sm font-bold text-inflixo-purple-dark transition-all duration-300 transform ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
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
  isMobilePreviewOpen: controlledMobilePreviewOpen,
  setIsMobilePreviewOpen: controlledSetMobilePreviewOpen,
}: {
  step: OnboardingStep;
  children: ReactNode;
  preview?: ReactNode;
  footer?: ReactNode;
  fullWidth?: boolean;
  isMobilePreviewOpen?: boolean;
  setIsMobilePreviewOpen?: (open: boolean) => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [internalMobilePreviewOpen, setInternalMobilePreviewOpen] = useState(false);
  const isFullWidthStep = fullWidth || !preview;

  const isMobilePreviewOpen = controlledMobilePreviewOpen !== undefined ? controlledMobilePreviewOpen : internalMobilePreviewOpen;
  const setIsMobilePreviewOpen = controlledSetMobilePreviewOpen || setInternalMobilePreviewOpen;

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
    <div className="min-h-dvh bg-[#f8fafc] scroll-pt-32">
      {/* Sticky Header section with Top Navbar + Step Navigation (fixed/sticky so it never scrolls) */}
      <header className="sticky top-0 z-50 w-full border-b border-[#e2e8f0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        {/* Top Navbar Row - Full Width with Increased Height */}
        <div className="w-full flex items-center justify-between gap-4 px-4 sm:px-8 lg:px-12 py-3.5 sm:py-4.5 border-b border-[#e2e8f0] bg-white">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <Logo size="md" />
          </div>

          {/* Center: Subtle Verified Email Indicator */}
          {email && (
            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-xs">
              <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
              <span className="truncate max-w-[160px] sm:max-w-xs font-medium">{email}</span>
            </div>
          )}

          {/* Right: Save & Logout */}
          <button
            onClick={handleSaveAndLogout}
            className="tap-scale flex shrink-0 items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-4 py-2 text-xs font-bold text-[#475569] transition-all hover:border-[#cbd5e1] hover:bg-[#f8fafc] hover:text-[#151933] shadow-xs cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-[#64748b]" />
            <span className="hidden sm:inline">Save &amp; logout</span>
            <span className="sm:hidden">Logout</span>
          </button>
        </div>

        {/* Subheader bar below Top Navbar containing step progress - Centered */}
        <div className="w-full bg-white px-3.5 py-3 sm:px-8">
          <div className="mx-auto max-w-6xl flex items-center justify-between">
            <ProgressSteps current={step} />
          </div>
        </div>
      </header>

      {/* Main Content Area with Natural Spacing Below Sticky Header */}
      <div className="w-full">
        {isFullWidthStep ? (
          /* Full Screen / Full Width Layout for Subscription & Finish steps */
          <div className="mx-auto max-w-full sm:max-w-[95%] w-full px-3 pb-16 pt-5 sm:px-8 sm:pb-20 sm:pt-6">
            <main key={step} className="onboarding-step-enter w-full">
              {children}
            </main>
          </div>
        ) : (
          /* Split Layout with 50-50 wide desktop split */
          <div className="mx-auto flex max-w-7xl w-full flex-col lg:flex-row gap-8">
            {/* Left form column - scrolls normally */}
            <main className="flex-1 px-3.5 pb-16 pt-4 sm:px-8 sm:pb-20 sm:pt-6 lg:w-[50%] max-w-xl mx-auto lg:max-w-none">
              <div key={step} className="onboarding-step-enter">{children}</div>
            </main>

            {/* Right live preview column - sticky below header and contained in viewport */}
            {preview && (
              <aside className="hidden flex-1 border-l border-[#E4DAD5] bg-[#fbfbfb] px-6 py-4 pb-20 lg:block lg:w-[50%] min-w-[440px]">
                <div className="sticky top-[136px] max-h-[calc(100vh-148px)] overflow-y-auto pr-1 pb-6 scrollbar-thin flex flex-col items-center">
                  <div className="w-full max-w-[480px]">
                    {preview}
                  </div>
                </div>
              </aside>
            )}
          </div>
        )}
      </div>

      {/* Dedicated Full-Screen Preview Sheet for Mobile & Tablet */}
      {preview && isMobilePreviewOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-xs lg:hidden animate-fade-in">
          <div className="relative flex flex-col w-full h-full max-h-dvh bg-[#fbfbfb] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 bg-white border-b border-[#E4DAD5] safe-top">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold text-[#241618]">Live Profile Preview</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobilePreviewOpen(false)}
                className="tap-scale flex h-8 w-8 items-center justify-center rounded-full bg-[#fbfbfb] text-[#6B5A5D] hover:bg-[#E4DAD5] transition-colors cursor-pointer"
                aria-label="Close Preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Preview Body */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
              <div className="w-full max-w-[480px] my-auto py-2">
                {preview}
              </div>
            </div>

            {/* Bottom Return Action */}
            <div className="p-3.5 bg-white border-t border-[#E4DAD5] safe-bottom">
              <button
                type="button"
                onClick={() => setIsMobilePreviewOpen(false)}
                className="w-full rounded-xl bg-[#151933] hover:bg-[#151933] py-3 text-xs font-bold text-white transition-colors cursor-pointer text-center shadow-xs"
              >
                Back to Editing Form
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

