"use client";

import { Fragment, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Briefcase,
  Check,
  Clapperboard,
  Copy,
  ExternalLink,
  Eye,
  Film,
  Laptop,
  Link2,
  RefreshCw,
  Share2,
  ShoppingBag,
  Star,
  Users,
  X,
  MessageCircle,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import {
  XTwitterIcon,
  LinkedinIcon,
} from "@/components/shared/BrandIcons";
import { QRCode } from "@/components/creator-card/QRCode";
import { Modal, ModalBody } from "@/components/ui/Modal";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { buildProfileUrl, formatCount } from "@/utils/format";
import { SocialService } from "@/services/SocialService";
import { getSeriesEpisodes } from "@/lib/seriesMetrics";
import { customLinksRepository, reviewsRepository, creatorSetupRepository } from "@/repositories/localRepository";
import { MediaKitService } from "@/services/MediaKitService";
import { ProductService } from "@/services/ProductService";
import { PageContainer } from "@/components/dashboard/PageContainer";
import type { SocialAccounts, CustomLink, CreatorReview, CreatorSetupItem, MediaKitPackage, CreatorProduct } from "@/types";

interface SuggestionItem {
  id: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  text: string;
  actionLabel: string;
  actionHref: string;
}

export default function DashboardOverviewPage() {
  const {
    profile,
    socials,
    totalAudience,
    loading: profileLoading,
    series,
    isTrialExpired,
    openTrialExpiredModal,
  } = useCreator();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>([]);
  const [weekStats, setWeekStats] = useState<{ profileViews: number; seriesOpens: number; clicks: number } | null>(null);

  // Real data state from pages' sources
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [products, setProducts] = useState<CreatorProduct[]>([]);
  const [reviews, setReviews] = useState<CreatorReview[]>([]);
  const [packages, setPackages] = useState<MediaKitPackage[]>([]);
  const [setupItems, setSetupItems] = useState<CreatorSetupItem[]>([]);

  const displayName = profile.displayName || "Creator";
  const handle = (profile.username || "").replace(/^@/, "");
  const profileUrl = buildProfileUrl(handle);

  // Restore dismissed suggestions from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("inflixo_dismissed_suggestions");
      if (stored) {
        setDismissedSuggestions(JSON.parse(stored));
      }
    } catch {}
  }, []);

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

  // 7-day counts for the Quick Stats row (same API as /dashboard/analytics)
  useEffect(() => {
    let ignore = false;
    if (!profile.id && !profile.email) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch("/api/analytics?period=7d")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Unavailable"))))
      .then(({ totals: t }) => {
        if (ignore) return;
        setWeekStats({
          profileViews: Number(t.profileViews) || 0,
          seriesOpens: Number(t.seriesOpens) || 0,
          clicks: (Number(t.episodeClicks) || 0) + (Number(t.linkClicks) || 0) + (Number(t.productClicks) || 0) + (Number(t.setupClicks) || 0),
        });
      })
      .catch(() => {
        if (!ignore) setWeekStats(null);
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
    showToast(success ? "Bio link copied to clipboard! ✨" : "Could not copy link", success ? "success" : "error");
    setTimeout(() => setCopied(false), 2000);
  }

  // Dismiss a suggestion and persist
  const handleDismissSuggestion = (id: string) => {
    const updated = [...dismissedSuggestions, id];
    setDismissedSuggestions(updated);
    try {
      localStorage.setItem("inflixo_dismissed_suggestions", JSON.stringify(updated));
    } catch {}
  };

  // Effective audience and socials
  const effectiveSocials: SocialAccounts = socials;
  const effectiveTotalAudience = totalAudience > 0 ? totalAudience : SocialService.calculateTotalAudience(effectiveSocials);

  // Social sync date calculation
  const latestSyncDate = useMemo(() => {
    const dates = [
      effectiveSocials.instagram?.lastSyncedAt,
      effectiveSocials.youtube?.lastSyncedAt,
      effectiveSocials.facebook?.lastSyncedAt,
    ].filter(Boolean) as string[];
    if (dates.length === 0) return null;
    dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return dates[0];
  }, [effectiveSocials]);

  const [nowMs] = useState(() => Date.now());
  const syncDaysAgo = useMemo(() => {
    if (!latestSyncDate) return 999;
    const diffMs = nowMs - new Date(latestSyncDate).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }, [latestSyncDate, nowMs]);

  // Content Counts
  const seriesCount = series.length;
  const episodesCount = series.reduce((total, s) => total + getSeriesEpisodes(s).length, 0);
  const linksCount = customLinks.length;
  const shopCount = products.length;
  const reviewsCount = reviews.length;
  const packagesCount = packages.length;
  const gearCount = setupItems.length;

  // 1. Content Tiles Config
  const contentTiles = [
    {
      id: "series",
      label: "Series",
      count: seriesCount,
      subline: `${episodesCount} episode${episodesCount === 1 ? "" : "s"}`,
      href: "/dashboard/series",
      icon: Film,
    },
    {
      id: "links",
      label: "Links",
      count: linksCount,
      subline: `${linksCount} link${linksCount === 1 ? "" : "s"}`,
      href: "/dashboard/links",
      icon: Link2,
    },
    {
      id: "shop",
      label: "Shop items",
      count: shopCount,
      subline: `${shopCount} item${shopCount === 1 ? "" : "s"}`,
      href: "/dashboard/products",
      icon: ShoppingBag,
    },
    {
      id: "reviews",
      label: "Brand reviews",
      count: reviewsCount,
      subline: `${reviewsCount} review${reviewsCount === 1 ? "" : "s"}`,
      href: "/dashboard/reviews",
      icon: Star,
    },
    {
      id: "mediakit",
      label: "Collab packages",
      count: packagesCount,
      subline: `${packagesCount} collab package${packagesCount === 1 ? "" : "s"}`,
      href: "/dashboard/mediakit",
      icon: Briefcase,
    },
    {
      id: "gear",
      label: "My Setup",
      count: gearCount,
      subline: `${gearCount} gear item${gearCount === 1 ? "" : "s"}`,
      href: "/dashboard/setup",
      icon: Laptop,
    },
  ];

  // 2. Dynamic Suggestions Evaluation (Max 3, by strict priority order - Views > 0 rule removed)
  const candidateSuggestions: SuggestionItem[] = useMemo(() => {
    const list: SuggestionItem[] = [];

    // Priority 1: No links
    if (linksCount === 0) {
      list.push({
        id: "no-links",
        icon: Link2,
        text: "Add your tour, tickets or other accounts",
        actionLabel: "Add link",
        actionHref: "/dashboard/links",
      });
    }

    // Priority 2: Series with < 3 episodes
    const seriesWithFewEpisodes = series.find((s) => getSeriesEpisodes(s).length < 3);
    if (seriesWithFewEpisodes) {
      list.push({
        id: `few-episodes-${seriesWithFewEpisodes.id}`,
        icon: Clapperboard,
        text: `Add more episodes to '${seriesWithFewEpisodes.title || "Series"}'`,
        actionLabel: "Add episode",
        actionHref: "/dashboard/series",
      });
    }

    // Priority 3: 0 brand reviews
    if (reviewsCount === 0) {
      list.push({
        id: "no-reviews",
        icon: Star,
        text: "Add a brand review to build trust with new brands",
        actionLabel: "Add review",
        actionHref: "/dashboard/reviews",
      });
    }

    // Priority 4: 0 gear items
    if (gearCount === 0) {
      list.push({
        id: "no-gear",
        icon: Laptop,
        text: "List your camera & mic — fans keep asking",
        actionLabel: "Add gear",
        actionHref: "/dashboard/setup",
      });
    }

    // Priority 5: Channels synced > 3 days ago
    if (syncDaysAgo > 3) {
      list.push({
        id: "sync-channels",
        icon: RefreshCw,
        text: "Refresh your fan count",
        actionLabel: "Sync",
        actionHref: "/dashboard/socials",
      });
    }

    return list;
  }, [linksCount, series, reviewsCount, gearCount, syncDaysAgo]);

  const visibleSuggestions = useMemo(() => {
    return candidateSuggestions
      .filter((s) => !dismissedSuggestions.includes(s.id))
      .slice(0, 3);
  }, [candidateSuggestions, dismissedSuggestions]);

  // Tooltip content for Total Fans breakdown
  const audienceTooltip = `Instagram: ${formatCount(effectiveSocials.instagram?.followers || 0)} • YouTube: ${formatCount(effectiveSocials.youtube?.subscribers || 0)} • Facebook: ${formatCount(effectiveSocials.facebook?.followers || 0)} (synced ${syncDaysAgo > 30 ? "recently" : `${syncDaysAgo}d ago`})`;

  return (
    <PageContainer className="select-none text-left">
      {/* 1. LINK BAR (one slim row) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-3.5 bg-white border border-[#E4E4E7] rounded-[5px] shadow-2xs">
        {/* Left: 40px avatar + Name + green Live dot */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <CreatorAvatar
              src={profile.photoDataUrl}
              name={displayName}
              className="h-10 w-10 rounded-full border border-[#E4E4E7] object-cover"
            />
            <span
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white"
              title="Profile is live"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold text-[#18181B] truncate" title={displayName}>
                {displayName}
              </h2>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
            className="inline-flex h-8 items-center gap-1.5 px-2.5 rounded-[5px] bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#52525B] hover:text-[#18181B] text-[12px] font-medium transition-colors cursor-pointer group"
            title="Click to copy bio link"
          >
            <span className="truncate max-w-[140px] sm:max-w-[200px]">
              inflixo.com/{handle || "creator"}
            </span>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-[#71717A] group-hover:text-[#18181B] shrink-0" />
            )}
          </button>

          <Link
            href={`/${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center justify-center gap-1 px-3 rounded-[5px] border border-[#E4E4E7] bg-white text-[#18181B] hover:bg-[#F4F4F5] text-[12px] font-semibold transition-colors"
          >
            <span>View</span>
            <ExternalLink className="h-3 w-3 text-[#71717A]" />
          </Link>

          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="inline-flex h-8 items-center justify-center gap-1.5 px-3.5 rounded-[5px] bg-[#7A2253] text-white hover:opacity-95 text-[12px] font-semibold transition-opacity cursor-pointer shadow-2xs"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* 2. QUICK STATS (Directly under Link Bar: one slim row, small text, no cards/charts) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1 text-[13px] text-[#71717A]">
        {/* Stat 1: Total fans with tooltip */}
        <span
          className="inline-flex items-center gap-1.5 cursor-help transition-colors hover:text-[#18181B]"
          title={audienceTooltip}
        >
          <Users className="h-3.5 w-3.5 text-[#A1A1AA]" />
          <span className="font-semibold text-[#18181B]">
            {formatCount(effectiveTotalAudience)}
          </span>
          <span>total fans</span>
        </span>

        {/* Stat 2: Profile opens · Series opens · Clicks (7 days) */}
        {weekStats && (
          <>
            <span className="text-[#D4D4D8] select-none">•</span>
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-[#A1A1AA]" />
              {[
                { label: "Profile opens", value: weekStats.profileViews, hash: "totals" },
                { label: "Series opens", value: weekStats.seriesOpens, hash: "series" },
                { label: "Clicks", value: weekStats.clicks, hash: "links" },
              ].map((stat, i) => (
                <Fragment key={stat.hash}>
                  {i > 0 && <span className="text-[#D4D4D8] select-none">·</span>}
                  <Link href={`/dashboard/analytics#${stat.hash}`} className="inline-flex items-center gap-1 hover:text-[#18181B] transition-colors">
                    <span className="font-semibold text-[#18181B]">{formatCount(stat.value)}</span>
                    <span>{stat.label}</span>
                  </Link>
                </Fragment>
              ))}
              <span className="text-[#A1A1AA]">(7 days)</span>
            </span>
          </>
        )}

        <span className="text-[#D4D4D8] select-none">•</span>

        {/* Small text link: See analytics → */}
        <Link
          href="/dashboard/analytics"
          className="font-medium text-[#7A2253] hover:underline inline-flex items-center gap-1 transition-colors"
        >
          <span>See analytics</span>
          <span>→</span>
        </Link>
      </div>

      {/* 3. YOUR CONTENT (count tiles — one row, 6 small tiles, 3 per row on tablet, 2 on mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {loading || profileLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col justify-between p-3.5 bg-white border border-[#E4E4E7] rounded-[5px] animate-pulse space-y-3"
            >
              <div className="h-4.5 w-4.5 rounded bg-[#F4F4F5]" />
              <div className="space-y-1.5">
                <div className="h-6 w-10 rounded bg-[#F4F4F5]" />
                <div className="h-3 w-16 rounded bg-[#F4F4F5]" />
                <div className="h-2.5 w-12 rounded bg-[#F4F4F5]" />
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
                className="flex flex-col justify-between p-3.5 bg-white border border-[#E4E4E7] hover:border-[#CBD5E1] rounded-[5px] transition-all hover:shadow-xs group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <Icon
                    className="h-4.5 w-4.5 text-[#71717A] group-hover:text-[#7A2253] transition-colors"
                    strokeWidth={1.75}
                  />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-[#18181B] tracking-tight leading-none">
                    {tile.count}
                  </div>
                  <div className="text-[13px] font-semibold text-[#18181B] mt-1 truncate">
                    {tile.label}
                  </div>
                  {tile.count === 0 ? (
                    <div className="text-[11px] font-semibold text-[#7A2253] hover:underline flex items-center gap-0.5 mt-0.5">
                      Add first →
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#71717A] mt-0.5 truncate">
                      {tile.subline}
                    </div>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* 4. SUGGESTIONS (one card, max 3 items, dynamic) */}
      {visibleSuggestions.length > 0 && (
        <div className="bg-white border border-[#E4E4E7] rounded-[5px] p-4 sm:p-5 space-y-3 shadow-2xs">
          <h3 className="text-[15px] font-bold text-[#18181B]">Next steps</h3>
          <div className="space-y-2">
            {visibleSuggestions.map((sug) => {
              const Icon = sug.icon;
              return (
                <div
                  key={sug.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-[5px] bg-[#FBFBFC] border border-[#F4F4F5] hover:border-[#E4E4E7] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#7A2253]/[0.08] text-[#7A2253] shrink-0">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <p className="text-[13px] font-medium text-[#18181B] truncate">{sug.text}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={sug.actionHref}
                      className="inline-flex h-7 items-center justify-center px-3 rounded-[5px] bg-[#7A2253] hover:bg-[#681c45] text-white text-[12px] font-semibold transition-colors shadow-2xs"
                    >
                      {sug.actionLabel}
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDismissSuggestion(sug.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-[5px] text-[#A1A1AA] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors cursor-pointer"
                      aria-label="Dismiss suggestion"
                      title="Dismiss"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Share Modal */}
      <Modal isOpen={shareOpen} onClose={() => setShareOpen(false)} title="Share your Inflixo link">
        <ModalBody className="space-y-4">
          <div className="flex items-center gap-2 p-2 rounded-[5px] bg-[#F4F4F5] border border-[#E4E4E7]">
            <input
              type="text"
              readOnly
              value={profileUrl}
              className="flex-1 bg-transparent text-[13px] text-[#18181B] font-mono outline-none px-1"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[5px] bg-[#7A2253] text-white text-xs font-semibold hover:opacity-95 transition-opacity"
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
      </Modal>

      {/* QR Code Modal */}
      <Modal isOpen={qrOpen} onClose={() => setQrOpen(false)} title="Creator QR Code">
        <ModalBody className="flex flex-col items-center justify-center py-4 space-y-4">
          <div className="p-4 bg-white rounded-[5px] border border-[#E4E4E7] shadow-sm">
            <QRCode value={profileUrl} size={180} />
          </div>
          <p className="text-xs text-[#71717A] text-center max-w-[260px]">
            Scan this QR code with any mobile camera to open @{handle}&apos;s Inflixo profile.
          </p>
        </ModalBody>
      </Modal>
    </PageContainer>
  );
}
