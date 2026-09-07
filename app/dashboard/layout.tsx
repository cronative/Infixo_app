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
    <header className="hidden items-center justify-between border-b border-[#E4DAD5] bg-white px-8 py-4 lg:flex shrink-0">
      <div>
        <h1 className="font-display text-lg font-bold text-[#241618] tracking-tight">
          {greeting}
        </h1>
        <p className="text-xs text-[#6B5A5D] font-medium mt-0.5">
          Here&apos;s how {displayName} is looking today.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-xl border border-[#E4DAD5] bg-white hover:bg-[#F7F0EA] px-3.5 py-2 text-xs font-semibold text-[#241618] transition-colors cursor-pointer"
        >
          <Copy className="h-3.5 w-3.5 text-[#6B5A5D]" />
          <span>Copy Link</span>
        </button>

        <a
          href={`/${handleStr}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-xl bg-[#B85C6B] hover:bg-[#8C3F4D] px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
        >
          <span>View Profile</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </header>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { loading } = useCreator();

  useEffect(() => {
    if (!loading) {
      OnboardingService.setStep("finish");
    }
  }, [loading]);

  if (loading) {
    return <SyncingLoader message="Syncing your creator profile, series & stats..." fullScreen hideProgressBar={true} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fbfbfb]">
      {/* Desktop Sidebar */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="flex h-screen flex-1 flex-col overflow-hidden min-w-0">
        {/* Desktop Top Header */}
        <DesktopTopHeader />

        {/* Mobile Navigation Header */}
        <DashboardMobileHeader onOpenDrawer={() => setDrawerOpen(true)} />

        {/* Scrollable Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in-up">
          <div className="mx-auto max-w-[1240px]">
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
