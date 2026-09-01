"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Share2,
  ArrowLeft,
  Play,
  Film,
  Layers,
  CheckCircle2,
  Clock,
  Globe,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  Tv,
  Info,
  ChevronDown,
} from "lucide-react";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { Series, Episode } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { formatCount, buildSeriesUrl } from "@/utils/format";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { ShareSeriesModal } from "@/components/shared/ShareSeriesModal";
import { Logo } from "@/components/shared/Logo";
import { PublicCreatorInfo } from "@/lib/publicSeriesService";

function extractYoutubeId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : null;
}

function getEpisodeThumbnail(ep?: Episode): string | null {
  if (!ep) return null;
  if (ep.thumbnailDataUrl) return ep.thumbnailDataUrl;
  const ytId = extractYoutubeId(ep.externalUrl);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }
  return null;
}

function getPlatformInfo(platformStr?: string, urlStr?: string) {
  const p = (platformStr || "").toLowerCase();
  const u = (urlStr || "").toLowerCase();

  if (p.includes("youtube") || u.includes("youtube.com") || u.includes("youtu.be")) {
    return {
      name: "YouTube",
      icon: <YoutubeIcon className="h-3.5 w-3.5 text-white" />,
      gradient: "from-red-600 to-red-700",
      glow: "shadow-red-500/20",
      badge: "bg-red-600 text-white",
    };
  }
  if (p.includes("instagram") || u.includes("instagram.com")) {
    return {
      name: "Instagram",
      icon: <InstagramIcon className="h-3.5 w-3.5 text-white" />,
      gradient: "from-amber-500 via-rose-500 to-purple-600",
      glow: "shadow-rose-500/20",
      badge: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white",
    };
  }
  if (p.includes("facebook") || u.includes("facebook.com")) {
    return {
      name: "Facebook",
      icon: <FacebookIcon className="h-3.5 w-3.5 text-white" />,
      gradient: "from-blue-600 to-blue-700",
      glow: "shadow-blue-500/20",
      badge: "bg-blue-600 text-white",
    };
  }
  return {
    name: platformStr || "Watch",
    icon: <Film className="h-3.5 w-3.5 text-white" />,
    gradient: "from-[#803D63] to-[#6D3254]",
    glow: "shadow-purple-500/20",
    badge: "bg-[#803D63] text-white",
  };
}

interface SeriesDetailClientProps {
  username: string;
  seriesId: string;
  initialSeries: Series | null;
  initialCreator: PublicCreatorInfo | null;
}

export function SeriesDetailClient({
  username: initialUsername,
  seriesId,
  initialSeries,
  initialCreator,
}: SeriesDetailClientProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [series, setSeries] = useState<Series | null>(initialSeries);
  const [creator, setCreator] = useState<PublicCreatorInfo | null>(initialCreator);
  const [loading, setLoading] = useState(!initialSeries);
  const [notFound, setNotFound] = useState(!initialSeries && !loading);
  const [activeEp, setActiveEp] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroImageError, setHeroImageError] = useState(false);

  // Client-side fallback fetch if initial data is missing
  useEffect(() => {
    if (series) return;

    async function loadClientData() {
      try {
        setLoading(true);
        const usernameParam = decodeURIComponent(initialUsername || "").trim();
        const seriesIdParam = decodeURIComponent(seriesId || "").trim();

        if (usernameParam === "demo_creator") {
          const { EXPERT_DEMO_SERIES, EXPERT_DEMO_PROFILE } = await import("@/data/expertDemoCreator");
          const found = EXPERT_DEMO_SERIES.find((s) => s.id === seriesIdParam);
          if (found) {
            setSeries(found);
            setCreator({
              displayName: EXPERT_DEMO_PROFILE.displayName,
              username: EXPERT_DEMO_PROFILE.username,
              photoDataUrl: EXPERT_DEMO_PROFILE.photoDataUrl,
              bio: EXPERT_DEMO_PROFILE.bio,
              category: EXPERT_DEMO_PROFILE.category,
              themeKey: "minimal-white",
              totalFanbase: 1345000,
            });
            setLoading(false);
            return;
          }
        }

        const res = await fetch(`/api/series?username=${encodeURIComponent(usernameParam)}`);
        if (res.ok) {
          const data = await res.json();
          const list: Series[] = data.series || [];
          const found = list.find((s) => s.id === seriesIdParam);
          if (found) {
            setSeries(found);
            const profRes = await fetch(`/api/creator/profile?username=${encodeURIComponent(usernameParam)}`);
            if (profRes.ok) {
              const profData = await profRes.json();
              if (profData.profile) {
                setCreator({
                  displayName: profData.profile.displayName || usernameParam,
                  username: profData.profile.username || usernameParam,
                  photoDataUrl: profData.profile.photoDataUrl,
                  bio: profData.profile.bio,
                  category: profData.profile.category,
                  themeKey: profData.profile.themeKey || "minimal-white",
                  totalFanbase: profData.profile.totalFanbase || 0,
                });
              }
            }
          } else {
            setNotFound(true);
          }
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Client fetch error:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadClientData();
  }, [initialUsername, seriesId, series]);

  // Navbar background change on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 60) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const username = creator?.username || initialUsername;
  const profileUrl = `/${username}`;

  const allEpisodes: Episode[] = useMemo(() => {
    if (!series) return [];
    if (Array.isArray(series.seasons) && series.seasons.length > 0) {
      return series.seasons.flatMap((sn) => (sn && Array.isArray(sn.episodes) ? sn.episodes : []));
    }
    return (series as any).episodes || [];
  }, [series]);

  const firstPlayableEp: Episode | undefined = useMemo(() => {
    return allEpisodes.find((ep: Episode) => ep.externalUrl && ep.externalUrl.trim() !== "") || allEpisodes[0];
  }, [allEpisodes]);

  // Determine hero background image following strict hierarchy
  const heroImageSrc = useMemo(() => {
    if (heroImageError) return null;
    // 1. Dedicated series cover/banner
    if (series?.posterDataUrl) return series.posterDataUrl;
    // 2. First episode thumbnail
    const firstEpThumb = getEpisodeThumbnail(firstPlayableEp);
    if (firstEpThumb) return firstEpThumb;
    // 3. Creator photo
    if (creator?.photoDataUrl) return creator.photoDataUrl;
    return null;
  }, [series?.posterDataUrl, firstPlayableEp, creator?.photoDataUrl, heroImageError]);

  async function handleCopyLink() {
    if (!series) return;
    const url = buildSeriesUrl(username, series.id);
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedLink(true);
      showToast("Series link copied to clipboard! 📋✨", "success");
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      showToast("Link: " + url, "info");
    }
  }

  function scrollToEpisodes() {
    const el = document.getElementById("episodes");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  // ── LOADING SKELETON ──
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        {/* Navigation Skeleton */}
        <div className="w-full px-6 py-4 flex items-center justify-between border-b border-white/10">
          <div className="h-9 w-28 bg-white/10 rounded-xl animate-pulse" />
          <div className="flex gap-2">
            <div className="h-9 w-20 bg-white/10 rounded-xl animate-pulse" />
            <div className="h-9 w-24 bg-white/10 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Hero Skeleton */}
        <div className="w-full h-[70vh] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 flex flex-col justify-end p-6 sm:p-12 relative overflow-hidden">
          <div className="max-w-4xl space-y-4">
            <div className="h-6 w-32 bg-white/10 rounded-full animate-pulse" />
            <div className="h-12 w-3/4 bg-white/15 rounded-2xl animate-pulse" />
            <div className="h-5 w-full max-w-xl bg-white/10 rounded-xl animate-pulse" />
            <div className="flex gap-3 pt-2">
              <div className="h-12 w-40 bg-[#803D63]/50 rounded-2xl animate-pulse" />
              <div className="h-12 w-36 bg-white/10 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>

        {/* Episodes Skeleton */}
        <div className="max-w-7xl w-full mx-auto px-6 py-10 space-y-4">
          <div className="h-7 w-36 bg-white/10 rounded-xl animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 w-full bg-slate-900/60 border border-white/10 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── SERIES NOT FOUND ──
  if (notFound || !series) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden flex items-center justify-center">
          <div className="h-96 w-96 rounded-full bg-[#803D63]/15 blur-3xl" />
        </div>

        <main className="relative z-10 mx-auto max-w-lg text-center space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-8 sm:p-10 shadow-2xl space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#803D63] text-white shadow-xl shadow-[#803D63]/30 ring-4 ring-white/10">
              <Film className="h-10 w-10 stroke-[2.2]" />
            </div>

            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#803D63]/20 border border-[#803D63]/40 px-3 py-1 text-[11px] font-bold text-[#F7EDF3] uppercase tracking-wider">
                <span>Series Unavailable</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                This Series isn’t available
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-md mx-auto">
                This OTT series playlist or episode collection doesn’t exist, has been removed, or is currently private.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push(profileUrl)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#803D63] hover:bg-[#6F3456] px-6 py-3 text-xs font-bold text-white shadow-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to @{username}&apos;s Profile</span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 px-6 py-3 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
              >
                <span>Explore Inflixo</span>
              </button>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-500">
            One link for your content, fanbase, and series.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-[#803D63] selection:text-white relative font-sans">
      {/* ========================================================================= */}
      {/* 1. TOP CINEMATIC NAVIGATION LAYER */}
      {/* ========================================================================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-250 ${
          scrolled
            ? "bg-slate-950/90 backdrop-blur-md border-b border-white/10 shadow-xl py-3"
            : "bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-transparent py-4 sm:py-5"
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
          {/* Left: Brand & Back to Creator Link */}
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            <Logo size="sm" light={true} />

            <div className="h-5 w-px bg-white/20 hidden sm:block" />

            <Link
              href={`/${username}`}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition-all group shrink-0"
              title={`Return to ${creator?.displayName || username}'s profile`}
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span className="truncate max-w-[140px] sm:max-w-[200px]">
                Back to @{username}
              </span>
            </Link>
          </div>

          {/* Right: Actions (Copy Link, Share, View Creator Profile) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 backdrop-blur-md px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
              title="Copy series URL"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="hidden md:inline text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Copy Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 px-3 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
              title="Share this series"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {creator && (
              <Link
                href={`/${username}`}
                className="hidden lg:flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 backdrop-blur-md pl-1.5 pr-3 py-1 text-xs font-bold text-white transition-colors ml-1 group"
              >
                <CreatorAvatar
                  src={creator.photoDataUrl}
                  name={creator.displayName || username}
                  className="w-6 h-6 rounded-lg object-cover"
                  textClassName="text-[10px] font-bold text-white"
                  fallbackBgClass="bg-[#803D63]"
                />
                <span className="truncate max-w-[120px]">{creator.displayName}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. FULL-SCREEN CINEMATIC HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative w-full min-h-[75vh] sm:min-h-[80vh] md:min-h-[85vh] flex flex-col justify-end overflow-hidden bg-slate-950">
        {/* Hero Background Image */}
        {heroImageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImageSrc}
            alt={series.title}
            onError={() => setHeroImageError(true)}
            className="absolute inset-0 h-full w-full object-cover object-center scale-105 transition-transform duration-700 select-none"
          />
        ) : (
          /* Branded Fallback Visual */
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#803D63]/25 to-slate-950 flex items-center justify-center">
            <div className="h-[600px] w-[600px] rounded-full bg-[#803D63]/10 blur-3xl pointer-events-none" />
            <Film className="h-32 w-32 text-white/5 stroke-1" />
          </div>
        )}

        {/* Cinematic Layered Vignette & Dark Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent w-full md:w-3/4" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-transparent h-40" />

        {/* Hero Content Container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-32 sm:pt-40 pb-12 sm:pb-16 flex flex-col justify-end space-y-4 sm:space-y-5">
          {/* Genre / Tag Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#803D63] text-white text-xs font-extrabold uppercase tracking-wider shadow-md">
              <Tv className="h-3 w-3" />
              <span>Series</span>
            </span>

            {series.genre &&
              series.genre.split(",").map((g, idx) => {
                const cleanG = g.trim().replace(/^Genre:\s*/i, "");
                if (!cleanG) return null;
                return (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/20 backdrop-blur-md border border-white/20 text-slate-100 text-xs font-bold uppercase tracking-wider"
                  >
                    {cleanG}
                  </span>
                );
              })}

            {series.language && (
              <span className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 text-slate-300 text-xs font-semibold">
                {series.language}
              </span>
            )}
          </div>

          {/* Series Title */}
          <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-xl leading-[1.1] max-w-4xl">
            {series.title}
          </h1>

          {/* Series Meta Byline */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm font-medium text-slate-300">
            {creator && (
              <Link
                href={`/${username}`}
                className="inline-flex items-center gap-1.5 text-white font-bold hover:text-[#F7EDF3] transition-colors group"
              >
                <span>by</span>
                <span className="underline underline-offset-4 decoration-[#803D63] group-hover:decoration-white">
                  {creator.displayName}
                </span>
                <CheckCircle2 className="h-3.5 w-3.5 text-[#803D63] inline" />
              </Link>
            )}

            <span className="text-white/40">•</span>

            <span className="font-bold text-white">
              {allEpisodes.length} {allEpisodes.length === 1 ? "Episode" : "Episodes"}
            </span>

            <span className="text-white/40">•</span>

            <span className="text-slate-300">High Definition Streaming</span>
          </div>

          {/* Series Description */}
          {series.description && (
            <p className="text-xs sm:text-sm md:text-base text-slate-200/90 leading-relaxed max-w-2xl font-normal drop-shadow-md line-clamp-3 sm:line-clamp-4">
              {series.description}
            </p>
          )}

          {/* Hero Action Buttons */}
          <div className="pt-2 sm:pt-4 flex flex-wrap items-center gap-3 sm:gap-4">
            {firstPlayableEp?.externalUrl ? (
              <a
                href={firstPlayableEp.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#803D63] hover:bg-[#6F3456] active:scale-98 text-white px-6 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-bold shadow-xl shadow-[#803D63]/30 transition-all cursor-pointer"
              >
                <Play className="h-4 sm:h-5 w-4 sm:w-5 fill-current" />
                <span>Play Episode 1</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-white/10 text-white/50 px-6 py-3.5 text-xs sm:text-sm font-semibold cursor-not-allowed border border-white/10"
              >
                <Play className="h-4 w-4" />
                <span>Episodes Coming Soon</span>
              </button>
            )}

            {allEpisodes.length > 0 && (
              <button
                type="button"
                onClick={scrollToEpisodes}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-98 backdrop-blur-md border border-white/20 text-white px-5 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm font-bold transition-all cursor-pointer"
              >
                <Layers className="h-4 w-4" />
                <span>View Episodes ({allEpisodes.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-98 backdrop-blur-md border border-white/15 text-white p-3.5 sm:p-4 transition-all cursor-pointer"
              title="Share Series"
              aria-label="Share Series"
            >
              <Share2 className="h-4 sm:h-5 w-4 sm:w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. EPISODES LIST SECTION */}
      {/* ========================================================================= */}
      <section id="episodes" className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-16 space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#803D63] text-white">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black font-display text-white">
                Episodes
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {allEpisodes.length} {allEpisodes.length === 1 ? "Episode" : "Episodes"} Available in Season 1
              </p>
            </div>
          </div>
        </div>

        {allEpisodes.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md space-y-3">
            <Film className="h-10 w-10 mx-auto text-[#803D63] opacity-60" />
            <h3 className="font-bold text-base text-white">No episodes published yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              The creator hasn&apos;t added any video links to this playlist yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {allEpisodes.map((ep: Episode, index: number) => {
              const plat = getPlatformInfo(ep.platform, ep.externalUrl);
              const epNumStr =
                ep.episodeNumber < 10
                  ? `0${ep.episodeNumber}`
                  : `${ep.episodeNumber}`;
              const epTitleStr = ep.title?.trim() || `Episode ${ep.episodeNumber || index + 1}`;
              const thumbnailSrc = getEpisodeThumbnail(ep);
              const isActive = activeEp === ep.id;

              return (
                <div
                  key={ep.id || index}
                  onMouseEnter={() => setActiveEp(ep.id)}
                  onMouseLeave={() => setActiveEp(null)}
                  className="group rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-900/90 hover:border-[#803D63]/50 transition-all duration-200 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md"
                >
                  {/* Left: Thumbnail & Episode Number */}
                  <div className="flex items-center sm:items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                    {/* Thumbnail / Aspect Container */}
                    <div className="relative w-28 sm:w-44 aspect-[16/9] rounded-xl overflow-hidden bg-slate-950 border border-white/10 shrink-0 shadow-inner">
                      {thumbnailSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbnailSrc}
                          alt={epTitleStr}
                          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-slate-900 text-slate-600">
                          <Film className="h-6 w-6 opacity-40" />
                        </div>
                      )}

                      {/* Play overlay on hover */}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                        <div className="h-8 w-8 rounded-full bg-[#803D63] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="h-3.5 w-3.5 fill-white ml-0.5" />
                        </div>
                      </div>

                      {/* Episode order badge on thumbnail */}
                      <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[10px] font-bold text-white border border-white/10">
                        E{epNumStr}
                      </div>
                    </div>

                    {/* Episode Information */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md ${plat.badge}`}>
                          {plat.icon}
                          <span>{plat.name}</span>
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          Episode {ep.episodeNumber || index + 1}
                        </span>
                      </div>

                      <h3 className="font-display text-sm sm:text-base font-bold text-white group-hover:text-[#F7EDF3] transition-colors truncate">
                        {epTitleStr}
                      </h3>

                      {ep.description && (
                        <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed">
                          {ep.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Watch Action Button */}
                  <div className="shrink-0 flex items-center justify-end">
                    {ep.externalUrl ? (
                      <a
                        href={ep.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6F3456] px-4 sm:px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
                      >
                        <Play className="h-3.5 w-3.5 fill-white" />
                        <span>Watch on {plat.name}</span>
                        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                      </a>
                    ) : (
                      <span className="text-xs font-semibold text-slate-500 italic">
                        Link Unavailable
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 4. ABOUT THE CREATOR SECTION */}
      {/* ========================================================================= */}
      {creator && (
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 pb-16">
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
            <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
              <CreatorAvatar
                src={creator.photoDataUrl}
                name={creator.displayName || username}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 ring-2 ring-white/10"
                textClassName="text-xl sm:text-2xl font-black text-white"
                fallbackBgClass="bg-[#803D63]"
              />

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base sm:text-xl font-bold text-white truncate">
                    {creator.displayName}
                  </h3>
                  <CheckCircle2 className="h-4 w-4 text-[#803D63] shrink-0" />
                </div>

                <p className="text-xs sm:text-sm text-slate-400 font-medium">
                  @{creator.username}
                </p>

                {creator.bio && (
                  <p className="text-xs text-slate-300 font-normal leading-relaxed line-clamp-2 max-w-xl pt-0.5">
                    {creator.bio}
                  </p>
                )}

                {creator.totalFanbase && creator.totalFanbase > 0 && (
                  <p className="text-[11px] font-bold text-[#F7EDF3] pt-1">
                    {formatCount(creator.totalFanbase)} Total Audience Reach
                  </p>
                )}
              </div>
            </div>

            <div className="shrink-0 flex sm:self-center">
              <Link
                href={`/${username}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 px-5 py-3 text-xs sm:text-sm font-bold shadow-lg transition-colors"
              >
                <span>View Creator Profile</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. FOOTER BRANDING */}
      {/* ========================================================================= */}
      <footer className="w-full border-t border-white/10 py-8 px-4 sm:px-8 text-center text-xs text-slate-500">
        <p>
          Cinematic OTT series viewing experience powered by{" "}
          <Link href="/" className="font-bold text-[#F7EDF3] hover:underline">
            Inflixo
          </Link>
        </p>
      </footer>

      {/* ========================================================================= */}
      {/* 6. STANDARDIZED SHARE MODAL */}
      {/* ========================================================================= */}
      {series && (
        <ShareSeriesModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          series={series}
          username={username}
        />
      )}
    </div>
  );
}
