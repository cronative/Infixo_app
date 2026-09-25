"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
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
  ShoppingBag,
  Link2,
  Star,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { formatCount, formatSyncDate } from "@/utils/format";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { canCreateSeries, canAddProduct, getPlanQuota } from "@/services/subscriptionLimits";
import { LimitReachedModal } from "@/components/ui/LimitReachedModal";
import { reviewsRepository, customLinksRepository } from "@/repositories/localRepository";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductImage, formatProductPrice } from "@/components/products/ProductImage";
import { ProductService } from "@/services/ProductService";
import { MediaKitPackage, CreatorReview, CustomLink, Episode, CreatorProduct } from "@/types";

type DashboardAnalytics = {
  profileViews: number;
  uniqueVisitors: number;
  episodeClicks: number;
  topTargets: { event_type: string; event_target: string | null; clicks: number }[];
};

function safeHostname(urlStr?: string): string {
  if (!urlStr) return "";
  try {
    const raw = /^https?:\/\//i.test(urlStr.trim()) ? urlStr.trim() : `https://${urlStr.trim()}`;
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return urlStr;
  }
}

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
  const [products, setProducts] = useState<CreatorProduct[]>([]);
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
    type: "series" | "episode" | "gig" | "product";
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

  // Load packages, products, reviews, custom links & analytics from local & DB
  useEffect(() => {
    const controller = new AbortController();

    ProductService.list(controller.signal)
      .then(setProducts)
      .catch(() => {});

    const ident = profile.id || profile.email || profile.username;
    if (ident) {
      const query = profile.email
        ? `email=${encodeURIComponent(profile.email)}`
        : `username=${encodeURIComponent(profile.username || "")}`;

      fetch(`/api/creator/custom-links?${query}`, { signal: controller.signal })
        .then((httpResponse) => httpResponse.json())
        .then((apiResponse) => {
          const links = apiResponse.data?.links || apiResponse.links;
          if ((apiResponse.status === 1 || apiResponse.success) && Array.isArray(links)) {
            setCustomLinks(links);
            customLinksRepository.save(links);
          }
        })
        .catch(() => {});

      const mkQuery = profile.id
        ? `creatorId=${encodeURIComponent(profile.id)}`
        : profile.email
        ? `email=${encodeURIComponent(profile.email)}`
        : `username=${encodeURIComponent(profile.username || "")}`;

      fetch(`/api/creator/mediakit?${mkQuery}`, { signal: controller.signal })
        .then((httpResponse) => httpResponse.json())
        .then((apiResponse) => {
          const pkgs = apiResponse.data?.packages || apiResponse.packages;
          if ((apiResponse.status === 1 || apiResponse.success) && Array.isArray(pkgs)) {
            setPackages(pkgs);
          }
        })
        .catch(() => {});

      fetch(`/api/creator/analytics?${query}&period=30d`, { signal: controller.signal })
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
        .catch(() => {});
    }

    return () => controller.abort();
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

  const handleAddProductClick = useCallback(() => {
    if (!canAddProduct(products.length, planKey)) {
      setModalState({ isOpen: true, type: "product" });
    } else {
      router.push("/dashboard/products");
    }
  }, [planKey, router, products.length]);

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
    const hasProducts = products.length > 0;
    const hasPackages = packages.length > 0;
    const hasReviews = reviews.length > 0;

    const items = [
      { id: "profile", label: "Profile details", completed: hasProfileDetails, link: "/dashboard/profile" },
      { id: "socials", label: "Connected socials", completed: hasSocials, link: "/dashboard/socials" },
      { id: "links", label: "Bio links", completed: hasCustomLinks, link: "/dashboard/links" },
      { id: "series", label: "Content series", completed: hasSeries, link: "/dashboard/series" },
      { id: "products", label: "Shop products", completed: hasProducts, link: "/dashboard/products" },
      { id: "services", label: "Collab rates", completed: hasPackages, link: "/dashboard/mediakit" },
      { id: "reviews", label: "Client reviews", completed: hasReviews, link: "/dashboard/reviews" },
    ];

    const completedCount = items.filter((i) => i.completed).length;
    const percentage = Math.round((completedCount / items.length) * 100);

    return { items, completedCount, totalCount: items.length, percentage };
  }, [profile, connectedSocialsCount, customLinks, series, products, packages, reviews]);

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
      label: "Shop products",
      current: products.length,
      max: quota.maxProducts,
      href: "/dashboard/products",
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
  const quietLink = "inline-flex items-center gap-0.5 text-xs font-medium text-[#475569] hover:text-[#0f172a] transition-colors";
  const primaryBtn = "h-9 px-3.5 rounded-lg bg-[#043084] hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer";

  // Trailer command metrics strip: 6 clickable summary cards with counts
  const overview = [
    {
      label: "Total Fanbase",
      value: formatCount(animatedFanbase),
      sub: connectedSocialsCount > 0 ? `${connectedSocialsCount} connected` : "Connect socials",
      href: "/dashboard/socials",
      icon: Users,
    },
    {
      label: "Content Series",
      value: `${series.length}`,
      sub: `${totalEpisodesCount} ${totalEpisodesCount === 1 ? "episode" : "episodes"}`,
      href: "/dashboard/series",
      icon: Film,
    },
    {
      label: "Shop Products",
      value: `${products.length}`,
      sub: quota.maxProducts === Infinity ? "Unlimited max" : `${quota.maxProducts} allowed`,
      href: "/dashboard/products",
      icon: ShoppingBag,
    },
    {
      label: "Collab Rates",
      value: `${packages.length}`,
      sub: `${activePackagesCount} active packages`,
      href: "/dashboard/mediakit",
      icon: Briefcase,
    },
    {
      label: "Bio Links",
      value: `${customLinks.length}`,
      sub: "Active on profile",
      href: "/dashboard/links",
      icon: Link2,
    },
    {
      label: "30d Views",
      value: analytics.profileViews.toLocaleString("en-IN"),
      sub: `${analytics.uniqueVisitors} visitors`,
      href: "/dashboard/analytics",
      icon: Eye,
    },
  ];

  return (
    <div className="space-y-4 w-full pb-6 text-left">
      {/* 1. CREATOR IDENTITY & PROFILE READINESS */}
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
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
              <p className="flex items-center gap-2 text-xs text-[#64748b]">
                <span className="truncate font-medium">@{handleStr}</span>
                <span className="inline-flex shrink-0 items-center gap-1 font-medium text-[#047857]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                  Live profile
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`/${handleStr}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs font-semibold text-[#0f172a] transition-colors hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
            >
              <span>View live</span>
              <ExternalLink className="h-3.5 w-3.5 text-[#64748b]" />
            </a>
            <Link
              href="/dashboard/profile"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs font-semibold text-[#0f172a] transition-colors hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
            >
              <Edit2 className="h-3.5 w-3.5 text-[#64748b]" />
              <span className="hidden sm:inline">Edit profile</span>
              <span className="sm:hidden">Edit</span>
            </Link>
          </div>
        </div>

        {/* Readiness Bar */}
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

      {/* 2. TRAILER COMMAND STRIP — 6 Core Counts (Clickable at a glance) */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white divide-y sm:divide-y-0 divide-x divide-[#e2e8f0]">
        {overview.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="group min-w-0 p-3 sm:p-3.5 transition-colors hover:bg-[#f8fafc]"
            >
              <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-[#64748b] group-hover:text-[#043084] transition-colors">
                <Icon className="h-3.5 w-3.5 text-[#94a3b8] group-hover:text-[#043084] shrink-0 transition-colors" />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="mt-1 block text-lg sm:text-xl font-bold leading-tight tracking-tight tabular-nums text-[#0f172a]">
                {item.value}
              </span>
              <span className="mt-0.5 block truncate text-[10px] sm:text-[11px] text-[#64748b]">{item.sub}</span>
            </Link>
          );
        })}
      </section>
      <div className="-mt-2.5 flex justify-end">
        <button
          type="button"
          onClick={handleRefreshStats}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] cursor-pointer"
          title="Refresh follower counts"
        >
          <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
          Fanbase synced {formatSyncDate(socials.updatedAt)}
        </button>
      </div>

      {/* 3. SHOWCASE TRAILER GRID: Series & Shop Products (Side-by-Side on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Content Series */}
        <section className="flex flex-col rounded-xl border border-[#e2e8f0] bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-[#043084]" />
              <h2 className={sectionTitle}>Content Series</h2>
              <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-bold text-[#475569]">
                {series.length}
              </span>
            </div>
            <Link href="/dashboard/series" className={quietLink}>
              Manage all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-[#e2e8f0]">
            {series.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<Film className="h-6 w-6" />}
                  title="No content series yet"
                  description="Group your reels and videos so followers can watch sequentially."
                  action={
                    <button type="button" onClick={handleCreateSeriesClick} className={primaryBtn}>
                      <Plus className="h-4 w-4" />
                      <span>Create Series</span>
                    </button>
                  }
                />
              </div>
            ) : (
              series.slice(0, 3).map((s) => {
                const legacyEpisodes = (s as unknown as { episodes?: Episode[] }).episodes;
                const eps = s.seasons?.flatMap((sn) => sn.episodes) || legacyEpisodes || [];
                const genre = (s.genre || "").split(",")[0].trim();
                return (
                  <Link
                    key={s.id}
                    href="/dashboard/series"
                    className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-[#f8fafc]"
                  >
                    {s.posterDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.posterDataUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-10 w-10 shrink-0 rounded-lg border border-[#e2e8f0] object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                        <Film className="h-4 w-4" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs sm:text-sm font-semibold text-[#0f172a]">{s.title}</span>
                      <span className="block truncate text-[11px] text-[#64748b]">
                        {eps.length} {eps.length === 1 ? "episode" : "episodes"}{genre ? ` · ${genre}` : ""}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#cbd5e1]" />
                  </Link>
                );
              })
            )}
          </div>

          {series.length > 0 && (
            <div className="border-t border-[#f1f5f9] bg-[#f8fafc] px-3.5 py-2 flex items-center justify-between">
              <span className="text-[11px] text-[#64748b]">
                {quota.maxSeries === Infinity
                  ? "Unlimited series allowed"
                  : `${Math.max(0, quota.maxSeries - series.length)} slots left in ${quota.name}`}
              </span>
              <button
                type="button"
                onClick={handleCreateSeriesClick}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#043084] hover:underline cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New series</span>
              </button>
            </div>
          )}
        </section>

        {/* Right: Shop Products */}
        <section className="flex flex-col rounded-xl border border-[#e2e8f0] bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-[#043084]" />
              <h2 className={sectionTitle}>Shop Products</h2>
              <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-bold text-[#475569]">
                {products.length}
              </span>
            </div>
            <Link href="/dashboard/products" className={quietLink}>
              Manage all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-[#e2e8f0]">
            {products.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<ShoppingBag className="h-6 w-6" />}
                  title="No products yet"
                  description="Recommend gear, ebooks, or affiliate links to your followers."
                  action={
                    <button type="button" onClick={handleAddProductClick} className={primaryBtn}>
                      <Plus className="h-4 w-4" />
                      <span>Add Product</span>
                    </button>
                  }
                />
              </div>
            ) : (
              products.slice(0, 3).map((prod) => (
                <Link
                  key={prod.id}
                  href="/dashboard/products"
                  className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-[#f8fafc]"
                >
                  <ProductImage
                    src={prod.imageUrl}
                    name={prod.name}
                    className="h-10 w-10 shrink-0 rounded-lg border border-[#e2e8f0]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs sm:text-sm font-semibold text-[#0f172a]">{prod.name}</span>
                    <span className="block truncate text-[11px] text-[#64748b]">
                      {prod.pricePaise !== null ? (
                        <span className="font-semibold text-[#043084] mr-1.5">
                          {formatProductPrice(prod.pricePaise)}
                        </span>
                      ) : null}
                      <span>{safeHostname(prod.productUrl)}</span>
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#cbd5e1]" />
                </Link>
              ))
            )}
          </div>

          {products.length > 0 && (
            <div className="border-t border-[#f1f5f9] bg-[#f8fafc] px-3.5 py-2 flex items-center justify-between">
              <span className="text-[11px] text-[#64748b]">
                {quota.maxProducts === Infinity
                  ? "Unlimited products in shop"
                  : `${Math.max(0, quota.maxProducts - products.length)} product slots left in ${quota.name}`}
              </span>
              <button
                type="button"
                onClick={handleAddProductClick}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#043084] hover:underline cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add product</span>
              </button>
            </div>
          )}
        </section>
      </div>

      {/* 4. MONETIZATION & TRUST STRIP: Collabs, Bio Links & Reviews */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/dashboard/mediakit"
          className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-white p-3.5 transition-colors hover:border-[#cbd5e1] hover:bg-[#f8fafc] group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#043084]/[0.08] text-[#043084]">
              <Briefcase className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#0f172a] truncate group-hover:text-[#043084] transition-colors">
                Collab Packages
              </p>
              <p className="text-[11px] text-[#64748b] truncate">
                {activePackagesCount} active {activePackagesCount === 1 ? "rate" : "rates"} · Media kit
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[#cbd5e1] group-hover:text-[#043084] shrink-0 transition-colors" />
        </Link>

        <Link
          href="/dashboard/links"
          className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-white p-3.5 transition-colors hover:border-[#cbd5e1] hover:bg-[#f8fafc] group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#043084]/[0.08] text-[#043084]">
              <Link2 className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#0f172a] truncate group-hover:text-[#043084] transition-colors">
                Custom Links
              </p>
              <p className="text-[11px] text-[#64748b] truncate">
                {customLinks.length} active on bio profile
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[#cbd5e1] group-hover:text-[#043084] shrink-0 transition-colors" />
        </Link>

        <Link
          href="/dashboard/reviews"
          className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-white p-3.5 transition-colors hover:border-[#cbd5e1] hover:bg-[#f8fafc] group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#0f172a] truncate group-hover:text-[#043084] transition-colors">
                Client Reviews
              </p>
              <p className="text-[11px] text-[#64748b] truncate">
                {reviews.length} verified testimonials
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[#cbd5e1] group-hover:text-[#043084] shrink-0 transition-colors" />
        </Link>
      </section>


      {/* 6. ANALYTICS — 30-Day Performance Trailer */}
      <section className="rounded-xl border border-[#e2e8f0] bg-white">
        <div className="flex items-center justify-between px-4 pt-3.5">
          <h2 className={sectionTitle}>
            Last 30 days <span className="text-xs font-normal text-[#64748b]">· public page performance</span>
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
              <p className="text-lg sm:text-xl font-bold tabular-nums text-[#0f172a]">{m.value.toLocaleString("en-IN")}</p>
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

      {/* 7. PLAN USAGE — Complete 6-feature Quota Bar */}
      {showQuotaPanel && (
        <section className="rounded-xl border border-[#e2e8f0] bg-white">
          <div className="flex items-center justify-between px-4 pt-3.5">
            <h2 className={sectionTitle}>
              {quota.name} plan <span className="text-xs font-normal text-[#64748b]">· resource limits</span>
            </h2>
            <Link href="/dashboard/subscription" className={quietLink}>
              View plan <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3 sm:grid-cols-3 lg:grid-cols-6">
            {quotaItems.map((item) => {
              const percentage = item.max === Infinity ? 0 : Math.min(100, Math.round((item.current / item.max) * 100));
              const isNearLimit = item.max !== Infinity && percentage >= 80;
              return (
                <Link key={item.label} href={item.href} className="group min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-xs text-[#64748b] group-hover:text-[#0f172a] transition-colors">{item.label}</span>
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
