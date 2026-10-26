"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Share2,
  Film,
  Copy,
  Layers,
  Sparkles,
  ExternalLink,
  Globe,
  Play,
  ArrowUpRight,
  ArrowLeft,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { Series, Episode, ThemeKey, Season } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { buildSeriesUrl } from "@/utils/format";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { ShareSeriesModal } from "@/components/shared/ShareSeriesModal";
import { PublicCreatorInfo } from "@/lib/publicSeriesService";
import { ThemeService } from "@/services/ThemeService";
import { CreatorPublicShell, PublicCard } from "@/components/public/CreatorPublicShell";
import { PublicPageHeader, PublicIconButton } from "@/components/public/PublicPageHeader";
import { PublicSectionHeader } from "@/components/public/PublicSectionHeader";
import {
  getPublicTheme,
  PUBLIC_CARD_PADDING,
  PUBLIC_CTA_BUTTON,
  PUBLIC_TYPE,
} from "@/components/public/publicTheme";
import { PlatformThumbnailBox, extractYouTubeVideoId } from "@/components/shared/PlatformThumbnailBox";

function getPlatformInfo(platformStr?: string, urlStr?: string) {
  const p = (platformStr || "").toLowerCase();
  const u = (urlStr || "").toLowerCase();

  if (p.includes("youtube") || u.includes("youtube.com") || u.includes("youtu.be")) {
    return {
      name: "YouTube",
      icon: <YoutubeIcon className="h-3.5 w-3.5 text-red-500" />,
    };
  }
  if (p.includes("instagram") || u.includes("instagram.com")) {
    return {
      name: "Instagram",
      icon: <InstagramIcon className="h-3.5 w-3.5 text-pink-500" />,
    };
  }
  if (p.includes("facebook") || u.includes("facebook.com")) {
    return {
      name: "Facebook",
      icon: <FacebookIcon className="h-3.5 w-3.5 text-blue-500" />,
    };
  }
  if (p.includes("multi") || p.includes("mix")) {
    return {
      name: "Multi-Platform",
      icon: <Sparkles className="h-3.5 w-3.5 text-amber-500" />,
    };
  }
  return {
    name: platformStr || "Watch",
    icon: <Film className="h-3.5 w-3.5 text-[#7A2253]" />,
  };
}

function getPublicVisitorId() {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem("inflixo_vid");
  if (existing) return existing;
  const next = `v_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  localStorage.setItem("inflixo_vid", next);
  return next;
}

function createEpisodeClickEventId(seriesId: string, episodeId: string) {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return `episode:${seriesId}:${episodeId}:${randomPart}`;
}

function InlineExpandableDescription({
  text,
  maxChars = 92,
  className = "",
  style,
  buttonStyle,
}: {
  text: string;
  maxChars?: number;
  className?: string;
  style?: React.CSSProperties;
  buttonStyle?: React.CSSProperties;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!text || !text.trim()) return null;

  const isLong = text.length > maxChars + 15;
  if (!isLong) {
    return (
      <p style={style} className={className}>
        {text}
      </p>
    );
  }

  const snippet = (() => {
    const sub = text.slice(0, maxChars);
    const lastSpace = sub.lastIndexOf(" ");
    return (lastSpace > 50 ? sub.slice(0, lastSpace) : sub).replace(/[.,;!?]+$/, "");
  })();

  return (
    <p style={style} className={className}>
      <span>{expanded ? text : `${snippet}...`}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((prev) => !prev);
        }}
        style={buttonStyle}
        className="ml-1 inline-flex items-center text-[11px] sm:text-xs font-bold hover:underline cursor-pointer select-none"
      >
        {expanded ? "Show less" : "Read more"}
      </button>
    </p>
  );
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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [coverImageError, setCoverImageError] = useState(false);
  const [activeSeasonIndex, setActiveSeasonIndex] = useState<number>(0);
  const [isScrolledPastHeader, setIsScrolledPastHeader] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const descMeasureRef = useRef<HTMLParagraphElement>(null);
  const [isDescOverflowing, setIsDescOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      const el = descMeasureRef.current;
      if (!el) return;
      setIsDescOverflowing(el.scrollHeight > el.clientHeight + 1);
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [series?.description]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolledPastHeader((window.scrollY || document.documentElement.scrollTop) > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const prefetchedBackRef = useRef(false);

  // Warm up and prefetch series listing & profile routes for instant back navigation (runs once)
  useEffect(() => {
    if (prefetchedBackRef.current) return;
    const userHandle = creator?.username || initialUsername;
    if (userHandle) {
      prefetchedBackRef.current = true;
      router.prefetch(`/${userHandle}/series`);
      router.prefetch(`/${userHandle}`);
    }
  }, [creator?.username, initialUsername, router]);

  // Client-side fallback fetch if initial SSR data is not present
  useEffect(() => {
    if (series) return;

    async function loadClientData() {
      try {
        setLoading(true);
        const usernameParam = decodeURIComponent(initialUsername || "").trim();
        const seriesIdParam = decodeURIComponent(seriesId || "").trim();

        if (usernameParam === "demo_creator") {
          const { EXPERT_DEMO_SERIES, EXPERT_DEMO_PROFILE, EXPERT_DEMO_THEME } = await import("@/data/expertDemoCreator");
          const found = EXPERT_DEMO_SERIES.find((s) => s.id === seriesIdParam);
          if (found) {
            setSeries(found);
            setCreator({
              displayName: EXPERT_DEMO_PROFILE.displayName,
              username: EXPERT_DEMO_PROFILE.username,
              photoDataUrl: EXPERT_DEMO_PROFILE.photoDataUrl,
              bio: EXPERT_DEMO_PROFILE.bio,
              category: EXPERT_DEMO_PROFILE.category,
              themeKey: EXPERT_DEMO_THEME || "minimal-white",
              totalFanbase: 1345000,
            });
            setLoading(false);
            return;
          }
        }

        const [seriesRes, profRes] = await Promise.all([
          fetch(`/api/series?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({})),
          fetch(`/api/creator/profile?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({})),
        ]);

        const list: Series[] = seriesRes.data?.series || seriesRes.series || [];
        const found = list.find((s) => s.id === seriesIdParam);
        const isProfOk = profRes.status === 1 || profRes.success === true;
        const profile = profRes.data?.profile || profRes.profile;

        if (found && isProfOk && profile) {
          setSeries(found);
          setCreator({
            displayName: profile.displayName || usernameParam,
            username: profile.username || usernameParam,
            photoDataUrl: profile.photoDataUrl,
            bio: profile.bio,
            category: profile.category,
            themeKey: profile.themeKey || "minimal-white",
            totalFanbase: profile.totalFanbase || 0,
          });
          setNotFound(false);
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

  const username = creator?.username || initialUsername;
  const profileUrl = `/${username}`;

  // Theme integration
  const themeKey = (creator?.themeKey || "minimal-white") as ThemeKey;
  const pt = getPublicTheme(themeKey);
  const c = pt.colors;
  const usesDarkControls = pt.isDark;

  const seasonsList: Season[] = useMemo(() => {
    if (!series) return [];
    if (Array.isArray(series.seasons) && series.seasons.length > 0) {
      return series.seasons;
    }
    return [];
  }, [series]);

  const allEpisodes: Episode[] = useMemo(() => {
    if (!series) return [];
    if (seasonsList.length > 0) {
      return seasonsList.flatMap((sn) => (sn && Array.isArray(sn.episodes) ? sn.episodes : []));
    }
    return (series as any).episodes || [];
  }, [series, seasonsList]);

  const currentEpisodes: Episode[] = useMemo(() => {
    if (seasonsList.length > 0 && seasonsList[activeSeasonIndex]) {
      return seasonsList[activeSeasonIndex].episodes || [];
    }
    return allEpisodes;
  }, [seasonsList, activeSeasonIndex, allEpisodes]);

  const detectedPlatform = useMemo(() => {
    if (series?.platform && series.platform.trim()) {
      const p = series.platform.trim();
      if (/multi|mix/i.test(p)) return "Multi-Platform";
      if (/youtube/i.test(p)) return "YouTube";
      if (/instagram/i.test(p)) return "Instagram";
      if (/facebook/i.test(p)) return "Facebook";
      return p;
    }
    const firstUrl = allEpisodes[0]?.externalUrl || "";
    if (firstUrl) {
      if (/youtube\.com|youtu\.be/i.test(firstUrl)) return "YouTube";
      if (/instagram\.com/i.test(firstUrl)) return "Instagram";
      if (/facebook\.com/i.test(firstUrl)) return "Facebook";
    }
    return null;
  }, [series, allEpisodes]);

  const platformInfo = useMemo(() => {
    if (!detectedPlatform) return null;
    return getPlatformInfo(detectedPlatform, allEpisodes[0]?.externalUrl);
  }, [detectedPlatform, allEpisodes]);

  // Valid cover image: only when genuinely available and not errored
  const hasValidCover = Boolean(
    series?.posterDataUrl &&
    typeof series.posterDataUrl === "string" &&
    series.posterDataUrl.trim() !== "" &&
    !coverImageError
  );

  async function handleCopyLink() {
    if (!series) return;
    const url = buildSeriesUrl(username, series.id);
    const success = await copyToClipboard(url);
    if (success) {
      showToast("Series link copied! 📋✨", "success");
    } else {
      showToast("Link: " + url, "info");
    }
  }

  const trackEpisodeClick = (ep: Episode) => {
    try {
      const visitorId = getPublicVisitorId();
      const episodeId = ep.id || `${ep.episodeNumber || ep.title || "episode"}`;
      const currentSeriesId = series?.id || seriesId;
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "episode_click",
          username,
          eventId: createEpisodeClickEventId(currentSeriesId, episodeId),
          visitorId,
          source: "public_series",
          eventTarget: `${currentSeriesId}:${episodeId}`,
          seriesId: series?.id,
          episodeId,
          url: ep.externalUrl,
          metadata: {
            seriesId: currentSeriesId,
            seriesTitle: series?.title,
            episodeId,
            episodeTitle: ep.title,
            episodeNumber: ep.episodeNumber,
            url: ep.externalUrl,
          },
        }),
      }).catch(() => { });
    } catch { }
  };

  // ── LOADING SKELETON (THEME-AWARE) ──
  if (loading) {
    return (
      <CreatorPublicShell themeKey={themeKey}>
        <PublicCard themeKey={themeKey} className={`${PUBLIC_CARD_PADDING} py-4 sm:py-5 animate-pulse`}>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-[5px] bg-black/10" />
            <div className="h-10 w-10 rounded-[5px] bg-black/10" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-32 rounded-[5px] bg-black/10" />
              <div className="h-3 w-20 rounded-[5px] bg-black/10" />
            </div>
          </div>
          <div className="mt-4 h-40 w-full rounded-[5px] bg-black/10" />
          <div className="mx-auto mt-4 h-5 w-1/2 rounded-[5px] bg-black/10" />
          <div className="mx-auto mt-2 h-3.5 w-3/4 rounded-[5px] bg-black/10" />
          <div className="mt-5 space-y-2">
            <div className="h-12 w-full rounded-[5px] bg-black/10" />
            <div className="h-12 w-full rounded-[5px] bg-black/10" />
          </div>
        </PublicCard>
      </CreatorPublicShell>
    );
  }

  // ── NOT FOUND STATE ──
  if (notFound || !series) {
    return (
      <CreatorPublicShell themeKey={themeKey}>
        <PublicCard themeKey={themeKey} className={`${PUBLIC_CARD_PADDING} items-center justify-center py-10 text-center`}>
          <div
            style={pt.elevatedStyle}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-[5px] border"
          >
            <Film className="h-7 w-7" style={{ color: c.accentText }} />
          </div>
          <h1 style={pt.headingStyle} className={`mt-4 ${PUBLIC_TYPE.pageTitle}`}>
            Series isn’t available
          </h1>
          <p style={{ color: c.secondaryText }} className={`mx-auto mt-1.5 max-w-sm ${PUBLIC_TYPE.body}`}>
            This series doesn’t exist, belongs to another creator, or has been removed.
          </p>
          <div className="mt-5 flex w-full max-w-xs flex-col gap-2">
            <button
              type="button"
              onClick={() => router.push(profileUrl)}
              style={{ backgroundColor: c.accent, borderColor: c.accent, color: "#FFFFFF" }}
              className={PUBLIC_CTA_BUTTON}
            >
              Go to @{username}
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              style={pt.controlStyle}
              className={PUBLIC_CTA_BUTTON}
            >
              Explore Inflixo
            </button>
          </div>
        </PublicCard>
      </CreatorPublicShell>
    );
  }

  const genresList = series.genre
    ? series.genre
      .split(/[,•|/]/)
      .map((g) => g.trim().replace(/^Genre:\s*/i, ""))
      .filter(Boolean)
    : [];

  const langTag =
    series.language &&
      series.language.trim() &&
      !genresList.some((g) => g.toLowerCase() === series.language!.trim().toLowerCase())
      ? series.language.trim()
      : null;

  const renderPlatformIcon = (platform?: string | null, cls: string = "h-3.5 w-3.5") => {
    const p = (platform || "").toLowerCase();
    if (p.includes("youtube")) return <YoutubeIcon className={`${cls} text-red-500 fill-red-500 shrink-0`} />;
    if (p.includes("instagram")) return <InstagramIcon className={`${cls} text-pink-500 shrink-0`} />;
    if (p.includes("facebook")) return <FacebookIcon className={`${cls} text-blue-500 fill-blue-500 shrink-0`} />;
    if (p.includes("multi") || p.includes("mix")) return <Sparkles className={`${cls} text-amber-500 shrink-0`} />;
    return <Film className={`${cls} text-slate-400 shrink-0`} />;
  };

  const episodePlatform = (url?: string | null): string | null => {
    if (!url) return null;
    if (/youtube\.com|youtu\.be/i.test(url)) return "YouTube";
    if (/instagram\.com/i.test(url)) return "Instagram";
    if (/facebook\.com|fb\.watch/i.test(url)) return "Facebook";
    return null;
  };

  const allSamePlatform = useMemo(() => {
    if (currentEpisodes.length === 0) return null;
    const getEpPlat = (ep: Episode): string => {
      const detected = episodePlatform(ep.externalUrl);
      if (detected) return detected;
      if (detectedPlatform && detectedPlatform !== "Multi-Platform") return detectedPlatform;
      return "YouTube";
    };

    const first = getEpPlat(currentEpisodes[0]);
    const allMatch = currentEpisodes.every((ep) => getEpPlat(ep).toLowerCase() === first.toLowerCase());
    return allMatch ? first : null;
  }, [currentEpisodes, detectedPlatform]);

  const episodeCountText = `${allEpisodes.length} ${allEpisodes.length === 1 ? "episode" : "episodes"}`;
  const validPlatform =
    detectedPlatform &&
    detectedPlatform !== "Creator" &&
    detectedPlatform !== "Multi-Platform"
      ? detectedPlatform
      : "";

  const metaLineParts: { text: string; icon?: React.ReactNode }[] = [
    { text: episodeCountText },
    ...(series.language && series.language.trim()
      ? [{ text: series.language.trim() }]
      : []),
    ...(validPlatform
      ? [{ text: validPlatform, icon: renderPlatformIcon(validPlatform, "h-3.5 w-3.5") }]
      : []),
  ];

  const isHeaderOnImage = hasValidCover && !isScrolledPastHeader;

  return (
    <CreatorPublicShell
      themeKey={themeKey}
      outside={
        <ShareSeriesModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          series={series}
          username={username}
        />
      }
    >
      <PublicCard themeKey={themeKey} className="overflow-hidden">
        {/* Card content container */}
        <div className="flex-1 flex flex-col relative rounded-t-[5px] overflow-hidden">
          {/* Series Hero: Full width with floating controls, center play button, and bottom-left badge */}
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[380px] shrink-0 rounded-t-[5px] overflow-hidden group bg-slate-900">
            <PlatformThumbnailBox
              posterUrl={series.posterDataUrl}
              videoUrl={allEpisodes[0]?.externalUrl}
              platform={detectedPlatform || series.platform}
              title={series.title}
              badgeText={null}
              className="w-full h-full object-cover"
              size="lg"
              showTitleOverlay={false}
            />

            {/* Top Floating Glass Controls */}
            <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 flex items-center justify-between z-30 pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined" && window.history.length > 1) {
                    router.back();
                    setTimeout(() => {
                      if (typeof window !== "undefined" && window.location.pathname.includes("/series/")) {
                        const profilePath = username === "demo_creator" ? "/demo_creator?tab=watch" : `/${username}?tab=watch`;
                        router.push(profilePath);
                      }
                    }, 350);
                  } else {
                    const profilePath = username === "demo_creator" ? "/demo_creator?tab=watch" : `/${username}?tab=watch`;
                    router.push(profilePath);
                  }
                }}
                className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all cursor-pointer shadow-md"
                title="Back to series"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all cursor-pointer shadow-md"
                  title="Copy series link"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all cursor-pointer shadow-md"
                  title="Share series"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Center Floating White Play Button */}
            {allEpisodes[0]?.externalUrl && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <a
                  href={allEpisodes[0].externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEpisodeClick(allEpisodes[0])}
                  className="group/play cursor-pointer pointer-events-auto"
                  title="Play Episode 1"
                >
                  <span className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-[5px] bg-white text-[#7A2253] shadow-2xl transition-transform duration-300 group-hover/play:scale-110">
                    <Play className="h-6 w-6 fill-[#7A2253] ml-0.5" />
                  </span>
                </a>
              </div>
            )}

            {/* Bottom Subtle Vignette Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 via-black/25 to-transparent pointer-events-none" />

            {/* Bottom-Left Overlay Badge */}
            <div className="absolute left-3.5 bottom-3.5 z-10 pointer-events-none">
              <div className="inline-flex items-center gap-2 rounded-[5px] bg-black/60 backdrop-blur-md px-3.5 py-1.5 text-white text-[11px] font-medium shadow-md">
                <span className="flex items-center gap-1.5">
                  <Play className="h-3 w-3 fill-white" />
                  <span>{allEpisodes.length} Episodes</span>
                </span>
                <span className="opacity-40">|</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  <span>{genresList[0] || "Travel"} Series</span>
                </span>
              </div>
            </div>
          </div>

          {/* Content below hero */}
          <div className="flex flex-col p-4 sm:p-5 space-y-3.5">
            {/* 1. Series Title */}
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
              {series.title}
            </h1>

            {/* 2. Meta line: "5 episodes · Hindi · [IG icon] Instagram" */}
            <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium flex-wrap pt-0.5">
              {metaLineParts.map((part, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5">
                  {idx > 0 && <span className="opacity-40 font-normal">·</span>}
                  {part.icon}
                  <span>{part.text}</span>
                </span>
              ))}
            </div>

            {/* Category Tags as small neutral chips below meta line */}
            {genresList.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {genresList.map((g) => (
                  <span
                    key={g}
                    className="inline-flex items-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 text-xs font-medium"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* 3. Description with Read More / Read Less (measured accurately on 2-line clamp) */}
            {series.description && (
              <div className="relative pt-0.5 text-slate-600 dark:text-slate-300 text-[13px] leading-relaxed break-words">
                <p className={isDescExpanded ? "" : "line-clamp-2"}>
                  {series.description}
                </p>
                {/* Invisible measurement node with line-clamp-2 to check overflow on resize */}
                <p
                  ref={descMeasureRef}
                  aria-hidden="true"
                  className="line-clamp-2 invisible pointer-events-none absolute inset-x-0 top-0.5 -z-50 select-none opacity-0"
                >
                  {series.description}
                </p>
                {isDescOverflowing && (
                  <button
                    type="button"
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="text-[#7A2253] dark:text-pink-400 font-bold text-xs inline-flex items-center gap-1 mt-1 hover:underline cursor-pointer select-none"
                  >
                    <span>{isDescExpanded ? "Read less" : "Read more"}</span>
                    {isDescExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                )}
              </div>
            )}

            {/* 4. Episodes Section */}
            <div className="space-y-3 pt-1">
              {/* Episodes Heading */}
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Episodes ({currentEpisodes.length})
                </h2>
                {allSamePlatform && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                    Episodes open on {allSamePlatform}
                  </p>
                )}
              </div>

              {/* Seasons Selector if multiple seasons */}
              {seasonsList.length > 1 && (
                <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-none">
                  {seasonsList.map((sn, idx) => (
                    <button
                      key={sn.id || idx}
                      type="button"
                      onClick={() => setActiveSeasonIndex(idx)}
                      className={`tap-scale inline-flex h-8 shrink-0 cursor-pointer items-center rounded-lg border px-3 transition-all text-xs font-semibold ${
                        activeSeasonIndex === idx
                          ? "bg-[#7A2253] border-[#7A2253] text-white"
                          : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10"
                      }`}
                    >
                      {sn.title || `Season ${sn.seasonNumber || idx + 1}`} · {sn.episodes?.length || 0}
                    </button>
                  ))}
                </div>
              )}

              {/* Episode Cards (Compact Rows: ~56-60px height, 8px gap) */}
              {currentEpisodes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-white/10 p-6 text-center text-xs text-slate-400">
                  No episodes added to this series yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {currentEpisodes.map((ep: Episode, index: number) => {
                    const partNum = ep.episodeNumber || index + 1;
                    const partNumStr = partNum < 10 ? `0${partNum}` : `${partNum}`;
                    const epTitleStr = ep.title?.trim() || `Episode ${partNum}`;
                    const cleanTitle = epTitleStr.replace(/^Part\s*0?\d+[:\s-]*/i, "").replace(/^Episode\s*0?\d+[:\s-]*/i, "").trim() || epTitleStr;
                    const epPlatformName = episodePlatform(ep.externalUrl) || detectedPlatform || "Video";

                    return (
                      <a
                        key={ep.id || index}
                        href={ep.externalUrl || "#"}
                        target={ep.externalUrl ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        onClick={() => trackEpisodeClick(ep)}
                        aria-label={`Watch episode ${partNum}: ${cleanTitle} on ${epPlatformName}`}
                        className="group/ep flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-zinc-900 hover:bg-[#7A2253]/[0.03] dark:hover:bg-white/[0.04] hover:border-[#7A2253]/30 dark:hover:border-white/20 transition-all text-left focus-visible:ring-2 focus-visible:ring-[#7A2253] focus-visible:outline-hidden cursor-pointer"
                      >
                        {/* Left: Number Box (36×36) + (Optional Mixed Platform Icon) + Title */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white text-xs font-bold tabular-nums border border-slate-200/60 dark:border-white/10">
                            {partNumStr}
                          </span>
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {!allSamePlatform && (
                              <span className="shrink-0">
                                {renderPlatformIcon(epPlatformName, "h-3.5 w-3.5")}
                              </span>
                            )}
                            <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate group-hover/ep:text-[#7A2253] dark:group-hover/ep:text-rose-400 transition-colors">
                              {cleanTitle}
                            </h3>
                          </div>
                        </div>

                        {/* Right: small ↗ icon */}
                        <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover/ep:text-[#7A2253] dark:group-hover/ep:text-rose-400 transition-colors shrink-0" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5. Bottom Creator Card */}
            <div className="mt-5 rounded-xl bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10 p-3.5 sm:p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-white/10">
                  {creator?.photoDataUrl ? (
                    <img src={creator.photoDataUrl} alt={creator.displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-600">
                      {creator?.displayName?.[0] || "C"}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-slate-400 block leading-tight">
                    Series by
                  </span>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {creator?.displayName || username}
                    </span>
                    <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L9 14.17l9.59-9.59L20 6l-10 11z" />
                    </svg>
                  </div>
                  <p className="text-xs text-slate-400 truncate pt-0.5">
                    <span>@{username.replace(/^@/, "")}</span>
                    {(creator?.bio || creator?.category) && (
                      <>
                        <span className="mx-1 text-slate-400">·</span>
                        <span>{creator.bio || creator.category}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <a
                href={profileUrl}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(profileUrl);
                }}
                className="tap-scale shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:text-white border border-slate-200/80 dark:border-white/10 text-xs font-bold transition-all cursor-pointer"
              >
                <span>View profile →</span>
              </a>
            </div>
          </div>
        </div>
      </PublicCard>
    </CreatorPublicShell>
  );
}
