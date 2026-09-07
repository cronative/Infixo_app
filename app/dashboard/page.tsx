"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Layers,
  Briefcase,
  Star,
  Plus,
  Play,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Film,
  Palette,
  Edit2,
  ChevronRight,
  Link2,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { formatCount, formatSyncDate } from "@/utils/format";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import {
  getSeriesUsage,
  getTotalEpisodesUsage,
  canCreateSeries,
} from "@/services/subscriptionLimits";
import { LimitReachedModal } from "@/components/ui/LimitReachedModal";
import { reviewsRepository, customLinksRepository } from "@/repositories/localRepository";
import { MediaKitPackage, CreatorReview, CustomLink } from "@/types";

// Eased count-up animation hook for smooth metric reveals
function useCountUp(target: number, durationMs = 900, delayMs = 250): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || target === 0) {
      setCount(target);
      return;
    }

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const timer = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
        // Easing: easeOutQuart
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
  const { profile, socials, series, totalAudience, updateSocials } = useCreator();
  const { showToast } = useToast();

  const [isSyncing, setIsSyncing] = useState(false);
  const [packages, setPackages] = useState<MediaKitPackage[]>([]);
  const [reviews, setReviews] = useState<CreatorReview[]>([]);
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
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

  // Load packages, reviews & custom links from local repository / APIs
  useEffect(() => {
    // 1. Reviews
    const localRev = reviewsRepository.getAll();
    setReviews(localRev);

    // 2. Custom Links
    const localLinks = customLinksRepository.get();
    setCustomLinks(localLinks);

    // 3. Media Kit Packages
    const ident = profile.id || profile.email || profile.username;
    if (ident) {
      fetch(`/api/creator/mediakit?identifier=${encodeURIComponent(ident)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.packages)) {
            setPackages(data.packages);
          }
        })
        .catch(() => {
          // fallback gracefully
        });
    }
  }, [profile]);

  function handleRefreshStats() {
    setIsSyncing(true);
    updateSocials({});
    showToast("Audience stats refreshed! ✨");
    setTimeout(() => {
      setIsSyncing(false);
    }, 400);
  }

  function handleCreateSeriesClick() {
    if (!canCreateSeries(series)) {
      setModalState({ isOpen: true, type: "series" });
    } else {
      router.push("/dashboard/series");
    }
  }

  // Early Access Limit calculations
  const seriesUsage = getSeriesUsage(series);
  const totalEpisodesUsage = getTotalEpisodesUsage(series);

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
      const eps = s.seasons?.flatMap((sn) => sn.episodes) || (s as any).episodes || [];
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
      { id: "series", label: "Content series", completed: hasSeries, link: "/dashboard/series" },
      { id: "services", label: "Creator services", completed: hasPackages, link: "/dashboard/mediakit" },
      { id: "reviews", label: "Client reviews", completed: hasReviews, link: "/dashboard/reviews" },
    ];

    const completedCount = items.filter((i) => i.completed).length;
    const percentage = Math.round((completedCount / items.length) * 100);

    return { items, completedCount, totalCount: items.length, percentage };
  }, [profile, connectedSocialsCount, customLinks, series, packages, reviews]);

  // Animated counters
  const animatedFanbase = useCountUp(totalAudience, 1000, 250);
  const animatedPercentage = useCountUp(profileSteps.percentage, 900, 300);

  // Dynamic next best step recommendation
  const nextStep = useMemo(() => {
    if (series.length === 0) {
      return {
        title: "Organize your first multi-part content series.",
        description: "Group your related reels and videos so followers can watch every part in order.",
        ctaLabel: "Create First Series",
        ctaHref: "/dashboard/series",
        onClick: handleCreateSeriesClick,
      };
    }
    if (totalEpisodesCount === 0) {
      return {
        title: "Add the first episode to your series.",
        description: "Upload or link your video episodes to bring your showcase playlist alive.",
        ctaLabel: "Add Episode",
        ctaHref: "/dashboard/series",
      };
    }
    if (packages.length === 0) {
      return {
        title: "Show brands how they can work with you.",
        description: "Set up sponsorship rates and deliverables for brand collaboration inquiries.",
        ctaLabel: "Add Creator Service",
        ctaHref: "/dashboard/mediakit",
      };
    }
    if (reviews.length === 0) {
      return {
        title: "Turn completed collaborations into visible trust.",
        description: "Request verified reviews from brands and clients you have worked with.",
        ctaLabel: "Request Review",
        ctaHref: "/dashboard/reviews",
      };
    }
    return {
      title: "Your creator profile is ready to share.",
      description: "Everything is set up. Share your public profile link in your bio and pitch decks.",
      ctaLabel: "View & Share Profile",
      ctaHref: `/${handleStr}`,
      isExternal: true,
    };
  }, [series, totalEpisodesCount, packages, reviews, handleStr]);

  return (
    <div className="space-y-6">
      {/* 1. PROFILE READINESS CARD */}
      <section
        style={{ animationDelay: "0ms" }}
        className="rounded-2xl border border-[#E4DAD5] bg-white p-5 sm:p-6 shadow-none transition-all duration-300 animate-fade-in-up"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Creator Details */}
          <div className="flex items-center gap-3.5 min-w-0">
            <CreatorAvatar
              src={profile.photoDataUrl}
              name={displayName}
              className="w-12 h-12 rounded-full border border-[#E4DAD5] overflow-hidden object-cover aspect-square shrink-0"
              textClassName="text-sm font-bold text-[#241618]"
              fallbackBgClass="bg-[#F3DDE0]"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base sm:text-lg font-bold text-[#241618] truncate">
                  {displayName}
                </h2>
                {profile.isVerified && (
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[#B85C6B]" />
                )}
                {/* Live Badge with maroon pulsing dot */}
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#8C3F4D] bg-[#F3DDE0] px-2.5 py-0.5 rounded-full border border-[#B85C6B]/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B85C6B] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B85C6B]" />
                  </span>
                  Live
                </span>
              </div>
              <p className="text-xs text-[#6B5A5D] font-medium mt-0.5">
                @{handleStr}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E4DAD5] bg-white hover:bg-[#fbfbfb] px-3.5 py-2 text-xs font-semibold text-[#241618] transition-colors cursor-pointer shadow-xs"
            >
              <span>Edit Profile</span>
            </Link>
            <a
              href={`/${handleStr}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#B85C6B] hover:bg-[#8C3F4D] px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
            >
              <span>View Profile</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Merged Single-Line Profile Completion & Progress Bar */}
        <div className="mt-5 pt-4 border-t border-[#E4DAD5] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#241618]">
              Profile completion — {profileSteps.completedCount} of {profileSteps.totalCount} steps done
            </span>
            <span className="font-display font-bold text-[#B85C6B] text-sm tabular-nums">
              {animatedPercentage}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#fbfbfb] border border-[#E4DAD5] overflow-hidden">
            <div
              className="h-full bg-[#B85C6B] rounded-full transition-all duration-700 ease-out"
              style={{ width: isLoaded ? `${profileSteps.percentage}%` : "0%" }}
            />
          </div>
        </div>
      </section>

      {/* 2. COMPACT CREATOR STATISTICS (4 equal cards, Sentence case labels, standardized icon containers) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Stat 1: Total Fanbase */}
        <div
          style={{ animationDelay: "60ms" }}
          className="rounded-2xl border border-[#E4DAD5] bg-white p-4 sm:p-5 space-y-3 shadow-none flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md animate-fade-in-up"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B5A5D]">
              Total fanbase
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleRefreshStats}
                className="p-1 rounded-lg text-[#6B5A5D] hover:text-[#B85C6B] hover:bg-[#F3DDE0] transition-colors cursor-pointer"
                title={`Last synced: ${formatSyncDate(socials.updatedAt)}. Click to refresh.`}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-[#B85C6B]" : ""}`} />
              </button>
              <div className="h-8 w-8 rounded-xl bg-[#F3DDE0] flex items-center justify-center text-[#8C3F4D]">
                <Users className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div>
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#241618] tabular-nums">
              {formatCount(animatedFanbase)}
            </p>
            <p className="text-[11px] text-[#6B5A5D] font-medium mt-0.5">
              Across {connectedSocialsCount} connected {connectedSocialsCount === 1 ? "account" : "accounts"}
            </p>
          </div>
          <Link
            href="/dashboard/socials"
            className="text-[11px] font-semibold text-[#B85C6B] hover:text-[#8C3F4D] hover:underline inline-flex items-center gap-1 pt-1"
          >
            <span>View breakdown</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Stat 2: Content Series */}
        <div
          style={{ animationDelay: "120ms" }}
          className="rounded-2xl border border-[#E4DAD5] bg-white p-4 sm:p-5 space-y-3 shadow-none flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md animate-fade-in-up"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B5A5D]">
              Content series
            </span>
            <div className="h-8 w-8 rounded-xl bg-[#F3DDE0] flex items-center justify-center text-[#8C3F4D]">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#241618]">
              {series.length}
            </p>
            <p className="text-[11px] text-[#6B5A5D] font-medium mt-0.5">
              {totalEpisodesCount} published {totalEpisodesCount === 1 ? "episode" : "episodes"}
            </p>
          </div>
          <Link
            href="/dashboard/series"
            className="text-[11px] font-semibold text-[#B85C6B] hover:text-[#8C3F4D] hover:underline inline-flex items-center gap-1 pt-1"
          >
            <span>Manage series</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Stat 3: Creator Services */}
        <div
          style={{ animationDelay: "180ms" }}
          className="rounded-2xl border border-[#E4DAD5] bg-white p-4 sm:p-5 space-y-3 shadow-none flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md animate-fade-in-up"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B5A5D]">
              Services &amp; gigs
            </span>
            <div className="h-8 w-8 rounded-xl bg-[#F3DDE0] flex items-center justify-center text-[#8C3F4D]">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#241618]">
              {packages.length}
            </p>
            <p className="text-[11px] text-[#6B5A5D] font-medium mt-0.5">
              {packages.length > 0 ? "Active brand packages" : "Add how brands can work with you"}
            </p>
          </div>
          <Link
            href="/dashboard/mediakit"
            className="text-[11px] font-semibold text-[#B85C6B] hover:text-[#8C3F4D] hover:underline inline-flex items-center gap-1 pt-1"
          >
            <span>{packages.length > 0 ? "Manage packages" : "Add service"}</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Stat 4: Client Reviews */}
        <div
          style={{ animationDelay: "240ms" }}
          className="rounded-2xl border border-[#E4DAD5] bg-white p-4 sm:p-5 space-y-3 shadow-none flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md animate-fade-in-up"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B5A5D]">
              Client reviews
            </span>
            <div className="h-8 w-8 rounded-xl bg-[#F3DDE0] flex items-center justify-center text-[#8C3F4D]">
              <Star className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#241618]">
              {reviews.length}
            </p>
            <p className="text-[11px] text-[#6B5A5D] font-medium mt-0.5">
              {reviews.length > 0 ? "Verified brand ratings" : "Request your first review"}
            </p>
          </div>
          <Link
            href="/dashboard/reviews"
            className="text-[11px] font-semibold text-[#B85C6B] hover:text-[#8C3F4D] hover:underline inline-flex items-center gap-1 pt-1"
          >
            <span>{reviews.length > 0 ? "View reviews" : "Request review"}</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      {/* 3. RECOMMENDED NEXT BEST STEP CARD */}
      <section
        style={{ animationDelay: "300ms" }}
        className="rounded-2xl border border-[#E4DAD5] bg-white p-5 sm:p-6 shadow-none space-y-4 animate-fade-in-up"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#8C3F4D] bg-[#F3DDE0] px-2.5 py-0.5 rounded-full border border-[#B85C6B]/20">
              Next best step
            </span>
            <h3 className="font-display text-base sm:text-lg font-bold text-[#241618]">
              {nextStep.title}
            </h3>
            <p className="text-xs text-[#6B5A5D] font-medium max-w-xl leading-relaxed">
              {nextStep.description}
            </p>
          </div>

          <div className="shrink-0">
            {nextStep.isExternal ? (
              <a
                href={nextStep.ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#B85C6B] hover:bg-[#8C3F4D] px-4 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
              >
                <span>{nextStep.ctaLabel}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : nextStep.onClick ? (
              <button
                type="button"
                onClick={nextStep.onClick}
                className="inline-flex items-center gap-2 rounded-xl bg-[#B85C6B] hover:bg-[#8C3F4D] px-4 py-2.5 text-xs font-semibold text-white transition-colors shadow-xs cursor-pointer"
              >
                <span>{nextStep.ctaLabel}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <Link
                href={nextStep.ctaHref}
                className="inline-flex items-center gap-2 rounded-xl bg-[#B85C6B] hover:bg-[#8C3F4D] px-4 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
              >
                <span>{nextStep.ctaLabel}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Secondary Quick Action Links */}
        <div className="pt-3 border-t border-[#E4DAD5] flex flex-wrap items-center gap-4 text-xs font-semibold text-[#6B5A5D]">
          <span className="text-[11px] text-[#6B5A5D] uppercase tracking-wider font-bold">Quick shortcuts:</span>
          <Link href="/dashboard/series" className="hover:text-[#B85C6B] transition-colors inline-flex items-center gap-1">
            <Plus className="h-3 w-3" /> Add Series
          </Link>
          <Link href="/dashboard/socials" className="hover:text-[#B85C6B] transition-colors inline-flex items-center gap-1">
            <Link2 className="h-3 w-3" /> Add Link
          </Link>
          <Link href="/dashboard/themes" className="hover:text-[#B85C6B] transition-colors inline-flex items-center gap-1">
            <Palette className="h-3 w-3" /> Change Theme
          </Link>
          <Link href="/dashboard/reviews" className="hover:text-[#B85C6B] transition-colors inline-flex items-center gap-1">
            <Star className="h-3 w-3" /> Request Review
          </Link>
        </div>
      </section>

      {/* 4. CREATOR WORKSPACE SUMMARY (2x2 Grid) */}
      <section
        style={{ animationDelay: "360ms" }}
        className="space-y-3 animate-fade-in-up"
      >
        <div className="px-0.5">
          <h3 className="font-display text-sm font-bold text-[#241618]">
            Workspace summary
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Card 1: Content */}
          <Link
            href="/dashboard/series"
            className="group rounded-2xl border border-[#E4DAD5] bg-white p-4 sm:p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-[#B85C6B]/40 shadow-none flex items-start justify-between gap-3"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F3DDE0] text-[#8C3F4D]">
                  <Layers className="h-4 w-4" />
                </div>
                <h4 className="font-display text-sm font-bold text-[#241618] group-hover:text-[#B85C6B] transition-colors">
                  Content &amp; Series
                </h4>
              </div>
              <p className="text-xs text-[#6B5A5D] font-medium leading-relaxed">
                {series.length} {series.length === 1 ? "series" : "series"} with {totalEpisodesCount} total {totalEpisodesCount === 1 ? "episode" : "episodes"} organized.
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#6B5A5D] group-hover:text-[#B85C6B] transition-transform group-hover:translate-x-0.5 shrink-0 mt-1" />
          </Link>

          {/* Card 2: Services & Brand Work */}
          <Link
            href="/dashboard/mediakit"
            className="group rounded-2xl border border-[#E4DAD5] bg-white p-4 sm:p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-[#B85C6B]/40 shadow-none flex items-start justify-between gap-3"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F3DDE0] text-[#8C3F4D]">
                  <Briefcase className="h-4 w-4" />
                </div>
                <h4 className="font-display text-sm font-bold text-[#241618] group-hover:text-[#B85C6B] transition-colors">
                  Services &amp; Brand Work
                </h4>
              </div>
              <p className="text-xs text-[#6B5A5D] font-medium leading-relaxed">
                {packages.length > 0 ? `${packages.length} active collaboration packages configured.` : "Show brands how they can collaborate with you."}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#6B5A5D] group-hover:text-[#B85C6B] transition-transform group-hover:translate-x-0.5 shrink-0 mt-1" />
          </Link>

          {/* Card 3: Reviews */}
          <Link
            href="/dashboard/reviews"
            className="group rounded-2xl border border-[#E4DAD5] bg-white p-4 sm:p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-[#B85C6B]/40 shadow-none flex items-start justify-between gap-3"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F3DDE0] text-[#8C3F4D]">
                  <Star className="h-4 w-4" />
                </div>
                <h4 className="font-display text-sm font-bold text-[#241618] group-hover:text-[#B85C6B] transition-colors">
                  Client Reviews
                </h4>
              </div>
              <p className="text-xs text-[#6B5A5D] font-medium leading-relaxed">
                {reviews.length > 0 ? `${reviews.length} verified client reviews displayed on your profile.` : "Turn completed brand collaborations into visible trust."}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#6B5A5D] group-hover:text-[#B85C6B] transition-transform group-hover:translate-x-0.5 shrink-0 mt-1" />
          </Link>

          {/* Card 4: Links & Socials */}
          <Link
            href="/dashboard/socials"
            className="group rounded-2xl border border-[#E4DAD5] bg-white p-4 sm:p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-[#B85C6B]/40 shadow-none flex items-start justify-between gap-3"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F3DDE0] text-[#8C3F4D]">
                  <Share2 className="h-4 w-4" />
                </div>
                <h4 className="font-display text-sm font-bold text-[#241618] group-hover:text-[#B85C6B] transition-colors">
                  Links &amp; Socials
                </h4>
              </div>
              <p className="text-xs text-[#6B5A5D] font-medium leading-relaxed">
                {connectedSocialsCount} connected platforms and {customLinks.length} custom links live.
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#6B5A5D] group-hover:text-[#B85C6B] transition-transform group-hover:translate-x-0.5 shrink-0 mt-1" />
          </Link>
        </div>
      </section>

      {/* 5. RECENT CONTENT SECTION (Max 3 items) */}
      <section
        style={{ animationDelay: "420ms" }}
        className="space-y-3 animate-fade-in-up"
      >
        <div className="flex items-center justify-between px-0.5">
          <div>
            <h3 className="font-display text-sm font-bold text-[#241618]">
              Recent content
            </h3>
            <p className="text-xs text-[#6B5A5D] font-medium mt-0.5">
              Your latest series and episodes.
            </p>
          </div>
          <Link
            href="/dashboard/series"
            className="text-xs font-semibold text-[#B85C6B] hover:text-[#8C3F4D] hover:underline inline-flex items-center gap-1"
          >
            <span>Manage content</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {series.length === 0 ? (
          <div className="rounded-2xl border border-[#E4DAD5] bg-white p-6 sm:p-8 text-center space-y-3 shadow-none">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3DDE0] text-[#8C3F4D] mx-auto">
              <Film className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display text-sm font-bold text-[#241618]">
                Start your first content series
              </h4>
              <p className="text-xs text-[#6B5A5D] font-medium max-w-sm mx-auto leading-relaxed">
                Organize related reels and videos so followers can watch every part in the correct order.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreateSeriesClick}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#B85C6B] hover:bg-[#8C3F4D] px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create First Series</span>
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E4DAD5] bg-white divide-y divide-[#E4DAD5] overflow-hidden shadow-none">
            {series.slice(0, 3).map((s) => {
              const eps = s.seasons?.flatMap((sn) => sn.episodes) || (s as any).episodes || [];
              return (
                <div
                  key={s.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#fbfbfb]/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3DDE0] text-[#8C3F4D] shrink-0 font-bold text-xs">
                      <Film className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-display text-sm font-bold text-[#241618] truncate">
                        {s.title}
                      </h4>
                      <p className="text-xs text-[#6B5A5D] font-medium mt-0.5">
                        {s.genre || "Series"} • {eps.length} {eps.length === 1 ? "Episode" : "Episodes"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <Link
                      href="/dashboard/series"
                      className="inline-flex items-center gap-1 rounded-xl border border-[#E4DAD5] bg-white hover:bg-[#fbfbfb] px-3 py-1.5 text-xs font-semibold text-[#241618] transition-colors"
                    >
                      <Edit2 className="h-3 w-3 text-[#6B5A5D]" />
                      <span>Manage</span>
                    </Link>
                    <a
                      href={`/${handleStr}/series/${s.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl border border-[#E4DAD5] bg-[#fbfbfb] hover:bg-white px-3 py-1.5 text-xs font-semibold text-[#B85C6B] transition-colors"
                    >
                      <span>View</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 6. MINIMAL EARLY ACCESS USAGE CARD */}
      <section
        style={{ animationDelay: "480ms" }}
        className="rounded-2xl border border-[#E4DAD5] bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-none animate-fade-in-up"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-[#F3DDE0] flex items-center justify-center text-[#8C3F4D] shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#241618]">Early Access Active</p>
            <p className="text-xs text-[#6B5A5D] font-medium mt-0.5">
              {seriesUsage.current} of 3 series used • {totalEpisodesUsage.current} of 15 episodes used
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/subscription"
          className="text-xs font-semibold text-[#B85C6B] hover:text-[#8C3F4D] hover:underline shrink-0"
        >
          View Plan →
        </Link>
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
