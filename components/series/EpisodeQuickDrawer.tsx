"use client";

import { Play, Film } from "lucide-react";
import { Series, Episode } from "@/types";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { Modal, ModalBody } from "@/components/ui/Modal";

interface EpisodeQuickDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  series: Series | null;
}

export function EpisodeQuickDrawer({ isOpen, onClose, series }: EpisodeQuickDrawerProps) {
  if (!series) return null;

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={series.title}
      description={`${series.genre || "Series"} • ${episodes.length} Episodes`}
      icon={<Film className="h-4 w-4" />}
    >
      <ModalBody className="p-5 sm:p-6 space-y-4 text-left">
        {/* Series Description */}
        {series.description && (
          <p className="text-xs text-[#797570] font-medium leading-relaxed bg-[#F8F7F3] p-3 rounded-xl border border-[#E7E3DC]">
            {series.description}
          </p>
        )}

        {/* 1-Tap Episode Tracklist */}
        <div className="space-y-2 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#797570]">
            Episodes Tracklist ({episodes.length})
          </p>

          {episodes.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#797570] font-semibold border border-dashed border-[#E7E3DC] rounded-2xl bg-[#F8F7F3]">
              No episodes uploaded for this series yet.
            </div>
          ) : (
            <div className="space-y-2">
              {episodes.map((ep, idx) => (
                <div
                  key={ep.id || idx}
                  className="rounded-xl border border-[#E7E3DC] bg-white p-3 transition-all hover:border-[#803D63]/30 hover:shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white shadow-xs ${getPlatformBadgeBg(ep.platform)}`}>
                      {getPlatformIcon(ep.platform)}
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-xs font-bold text-[#181716] flex items-center gap-2">
                        <span>Ep {ep.episodeNumber || idx + 1}: {ep.title}</span>
                      </p>
                      <p className="truncate text-[11px] text-[#797570] font-medium">
                        {ep.platform || "Video Episode"}
                      </p>
                    </div>
                  </div>

                  {ep.externalUrl && (
                    <a
                      href={ep.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[#803D63] hover:bg-[#6F3456] px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
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
      </ModalBody>
    </Modal>
  );
}
