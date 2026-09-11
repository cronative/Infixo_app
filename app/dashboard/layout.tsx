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
import { Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { getFreeTrialStatus, getTrialHeaderMessage } from "@/lib/trialStatus";

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
  const { profile, subscription } = useCreator();
  const { showToast } = useToast();

  const handleStr = profile.username || "username";
  const [greeting] = useState(() => getGreeting());
  const [nowMs] = useState(() => Date.now());
  const trialStatus = getFreeTrialStatus(subscription, nowMs);
  const headerMessage = getTrialHeaderMessage(subscription, nowMs);

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
    <header className="hidden shrink-0 items-center justify-between border-b border-[#e2e8f0] bg-white/90 px-6 py-3.5 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur-xl sm:px-8 lg:flex">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#151933]">
          {greeting}
        </h1>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <p className={`text-xs font-medium sm:text-sm ${trialStatus.shouldWarn ? "text-[#B45309]" : "text-[#475569]"}`}>
            {headerMessage}
          </p>
          {trialStatus.shouldWarn && (
            <Link
              href="/dashboard/subscription"
              className="inline-flex items-center rounded-full border border-[#151933]/15 bg-[#151933] px-2.5 py-0.5 text-[10px] font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-hover"
            >
              View Plans
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[10px] border border-[#e2e8f0] bg-white px-3.5 text-xs font-semibold text-[#151933] shadow-xs transition-all hover:-translate-y-0.5 hover:border-[#cbd5e1] hover:bg-[#f8fafc] hover:shadow-sm sm:text-sm"
        >
          <Copy className="h-4 w-4 text-[#64748b]" />
          <span>Copy Link</span>
        </button>
        <a
          href={`/${handleStr}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[10px] bg-[#151933] px-4 text-xs font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-md sm:text-sm"
        >
          <span>View Profile</span>
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </header>
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
        {/* Desktop Top Header */}
        <DesktopTopHeader />

        {/* Mobile Navigation Header */}
        <DashboardMobileHeader onOpenDrawer={() => setDrawerOpen(true)} />

        {/* Scrollable Content Viewport */}
        <main className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
          <div className="mx-auto max-w-7xl w-full">
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
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!AuthService.isLoggedIn()) {
      router.replace("/login");
      return;
    }
    setChecked(true);
  }, [router]);

  if (!checked) {
    return <SyncingLoader message="Authenticating account..." fullScreen hideProgressBar={true} />;
  }

  return (
    <CreatorProvider>
      <Shell>{children}</Shell>
    </CreatorProvider>
  );
}
