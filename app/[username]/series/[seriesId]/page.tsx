"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Share2, ArrowLeft, Play, Eye, ExternalLink, Film, Layers, Sparkles, Users, Tv, CheckCircle2, ChevronRight } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { SkeletonProfileCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Series, ThemeKey } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { THEME_PAGE_BACKGROUNDS } from "@/services/ThemeService";
import { THEME_STYLES, DEFAULT_THEME_STYLE } from "@/components/onboarding/LivePreviewCard";
import { formatCount, buildSeriesUrl } from "@/utils/format";
import { ShareSeriesModal } from "@/components/shared/ShareSeriesModal";
import { SeriesPoster } from "@/components/shared/SeriesPoster";

function getPlatformInfo(platformStr?: string, urlStr?: string) {
  const p = (platformStr || "").toLowerCase();
  const u = (urlStr || "").toLowerCase();

  if (p.includes("youtube") || u.includes("youtube.com") || u.includes("youtu.be")) {
    return {
      name: "YouTube",
      icon: <YoutubeIcon className="h-4 w-4 text-white" />,
      badgeClass: "bg-red-600 text-white shadow-xs",
    };
  }
  if (p.includes("instagram") || u.includes("instagram.com")) {
    return {
      name: "Instagram",
      icon: <InstagramIcon className="h-4 w-4 text-white" />,
      badgeClass: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-xs",
    };
  }
  if (p.includes("facebook") || u.includes("facebook.com")) {
    return {
      name: "Facebook",
      icon: <FacebookIcon className="h-4 w-4 text-white" />,
      badgeClass: "bg-blue-600 text-white shadow-xs",
    };
  }
  return {
    name: platformStr || "Web",
    icon: <Film className="h-4 w-4 text-white" />,
    badgeClass: "bg-purple-600 text-white shadow-xs",
  };
}

export default function SeriesDetailPage() {
  const params = useParams<{ username: string; seriesId: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [series, setSeries] = useState<Series | null>(null);
  const [creator, setCreator] = useState<{
    displayName: string;
    username: string;
    photoDataUrl: string | null;
    themeKey?: string;
    totalFanbase?: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadSeriesData() {
      const usernameParam = decodeURIComponent(params.username ?? "").trim();
      const seriesIdParam = decodeURIComponent(params.seriesId ?? "").trim();

      if (!seriesIdParam) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/series?seriesId=${encodeURIComponent(seriesIdParam)}`).then((r) => r.json());
        if (res.success && res.series) {
          setSeries(res.series);
          if (res.series.creator) {
            setCreator(res.series.creator);
          } else {
            setCreator({
              displayName: usernameParam,
              username: usernameParam,
              photoDataUrl: null,
            });
          }
          setNotFound(false);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load single series page:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadSeriesData();
  }, [params.username, params.seriesId]);

  useEffect(() => {
    if (typeof document === "undefined" || !series) return;

    const creatorName = creator?.displayName || params.username || "Creator";
    const handle = creator?.username || params.username || "creator";
    const pageTitle = `${series.title} by ${creatorName} (@${handle}) — Inflixo Series`;
    const pageDesc = series.description || `Watch ${series.title} by @${handle} on Inflixo. ${series.genre || "Series"} • ${series.language || "Hindi"}.`;
    const pageUrl = `https://inflixo.com/${handle}/series/${series.id}`;
    const pageImg = series.posterDataUrl || creator?.photoDataUrl || "https://inflixo.com/apple-icon.png";

    document.title = pageTitle;

    const setMeta = (nameOrProp: string, content: string, isProp = false) => {
      let el = document.querySelector(isProp ? `meta[property="${nameOrProp}"]` : `meta[name="${nameOrProp}"]`);
      if (!el) {
        el = document.createElement("meta");
        if (isProp) el.setAttribute("property", nameOrProp);
        else el.setAttribute("name", nameOrProp);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", pageDesc);
    setMeta("og:title", pageTitle, true);
    setMeta("og:description", pageDesc, true);
    setMeta("og:url", pageUrl, true);
    setMeta("og:image", pageImg, true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", pageTitle);
    setMeta("twitter:description", pageDesc);
    setMeta("twitter:image", pageImg);

    let scriptEl = document.getElementById("json-ld-series");
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.id = "json-ld-series";
      scriptEl.setAttribute("type", "application/ld+json");
      document.head.appendChild(scriptEl);
    }

    scriptEl.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CreativeWorkSeries",
      "name": series.title,
      "description": pageDesc,
      "genre": series.genre || "Video",
      "inLanguage": series.language || "Hindi",
      "image": pageImg,
      "url": pageUrl,
      "author": {
        "@type": "Person",
        "name": creatorName,
        "url": `https://inflixo.com/${handle}`,
      },
    });
  }, [series, creator, params.username]);

  const username = creator?.username || params.username || "creator";
  const theme = (creator?.themeKey as ThemeKey) || "minimal-white";
  const pageBgStyle = THEME_PAGE_BACKGROUNDS[theme] || THEME_PAGE_BACKGROUNDS["minimal-white"];
  const style = THEME_STYLES[theme] || DEFAULT_THEME_STYLE;
  const isDark = style.nameColor.includes("white") || style.nameColor.includes("amber") || style.nameColor.includes("sky");

  const fullSeriesUrl = buildSeriesUrl(username, params.seriesId);

  function handleShare() {
    const shareText = `Check out my series "${series?.title || "Series"}" by @${username} on Inflixo! Watch episodes and stream now! 🎬🔥`;
    if (navigator.share) {
      navigator.share({
        title: `${series?.title || "Series"} on Inflixo`,
        text: shareText,
        url: fullSeriesUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText}\n${fullSeriesUrl}`).then(() => {
        showToast("Series direct link & message copied to clipboard! ✨");
      });
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-5 py-12">
        <SkeletonProfileCard />
      </div>
    );
  }

  if (notFound || !series) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
        <Logo />
        <div className="mt-8 max-w-sm">
          <EmptyState
            icon={<Film className="h-6 w-6 text-purple-600" />}
            title="Series Not Found"
            description="This series doesn't exist or has been removed."
            action={
              <button onClick={() => router.push(`/${username}`)} className="text-sm font-bold text-inflixo-purple">
                ← Return to Creator Profile
              </button>
            }
          />
        </div>
      </div>
    );
  }

  const allEpisodes = series.seasons.flatMap((sn) => sn.episodes);
  const firstEp = allEpisodes[0];
  const seriesPlatform =
    (series as any).platform ||
    firstEp?.platform ||
    (firstEp?.externalUrl ? getPlatformInfo(undefined, firstEp.externalUrl).name : "YouTube");
  const mainPlatformInfo = getPlatformInfo(seriesPlatform);

  return (
    <div className={`min-h-dvh transition-colors duration-300 relative overflow-hidden ${pageBgStyle}`}>
      {/* Gentle ambient poster glow matching creator theme background */}
      {series.posterDataUrl && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20 blur-3xl transition-opacity duration-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={series.posterDataUrl} alt="" className="h-full w-full object-cover scale-150 transform" />
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-3xl px-2.5 sm:px-8 py-4 sm:py-10 space-y-5">
        {/* Top Header Navigation & Action Bar */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/${username}`}
            className={`tap-scale inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs sm:text-sm font-black backdrop-blur-xl shadow-lg transition-all ${style.socialItemBg} ${style.socialItemBorder} ${style.nameColor}`}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Profile</span>
          </Link>

          <button
            onClick={handleShare}
            className="tap-scale inline-flex items-center gap-2 rounded-2xl border border-purple-400/40 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-4 py-2 text-xs sm:text-sm font-black text-white shadow-xl shadow-purple-950/50 transition-all"
          >
            <Share2 className="h-4 w-4" />
            <span>Share Series</span>
          </button>
        </div>

        {/* Main Cinema OTT Series Showcase Card */}
        <div className={`relative overflow-hidden rounded-2xl sm:rounded-[32px] border p-3.5 sm:p-10 shadow-2xl backdrop-blur-2xl transition-all duration-300 ${style.cardBg}`}>
          
          {/* OTT Category Ribbon & Creator Tag */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <Link
              href={`/${username}`}
              className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 text-xs font-black backdrop-blur-xl transition-all hover:scale-105 ${style.profBadgeBg} ${style.profBadgeText} ${style.profBadgeBorder}`}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-[10px] font-black text-white shadow-xs">
                {creator?.displayName ? creator.displayName[0].toUpperCase() : "C"}
              </div>
              <span>By @{username}</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              {Boolean(creator?.totalFanbase && creator.totalFanbase > 0) && (
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-black backdrop-blur-md ${style.profBadgeBg} ${style.profBadgeText} ${style.profBadgeBorder}`}>
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>{formatCount(creator!.totalFanbase!)} Fanbase</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/40 bg-purple-600/30 px-3.5 py-1 text-xs font-black text-purple-200 backdrop-blur-md shadow-xs">
                <Tv className="h-3.5 w-3.5 text-purple-300" />
                <span>INFLIXO ORIGINAL</span>
              </span>
            </div>
          </div>

          {/* Series Hero Section: Ultra-sleek Widescreen Cover Banner & Compact Info */}
          <div className="space-y-4 text-left">
            {/* Ultra-sleek Cover Image Container */}
            <div className="relative w-full aspect-[2.2/1] overflow-hidden rounded-2xl border border-white/20">
              <SeriesPoster
                src={series.posterDataUrl}
                title={series.title}
                className="h-full w-full object-cover"
                textClassName="text-sm font-black text-purple-200"
              />
            </div>

            {/* Title & Compact Single Line Metadata */}
            <div className="space-y-1.5">
              <h1 className={`font-display text-2xl sm:text-3xl font-black leading-snug tracking-tight break-words ${style.nameColor}`}>
                {series.title}
              </h1>

              {/* Single Line Stacked Metadata: Genre • Language • Episodes */}
              <p className={`text-xs sm:text-sm font-bold ${style.bioColor}`}>
                {[
                  series.genre || "General",
                  series.language || "Hindi",
                  `${allEpisodes.length} ${allEpisodes.length === 1 ? "Episode" : "Episodes"}`,
                ].filter(Boolean).join(" • ")}
              </p>

              {series.description && (
                <p className={`text-xs sm:text-sm font-medium leading-relaxed break-words pt-1 ${style.bioColor}`}>
                  {series.description}
                </p>
              )}
            </div>
          </div>

          {/* OTT Episodes Grid / List Showcase */}
          <div className={`mt-8 rounded-3xl border p-4 sm:p-6 backdrop-blur-2xl shadow-xl space-y-4 ${style.socialItemBg} ${style.socialItemBorder}`}>
            <div className="flex items-center justify-between border-b border-slate-500/20 pb-3">
              <h2 className={`text-xs sm:text-sm font-black flex items-center gap-2 ${style.handleColor}`}>
                <Layers className="h-4 w-4 text-purple-400" />
                Episodes ({allEpisodes.length})
              </h2>
            </div>

            {allEpisodes.length === 0 ? (
              <div className={`rounded-2xl border p-8 text-center text-xs font-bold ${style.socialItemBg} ${style.socialItemBorder} ${style.bioColor}`}>
                No episodes available in this series yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {allEpisodes.map((ep) => {
                  const plat = getPlatformInfo(ep.platform, ep.externalUrl);
                  const epNumStr = ep.episodeNumber < 10 ? `E0${ep.episodeNumber}` : `E${ep.episodeNumber}`;
                  const epTitleStr = ep.title && ep.title.trim() ? ep.title : `Part ${ep.episodeNumber}`;

                  return (
                    <a
                      key={ep.id}
                      href={ep.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group flex items-center justify-between rounded-xl border p-3.5 backdrop-blur-xl transition-all hover:scale-[1.005] shadow-xs ${style.socialItemBg} ${style.socialItemBorder}`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-2xs ${plat.badgeClass}`}>
                          {plat.icon}
                        </span>
                        <div className="min-w-0 text-left space-y-0.5">
                          <p className={`text-xs sm:text-sm font-extrabold leading-snug break-words ${style.socialNameColor}`}>
                            {epNumStr} • {epTitleStr}
                          </p>
                          <p className={`text-[11px] font-medium opacity-75 ${style.socialUnitColor}`}>
                            {plat.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <ExternalLink className={`h-4 w-4 opacity-75 group-hover:opacity-100 transition-opacity ${style.socialNameColor}`} />
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom OTT Creator Profile Banner */}
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border p-5 shadow-2xl backdrop-blur-2xl transition-all ${style.cardBg}`}>
          <div className="flex items-center gap-4 min-w-0">
            {creator?.photoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creator.photoDataUrl} alt={creator.displayName} className="h-12 w-12 shrink-0 rounded-2xl object-cover border-2 border-white/20 shadow-md" />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-lg shadow-md">
                {creator?.displayName ? creator.displayName[0].toUpperCase() : "C"}
              </div>
            )}
            <div className="min-w-0 text-left space-y-0.5">
              <div className="flex items-center gap-2">
                <p className={`truncate text-base font-black ${style.nameColor}`}>{creator?.displayName || username}</p>
                <span className={`text-xs font-extrabold ${style.handleColor}`}>@{username}</span>
              </div>
              {Boolean(creator?.totalFanbase && creator.totalFanbase > 0) ? (
                <div className={`flex items-center gap-1.5 text-xs font-bold ${style.bioColor}`}>
                  <Users className="h-3.5 w-3.5 text-purple-400" />
                  <span>Total Fanbase:</span>
                  <span className={`font-extrabold ${style.nameColor}`}>{formatCount(creator!.totalFanbase!)}</span>
                </div>
              ) : (
                <p className={`text-xs font-medium ${style.bioColor}`}>inflixo.com/{username}</p>
              )}
            </div>
          </div>

          <Link
            href={`/${username}`}
            className="tap-scale shrink-0 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-6 py-2.5 text-xs font-black text-white shadow-lg transition-all border border-purple-400/30"
          >
            Visit Creator Profile →
          </Link>
        </div>

        {/* Viral Growth Engine: "Powered by Inflixo" Watermark Badge */}
        <div className="text-center pt-2 pb-4">
          <a
            href={`/login?ref=${encodeURIComponent(username)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-scale inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-900/80 backdrop-blur-md px-4 py-1.5 text-xs font-extrabold text-white shadow-lg hover:bg-slate-900 transition-all hover:scale-105"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400 fill-current animate-pulse" />
            <span>Built with <strong className="text-purple-300 font-black">Inflixo</strong> • Build your Creator Home →</span>
          </a>
        </div>

        {/* Share Series Modal */}
        {series && (
          <ShareSeriesModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            series={series}
            username={username}
          />
        )}
      </main>
    </div>
  );
}
