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
    if (socials.instagram.username || socials.instagram.url) count++;
    if (socials.youtube.username || socials.youtube.url) count++;
    if (socials.facebook.username || socials.facebook.url) count++;
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
      <section className="rounded-2xl border border-[#E7E3DC] bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Creator Details */}
          <div className="flex items-center gap-3.5 min-w-0">
            <CreatorAvatar
              src={profile.photoDataUrl}
              name={displayName}
              className="w-12 h-12 rounded-full border border-[#E7E3DC] overflow-hidden object-cover aspect-square shrink-0"
              textClassName="text-sm font-bold text-[#181716]"
              fallbackBgClass="bg-[#b85c6b]/[0.09]"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="font-display text-base sm:text-lg font-bold text-[#181716] truncate">
                  {displayName}
                </h2>
                {profile.isVerified && (
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                )}
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Live
                </span>
              </div>
              <p className="text-xs text-[#797570] font-medium mt-0.5">
                @{handleStr} • {profileSteps.completedCount} of {profileSteps.totalCount} profile steps completed
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#F8F7F3] px-3.5 py-2 text-xs font-semibold text-[#181716] transition-colors"
            >
              <span>Edit Profile</span>
            </Link>
            <a
              href={`/${handleStr}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#b85c6b] hover:bg-[#6F3456] px-4 py-2 text-xs font-semibold text-white transition-colors shadow-xs"
            >
              <span>View Profile</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Progress Bar & Checklist Summary */}
        <div className="mt-5 pt-4 border-t border-[#E7E3DC] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#181716]">Profile Completion</span>
            <span className="font-bold text-[#b85c6b]">{profileSteps.percentage}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#F8F7F3] border border-[#E7E3DC] overflow-hidden">
            <div
              className="h-full bg-[#b85c6b] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${profileSteps.percentage}%` }}
            />
          </div>
        </div>
      </section>

      {/* 2. COMPACT CREATOR STATISTICS (4 equal cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Stat 1: Total Fanbase */}
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-4 space-y-2 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#797570] uppercase tracking-wider">
              Total Fanbase
            </span>
            <button
              type="button"
              onClick={handleRefreshStats}
              className="p-1 rounded-lg text-[#797570] hover:text-[#b85c6b] hover:bg-[#b85c6b]/[0.09] transition-colors cursor-pointer"
              title={`Last synced: ${formatSyncDate(socials.updatedAt)}. Click to refresh.`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-[#b85c6b]" : ""}`} />
            </button>
          </div>
          <div>
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#181716]">
              {formatCount(totalAudience)}
            </p>
            <p className="text-[11px] text-[#797570] font-medium mt-0.5">
              Across {connectedSocialsCount} connected {connectedSocialsCount === 1 ? "account" : "accounts"}
            </p>
          </div>
          <Link
            href="/dashboard/socials"
            className="text-[11px] font-semibold text-[#b85c6b] hover:underline inline-flex items-center gap-1 pt-1"
          >
            <span>View breakdown</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Stat 2: Content Series */}
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-4 space-y-2 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#797570] uppercase tracking-wider">
              Content Series
            </span>
            <Layers className="h-4 w-4 text-[#b85c6b]" />
          </div>
          <div>
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#181716]">
              {series.length}
            </p>
            <p className="text-[11px] text-[#797570] font-medium mt-0.5">
              {totalEpisodesCount} published {totalEpisodesCount === 1 ? "episode" : "episodes"}
            </p>
          </div>
          <Link
            href="/dashboard/series"
            className="text-[11px] font-semibold text-[#b85c6b] hover:underline inline-flex items-center gap-1 pt-1"
          >
            <span>Manage series</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Stat 3: Creator Services */}
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-4 space-y-2 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#797570] uppercase tracking-wider">
              Services &amp; Gigs
            </span>
            <Briefcase className="h-4 w-4 text-[#b85c6b]" />
          </div>
          <div>
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#181716]">
              {packages.length}
            </p>
            <p className="text-[11px] text-[#797570] font-medium mt-0.5">
              {packages.length > 0 ? "Active brand packages" : "Add how brands can work with you"}
            </p>
          </div>
          <Link
            href="/dashboard/mediakit"
            className="text-[11px] font-semibold text-[#b85c6b] hover:underline inline-flex items-center gap-1 pt-1"
          >
            <span>{packages.length > 0 ? "Manage packages" : "Add service"}</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Stat 4: Client Reviews */}
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-4 space-y-2 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#797570] uppercase tracking-wider">
              Client Reviews
            </span>
            <Star className="h-4 w-4 text-[#b85c6b]" />
          </div>
          <div>
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#181716]">
              {reviews.length}
            </p>
            <p className="text-[11px] text-[#797570] font-medium mt-0.5">
              {reviews.length > 0 ? "Verified brand ratings" : "Request your first review"}
            </p>
          </div>
          <Link
            href="/dashboard/reviews"
            className="text-[11px] font-semibold text-[#b85c6b] hover:underline inline-flex items-center gap-1 pt-1"
          >
            <span>{reviews.length > 0 ? "View reviews" : "Request review"}</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      {/* 3. RECOMMENDED NEXT ACTION CARD */}
      <section className="rounded-2xl border border-[#E7E3DC] bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#b85c6b] bg-[#b85c6b]/[0.09] px-2.5 py-0.5 rounded-full border border-[#b85c6b]/20">
              Next best step
            </span>
            <h3 className="font-display text-base sm:text-lg font-bold text-[#181716]">
              {nextStep.title}
            </h3>
            <p className="text-xs text-[#54514D] font-medium max-w-xl">
              {nextStep.description}
            </p>
          </div>

          <div className="shrink-0">
            {nextStep.isExternal ? (
              <a
                href={nextStep.ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#b85c6b] hover:bg-[#6F3456] px-4 py-2.5 text-xs font-semibold text-white transition-colors shadow-xs"
              >
                <span>{nextStep.ctaLabel}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : nextStep.onClick ? (
              <button
                type="button"
                onClick={nextStep.onClick}
                className="inline-flex items-center gap-2 rounded-xl bg-[#b85c6b] hover:bg-[#6F3456] px-4 py-2.5 text-xs font-semibold text-white transition-colors shadow-xs cursor-pointer"
              >
                <span>{nextStep.ctaLabel}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <Link
                href={nextStep.ctaHref}
                className="inline-flex items-center gap-2 rounded-xl bg-[#b85c6b] hover:bg-[#6F3456] px-4 py-2.5 text-xs font-semibold text-white transition-colors shadow-xs"
              >
                <span>{nextStep.ctaLabel}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Secondary Quick Action Links */}
        <div className="pt-3 border-t border-[#E7E3DC] flex flex-wrap items-center gap-4 text-xs font-semibold text-[#54514D]">
          <span className="text-[11px] text-[#797570] uppercase tracking-wider font-bold">Quick Shortcuts:</span>
          <Link href="/dashboard/series" className="hover:text-[#b85c6b] transition-colors inline-flex items-center gap-1">
            <Plus className="h-3 w-3" /> Add Series
          </Link>
          <Link href="/dashboard/socials" className="hover:text-[#b85c6b] transition-colors inline-flex items-center gap-1">
            <Link2 className="h-3 w-3" /> Add Link
          </Link>
          <Link href="/dashboard/themes" className="hover:text-[#b85c6b] transition-colors inline-flex items-center gap-1">
            <Palette className="h-3 w-3" /> Change Theme
          </Link>
          <Link href="/dashboard/reviews" className="hover:text-[#b85c6b] transition-colors inline-flex items-center gap-1">
            <Star className="h-3 w-3" /> Request Review
          </Link>
        </div>
      </section>

      {/* 4. CREATOR WORKSPACE SUMMARY (2x2 Grid) */}
      <section className="space-y-3">
        <div className="px-0.5">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#797570]">
            Workspace Summary
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Card 1: Content */}
          <Link
            href="/dashboard/series"
            className="group rounded-2xl border border-[#E7E3DC] bg-white p-4 sm:p-5 transition-all hover:border-[#b85c6b]/40 shadow-xs flex items-start justify-between gap-3"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#b85c6b]/[0.09] text-[#b85c6b]">
                  <Layers className="h-3.5 w-3.5" />
                </div>
                <h4 className="font-display text-sm font-bold text-[#181716] group-hover:text-[#b85c6b] transition-colors">
                  Content &amp; Series
                </h4>
              </div>
              <p className="text-xs text-[#54514D] font-medium leading-relaxed">
                {series.length} {series.length === 1 ? "series" : "series"} with {totalEpisodesCount} total {totalEpisodesCount === 1 ? "episode" : "episodes"} organized.
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#797570] group-hover:text-[#b85c6b] transition-transform group-hover:translate-x-0.5 shrink-0 mt-1" />
          </Link>

          {/* Card 2: Services & Brand Work */}
          <Link
            href="/dashboard/mediakit"
            className="group rounded-2xl border border-[#E7E3DC] bg-white p-4 sm:p-5 transition-all hover:border-[#b85c6b]/40 shadow-xs flex items-start justify-between gap-3"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#b85c6b]/[0.09] text-[#b85c6b]">
                  <Briefcase className="h-3.5 w-3.5" />
                </div>
                <h4 className="font-display text-sm font-bold text-[#181716] group-hover:text-[#b85c6b] transition-colors">
                  Services &amp; Brand Work
                </h4>
              </div>
              <p className="text-xs text-[#54514D] font-medium leading-relaxed">
                {packages.length > 0 ? `${packages.length} active collaboration packages configured.` : "Show brands how they can collaborate with you."}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#797570] group-hover:text-[#b85c6b] transition-transform group-hover:translate-x-0.5 shrink-0 mt-1" />
          </Link>

          {/* Card 3: Reviews */}
          <Link
            href="/dashboard/reviews"
            className="group rounded-2xl border border-[#E7E3DC] bg-white p-4 sm:p-5 transition-all hover:border-[#b85c6b]/40 shadow-xs flex items-start justify-between gap-3"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#b85c6b]/[0.09] text-[#b85c6b]">
                  <Star className="h-3.5 w-3.5" />
                </div>
                <h4 className="font-display text-sm font-bold text-[#181716] group-hover:text-[#b85c6b] transition-colors">
                  Client Reviews
                </h4>
              </div>
              <p className="text-xs text-[#54514D] font-medium leading-relaxed">
                {reviews.length > 0 ? `${reviews.length} verified client reviews displayed on your profile.` : "Turn completed brand collaborations into visible trust."}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#797570] group-hover:text-[#b85c6b] transition-transform group-hover:translate-x-0.5 shrink-0 mt-1" />
          </Link>

          {/* Card 4: Links & Socials */}
          <Link
            href="/dashboard/socials"
            className="group rounded-2xl border border-[#E7E3DC] bg-white p-4 sm:p-5 transition-all hover:border-[#b85c6b]/40 shadow-xs flex items-start justify-between gap-3"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#b85c6b]/[0.09] text-[#b85c6b]">
                  <Share2 className="h-3.5 w-3.5" />
                </div>
                <h4 className="font-display text-sm font-bold text-[#181716] group-hover:text-[#b85c6b] transition-colors">
                  Links &amp; Socials
                </h4>
              </div>
              <p className="text-xs text-[#54514D] font-medium leading-relaxed">
                {connectedSocialsCount} connected platforms and {customLinks.length} custom links live.
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#797570] group-hover:text-[#b85c6b] transition-transform group-hover:translate-x-0.5 shrink-0 mt-1" />
          </Link>
        </div>
      </section>

      {/* 5. RECENT CONTENT SECTION (Max 3 items) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#797570]">
              Recent Content
            </h3>
            <p className="text-xs text-[#797570] font-medium mt-0.5">
              Your latest series and episodes.
            </p>
          </div>
          <Link
            href="/dashboard/series"
            className="text-xs font-semibold text-[#b85c6b] hover:underline inline-flex items-center gap-1"
          >
            <span>Manage Content</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {series.length === 0 ? (
          <div className="rounded-2xl border border-[#E7E3DC] bg-white p-6 sm:p-8 text-center space-y-3 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b85c6b]/[0.09] text-[#b85c6b] mx-auto">
              <Film className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display text-sm font-bold text-[#181716]">
                Start your first content series
              </h4>
              <p className="text-xs text-[#54514D] font-medium max-w-sm mx-auto leading-relaxed">
                Organize related reels and videos so followers can watch every part in the correct order.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreateSeriesClick}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#b85c6b] hover:bg-[#6F3456] px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create First Series</span>
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E7E3DC] bg-white divide-y divide-[#E7E3DC] overflow-hidden shadow-xs">
            {series.slice(0, 3).map((s) => {
              const eps = s.seasons?.flatMap((sn) => sn.episodes) || (s as any).episodes || [];
              return (
                <div
                  key={s.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8F7F3] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b85c6b]/[0.09] text-[#b85c6b] shrink-0 font-bold text-xs">
                      <Film className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-display text-sm font-bold text-[#181716] truncate">
                        {s.title}
                      </h4>
                      <p className="text-xs text-[#797570] font-medium mt-0.5">
                        {s.genre || "Series"} • {eps.length} {eps.length === 1 ? "Episode" : "Episodes"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <Link
                      href="/dashboard/series"
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E7E3DC] bg-white hover:bg-[#F8F7F3] px-2.5 py-1 text-xs font-semibold text-[#181716] transition-colors"
                    >
                      <Edit2 className="h-3 w-3 text-[#797570]" />
                      <span>Manage</span>
                    </Link>
                    <a
                      href={`/${handleStr}/series/${s.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E7E3DC] bg-white hover:bg-[#F8F7F3] px-2.5 py-1 text-xs font-semibold text-[#b85c6b] transition-colors"
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
      <section className="rounded-2xl border border-[#E7E3DC] bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <Sparkles className="h-4 w-4 text-[#b85c6b] shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#181716]">Early Access Active</p>
            <p className="text-xs text-[#797570] font-medium mt-0.5">
              {seriesUsage.current} of 3 series used • {totalEpisodesUsage.current} of 15 episodes used
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/subscription"
          className="text-xs font-semibold text-[#b85c6b] hover:underline shrink-0"
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
