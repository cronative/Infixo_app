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
    <div className="min-h-dvh bg-background scroll-pt-32">
      {/* Sticky Header section with Top Navbar + Step Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-[#E7E3DC] bg-white shadow-xs safe-top">
        {/* Top Navbar Row */}
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-3.5 py-2.5 sm:px-8 border-b border-[#ECE8E1]">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <Logo size="sm" />
          </div>

          {/* Center: Subtle Verified Email Indicator */}
          {email && (
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-xs">
              <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
              <span className="truncate max-w-[140px] sm:max-w-xs">{email}</span>
            </div>
          )}

          {/* Right: Save & Logout */}
          <button
            onClick={handleSaveAndLogout}
            className="tap-scale flex shrink-0 items-center gap-1.5 rounded-full border border-[#E7E3DC] bg-[#F8F7F3] px-3 py-1.5 text-xs font-bold text-[#54514D] transition-all hover:border-[#803D63]/30 hover:bg-white hover:text-[#181716] shadow-xs"
          >
            <LogOut className="h-3.5 w-3.5 text-[#797570]" />
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
              <aside className="hidden flex-1 border-l border-[#E7E3DC] bg-[#F8F7F3] px-6 py-4 pb-20 lg:block lg:w-[50%] min-w-[440px]">
                <div className="sticky top-[116px] max-h-[calc(100vh-128px)] overflow-y-auto pr-1 pb-6 scrollbar-thin flex flex-col items-center">
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
          <div className="relative flex flex-col w-full h-full max-h-dvh bg-[#F8F7F3] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 bg-white border-b border-[#E7E3DC] safe-top">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold text-[#181716]">Live Profile Preview</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobilePreviewOpen(false)}
                className="tap-scale flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F7F3] text-[#54514D] hover:bg-[#E7E3DC] transition-colors cursor-pointer"
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
            <div className="p-3.5 bg-white border-t border-[#E7E3DC] safe-bottom">
              <button
                type="button"
                onClick={() => setIsMobilePreviewOpen(false)}
                className="w-full rounded-xl bg-[#803D63] hover:bg-[#6F3456] py-3 text-xs font-bold text-white transition-colors cursor-pointer text-center shadow-xs"
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

