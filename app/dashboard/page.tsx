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
  Laptop,
  Link2,
  MousePointerClick,
  Share2,
  ShoppingBag,
  Sparkles,
  Star,
  Users,
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
import { PageContainer } from "@/components/dashboard/PageContainer";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PAGE_COPY } from "@/components/dashboard/pageCopy";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { StatGrid, StatTile } from "@/components/dashboard/StatTile";
import type {
  SocialAccounts,
  CustomLink,
  CreatorReview,
  CreatorSetupItem,
  MediaKitPackage,
  CreatorProduct,
} from "@/types";
import { getCreatorEra, formatFans } from "@/lib/creatorEra";
import { CreatorEraProgressCard } from "@/components/shared/CreatorEraProgressCard";
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

  const displayName = profile.displayName || "Creator";
  const handle = (profile.username || "").replace(/^@/, "");
  const profileUrl = buildProfileUrl(handle);

  // Fetch real count data on mount from exact pages' storage / repositories
  useEffect(() => {
    try {
      // 1. Links
      const storedLinks = customLinksRepository.get();
      setCustomLinks(Array.isArray(storedLinks) ? storedLinks : []);

      // 2. Reviews
      const storedReviews = reviewsRepository.getAll();
      setReviews(Array.isArray(storedReviews) ? storedReviews : []);

      // 3. Collab packages
      const storedPkgs = MediaKitService.getPackages();
      setPackages(Array.isArray(storedPkgs) ? storedPkgs : []);

      // 4. Setup gear items
      const storedSetup = creatorSetupRepository.getAll();
      setSetupItems(Array.isArray(storedSetup) ? storedSetup : []);

      // 5. Products / Shop items
      ProductService.list()
        .then((items) => setProducts(Array.isArray(items) ? items : []))
        .catch(() => setProducts([]));
    } catch (e) {
      console.warn("Failed to read local repositories:", e);
    }
  }, []);

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

  // Content Counts
  const seriesCount = series.length;
  const episodesCount = series.reduce((total, s) => total + getSeriesEpisodes(s).length, 0);
  const linksCount = customLinks.length;
  const shopCount = products.length;
  const reviewsCount = reviews.length;
  const packagesCount = packages.length;
  const gearCount = setupItems.length;

  // 1. Content Tiles Config (Tiles 3 per row on desktop, 2 on mobile)
  const contentTiles = [
    {
      id: "series",
      label: episodesCount > 0 ? `Series | ${episodesCount} episode${episodesCount === 1 ? "" : "s"}` : "Series",
      count: seriesCount,
      href: "/dashboard/series",
      icon: Film,
    },
    {
      id: "links",
      label: "Links",
      count: linksCount,
      subline: null,
      href: "/dashboard/links",
      icon: Link2,
    },
    {
      id: "shop",
      label: "Shop",
      count: shopCount,
      subline: null,
      href: "/dashboard/products",
      icon: ShoppingBag,
    },
    {
      id: "gear",
      label: "My Setup",
      count: gearCount,
      subline: null,
      href: "/dashboard/setup",
      icon: Laptop,
    },
    {
      id: "reviews",
      label: "Brand reviews",
      count: reviewsCount,
      subline: null,
      href: "/dashboard/reviews",
      icon: Star,
    },
    {
      id: "mediakit",
      label: "Collab packages",
      count: packagesCount,
      subline: null,
      href: "/dashboard/mediakit",
      icon: Briefcase,
    },
  ];

  // 2. Top this week columns (Max 3 rows per column)
  const topSeries = useMemo(() => {
    const list = analyticsItems?.series || [];
    return list.filter((s) => (s.opens || 0) + (s.episodeClicks || 0) > 0).slice(0, 3);
  }, [analyticsItems]);

  const topProducts = useMemo(() => {
    const list = analyticsItems?.products || [];
    return list.filter((p) => (p.clicks || 0) > 0).slice(0, 3);
  }, [analyticsItems]);

  const topLinks = useMemo(() => {
    const list = analyticsItems?.links || [];
    return list.filter((l) => (l.clicks || 0) > 0).slice(0, 3);
  }, [analyticsItems]);

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
      <section className="space-y-3.5">
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

        <CreatorEraProgressCard
          fanbase={effectiveTotalAudience}
          peakFanbase={profile.peakFanbase}
          showShareButton
          onShareClick={() => setCelebrationOpen(true)}
        />

        <StatGrid className="lg:grid-cols-4">
          <StatTile
            icon={<Users className="h-[30px] w-[30px]" strokeWidth={2.25} />}
            value={formatFans(effectiveTotalAudience)}
            label="Total fans"
          />
          <StatTile
            icon={<Eye className="h-[30px] w-[30px]" strokeWidth={2.25} />}
            value={loading ? "..." : formatCount(weekStats?.profileViews ?? 0)}
            label="Profile opens"
          />
          <StatTile
            icon={<Film className="h-[30px] w-[30px]" strokeWidth={2.25} />}
            value={loading ? "..." : formatCount(weekStats?.seriesOpens ?? 0)}
            label="Series opens"
          />
          <StatTile
            icon={<MousePointerClick className="h-[30px] w-[30px]" strokeWidth={2.25} />}
            value={loading ? "..." : formatCount(weekStats?.clicks ?? 0)}
            label="Clicks"
          />
        </StatGrid>
      </section>

      {/* 3. SECTION: YOUR CONTENT */}
      <section>
        <SectionHeader
          title="Your content"
          subtitle="Manage your portfolio, storefront, and audience assets"
          icon={<Film className="h-4 w-4 text-[#7A2253]" />}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
          {loading || profileLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-stretch bg-white border border-[#ECECF0] rounded-[5px] min-h-[64px] sm:min-h-[68px] overflow-hidden animate-pulse"
              >
                <div className="w-[64px] sm:w-[68px] shrink-0 bg-[#F4F4F5] border-r border-[#ECECF0]" />
                <div className="p-2 sm:p-2.5 flex-1 min-w-0 flex flex-col justify-center space-y-1">
                  <div className="h-4 w-12 rounded bg-[#F4F4F5]" />
                  <div className="h-2.5 w-16 rounded bg-[#F4F4F5]" />
                </div>
              </div>
            ))
          ) : (
            contentTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <Link
                  key={tile.id}
                  href={tile.href}
                  className="flex items-stretch rounded-[5px] border border-[#ECECF0] hover:border-[#CBD5E1] bg-white overflow-hidden transition-colors group cursor-pointer min-h-[64px] sm:min-h-[68px]"
                >
                  <div className="flex w-[64px] sm:w-[68px] shrink-0 items-center justify-center border-r border-[#ECECF0] bg-[#FAFAFB] text-[#7A2253] group-hover:bg-[#F7EEF2] transition-colors [&>svg]:h-[30px] [&>svg]:w-[30px] [&>svg]:stroke-[2.25]">
                    <Icon className="h-[30px] w-[30px]" strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0 flex-1 p-3 sm:p-3.5 flex flex-col justify-center">
                    <div className="text-[18px] sm:text-[20px] font-semibold leading-tight text-[#18181B] whitespace-nowrap tabular-nums">
                      {tile.count}
                    </div>
                    <div className="mt-0.5 text-[12px] font-normal leading-normal text-[#6B6B76] truncate">
                      {tile.label}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* 4. SECTION: TOP THIS WEEK */}
      <SectionCard
        title="Top this week"
        subtitle="Most opened and clicked in the last 7 days"
        icon={<Star className="h-4 w-4 text-[#7A2253]" />}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <h3 className="text-[14px] font-semibold text-[#18181B]">Top series</h3>
              {topSeries.length === 0 ? (
                <p className="py-2 text-[12px] text-[#6B6B76]">No activity yet</p>
              ) : (
                <div className="space-y-1.5">
                  {topSeries.map((item) => (
                    <Link
                      key={item.id}
                      href="/dashboard/analytics#series"
                      className="group flex items-center justify-between gap-2 rounded-[5px] border border-[#ECECF0] bg-[#FAFAFB] p-2.5 transition-colors hover:bg-white cursor-pointer"
                    >
                      <span className="truncate text-[13px] font-medium text-[#18181B] transition-colors group-hover:text-[#7A2253]" title={item.title}>
                        {item.title}
                      </span>
                      <span className="inline-flex shrink-0 items-center h-6 rounded-[5px] bg-white border border-[#ECECF0] px-2 text-[12px] font-medium text-[#6B6B76]">
                        {item.opens > 0
                          ? `${item.opens} opens`
                          : `${item.episodeClicks} clicks`}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-[14px] font-semibold text-[#18181B]">Top products</h3>
              {topProducts.length === 0 ? (
                <p className="py-2 text-[12px] text-[#6B6B76]">No activity yet</p>
              ) : (
                <div className="space-y-1.5">
                  {topProducts.map((item) => (
                    <Link
                      key={item.id}
                      href="/dashboard/analytics#products"
                      className="group flex items-center justify-between gap-2 rounded-[5px] border border-[#ECECF0] bg-[#FAFAFB] p-2.5 transition-colors hover:bg-white cursor-pointer"
                    >
                      <span className="truncate text-[13px] font-medium text-[#18181B] transition-colors group-hover:text-[#7A2253]" title={item.name}>
                        {item.name}
                      </span>
                      <span className="inline-flex shrink-0 items-center h-6 rounded-[5px] bg-white border border-[#ECECF0] px-2 text-[12px] font-medium text-[#6B6B76]">
                        {item.clicks} clicks
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-[14px] font-semibold text-[#18181B]">Top links</h3>
              {topLinks.length === 0 ? (
                <p className="py-2 text-[12px] text-[#6B6B76]">No activity yet</p>
              ) : (
                <div className="space-y-1.5">
                  {topLinks.map((item) => (
                    <Link
                      key={item.id}
                      href="/dashboard/analytics#links"
                      className="group flex items-center justify-between gap-2 rounded-[5px] border border-[#ECECF0] bg-[#FAFAFB] p-2.5 transition-colors hover:bg-white cursor-pointer"
                    >
                      <span className="truncate text-[13px] font-medium text-[#18181B] transition-colors group-hover:text-[#7A2253]" title={item.title}>
                        {item.title}
                      </span>
                      <span className="inline-flex shrink-0 items-center h-6 rounded-[5px] bg-white border border-[#ECECF0] px-2 text-[12px] font-medium text-[#6B6B76]">
                        {item.clicks} clicks
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
        </div>
      </SectionCard>

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
