"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreatorProvider, useCreator } from "@/contexts/CreatorContext";
import { AuthService } from "@/services/AuthService";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardMobileHeader } from "@/components/dashboard/DashboardMobileHeader";
import { DashboardSideDrawer } from "@/components/dashboard/DashboardSideDrawer";
import { Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";

import { SyncingLoader } from "@/components/shared/SyncingLoader";
import { OnboardingService } from "@/services/OnboardingService";
import { ProfileService } from "@/services/ProfileService";
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
  const displayName = profile.displayName || profile.email?.split("@")[0] || "Creator";
  const [greeting, setGreeting] = useState("Good afternoon 👋");

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

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
    <header className="hidden items-center justify-between border-b border-[#E7E3DC] bg-white px-6 sm:px-8 py-4 lg:flex shrink-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[#181716] tracking-tight">
          {greeting}
        </h1>
        <p className="text-xs sm:text-sm text-[#54514D] font-normal mt-0.5">
          Here&apos;s how your Inflixo profile is looking today.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="h-10 px-3.5 rounded-[10px] border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-xs sm:text-sm font-medium text-[#181716] transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
        >
          <Copy className="h-4 w-4 text-[#797570]" />
          <span>Copy Link</span>
        </button>
        <a
          href={`/${handleStr}`}
          target="_blank"
          rel="noopener noreferrer"
          className="h-10 px-4 rounded-[10px] bg-[#3a2447] hover:bg-[#2c1937] text-xs sm:text-sm font-medium text-white transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
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
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc]">
      {/* Desktop Sidebar */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="flex h-screen flex-1 flex-col overflow-hidden min-w-0">
        {/* Desktop Top Header */}
        <DesktopTopHeader />

        {/* Mobile Navigation Header */}
        <DashboardMobileHeader onOpenDrawer={() => setDrawerOpen(true)} />

        {/* Scrollable Content Viewport */}
        <main className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>

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
