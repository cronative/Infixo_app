"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Share2,
  ArrowLeft,
  Play,
  Film,
  Layers,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { Series, Episode } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { buildSeriesUrl } from "@/utils/format";
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
      icon: <YoutubeIcon className="h-3.5 w-3.5 text-red-600" />,
    };
  }
  if (p.includes("instagram") || u.includes("instagram.com")) {
    return {
      name: "Instagram",
      icon: <InstagramIcon className="h-3.5 w-3.5 text-pink-600" />,
    };
  }
  if (p.includes("facebook") || u.includes("facebook.com")) {
    return {
      name: "Facebook",
      icon: <FacebookIcon className="h-3.5 w-3.5 text-blue-600" />,
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [coverImageError, setCoverImageError] = useState(false);

  // Client-side fallback fetch if initial SSR data is not present
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

  // Determine cover image following hierarchy
  const coverImageSrc = useMemo(() => {
    if (coverImageError) return null;
    if (series?.posterDataUrl) return series.posterDataUrl;
    const firstEpThumb = getEpisodeThumbnail(firstPlayableEp);
    if (firstEpThumb) return firstEpThumb;
    return null;
  }, [series?.posterDataUrl, firstPlayableEp, coverImageError]);

  async function handleCopyLink() {
    if (!series) return;
    const url = buildSeriesUrl(username, series.id);
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedLink(true);
      showToast("Series link copied! 📋✨", "success");
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      showToast("Link: " + url, "info");
    }
  }

  // ── LOADING SKELETON ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8FA] text-[#17131A] flex flex-col font-sans">
        {/* Header Skeleton */}
        <div className="w-full bg-white border-b border-[#ECE8EB] px-4 sm:px-8 py-3.5">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="h-8 w-24 bg-[#FAF8FA] border border-[#ECE8EB] rounded-xl animate-pulse" />
            <div className="h-8 w-28 bg-[#FAF8FA] border border-[#ECE8EB] rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Full-width Cover Skeleton */}
        <div className="w-full h-[260px] sm:h-[440px] bg-slate-200/80 animate-pulse" />

        {/* Centered Content Skeleton */}
        <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          <div className="space-y-3">
            <div className="h-8 w-3/4 bg-white border border-[#ECE8EB] rounded-xl animate-pulse" />
            <div className="h-5 w-1/3 bg-white border border-[#ECE8EB] rounded-lg animate-pulse" />
            <div className="h-4 w-full bg-white border border-[#ECE8EB] rounded-lg animate-pulse" />
          </div>
          <div className="space-y-3 pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white border border-[#ECE8EB] rounded-2xl animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // ── NOT FOUND STATE ──
  if (notFound || !series) {
    return (
      <div className="min-h-screen bg-[#FAF8FA] text-[#17131A] flex flex-col items-center justify-center p-4 font-sans">
        <main className="mx-auto max-w-md w-full text-center space-y-6">
          <div className="rounded-3xl border border-[#ECE8EB] bg-white p-8 sm:p-10 shadow-2xs space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F7EDF3] text-[#803D63]">
              <Film className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-[#17131A]">
                Series isn’t available
              </h1>
              <p className="text-xs sm:text-sm text-[#6F6872] leading-relaxed">
                This series playlist doesn’t exist or has been removed.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => router.push(profileUrl)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6F3456] px-5 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to @{username}</span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] hover:bg-white px-5 py-2.5 text-xs font-semibold text-[#17131A] transition-colors cursor-pointer"
              >
                <span>Explore Inflixo</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8FA] text-[#17131A] selection:bg-[#803D63] selection:text-white font-sans antialiased">
      {/* ========================================================================= */}
      {/* 1. SIMPLE TOP HEADER */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#ECE8EB] px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Brand & Back Navigation */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Logo size="sm" />

            <div className="h-4 w-px bg-[#ECE8EB]" />

            <Link
              href={`/${username}`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#6F6872] hover:text-[#803D63] transition-colors truncate"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Back to @{username}</span>
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] hover:bg-white px-3 py-1.5 text-xs font-semibold text-[#17131A] transition-colors cursor-pointer"
              title="Copy series URL"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="hidden sm:inline text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-[#6F6872]" />
                  <span className="hidden sm:inline">Copy Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#803D63] hover:bg-[#6F3456] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
              title="Share this series"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. FULL-WIDTH COVER IMAGE */}
      {/* ========================================================================= */}
      <section className="w-full bg-[#FAF8FA] border-b border-[#ECE8EB] overflow-hidden">
        <div className="w-full h-[220px] sm:h-[360px] md:h-[460px] relative bg-[#FAF8FA] flex items-center justify-center">
          {coverImageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImageSrc}
              alt={series.title}
              onError={() => setCoverImageError(true)}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#FAF8FA] via-white to-[#F6EBF1] text-center">
              <Film className="h-12 w-12 text-[#803D63]/40 mb-2" />
              <span className="font-display text-lg font-bold text-[#17131A] max-w-md truncate">
                {series.title}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CENTRED SERIES DETAILS & EPISODES CONTAINER */}
      {/* ========================================================================= */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 text-left">
        {/* ── SERIES DETAILS ── */}
        <div className="space-y-3.5 pb-6 border-b border-[#ECE8EB]">
          {/* Genre Chips & Episode Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {series.genre ? (
                series.genre.split(",").map((g, idx) => {
                  const cleanG = g.trim().replace(/^Genre:\s*/i, "");
                  if (!cleanG) return null;
                  return (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-full bg-[#F7EDF3] border border-[#ECD7E4] text-[11px] font-bold text-[#803D63] uppercase tracking-wide"
                    >
                      {cleanG}
                    </span>
                  );
                })
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8FA] border border-[#ECE8EB] text-[11px] font-bold text-[#6F6872] uppercase tracking-wide">
                  Series
                </span>
              )}

              {series.language && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8FA] border border-[#ECE8EB] text-[11px] font-medium text-[#6F6872]">
                  {series.language}
                </span>
              )}
            </div>

            <div className="text-xs font-semibold text-[#6F6872]">
              {allEpisodes.length} {allEpisodes.length === 1 ? "Episode" : "Episodes"}
            </div>
          </div>

          {/* Series Title */}
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#17131A] tracking-tight leading-tight">
            {series.title}
          </h1>

          {/* Minimal Creator Reference */}
          {creator && (
            <div className="flex items-center gap-2 pt-0.5">
              <CreatorAvatar
                src={creator.photoDataUrl}
                name={creator.displayName || username}
                className="w-6 h-6 rounded-full object-cover shrink-0"
                textClassName="text-[10px] font-bold text-white"
                fallbackBgClass="bg-[#803D63]"
              />
              <Link
                href={`/${username}`}
                className="text-xs sm:text-sm font-semibold text-[#17131A] hover:text-[#803D63] transition-colors truncate"
              >
                <span>By {creator.displayName}</span>
                <span className="text-[#6F6872] font-normal ml-1">(@{creator.username})</span>
              </Link>
            </div>
          )}

          {/* Short Description */}
          {series.description && (
            <p className="text-xs sm:text-sm text-[#6F6872] leading-relaxed max-w-3xl font-normal pt-1">
              {series.description}
            </p>
          )}

          {/* Share Series Action */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#ECE8EB] bg-white hover:bg-[#FAF8FA] hover:border-[#803D63] px-3.5 py-2 text-xs font-bold text-[#17131A] shadow-2xs transition-colors cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5 text-[#803D63]" />
              <span>Share Series</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#ECE8EB] bg-white hover:bg-[#FAF8FA] px-3.5 py-2 text-xs font-semibold text-[#6F6872] hover:text-[#17131A] transition-colors cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Link</span>
            </button>
          </div>
        </div>

        {/* ── EPISODES LIST ── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#17131A] flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#803D63]" />
              <span>Episodes</span>
              <span className="text-xs font-bold text-[#6F6872] bg-white border border-[#ECE8EB] px-2.5 py-0.5 rounded-full shadow-2xs">
                {allEpisodes.length}
              </span>
            </h2>
          </div>

          {allEpisodes.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border border-[#ECE8EB] bg-white space-y-2 shadow-2xs">
              <Film className="h-8 w-8 mx-auto text-[#6F6872]/40" />
              <p className="text-xs font-bold text-[#17131A]">No episodes added yet</p>
              <p className="text-xs text-[#6F6872]">
                The creator hasn&apos;t added episodes to this series yet.
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

                return (
                  <div
                    key={ep.id || index}
                    className="rounded-2xl border border-[#ECE8EB] bg-white hover:border-[#803D63]/40 hover:bg-[#FAF8FA]/50 transition-all duration-150 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-2xs text-left"
                  >
                    {/* Left: Thumbnail & Info */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                      {/* 16:9 Thumbnail preview */}
                      <div className="relative w-28 sm:w-36 aspect-[16/9] rounded-xl overflow-hidden bg-[#FAF8FA] border border-[#ECE8EB] shrink-0">
                        {thumbnailSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbnailSrc}
                            alt={epTitleStr}
                            className="h-full w-full object-cover object-center"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-[#FAF8FA] text-[#6F6872]">
                            <Film className="h-5 w-5 opacity-40 text-[#803D63]" />
                          </div>
                        )}
                        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] font-bold text-white">
                          E{epNumStr}
                        </div>
                      </div>

                      {/* Episode text metadata */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF8FA] border border-[#ECE8EB] text-[#17131A]">
                            {plat.icon}
                            <span>{plat.name}</span>
                          </span>
                          <span className="text-[11px] font-semibold text-[#6F6872]">
                            Episode {ep.episodeNumber || index + 1}
                          </span>
                        </div>

                        <h3 className="font-display text-xs sm:text-sm font-bold text-[#17131A] truncate">
                          {epTitleStr}
                        </h3>

                        {ep.description && (
                          <p className="text-xs text-[#6F6872] line-clamp-2 leading-relaxed">
                            {ep.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Watch Action */}
                    <div className="shrink-0 flex items-center justify-end pt-1 sm:pt-0">
                      {ep.externalUrl ? (
                        <a
                          href={ep.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#803D63] hover:bg-[#6F3456] text-white px-4 py-2 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        >
                          <Play className="h-3 w-3 fill-white" />
                          <span>Watch on {plat.name}</span>
                          <ExternalLink className="h-3 w-3 opacity-75" />
                        </a>
                      ) : (
                        <span className="text-xs font-semibold text-[#6F6872] italic">
                          Link unavailable
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 4. STANDARDIZED SHARE MODAL */}
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
