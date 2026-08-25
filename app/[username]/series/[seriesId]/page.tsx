"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Share2, ArrowLeft, Play, Film, Layers, CheckCircle2,
  Clock, Globe, ChevronRight, ExternalLink, Sparkles
} from "lucide-react";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { Series } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { formatCount, buildSeriesUrl } from "@/utils/format";
import { SeriesPoster } from "@/components/shared/SeriesPoster";
import { SyncingLoader } from "@/components/shared/SyncingLoader";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";

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

export default function SeriesDetailPage() {
  const params = useParams<{ username: string; seriesId: string }>();
  const router = useRouter();
  const { showToast } = useToast();

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
  const [activeEp, setActiveEp] = useState<string | null>(null);

  useEffect(() => {
    async function loadSeriesData() {
      const usernameParam = decodeURIComponent(params.username ?? "").trim();
      const seriesIdParam = decodeURIComponent(params.seriesId ?? "").trim();

      if (!seriesIdParam) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (usernameParam === "demo_creator") {
        try {
          const { EXPERT_DEMO_SERIES, EXPERT_DEMO_PROFILE } = await import("@/data/expertDemoCreator");
          const found = EXPERT_DEMO_SERIES.find((s) => s.id === seriesIdParam);
          if (found) {
            setSeries(found);
            setCreator({
              displayName: EXPERT_DEMO_PROFILE.displayName,
              username: EXPERT_DEMO_PROFILE.username,
              photoDataUrl: EXPERT_DEMO_PROFILE.photoDataUrl,
              themeKey: "minimal-white",
              totalFanbase: 480000,
            });
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn("Could not load demo series:", err);
        }
      }

      try {
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
        console.error("Failed to load series:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadSeriesData();
  }, [params.username, params.seriesId]);

  const username = creator?.username || decodeURIComponent(params.username ?? "");
  const profileUrl = `/${username}`;

  async function handleShare() {
    if (!series) return;
    const url = buildSeriesUrl(username, series.id);
    const success = await copyToClipboard(url);
    if (success) {
      showToast("Series link copied to clipboard! 📋✨");
    } else {
      showToast("Link: " + url, "info");
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center">
        <SyncingLoader message="Loading Series & Episodes..." />
      </div>
    );
  }

  if (notFound || !series) {
    return (
      <div className="min-h-dvh bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Subtle Ambient Background Light */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden flex items-center justify-center">
          <div className="h-96 w-96 rounded-full bg-[#803D63]/5 blur-3xl" />
        </div>

        <main className="relative z-10 mx-auto max-w-lg text-center space-y-6">
          <div className="rounded-3xl border border-gray-200/80 bg-white p-8 sm:p-10 shadow-lg space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#803D63] text-white shadow-lg shadow-purple-900/10 ring-4 ring-purple-50">
              <Film className="h-10 w-10 stroke-[2.2]" />
            </div>

            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-[11px] font-black text-[#803D63] uppercase tracking-wider">
                <span>SERIES NOT FOUND</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                This Series isn’t available
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
                This OTT series playlist or episode collection doesn’t exist, has been removed, or is currently private.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => router.push(profileUrl)}
                className="tap-scale w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#803D63] hover:bg-[#6D3254] px-6 py-3.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to @{username}&apos;s Profile</span>
              </button>

              <button
                onClick={() => router.push("/")}
                className="tap-scale w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-6 py-3.5 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                <span>Explore Inflixo</span>
              </button>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-400">
            One profile for your content, fanbase, and series.
          </p>
        </main>
      </div>
    );
  }

  const allEpisodes = series.seasons.flatMap((sn) => sn.episodes);

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 relative">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 backdrop-blur-md px-4 sm:px-8 py-3 shadow-2xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link
            href={`/${username}`}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-[#803D63] transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to @{username}</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-8 py-6 sm:py-10 space-y-8">
        {/* ── HERO BANNER CARD ── */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          {/* Landscape Poster Cover */}
          <div className="relative w-full aspect-[16/8] sm:aspect-[21/8] overflow-hidden bg-slate-900">
            <SeriesPoster
              src={series.posterDataUrl}
              title={series.title}
              className="h-full w-full object-cover"
              textClassName="text-2xl sm:text-3xl font-black text-white"
            />
            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent hidden sm:block" />

            {/* Top-Right Badges */}
            <div className="absolute top-3.5 right-3.5 flex items-center gap-2 z-10">
              <span className="backdrop-blur-md bg-black/60 border border-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                {allEpisodes.length} {allEpisodes.length === 1 ? "Episode" : "Episodes"}
              </span>
              {series.language && (
                <span className="backdrop-blur-md bg-black/60 border border-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                  {series.language}
                </span>
              )}
            </div>

            {/* Banner Text Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 z-10 text-white space-y-2">
              {series.genre && (
                <div className="flex flex-wrap gap-1.5">
                  {series.genre.split(",").map((g, idx) => {
                    const cleanG = g.trim().replace(/^Genre:\s*/i, "");
                    if (!cleanG) return null;
                    return (
                      <span key={idx} className="text-[10px] font-extrabold uppercase tracking-wider text-white bg-[#803D63] px-2.5 py-0.5 rounded-full shadow-xs">
                        {cleanG}
                      </span>
                    );
                  })}
                </div>
              )}

              <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
                {series.title}
              </h1>

              {series.description && (
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-2xl line-clamp-2 drop-shadow-sm font-medium">
                  {series.description}
                </p>
              )}

              {/* Play / Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {allEpisodes[0]?.externalUrl && (
                  <a
                    href={allEpisodes[0].externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-scale inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-white" />
                    <span>Play Episode 1</span>
                  </a>
                )}
                <button
                  onClick={handleShare}
                  className="tap-scale inline-flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition-all cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share Series</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── EPISODES LIST SECTION ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#803D63]" />
              <span>Episodes</span>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {allEpisodes.length}
              </span>
            </h2>
          </div>

          {allEpisodes.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-gray-200">
              <Film className="h-8 w-8 mx-auto mb-2 opacity-40 text-[#803D63]" />
              <p className="text-xs font-semibold">No episodes added to this series yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {allEpisodes.map((ep, index) => {
                const plat = getPlatformInfo(ep.platform, ep.externalUrl);
                const epNumStr = ep.episodeNumber < 10 ? `E${String(ep.episodeNumber).padStart(2, "0")}` : `E${ep.episodeNumber}`;
                const epTitleStr = ep.title?.trim() || `Episode ${ep.episodeNumber}`;
                const isActive = activeEp === ep.id;

                return (
                  <a
                    key={ep.id}
                    href={ep.externalUrl || "#"}
                    target={ep.externalUrl ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    onMouseEnter={() => setActiveEp(ep.id)}
                    onMouseLeave={() => setActiveEp(null)}
                    className="tap-scale group flex items-center justify-between gap-4 rounded-2xl border border-gray-200/90 bg-white hover:border-[#803D63]/40 hover:shadow-md p-4 transition-all duration-200 cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Episode Number or Play Icon */}
                      <div className="shrink-0">
                        {isActive ? (
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#803D63] text-white shadow-sm">
                            <Play className="h-4 w-4 fill-white" />
                          </div>
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 text-xs font-black group-hover:bg-purple-50 group-hover:text-[#803D63] transition-colors">
                            {String(index + 1).padStart(2, "0")}
                          </div>
                        )}
                      </div>

                      {/* Episode Title & Metadata */}
                      <div className="min-w-0 space-y-1">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#803D63] transition-colors truncate">
                          {epTitleStr}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${plat.badge}`}>
                            {plat.icon}
                            <span>{plat.name}</span>
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">{epNumStr}</span>
                          {ep.description && (
                            <span className="text-[11px] text-slate-500 font-medium truncate hidden md:inline max-w-sm">
                              • {ep.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Watch CTA */}
                    <div className="shrink-0 flex items-center gap-1.5 text-slate-400 group-hover:text-[#803D63] transition-colors text-xs font-bold">
                      <span className="hidden sm:inline">Watch</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* ── CREATOR PROFILE FOOTER CARD ── */}
        <div className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4 min-w-0">
            <CreatorAvatar
              src={creator?.photoDataUrl}
              name={creator?.displayName || username}
              className="w-14 h-14 rounded-2xl object-cover shrink-0"
              textClassName="text-lg font-black text-white"
              fallbackBgClass="bg-[#803D63]"
            />
            <div className="min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                  {creator?.displayName || username}
                </h3>
                <CheckCircle2 className="h-4 w-4 text-[#803D63] shrink-0" />
              </div>
              <p className="text-xs text-slate-500 font-medium">inflixo.com/{username}</p>
              {creator?.totalFanbase && creator.totalFanbase > 0 && (
                <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                  {formatCount(creator.totalFanbase)} Total Fanbase
                </p>
              )}
            </div>
          </div>

          <Link
            href={`/${username}`}
            className="tap-scale shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all"
          >
            <span>View Creator Profile</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* ── INFLIXO BRANDING FOOTER ── */}
        <div className="text-center pt-2 pb-6">
          <p className="text-xs font-medium text-slate-400">
            OTT Series &amp; Show streaming experience powered by{" "}
            <Link href="/" className="font-bold text-[#803D63] hover:underline">
              Inflixo
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
