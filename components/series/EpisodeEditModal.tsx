"use client";

import { useState, useEffect } from "react";
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
      title="Edit Episode"
      showCloseButton={!saving}
    >
      <form onSubmit={handleSubmit}>
        <ModalBody className="p-5 sm:p-6 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#0f172a] mb-1.5">
              Episode Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Day 1: Spicy Street Food Challenge"
              className="w-full rounded-[5px] border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7A2253] focus:outline-none focus:ring-1 focus:ring-[#7A2253]/20"
              required
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#0f172a] mb-1.5">
              Video Link (YouTube, Instagram, or Facebook)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError(null);
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              className={`w-full rounded-[5px] border px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-1 ${
                urlError
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
                  : "border-[#e2e8f0] bg-white focus:border-[#7A2253] focus:ring-[#7A2253]/20"
              }`}
              required
              disabled={saving}
            />
            {urlError && <p className="mt-1 text-xs text-rose-500">{urlError}</p>}
            <p className="mt-1 text-[11px] text-[#64748b]">
              Enter a direct link to a video, reel, or short. Tracking parameters will be automatically removed.
            </p>
          </div>
        </ModalBody>

        <ModalFooter className="px-5 sm:px-6 py-3.5 flex justify-end gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-9 px-4 rounded-[5px] border border-[#e2e8f0] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-9 px-5 rounded-[5px] bg-[#7A2253] text-xs font-semibold text-white shadow-xs hover:bg-[#601a41] transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
