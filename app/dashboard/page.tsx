"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  ExternalLink,
  Film,
  Folder,
  Link2,
  Plus,
  Share2,
  ShoppingBag,
  MessageCircle,
  QrCode,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import {
  XTwitterIcon,
  LinkedinIcon,
} from "@/components/shared/BrandIcons";
import { QRCode } from "@/components/creator-card/QRCode";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { buildProfileUrl } from "@/utils/format";
import { SocialService } from "@/services/SocialService";
import { getSeriesEpisodes } from "@/lib/seriesMetrics";
import { customLinksRepository } from "@/repositories/localRepository";
import { ProductService } from "@/services/ProductService";
import { LinkService } from "@/services/LinkService";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PAGE_COPY } from "@/components/dashboard/pageCopy";
import {
  BrandInboxCard,
  EraProgressCard,
  QuickActions,
  RowCount,
  SmartAlerts,
  TopPerformers,
  TrafficSources,
  WeeklyMetrics,
  hasWeeklyActivity,
  type SmartAlert,
} from "@/components/dashboard/home/DashboardWidgets";
import { PhonePreview } from "@/components/dashboard/PhonePreview";
import type { DashboardSummary } from "@/lib/dashboardSummary";
import type { SocialAccounts, CustomLink, CreatorProduct } from "@/types";
import { getCreatorEra } from "@/lib/creatorEra";
import { CreatorEraCelebrationModal } from "@/components/shared/CreatorEraCelebrationModal";
import { SetupChecklist } from "@/components/dashboard/SetupChecklist";
import { PublicPagesCard } from "@/components/dashboard/PublicPagesCard";
import { SectionHeading } from "@/components/dashboard/SectionHeading";
import { markSetupStep, useSetupStep } from "@/lib/setupProgress";
import { ThemeService } from "@/services/ThemeService";
import { DEFAULT_THEME_KEY } from "@/lib/themeKeys";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning 👋";
  if (hour < 18) return "Good afternoon 👋";
  return "Good evening 👋";
}

export default function DashboardOverviewPage() {
  // Time-based greeting only on the client: server and browser clocks/time zones differ (hydration #418).
  const [greeting, setGreeting] = useState("Welcome back 👋");
  useEffect(() => setGreeting(getGreeting()), []);
  const {
    profile,
    socials,
    totalAudience,
    loading: profileLoading,
    series,
    theme,
    isTrialExpired,
    openTrialExpiredModal,
    refresh,
  } = useCreator();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  // The setup bar already nudges for a photo; only repeat it as an alert once that bar is dismissed.
  const [setupDismissed, setSetupDismissed] = useState(false);
  useEffect(() => {
    try {
      setSetupDismissed(localStorage.getItem("inflixo_setup_checklist_dismissed") === "true");
    } catch {}
  }, []);

  useEffect(() => {
    if (profile.eraUnlockedPending) {
      setCelebrationOpen(true);
    }
  }, [profile.eraUnlockedPending]);

  // Real data for the Series / Shop / Links lists
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [products, setProducts] = useState<CreatorProduct[]>([]);
  const [latestFanNudge, setLatestFanNudge] = useState<any | null>(null);
  // Everything else on the home screen (7-day window) comes from one endpoint.
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const displayName = profile.displayName || "Creator";
  const handle = (profile.username || "").replace(/^@/, "");
  const profileUrl = buildProfileUrl(handle);

  // Fetch unread fan nudges for motivational banner
  useEffect(() => {
    fetch("/api/creator/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const notifs = data?.notifications || [];
        const unreadNudge = notifs.find(
          (n: any) => n.type === "fan_nudge" && n.status === "unread"
        );
        setLatestFanNudge(unreadNudge || null);
      })
      .catch(() => {});
  }, []);

  // Fetch real count data on mount from exact pages' storage / repositories
  useEffect(() => {
    try {
      // 1. Links (fetch from API with local repository fallback)
      LinkService.list()
        .then((data) => {
          if (data && Array.isArray(data.items)) {
            setCustomLinks(data.items as any);
          }
        })
        .catch(() => {
          const storedLinks = customLinksRepository.get();
          setCustomLinks(Array.isArray(storedLinks) ? storedLinks : []);
        });

      // 4. Products / Shop items
      ProductService.list()
        .then((items) => setProducts(Array.isArray(items) ? items : []))
        .catch(() => setProducts([]));
    } catch (e) {
      console.warn("Failed to read local repositories:", e);
    }
  }, []);

  const summaryAt = useRef(0);
  const loadSummary = useCallback((force = false) => {
    if (!force && Date.now() - summaryAt.current < 3000) return Promise.resolve();
    summaryAt.current = Date.now();
    return fetch("/api/dashboard/summary", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Unavailable"))))
      .then((body) => {
        if (body?.status === 1 && body.data) setSummary(body.data as DashboardSummary);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!profile.id && !profile.email) return;
    void loadSummary();
    const onUpdate = () => void loadSummary(true);
    window.addEventListener("collab-requests-updated", onUpdate);
    return () => window.removeEventListener("collab-requests-updated", onUpdate);
  }, [profile.id, profile.email, loadSummary]);

  // Keep the checklist current when returning to the dashboard (client nav, tab switch, bfcache) — no hard reload.
  const profileLoadingRef = useRef(profileLoading);
  useEffect(() => {
    profileLoadingRef.current = profileLoading;
  }, [profileLoading]);
  useEffect(() => {
    let last = 0;
    const sync = () => {
      // The provider is already fetching on first app load; don't double up.
      if (profileLoadingRef.current) return;
      if (document.visibilityState !== "visible" || Date.now() - last < 5000) return;
      last = Date.now();
      void refresh({ silent: true });
      void loadSummary();
    };
    sync();
    const onShow = (e: PageTransitionEvent) => e.persisted && sync();
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("pageshow", onShow);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("pageshow", onShow);
    };
  }, [refresh, loadSummary]);

  // Copy Profile URL Handler
  async function handleCopyLink() {
    if (isTrialExpired) {
      showToast("Public profile is currently hidden (Free trial ended)", "error");
      openTrialExpiredModal();
      return;
    }
    const success = await copyToClipboard(profileUrl);
    if (success) markSetupStep("shared");
    setCopied(success);
    showToast(
      success ? "Bio link copied to clipboard! ✨" : "Could not copy link",
      success ? "success" : "error"
    );
    setTimeout(() => setCopied(false), 2000);
  }

  // Effective audience and socials
  const effectiveSocials: SocialAccounts = socials;
  const effectiveTotalAudience =
    totalAudience > 0 ? totalAudience : SocialService.calculateTotalAudience(effectiveSocials);

  // Content Counts
  const seriesCount = series.length;
  const linksCount = customLinks.length;

  // Sorted items matching public order (position / pin / sort_order)
  const sortedSeries = useMemo(() => {
    return [...series].sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));
  }, [series]);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a: any, b: any) => {
      const aTop = Boolean(a.is_top_pick ?? a.isTopPick);
      const bTop = Boolean(b.is_top_pick ?? b.isTopPick);
      if (aTop && !bTop) return -1;
      if (!aTop && bTop) return 1;
      const aOrder = Number(a.sort_order ?? a.sortOrder ?? 0);
      const bOrder = Number(b.sort_order ?? b.sortOrder ?? 0);
      return aOrder - bOrder;
    });
  }, [products]);

  const sortedLinks = useMemo(() => {
    return [...customLinks].sort((a: any, b: any) => {
      const aPin = Boolean(a.pinned ?? a.isPinned);
      const bPin = Boolean(b.pinned ?? b.isPinned);
      if (aPin && !bPin) return -1;
      if (!aPin && bPin) return 1;
      const aPos = Number(a.position ?? 0);
      const bPos = Number(b.position ?? 0);
      return aPos - bPos;
    });
  }, [customLinks]);

  // 3. Next steps onboarding sequence:
  // Connect social accounts → Create your first series → Add your links → Add a product → Add a collab package → Pick a theme
  const hasSocialConnected = Boolean(
    socials?.instagram?.username ||
      (socials?.instagram?.url && socials.instagram.url !== "#") ||
      socials?.youtube?.username ||
      (socials?.youtube?.url && socials.youtube.url !== "#") ||
      socials?.facebook?.username ||
      (socials?.facebook?.url && socials.facebook.url !== "#") ||
      (socials?.instagram?.followers ?? 0) > 0 ||
      (socials?.youtube?.subscribers ?? 0) > 0 ||
      (socials?.facebook?.followers ?? 0) > 0
  );

  // Done once the creator applies or re-confirms any theme (incl. the default), or already uses a non-default one.
  const themeConfirmed = useSetupStep("theme");
  const hasPickedTheme = Boolean(
    themeConfirmed ||
      (profile.themeChangesCount ?? 0) > 0 ||
      ThemeService.getThemeChangesCount() > 0 ||
      (theme && theme !== DEFAULT_THEME_KEY) ||
      (profile.themeKey && profile.themeKey !== DEFAULT_THEME_KEY)
  );

  // Quick action: add an episode to the most recently updated series (or create the first series).
  const latestSeries = useMemo(
    () =>
      [...series].sort(
        (a: any, b: any) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()
      )[0],
    [series]
  );
  const addEpisodeHref = latestSeries
    ? `/dashboard/series?addEpisode=${encodeURIComponent(latestSeries.id)}`
    : "/dashboard/series?new=true";

  const mediaKitUrl = `${profileUrl}/mediakit`;
  async function handleShareMediaKit() {
    if (isTrialExpired) {
      openTrialExpiredModal();
      return;
    }
    const ok = await copyToClipboard(mediaKitUrl);
    showToast(ok ? "Media kit link copied — share it with brands ✨" : "Could not copy link", ok ? "success" : "error");
  }

  // All plan limits in one line, so the home screen doesn't read like an error page.
  const limits = summary?.limits ?? [];
  const limitAlert: SmartAlert[] =
    limits.length === 0
      ? []
      : [{
          id: "plan-limits",
          tone: "warn" as const,
          text:
            limits.length === 1
              ? `${limits[0].label}: plan limit reached (${limits[0].used}/${limits[0].limit}).`
              : `${limits.length} plan limits reached: ${limits.map((l) => `${l.label} (${l.used}/${l.limit})`).join(" · ")}.`,
          cta: { label: "Upgrade", href: limits.length === 1 ? limits[0].href : "/dashboard/subscription" },
        }];

  const alerts: SmartAlert[] = [
    ...limitAlert,
    ...(!profile.bio?.trim()
      ? [{ id: "bio", tone: "info" as const, text: "Your bio is empty — tell fans and brands what you create.", cta: { label: "Add bio", href: "/dashboard/profile?edit=details" } }]
      : []),
    ...(!profile.photoDataUrl?.trim() && setupDismissed
      ? [{ id: "avatar", tone: "info" as const, text: "Add a profile photo so fans recognise you.", cta: { label: "Add photo", href: "/dashboard/profile?edit=photo" } }]
      : []),
    ...((summary?.inbox.stalePending ?? 0) > 0
      ? [{
          id: "stale-requests",
          tone: "warn" as const,
          text: `${summary!.inbox.stalePending} collab ${summary!.inbox.stalePending === 1 ? "request has" : "requests have"} been waiting over 48h.`,
          cta: { label: "Reply", href: "/dashboard/mediakit#requests" },
        }]
      : []),
    ...(latestFanNudge
      ? [{ id: "fan-nudge", tone: "info" as const, text: "A fan visited your profile and wants to connect. Complete your profile to welcome them.", cta: { label: "Complete profile", href: "/dashboard/profile" } }]
      : []),
  ];

  return (
    <PageContainer className="select-none text-left">
      <PageHeader eyebrow={greeting} {...PAGE_COPY.dashboard} />

      <div className="flex items-start gap-8">
      {/* Main column: grids size to this column (container queries), so they fit beside the live preview. */}
      <div className="@container min-w-0 flex-1 space-y-5">
      {/* 1. LINK BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-white border border-[#ECECF0] rounded-[5px]">
        {/* Left: 36px avatar + Name + green Live dot */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <CreatorAvatar
              src={profile.photoDataUrl}
              name={displayName}
              className="h-9 w-9 rounded-full border border-[#ECECF0] object-cover"
            />
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
              title="Profile is live"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-semibold text-[#18181B] truncate" title={displayName}>
                {displayName}
              </h2>
              <span className="inline-flex items-center gap-1 h-6 px-2 rounded-[5px] text-[12px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live
              </span>
            </div>
          </div>
        </div>

        {/* Right: pill "inflixo.com/username" with Copy icon, "View", "Share" */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex h-8 items-center gap-1.5 px-2.5 rounded-[5px] bg-[#FAFAFB] border border-[#ECECF0] hover:bg-[#F4F4F5] text-[#3F3F46] hover:text-[#18181B] text-[13px] font-medium transition-colors cursor-pointer group"
            title="Click to copy bio link"
          >
            <span className="truncate max-w-[160px] sm:max-w-[220px] text-left" title={`inflixo.com/${handle || "creator"}`}>
              inflixo.com/{handle || "creator"}
            </span>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-[#6B6B76] group-hover:text-[#18181B] shrink-0" />
            )}
          </button>

          <Link
            href={`/${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center justify-center gap-1 px-3 rounded-[5px] border border-[#ECECF0] bg-white text-[#18181B] hover:bg-[#FAFAFB] text-[13px] font-medium transition-colors"
          >
            <span>View</span>
            <ExternalLink className="h-3.5 w-3.5 text-[#6B6B76]" />
          </Link>

          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="inline-flex h-8 items-center justify-center gap-1.5 px-3.5 rounded-[5px] bg-[#C21B5C] text-white hover:bg-[#A3164E] text-[13px] font-medium transition-colors cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* 1b. QUICK LINKS to every public page */}
      <PublicPagesCard handle={handle} profileUrl={profileUrl} />

      {/* Setup checklist: slim one-line progress (hidden at 6/6) */}
      <SetupChecklist
        profile={profile}
        socials={socials}
        seriesCount={seriesCount}
        linksCount={linksCount}
        hasPickedTheme={hasPickedTheme}
        onShare={() => setShareOpen(true)}
        onCopyLink={handleCopyLink}
      />

      {/* Alerts right under setup: one line for plan limits */}
      <SmartAlerts alerts={alerts} />

      {/* 3. SECTION: CONTENT & STOREFRONT */}
      <section className="space-y-3">
        <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
          {/* Card 1: Series */}
          <div className="rounded-[5px] border border-[#ECECF0] bg-white flex flex-col overflow-hidden">
            <SectionHeading
              as="h3"
              icon={Film}
              title="My Series"
              subtitle="Your shows, in order."
              count={`${series.length} series`}
              action={
                <Link
                  href="/dashboard/series?new=true"
                  className="inline-flex h-7 items-center gap-1 rounded-[5px] bg-[#C21B5C] px-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#A3164E] cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add<span className="sr-only"> series</span></span>
                </Link>
              }
            />

            <div className="flex-1 max-h-[280px] overflow-y-auto divide-y divide-[#F4F4F5]">
              {sortedSeries.length === 0 ? (
                <div className="py-8 px-4 text-center flex flex-col items-center justify-center">
                  <p className="text-[13px] font-medium text-[#18181B]">No series yet</p>
                  <Link
                    href="/dashboard/series?new=true"
                    className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 rounded-[5px] bg-[#C21B5C] text-white text-[12px] font-semibold hover:bg-[#A3164E] transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add series</span>
                  </Link>
                </div>
              ) : (
                sortedSeries.map((item) => {
                  const cover = (item as any).coverUrl || (item as any).thumbnailUrl || item.posterDataUrl || (item as any).cover;
                  const epCount = getSeriesEpisodes(item).length;
                  return (
                    <Link
                      key={item.id}
                      href={`/dashboard/series?edit=${encodeURIComponent(item.id)}`}
                      className="flex items-center gap-3 p-2.5 hover:bg-[#FAFAFB] transition-colors group cursor-pointer"
                    >
                      {cover ? (
                        <img
                          src={cover}
                          alt=""
                          className="h-10 w-10 rounded-[5px] object-cover shrink-0 bg-[#F4F4F5] border border-[#ECECF0]"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-[5px] bg-[#FFEDE6] text-[#C21B5C] flex items-center justify-center shrink-0 border border-[#C21B5C]/10">
                          <Film className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-[#18181B] group-hover:text-[#C21B5C] transition-colors">
                          {item.title}
                        </p>
                        <p className="text-[12px] text-[#6B6B76] mt-0.5">
                          {epCount} episode{epCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <RowCount count={summary?.rows.series[String(item.id)]} unit="play" />
                    </Link>
                  );
                })
              )}
            </div>

            <div className="p-2 border-t border-[#ECECF0] bg-white text-center mt-auto">
              <Link
                href="/dashboard/series"
                className="inline-flex items-center justify-center gap-1 text-[12px] font-semibold text-[#C21B5C] hover:text-[#A3164E] transition-colors"
              >
                <span>Open My Series →</span>
              </Link>
            </div>
          </div>

          {/* Card 2: Shop */}
          <div className="rounded-[5px] border border-[#ECECF0] bg-white flex flex-col overflow-hidden">
            <SectionHeading
              as="h3"
              icon={ShoppingBag}
              title="My Shop"
              subtitle="Products you recommend."
              count={`${products.length} ${products.length === 1 ? "product" : "products"}`}
              action={
                <Link
                  href="/dashboard/products?new=true"
                  className="inline-flex h-7 items-center gap-1 rounded-[5px] bg-[#C21B5C] px-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#A3164E] cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add<span className="sr-only"> product</span></span>
                </Link>
              }
            />

            <div className="flex-1 max-h-[280px] overflow-y-auto divide-y divide-[#F4F4F5]">
              {sortedProducts.length === 0 ? (
                <div className="py-8 px-4 text-center flex flex-col items-center justify-center">
                  <p className="text-[13px] font-medium text-[#18181B]">No products yet</p>
                  <Link
                    href="/dashboard/products?new=true"
                    className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 rounded-[5px] bg-[#C21B5C] text-white text-[12px] font-semibold hover:bg-[#A3164E] transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add product</span>
                  </Link>
                </div>
              ) : (
                sortedProducts.map((item: any) => {
                  const img = item.image_url || item.imageUrl || item.image;
                  const priceText = item.price ? `₹${Number(item.price).toLocaleString("en-IN")}` : "Free";
                  return (
                    <Link
                      key={item.id}
                      href={`/dashboard/products?edit=${encodeURIComponent(item.id)}`}
                      className="flex items-center gap-3 p-2.5 hover:bg-[#FAFAFB] transition-colors group cursor-pointer"
                    >
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          className="h-10 w-10 rounded-[5px] object-cover shrink-0 bg-[#F4F4F5] border border-[#ECECF0]"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-[5px] bg-[#FFEDE6] text-[#C21B5C] flex items-center justify-center shrink-0 border border-[#C21B5C]/10">
                          <ShoppingBag className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-[#18181B] group-hover:text-[#C21B5C] transition-colors">
                          {item.name}
                        </p>
                        <p className="text-[12px] font-semibold text-[#18181B] mt-0.5">
                          {priceText}
                        </p>
                      </div>
                      <RowCount count={summary?.rows.products[String(item.id)]} unit="click" />
                    </Link>
                  );
                })
              )}
            </div>

            <div className="p-2 border-t border-[#ECECF0] bg-white text-center mt-auto">
              <Link
                href="/dashboard/products"
                className="inline-flex items-center justify-center gap-1 text-[12px] font-semibold text-[#C21B5C] hover:text-[#A3164E] transition-colors"
              >
                <span>Open My Shop →</span>
              </Link>
            </div>
          </div>

          {/* Card 3: Links */}
          <div className="rounded-[5px] border border-[#ECECF0] bg-white flex flex-col overflow-hidden">
            <SectionHeading
              as="h3"
              icon={Link2}
              title="My Links"
              subtitle="Everything fans should find."
              count={`${customLinks.length} ${customLinks.length === 1 ? "link" : "links"}`}
              action={
                <Link
                  href="/dashboard/links?new=true"
                  className="inline-flex h-7 items-center gap-1 rounded-[5px] bg-[#C21B5C] px-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#A3164E] cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add<span className="sr-only"> link</span></span>
                </Link>
              }
            />

            <div className="flex-1 max-h-[280px] overflow-y-auto divide-y divide-[#F4F4F5]">
              {sortedLinks.length === 0 ? (
                <div className="py-8 px-4 text-center flex flex-col items-center justify-center">
                  <p className="text-[13px] font-medium text-[#18181B]">No links yet</p>
                  <Link
                    href="/dashboard/links?new=true"
                    className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 rounded-[5px] bg-[#C21B5C] text-white text-[12px] font-semibold hover:bg-[#A3164E] transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add link</span>
                  </Link>
                </div>
              ) : (
                sortedLinks.map((item: any) => {
                  const isGroup = item.kind === "group" || item.kind === "collection";
                  const childCount = item.children?.length ?? item.items?.length ?? 0;
                  const titleDisplay = isGroup ? `${item.title} · ${childCount} links` : item.title;

                  let favUrl: string | null = item.iconUrl || null;
                  if (!favUrl && !isGroup && item.url) {
                    try {
                      const domain = new URL(item.url).hostname;
                      if (domain) {
                        favUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
                      }
                    } catch {}
                  }

                  return (
                    <Link
                      key={item.id}
                      href={`/dashboard/links?edit=${encodeURIComponent(item.id)}`}
                      className="flex items-center gap-3 p-2.5 hover:bg-[#FAFAFB] transition-colors group cursor-pointer"
                    >
                      <div className="h-10 w-10 rounded-[5px] bg-[#FAFAFB] border border-[#ECECF0] flex items-center justify-center shrink-0 overflow-hidden">
                        {isGroup ? (
                          <Folder className="h-4 w-4 text-[#C21B5C]" />
                        ) : favUrl ? (
                          <img
                            src={favUrl}
                            alt=""
                            className="h-4 w-4 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <Link2 className="h-4 w-4 text-[#C21B5C]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-[#18181B] group-hover:text-[#C21B5C] transition-colors">
                          {titleDisplay}
                        </p>
                        <p className="truncate text-[12px] text-[#6B6B76] mt-0.5">
                          {isGroup ? "Link group" : item.url}
                        </p>
                      </div>
                      <RowCount count={summary?.rows.links[String(item.id)]} unit="click" />
                    </Link>
                  );
                })
              )}
            </div>

            <div className="p-2 border-t border-[#ECECF0] bg-white text-center mt-auto">
              <Link
                href="/dashboard/links"
                className="inline-flex items-center justify-center gap-1 text-[12px] font-semibold text-[#C21B5C] hover:text-[#A3164E] transition-colors"
              >
                <span>Open My Links →</span>
              </Link>
            </div>
          </div>
        </div>

      </section>

      {/* Brand inbox */}
      <BrandInboxCard inbox={summary?.inbox ?? null} loading={loading} onShareMediaKit={handleShareMediaKit} />

      {/* Last 7 days (one quiet line until there is activity) */}
      <WeeklyMetrics metrics={summary?.metrics ?? null} loading={loading} />

      {/* Top performers & traffic sources: only once there is something to show */}
      {!loading && hasWeeklyActivity(summary?.metrics ?? null) && (
        <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
          <TopPerformers top={summary?.top ?? null} />
          <TrafficSources sources={summary?.sources ?? null} />
        </div>
      )}

      <QuickActions addEpisodeHref={addEpisodeHref} />

      <EraProgressCard fans={effectiveTotalAudience} onShare={() => setCelebrationOpen(true)} />
      </div>

      {/* Live profile preview (wide screens), like the Series / Shop / Links pages */}
      <div className="hidden self-stretch xl:block">
        <PhonePreview username={handle} links={customLinks} products={products} refreshTrigger={summary} />
      </div>
      </div>

      {/* Share Modal */}
      <Modal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Share your Inflixo link"
        description="Share your public creator profile across your social channels."
        icon={<Share2 className="h-5 w-5" />}
        size="md"
      >
        <ModalBody className="space-y-4 p-5 sm:p-6 text-left">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center rounded-[5px] border border-[#ECECF0] bg-white overflow-hidden">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#ECECF0] bg-[#FAFAFB] text-[#6B6B76]">
                <Link2 className="h-4 w-4" />
              </span>
              <input
                type="text"
                readOnly
                value={profileUrl}
                className="h-10 flex-1 px-3 text-xs font-mono text-[#C21B5C] select-all outline-none bg-transparent"
              />
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="h-10 inline-flex items-center gap-1.5 rounded-[5px] bg-[#C21B5C] hover:bg-brand-hover px-4 text-xs font-semibold text-white transition-all shrink-0 cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <a
              onClick={() => markSetupStep("shared")}
              href={`https://wa.me/?text=${encodeURIComponent(`Check out my official creator series and links on Inflixo: ${profileUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-2.5 rounded-[5px] border border-[#ECECF0] hover:bg-[#F4F4F5] text-xs font-semibold text-[#18181B] transition-colors"
            >
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
            <a
              onClick={() => markSetupStep("shared")}
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(`Watch my latest series and check out my bio on @inflixo`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-2.5 rounded-[5px] border border-[#ECECF0] hover:bg-[#F4F4F5] text-xs font-semibold text-[#18181B] transition-colors"
            >
              <XTwitterIcon className="h-4 w-4 text-[#18181B]" />
              <span>X (Twitter)</span>
            </a>
            <a
              onClick={() => markSetupStep("shared")}
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-2.5 rounded-[5px] border border-[#ECECF0] hover:bg-[#F4F4F5] text-xs font-semibold text-[#18181B] transition-colors"
            >
              <LinkedinIcon className="h-4 w-4 text-[#0A66C2]" />
              <span>LinkedIn</span>
            </a>
            <button
              type="button"
              onClick={() => {
                markSetupStep("shared");
                setShareOpen(false);
                setQrOpen(true);
              }}
              className="flex items-center justify-center gap-2 p-2.5 rounded-[5px] border border-[#ECECF0] hover:bg-[#F4F4F5] text-xs font-semibold text-[#18181B] transition-colors cursor-pointer"
            >
              <ExternalLink className="h-4 w-4 text-[#C21B5C]" />
              <span>View QR Code</span>
            </button>
          </div>
        </ModalBody>
        <ModalFooter className="px-5 sm:px-6 py-3.5">
          <button
            type="button"
            onClick={() => setShareOpen(false)}
            className="h-10 px-5 rounded-[5px] border border-[#ECECF0] bg-white text-xs font-semibold text-[#6B6B76] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </ModalFooter>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        title="Creator QR Code"
        description="Scan with any camera to instantly open your public profile."
        icon={<QrCode className="h-5 w-5" />}
        size="sm"
      >
        <ModalBody className="flex flex-col items-center justify-center py-5 px-5 space-y-4 text-center">
          <div className="p-4 bg-white rounded-[5px] border border-[#ECECF0] shadow-sm">
            <QRCode value={profileUrl} size={180} />
          </div>
          <p className="text-xs text-[#71717A] text-center max-w-[260px]">
            Scan this QR code with any mobile camera to open @{handle}&apos;s Inflixo profile.
          </p>
        </ModalBody>
        <ModalFooter className="px-5 sm:px-6 py-3.5">
          <button
            type="button"
            onClick={() => setQrOpen(false)}
            className="h-10 px-5 rounded-[5px] border border-[#ECECF0] bg-white text-xs font-semibold text-[#6B6B76] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </ModalFooter>
      </Modal>

      {/* Creator Era Unlock Celebration Modal */}
      <CreatorEraCelebrationModal
        isOpen={celebrationOpen}
        onClose={() => setCelebrationOpen(false)}
        era={getCreatorEra(Math.max(profile.peakFanbase ?? 0, effectiveTotalAudience))}
        username={profile.username || "creator"}
        fanbase={Math.max(profile.peakFanbase ?? 0, effectiveTotalAudience)}
      />
    </PageContainer>
  );
}
