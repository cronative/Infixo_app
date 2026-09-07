"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Share2,
  Film,
  Copy,
  Layers,
  Sparkles,
  Eye,
  ArrowLeft,
  Globe,
} from "lucide-react";
import { LogoStadiumLinkI } from "@/components/shared/Logo";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { Series, Episode, ThemeKey, Season } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { buildSeriesUrl } from "@/utils/format";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { ShareSeriesModal } from "@/components/shared/ShareSeriesModal";
import { PublicCreatorInfo } from "@/lib/publicSeriesService";
import { THEME_STYLES, isDarkTheme, DEFAULT_THEME_STYLE } from "@/components/onboarding/LivePreviewCard";
import { THEME_PAGE_BACKGROUNDS, ThemeService, getThemeCssVariables } from "@/services/ThemeService";
import { AmbientAnimation } from "@/components/theme/AmbientAnimation";
import { FocusOverlay } from "@/components/theme/FocusOverlay";

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
  return {
    name: platformStr || "Watch",
    icon: <Film className="h-3.5 w-3.5 text-[#b85c6b]" />,
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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [coverImageError, setCoverImageError] = useState(false);
  const [activeSeasonIndex, setActiveSeasonIndex] = useState<number>(0);

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

        const list: Series[] = seriesRes.series || [];
        const found = list.find((s) => s.id === seriesIdParam);

        if (found && profRes.success && profRes.profile) {
          setSeries(found);
          setCreator({
            displayName: profRes.profile.displayName || usernameParam,
            username: profRes.profile.username || usernameParam,
            photoDataUrl: profRes.profile.photoDataUrl,
            bio: profRes.profile.bio,
            category: profRes.profile.category,
            themeKey: profRes.profile.themeKey || "minimal-white",
            totalFanbase: profRes.profile.totalFanbase || 0,
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
  const themeMeta = ThemeService.getThemeMeta(themeKey);
  const style = THEME_STYLES[themeKey] || THEME_STYLES["minimal-white"];
  const pageBgStyle = themeMeta.outerBgClass || THEME_PAGE_BACKGROUNDS[themeKey] || THEME_PAGE_BACKGROUNDS["minimal-white"];
  const isDark = isDarkTheme(themeKey);
  const isSignaturePurple = themeKey === "signature-purple";

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
  }, [series?.platform, allEpisodes]);

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
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "episode_click",
          username,
          seriesId: series?.id,
          episodeId: ep.id,
          url: ep.externalUrl,
        }),
      }).catch(() => { });
    } catch { }
  };

  // ── LOADING SKELETON (THEME-AWARE) ──
  if (loading) {
    return (
      <div className={`min-h-dvh flex flex-col transition-colors duration-300 ${pageBgStyle}`}>
        <main className="flex-1 flex flex-col mx-auto max-w-2xl w-full px-3 sm:px-6 py-6 sm:py-8 animate-pulse">
          <div className={`flex-1 rounded-3xl p-5 sm:p-8 space-y-4 border ${style.socialItemBg} ${style.socialItemBorder}`}>
            <div className="w-full aspect-[16/9] bg-black/10 rounded-2xl" />
            <div className="h-6 w-1/2 mx-auto bg-black/10 rounded-md" />
            <div className="h-4 w-3/4 mx-auto bg-black/10 rounded-md" />
            <div className="space-y-2 pt-2">
              <div className="h-12 w-full bg-black/10 rounded-xl" />
              <div className="h-12 w-full bg-black/10 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── NOT FOUND STATE ──
  if (notFound || !series) {
    return (
      <div className={`min-h-dvh flex flex-col items-center justify-center p-4 py-6 sm:py-8 transition-colors duration-300 ${pageBgStyle}`}>
        <main className="mx-auto max-w-md w-full text-center space-y-6">
          <div className={`rounded-3xl border p-8 sm:p-10 shadow-2xs space-y-5 ${style.socialItemBg} ${style.socialItemBorder}`}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#b85c6b] text-white shadow-md">
              <Film className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h1 className={`font-display text-xl sm:text-2xl font-bold ${style.nameColor}`}>
                Series isn’t available
              </h1>
              <p className={`text-xs sm:text-sm leading-relaxed ${style.bioColor}`}>
                This series playlist doesn’t exist, belongs to another creator, or has been removed.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => router.push(profileUrl)}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all cursor-pointer border ${isDark
                    ? "bg-[#b85c6b]/22 hover:bg-[#b85c6b]/32 active:bg-[#b85c6b]/40 border-[#b85c6b]/45 hover:border-[#b85c6b]/60 text-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#b85c6b]/60"
                    : isSignaturePurple
                      ? "bg-[#b85c6b]/16 hover:bg-[#b85c6b]/24 active:bg-[#b85c6b]/32 border border-[#b85c6b]/35 hover:border-[#b85c6b]/50 text-[#b85c6b] focus-visible:ring-2 focus-visible:ring-[#b85c6b]/60 shadow-xs"
                      : "bg-[#b85c6b] hover:bg-[#6F3456] text-white border-transparent"
                  }`}
              >
                <span>Go to @{username}</span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/")}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${style.socialItemBg} ${style.socialItemBorder} ${style.nameColor}`}
              >
                <span>Explore Inflixo</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const themeCssVars = getThemeCssVariables(themeMeta);
  const c = themeMeta.colors;
  const typ = themeMeta.typography;
  const eff = themeMeta.effects;

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

  return (
    <div
      style={{ backgroundColor: c.pageBackground }}
      className="relative min-h-dvh flex flex-col font-sans antialiased transition-colors duration-500"
    >
      {/* 1. Full-screen outer background covering complete viewport */}
      <div
        className={`fixed inset-0 pointer-events-none transition-colors duration-500 z-0 ${pageBgStyle}`}
        style={{ backgroundColor: c.pageBackground }}
        aria-hidden="true"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[650px] bg-gradient-radial from-white/[0.06] to-transparent blur-3xl pointer-events-none" />
      </div>

      {/* 2. Ambient animation if theme is animated */}
      {themeMeta.animation?.type !== "none" && (
        <AmbientAnimation
          type={themeMeta.animation?.type || themeMeta.animationType}
          colors={themeMeta.animation?.colors || themeMeta.particleColors}
          themeKey={themeMeta.key}
        />
      )}

      {/* 3. Theme-aware Focus Overlay Layer */}
      <FocusOverlay overlay={themeMeta.focusOverlay} />

      {/* 4. Centered Content */}
      <main className="relative z-10 flex-1 flex flex-col mx-auto max-w-[520px] w-full px-3 sm:px-4 py-4 sm:py-6 animate-fade-in-up">
        {/* Centered Theme Card with min-h-full & flex layout */}
        <div
          style={{
            ...themeCssVars,
            backgroundColor: themeMeta.profileSurface?.background || c.profileBackground,
            borderColor: themeMeta.profileSurface?.border || c.border,
            color: c.primaryText,
            fontFamily: typ.fontFamily,
            letterSpacing: typ.letterSpacing,
            ["--desktop-surface-shadow" as any]: themeMeta.profileSurface?.shadow || eff.shadow || "0 20px 60px rgba(36,22,24,0.06)",
          }}
          className="flex-1 flex flex-col justify-between relative overflow-hidden rounded-3xl border border-[#E4DAD5] bg-white shadow-xl shadow-[#241618]/5 transition-all"
        >
          <div className="flex-1 flex flex-col">
            {/* 1. Full-Width Hero Cover Header (Maroon Gradient or Valid Poster) */}
            <div className="relative w-full aspect-[21/9] min-h-[120px] sm:min-h-[140px] overflow-hidden bg-gradient-to-r from-[#B85C6B] via-[#A24B5A] to-[#8C3F4D] m-0 p-0 shrink-0">
              {hasValidCover && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={series.posterDataUrl!}
                    alt={series.title}
                    onError={() => setCoverImageError(true)}
                    className="block w-full h-full object-cover object-center m-0 p-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />
                </>
              )}

              {/* Top Action Bar on Cover */}
              <header className="absolute top-3 inset-x-3 sm:top-3.5 sm:inset-x-3.5 z-20 flex items-center justify-between">
                {/* Top Left: Back Button + circular Inflixo Logo */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined" && window.history.length > 1) {
                        router.back();
                      } else {
                        router.push(profileUrl);
                      }
                    }}
                    className="tap-scale flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-full bg-black/35 hover:bg-black/55 active:bg-black/70 backdrop-blur-md border border-white/25 text-white transition-all shadow-md cursor-pointer"
                    title={`Back to @${username}`}
                    aria-label={`Back to @${username}`}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <Link
                    href="/"
                    style={{ backgroundColor: c.accent }}
                    className="tap-scale flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-full text-white shadow-xs transition-all shrink-0 border border-white/25 hover:scale-105 cursor-pointer select-none"
                    title="Inflixo Home"
                    aria-label="Inflixo Home"
                  >
                    <LogoStadiumLinkI className="h-4 w-4 text-white" />
                  </Link>
                </div>

                {/* Right: Copy & Share Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="tap-scale flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-full bg-black/35 hover:bg-black/55 active:bg-black/70 backdrop-blur-md border border-white/25 text-white transition-all shadow-md cursor-pointer"
                    title="Copy series link"
                    aria-label="Copy series link"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(true)}
                    className="tap-scale flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-full bg-black/35 hover:bg-black/55 active:bg-black/70 backdrop-blur-md border border-white/25 text-white transition-all shadow-md cursor-pointer"
                    title="Share series"
                    aria-label="Share series"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </header>

              {/* Bottom Right Overlay: Platform */}
              {detectedPlatform && (
                <div className="absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold shadow-sm">
                  {detectedPlatform === "YouTube" && <YoutubeIcon className="h-2.5 w-2.5 text-red-500" />}
                  {detectedPlatform === "Instagram" && <InstagramIcon className="h-2.5 w-2.5 text-pink-500" />}
                  {detectedPlatform === "Facebook" && <FacebookIcon className="h-2.5 w-2.5 text-blue-500" />}
                  {detectedPlatform !== "YouTube" && detectedPlatform !== "Instagram" && detectedPlatform !== "Facebook" && (
                    <Globe className="h-2.5 w-2.5 text-white" />
                  )}
                  <span>{detectedPlatform}</span>
                </div>
              )}
            </div>

            {/* 2. BODY CONTENT: TITLE, DESCRIPTION, PILL TAGS, EPISODES */}
            <div className="p-4 sm:p-5 pt-4 sm:pt-5 flex-1 flex flex-col">
              {/* Title & Description & Genre Tags */}
              <div className="text-center px-1">
                <h1
                  style={{
                    color: c.primaryText,
                    fontFamily: typ.headingFontFamily,
                    fontWeight: typ.headingWeight as any,
                  }}
                  className="text-lg sm:text-xl font-extrabold leading-snug tracking-tight text-[#241618]"
                >
                  {series.title}
                </h1>

                {series.description && series.description.trim() && (
                  <p
                    style={{ color: c.secondaryText }}
                    className="mt-1.5 text-xs sm:text-[13px] leading-relaxed text-[#6B5A5D] font-normal max-w-md mx-auto"
                  >
                    {series.description}
                  </p>
                )}

                {/* Category / Genre / Platform Pill Tags */}
                {(detectedPlatform || genresList.length > 0 || langTag) && (
                  <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
                    {/* Platform Pill */}
                    {detectedPlatform && (
                      <span
                        style={{
                          backgroundColor: c.accentSoft,
                          borderColor: c.accentBorder,
                          color: c.accentText,
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all"
                      >
                        {detectedPlatform === "YouTube" && <YoutubeIcon className="h-2.5 w-2.5 text-red-500" />}
                        {detectedPlatform === "Instagram" && <InstagramIcon className="h-2.5 w-2.5 text-pink-500" />}
                        {detectedPlatform === "Facebook" && <FacebookIcon className="h-2.5 w-2.5 text-blue-500" />}
                        {detectedPlatform !== "YouTube" && detectedPlatform !== "Instagram" && detectedPlatform !== "Facebook" && (
                          <Globe className="h-2.5 w-2.5 text-[#8C3F4D]" />
                        )}
                        <span>{detectedPlatform}</span>
                      </span>
                    )}

                    {/* Genre Pills */}
                    {genresList.map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          backgroundColor: c.accentSoft,
                          borderColor: c.accentBorder,
                          color: c.accentText,
                        }}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all"
                      >
                        {tag}
                      </span>
                    ))}

                    {/* Language Pill */}
                    {langTag && (
                      <span
                        style={{
                          backgroundColor: c.accentSoft,
                          borderColor: c.accentBorder,
                          color: c.accentText,
                        }}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all"
                      >
                        {langTag}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Seasons Filter Tabs (if multiple seasons) */}
              {seasonsList.length > 1 && (
                <div className="mt-3.5 flex items-center justify-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {seasonsList.map((sn, idx) => (
                    <button
                      key={sn.id || idx}
                      type="button"
                      onClick={() => setActiveSeasonIndex(idx)}
                      style={
                        activeSeasonIndex === idx
                          ? { backgroundColor: c.accentSoft, borderColor: c.accentBorder, color: c.accentText }
                          : { backgroundColor: c.cardBackground, borderColor: c.border, color: c.secondaryText }
                      }
                      className="tap-scale px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border"
                    >
                      {sn.title || `Season ${sn.seasonNumber || idx + 1}`} ({sn.episodes?.length || 0})
                    </button>
                  ))}
                </div>
              )}

              {/* 3. EPISODES HEADER & GROUPED LIST */}
              <div className="mt-5 sm:mt-6 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span
                    style={{ color: c.mutedText }}
                    className="text-[11px] font-bold uppercase tracking-wider text-[#6B5A5D]"
                  >
                    {seasonsList.length > 1
                      ? `${seasonsList[activeSeasonIndex]?.title || `Season ${activeSeasonIndex + 1}`} Episodes (${currentEpisodes.length})`
                      : `Episodes (${currentEpisodes.length})`}
                  </span>
                </div>

                {currentEpisodes.length === 0 ? (
                  <div
                    style={{ borderColor: c.border, color: c.mutedText }}
                    className="p-5 text-center text-xs font-semibold rounded-2xl border border-dashed border-[#E4DAD5] bg-[#F7F0EA]/30 text-[#6B5A5D]"
                  >
                    No episodes uploaded for this series yet.
                  </div>
                ) : (
                  <div
                    style={{
                      borderColor: c.divider,
                      backgroundColor: c.cardBackground,
                    }}
                    className="rounded-2xl border border-[#E4DAD5] bg-white divide-y divide-[#E4DAD5] overflow-hidden shadow-xs"
                  >
                    {currentEpisodes.map((ep: Episode, index: number) => {
                      const partNum = ep.episodeNumber || index + 1;
                      const partNumStr = partNum < 10 ? `0${partNum}` : `${partNum}`;
                      const epTitleStr = ep.title?.trim() || `Episode ${partNum}`;

                      return (
                        <a
                          key={ep.id || index}
                          href={ep.externalUrl || "#"}
                          target={ep.externalUrl ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          onClick={() => trackEpisodeClick(ep)}
                          className="group flex items-center justify-between w-full px-3.5 py-2.5 sm:py-3 transition-colors hover:bg-[#F7F0EA]/50 cursor-pointer"
                        >
                          {/* Left: Number & Title */}
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <span
                              style={{ color: c.mutedText }}
                              className="text-xs font-mono font-medium text-[#6B5A5D] w-5 shrink-0"
                            >
                              {partNumStr}
                            </span>
                            <span
                              style={{ color: c.primaryText }}
                              className="text-xs sm:text-[13px] font-bold text-[#241618] truncate group-hover:text-[#8C3F4D] transition-colors"
                            >
                              {epTitleStr}
                            </span>
                          </div>

                          {/* Right: Circular View Icon */}
                          <div
                            style={{
                              borderColor: c.border,
                              color: c.accentText,
                            }}
                            className="h-8 w-8 rounded-full border border-[#E4DAD5] bg-white text-[#8C3F4D] flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-[#F3DDE0] group-hover:border-[#B85C6B]/30 group-hover:scale-105 transition-all"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </div>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. PINNED MADE WITH INFLIXO FOOTER */}
          <div
            style={{ borderColor: c.divider }}
            className="flex items-center justify-center px-5 pt-3 pb-4 select-none mt-6 border-t border-[#E4DAD5]"
          >
            <Link
              href="/"
              style={{
                backgroundColor: c.cardBackground,
                borderColor: c.border,
                color: c.secondaryText,
              }}
              className="tap-scale inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E4DAD5] bg-white text-[#6B5A5D] text-[11px] font-bold shadow-2xs hover:scale-105 transition-all"
            >
              <span style={{ color: c.accentText }} className="inline-flex items-center text-[#8C3F4D]">
                <LogoStadiumLinkI className="h-3.5 w-3.5" />
              </span>
              <span>Made with Inflixo</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Share Modal */}
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


