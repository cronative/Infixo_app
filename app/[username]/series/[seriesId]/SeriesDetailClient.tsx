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
    icon: <Film className="h-3.5 w-3.5 text-[#803D63]" />,
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

  const platformInfo = useMemo(() => {
    if (!series?.platform) return null;
    return getPlatformInfo(series.platform);
  }, [series?.platform]);

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
      }).catch(() => {});
    } catch {}
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
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#803D63] text-white shadow-md">
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
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all cursor-pointer border ${
                  isDark
                    ? "bg-[#803D63]/22 hover:bg-[#803D63]/32 active:bg-[#803D63]/40 border-[#803D63]/45 hover:border-[#803D63]/60 text-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#803D63]/60"
                    : isSignaturePurple
                    ? "bg-[#803D63]/16 hover:bg-[#803D63]/24 active:bg-[#803D63]/32 border border-[#803D63]/35 hover:border-[#803D63]/50 text-[#803D63] focus-visible:ring-2 focus-visible:ring-[#803D63]/60 shadow-xs"
                    : "bg-[#803D63] hover:bg-[#6F3456] text-white border-transparent"
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
      <main className="relative z-10 flex-1 flex flex-col mx-auto max-w-2xl w-full px-0 sm:px-6 py-0 sm:py-8 animate-fade-in-up">
        {/* Centered Theme Card with min-h-full & flex layout */}
        <div
          style={{
            ...themeCssVars,
            backgroundColor: themeMeta.profileSurface?.background || c.profileBackground,
            borderColor: themeMeta.profileSurface?.border || c.border,
            color: c.primaryText,
            fontFamily: typ.fontFamily,
            letterSpacing: typ.letterSpacing,
            ["--desktop-surface-shadow" as any]: themeMeta.profileSurface?.shadow || eff.shadow || "0 24px 70px rgba(0,0,0,0.15)",
          }}
          className="flex-1 flex flex-col justify-between relative overflow-hidden border-0 sm:border rounded-none sm:rounded-[28px] shadow-none sm:shadow-[var(--desktop-surface-shadow)] transition-all"
        >
          <div className="flex-1 flex flex-col">
            {/* 1. Full-Width Hero Cover Image */}
            {hasValidCover ? (
              <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-950 m-0 p-0 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={series.posterDataUrl!}
                  alt={series.title}
                  onError={() => setCoverImageError(true)}
                  className="block w-full h-full object-cover object-center m-0 p-0"
                />

                {/* Gradient Overlays for top action contrast & smooth bottom fade */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/70 pointer-events-none" />

                {/* OVERLAY: Top Action Bar on top of the Cover Image */}
                <header className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 z-20 flex items-center justify-between">
                  {/* Top Left: Back Button + original circular Inflixo Logo */}
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
                      className="tap-scale flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md border border-white/20 text-white transition-all shadow-md cursor-pointer"
                      title={`Back to @${username}`}
                      aria-label={`Back to @${username}`}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>

                    <Link
                      href="/"
                      style={{ backgroundColor: c.accent }}
                      className="tap-scale flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-white shadow-xs transition-all shrink-0 border border-white/20 hover:scale-105 cursor-pointer select-none"
                      title="Inflixo Home"
                      aria-label="Inflixo Home"
                    >
                      <LogoStadiumLinkI className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </Link>
                  </div>

                  {/* Right: Copy & Share Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="tap-scale flex h-8 w-8 items-center justify-center rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md border border-white/20 text-white transition-all shadow-md cursor-pointer"
                      title="Copy series link"
                      aria-label="Copy series link"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsShareModalOpen(true)}
                      style={{
                        backgroundColor: c.accentSoft,
                        borderColor: c.accentBorder,
                        color: c.accentText,
                      }}
                      className="tap-scale flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md border transition-all shadow-md cursor-pointer"
                      title="Share series"
                      aria-label="Share series"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </header>

                {/* Bottom Right Overlay: Platform */}
                {series.platform && (
                  <div className="absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold shadow-sm">
                    {platformInfo?.icon}
                    <span>{platformInfo?.name}</span>
                  </div>
                )}
              </div>
            ) : (
              /* No-Cover State */
              <header
                style={{ borderColor: c.divider }}
                className="flex items-center justify-between p-4 sm:p-6 pb-2 border-b shrink-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined" && window.history.length > 1) {
                        router.back();
                      } else {
                        router.push(profileUrl);
                      }
                    }}
                    style={{ backgroundColor: c.cardBackground, borderColor: c.border, color: c.secondaryText }}
                    className="tap-scale flex h-8 w-8 items-center justify-center rounded-full border transition-all cursor-pointer shadow-2xs"
                    title={`Back to @${username}`}
                    aria-label={`Back to @${username}`}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <Link
                    href="/"
                    style={{ backgroundColor: c.accent }}
                    className="tap-scale flex h-8 w-8 items-center justify-center rounded-full text-white shadow-xs shrink-0 border border-white/20 select-none"
                    title="Inflixo Home"
                  >
                    <LogoStadiumLinkI className="h-4 w-4 text-white" />
                  </Link>
                  <span
                    style={{
                      color: c.primaryText,
                      fontFamily: typ.headingFontFamily,
                      fontWeight: typ.headingWeight as any,
                    }}
                    className="text-xs sm:text-sm font-bold truncate max-w-[140px] sm:max-w-[200px]"
                  >
                    {series.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{ backgroundColor: c.cardBackground, borderColor: c.border, color: c.secondaryText }}
                    className="tap-scale flex h-8 w-8 items-center justify-center rounded-full border transition-all cursor-pointer shadow-2xs"
                    title="Copy series link"
                    aria-label="Copy series link"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(true)}
                    style={{
                      backgroundColor: c.accentSoft,
                      borderColor: c.accentBorder,
                      color: c.accentText,
                    }}
                    className="tap-scale flex h-8 w-8 items-center justify-center rounded-full border transition-all cursor-pointer shadow-2xs"
                    title="Share series"
                    aria-label="Share series"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </header>
            )}

            {/* 2. TITLE, DESCRIPTION, DOT-SEPARATED GENRES & DETAILS */}
            <div className="p-5 sm:p-8 pt-4 sm:pt-6 space-y-4 flex-1">
              <div className="text-center space-y-1.5 px-1">
                <h1
                  style={{
                    color: c.primaryText,
                    fontFamily: typ.headingFontFamily,
                    fontWeight: typ.headingWeight as any,
                  }}
                  className="text-lg sm:text-xl font-extrabold leading-tight"
                >
                  {series.title}
                </h1>

                {series.description && series.description.trim() && (
                  <p
                    style={{ color: c.secondaryText }}
                    className="text-xs leading-relaxed font-normal"
                  >
                    {series.description}
                  </p>
                )}

                {/* Dot-separated Genres & Language */}
                {(() => {
                  const parts: string[] = [];
                  if (series.genre) {
                    const gItems = series.genre
                      .split(/[,•|/]/)
                      .map((g) => g.trim().replace(/^Genre:\s*/i, ""))
                      .filter(Boolean);
                    parts.push(...gItems);
                  }
                  if (series.language && series.language.trim()) {
                    parts.push(series.language.trim());
                  }
                  const str = parts.join(" • ");
                  return str ? (
                    <p
                      style={{ color: c.accentText }}
                      className="text-[11.5px] font-semibold tracking-wide pt-0.5"
                    >
                      {str}
                    </p>
                  ) : null;
                })()}
              </div>

              {/* Seasons Filter Tabs */}
              {seasonsList.length > 1 && (
                <div className="flex items-center justify-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-none">
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
                      className="tap-scale px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border"
                    >
                      {sn.title || `Season ${sn.seasonNumber || idx + 1}`} ({sn.episodes?.length || 0})
                    </button>
                  ))}
                </div>
              )}

              {/* 3. EPISODES HEADER & LISTING */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between px-1">
                  <span
                    style={{ color: c.mutedText }}
                    className="text-[10.5px] font-bold uppercase tracking-wider"
                  >
                    {seasonsList.length > 1
                      ? `${seasonsList[activeSeasonIndex]?.title || `Season ${activeSeasonIndex + 1}`} Episodes (${currentEpisodes.length})`
                      : `Episodes (${currentEpisodes.length})`}
                  </span>
                </div>

                {currentEpisodes.length === 0 ? (
                  <div
                    style={{ borderColor: c.border, color: c.mutedText }}
                    className="p-6 text-center text-xs font-semibold rounded-xl border border-dashed"
                  >
                    No episodes uploaded for this series yet.
                  </div>
                ) : (
                  <div className="space-y-2">
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
                          style={{
                            backgroundColor: c.cardBackground,
                            borderColor: c.border,
                            color: c.primaryText,
                            boxShadow: eff.cardShadow,
                          }}
                          className="group relative flex items-center justify-between w-full px-3.5 py-3 rounded-xl transition-all duration-150 border cursor-pointer hover:scale-[1.005]"
                        >
                          {/* Left: Number */}
                          <span
                            style={{ color: c.mutedText }}
                            className="w-6 text-left text-xs font-mono font-bold transition-colors shrink-0"
                          >
                            {partNumStr}
                          </span>

                          {/* Center: Title */}
                          <span
                            style={{ color: c.primaryText }}
                            className="flex-1 text-center font-bold text-xs truncate px-2"
                          >
                            {epTitleStr}
                          </span>

                          {/* Right: View Icon */}
                          <span
                            style={{ color: c.accentText }}
                            className="w-6 flex justify-end transition-transform group-hover:scale-110 shrink-0"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. MADE WITH INFLIXO FOOTER */}
          <div
            style={{ borderColor: c.divider }}
            className="flex items-center justify-center px-5 pt-4 pb-5 select-none mt-auto border-t"
          >
            <Link
              href="/"
              style={{
                backgroundColor: c.cardBackground,
                borderColor: c.border,
                color: c.secondaryText,
              }}
              className="tap-scale inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[11px] font-bold shadow-2xs hover:scale-105 transition-all"
            >
              <span style={{ color: c.accentText }} className="inline-flex items-center">
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


