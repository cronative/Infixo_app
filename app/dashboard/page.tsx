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
  Briefcase,
  Eye,
  MousePointerClick,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { formatCount, formatSyncDate } from "@/utils/format";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { canCreateSeries, getPlanQuota } from "@/services/subscriptionLimits";
import { LimitReachedModal } from "@/components/ui/LimitReachedModal";
import { reviewsRepository, customLinksRepository } from "@/repositories/localRepository";
import { EmptyState } from "@/components/ui/EmptyState";
import { MediaKitPackage, CreatorReview, CustomLink, Episode } from "@/types";

type DashboardAnalytics = {
  profileViews: number;
  uniqueVisitors: number;
  episodeClicks: number;
  topTargets: { event_type: string; event_target: string | null; clicks: number }[];
};

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
  const [analytics, setAnalytics] = useState<DashboardAnalytics>({
    profileViews: 0,
    uniqueVisitors: 0,
    episodeClicks: 0,
    topTargets: [],
  });

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
        .then((httpResponse) => httpResponse.json())
        .then((apiResponse) => {
          const links = apiResponse.data?.links || apiResponse.links;
          if ((apiResponse.status === 1 || apiResponse.success) && Array.isArray(links)) {
            setCustomLinks(links);
            customLinksRepository.save(links);
          }
        })
        .catch(() => { });

      const mkQuery = profile.id ? `creatorId=${encodeURIComponent(profile.id)}` : profile.email ? `email=${encodeURIComponent(profile.email)}` : `username=${encodeURIComponent(profile.username || "")}`;
      fetch(`/api/creator/mediakit?${mkQuery}`)
        .then((httpResponse) => httpResponse.json())
        .then((apiResponse) => {
          const packages = apiResponse.data?.packages || apiResponse.packages;
          if ((apiResponse.status === 1 || apiResponse.success) && Array.isArray(packages)) {
            setPackages(packages);
          }
        })
        .catch(() => { });

      fetch(`/api/creator/analytics?${query}&period=30d`)
        .then((r) => r.json())
        .then((apiResponse) => {
          const metrics = apiResponse.data?.metrics || apiResponse.metrics;
          const topTargets = apiResponse.data?.topTargets || apiResponse.topTargets;
          if (apiResponse.status === 1 || apiResponse.success) {
            setAnalytics({
              profileViews: Number(metrics?.profileViews || 0),
              uniqueVisitors: Number(metrics?.uniqueVisitors || 0),
              episodeClicks: Number(metrics?.episodeClicks || 0),
              topTargets: Array.isArray(topTargets) ? topTargets : [],
            });
          }
        })
        .catch(() => { });
    }
  }, [profile]);

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
      { id: "links", label: "Important links", completed: hasCustomLinks, link: "/dashboard/links" },
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
      href: "/dashboard/links",
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

  // Resolve "seriesId:episodeId" analytics targets to human-readable names.
  const resolveTarget = (target: string | null) => {
    if (!target) return "Series episode";
    const [seriesId, episodeId] = target.split(":");
    const s = series.find((item) => item.id === seriesId);
    if (!s) return "Series episode";
    const legacyEpisodes = (s as unknown as { episodes?: Episode[] }).episodes;
    const eps = s.seasons?.flatMap((sn) => sn.episodes) || legacyEpisodes || [];
    const ep = eps.find((e) => e.id === episodeId);
    return ep ? `${s.title} · ${ep.title || `Episode ${ep.episodeNumber}`}` : s.title;
  };
  const topEpisodeTargets = analytics.topTargets.filter((item) => item.event_type === "episode_click").slice(0, 5);

  const sectionTitle = "text-[15px] font-semibold text-[#0f172a]";
  const quietLink = "inline-flex items-center gap-0.5 text-xs font-medium text-[#475569] hover:text-[#0f172a]";
  const primaryBtn = "h-9 px-3.5 rounded-lg bg-[#043084] hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer";

  const overview = [
    {
      label: "Total fanbase",
      value: formatCount(animatedFanbase),
      sub: connectedSocialsCount > 0 ? `${connectedSocialsCount} connected ${connectedSocialsCount === 1 ? "social" : "socials"}` : "Connect socials",
      href: "/dashboard/socials",
      icon: Users,
    },
    {
      label: "Series",
      value: `${series.length}`,
      sub: `${totalEpisodesCount} ${totalEpisodesCount === 1 ? "episode" : "episodes"}`,
      href: "/dashboard/series",
      icon: Layers,
    },
    {
      label: "Collab packages",
      value: `${packages.length}`,
      sub: `${activePackagesCount} active`,
      href: "/dashboard/mediakit",
      icon: Briefcase,
    },
  ];

  return (
    <div className="space-y-4 w-full pb-6 text-left">
      {/* 1. PROFILE — identity + completion */}
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-4">
        <div className="flex items-center gap-3">
          <CreatorAvatar
            src={profile.photoDataUrl}
            name={displayName}
            className="w-11 h-11 rounded-full border border-[#e2e8f0] overflow-hidden object-cover aspect-square shrink-0"
            textClassName="text-sm font-semibold text-[#043084]"
            fallbackBgClass="bg-[#f8fafc]"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="truncate text-base font-semibold text-[#0f172a]">{displayName}</h1>
              {profile.isVerified && <ShieldCheck className="h-4 w-4 shrink-0 text-[#043084]" />}
            </div>
            <p className="flex items-center gap-1.5 text-xs text-[#64748b]">
              <span className="truncate">@{handleStr}</span>
              <span className="inline-flex shrink-0 items-center gap-1 font-medium text-[#047857]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                Live
              </span>
            </p>
          </div>
          <Link
            href="/dashboard/profile"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm font-medium text-[#0f172a] transition-colors hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
          >
            <Edit2 className="h-3.5 w-3.5 text-[#64748b]" />
            <span className="hidden sm:inline">Edit profile</span>
            <span className="sm:hidden">Edit</span>
          </Link>
        </div>

        <div className="mt-3.5 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eef2f7]">
            <div
              className="h-full rounded-full bg-[#043084] transition-all duration-700 ease-out"
              style={{ width: isLoaded ? `${profileSteps.percentage}%` : "0%" }}
            />
          </div>
          <span className="shrink-0 text-xs text-[#64748b]">
            <span className="font-semibold text-[#0f172a] tabular-nums">{animatedPercentage}%</span> complete
          </span>
          {profileSteps.percentage < 100 && (
            <Link href="/dashboard/profile" className={`${quietLink} shrink-0`}>
              Finish <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </section>

      {/* 2. OVERVIEW — one compact strip */}
      <section className="grid grid-cols-3 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white divide-x divide-[#e2e8f0]">
        {overview.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href} className="group min-w-0 p-3 sm:p-4 transition-colors hover:bg-[#f8fafc]">
              <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-[#64748b]">
                <Icon className="hidden sm:block h-3.5 w-3.5 text-[#94a3b8]" />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="mt-1 block text-xl sm:text-2xl font-semibold leading-tight tracking-tight tabular-nums text-[#0f172a]">
                {item.value}
              </span>
              <span className="mt-0.5 block truncate text-[11px] sm:text-xs text-[#64748b]">{item.sub}</span>
            </Link>
          );
        })}
      </section>
      <div className="-mt-2.5 flex justify-end">
        <button
          type="button"
          onClick={handleRefreshStats}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] cursor-pointer"
          title="Refresh follower counts"
        >
          <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
          Fanbase synced {formatSyncDate(socials.updatedAt)}
        </button>
      </div>

      {/* 3. SERIES — the hero content */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className={sectionTitle}>Your series</h2>
          <Link href="/dashboard/series" className={quietLink}>
            Manage all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {series.length === 0 ? (
          <EmptyState
            icon={<Film className="h-7 w-7" />}
            title="Start your first content series"
            description="Organize related reels and videos so followers can watch in order."
            action={
              <button type="button" onClick={handleCreateSeriesClick} className={primaryBtn}>
                <Plus className="h-4 w-4" />
                <span>Create your first series</span>
              </button>
            }
          />
        ) : (
          <div className="rounded-xl border border-[#e2e8f0] bg-white divide-y divide-[#e2e8f0] overflow-hidden">
            {series.slice(0, 3).map((s) => {
              const legacyEpisodes = (s as unknown as { episodes?: Episode[] }).episodes;
              const eps = s.seasons?.flatMap((sn) => sn.episodes) || legacyEpisodes || [];
              const genre = (s.genre || "").split(",")[0].trim();
              return (
                <Link
                  key={s.id}
                  href="/dashboard/series"
                  className="flex items-center gap-3 px-3 sm:px-4 py-2.5 transition-colors hover:bg-[#f8fafc]"
                >
                  {s.posterDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.posterDataUrl} alt="" loading="lazy" decoding="async" className="h-10 w-10 shrink-0 rounded-lg border border-[#e2e8f0] object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                      <Film className="h-4 w-4" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#0f172a]">{s.title}</span>
                    <span className="block truncate text-xs text-[#64748b]">
                      {eps.length} {eps.length === 1 ? "episode" : "episodes"}{genre ? ` · ${genre}` : ""}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#cbd5e1]" />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. NEXT BEST STEP — the page's one primary action */}
      <section className="flex flex-col gap-3 rounded-xl border border-[#e2e8f0] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#94a3b8]">Next step</p>
          <h3 className="mt-0.5 text-sm font-semibold text-[#0f172a]">{nextStep.title}</h3>
          <p className="text-xs text-[#64748b]">{nextStep.description}</p>
        </div>
        <div className="shrink-0">
          {nextStep.isExternal ? (
            <a href={nextStep.ctaHref} target="_blank" rel="noopener noreferrer" className={primaryBtn}>
              <span>{nextStep.ctaLabel.replace(" →", "")}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : nextStep.onClick ? (
            <button type="button" onClick={nextStep.onClick} className={primaryBtn}>
              <span>{nextStep.ctaLabel.replace(" →", "")}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Link href={nextStep.ctaHref} className={primaryBtn}>
              <span>{nextStep.ctaLabel.replace(" →", "")}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </section>

      {/* 5. ANALYTICS — compact summary */}
      <section className="rounded-xl border border-[#e2e8f0] bg-white">
        <div className="flex items-center justify-between px-4 pt-3.5">
          <h2 className={sectionTitle}>
            Last 30 days <span className="text-xs font-normal text-[#64748b]">· public page</span>
          </h2>
          <Link href="/dashboard/analytics" className={quietLink}>
            Analytics <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2 px-4 py-3">
          {[
            { label: "Profile opens", value: analytics.profileViews, icon: Eye },
            { label: "Unique visitors", value: analytics.uniqueVisitors, icon: Users },
            { label: "Episode clicks", value: analytics.episodeClicks, icon: MousePointerClick },
          ].map((m) => (
            <div key={m.label} className="min-w-0">
              <p className="flex items-center gap-1 truncate text-[11px] sm:text-xs text-[#64748b]">
                <m.icon className="hidden sm:block h-3.5 w-3.5 text-[#94a3b8]" />
                {m.label}
              </p>
              <p className="text-lg sm:text-xl font-semibold tabular-nums text-[#0f172a]">{m.value.toLocaleString("en-IN")}</p>
            </div>
          ))}
        </div>
        {topEpisodeTargets.length > 0 && (
          <div className="border-t border-[#e2e8f0] px-4 py-2.5">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[#94a3b8]">Top clicked episodes</p>
            <ul className="space-y-1">
              {topEpisodeTargets.map((item, index) => {
                const clicks = Number(item.clicks || 0);
                return (
                  <li key={`${item.event_target}-${index}`} className="flex items-center justify-between gap-3 text-xs">
                    <span className="min-w-0 truncate text-[#334155]">{resolveTarget(item.event_target)}</span>
                    <span className="shrink-0 tabular-nums text-[#64748b]">
                      {clicks.toLocaleString("en-IN")} {clicks === 1 ? "click" : "clicks"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* 6. PLAN USAGE */}
      {showQuotaPanel && (
        <section className="rounded-xl border border-[#e2e8f0] bg-white">
          <div className="flex items-center justify-between px-4 pt-3.5">
            <h2 className={sectionTitle}>
              {quota.name} plan <span className="text-xs font-normal text-[#64748b]">· usage</span>
            </h2>
            <Link href="/dashboard/subscription" className={quietLink}>
              View plan <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3 sm:grid-cols-5">
            {quotaItems.map((item) => {
              const percentage = item.max === Infinity ? 0 : Math.min(100, Math.round((item.current / item.max) * 100));
              const isNearLimit = item.max !== Infinity && percentage >= 80;
              return (
                <Link key={item.label} href={item.href} className="group min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-xs text-[#64748b] group-hover:text-[#0f172a]">{item.label}</span>
                    <span className="shrink-0 text-xs tabular-nums text-[#0f172a]">
                      <span className="font-semibold">{item.current.toLocaleString("en-IN")}</span>
                      <span className="text-[#94a3b8]">/{formatQuotaLimit(item.max)}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#eef2f7]">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isNearLimit ? "bg-[#F59E0B]" : "bg-[#043084]"}`}
                      style={{ width: item.max === Infinity ? "100%" : `${percentage}%` }}
                    />
                  </div>
                  <span className="sr-only">{formatQuotaRemaining(item.current, item.max)}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

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
