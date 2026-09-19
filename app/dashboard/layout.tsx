"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreatorProvider, useCreator } from "@/contexts/CreatorContext";
import { AuthService } from "@/services/AuthService";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardMobileHeader } from "@/components/dashboard/DashboardMobileHeader";
import { DashboardSideDrawer } from "@/components/dashboard/DashboardSideDrawer";
import { DashboardBottomNav } from "@/components/dashboard/DashboardBottomNav";
import { Copy, ExternalLink, Zap } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { getFreeTrialStatus } from "@/lib/trialStatus";

import { SyncingLoader } from "@/components/shared/SyncingLoader";
import { OnboardingService } from "@/services/OnboardingService";
import { debugLog } from "@/lib/debugLogger";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning 👋";
  if (hour < 18) return "Good afternoon 👋";
  return "Good evening 👋";
}

function DesktopTopHeader() {
  const { profile } = useCreator();
  const { showToast } = useToast();

  const handleStr = profile.username || "username";
  const [greeting] = useState(() => getGreeting());

  const handleCopy = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
    const fullUrl = `${origin}/${handleStr}`;
    const success = await copyToClipboard(fullUrl);
    if (success) {
      showToast("Profile link copied! ✨");
    } else {
      showToast("Could not copy link", "error");
    }
  };

  return (
    <header className="hidden shrink-0 items-center justify-between border-b border-[#e2e8f0] bg-white/90 px-4 py-2.5 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur-xl sm:px-6 lg:flex lg:px-8">
      <div>
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#043084]">
          {greeting}
        </h1>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <p className="text-xs font-medium text-[#475569]">
            Here&apos;s how your Inflixo profile is looking today.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs font-semibold text-[#043084] shadow-xs transition-all hover:-translate-y-0.5 hover:border-[#cbd5e1] hover:bg-[#f8fafc] hover:shadow-sm"
        >
          <Copy className="h-3.5 w-3.5 text-[#64748b]" />
          <span>Copy Link</span>
        </button>
        <a
          href={`/${handleStr}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[#043084] px-3.5 text-xs font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-md"
        >
          <span>View Profile</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </header>
  );
}

function TrialAccessBar() {
  const { subscription } = useCreator();
  const [nowMs] = useState(() => Date.now());
  const trialStatus = getFreeTrialStatus(subscription, nowMs);

  if (!trialStatus.isFreeTrial) return null;

  const daysLeft = trialStatus.daysLeft ?? 0;
  const dayText = daysLeft === 1 ? "1 day" : `${daysLeft} days`;
  const message = trialStatus.isExpired
    ? "Your Free Trial has ended"
    : `${dayText} left in Free Trial`;
  const cta = trialStatus.isExpired ? "Choose a plan" : "Keep access";

  return (
    <div className="sticky top-0 z-40 flex h-11 shrink-0 items-center justify-center border-b border-[#032363] bg-[#043084] px-4 text-white shadow-[0_1px_0_rgba(255,255,255,0.08)]">
      <div className="flex w-full max-w-5xl items-center justify-center gap-3 text-center">
        <span className="hidden h-5 w-5 items-center justify-center rounded-md text-white sm:inline-flex">
          <Zap className="h-4 w-4 fill-current" />
        </span>
        <p className="truncate text-sm font-black tracking-tight sm:text-base">
          {message}
        </p>
        <Link
          href="/dashboard/subscription"
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-white/60 px-3 text-xs font-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.12)] transition-all hover:-translate-y-0.5 hover:bg-white hover:text-[#043084] sm:px-4 sm:text-sm"
        >
          <Zap className="h-3.5 w-3.5 fill-current" />
          <span>{cta}</span>
        </Link>
      </div>
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { profile, loading } = useCreator();

  useEffect(() => {
    if (!loading) {
      if (!profile.username || !profile.displayName) {
        debugLog("DASHBOARD", "Profile incomplete on dashboard -> Redirecting to /onboarding/profile");
        router.replace("/onboarding/profile");
        return;
      }
      OnboardingService.setStep("finish");
    }
  }, [loading, profile.username, profile.displayName, router]);

  if (loading) {
    return <SyncingLoader message="Syncing your creator profile, series & stats..." fullScreen hideProgressBar={true} />;
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#f8fafc]">
      {/* Desktop Sidebar */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="flex h-dvh flex-1 flex-col overflow-hidden min-w-0">
        <TrialAccessBar />

        {/* Desktop Top Header */}
        <DesktopTopHeader />

        {/* Mobile Navigation Header */}
        <DashboardMobileHeader onOpenDrawer={() => setDrawerOpen(true)} />

        {/* Scrollable Content Viewport */}
        <main className="flex-1 overflow-y-auto overscroll-contain px-3.5 pt-3.5 pb-[calc(env(safe-area-inset-bottom)+5rem)] sm:px-6 sm:py-4.5 lg:px-8 lg:py-5">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>

      <DashboardBottomNav />

      {/* Side Drawer Overlay Menu */}
      <DashboardSideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

export default function DashboardRootLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checked] = useState(() => AuthService.isLoggedIn());

  useEffect(() => {
    if (!checked) {
      router.replace("/login");
    }
  }, [checked, router]);

  if (!checked) {
    return <SyncingLoader message="Authenticating account..." fullScreen hideProgressBar={true} />;
  }

  return (
    <CreatorProvider>
      <Shell>{children}</Shell>
    </CreatorProvider>
  );
}
