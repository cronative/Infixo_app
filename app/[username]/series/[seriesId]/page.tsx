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
import { copyToClipboard } from "@/lib/copyToClipboard";

function getPlatformInfo(platformStr?: string, urlStr?: string) {
  const p = (platformStr || "").toLowerCase();
  const u = (urlStr || "").toLowerCase();

  if (p.includes("youtube") || u.includes("youtube.com") || u.includes("youtu.be")) {
    return {
      name: "YouTube",
      icon: <YoutubeIcon className="h-3.5 w-3.5 text-white" />,
      badgeClass: "bg-red-600 text-white shadow-2xs",
      chipClass: "bg-red-50 text-red-700 border-red-200/80",
      textColor: "text-red-600",
    };
  }
  if (p.includes("instagram") || u.includes("instagram.com")) {
    return {
      name: "Instagram",
      icon: <InstagramIcon className="h-3.5 w-3.5 text-white" />,
      badgeClass: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-2xs",
      chipClass: "bg-rose-50 text-rose-700 border-rose-200/80",
      textColor: "text-rose-600",
    };
  }
  if (p.includes("facebook") || u.includes("facebook.com")) {
    return {
      name: "Facebook",
      icon: <FacebookIcon className="h-3.5 w-3.5 text-white" />,
      badgeClass: "bg-blue-600 text-white shadow-2xs",
      chipClass: "bg-blue-50 text-blue-700 border-blue-200/80",
      textColor: "text-blue-600",
    };
  }
  return {
    name: platformStr || "Web",
    icon: <Film className="h-3.5 w-3.5 text-white" />,
    badgeClass: "bg-[#803D63] text-white shadow-2xs",
    chipClass: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    textColor: "text-[#803D63]",
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

  const handleShare = async () => {
    if (!series) return;
    const handle = username || "creator";
    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}/${handle}/series/${series.id}`
      : `https://inflixo.com/${handle}/series/${series.id}`;
    const title = `${series.title} on Inflixo`;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title, url: shareUrl }).catch(async () => {
        const success = await copyToClipboard(shareUrl);
        if (success) showToast("Series link copied to clipboard! 🎬");
      });
    } else {
      const success = await copyToClipboard(shareUrl);
      if (success) showToast("Series link copied to clipboard! 🎬");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-4 bg-slate-950 text-white">
        <SkeletonProfileCard />
      </div>
    );
  }

  if (notFound || !series) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-4 bg-slate-950 text-white text-center">
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

  return (
    <div className={`min-h-dvh transition-colors duration-300 relative overflow-hidden ${pageBgStyle}`}>
      {series.posterDataUrl && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-15 blur-3xl transition-opacity duration-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={series.posterDataUrl} alt="" className="h-full w-full object-cover scale-150 transform" />
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-3xl px-3 sm:px-8 py-6 sm:py-10 space-y-6 text-left">
        {/* Navigation Header */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/${username}`}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-[#803D63]" />
            <span>← Back to Creator Profile</span>
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 text-xs sm:text-sm font-bold text-[#803D63] transition-colors cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
            <span>Share Series</span>
          </button>
        </div>

        {/* 16:9 Landscape Cover Banner Header */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs space-y-4">
          <div className="relative w-full aspect-video overflow-hidden bg-slate-950 flex items-center justify-center border-b border-gray-100">
            <SeriesPoster
              src={series.posterDataUrl}
              title={series.title}
              className="h-full w-full object-cover"
              textClassName="text-sm font-bold text-indigo-200"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            <div className="absolute top-3 left-3 z-10">
              <span className="bg-black/60 text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 shadow-xs">
                🎬 {allEpisodes.length} {allEpisodes.length === 1 ? "Episode" : "Episodes"}
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-3 text-left">
            <h1 className="font-display text-xl sm:text-3xl font-bold text-slate-900 leading-tight text-left">
              {series.title}
            </h1>

            {series.description && (
              <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed text-left">
                {series.description}
              </p>
            )}

            {/* Platform, Language & Multiple Genre Chips together on bottom line */}
            <div className="pt-2 flex flex-wrap items-center gap-1.5 border-t border-gray-100 text-left">
              <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-md border border-gray-200">
                Language: {series.language || "Hindi"}
              </span>

              {series.genre && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {series.genre.split(",").map((g, idx) => (
                    <span key={idx} className="bg-[#F6EBF1] text-[#803D63] text-xs font-medium px-2.5 py-0.5 rounded-md border border-[#E8DCE4]">
                      Genre: {g.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Episode Playlist Stream (Direct External Redirection) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#803D63]" />
              <span>Episodes Playlist ({allEpisodes.length})</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">Click Watch to open video in new tab</span>
          </div>

          {allEpisodes.length === 0 ? (
            <p className="text-xs font-medium text-slate-500 text-center py-6">No episodes added to this series yet.</p>
          ) : (
            <div className="space-y-3">
              {allEpisodes.map((ep) => {
                const plat = getPlatformInfo(ep.platform, ep.externalUrl);
                const epNumStr = ep.episodeNumber < 10 ? `EP 0${ep.episodeNumber}` : `EP ${ep.episodeNumber}`;
                const epTitleStr = ep.title && ep.title.trim() ? ep.title : `Part ${ep.episodeNumber}`;

                return (
                  <a
                    key={ep.id}
                    href={ep.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3.5 transition-all hover:border-[#803D63] shadow-2xs hover:bg-slate-50/50 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 text-left">
                      {/* EP Number Indigo Chip */}
                      <span className="bg-[#F6EBF1] text-[#803D63] font-bold text-xs px-2.5 py-1 rounded-md border border-[#E8DCE4] shrink-0">
                        {epNumStr}
                      </span>

                      <p className="truncate text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#803D63] transition-colors text-left">
                        {epTitleStr}
                      </p>
                    </div>

                    {/* Right Side: Platform Brand Pill + Watch Button */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold ${plat.chipClass}`}>
                        <span className={`flex h-4 w-4 items-center justify-center rounded ${plat.badgeClass}`}>
                          {plat.icon}
                        </span>
                        <span>{plat.name}</span>
                      </span>

                      <span className="bg-[#803D63] hover:bg-[#6D3254] text-white text-xs font-semibold px-4 py-2 rounded-lg inline-flex items-center gap-1.5 transition-all shadow-none">
                        <span>Watch on {plat.name} ↗</span>
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Creator Info Footer Card */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            {creator?.photoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creator.photoDataUrl} alt={creator.displayName} className="h-12 w-12 rounded-full object-cover border border-gray-200" />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#803D63] text-white font-bold text-base">
                {creator?.displayName ? creator.displayName[0].toUpperCase() : "C"}
              </div>
            )}
            <div className="min-w-0 text-left space-y-0.5">
              <p className="truncate text-sm font-bold text-slate-900">{creator?.displayName || username}</p>
              <p className="text-xs font-medium text-slate-500">inflixo.com/{username}</p>
            </div>
          </div>

          <Link
            href={`/${username}`}
            className="shrink-0 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-5 py-2 text-xs font-semibold text-white transition-colors"
          >
            Visit Creator Profile →
          </Link>
        </div>
      </main>
    </div>
  );
}

