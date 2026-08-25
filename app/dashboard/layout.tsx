"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreatorProvider, useCreator } from "@/contexts/CreatorContext";
import { AuthService } from "@/services/AuthService";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardBottomNav } from "@/components/dashboard/DashboardBottomNav";
import { DashboardMobileHeader } from "@/components/dashboard/DashboardMobileHeader";
import { DashboardSideDrawer } from "@/components/dashboard/DashboardSideDrawer";
import { LogOut, Copy, Menu, ExternalLink } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";

import { SyncingLoader } from "@/components/shared/SyncingLoader";
import { OnboardingService } from "@/services/OnboardingService";

function DesktopTopHeader() {
  const { profile } = useCreator();
  const { showToast } = useToast();
  const router = useRouter();

  const handleStr = profile.username || "you";

  return (
    <header className="hidden items-center justify-between border-b border-slate-200 bg-white px-8 py-3.5 lg:flex">
      <div>
        <p className="font-display text-sm font-bold text-slate-900">
          {profile.displayName ? `Welcome, ${profile.displayName.split(" ")[0]}` : "Welcome"}
        </p>
        <p className="text-xs text-slate-500 font-medium">inflixo.com/{handleStr}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={async () => {
            const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
            const fullUrl = `${origin}/${handleStr}`;
            const success = await copyToClipboard(fullUrl);
            if (success) {
              showToast("Profile link copied to clipboard! ✨");
            } else {
              showToast("Could not copy link", "error");
            }
          }}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50 cursor-pointer"
        >
          <Copy className="h-3.5 w-3.5 text-slate-500" /> Copy Link
        </button>

        <a
          href={`/${handleStr}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50 cursor-pointer"
        >
          <ExternalLink className="h-3.5 w-3.5 text-[#803D63]" /> View Public Profile ↗
        </a>

        <button
          onClick={() => {
            AuthService.logout();
            router.push("/login");
          }}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" /> Logout
        </button>
      </div>
    </header>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { loading } = useCreator();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      const step = OnboardingService.getStep();
      if (step && step !== "finish") {
        const stepRoutes: Record<string, string> = {
          profile: "/onboarding/profile",
          socials: "/onboarding/socials",
          theme: "/onboarding/themes",
          themes: "/onboarding/themes",
          series: "/onboarding/series",
          subscription: "/onboarding/subscription",
        };
        const targetRoute = stepRoutes[step] || "/onboarding/profile";
        router.replace(targetRoute);
      }
    }
  }, [loading, router]);

  if (loading) {
    return <SyncingLoader message="Syncing your creator profile, series & stats..." fullScreen hideProgressBar={true} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Desktop Sidebar (Static / Fixed Left Side) */}
      <DashboardSidebar />

      {/* Main Container (Static Header + Independent Scrollable Main) */}
      <div className="flex h-screen flex-1 flex-col overflow-hidden min-w-0">
        {/* Desktop Top Header (Static / Fixed Top) */}
        <DesktopTopHeader />

        {/* Mobile Navigation Header (Fixed Top) */}
        <DashboardMobileHeader onOpenDrawer={() => setDrawerOpen(true)} />

        {/* Scrollable Content Viewport (Only inner area scrolls with full bottom clearance above fixed nav) */}
        <main className="flex-1 overflow-y-auto pb-32 lg:pb-8 animate-fade-in-up">
          {children}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time auth gate after mount
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
