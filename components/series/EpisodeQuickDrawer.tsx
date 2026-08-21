"use client";

import { Play, X, ExternalLink, Film, Sparkles, CheckCircle2 } from "lucide-react";
import { Series, Episode } from "@/types";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";

interface EpisodeQuickDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  series: Series | null;
}

export function EpisodeQuickDrawer({ isOpen, onClose, series }: EpisodeQuickDrawerProps) {
  if (!isOpen || !series) return null;

  const episodes: Episode[] = Array.isArray(series.seasons)
    ? series.seasons.flatMap((sn) => (sn && Array.isArray(sn.episodes) ? sn.episodes : []))
    : (series as any).episodes || [];

  function getPlatformIcon(platform: string) {
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

  function getPlatformBadgeBg(platform: string) {
    switch (platform?.toLowerCase()) {
      case "youtube":
        return "bg-red-600";
      case "instagram":
        return "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600";
      case "facebook":
        return "bg-blue-600";
      default:
        return "bg-[#803D63]";
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-gray-200 rounded-t-[32px] sm:rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 text-left max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#803D63]/10 text-[#803D63]">
              <Film className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-base font-extrabold text-slate-900 truncate">
                {series.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate flex items-center gap-2">
                <span>{series.genre || "Series"}</span>
                <span>•</span>
                <span>{episodes.length} Episodes</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Series Description */}
        {series.description && (
          <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
            {series.description}
          </p>
        )}

        {/* 1-Tap Episode Tracklist */}
        <div className="space-y-2 pt-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Episodes Tracklist ({episodes.length})
          </p>

          {episodes.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 font-semibold border border-dashed border-slate-200 rounded-2xl">
              No episodes uploaded for this series yet.
            </div>
          ) : (
            <div className="space-y-2">
              {episodes.map((ep, idx) => (
                <div
                  key={ep.id || idx}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-3 transition-all hover:border-[#803D63]/30 hover:shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs ${getPlatformBadgeBg(ep.platform)}`}>
                      {getPlatformIcon(ep.platform)}
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-xs font-extrabold text-slate-900 flex items-center gap-2">
                        <span>Ep {ep.episodeNumber || idx + 1}: {ep.title}</span>
                      </p>
                      <p className="truncate text-[11px] text-slate-500 font-medium">
                        {ep.platform || "Video Episode"}
                      </p>
                    </div>
                  </div>

                  {ep.externalUrl && (
                    <a
                      href={ep.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="tap-scale shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-3.5 py-2 text-xs font-bold text-white transition-all cursor-pointer shadow-2xs"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Play Ep {ep.episodeNumber || idx + 1} →</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
