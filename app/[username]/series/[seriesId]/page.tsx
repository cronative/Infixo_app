"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Share2, ArrowLeft, Play, Film, Layers, CheckCircle2,
  Clock, Globe, ChevronRight, ExternalLink, Star
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { SkeletonProfileCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Series, ThemeKey } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { THEME_STYLES, DEFAULT_THEME_STYLE } from "@/components/onboarding/LivePreviewCard";
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
      icon: <YoutubeIcon className="h-4 w-4 text-white" />,
      gradient: "from-red-600 to-red-700",
      glow: "shadow-red-500/30",
      badge: "bg-red-600",
    };
  }
  if (p.includes("instagram") || u.includes("instagram.com")) {
    return {
      name: "Instagram",
      icon: <InstagramIcon className="h-4 w-4 text-white" />,
      gradient: "from-amber-500 via-rose-500 to-purple-600",
      glow: "shadow-rose-500/30",
      badge: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600",
    };
  }
  if (p.includes("facebook") || u.includes("facebook.com")) {
    return {
      name: "Facebook",
      icon: <FacebookIcon className="h-4 w-4 text-white" />,
      gradient: "from-blue-600 to-blue-700",
      glow: "shadow-blue-500/30",
      badge: "bg-blue-600",
    };
  }
  return {
    name: platformStr || "Watch",
    icon: <Film className="h-4 w-4 text-white" />,
    gradient: "from-[#803D63] to-[#6D3254]",
    glow: "shadow-purple-500/30",
    badge: "bg-[#803D63]",
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
              totalFanbase: 1345000,
            });
            setNotFound(false);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn("Error loading demo creator series:", e);
        }
      }

      try {
        const res = await fetch(`/api/series?seriesId=${encodeURIComponent(seriesIdParam)}`).then((r) => r.json());
        if (res.success && res.series) {
          setSeries(res.series);
          if (res.series.creator) {
            setCreator(res.series.creator);
          } else {
            setCreator({ displayName: usernameParam, username: usernameParam, photoDataUrl: null });
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
  const profileUrl = username === "demo_creator" ? "/demo_creator" : `/${username}`;

  const handleShare = async () => {
    if (!series) return;
    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}/${username}/series/${series.id}`
      : `https://inflixo.com/${username}/series/${series.id}`;
    const title = `${series.title} on Inflixo`;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title, url: shareUrl }).catch(async () => {
        const success = await copyToClipboard(shareUrl);
        if (success) showToast("Series link copied! 🎬");
      });
    } else {
      const success = await copyToClipboard(shareUrl);
      if (success) showToast("Series link copied! 🎬");
    }
  };

  if (loading) {
    const handle = decodeURIComponent(params.username ?? "").trim();
    return <SyncingLoader message={handle ? `Loading ${handle}'s series...` : "Loading series..."} fullScreen hideProgressBar={true} />;
  }

  if (notFound || !series) {
    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-purple-50/80 via-slate-50 to-white px-4 py-12 text-center text-slate-900 overflow-hidden selection:bg-[#803D63]/20">
        {/* Ambient Light Background Glow */}
        <div className="pointer-events-none absolute -top-24 -left-20 h-96 w-96 rounded-full bg-purple-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-96 w-96 rounded-full bg-pink-200/30 blur-3xl" />

        <main className="relative z-10 w-full max-w-lg space-y-6">
          {/* Header Branding */}
          <div className="flex items-center justify-between px-2">
            <Logo />
            <span className="rounded-full bg-purple-100 border border-purple-200 px-3.5 py-1 text-xs font-bold text-[#803D63] shadow-2xs">
              Series Showcase • Inflixo
            </span>
          </div>

          {/* Main Not Found Card */}
          <div className="rounded-[32px] border border-purple-100 bg-white/95 p-8 sm:p-10 shadow-2xl shadow-purple-500/10 backdrop-blur-xl space-y-6 text-center">
            {/* Animated Icon Badge */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#803D63] text-white shadow-xl shadow-purple-900/20 ring-4 ring-purple-100">
              <Film className="h-10 w-10 stroke-[2.2]" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-[11px] font-black text-[#803D63] uppercase tracking-wider mb-1">
                <span>SERIES NOT FOUND</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                This Series isn’t available
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
                This OTT series playlist or episode collection doesn’t exist, has been removed, or is currently private.
              </p>
            </div>

            {/* Action Buttons in Inflixo Theme */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => router.push(profileUrl)}
                className="tap-scale w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#803D63] hover:bg-[#6D3254] px-6 py-3.5 text-xs font-black text-white shadow-xl shadow-purple-900/20 transition-all border border-purple-400/30 hover:scale-[1.02] cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to @{username}&apos;s Profile</span>
              </button>

              <button
                onClick={() => router.push("/")}
                className="tap-scale w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 hover:bg-slate-200 px-6 py-3.5 text-xs font-black text-slate-700 transition-all hover:scale-[1.02] cursor-pointer"
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
  const hasPoster = Boolean(series.posterDataUrl);

  return (
    <div className="min-h-dvh bg-slate-950 text-white relative overflow-hidden">

      {/* Ambient background glow from poster */}
      {hasPoster && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={series.posterDataUrl!}
            alt=""
            className="absolute inset-0 h-full w-full object-cover scale-150 opacity-10 blur-3xl"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/80 to-slate-950" />
        </div>
      )}

      {/* Top Nav */}
      <nav className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-4 border-b border-white/5 backdrop-blur-sm">
        <Link
          href={`/${username}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline">Back to Profile</span>
          <span className="sm:hidden">Back</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 px-3.5 py-2 text-xs font-semibold text-white transition-all cursor-pointer backdrop-blur-sm"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-5xl px-4 sm:px-8 pb-16">

        {/* ── HERO SECTION ── */}
        <div className="relative mt-0">
          {/* Full-bleed cinematic banner */}
          <div className="relative w-full aspect-[16/7] sm:aspect-[21/8] overflow-hidden">
            <SeriesPoster
              src={series.posterDataUrl}
              title={series.title}
              className="h-full w-full object-cover"
              textClassName="text-2xl font-black text-slate-300"
            />
            {/* Multi-layer gradient for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

            {/* Top-right floating badges */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <span className="backdrop-blur-md bg-black/40 border border-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                {allEpisodes.length} {allEpisodes.length === 1 ? "Episode" : "Episodes"}
              </span>
              {series.language && (
                <span className="backdrop-blur-md bg-black/40 border border-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  {series.language}
                </span>
              )}
            </div>

            {/* Hero content — bottom left */}
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10 z-10">
              {/* Genre chips */}
              {series.genre && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {series.genre.split(",").map((g, idx) => {
                    const cleanG = g.trim().replace(/^Genre:\s*/i, "");
                    if (!cleanG) return null;
                    return (
                      <span key={idx} className="text-[11px] font-bold uppercase tracking-widest text-slate-300 bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                        {cleanG}
                      </span>
                    );
                  })}
                </div>
              )}

              <h1 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-2 drop-shadow-lg">
                {series.title}
              </h1>

              {series.description && (
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl line-clamp-2 mb-5">
                  {series.description}
                </p>
              )}

              {/* CTA Row */}
              <div className="flex flex-wrap items-center gap-3">
                {allEpisodes[0]?.externalUrl && (
                  <a
                    href={allEpisodes[0].externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-white/10 cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-slate-900" />
                    Play Episode 1
                  </a>
                )}
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all backdrop-blur-sm cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── EPISODE LIST ── */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2.5">
              <Layers className="h-5 w-5 text-[#C87FAA]" />
              Episodes
              <span className="text-sm font-semibold text-slate-500">({allEpisodes.length})</span>
            </h2>
          </div>

          {allEpisodes.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Film className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No episodes added yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allEpisodes.map((ep, index) => {
                const plat = getPlatformInfo(ep.platform, ep.externalUrl);
                const epNumStr = ep.episodeNumber < 10 ? `E${String(ep.episodeNumber).padStart(2,"0")}` : `E${ep.episodeNumber}`;
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
                    className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/15 px-4 py-4 transition-all duration-200 cursor-pointer backdrop-blur-sm"
                  >
                    {/* Episode number */}
                    <div className="shrink-0 w-10 text-center">
                      {isActive ? (
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plat.gradient} flex items-center justify-center shadow-lg ${plat.glow}`}>
                          <Play className="h-4 w-4 fill-white text-white" />
                        </div>
                      ) : (
                        <span className="text-lg font-black text-slate-600 group-hover:text-slate-400 transition-colors tabular-nums">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      )}
                    </div>

                    {/* Title + subtitle */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-200 group-hover:text-white transition-colors truncate">
                        {epTitleStr}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${plat.badge} bg-opacity-80`}>
                          {plat.icon}
                          <span>{plat.name}</span>
                        </span>
                        <span className="text-[11px] text-slate-600 font-medium">{epNumStr}</span>
                      </div>
                    </div>

                    {/* Watch CTA */}
                    <div className="shrink-0 flex items-center gap-2 text-slate-500 group-hover:text-white transition-colors">
                      <span className="hidden sm:inline text-xs font-semibold text-slate-500 group-hover:text-slate-300">
                        Watch
                      </span>
                      <ExternalLink className="h-4 w-4" />
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* ── CREATOR CARD ── */}
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <CreatorAvatar
            src={creator?.photoDataUrl}
            name={creator?.displayName || username}
            className="w-16 h-16 rounded-2xl object-cover shrink-0"
            textClassName="text-xl font-black text-white"
            fallbackBgClass="bg-[#803D63]"
          />
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h3 className="font-extrabold text-base text-white truncate">
                {creator?.displayName || username}
              </h3>
              <CheckCircle2 className="h-4 w-4 text-[#C87FAA] shrink-0" />
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">inflixo.com/{username}</p>
            {creator?.totalFanbase && creator.totalFanbase > 0 && (
              <p className="text-xs text-slate-400 font-semibold mt-1">
                {formatCount(creator.totalFanbase)} total fans
              </p>
            )}
            <p className="text-xs text-slate-400 font-medium mt-2 leading-relaxed">
              Creator of {series.title} • Streaming on Inflixo
            </p>
          </div>
          <Link
            href={`/${username}`}
            className="shrink-0 inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
          >
            <span>Full Profile</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* ── INFLIXO FOOTER ATTRIBUTION ── */}
        <div className="mt-10 text-center">
          <p className="text-xs text-slate-600 font-medium">
            Streaming experience powered by{" "}
            <span className="text-slate-400 font-bold">Inflixo</span>
          </p>
        </div>

      </main>
    </div>
  );
}
