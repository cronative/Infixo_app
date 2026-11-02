"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Briefcase,
  Check,
  Copy,
  ExternalLink,
  Eye,
  Film,
  Folder,
  Inbox,
  Laptop,
  Link2,
  MousePointerClick,
  Plus,
  Share2,
  ShoppingBag,
  Sparkles,
  Users,
  MessageCircle,
  MessageSquare,
  QrCode,
  Heart,
  ArrowRight,
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
import { buildProfileUrl, formatCount } from "@/utils/format";
import { SocialService } from "@/services/SocialService";
import { getSeriesEpisodes } from "@/lib/seriesMetrics";
import {
  customLinksRepository,
  reviewsRepository,
  creatorSetupRepository,
} from "@/repositories/localRepository";
import { MediaKitService } from "@/services/MediaKitService";
import { ProductService } from "@/services/ProductService";
import { LinkService } from "@/services/LinkService";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PAGE_COPY } from "@/components/dashboard/pageCopy";
import { StatTile } from "@/components/dashboard/StatTile";
import type {
  SocialAccounts,
  CustomLink,
  CreatorReview,
  CreatorSetupItem,
  MediaKitPackage,
  CreatorProduct,
} from "@/types";
import { getCreatorEra, formatFans } from "@/lib/creatorEra";
import { CreatorEraCelebrationModal } from "@/components/shared/CreatorEraCelebrationModal";
import { SetupChecklist } from "@/components/dashboard/SetupChecklist";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning 👋";
  if (hour < 18) return "Good afternoon 👋";
  return "Good evening 👋";
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

function SectionHeader({ title, subtitle, icon, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-2.5">
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] bg-[#F7EEF2] text-[#7A2253]">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-[16px] font-semibold text-[#18181B] leading-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[12px] text-[#6B6B76] font-normal mt-0.5 leading-tight">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export default function DashboardOverviewPage() {
  const {
    profile,
    socials,
    totalAudience,
    loading: profileLoading,
    series,
    theme,
    isTrialExpired,
    openTrialExpiredModal,
  } = useCreator();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [celebrationOpen, setCelebrationOpen] = useState(false);

  useEffect(() => {
    if (profile.eraUnlockedPending) {
      setCelebrationOpen(true);
    }
  }, [profile.eraUnlockedPending]);

  // Analytics 7d data
  const [weekStats, setWeekStats] = useState<{
    profileViews: number;
    seriesOpens: number;
    clicks: number;
  } | null>(null);

  const [analyticsItems, setAnalyticsItems] = useState<{
    series: { id: string; title: string; opens: number; episodeClicks: number }[];
    links: { id: string; title: string; clicks: number }[];
    products: { id: string; name: string; clicks: number }[];
  } | null>(null);

  // Real data state from pages' sources
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [products, setProducts] = useState<CreatorProduct[]>([]);
  const [reviews, setReviews] = useState<CreatorReview[]>([]);
  const [packages, setPackages] = useState<MediaKitPackage[]>([]);
  const [setupItems, setSetupItems] = useState<CreatorSetupItem[]>([]);
  const [unreadRequestsCount, setUnreadRequestsCount] = useState<number>(0);
  const [latestFanNudge, setLatestFanNudge] = useState<any | null>(null);

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

      // 2. Reviews
      const storedReviews = reviewsRepository.getAll();
      setReviews(Array.isArray(storedReviews) ? storedReviews : []);

      // 3. Setup gear items
      const storedSetup = creatorSetupRepository.getAll();
      setSetupItems(Array.isArray(storedSetup) ? storedSetup : []);

      // 4. Products / Shop items
      ProductService.list()
        .then((items) => setProducts(Array.isArray(items) ? items : []))
        .catch(() => setProducts([]));
    } catch (e) {
      console.warn("Failed to read local repositories:", e);
    }
  }, []);

  // Collab packages & requests: use the exact same source as Media Kit / Requests pages
  useEffect(() => {
    const creatorLookup = profile.id || profile.email || profile.username;
    if (!creatorLookup) return;

    MediaKitService.fetchFromDb(profile.email || profile.username || creatorLookup, profile.id)
      .then(({ packages: dbPackages }) => {
        if (Array.isArray(dbPackages)) {
          setPackages(dbPackages);
        }
      })
      .catch(() => {});

    const fetchRequests = () => {
      fetch(`/api/creator/requests?creatorId=${encodeURIComponent(creatorLookup)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const reqList = data?.data?.requests || data?.requests;
          const unread = data?.data?.unreadCount ?? data?.unreadCount ?? (Array.isArray(reqList) ? reqList.filter((r: any) => r.status === "NEW").length : 0);
          setUnreadRequestsCount(Number(unread) || 0);
        })
        .catch(() => {});
    };

    fetchRequests();
    window.addEventListener("collab-requests-updated", fetchRequests);
    return () => window.removeEventListener("collab-requests-updated", fetchRequests);
  }, [profile.id, profile.email, profile.username]);

  // 7-day counts & top items from GET /api/analytics?period=7d
  useEffect(() => {
    let ignore = false;
    if (!profile.id && !profile.email) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch("/api/analytics?period=7d")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Unavailable"))))
      .then((data) => {
        if (ignore) return;
        const t = data?.totals || {};
        setWeekStats({
          profileViews: Number(t.profileViews) || 0,
          seriesOpens: Number(t.seriesOpens) || 0,
          clicks:
            (Number(t.episodeClicks) || 0) +
            (Number(t.linkClicks) || 0) +
            (Number(t.productClicks) || 0) +
            (Number(t.setupClicks) || 0),
        });

        if (data?.items) {
          setAnalyticsItems({
            series: Array.isArray(data.items.series) ? data.items.series : [],
            links: Array.isArray(data.items.links) ? data.items.links : [],
            products: Array.isArray(data.items.products) ? data.items.products : [],
          });
        }
      })
      .catch(() => {
        if (!ignore) {
          setWeekStats(null);
          setAnalyticsItems(null);
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [profile.id, profile.email]);

  // Copy Profile URL Handler
  async function handleCopyLink() {
    if (isTrialExpired) {
      showToast("Public profile is currently hidden (Free trial ended)", "error");
      openTrialExpiredModal();
      return;
    }
    const success = await copyToClipboard(profileUrl);
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
  const currentEra = getCreatorEra(effectiveTotalAudience);

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

  const hasPickedTheme = Boolean(
    (theme && theme !== "inflixo-maroon") ||
      (profile.themeKey && profile.themeKey !== "inflixo-maroon")
  );

  return (
    <PageContainer className="select-none text-left">
      <PageHeader eyebrow={getGreeting()} {...PAGE_COPY.dashboard} />

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
            className="inline-flex h-8 items-center justify-center gap-1.5 px-3.5 rounded-[5px] bg-[#7A2253] text-white hover:opacity-95 text-[13px] font-medium transition-opacity cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Motivational Fan Nudge Alert (if fan visited & profile incomplete) */}
      {latestFanNudge && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-[5px] border border-[#fbcfe8] bg-[#fdf2f8] text-[#7A2253] animate-fade-in shadow-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-[4px] bg-white border border-[#fbcfe8] flex items-center justify-center shrink-0">
              <Heart className="h-4 w-4 fill-[#7A2253] text-[#7A2253]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-[13px] font-bold text-[#18181B] leading-tight">
                A fan visited your profile and wants to connect! ✨
              </p>
              <p className="text-[11.5px] text-[#7A2253] mt-0.5 leading-tight truncate">
                Add your bio and social accounts to welcome them to your space.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-[5px] bg-[#7A2253] text-white text-xs font-semibold hover:opacity-95 shrink-0 transition-opacity"
          >
            <span>Complete Profile</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* 2. SETUP CHECKLIST (Linktree-style interactive onboarding) */}
      <SetupChecklist
        profile={profile}
        socials={socials}
        seriesCount={seriesCount}
        linksCount={linksCount}
        hasPickedTheme={hasPickedTheme}
        onShare={() => setShareOpen(true)}
        onCopyLink={handleCopyLink}
      />

      {/* 2. SECTION: THIS WEEK */}
      <section className="space-y-3">
        <SectionHeader
          title="This week"
          subtitle="Overview of your reach and engagement across Inflixo"
          icon={<Sparkles className="h-4 w-4 text-[#7A2253]" />}
          action={
            <Link
              href="/dashboard/analytics"
              className="text-[13px] font-medium text-[#7A2253] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>See all analytics</span>
              <span>→</span>
            </Link>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
          <StatTile
            icon={<Users className="h-[30px] w-[30px]" strokeWidth={2.25} />}
            value={
              <div className="flex items-center gap-2 flex-wrap">
                <span>{formatFans(effectiveTotalAudience)}</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-[5px] text-[11px] font-semibold bg-[#F7EEF2] text-[#7A2253] border border-[#7A2253]/20">
                  {currentEra?.badge || "Rising Bronze"}
                </span>
              </div>
            }
            label="Total fans"
            action={
              <button
                type="button"
                onClick={() => setCelebrationOpen(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[11px] font-semibold text-[#7A2253] bg-[#F7EEF2] hover:bg-[#F2DFE8] transition-colors border border-[#7A2253]/20 cursor-pointer"
                title="Share your Creator Era badge"
              >
                <Sparkles className="h-3 w-3" />
                <span>Share Era</span>
              </button>
            }
          />
          <StatTile
            icon={<Eye className="h-[30px] w-[30px]" strokeWidth={2.25} />}
            value={loading ? "..." : formatCount(weekStats?.profileViews ?? 0)}
            label="Profile opens"
          />
          <StatTile
            icon={<MousePointerClick className="h-[30px] w-[30px]" strokeWidth={2.25} />}
            value={loading ? "..." : formatCount(weekStats?.clicks ?? 0)}
            label="Clicks"
          />
        </div>
      </section>

      {/* 3. SECTION: CONTENT & STOREFRONT */}
      <section className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Card 1: Series */}
          <div className="rounded-[5px] border border-[#ECECF0] bg-white flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#ECECF0] bg-[#FAFAFB]">
              <h3 className="text-[13.5px] font-semibold text-[#18181B]">
                Series ({series.length})
              </h3>
              <Link
                href="/dashboard/series?new=true"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-[5px] bg-[#7A2253] text-white text-[11.5px] font-semibold hover:bg-[#681c46] transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </Link>
            </div>

            <div className="flex-1 max-h-[280px] overflow-y-auto divide-y divide-[#F4F4F5]">
              {sortedSeries.length === 0 ? (
                <div className="py-8 px-4 text-center flex flex-col items-center justify-center">
                  <p className="text-[13px] font-medium text-[#18181B]">No series yet</p>
                  <Link
                    href="/dashboard/series?new=true"
                    className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 rounded-[5px] bg-[#7A2253] text-white text-[12px] font-semibold hover:bg-[#681c46] transition-colors cursor-pointer"
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
                          className="h-10 w-10 rounded-[4px] object-cover shrink-0 bg-[#F4F4F5] border border-[#ECECF0]"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-[4px] bg-[#F7EEF2] text-[#7A2253] flex items-center justify-center shrink-0 border border-[#7A2253]/10">
                          <Film className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-[#18181B] group-hover:text-[#7A2253] transition-colors">
                          {item.title}
                        </p>
                        <p className="text-[11.5px] text-[#6B6B76] mt-0.5">
                          {epCount} episode{epCount === 1 ? "" : "s"}
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            <div className="p-2 border-t border-[#ECECF0] bg-white text-center mt-auto">
              <Link
                href="/dashboard/series"
                className="inline-flex items-center justify-center gap-1 text-[12px] font-semibold text-[#7A2253] hover:text-[#681c46] transition-colors"
              >
                <span>Manage →</span>
              </Link>
            </div>
          </div>

          {/* Card 2: Shop */}
          <div className="rounded-[5px] border border-[#ECECF0] bg-white flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#ECECF0] bg-[#FAFAFB]">
              <h3 className="text-[13.5px] font-semibold text-[#18181B]">
                Shop ({products.length})
              </h3>
              <Link
                href="/dashboard/products?new=true"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-[5px] bg-[#7A2253] text-white text-[11.5px] font-semibold hover:bg-[#681c46] transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </Link>
            </div>

            <div className="flex-1 max-h-[280px] overflow-y-auto divide-y divide-[#F4F4F5]">
              {sortedProducts.length === 0 ? (
                <div className="py-8 px-4 text-center flex flex-col items-center justify-center">
                  <p className="text-[13px] font-medium text-[#18181B]">No products yet</p>
                  <Link
                    href="/dashboard/products?new=true"
                    className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 rounded-[5px] bg-[#7A2253] text-white text-[12px] font-semibold hover:bg-[#681c46] transition-colors cursor-pointer"
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
                          className="h-10 w-10 rounded-[4px] object-cover shrink-0 bg-[#F4F4F5] border border-[#ECECF0]"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-[4px] bg-[#F7EEF2] text-[#7A2253] flex items-center justify-center shrink-0 border border-[#7A2253]/10">
                          <ShoppingBag className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-[#18181B] group-hover:text-[#7A2253] transition-colors">
                          {item.name}
                        </p>
                        <p className="text-[11.5px] font-semibold text-[#18181B] mt-0.5">
                          {priceText}
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            <div className="p-2 border-t border-[#ECECF0] bg-white text-center mt-auto">
              <Link
                href="/dashboard/products"
                className="inline-flex items-center justify-center gap-1 text-[12px] font-semibold text-[#7A2253] hover:text-[#681c46] transition-colors"
              >
                <span>Manage →</span>
              </Link>
            </div>
          </div>

          {/* Card 3: Links */}
          <div className="rounded-[5px] border border-[#ECECF0] bg-white flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#ECECF0] bg-[#FAFAFB]">
              <h3 className="text-[13.5px] font-semibold text-[#18181B]">
                Links ({customLinks.length})
              </h3>
              <Link
                href="/dashboard/links?new=true"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-[5px] bg-[#7A2253] text-white text-[11.5px] font-semibold hover:bg-[#681c46] transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </Link>
            </div>

            <div className="flex-1 max-h-[280px] overflow-y-auto divide-y divide-[#F4F4F5]">
              {sortedLinks.length === 0 ? (
                <div className="py-8 px-4 text-center flex flex-col items-center justify-center">
                  <p className="text-[13px] font-medium text-[#18181B]">No links yet</p>
                  <Link
                    href="/dashboard/links?new=true"
                    className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 rounded-[5px] bg-[#7A2253] text-white text-[12px] font-semibold hover:bg-[#681c46] transition-colors cursor-pointer"
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
                      <div className="h-10 w-10 rounded-[4px] bg-[#FAFAFB] border border-[#ECECF0] flex items-center justify-center shrink-0 overflow-hidden">
                        {isGroup ? (
                          <Folder className="h-4 w-4 text-[#7A2253]" />
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
                          <Link2 className="h-4 w-4 text-[#7A2253]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-[#18181B] group-hover:text-[#7A2253] transition-colors">
                          {titleDisplay}
                        </p>
                        <p className="truncate text-[11.5px] text-[#6B6B76] mt-0.5">
                          {isGroup ? "Link group" : item.url}
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            <div className="p-2 border-t border-[#ECECF0] bg-white text-center mt-auto">
              <Link
                href="/dashboard/links"
                className="inline-flex items-center justify-center gap-1 text-[12px] font-semibold text-[#7A2253] hover:text-[#681c46] transition-colors"
              >
                <span>Manage →</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Compact Chip Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Link
            href="/dashboard/reviews"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] border border-[#ECECF0] bg-white hover:border-[#CBD5E1] hover:bg-[#FAFAFB] text-[12px] font-medium text-[#18181B] transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5 text-[#7A2253]" />
            <span>Brand reviews ({reviews.length})</span>
          </Link>

          <Link
            href="/dashboard/requests"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] border border-[#ECECF0] bg-white hover:border-[#CBD5E1] hover:bg-[#FAFAFB] text-[12px] font-medium text-[#18181B] transition-colors"
          >
            <Inbox className="h-3.5 w-3.5 text-[#7A2253]" />
            <span>Collab requests</span>
            {unreadRequestsCount > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold bg-[#EAF7F0] text-[#17845B] border border-[#17845B]/20">
                {unreadRequestsCount} new
              </span>
            )}
          </Link>

          <Link
            href="/dashboard/mediakit"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] border border-[#ECECF0] bg-white hover:border-[#CBD5E1] hover:bg-[#FAFAFB] text-[12px] font-medium text-[#18181B] transition-colors"
          >
            <Briefcase className="h-3.5 w-3.5 text-[#7A2253]" />
            <span>Media kit</span>
          </Link>

          <Link
            href="/dashboard/setup"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] border border-[#ECECF0] bg-white hover:border-[#CBD5E1] hover:bg-[#FAFAFB] text-[12px] font-medium text-[#18181B] transition-colors"
          >
            <Laptop className="h-3.5 w-3.5 text-[#7A2253]" />
            <span>My Setup ({setupItems.length})</span>
          </Link>
        </div>
      </section>

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
            <div className="flex-1 flex items-center rounded-[5px] border border-[#e2e8f0] bg-white overflow-hidden">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                <Link2 className="h-4 w-4" />
              </span>
              <input
                type="text"
                readOnly
                value={profileUrl}
                className="h-10 flex-1 px-3 text-xs font-mono text-[#7A2253] select-all outline-none bg-transparent"
              />
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="h-10 inline-flex items-center gap-1.5 rounded-[5px] bg-[#7A2253] hover:bg-brand-hover px-4 text-xs font-semibold text-white transition-all shrink-0 cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Check out my official creator series and links on Inflixo: ${profileUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-2.5 rounded-[5px] border border-[#E4E4E7] hover:bg-[#F4F4F5] text-xs font-semibold text-[#18181B] transition-colors"
            >
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(`Watch my latest series and check out my bio on @inflixo`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-2.5 rounded-[5px] border border-[#E4E4E7] hover:bg-[#F4F4F5] text-xs font-semibold text-[#18181B] transition-colors"
            >
              <XTwitterIcon className="h-4 w-4 text-[#18181B]" />
              <span>X (Twitter)</span>
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-2.5 rounded-[5px] border border-[#E4E4E7] hover:bg-[#F4F4F5] text-xs font-semibold text-[#18181B] transition-colors"
            >
              <LinkedinIcon className="h-4 w-4 text-[#0A66C2]" />
              <span>LinkedIn</span>
            </a>
            <button
              type="button"
              onClick={() => {
                setShareOpen(false);
                setQrOpen(true);
              }}
              className="flex items-center justify-center gap-2 p-2.5 rounded-[5px] border border-[#E4E4E7] hover:bg-[#F4F4F5] text-xs font-semibold text-[#18181B] transition-colors cursor-pointer"
            >
              <ExternalLink className="h-4 w-4 text-[#7A2253]" />
              <span>View QR Code</span>
            </button>
          </div>
        </ModalBody>
        <ModalFooter className="px-5 sm:px-6 py-3.5">
          <button
            type="button"
            onClick={() => setShareOpen(false)}
            className="h-10 px-5 rounded-[5px] border border-[#e2e8f0] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer"
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
          <div className="p-4 bg-white rounded-[5px] border border-[#e2e8f0] shadow-sm">
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
            className="h-10 px-5 rounded-[5px] border border-[#e2e8f0] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer"
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
