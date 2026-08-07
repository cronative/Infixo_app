"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreatorProvider, useCreator } from "@/contexts/CreatorContext";
import { AuthService } from "@/services/AuthService";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardBottomNav } from "@/components/dashboard/DashboardBottomNav";
import { DashboardMobileHeader } from "@/components/dashboard/DashboardMobileHeader";
import { LogOut, Copy } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

function DesktopTopHeader() {
  const { profile } = useCreator();
  const { showToast } = useToast();
  const router = useRouter();

  return (
    <header className="hidden items-center justify-between border-b border-inflixo-border bg-white/90 px-8 py-4 shadow-[0_1px_0_rgba(23,20,31,0.02),0_8px_20px_-16px_rgba(23,20,31,0.15)] backdrop-blur-md lg:flex">
      <div>
        <p className="font-display text-sm font-semibold text-inflixo-navy">
          {profile.displayName ? `Welcome, ${profile.displayName.split(" ")[0]}` : "Welcome"}
        </p>
        <p className="text-xs text-muted">inflixo.com/{profile.username || "you"}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            navigator.clipboard.writeText(`https://inflixo.com/${profile.username || "you"}`);
            showToast("Link copied to clipboard");
          }}
          className="flex items-center gap-2 rounded-xl border border-inflixo-border bg-white px-3.5 py-2 text-xs font-semibold text-inflixo-navy shadow-[var(--shadow-soft)] transition-all hover:-translate-y-px hover:shadow-[var(--shadow-hover)]"
        >
          <Copy className="h-3.5 w-3.5" /> Copy Link
        </button>
        <button
          onClick={() => {
            AuthService.logout();
            router.push("/login");
          }}
          className="flex items-center gap-2 rounded-xl border border-inflixo-border px-3.5 py-2 text-xs font-semibold text-muted transition-colors hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-3.5 w-3.5" /> Logout
        </button>
      </div>
    </header>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Desktop Sidebar (Static / Fixed Left Side) */}
      <DashboardSidebar />

      {/* Main Container (Static Header + Independent Scrollable Main) */}
      <div className="flex h-screen flex-1 flex-col overflow-hidden min-w-0">
        {/* Desktop Top Header (Static / Fixed Top) */}
        <DesktopTopHeader />

        {/* Mobile Navigation Header (Fixed Top) */}
        <DashboardMobileHeader />

        {/* Scrollable Content Viewport (Only inner area scrolls) */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <DashboardBottomNav />
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
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-inflixo-purple-light border-t-inflixo-purple" />
      </div>
    );
  }

  return (
    <CreatorProvider>
      <Shell>{children}</Shell>
    </CreatorProvider>
  );
}
