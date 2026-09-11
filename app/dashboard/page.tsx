"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Layers,
  Plus,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Film,
  Edit2,
  ChevronRight,
  Copy,
  Briefcase,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { formatCount, formatSyncDate } from "@/utils/format";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { canCreateSeries, getPlanQuota } from "@/services/subscriptionLimits";
import { LimitReachedModal } from "@/components/ui/LimitReachedModal";
import { reviewsRepository, customLinksRepository } from "@/repositories/localRepository";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { MediaKitPackage, CreatorReview, CustomLink, Episode } from "@/types";

// Smooth count-up animation hook for metric reveals
function useCountUp(target: number, durationMs = 800, delayMs = 150): number {
  const [count, setCount] = useState(target);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const timer = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
        const easeOut = 1 - Math.pow(1 - progress, 4);
        setCount(Math.round(easeOut * target));
        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setCount(target);
        }
      };
      animationFrameId = requestAnimationFrame(step);
    }, delayMs);

    return () => {
      clearTimeout(timer);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [target, durationMs, delayMs]);

  return count;
}

export default function DashboardOverviewPage() {
  const router = useRouter();
  const { profile, socials, series, totalAudience, subscription, refresh } = useCreator();
  const { showToast } = useToast();

  const [isSyncing, setIsSyncing] = useState(false);
  const [packages, setPackages] = useState<MediaKitPackage[]>([]);
  const [reviews] = useState<CreatorReview[]>(() => reviewsRepository.getAll());
  const [customLinks, setCustomLinks] = useState<CustomLink[]>(() => customLinksRepository.get());

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "series" | "episode";
    seriesTitle?: string;
  }>({
    isOpen: false,
    type: "series",
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleStr = profile.username || "username";
  const displayName = profile.displayName || profile.email?.split("@")[0] || "Creator";
  const planKey = subscription?.planKey || "early_access";
  const quota = getPlanQuota(planKey);
  const showQuotaPanel = planKey !== "early_access";

  // Load packages, reviews, custom links & collaboration requests from local & DB
  useEffect(() => {
    const ident = profile.id || profile.email || profile.username;
    if (ident) {
      const query = profile.email
        ? `email=${encodeURIComponent(profile.email)}`
        : `username=${encodeURIComponent(profile.username || "")}`;

      fetch(`/api/creator/custom-links?${query}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.links)) {
            setCustomLinks(data.links);
            customLinksRepository.save(data.links);
          }
        })
        .catch(() => { });

      const mkQuery = profile.id ? `creatorId=${encodeURIComponent(profile.id)}` : profile.email ? `email=${encodeURIComponent(profile.email)}` : `username=${encodeURIComponent(profile.username || "")}`;
      fetch(`/api/creator/mediakit?${mkQuery}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.packages)) {
            setPackages(data.packages);
          }
        })
        .catch(() => { });

    }
  }, [profile]);

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

  async function handleRefreshStats() {
    setIsSyncing(true);
    try {
      await refresh();
      showToast("Audience stats refreshed! ✨");
    } catch {
      showToast("Audience stats refreshed! ✨");
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
      }, 400);
    }
  }

  const handleCreateSeriesClick = useCallback(() => {
    if (!canCreateSeries(series, planKey)) {
      setModalState({ isOpen: true, type: "series" });
    } else {
      router.push("/dashboard/series");
    }
  }, [planKey, router, series]);

  // Social account count
  const connectedSocialsCount = useMemo(() => {
    let count = 0;
    if (socials.instagram?.username || socials.instagram?.url) count++;
    if (socials.youtube?.username || socials.youtube?.url) count++;
    if (socials.facebook?.username || socials.facebook?.url) count++;
    return count;
  }, [socials]);

  const totalEpisodesCount = useMemo(() => {
    return series.reduce((acc, s) => {
      const legacyEpisodes = (s as unknown as { episodes?: Episode[] }).episodes;
      const eps = s.seasons?.flatMap((sn) => sn.episodes) || legacyEpisodes || [];
      return acc + eps.length;
    }, 0);
  }, [series]);

  // Profile readiness checklist calculation
  const profileSteps = useMemo(() => {
    const hasProfileDetails = Boolean(profile.displayName && (profile.bio || profile.category));
    const hasSocials = connectedSocialsCount > 0;
    const hasCustomLinks = customLinks.length > 0;
    const hasSeries = series.length > 0;
    const hasPackages = packages.length > 0;
    const hasReviews = reviews.length > 0;

    const items = [
      { id: "profile", label: "Profile details", completed: hasProfileDetails, link: "/dashboard/profile" },
      { id: "socials", label: "Connected social channel", completed: hasSocials, link: "/dashboard/socials" },
      { id: "links", label: "Important links", completed: hasCustomLinks, link: "/dashboard/socials" },
      { id: "series", label: "Series", completed: hasSeries, link: "/dashboard/series" },
      { id: "services", label: "Collab packages", completed: hasPackages, link: "/dashboard/mediakit" },
      { id: "reviews", label: "Client reviews", completed: hasReviews, link: "/dashboard/reviews" },
    ];

    const completedCount = items.filter((i) => i.completed).length;
    const percentage = Math.round((completedCount / items.length) * 100);

    return { items, completedCount, totalCount: items.length, percentage };
  }, [profile, connectedSocialsCount, customLinks, series, packages, reviews]);

  const animatedFanbase = useCountUp(totalAudience, 800, 150);
  const animatedPercentage = useCountUp(profileSteps.percentage, 800, 200);

  const activePackagesCount = packages.filter((p) => p.isActive !== false).length;

  function formatQuotaLimit(max: number) {
    return max === Infinity ? "Unlimited" : max.toLocaleString("en-IN");
  }

  function formatQuotaRemaining(current: number, max: number) {
    if (max === Infinity) return "Unlimited left";
    return `${Math.max(0, max - current).toLocaleString("en-IN")} left`;
  }

  const quotaItems = [
    {
      label: "Series",
      current: series.length,
      max: quota.maxSeries,
      href: "/dashboard/series",
    },
    {
      label: "Episodes",
      current: totalEpisodesCount,
      max: quota.maxTotalEpisodes,
      href: "/dashboard/series",
    },
    {
      label: "Custom links",
      current: customLinks.length,
      max: quota.maxCustomLinks,
      href: "/dashboard/socials",
    },
    {
      label: "Collab packages",
      current: activePackagesCount,
      max: quota.maxGigs,
      href: "/dashboard/mediakit",
    },
    {
      label: "Reviews",
      current: reviews.length,
      max: quota.maxReviews,
      href: "/dashboard/reviews",
    },
  ];

  // Simplified Next Best Step recommendation
  const nextStep = useMemo(() => {
    if (packages.length === 0) {
      return {
        title: "Add your collab packages",
        description: "Set up rates for brands, cafes, and shops wanting reels.",
        ctaLabel: "Add Package →",
        ctaHref: "/dashboard/mediakit",
      };
    }
    if (series.length === 0) {
      return {
        title: "Create your first content series",
        description: "Group your related reels and videos so followers can watch in order.",
        ctaLabel: "Create Series →",
        ctaHref: "/dashboard/series",
        onClick: handleCreateSeriesClick,
      };
    }
    if (totalEpisodesCount === 0) {
      return {
        title: "Add your first episode",
        description: "Link your video episodes to bring your showcase playlist alive.",
        ctaLabel: "Add Episode →",
        ctaHref: "/dashboard/series",
      };
    }
    if (reviews.length === 0) {
      return {
        title: "Request your first client review",
        description: "Collect verified reviews from brands and clients you have worked with.",
        ctaLabel: "Request Review →",
        ctaHref: "/dashboard/reviews",
      };
    }
    return {
      title: "Share your public profile",
      description: "Your creator profile is ready. Share your link in bio and pitch decks.",
      ctaLabel: "View Profile →",
      ctaHref: `/${handleStr}`,
      isExternal: true,
    };
  }, [packages, series, totalEpisodesCount, reviews, handleStr, handleCreateSeriesClick]);

  return (
    <div className="space-y-6 w-full pb-8 text-left">

      {/* 1. COMPACT PROFILE CARD */}
      <section className="rounded-[16px] border border-[#e2e8f0] bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <CreatorAvatar
              src={profile.photoDataUrl}
              name={displayName}
              className="w-12 h-12 rounded-full border border-[#e2e8f0] overflow-hidden object-cover aspect-square shrink-0"
              textClassName="text-sm font-semibold text-[#151933]"
              fallbackBgClass="bg-[#f8fafc]"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-semibold text-[#151933]">
                  {displayName}
                </h2>
                {profile.isVerified && (
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[#151933]" />
                )}
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#17845B] bg-[#EAF7F0] border border-[#17845B]/20 px-2 py-0.5 rounded-full shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#17845B]" />
                  Live
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#475569] font-normal mt-0.5">
                @{handleStr}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap">
            <Link
              href="/dashboard/profile"
              className="h-10 px-3.5 rounded-[10px] border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-xs sm:text-sm font-medium text-[#151933] transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5 text-[#64748b]" />
              <span>Edit Profile</span>
            </Link>
            <button
              type="button"
              onClick={handleCopy}
              className="h-10 px-3.5 rounded-[10px] border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-xs sm:text-sm font-medium text-[#151933] transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5 text-[#64748b]" />
              <span>Copy Link</span>
            </button>
            <a
              href={`/${handleStr}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-3.5 rounded-[10px] bg-[#151933] hover:bg-brand-hover text-xs sm:text-sm font-medium text-white transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>View Profile</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div className="pt-4 border-t border-[#e2e8f0] space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-medium text-[#151933]">
              Your profile is {animatedPercentage}% complete
            </span>
            <Link
              href="/dashboard/profile"
              className="font-medium text-xs sm:text-sm text-[#151933] hover:underline inline-flex items-center gap-1"
            >
              <span>Complete profile</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="w-full h-2 rounded-full bg-[#f8fafc] border border-[#e2e8f0] overflow-hidden">
            <div
              className="h-full bg-[#151933] rounded-full transition-all duration-700 ease-out"
              style={{ width: isLoaded ? `${profileSteps.percentage}%` : "0%" }}
            />
          </div>
        </div>
      </section>

      {/* 2. OVERVIEW (3 EQUAL CARDS) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1: Total Fanbase */}
        <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#cbd5e1] hover:shadow-md flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#64748b]">
              Total Fanbase
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleRefreshStats}
                className="p-1 rounded-lg text-[#64748b] hover:text-[#151933] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                title={`Last synced: ${formatSyncDate(socials.updatedAt)}. Click to refresh.`}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-[#151933]" : ""}`} />
              </button>
              <div className="h-8 w-8 rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center text-[#151933]">
                <Users className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div>
            <p className="text-[32px] font-semibold text-[#151933] leading-none tracking-tight tabular-nums">
              {formatCount(animatedFanbase)}
            </p>
            <p className="text-xs sm:text-[13px] text-[#64748b] font-normal mt-1.5">
              {connectedSocialsCount > 0
                ? `${connectedSocialsCount} connected ${connectedSocialsCount === 1 ? "social" : "socials"}`
                : "Connect your social platforms"}
            </p>
          </div>
          <Link
            href="/dashboard/socials"
            className="text-xs sm:text-[13px] font-medium text-[#151933] hover:underline inline-flex items-center gap-1 pt-1"
          >
            <span>View socials</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Card 2: Series */}
        <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#cbd5e1] hover:shadow-md flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#64748b]">
              Series
            </span>
            <div className="h-8 w-8 rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center text-[#151933]">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-[32px] font-semibold text-[#151933] leading-none tracking-tight">
              {series.length} {series.length === 1 ? "Series" : "Series"}
            </p>
            <p className="text-xs sm:text-[13px] text-[#64748b] font-normal mt-1.5">
              {totalEpisodesCount} {totalEpisodesCount === 1 ? "episode" : "episodes"}
            </p>
          </div>
          <Link
            href="/dashboard/series"
            className="text-xs sm:text-[13px] font-medium text-[#151933] hover:underline inline-flex items-center gap-1 pt-1"
          >
            <span>Manage series</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Card 3: Collab Packages */}
        <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#cbd5e1] hover:shadow-md flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#64748b]">
              Collabs
            </span>
            <div className="h-8 w-8 rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center text-[#151933]">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-[32px] font-semibold text-[#151933] leading-none tracking-tight">
              {packages.length} {packages.length === 1 ? "Package" : "Packages"}
            </p>
            <p className="text-xs sm:text-[13px] text-[#64748b] font-normal mt-1.5">
              {activePackagesCount} active collab {activePackagesCount === 1 ? "package" : "packages"}
            </p>
          </div>
          <Link
            href="/dashboard/mediakit"
            className="text-xs sm:text-[13px] font-medium text-[#151933] hover:underline inline-flex items-center gap-1 pt-1"
          >
            <span>Manage collabs</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {showQuotaPanel && (
        <section className="rounded-[16px] border border-[#e2e8f0] bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                {quota.name} usage
              </span>
              <h3 className="mt-1 text-base sm:text-lg font-semibold text-[#151933]">
                Your plan quota
              </h3>
              <p className="mt-0.5 text-xs sm:text-sm text-[#475569]">
                See what you have used and what is still available in your current plan.
              </p>
            </div>
            <Link
              href="/dashboard/subscription"
              className="h-9 px-3.5 rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] text-xs font-semibold text-[#151933] transition-all hover:-translate-y-0.5 hover:border-[#cbd5e1] hover:bg-[#f1f5f9] inline-flex items-center gap-1.5 self-start sm:self-center"
            >
              <span>View plan</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
            {quotaItems.map((item) => {
              const percentage = item.max === Infinity ? 0 : Math.min(100, Math.round((item.current / item.max) * 100));
              const isNearLimit = item.max !== Infinity && percentage >= 80;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-[14px] border border-[#e2e8f0] bg-[#f8fafc] p-3.5 transition-all hover:-translate-y-0.5 hover:border-[#cbd5e1] hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-[#64748b]">{item.label}</p>
                      <p className="mt-1 text-lg font-semibold tabular-nums text-[#151933]">
                        {item.current.toLocaleString("en-IN")}
                        <span className="text-xs font-medium text-[#64748b]">
                          {" "}of {formatQuotaLimit(item.max)}
                        </span>
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isNearLimit
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-[#151933]/[0.08] text-[#151933] border border-[#151933]/15"
                      }`}>
                      {formatQuotaRemaining(item.current, item.max)}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-white border border-[#e2e8f0] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isNearLimit ? "bg-amber-500" : "bg-[#151933]"}`}
                      style={{ width: item.max === Infinity ? "100%" : `${percentage}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. NEXT BEST STEP (COMPACT & FOCUSED) */}
      <section className="rounded-[16px] border border-[#e2e8f0] bg-white p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
              Next best step
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-[#151933]">
              {nextStep.title}
            </h3>
            <p className="text-xs sm:text-sm text-[#475569] font-normal">
              {nextStep.description}
            </p>
          </div>

          <div className="shrink-0 self-start sm:self-center">
            {nextStep.isExternal ? (
              <a
                href={nextStep.ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-4 rounded-[10px] bg-[#151933] hover:bg-brand-hover text-white text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <span>{nextStep.ctaLabel}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : nextStep.onClick ? (
              <button
                type="button"
                onClick={nextStep.onClick}
                className="h-10 px-4 rounded-[10px] bg-[#151933] hover:bg-brand-hover text-white text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <span>{nextStep.ctaLabel}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <Link
                href={nextStep.ctaHref}
                className="h-10 px-4 rounded-[10px] bg-[#151933] hover:bg-brand-hover text-white text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <span>{nextStep.ctaLabel}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 4. RECENT SERIES (MAX 3 ITEMS + VIEW ALL LINK) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-lg font-semibold text-[#151933]">
            Recent series
          </h3>
          <Link
            href="/dashboard/series"
            className="text-xs sm:text-sm font-medium text-[#151933] hover:underline inline-flex items-center gap-1"
          >
            <span>View all series</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {series.length === 0 ? (
          <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-6 sm:p-8 text-center space-y-3 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0] text-[#151933] mx-auto">
              <Film className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-[#151933]">
                Start your first content series
              </h4>
              <p className="text-xs sm:text-sm text-[#475569] font-normal max-w-sm mx-auto">
                Organize related reels and videos so followers can watch in order.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreateSeriesClick}
              className="h-10 px-4 rounded-[10px] bg-[#151933] hover:bg-brand-hover text-white text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-all hover:-translate-y-0.5 cursor-pointer shadow-xs hover:shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Series</span>
            </button>
          </div>
        ) : (
          <div className="rounded-[16px] border border-[#e2e8f0] bg-white divide-y divide-[#e2e8f0] shadow-xs overflow-hidden">
            {series.slice(0, 3).map((s) => {
              const legacyEpisodes = (s as unknown as { episodes?: Episode[] }).episodes;
              const eps = s.seasons?.flatMap((sn) => sn.episodes) || legacyEpisodes || [];
              const platformLabel = s.genre || "Web Series";
              return (
                <div
                  key={s.id}
                  className="px-5 py-3.5 sm:py-4 flex items-center justify-between gap-3 hover:bg-[#f1f5f9] transition-colors text-left"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0] text-[#151933] shrink-0">
                      <Film className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-[#151933] truncate">
                        {s.title}
                      </h4>
                      <p className="text-xs text-[#64748b] font-normal mt-0.5">
                        {eps.length} {eps.length === 1 ? "episode" : "episodes"} • {platformLabel}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href="/dashboard/series"
                      className="text-xs sm:text-sm font-medium text-[#151933] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Manage</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Limit Reached Modal Popup */}
      <LimitReachedModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        type={modalState.type}
        seriesTitle={modalState.seriesTitle}
      />
    </div>
  );
}
