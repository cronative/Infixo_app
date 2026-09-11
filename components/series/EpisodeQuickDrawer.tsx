"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Play, Film, Globe, ExternalLink } from "lucide-react";
import { Series, Episode, Season, ThemeKey } from "@/types";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { InflixoLogoIcon } from "@/components/shared/Logo";

interface EpisodeQuickDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  series: Series | null;
  themeKey?: ThemeKey;
}

export function EpisodeQuickDrawer({
  isOpen,
  onClose,
  series,
}: EpisodeQuickDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [activeSeasonIndex, setActiveSeasonIndex] = useState(0);
  const [coverError, setCoverError] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset season index & cover error when series changes
  useEffect(() => {
    setActiveSeasonIndex(0);
    setCoverError(false);
  }, [series?.id]);

  // Scroll lock & Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.scrollTo(0, scrollY);
    };
  }, [isOpen, onClose]);

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

  if (!mounted || !isOpen || !series) return null;

  const detectedPlatform = (() => {
    const p = (series.platform || "").toLowerCase();
    if (p.includes("youtube")) return "YouTube";
    if (p.includes("instagram")) return "Instagram";
    if (p.includes("facebook")) return "Facebook";
    return series.platform || null;
  })();

  function getPlatformIcon(platform?: string) {
    switch (platform?.toLowerCase()) {
      case "youtube":
        return <YoutubeIcon className="h-3.5 w-3.5 text-white" />;
      case "instagram":
        return <InstagramIcon className="h-3.5 w-3.5 text-white" />;
      case "facebook":
        return <FacebookIcon className="h-3.5 w-3.5 text-white" />;
      default:
        return <Play className="h-3.5 w-3.5 text-white" />;
    }
  }

  function getPlatformBadgeBg(platform?: string) {
    switch (platform?.toLowerCase()) {
      case "youtube":
        return "bg-[#FF0000]";
      case "instagram":
        return "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600";
      case "facebook":
        return "bg-[#1877F2]";
      default:
        return "bg-[#151933]";
    }
  }

  const hasValidCover = Boolean(series.posterDataUrl && !coverError);

  const genresList = series.genre
    ? series.genre
      .split(/[,•|/]/)
      .map((g) => g.trim().replace(/^Genre:\s*/i, ""))
      .filter(Boolean)
    : [];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={series.title || "Series Details"}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[999] w-screen h-[100dvh] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Center Card Styled Popup Surface */}
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[560px] max-h-[calc(100dvh-28px)] sm:max-h-[calc(100dvh-44px)] bg-white rounded-[28px] border border-slate-200/90 shadow-2xl shadow-black/25 flex flex-col overflow-hidden text-left animate-in zoom-in-95 duration-200"
      >
        {/* 1. Full-Width Hero Cover Header (Styled like Center Profile Card Hero) */}
        <div className={`relative w-full overflow-hidden shrink-0 ${
          hasValidCover
            ? "aspect-[21/10] sm:aspect-[21/9] min-h-[165px] sm:min-h-[190px] bg-slate-900"
            : "min-h-[140px] bg-gradient-to-r from-[#151933] via-[#2A335E] to-[#151933]"
        }`}>
          {hasValidCover && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={series.posterDataUrl || ""}
                alt={series.title}
                onError={() => setCoverError(true)}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/45 to-black/25 pointer-events-none" />
            </>
          )}

          {/* Top Action Bar over Cover Image */}
          <div className="absolute top-3 inset-x-3 sm:top-3.5 sm:inset-x-3.5 z-20 flex items-center justify-between pointer-events-auto">
            {/* Left: Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="tap-scale flex h-8.5 w-8.5 items-center justify-center rounded-full bg-black/45 hover:bg-black/70 backdrop-blur-md border border-white/25 text-white transition-all shadow-md cursor-pointer"
            >
              <X className="h-4 w-4 stroke-[2.5]" />
            </button>

            {/* Right: Inflixo Logo & Platform Pill */}
            <div className="flex items-center gap-1.5">
              {detectedPlatform && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-white shadow-md backdrop-blur-md">
                  {detectedPlatform === "YouTube" && <YoutubeIcon className="h-3 w-3 text-red-500" />}
                  {detectedPlatform === "Instagram" && <InstagramIcon className="h-3 w-3 text-pink-500" />}
                  {detectedPlatform === "Facebook" && <FacebookIcon className="h-3 w-3 text-blue-500" />}
                  {detectedPlatform !== "YouTube" && detectedPlatform !== "Instagram" && detectedPlatform !== "Facebook" && (
                    <Globe className="h-3 w-3 text-white" />
                  )}
                  <span>{detectedPlatform}</span>
                </div>
              )}

              <div
                className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-black/45 backdrop-blur-md border border-white/25 text-white shadow-md select-none"
                title="Inflixo Series"
              >
                <InflixoLogoIcon className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Bottom Title & Badges on Cover */}
          <div className="absolute inset-x-4 bottom-3.5 sm:inset-x-5 sm:bottom-4 z-10 flex flex-col space-y-1.5">
            <h2 className="font-display text-lg sm:text-2xl font-black leading-tight tracking-tight text-white drop-shadow-md">
              {series.title}
            </h2>

            {/* Pill Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/45 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-white/95 backdrop-blur-sm shadow-xs">
                <Film className="h-3 w-3 text-white/80" />
                <span>{allEpisodes.length} {allEpisodes.length === 1 ? "Episode" : "Episodes"}</span>
              </span>

              {genresList.length > 0 && (
                <span className="inline-flex items-center rounded-full border border-white/20 bg-black/45 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-white/90 backdrop-blur-sm shadow-xs">
                  {genresList.slice(0, 2).join(" · ")}
                </span>
              )}

              {series.language && (
                <span className="inline-flex items-center rounded-full border border-white/20 bg-black/45 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-white/90 backdrop-blur-sm shadow-xs">
                  {series.language}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-left scrollbar-none">
          {/* Series Description */}
          {series.description && series.description.trim() && (
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 sm:p-4 text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal">
              <p>{series.description}</p>
            </div>
          )}

          {/* Multiple Seasons Tabs */}
          {seasonsList.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {seasonsList.map((sn, idx) => (
                <button
                  key={sn.id || idx}
                  type="button"
                  onClick={() => setActiveSeasonIndex(idx)}
                  className={`tap-scale px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                    activeSeasonIndex === idx
                      ? "bg-[#151933] text-white border-[#151933] shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {sn.title || `Season ${sn.seasonNumber || idx + 1}`} ({sn.episodes?.length || 0})
                </button>
              ))}
            </div>
          )}

          {/* Episode Tracklist Header */}
          <div className="space-y-2 pt-0.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                {seasonsList.length > 1
                  ? `${seasonsList[activeSeasonIndex]?.title || `Season ${activeSeasonIndex + 1}`} Episodes (${currentEpisodes.length})`
                  : `Episodes Tracklist (${currentEpisodes.length})`}
              </span>
            </div>

            {/* Episodes List */}
            {currentEpisodes.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-semibold border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                No episodes uploaded for this series yet.
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200/90 bg-white divide-y divide-slate-100 overflow-hidden shadow-xs">
                {currentEpisodes.map((ep, idx) => {
                  const partNum = ep.episodeNumber || idx + 1;
                  const partNumStr = partNum < 10 ? `0${partNum}` : `${partNum}`;
                  const epTitleStr = ep.title?.trim() || `Episode ${partNum}`;

                  return (
                    <div
                      key={ep.id || idx}
                      className="group flex items-center justify-between gap-3 px-3.5 py-2.5 sm:py-3 transition-colors hover:bg-slate-50/80 text-left"
                    >
                      {/* Left: Number + Platform Icon + Title */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="font-mono text-xs font-bold text-slate-400 w-5 shrink-0 text-center">
                          {partNumStr}
                        </span>

                        <span className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-xl text-white shadow-xs ${getPlatformBadgeBg(ep.platform || series.platform)}`}>
                          {getPlatformIcon(ep.platform || series.platform)}
                        </span>

                        <div className="min-w-0 space-y-0.5">
                          <p className="truncate text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-[#151933] transition-colors">
                            {epTitleStr}
                          </p>
                          {(ep as any).duration && (
                            <p className="text-[11px] text-slate-400 font-medium">
                              {(ep as any).duration}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Play Action Button */}
                      {ep.externalUrl ? (
                        <a
                          href={ep.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="tap-scale shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[#151933] hover:bg-brand-hover px-3.5 py-1.5 text-xs font-bold text-white transition-all shadow-xs cursor-pointer hover:scale-102"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Play</span>
                          <ExternalLink className="h-3 w-3 opacity-70" />
                        </a>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400 px-2 py-1">
                          Coming soon
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 3. Pinned Center Card Style Footer */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-center shrink-0 select-none">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="tap-scale inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <InflixoLogoIcon className="h-3.5 w-3.5" />
            <span>Made with Inflixo</span>
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}
