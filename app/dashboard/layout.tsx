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
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { NAV_GROUPS, getNavTitle, isNavActive } from "@/components/dashboard/navConfig";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { getFreeTrialStatus } from "@/lib/trialStatus";

import { SyncingLoader } from "@/components/shared/SyncingLoader";
import { OnboardingService } from "@/services/OnboardingService";
import { debugLog } from "@/lib/debugLogger";
import { TrialExpiredEmotionalModal } from "@/components/dashboard/TrialExpiredEmotionalModal";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning 👋";
  if (hour < 18) return "Good afternoon 👋";
  return "Good evening 👋";
}

function DesktopTopHeader() {
  const { profile, handleViewProfile, isTrialExpired, openTrialExpiredModal } = useCreator();
  const { showToast } = useToast();
  const pathname = usePathname();

  const handleStr = profile.username || "username";
  const group = NAV_GROUPS.find((g) => g.items.some((item) => isNavActive(pathname, item.href) && item.href !== "/dashboard"));
  const navTitle = pathname === "/dashboard" ? "Dashboard" : getNavTitle(pathname);

  const handleCopy = async () => {
    if (isTrialExpired) {
      showToast("Your public profile is currently hidden (Free trial ended)", "error");
      openTrialExpiredModal();
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
    const success = await copyToClipboard(`${origin}/${handleStr}`);
    showToast(success ? "Profile link copied! ✨" : "Could not copy link", success ? "success" : "error");
  };

  return (
    <header className="hidden h-13 shrink-0 items-center justify-between border-b border-[#ECECF0] bg-white px-6 lg:flex lg:px-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-[#6B6B76]">
        <span>{pathname === "/dashboard" ? "Studio" : (group?.title ?? "Studio")}</span>
        <ChevronRight className="h-3.5 w-3.5 text-[#cbd5e1]" />
        <span className="font-medium text-[#18181B]">{navTitle}</span>
      </nav>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[5px] border border-[#ECECF0] bg-white px-2.5 text-[13px] font-medium text-[#3F3F46] transition-colors hover:bg-[#FAFAFB] hover:text-[#7A2253]"
        >
          <Copy className="h-3.5 w-3.5" />
          <span>Copy link</span>
        </button>
        <button
          type="button"
          onClick={handleViewProfile}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[5px] border border-[#ECECF0] bg-white px-3 text-[13px] font-medium text-[#18181B] transition-colors hover:border-[#fbcfe8] hover:bg-[#fdf2f8] hover:text-[#7A2253]"
        >
          <span>View profile</span>
          <ExternalLink className="h-3.5 w-3.5 text-[#6B6B76]" />
        </button>
        <LogoutButton />
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
      <p className="min-w-0 line-clamp-2 break-words font-medium" title={message}>{message}</p>
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
  const pathname = usePathname();
  const isHome = pathname === "/dashboard";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const {
    profile,
    loading,
    isTrialExpired,
    isTrialModalOpen,
    openTrialExpiredModal,
    closeTrialExpiredModal,
    onboardingStep,
  } = useCreator();

  useEffect(() => {
    if (!loading) {
      const isFinished = onboardingStep === "finish" || OnboardingService.getStep() === "finish";
      if (!profile.username || !profile.displayName || !isFinished) {
        debugLog("DASHBOARD", `Profile or onboarding incomplete (${onboardingStep}) -> Redirecting to /onboarding`);
        router.replace("/onboarding");
        return;
      }
    }
  }, [loading, profile.username, profile.displayName, onboardingStep, router]);

  // Whenever user arrives on or navigates to Home (/dashboard) and trial is expired, show the popup modal
  useEffect(() => {
    if (!loading && isHome && isTrialExpired) {
      openTrialExpiredModal();
    }
  }, [loading, isHome, isTrialExpired, openTrialExpiredModal]);

  // Block rendering until loaded and verified finished
  const isFinished = onboardingStep === "finish" || OnboardingService.getStep() === "finish";
  if (loading || !isFinished || !profile.username || !profile.displayName) {
    return <SyncingLoader message="Syncing your creator profile, series & stats..." fullScreen hideProgressBar={true} />;
  }

  return (
    <div className="dash-ui flex h-dvh w-full overflow-hidden bg-white">
      {/* Desktop Sidebar */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="flex h-dvh flex-1 flex-col overflow-hidden min-w-0 bg-(--bg)">
        <TrialAccessBar />

        {/* Desktop Top Header */}
        <DesktopTopHeader />

        {/* Mobile Navigation Header */}
        <DashboardMobileHeader onOpenDrawer={() => setDrawerOpen(true)} />

        {/* Scrollable Content Viewport */}
        <main className="flex-1 overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom)+5rem)] lg:pb-0">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>

      <DashboardBottomNav />

      {/* Side Drawer Overlay Menu */}
      <DashboardSideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Emotional Trial Expired Popup */}
      <TrialExpiredEmotionalModal
        isOpen={isTrialModalOpen}
        onClose={closeTrialExpiredModal}
        profile={profile}
      />
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
