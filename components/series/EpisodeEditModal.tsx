"use client";

import { useState, useEffect } from "react";
import { Film, Loader2, Link2 } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { SeriesService } from "@/services/SeriesService";
import { validateVideoUrl, validateUrlForSeriesPlatform } from "@/lib/videoUrl";
import type { Episode } from "@/types";

interface EpisodeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  episode: Episode | null;
  seriesId: string;
  seriesPlatform?: string;
  onSaved: (updatedEpisode: Episode) => void;
}

export function EpisodeEditModal({
  isOpen,
  onClose,
  episode,
  seriesId,
  seriesPlatform = "YouTube",
  onSaved,
}: EpisodeEditModalProps) {
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (episode) {
      setTitle(episode.title || "");
      setUrl(episode.externalUrl || "");
      setUrlError(null);
    }
  }, [episode, isOpen]);

  if (!isOpen || !episode) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanUrl = url.trim();

    if (!cleanTitle) {
      showToast("Please enter an episode title.", "error");
      return;
    }

    if (cleanUrl) {
      const validation = validateUrlForSeriesPlatform(cleanUrl, seriesPlatform);
      if (!validation.allowed) {
        setUrlError(validation.reason || "Invalid video URL for this series.");
        showToast(validation.reason || "Please enter a valid video link.", "error");
        return;
      }
    }

    setSaving(true);
    setUrlError(null);

    try {
      await SeriesService.updateEpisode(episode.id, {
        title: cleanTitle,
        url: cleanUrl,
      });

      showToast("Episode updated! ✨", "success");
      onSaved({
        ...episode,
        title: cleanTitle,
        externalUrl: cleanUrl,
      });
      onClose();
    } catch (err: any) {
      console.error("Episode update failed:", err);
      // Keep modal open with user's input intact, show error toast
      showToast(err.message || "Couldn't save. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!saving) onClose();
      }}
      size="md"
      title={`Edit Episode ${episode.episodeNumber || ""}`.trim()}
      description="Update the title or video URL for this episode."
      icon={<Film className="h-5 w-5" />}
      showCloseButton={!saving}
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <ModalBody className="p-5 sm:p-6 space-y-4 flex-1 min-h-0 overflow-y-auto">
          <div>
            <label className="block text-[13px] font-medium text-[#0f172a] mb-1.5">
              Episode Title <span className="text-[#C2414B]">*</span>
            </label>
            <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                <Film className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Day 1: Spicy Street Food Challenge"
                className="flex-1 min-w-0 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                required
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#0f172a] mb-1.5">
              Video Link (YouTube, Instagram, or Facebook) <span className="text-[#C2414B]">*</span>
            </label>
            <div className={`flex items-center rounded-[5px] border ${urlError ? "border-rose-400 focus-within:border-rose-500 focus-within:ring-rose-500/10" : "border-[#e2e8f0] focus-within:border-[#7A2253] focus-within:ring-[#7A2253]/10"} bg-white focus-within:ring-2 overflow-hidden transition-colors`}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                <Link2 className="h-4 w-4" />
              </span>
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setUrlError(null);
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 min-w-0 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                required
                disabled={saving}
              />
            </div>
            {urlError && <p className="mt-1 text-xs text-rose-500">{urlError}</p>}
            <p className="mt-1 text-[11px] text-[#64748b]">
              Enter a direct link to a video, reel, or short. Tracking parameters will be automatically removed.
            </p>
          </div>
        </ModalBody>

        <ModalFooter className="px-5 sm:px-6 py-3.5 flex justify-end gap-2 border-t border-[#e2e8f0]">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-10 px-5 rounded-[5px] border border-[#e2e8f0] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-5 rounded-[5px] bg-[#7A2253] text-xs font-semibold text-white shadow-md shadow-[#7A2253]/20 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
