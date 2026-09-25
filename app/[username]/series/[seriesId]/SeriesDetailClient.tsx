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
import { MadeWithInflixo } from "@/components/shared/MadeWithInflixo";

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
    icon: <Film className="h-3.5 w-3.5 text-[#043084]" />,
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
            <div className="h-10 w-10 rounded-[12px] bg-black/10" />
            <div className="h-10 w-10 rounded-full bg-black/10" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-32 rounded bg-black/10" />
              <div className="h-3 w-20 rounded bg-black/10" />
            </div>
          </div>
          <div className="mt-4 h-40 w-full rounded-[14px] bg-black/10" />
          <div className="mx-auto mt-4 h-5 w-1/2 rounded bg-black/10" />
          <div className="mx-auto mt-2 h-3.5 w-3/4 rounded bg-black/10" />
          <div className="mt-5 space-y-2">
            <div className="h-12 w-full rounded-[14px] bg-black/10" />
            <div className="h-12 w-full rounded-[14px] bg-black/10" />
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
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-[14px] border"
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

  const platformIcon = (cls: string, platform: string | null = detectedPlatform) =>
    platform === "YouTube" ? <YoutubeIcon className={`${cls} text-red-500`} />
      : platform === "Instagram" ? <InstagramIcon className={`${cls} text-pink-500`} />
        : platform === "Facebook" ? <FacebookIcon className={`${cls} text-blue-500`} />
          : <Globe className={`${cls} opacity-75`} />;

  const episodePlatform = (url?: string | null): string | null => {
    if (!url) return null;
    if (/youtube\.com|youtu\.be/i.test(url)) return "YouTube";
    if (/instagram\.com/i.test(url)) return "Instagram";
    if (/facebook\.com|fb\.watch/i.test(url)) return "Facebook";
    return null;
  };

  const metaParts = [
    `${allEpisodes.length} ${allEpisodes.length === 1 ? "episode" : "episodes"}`,
    ...(seasonsList.length > 1 ? [`${seasonsList.length} seasons`] : []),
    ...(langTag ? [langTag] : []),
  ];

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
      <PublicCard themeKey={themeKey}>
        {/* Compact creator header — same on every secondary public page */}
        <PublicPageHeader
          themeKey={themeKey}
          backHref={`/${username}/series`}
          backLabel="Back to series"
          preferHistoryBack
          creatorName={creator?.displayName || ""}
          creatorHandle={username}
          creatorPhoto={creator?.photoDataUrl}
          pageLabel="Series"
          showCreatorIdentity={isScrolledPastHeader}
          className={`${PUBLIC_CARD_PADDING} pt-4 pb-3 sm:pt-5`}
          actions={
            <>
              <PublicIconButton themeKey={themeKey} onClick={handleCopyLink} label="Copy series link">
                <Copy className="h-4 w-4" />
              </PublicIconButton>
              <PublicIconButton themeKey={themeKey} onClick={() => setIsShareModalOpen(true)} label="Share series">
                <Share2 className="h-4 w-4" />
              </PublicIconButton>
            </>
          }
        />

        <div
          onScroll={(e) => setIsScrolledPastHeader(e.currentTarget.scrollTop > 80)}
          className={`flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain scrollbar-none ${PUBLIC_CARD_PADDING} pb-5`}
        >
          {/* Series hero */}
          {hasValidCover && (
            <div
              style={{ borderColor: c.border }}
              className="relative mt-1 aspect-[16/9] max-h-[220px] w-full shrink-0 overflow-hidden rounded-[14px] border bg-black/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={series.posterDataUrl!}
                alt={series.title}
                onError={() => setCoverImageError(true)}
                className="block h-full w-full object-cover object-center"
              />
            </div>
          )}

          <div className={`${hasValidCover ? "mt-4" : "mt-2"} text-center`}>
            <h1 style={pt.headingStyle} className={`break-words ${PUBLIC_TYPE.pageTitle}`}>
              {series.title}
            </h1>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
              {detectedPlatform && (
                <span
                  style={pt.elevatedStyle}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${PUBLIC_TYPE.label}`}
                >
                  {platformIcon("h-3.5 w-3.5")}
                  <span>{detectedPlatform}</span>
                </span>
              )}
              {genresList.slice(0, 3).map((g) => (
                <span
                  key={g}
                  style={{ borderColor: c.border, color: c.secondaryText }}
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 ${PUBLIC_TYPE.label}`}
                >
                  {g}
                </span>
              ))}
            </div>

            <p style={{ color: c.mutedText }} className={`mt-2 ${PUBLIC_TYPE.meta}`}>
              {metaParts.join(" · ")}
            </p>

            {series.description && series.description.trim() && (
              <p
                style={{ color: c.secondaryText }}
                className={`mx-auto mt-2.5 max-w-md whitespace-pre-line break-words ${PUBLIC_TYPE.body}`}
              >
                {series.description}
              </p>
            )}
          </div>

          {/* Seasons */}
          {seasonsList.length > 1 && (
            <div className="-mx-1 mt-5 flex items-center gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
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
                  className={`tap-scale inline-flex h-9 shrink-0 cursor-pointer items-center rounded-full border px-3.5 transition-all ${PUBLIC_TYPE.label}`}
                >
                  {sn.title || `Season ${sn.seasonNumber || idx + 1}`} · {sn.episodes?.length || 0}
                </button>
              ))}
            </div>
          )}

          {/* Episodes */}
          <div className={`${seasonsList.length > 1 ? "mt-3" : "mt-6"} space-y-2.5`}>
            <PublicSectionHeader
              themeKey={themeKey}
              title="Episodes"
              icon={<Film className="h-4 w-4" />}
              meta={`${currentEpisodes.length}`}
            />

            {currentEpisodes.length === 0 ? (
              <div
                style={{ ...pt.elevatedStyle, color: c.mutedText }}
                className={`rounded-[14px] border border-dashed p-5 text-center ${PUBLIC_TYPE.meta}`}
              >
                No episodes added to this series yet.
              </div>
            ) : (
              <div className="space-y-2">
                {currentEpisodes.map((ep: Episode, index: number) => {
                  const partNum = ep.episodeNumber || index + 1;
                  const partNumStr = partNum < 10 ? `0${partNum}` : `${partNum}`;
                  const epTitleStr = ep.title?.trim() || `Episode ${partNum}`;
                  const epPlatform = episodePlatform(ep.externalUrl);

                  return (
                    <a
                      key={ep.id || index}
                      href={ep.externalUrl || "#"}
                      target={ep.externalUrl ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      onClick={() => trackEpisodeClick(ep)}
                      style={pt.itemStyle}
                      className="group tap-scale flex min-h-[56px] w-full cursor-pointer items-center gap-3 rounded-[14px] border px-3.5 py-2.5 transition-all hover:opacity-90"
                    >
                      <span
                        style={{ backgroundColor: c.accentSoft, color: c.accentText }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-xs font-bold tabular-nums"
                      >
                        {partNumStr}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span style={{ color: c.primaryText }} className={`block line-clamp-2 break-words ${PUBLIC_TYPE.cardTitle}`}>
                          {epTitleStr}
                        </span>
                        {epPlatform && (
                          <span style={{ color: c.mutedText }} className={`mt-0.5 flex items-center gap-1 ${PUBLIC_TYPE.meta}`}>
                            {platformIcon("h-3 w-3", epPlatform)}
                            Watch on {epPlatform}
                          </span>
                        )}
                      </span>
                      <ExternalLink
                        className="h-4 w-4 shrink-0 opacity-70 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                        style={{ color: c.accentText }}
                      />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pinned Made with Inflixo footer (same as profile) */}
        <div
          style={{ borderColor: c.divider }}
          className="flex shrink-0 select-none items-center justify-center border-t px-4 pt-3.5 pb-[15px]"
        >
          <MadeWithInflixo
            color={usesDarkControls ? "#FFFFFF" : c.secondaryText}
            backgroundColor={c.accentSoft}
            borderColor={c.accentBorder}
          />
        </div>
      </PublicCard>
    </CreatorPublicShell>
  );
}
