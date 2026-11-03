"use client";

import { useState, useEffect, useMemo } from "react";
import { Film, Loader2 } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { SeriesService } from "@/services/SeriesService";
import { validateUrlForSeriesPlatform, normalizeVideoUrl, validateVideoUrl } from "@/lib/videoUrl";
import { YoutubeIcon, InstagramIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import type { Episode } from "@/types";

export interface EpisodeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "edit" | "add";
  episode?: Episode | null;
  seriesId: string;
  seriesTitle?: string;
  seriesPlatform?: string;
  nextEpisodeNumber?: number;
  onSaved: (savedEpisode: Episode, isNew?: boolean) => void;
}

export function EpisodeEditModal({
  isOpen,
  onClose,
  mode = "edit",
  episode,
  seriesId,
  seriesTitle,
  seriesPlatform = "YouTube",
  nextEpisodeNumber = 1,
  onSaved,
}: EpisodeEditModalProps) {
  const { showToast } = useToast();
  const isAddMode = mode === "add" || !episode;

  const [number, setNumber] = useState<number | string>(nextEpisodeNumber || 1);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingTitle, setLoadingTitle] = useState(false);

  // Errors & touched states
  const [numberError, setNumberError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  const [touched, setTouched] = useState<{ number?: boolean; title?: boolean; url?: boolean }>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (isAddMode) {
      setNumber(nextEpisodeNumber || 1);
      setTitle("");
      setUrl("");
      setNumberError(null);
      setTitleError(null);
      setUrlError(null);
      setTouched({});
      setSubmitted(false);
    } else if (episode) {
      setNumber(episode.episodeNumber || 1);
      setTitle(episode.title || "");
      setUrl(episode.externalUrl || "");
      setNumberError(null);
      setTitleError(null);
      setUrlError(null);
      setTouched({});
      setSubmitted(false);
    }
  }, [isOpen, isAddMode, episode, nextEpisodeNumber]);

  // Detected platform from current URL
  const detectedPlatform = useMemo(() => {
    const clean = url.trim();
    if (!clean) return null;
    const val = validateVideoUrl(clean);
    return val.platform;
  }, [url]);

  // Validate number
  const validateNumber = (val: number | string): string | null => {
    if (val === "" || val === null || val === undefined) {
      return "Episode number is required.";
    }
    const num = Number(val);
    if (isNaN(num) || !Number.isInteger(num) || num < 1) {
      return "Episode number must be a whole number ≥ 1.";
    }
    return null;
  };

  // Validate title
  const validateTitle = (val: string): string | null => {
    const clean = val.trim();
    if (!clean) {
      return "Title is required.";
    }
    if (clean.length > 100) {
      return "Title must be 100 characters or less.";
    }
    return null;
  };

  // Validate URL
  const validateUrl = (val: string): string | null => {
    const clean = val.trim();
    if (!clean) {
      return "Video link is required.";
    }
    const check = validateUrlForSeriesPlatform(clean, seriesPlatform);
    if (!check.allowed) {
      return check.reason || `Only ${seriesPlatform} links are allowed in a ${seriesPlatform} series.`;
    }
    return null;
  };

  const handleUrlPrefill = async (inputUrl: string, epNum: number | string) => {
    const clean = normalizeVideoUrl(inputUrl.trim());
    if (!clean) return;

    const check = validateUrlForSeriesPlatform(clean, seriesPlatform);
    if (!check.allowed) return;

    if (check.detectedPlatform === "YouTube") {
      setLoadingTitle(true);
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(clean)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.title && (!title.trim() || /^Episode\s*\d*$/i.test(title.trim()))) {
            setTitle(data.title.slice(0, 100));
            setTitleError(null);
          }
        }
      } catch (err) {
        // Fallback title if empty
        if (!title.trim()) {
          setTitle(`Episode ${epNum || 1}`);
        }
      } finally {
        setLoadingTitle(false);
      }
    } else if (check.detectedPlatform === "Instagram" || check.detectedPlatform === "Facebook") {
      if (!title.trim() || /^Episode\s*\d*$/i.test(title.trim())) {
        setTitle(`Episode ${epNum || 1}`);
        setTitleError(null);
      }
    }
  };

  if (!isOpen) return null;
  if (!isAddMode && !episode) return null;

  const currentNumberErr = validateNumber(number);
  const currentTitleErr = validateTitle(title);
  const currentUrlErr = validateUrl(url);

  const hasAnyError = Boolean(currentNumberErr || currentTitleErr || currentUrlErr);

  const showNumberErr = (touched.number || submitted) && currentNumberErr;
  const showTitleErr = (touched.title || submitted) && currentTitleErr;
  const showUrlErr = (touched.url || submitted) && currentUrlErr;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (hasAnyError) {
      const firstEl = document.querySelector(".has-edit-error");
      if (firstEl && "focus" in firstEl) {
        (firstEl as HTMLElement).focus();
      }
      return;
    }

    const cleanTitle = title.trim();
    const cleanUrl = normalizeVideoUrl(url.trim());
    const cleanNumber = Math.max(1, parseInt(String(number), 10) || 1);

    setSaving(true);

    if (isAddMode) {
      try {
        const addedEpisodes = await SeriesService.bulkAddEpisodes(seriesId, [
          {
            url: cleanUrl,
            title: cleanTitle,
            episodeNumber: cleanNumber,
          },
        ]);

        const newEp: Episode = addedEpisodes[0] || {
          id: `ep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          episodeNumber: cleanNumber,
          title: cleanTitle,
          externalUrl: cleanUrl,
          platform: (detectedPlatform as any) || seriesPlatform,
          thumbnailDataUrl: null,
          description: "",
        };

        showToast(`Episode "${cleanTitle}" added! ✨`, "success");
        onSaved(newEp, true);
        onClose();
      } catch (err: any) {
        console.error("Episode add failed:", err);
        showToast(err.message || "Couldn't add episode. Please check the link.", "error");
      } finally {
        setSaving(false);
      }
    } else {
      try {
        await SeriesService.updateEpisode(episode!.id, {
          title: cleanTitle,
          url: cleanUrl,
          episodeNumber: cleanNumber,
        });

        showToast("Episode updated! ✨", "success");
        onSaved(
          {
            ...episode!,
            title: cleanTitle,
            externalUrl: cleanUrl,
            episodeNumber: cleanNumber,
          },
          false
        );
        onClose();
      } catch (err: any) {
        console.error("Episode update failed:", err);
        showToast(err.message || "Couldn't save. Please try again.", "error");
      } finally {
        setSaving(false);
      }
    }
  };

  const modalTitle = isAddMode
    ? "Add Episode"
    : `Edit Episode ${episode?.episodeNumber || ""}`.trim();

  const modalDescription = isAddMode
    ? seriesTitle || "Add a new episode to your series."
    : "Update episode details, video link and order number.";

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!saving) onClose();
      }}
      size="md"
      title={modalTitle}
      description={modalDescription}
      icon={<Film className="h-5 w-5" />}
      showCloseButton={!saving}
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden text-left">
        <ModalBody className="p-5 sm:p-6 space-y-4 flex-1 min-h-0 overflow-y-auto">
          {/* 1. Episode No. (number input, auto-filled, editable) */}
          <div>
            <label className="block text-xs font-semibold text-[#0f172a] mb-1">
              Episode No. <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={number}
              disabled={saving}
              onChange={(e) => {
                setNumber(e.target.value);
                setNumberError(validateNumber(e.target.value));
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, number: true }));
                setNumberError(validateNumber(number));
              }}
              placeholder="e.g. 1"
              className={`w-full rounded-[4px] border bg-white px-3 py-2 text-xs text-[#0f172a] focus:outline-none transition-colors ${
                showNumberErr
                  ? "border-rose-500 bg-rose-50/20 focus:border-rose-600 has-edit-error"
                  : "border-[#e2e8f0] focus:border-[#7A2253]"
              }`}
            />
            {showNumberErr && <p className="mt-1 text-xs text-rose-500 font-medium">{showNumberErr}</p>}
          </div>

          {/* 2. Title (text, required, max 100, with char counter) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#0f172a]">
                Title <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-[#94a3b8] tabular-nums">
                {title.length}/100
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                maxLength={100}
                value={title}
                disabled={saving}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setTitleError(validateTitle(e.target.value));
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, title: true }));
                  setTitleError(validateTitle(title));
                }}
                placeholder="Episode title"
                className={`w-full rounded-[4px] border bg-white px-3 py-2 text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none transition-colors ${
                  showTitleErr
                    ? "border-rose-500 bg-rose-50/20 focus:border-rose-600 has-edit-error"
                    : "border-[#e2e8f0] focus:border-[#7A2253]"
                }`}
              />
              {loadingTitle && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-[#7A2253]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </span>
              )}
            </div>
            {showTitleErr && <p className="mt-1 text-xs text-rose-500 font-medium">{showTitleErr}</p>}
          </div>

          {/* 3. Video link (url, required, platform icon detection) */}
          <div>
            <label className="block text-xs font-semibold text-[#0f172a] mb-1">
              Video link <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="url"
                value={url}
                disabled={saving}
                onChange={(e) => {
                  const val = e.target.value;
                  setUrl(val);
                  setUrlError(validateUrl(val));
                }}
                onPaste={(e) => {
                  const pasteText = e.clipboardData.getData("text").trim();
                  const stripped = normalizeVideoUrl(pasteText);
                  setUrl(stripped);
                  setUrlError(validateUrl(stripped));
                  handleUrlPrefill(stripped, number);
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, url: true }));
                  setUrlError(validateUrl(url));
                  if (url.trim()) {
                    handleUrlPrefill(url, number);
                  }
                }}
                placeholder={`https://${seriesPlatform.toLowerCase() === "instagram" ? "instagram.com/reel/..." : seriesPlatform.toLowerCase() === "facebook" ? "facebook.com/watch/..." : "youtube.com/watch?v=..."}`}
                className={`w-full rounded-[4px] border bg-white pl-3 ${
                  detectedPlatform && detectedPlatform !== "Other" ? "pr-9" : "pr-3"
                } py-2 text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none transition-colors ${
                  showUrlErr
                    ? "border-rose-500 bg-rose-50/20 focus:border-rose-600 has-edit-error"
                    : "border-[#e2e8f0] focus:border-[#7A2253]"
                }`}
              />
              {detectedPlatform && detectedPlatform !== "Other" && (
                <div
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
                  title={detectedPlatform}
                >
                  {detectedPlatform === "YouTube" && (
                    <YoutubeIcon className="h-4 w-4 text-red-500" />
                  )}
                  {detectedPlatform === "Instagram" && (
                    <InstagramIcon className="h-4 w-4 text-pink-500" />
                  )}
                  {detectedPlatform === "Facebook" && (
                    <FacebookIcon className="h-4 w-4 text-blue-600" />
                  )}
                </div>
              )}
            </div>
            {showUrlErr && <p className="mt-1 text-xs text-rose-500 font-medium">{showUrlErr}</p>}
          </div>
        </ModalBody>

        <ModalFooter className="px-5 sm:px-6 py-3.5 flex justify-end gap-2 border-t border-[#e2e8f0]">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-9 px-4 rounded-[5px] border border-[#e2e8f0] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || hasAnyError}
            className="h-9 px-4 rounded-[5px] bg-[#7A2253] text-xs font-semibold text-white shadow-xs hover:bg-[#601a41] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>
              {isAddMode
                ? saving
                  ? "Adding..."
                  : "Add Episode"
                : saving
                ? "Saving..."
                : "Save Changes"}
            </span>
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
