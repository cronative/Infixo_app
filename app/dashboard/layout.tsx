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

import { usePathname } from "next/navigation";

function getPageHeaderInfo(pathname: string, displayName?: string, handleStr?: string) {
  const firstName = displayName ? displayName.split(" ")[0] : "Creator";

  if (pathname === "/dashboard/series") {
    return {
      title: "OTT Series & Episodes",
      subtitle: "Organize multi-part video series across YouTube, Instagram, and Facebook",
      showHandlePill: false,
    };
  }
  if (pathname === "/dashboard/socials") {
    return {
      title: "Social Accounts & Reach",
      subtitle: "Connect YouTube, Instagram, and Facebook to sync total fanbase",
      showHandlePill: false,
    };
  }
  if (pathname === "/dashboard/profile") {
    return {
      title: "Creator Profile",
      subtitle: "Update display name, username handle, bio, and content categories",
      showHandlePill: false,
    };
  }
  if (pathname === "/dashboard/themes") {
    return {
      title: "Themes & Styling",
      subtitle: "Choose a visual design theme for your public profile",
      showHandlePill: false,
    };
  }
  if (pathname === "/dashboard/subscription") {
    return {
      title: "Early Access Subscription",
      subtitle: "Manage your creator plan, limits, and billing details",
      showHandlePill: false,
    };
  }
  if (pathname === "/dashboard/settings") {
    return {
      title: "Account Settings",
      subtitle: "Manage account configuration, security, and preferences",
      showHandlePill: false,
    };
  }
  if (pathname === "/dashboard/preview") {
    return {
      title: "Live Profile Preview",
      subtitle: "Preview how your public profile looks to fans and followers",
      showHandlePill: false,
    };
  }

  return {
    title: `Welcome back, ${firstName} 👋`,
    subtitle: `inflixo.com/${handleStr || "username"}`,
    showHandlePill: true,
  };
}

function DesktopTopHeader() {
  const pathname = usePathname();
  const { profile } = useCreator();
  const { showToast } = useToast();
  const router = useRouter();

  const handleStr = profile.username || "username";
  const profileUrl = `inflixo.com/${handleStr}`;
  const headerInfo = getPageHeaderInfo(pathname, profile.displayName, handleStr);

  return (
    <header className="hidden items-center justify-between border-b border-slate-200 bg-white px-8 py-3.5 lg:flex">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <h1 className="font-display text-base font-extrabold text-slate-900 truncate">
            {headerInfo.title}
          </h1>
          {!headerInfo.showHandlePill && (
            <p className="text-xs text-slate-500 font-medium truncate">{headerInfo.subtitle}</p>
          )}
        </div>

        {headerInfo.showHandlePill && (
          <button
            type="button"
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
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F6EBF1] hover:bg-rose-100/70 text-[#803D63] text-xs font-semibold rounded-full border border-[#E8DCE4] transition-colors cursor-pointer shrink-0"
            title="Copy Profile Link"
          >
            <span>{profileUrl}</span>
            <Copy className="h-3.5 w-3.5 opacity-70" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
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
          type="button"
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

  if (loading) {
    return <SyncingLoader message="Syncing your creator profile, series & stats..." fullScreen />;
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
        <main className="flex-1 overflow-y-auto pb-32 lg:pb-8">
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
    return <SyncingLoader message="Authenticating account..." fullScreen />;
  }

  return (
    <CreatorProvider>
      <Shell>{children}</Shell>
    </CreatorProvider>
  );
}
