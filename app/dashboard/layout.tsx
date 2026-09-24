"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { CreatorProvider, useCreator } from "@/contexts/CreatorContext";
import { useSession } from "@/contexts/SessionContext";
import { AuthService } from "@/services/AuthService";
import { forceLogout } from "@/lib/authClient";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardMobileHeader } from "@/components/dashboard/DashboardMobileHeader";
import { DashboardSideDrawer } from "@/components/dashboard/DashboardSideDrawer";
import { DashboardBottomNav } from "@/components/dashboard/DashboardBottomNav";
import { ChevronRight, Copy, ExternalLink, Zap } from "lucide-react";
import { NAV_GROUPS, getNavTitle, isNavActive } from "@/components/dashboard/navConfig";
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
  const pathname = usePathname();

  const handleStr = profile.username || "username";
  const [greeting] = useState(() => getGreeting());
  const isHome = pathname === "/dashboard";
  const group = NAV_GROUPS.find((g) => g.items.some((item) => isNavActive(pathname, item.href) && item.href !== "/dashboard"));

  const handleCopy = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
    const success = await copyToClipboard(`${origin}/${handleStr}`);
    showToast(success ? "Profile link copied! ✨" : "Could not copy link", success ? "success" : "error");
  };

  return (
    <header className="hidden h-13 shrink-0 items-center justify-between border-b border-[#e2e8f0] bg-white px-6 lg:flex lg:px-8">
      {isHome ? (
        <p className="text-sm font-semibold text-[#0f172a]">
          {greeting}
          <span className="ml-2 font-normal text-[#64748b]">Here&apos;s how your Inflixo profile is doing today.</span>
        </p>
      ) : (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-[#64748b]">
          <span>{group?.title ?? "Studio"}</span>
          <ChevronRight className="h-3.5 w-3.5 text-[#cbd5e1]" />
          <span className="font-medium text-[#0f172a]">{getNavTitle(pathname)}</span>
        </nav>
      )}

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-[#475569] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
        >
          <Copy className="h-3.5 w-3.5" />
          <span>Copy link</span>
        </button>
        <a
          href={`/${handleStr}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs font-semibold text-[#0f172a] transition-colors hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
        >
          <span>View profile</span>
          <ExternalLink className="h-3.5 w-3.5 text-[#64748b]" />
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
    ? "Your Free Trial has ended (Profile is now private)"
    : `${dayText} left in Free Trial — after 7 days profile will be private`;
  const cta = trialStatus.isExpired ? "Choose a plan" : "Upgrade Plan";

  return (
    <div className={`flex min-h-9 shrink-0 items-center justify-center gap-2 border-b px-4 py-1.5 text-center text-xs ${trialStatus.isExpired ? "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]" : "border-[#fde68a] bg-[#fffbeb] text-[#78350f]"}`}>
      <Zap className="hidden h-3.5 w-3.5 shrink-0 sm:block" />
      <p className="min-w-0 truncate font-medium">{message}</p>
      <Link
        href="/dashboard/subscription"
        className="shrink-0 font-semibold underline underline-offset-2 hover:no-underline"
      >
        {cta}
      </Link>
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

  // Only block on a true first load. When cached creator data exists (returning
  // creator, or a background refresh after a save) keep the dashboard mounted.
  if (loading && !profile.username) {
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
  // Fast local login check. Read the local login flag after mount so server and client render the same
  // markup (reading localStorage during render caused a hydration mismatch).
  const [checked, setChecked] = useState<boolean | null>(null);
  useEffect(() => {
    setChecked(AuthService.isLoggedIn());
  }, []);
  // The server-verified source of truth (reads the httpOnly session cookie
  // via /api/me). SessionContext may have last fetched *before* this login
  // happened (e.g. it was mounted on /login when the user wasn't
  // authenticated yet, and nothing else ever told it to re-check) — so we
  // never trust its snapshot as-is. Instead we explicitly re-fetch once we
  // reach a protected route, wait for that specific fetch to resolve, and
  // only THEN decide whether to force a logout.
  const { isLoggedIn: sessionLoggedIn, refresh } = useSession();
  const [sessionVerified, setSessionVerified] = useState(false);

  useEffect(() => {
    if (checked === false) {
      router.replace("/login");
    }
  }, [checked, router]);

  useEffect(() => {
    if (!checked) return;
    let cancelled = false;
    setSessionVerified(false);
    refresh().finally(() => {
      if (!cancelled) setSessionVerified(true);
    });
    return () => {
      cancelled = true;
    };
  }, [checked, refresh]);

  useEffect(() => {
    if (checked && sessionVerified && !sessionLoggedIn) {
      forceLogout();
    }
  }, [checked, sessionVerified, sessionLoggedIn]);

  if (!checked) {
    return <SyncingLoader message="Authenticating account..." fullScreen hideProgressBar={true} />;
  }

  return (
    <CreatorProvider>
      <Shell>{children}</Shell>
    </CreatorProvider>
  );
}
