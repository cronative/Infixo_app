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
  CheckCircle2,
  Circle,
  Sparkles,
  Trophy,
  AlertTriangle,
  Copy,
  Check,
  Send,
  Flame,
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
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { PlatformThumbnailBox } from "@/components/shared/PlatformThumbnailBox";
import { copyToClipboard } from "@/lib/copyToClipboard";

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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
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
  const [reviews, setReviews] = useState<CreatorReview[]>(() => reviewsRepository.getAll());
  const [customLinks, setCustomLinks] = useState<CustomLink[]>(() => customLinksRepository.get());
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);
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

      fetch(`/api/creator/reviews?${query}`, { signal: controller.signal })
        .then((httpResponse) => httpResponse.json())
        .then((apiResponse) => {
          const revs = apiResponse.data?.reviews || apiResponse.reviews;
          if ((apiResponse.status === 1 || apiResponse.success) && Array.isArray(revs)) {
            setReviews(revs);
            reviewsRepository.saveAll(revs);
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

  const handleCopyProfileLink = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
    const profileUrl = `${origin}/${handleStr}`;
    await copyToClipboard(profileUrl);
    setHasCopiedLink(true);
    showToast("Profile link copied to clipboard! 📋✨", "success");
    setTimeout(() => setHasCopiedLink(false), 2000);
  };

  const handleCreateReviewRequest = async (e?: React.FormEvent, copyLinkOnly = false) => {
    if (e) e.preventDefault();
    if (!clientName.trim()) {
      showToast("Please enter client or brand name", "error");
      return;
    }
    setIsSubmittingReview(true);
    try {
      const email = profile.email || "";
      const creatorId = profile.id || profile.email || "";
      const httpResponse = await fetch("/api/creator/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          creatorId,
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim() || undefined,
          projectTitle: projectTitle.trim() || undefined,
        }),
      });
      const apiResponse = await httpResponse.json();
      const reviewData = apiResponse.data?.review || apiResponse.review;
      const reviewUrl = apiResponse.data?.reviewUrl || apiResponse.reviewUrl;

      if (httpResponse.ok && (apiResponse.status === 1 || apiResponse.success) && reviewData) {
        const newRev: CreatorReview = reviewData;
        const updated = [newRev, ...reviews];
        setReviews(updated);
        reviewsRepository.saveAll(updated);

        if (copyLinkOnly || !clientEmail.trim()) {
          const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
          const link = reviewUrl || `${origin}/review/${newRev.token}`;
          await copyToClipboard(link);
          showToast("Review invite link copied to clipboard! 🔗", "success");
        } else {
          showToast(`Review invitation email sent to ${clientEmail.trim()}! ✉️`, "success");
        }

        setClientName("");
        setClientEmail("");
        setProjectTitle("");
        setShowReviewModal(false);
      } else {
        showToast(apiResponse.message || "Could not generate review request", "error");
      }
    } catch {
      showToast("Error creating review request. Please try again.", "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

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
      { id: "profile", label: "Profile details", completed: hasProfileDetails, link: "/dashboard/profile", actionLabel: "Edit bio", hint: "Add bio or category" },
      { id: "socials", label: "Connected socials", completed: hasSocials, link: "/dashboard/socials", actionLabel: "Connect", hint: "Connect Instagram or YouTube" },
      { id: "links", label: "Bio links", completed: hasCustomLinks, link: "/dashboard/links", actionLabel: "Add link", hint: "Add 1 custom bio link" },
      { id: "series", label: "Content series", completed: hasSeries, link: "/dashboard/series", actionLabel: "Create", hint: "Create a content series" },
      { id: "products", label: "Shop products", completed: hasProducts, link: "/dashboard/products", actionLabel: "Add product", hint: "Add 1 shop product" },
      { id: "services", label: "Collab rates", completed: hasPackages, link: "/dashboard/mediakit", actionLabel: "Set rates", hint: "Set brand collab packages" },
      { id: "reviews", label: "Client reviews", completed: hasReviews, link: "/dashboard/reviews", actionLabel: "Request", hint: "Request 1 client review" },
    ];

    const completedCount = items.filter((i) => i.completed).length;
    const percentage = Math.round((completedCount / items.length) * 100);
    const nextMissing = items.find((i) => !i.completed);

    return { items, completedCount, totalCount: items.length, percentage, nextMissing };
  }, [profile, connectedSocialsCount, customLinks, series, products, packages, reviews]);

  const animatedFanbase = useCountUp(totalAudience, 800, 150);
  const animatedPercentage = useCountUp(profileSteps.percentage, 800, 200);

  const activePackagesCount = packages.filter((p) => p.isActive !== false).length;

  const cleanHandle = (profile.username || "creator").replace(/^@/, "");

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
  const primaryBtn = "h-9 px-3.5 rounded-lg bg-[#7A2253] hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer";

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
      {/* 1. COMPACT GREETING SECTION & FLOATING PROFILE COMPLETION PILL */}
      <section className="rounded-2xl border border-[#e2e8f0] bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Creator Profile & Greeting */}
          <div className="flex items-center gap-3.5 min-w-0">
            <CreatorAvatar
              src={profile.photoDataUrl}
              name={displayName}
              className="w-12 h-12 rounded-full border-2 border-white overflow-hidden object-cover aspect-square shrink-0 shadow-xs"
              textClassName="text-base font-bold text-[#7A2253]"
              fallbackBgClass="bg-[#FAF5F8]"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#7A2253] bg-[#7A2253]/10 px-2 py-0.5 rounded-full">
                  {getGreeting()}
                </span>
                <h1 className="truncate text-base sm:text-lg font-bold text-[#0f172a]">{displayName}</h1>
                {profile.isVerified && <ShieldCheck className="h-4 w-4 shrink-0 text-[#7A2253]" />}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#64748b]">
                <span className="font-semibold text-[#0f172a]">@{handleStr}</span>
                <span className="text-[#cbd5e1]">·</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  inflixo.com/{handleStr}
                </span>
              </div>
            </div>
          </div>

          {/* Floating Action Bar & Profile Completion Pill */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Floating Profile Completion Pill */}
            {profileSteps.percentage < 100 ? (
              <button
                type="button"
                onClick={() => {
                  if (profileSteps.nextMissing?.id === "reviews" || reviews.length === 0) {
                    setShowReviewModal(true);
                  } else {
                    setShowChecklistModal(true);
                  }
                }}
                className="group inline-flex items-center gap-2 rounded-full border border-[#7A2253]/25 bg-[#FAF5F8] px-3 py-1.5 text-xs shadow-2xs hover:border-[#7A2253] hover:shadow-xs transition-all cursor-pointer"
                title="Click to complete next step"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7A2253] text-white font-bold text-[10px]">
                  {animatedPercentage}%
                </span>
                <span className="text-[#475569] font-medium hidden sm:inline">
                  Next: <strong className="font-semibold text-[#7A2253]">{profileSteps.nextMissing?.label || "Client reviews"}</strong>
                </span>
                <span className="inline-flex items-center gap-0.5 font-bold text-[#7A2253] group-hover:translate-x-0.5 transition-transform">
                  Finish <ChevronRight className="h-3 w-3" />
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowChecklistModal(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs"
                title="VIP Creator Perks Active"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                <span>100% Ready · VIP Active 🎉</span>
              </button>
            )}

            {/* Quick Actions (Floating Pill Row) */}
            <div className="flex items-center rounded-xl border border-[#e2e8f0] bg-zinc-50/80 p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={handleCopyProfileLink}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[#0f172a] hover:bg-white hover:shadow-2xs transition-all cursor-pointer"
                title="Copy public bio link"
              >
                {hasCopiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-[#64748b]" />
                    <span>Copy link</span>
                  </>
                )}
              </button>
              <div className="h-4 w-px bg-[#e2e8f0]" />
              <a
                href={`/${handleStr}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[#0f172a] hover:bg-white hover:shadow-2xs transition-all"
                title="Open live creator page"
              >
                <ExternalLink className="h-3.5 w-3.5 text-[#64748b]" />
                <span className="hidden md:inline">View live</span>
              </a>
              <div className="h-4 w-px bg-[#e2e8f0]" />
              <Link
                href="/dashboard/profile"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[#0f172a] hover:bg-white hover:shadow-2xs transition-all"
                title="Edit profile information"
              >
                <Edit2 className="h-3.5 w-3.5 text-[#64748b]" />
                <span className="hidden md:inline">Edit</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Slim Progress Bar */}
        <div className="mt-3.5 pt-3 border-t border-[#f1f5f9] flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eef2f7]">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                profileSteps.percentage === 100
                  ? "bg-emerald-500"
                  : "bg-[#7A2253]"
              }`}
              style={{ width: isLoaded ? `${profileSteps.percentage}%` : "0%" }}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowChecklistModal(true)}
            className="shrink-0 text-[11px] font-semibold text-[#64748b] hover:text-[#7A2253] transition-colors cursor-pointer"
          >
            {profileSteps.completedCount} of {profileSteps.totalCount} completed ({animatedPercentage}%)
          </button>
        </div>
      </section>

      {/* 2. INTERACTIVE METRIC CARDS (GLASSMORPHISM & HOVER-LIFT) */}
      <section className="space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {overview.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="group relative flex flex-col justify-between rounded-2xl border border-[#e2e8f0] bg-white p-3.5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-[#7A2253]/35 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="truncate text-[11px] sm:text-xs font-medium text-[#64748b] group-hover:text-[#7A2253] transition-colors">
                    {item.label}
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#7A2253]/[0.08] text-[#7A2253] group-hover:bg-[#7A2253] group-hover:text-white transition-colors shrink-0">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="mt-3">
                  <span className="block text-xl sm:text-2xl font-black leading-tight tracking-tight tabular-nums text-[#0f172a] group-hover:text-[#7A2253] transition-colors">
                    {item.value}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] sm:text-[11px] text-[#64748b]">
                    {item.sub}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Live Sync Indicator (Right-aligned, clean, non-cluttered) */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] text-[#94a3b8]">Live audience &amp; inventory telemetry</span>
          <button
            type="button"
            onClick={handleRefreshStats}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-2.5 py-1 text-[11px] font-medium text-[#64748b] hover:border-[#7A2253]/30 hover:text-[#7A2253] hover:bg-[#FAF5F8] shadow-2xs transition-all cursor-pointer"
            title="Refresh follower counts"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin text-[#7A2253]" : "text-[#7A2253]"}`} />
            <span>Fanbase synced {formatSyncDate(socials.updatedAt)}</span>
          </button>
        </div>
      </section>


      {/* 4. MONETIZATION & TRUST STRIP: Collabs, Bio Links & Highlighted Reviews */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/dashboard/mediakit"
          className="flex items-center justify-between rounded-2xl border border-[#e2e8f0] bg-white p-4 transition-all hover:border-[#7A2253]/30 hover:shadow-xs group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7A2253]/[0.08] text-[#7A2253]">
              <Briefcase className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#0f172a] truncate group-hover:text-[#7A2253] transition-colors">
                Collab Packages
              </p>
              <p className="text-[11px] text-[#64748b] truncate mt-0.5">
                {activePackagesCount} active rate cards · Media kit
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[#cbd5e1] group-hover:text-[#7A2253] shrink-0 transition-colors" />
        </Link>

        <Link
          href="/dashboard/links"
          className="flex items-center justify-between rounded-2xl border border-[#e2e8f0] bg-white p-4 transition-all hover:border-[#7A2253]/30 hover:shadow-xs group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7A2253]/[0.08] text-[#7A2253]">
              <Link2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#0f172a] truncate group-hover:text-[#7A2253] transition-colors">
                Custom Links
              </p>
              <p className="text-[11px] text-[#64748b] truncate mt-0.5">
                {customLinks.length} active on your bio page
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[#cbd5e1] group-hover:text-[#7A2253] shrink-0 transition-colors" />
        </Link>

        {/* Client Reviews Card — Highlighted Warm Amber Empty State */}
        {reviews.length === 0 ? (
          <div className="flex flex-col justify-between rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/90 via-amber-50/40 to-white p-4 shadow-xs ring-1 ring-amber-400/20">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 ring-1 ring-amber-300/80">
                  <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-[#0f172a]">Client Reviews</p>
                    <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 uppercase tracking-wide">
                      0 verified · Action Needed
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748b] truncate mt-0.5">
                    Ask past clients for quick verified testimonials
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/reviews"
                className="shrink-0 text-[11px] font-bold text-[#7A2253] hover:underline"
              >
                All &gt;
              </Link>
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#7A2253] hover:bg-[#631841] text-white text-xs font-bold py-2 px-3.5 transition-all shadow-md shadow-[#7A2253]/25 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Request a Review</span>
              </button>
            </div>
          </div>
        ) : (
          <Link
            href="/dashboard/reviews"
            className="flex items-center justify-between rounded-2xl border border-[#e2e8f0] bg-white p-4 transition-all hover:border-[#7A2253]/30 hover:shadow-xs group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#0f172a] truncate group-hover:text-[#7A2253] transition-colors">
                  Client Reviews
                </p>
                <p className="text-[11px] text-[#64748b] truncate mt-0.5">
                  {reviews.length} verified {reviews.length === 1 ? "testimonial" : "testimonials"}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#cbd5e1] group-hover:text-[#7A2253] shrink-0 transition-colors" />
          </Link>
        )}
      </section>

      {/* 5. COMPACT ANALYTICS FEED — UNIFIED METRIC STRIP */}
      <section className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#7A2253]" />
            <h2 className={sectionTitle}>
              Last 30 Days <span className="text-xs font-normal text-[#64748b]">· Public page performance</span>
            </h2>
          </div>
          <Link href="/dashboard/analytics" className={quietLink}>
            Analytics <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Unified Metric Strip (Seamless 3-in-1 layout) */}
        <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#e2e8f0] rounded-xl border border-[#e2e8f0] bg-zinc-50/70 overflow-hidden">
          <div className="flex items-center gap-3.5 p-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Eye className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <span className="block text-[11px] font-medium text-[#64748b]">Profile Opens</span>
              <span className="text-xl font-black text-[#0f172a] tabular-nums">
                {analytics.profileViews.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Users className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <span className="block text-[11px] font-medium text-[#64748b]">Unique Visitors</span>
              <span className="text-xl font-black text-[#0f172a] tabular-nums">
                {analytics.uniqueVisitors.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <MousePointerClick className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <span className="block text-[11px] font-medium text-[#64748b]">Episode Clicks</span>
              <span className="text-xl font-black text-[#0f172a] tabular-nums">
                {analytics.episodeClicks.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {topEpisodeTargets.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-[#f1f5f9]">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">Top clicked episodes</p>
            <ul className="space-y-1.5">
              {topEpisodeTargets.map((item, index) => {
                const clicks = Number(item.clicks || 0);
                return (
                  <li key={`${item.event_target}-${index}`} className="flex items-center justify-between gap-3 text-xs">
                    <span className="min-w-0 truncate font-medium text-[#334155]">{resolveTarget(item.event_target)}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-[#64748b] bg-zinc-100 px-2 py-0.5 rounded-md">
                      {clicks.toLocaleString("en-IN")} {clicks === 1 ? "click" : "clicks"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* 6. VISUAL QUOTA BAR — PRO PLAN RESOURCE CONSUMPTION */}
      {showQuotaPanel && (
        <section className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2">
              <h2 className={sectionTitle}>
                {quota.name} plan <span className="text-xs font-normal text-[#64748b]">· Resource consumption</span>
              </h2>
              {quotaItems.some((i) => i.max !== Infinity && (i.current / i.max) >= 0.8) && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                  Limits near capacity
                </span>
              )}
            </div>
            <Link href="/dashboard/subscription" className={quietLink}>
              Manage plan &amp; limits <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quotaItems.map((item) => {
              const percentage = item.max === Infinity ? 0 : Math.min(100, Math.round((item.current / item.max) * 100));
              const isCritical = item.max !== Infinity && percentage >= 90;
              const isWarning = item.max !== Infinity && percentage >= 80 && percentage < 90;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group rounded-xl border border-[#e2e8f0] bg-zinc-50/60 p-3 transition-all hover:bg-white hover:border-[#7A2253]/30 hover:shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#0f172a] group-hover:text-[#7A2253] transition-colors">
                      {item.label}
                    </span>
                    <span className="text-xs font-bold tabular-nums text-[#0f172a]">
                      {item.current.toLocaleString("en-IN")}{" "}
                      <span className="text-[#94a3b8] font-normal">/ {formatQuotaLimit(item.max)}</span>
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="mt-2 h-2 w-full rounded-full bg-[#eef2f7] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isCritical
                          ? "bg-rose-600"
                          : isWarning
                          ? "bg-amber-500"
                          : "bg-[#7A2253]"
                      }`}
                      style={{ width: item.max === Infinity ? "8%" : `${percentage}%` }}
                    />
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[10px]">
                    <span className={`font-semibold ${isCritical ? "text-rose-600" : isWarning ? "text-amber-600" : "text-[#7A2253]"}`}>
                      {item.max === Infinity ? "Unlimited tier" : `${percentage}% consumed`}
                    </span>
                    <span className="text-[#94a3b8]">
                      {formatQuotaRemaining(item.current, item.max)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Direct Review Request Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        size="md"
        title="Request Client Review"
        description="Invite a brand or past client to leave a verified testimonial for your public media kit."
        icon={<Star className="h-5 w-5 text-amber-500 fill-amber-500" />}
      >
        <form onSubmit={(e) => handleCreateReviewRequest(e, false)}>
          <ModalBody className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                Client / Brand Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Nykaa, BoAt, Spotify, or Rohan Mehra"
                required
                className="w-full rounded-xl border border-[#e2e8f0] px-3.5 py-2 text-xs text-[#0f172a] outline-none focus:border-[#7A2253] focus:ring-2 focus:ring-[#7A2253]/15 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                Client Email <span className="text-[#94a3b8] font-normal">(optional, for instant invite email)</span>
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@company.com"
                className="w-full rounded-xl border border-[#e2e8f0] px-3.5 py-2 text-xs text-[#0f172a] outline-none focus:border-[#7A2253] focus:ring-2 focus:ring-[#7A2253]/15 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                Project / Collab Title <span className="text-[#94a3b8] font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g. Diwali Reel Campaign, Podcast Sponsorship"
                className="w-full rounded-xl border border-[#e2e8f0] px-3.5 py-2 text-xs text-[#0f172a] outline-none focus:border-[#7A2253] focus:ring-2 focus:ring-[#7A2253]/15 transition-all"
              />
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[11px] text-amber-900 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Verified reviews display directly on your public bio page &amp; rate card. You can approve or reject reviews before they appear publicly.
              </span>
            </div>
          </ModalBody>
          <ModalFooter>
            <div className="flex w-full items-center justify-between gap-2">
              <button
                type="button"
                onClick={(e) => handleCreateReviewRequest(e, true)}
                disabled={isSubmittingReview || !clientName.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2 text-xs font-semibold text-[#0f172a] hover:bg-[#f8fafc] disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5 text-[#64748b]" />
                <span>Copy invite link</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="rounded-xl border border-transparent px-3 py-2 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview || !clientName.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#7A2253] hover:bg-[#631841] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#7A2253]/25 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSubmittingReview ? "Creating..." : clientEmail.trim() ? "Send Invite" : "Generate Link"}</span>
                </button>
              </div>
            </div>
          </ModalFooter>
        </form>
      </Modal>

      {/* Profile Readiness & Dopamine Reward Checklist Modal */}
      <Modal
        isOpen={showChecklistModal}
        onClose={() => setShowChecklistModal(false)}
        size="md"
        title="Profile Readiness Checklist"
        description="Complete all 7 elements to reach 100% and unlock VIP Creator status."
        icon={<Trophy className="h-5 w-5 text-amber-500" />}
      >
        <ModalBody className="space-y-4">
          {/* Progress Header */}
          <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-[#475569]">
                {profileSteps.completedCount} of {profileSteps.totalCount} completed
              </span>
              <span className="font-bold text-[#7A2253]">{profileSteps.percentage}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#e2e8f0]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  profileSteps.percentage === 100
                    ? "bg-emerald-500"
                    : "bg-[#7A2253]"
                }`}
                style={{ width: `${profileSteps.percentage}%` }}
              />
            </div>
          </div>

          {/* Checklist Items */}
          <div className="divide-y divide-[#f1f5f9] rounded-xl border border-[#e2e8f0] bg-white overflow-hidden">
            {profileSteps.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 transition-colors hover:bg-[#f8fafc]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-[#cbd5e1] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-semibold truncate ${
                        item.completed ? "text-[#0f172a]" : "text-[#1e293b]"
                      }`}
                    >
                      {item.label}
                    </p>
                    <p className="text-[11px] text-[#64748b] truncate">{item.hint}</p>
                  </div>
                </div>

                {item.completed ? (
                  <span className="shrink-0 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Completed ✓
                  </span>
                ) : (
                  <Link
                    href={item.link}
                    onClick={() => setShowChecklistModal(false)}
                    className="shrink-0 inline-flex items-center gap-1 rounded-md bg-[#7A2253] hover:bg-brand-hover text-white text-[11px] font-semibold px-2.5 py-1 transition-colors cursor-pointer"
                  >
                    <span>{item.actionLabel}</span>
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Dopamine Reward Card */}
          {profileSteps.percentage === 100 ? (
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white p-4 text-emerald-950">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                <h4 className="text-xs font-bold text-emerald-900">VIP Creator Discovery Active 🎉</h4>
              </div>
              <p className="mt-1 text-[11px] text-emerald-800 leading-relaxed">
                Congratulations! Your profile has reached 100% completion. You now receive priority placement in brand discovery, an official verified showcase badge, and optimized media kit indexing.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 p-3.5 text-[#0f172a]">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
                <h4 className="text-xs font-bold text-[#0f172a]">Reach 100% to Unlock VIP Creator Reward</h4>
              </div>
              <p className="mt-1 text-[11px] text-[#64748b] leading-relaxed">
                Hit 100% readiness to unlock priority brand matching, verified search rankings, and a 30-day Pro Media Kit boost!
              </p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            onClick={() => setShowChecklistModal(false)}
            className="rounded-lg border border-[#e2e8f0] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0f172a] hover:bg-[#f8fafc] cursor-pointer"
          >
            Close
          </button>
        </ModalFooter>
      </Modal>



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
