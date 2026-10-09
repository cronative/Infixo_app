"use client";

import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Eye,
  MousePointerClick,
  ShoppingBag,
  Share2,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Plus,
  Tv,
  Briefcase,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ChevronDown,
  X,
  MessageCircle,
  AlertCircle,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { formatMetricNumber, pluralize, buildProfileUrl } from "@/utils/format";
import { canCreateSeries, canAddProduct, getPlanQuota } from "@/services/subscriptionLimits";
import { LimitReachedModal } from "@/components/ui/LimitReachedModal";
import { QRCode } from "@/components/creator-card/QRCode";
import { copyToClipboard } from "@/lib/copyToClipboard";

interface DashboardSummaryData {
  fanbase: number;
  resultsStrip: {
    fanbase: { value: number; label: string };
    uniqueVisitors: { value: number; prior: number; deltaPercentage: number; label: string };
    linkClicks: { value: number; prior: number; deltaPercentage: number; label: string };
    productClicks: { value: number; prior: number; deltaPercentage: number; label: string };
  };
  topWorkingItems: {
    id: string;
    rank: number;
    title: string;
    category: "episode" | "link" | "product";
    categoryLabel: string;
    clicks: number;
    editUrl: string;
    subtitle?: string;
  }[];
  trafficSources: {
    totalEvents: number;
    isCollectingData: boolean;
    sources: { source: string; label: string; count: number; percentage: number }[];
  };
  todayHighlights: {
    id: string;
    title: string;
    description: string;
    actionLabel?: string;
    actionUrl?: string;
  }[];
  inventoryCounts: {
    series: number;
    products: number;
    collabPackages: number;
    customLinks: number;
  };
}

export default function DashboardOverviewPage() {
  const router = useRouter();
  const { profile, socials, series, subscription, refresh } = useCreator();
  const { showToast } = useToast();

  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const [limitModalState, setLimitModalState] = useState<{
    isOpen: boolean;
    type: "series" | "product";
  }>({
    isOpen: false,
    type: "series",
  });

  const shareDropdownRef = useRef<HTMLDivElement>(null);

  const planKey = (subscription?.planKey || "free").toLowerCase();
  const isPro = planKey === "pro" || planKey === "creator_pro" || (subscription?.status === "active" && planKey !== "free" && planKey !== "early_access");

  const cleanHandle = (profile.username || "creator").replace(/^@/, "");
  const fullProfileUrl = buildProfileUrl(cleanHandle);

  // Load Summary Data
  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/summary");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSummary(json.data);
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard summary:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Handle outside click for Share dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(event.target as Node)) {
        setShowShareDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleRefreshStats() {
    setIsSyncing(true);
    try {
      await Promise.all([refresh(), loadSummary()]);
      showToast("Dashboard stats refreshed! ✨");
    } catch {
      showToast("Refreshed! ✨");
    } finally {
      setTimeout(() => setIsSyncing(false), 400);
    }
  }

  const handleCopyLink = async () => {
    const success = await copyToClipboard(fullProfileUrl);
    if (success) {
      setCopied(true);
      showToast("Profile link copied! ✨");
      setTimeout(() => setCopied(false), 2000);
    } else {
      showToast("Could not copy link", "error");
    }
    setShowShareDropdown(false);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Check out my creator page on Inflixo: ${fullProfileUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    setShowShareDropdown(false);
  };

  // Profile completion calculation (EXCLUDING Client Reviews, 6 items total)
  const completionData = useMemo(() => {
    const hasProfileDetails = Boolean(profile.displayName && (profile.bio || profile.category));
    let connectedSocialsCount = 0;
    if (socials.instagram?.username || socials.instagram?.url) connectedSocialsCount++;
    if (socials.youtube?.username || socials.youtube?.url) connectedSocialsCount++;
    if (socials.facebook?.username || socials.facebook?.url) connectedSocialsCount++;
    const hasSocials = connectedSocialsCount > 0;

    const customLinksCount = summary?.inventoryCounts?.customLinks ?? 0;
    const hasLinks = customLinksCount > 0;

    const seriesCount = summary?.inventoryCounts?.series ?? series.length;
    const hasSeries = seriesCount > 0;

    const productsCount = summary?.inventoryCounts?.products ?? 0;
    const hasProducts = productsCount > 0;

    const packagesCount = summary?.inventoryCounts?.collabPackages ?? 0;
    const hasPackages = packagesCount > 0;

    const checklist = [
      { id: "profile", label: "Profile details", completed: hasProfileDetails, link: "/dashboard/profile", actionLabel: "Add bio" },
      { id: "socials", label: "Connected socials", completed: hasSocials, link: "/dashboard/socials", actionLabel: "Connect" },
      { id: "links", label: "Bio links", completed: hasLinks, link: "/dashboard/links", actionLabel: "Add link" },
      { id: "series", label: "Content series", completed: hasSeries, link: "/dashboard/series", actionLabel: "Create series" },
      { id: "products", label: "Shop products", completed: hasProducts, link: "/dashboard/products", actionLabel: "Add product" },
      { id: "services", label: "Collab rates", completed: hasPackages, link: "/dashboard/mediakit", actionLabel: "Set rates" },
    ];

    const completedCount = checklist.filter((item) => item.completed).length;
    const totalCount = checklist.length; // 6 items
    const percentage = Math.round((completedCount / totalCount) * 100);
    const nextMissing = checklist.find((item) => !item.completed);

    return {
      completedCount,
      totalCount,
      percentage,
      isComplete: completedCount === totalCount,
      nextMissing,
    };
  }, [profile, socials, series.length, summary]);

  // Quick Action handlers
  const handleNewEpisodeClick = () => {
    if (!canCreateSeries(series, planKey)) {
      setLimitModalState({ isOpen: true, type: "series" });
    } else {
      router.push("/dashboard/series");
    }
  };

  const handleAddProductClick = () => {
    const productsCount = summary?.inventoryCounts?.products || 0;
    if (!canAddProduct(productsCount, planKey)) {
      setLimitModalState({ isOpen: true, type: "product" });
    } else {
      router.push("/dashboard/products");
    }
  };

  const displayName = profile.displayName || profile.email?.split("@")[0] || "Creator";

  // Data helpers
  const results = summary?.resultsStrip;
  const fanbaseVal = results?.fanbase?.value ?? 0;
  const visitorsVal = results?.uniqueVisitors?.value ?? 0;
  const visitorsDelta = results?.uniqueVisitors?.deltaPercentage ?? 0;
  const linkClicksVal = results?.linkClicks?.value ?? 0;
  const linkClicksDelta = results?.linkClicks?.deltaPercentage ?? 0;
  const productClicksVal = results?.productClicks?.value ?? 0;
  const productClicksDelta = results?.productClicks?.deltaPercentage ?? 0;

  const topItems = summary?.topWorkingItems || [];
  const trafficSources = summary?.trafficSources?.sources || [];
  const isTrafficCollecting = summary?.trafficSources?.isCollectingData ?? true;
  const highlights = summary?.todayHighlights || [];

  const freeQuota = getPlanQuota(planKey);
  const currentProducts = summary?.inventoryCounts?.products || 0;

  return (
    <div className="min-h-full space-y-6 pb-12 text-slate-900">
      {/* 1. Header Bar: Profile info, sync, and Share Profile button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3 min-w-0">
          <CreatorAvatar
            src={profile.photoDataUrl}
            name={displayName}
            className="h-12 w-12 shrink-0 rounded-full border border-slate-200"
          />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
              {displayName}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="truncate">@{cleanHandle}</span>
              <span>·</span>
              <a
                href={fullProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#B85C6B] hover:underline"
              >
                <span>View Live</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefreshStats}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh statistics"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isSyncing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Share Profile Maroon Button with Dropdown */}
          <div className="relative" ref={shareDropdownRef}>
            <button
              onClick={() => setShowShareDropdown(!showShareDropdown)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#B85C6B] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#a34f5e] transition-colors cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share Profile</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showShareDropdown ? "rotate-180" : ""}`} />
            </button>

            {showShareDropdown && (
              <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg z-30 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-400" />}
                  <span>{copied ? "Link Copied!" : "Copy Profile Link"}</span>
                </button>
                <button
                  onClick={handleWhatsAppShare}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-500" />
                  <span>Share on WhatsApp</span>
                </button>
                <button
                  onClick={() => {
                    setShowShareDropdown(false);
                    setShowQrModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <QrCode className="h-4 w-4 text-slate-500" />
                  <span>Show QR Code</span>
                </button>
                <div className="my-1 border-t border-slate-100" />
                <a
                  href={fullProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                    <span>Open in New Tab</span>
                  </span>
                  <ArrowUpRight className="h-3 w-3 text-slate-400" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Profile Completion Bar: ONLY shown while < 100%, slim one-line banner, excludes reviews */}
      {!completionData.isComplete && completionData.nextMissing && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-xl border border-[#B85C6B]/20 bg-[#B85C6B]/[0.04] px-4 py-2.5 text-xs text-slate-800">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#B85C6B] shrink-0" />
            <p className="font-medium text-slate-700">
              Profile completion:{" "}
              <strong className="text-slate-900 font-bold">
                {completionData.completedCount} of {completionData.totalCount} steps ({completionData.percentage}%)
              </strong>{" "}
              · Next: {completionData.nextMissing.label}
            </p>
          </div>
          <Link
            href={completionData.nextMissing.link}
            className="inline-flex items-center gap-1 font-bold text-[#B85C6B] hover:underline shrink-0"
          >
            <span>{completionData.nextMissing.actionLabel}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* 3. Today Bar: What should I do today? (Highlights + 4 Quick Actions) */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              What Should I Do Today?
            </h2>
          </div>
          <span className="text-[11px] font-medium text-slate-400">Action Plan</span>
        </div>

        {/* Dynamic Highlights (1 to 3 items) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {highlights.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 hover:border-slate-200 transition-colors"
            >
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-900 leading-snug">{item.title}</p>
                <p className="text-[11px] text-slate-500 leading-relaxed font-normal">{item.description}</p>
              </div>
              {item.actionUrl && item.actionLabel && (
                <div className="pt-3">
                  {item.actionUrl === "#share" ? (
                    <button
                      onClick={() => setShowShareDropdown(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B85C6B] hover:underline cursor-pointer"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  ) : (
                    <Link
                      href={item.actionUrl}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B85C6B] hover:underline"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 4 Quick Action Buttons */}
        <div className="border-t border-slate-100 pt-3.5 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick actions:</span>
          <button
            onClick={() => setShowShareDropdown(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <Share2 className="h-3.5 w-3.5 text-[#B85C6B]" />
            <span>Share Profile</span>
          </button>
          <button
            onClick={handleNewEpisodeClick}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <Tv className="h-3.5 w-3.5 text-slate-500" />
            <span>New Episode</span>
          </button>
          <button
            onClick={handleAddProductClick}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <ShoppingBag className="h-3.5 w-3.5 text-slate-500" />
            <span>Add Product</span>
          </button>
          <Link
            href="/dashboard/mediakit"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <Briefcase className="h-3.5 w-3.5 text-slate-500" />
            <span>Open Media Kit</span>
          </Link>
        </div>
      </section>

      {/* 4. Results Strip: How am I growing? (4-box strip) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            How Am I Growing?
          </h2>
          <span className="text-[11px] font-medium text-slate-400">Last 30 Days</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Card 1: Fanbase */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Fanbase</span>
              <Users className="h-4 w-4 text-[#B85C6B]" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
              {formatMetricNumber(fanbaseVal)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">Across connected socials</p>
          </div>

          {/* Card 2: 30d Unique Visitors */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">30d Unique Visitors</span>
              <Eye className="h-4 w-4 text-slate-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                {formatMetricNumber(visitorsVal)}
              </p>
              {visitorsDelta > 0 ? (
                <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  ↑ {visitorsDelta}%
                </span>
              ) : visitorsDelta < 0 ? (
                <span className="inline-flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                  ↓ {Math.abs(visitorsDelta)}%
                </span>
              ) : (
                <span className="text-xs font-medium text-slate-400">0%</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">vs prior 30-day window</p>
          </div>

          {/* Card 3: 30d Link Clicks */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">30d Link Clicks</span>
              <MousePointerClick className="h-4 w-4 text-slate-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                {formatMetricNumber(linkClicksVal)}
              </p>
              {linkClicksDelta > 0 ? (
                <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  ↑ {linkClicksDelta}%
                </span>
              ) : linkClicksDelta < 0 ? (
                <span className="inline-flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                  ↓ {Math.abs(linkClicksDelta)}%
                </span>
              ) : (
                <span className="text-xs font-medium text-slate-400">0%</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Bio link interactions</p>
          </div>

          {/* Card 4: 30d Product Clicks */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">30d Product Clicks</span>
              <ShoppingBag className="h-4 w-4 text-slate-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                {formatMetricNumber(productClicksVal)}
              </p>
              {productClicksDelta > 0 ? (
                <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  ↑ {productClicksDelta}%
                </span>
              ) : productClicksDelta < 0 ? (
                <span className="inline-flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                  ↓ {Math.abs(productClicksDelta)}%
                </span>
              ) : (
                <span className="text-xs font-medium text-slate-400">0%</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Shop &amp; guide interest</p>
          </div>
        </div>
      </section>

      {/* 5. What's Working? & Traffic Sources (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): What's Working? (Top 5 Ranked Items) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                What&apos;s Working?
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Top 5 performing content items ranked by 30-day clicks
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-[#B85C6B]" />
          </div>

          {topItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center space-y-2.5">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <MousePointerClick className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-slate-800">No click data yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Share your profile link in your Instagram or YouTube bio to start seeing your top performing episodes, links, and products.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setShowShareDropdown(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#B85C6B] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#a34f5e] cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share Profile</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3.5 first:pt-1 last:pb-1 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-700">
                      #{item.rank}
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            item.category === "episode"
                              ? "bg-[#B85C6B]/10 text-[#B85C6B]"
                              : item.category === "product"
                              ? "bg-amber-50 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.categoryLabel}
                        </span>
                        <p className="text-xs sm:text-[13px] font-semibold text-slate-900 truncate">
                          {item.title}
                        </p>
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-slate-400 truncate font-normal">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-bold text-slate-900 tabular-nums">
                      {pluralize(item.clicks, "click")}
                    </span>
                    <Link
                      href={item.editUrl}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-800 hover:border-slate-300 transition-colors"
                      title={`Edit ${item.categoryLabel}`}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Traffic Sources */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Traffic Sources
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Where your visitors originate</p>
            </div>
            <Share2 className="h-4 w-4 text-slate-400" />
          </div>

          {isTrafficCollecting ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center space-y-2">
              <p className="text-xs font-bold text-slate-700">Collecting audience data...</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                As fans tap your Inflixo link from Instagram, YouTube, and WhatsApp, traffic breakdown percentages will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 pt-1">
              {trafficSources.map((source) => (
                <div key={source.source} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">{source.label}</span>
                    <span className="text-slate-900 font-bold tabular-nums">
                      {source.percentage}%{" "}
                      <span className="text-[11px] font-normal text-slate-400">
                        ({source.count})
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#B85C6B] transition-all duration-500"
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Resource Limits: Pro users see NOTHING; Free users see ONE slim line */}
      {!isPro && (
        <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              Free plan limits:{" "}
              <strong className="text-slate-900 font-semibold">
                {currentProducts}/{freeQuota.maxProducts} products used
              </strong>
            </span>
          </div>
          <Link
            href="/dashboard/subscription"
            className="font-bold text-[#B85C6B] hover:underline shrink-0 inline-flex items-center gap-1"
          >
            <span>Upgrade to Pro for unlimited products &amp; media kit</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 text-center">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Your Profile QR Code</h3>
              <p className="text-xs text-slate-500 font-medium">
                Scan with any phone camera to open @{cleanHandle}&apos;s profile
              </p>
            </div>

            <div className="flex items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <QRCode value={fullProfileUrl} size={180} />
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCopyLink}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#B85C6B] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#a34f5e] cursor-pointer"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? "Link Copied!" : "Copy Profile Link"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Limit Reached Modal */}
      <LimitReachedModal
        isOpen={limitModalState.isOpen}
        onClose={() => setLimitModalState({ isOpen: false, type: "series" })}
        type={limitModalState.type}
        planKey={planKey}
      />
    </div>
  );
}
