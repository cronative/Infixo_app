"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Film, Loader2, ListPlus } from "lucide-react";
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
  onSaved: (savedEpisode: Episode | Episode[], isNew?: boolean) => void;
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

  // Single vs Multiple links mode (only available when adding)
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkStartNumber, setBulkStartNumber] = useState<number>(nextEpisodeNumber || 1);
  const [bulkProgress, setBulkProgress] = useState<string | null>(null);

  // Single form states
  const [number, setNumber] = useState<number | string>(nextEpisodeNumber || 1);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingTitle, setLoadingTitle] = useState(false);

  // Track if user manually typed or edited the title so auto-fetch doesn't overwrite it
  const userHasTypedTitleRef = useRef(false);
  // Stale fetch tracking: ignore responses if the link changed before fetch resolved
  const activeFetchUrlRef = useRef<string>("");

  // Errors & touched states
  const [numberError, setNumberError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const [touched, setTouched] = useState<{ number?: boolean; title?: boolean; url?: boolean }>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setIsBulkMode(false);
    setBulkText("");
    setBulkStartNumber(nextEpisodeNumber || 1);
    setBulkProgress(null);
    setBulkError(null);
    userHasTypedTitleRef.current = false;
    activeFetchUrlRef.current = "";

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
      userHasTypedTitleRef.current = true;
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

  // Auto-fetch title from backend (/api/video-meta) with 4s timeout
  const handleUrlPrefill = async (inputUrl: string, epNum: number | string) => {
    const clean = normalizeVideoUrl(inputUrl.trim());
    if (!clean) return;

    // Check validity first. If invalid/unsupported URL → do NOT fetch.
    const check = validateUrlForSeriesPlatform(clean, seriesPlatform);
    if (!check.allowed) return;

    activeFetchUrlRef.current = clean;
    setLoadingTitle(true);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(`/api/video-meta?url=${encodeURIComponent(clean)}`, {
        signal: controller.signal,
      });
      clearTimeout(timer);

      // Stale response check: ignore if link changed in the meantime
      if (activeFetchUrlRef.current !== clean) return;

      if (res.ok) {
        const data = await res.json();
        // Do not overwrite if user already typed their own title
        if (!userHasTypedTitleRef.current || !title.trim() || /^Episode\s*\d*$/i.test(title.trim())) {
          if (data.title && typeof data.title === "string" && data.title.trim()) {
            setTitle(data.title.slice(0, 100));
            setTitleError(null);
          } else {
            // Fallback: Episode N
            const fallback = `Episode ${epNum || number || 1}`;
            setTitle(fallback);
            setTitleError(null);
          }
        }
      } else {
        // Response not ok: fallback to Episode N if empty
        if (!userHasTypedTitleRef.current || !title.trim()) {
          setTitle(`Episode ${epNum || number || 1}`);
          setTitleError(null);
        }
      }
    } catch {
      // Abort / timeout / network failure: fallback to Episode N if empty, never crash or block
      if (activeFetchUrlRef.current === clean) {
        if (!userHasTypedTitleRef.current || !title.trim()) {
          setTitle(`Episode ${epNum || number || 1}`);
          setTitleError(null);
        }
      }
    } finally {
      if (activeFetchUrlRef.current === clean) {
        setLoadingTitle(false);
      }
    }
  };

  // Parsed bulk links
  const parsedBulkLinks = useMemo(() => {
    return bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => Boolean(line));
  }, [bulkText]);

  // Submit Bulk Episodes
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError(null);

    if (parsedBulkLinks.length === 0) {
      setBulkError("Please paste at least one video link.");
      return;
    }

    // Validate each link
    const normalizedList: string[] = [];
    for (let i = 0; i < parsedBulkLinks.length; i++) {
      const raw = parsedBulkLinks[i];
      const check = validateUrlForSeriesPlatform(raw, seriesPlatform);
      if (!check.allowed) {
        setBulkError(`Line ${i + 1}: ${check.reason || "Invalid video link."}`);
        return;
      }
      normalizedList.push(check.normalizedUrl);
    }

    setSaving(true);
    const startNum = Math.max(1, bulkStartNumber || 1);
    const itemsToInsert: Array<{ url: string; title: string; episodeNumber: number }> = [];

    try {
      for (let i = 0; i < normalizedList.length; i++) {
        const epUrl = normalizedList[i];
        const epNum = startNum + i;
        setBulkProgress(`Fetching title ${i + 1} of ${normalizedList.length}...`);

        let fetchedTitle = `Episode ${epNum}`;
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(`/api/video-meta?url=${encodeURIComponent(epUrl)}`, {
            signal: controller.signal,
          });
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            if (data?.title && typeof data.title === "string" && data.title.trim()) {
              fetchedTitle = data.title.slice(0, 100);
            }
          }
        } catch {
          // Keep fallback
        }

        itemsToInsert.push({
          url: epUrl,
          title: fetchedTitle,
          episodeNumber: epNum,
        });
      }

      setBulkProgress("Saving episodes...");
      const addedEpisodes = await SeriesService.bulkAddEpisodes(seriesId, itemsToInsert);

      showToast(
        `${addedEpisodes.length} episode${addedEpisodes.length === 1 ? "" : "s"} added! ✨`,
        "success"
      );
      onSaved(addedEpisodes, true);
      onClose();
    } catch (err: any) {
      console.error("Bulk add episodes failed:", err);
      setBulkError(err.message || "Failed to add episodes. Please try again.");
    } finally {
      setSaving(false);
      setBulkProgress(null);
    }
  };

  // Submit Single Episode
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    const currentNumberErr = validateNumber(number);
    const currentTitleErr = validateTitle(title);
    const currentUrlErr = validateUrl(url);

    if (currentNumberErr || currentTitleErr || currentUrlErr) {
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

  if (!isOpen) return null;
  if (!isAddMode && !episode) return null;

  const currentNumberErr = validateNumber(number);
  const currentTitleErr = validateTitle(title);
  const currentUrlErr = validateUrl(url);

  const hasAnyError = Boolean(currentNumberErr || currentTitleErr || currentUrlErr);
  const showNumberErr = (touched.number || submitted) && currentNumberErr;
  const showTitleErr = (touched.title || submitted) && currentTitleErr;
  const showUrlErr = (touched.url || submitted) && currentUrlErr;

  const modalTitle = isAddMode
    ? isBulkMode
      ? "Paste Multiple Links"
      : "Add Episode"
    : `Edit Episode ${episode?.episodeNumber || ""}`.trim();

  const modalDescription = isAddMode
    ? isBulkMode
      ? `Paste links for ${seriesTitle || "this series"}, one per line.`
      : seriesTitle || "Add a new episode to your series."
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
      {isBulkMode ? (
        /* Multiple Links Form */
        <form onSubmit={handleBulkSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden text-left">
          <ModalBody className="p-5 sm:p-6 space-y-4 flex-1 min-h-0 overflow-y-auto">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#0f172a]">
                Video links (one per line) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsBulkMode(false)}
                disabled={saving}
                className="text-xs text-[#7A2253] font-medium hover:underline cursor-pointer"
              >
                Switch to single link
              </button>
            </div>

            <div>
              <textarea
                value={bulkText}
                onChange={(e) => {
                  setBulkText(e.target.value);
                  setBulkError(null);
                }}
                disabled={saving}
                rows={7}
                placeholder={`https://${seriesPlatform.toLowerCase() === "instagram" ? "instagram.com/reel/..." : seriesPlatform.toLowerCase() === "facebook" ? "facebook.com/watch/..." : "youtube.com/watch?v=..."}\nhttps://${seriesPlatform.toLowerCase() === "instagram" ? "instagram.com/reel/..." : seriesPlatform.toLowerCase() === "facebook" ? "facebook.com/watch/..." : "youtube.com/watch?v=..."}`}
                className="w-full rounded-[4px] border border-[#e2e8f0] bg-white p-3 font-mono text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7A2253] focus:outline-none transition-colors"
              />
              {bulkError && <p className="mt-1.5 text-xs text-rose-500 font-medium">{bulkError}</p>}
            </div>

            {/* Starting Episode Number + Preview info */}
            <div className="flex items-center justify-between gap-4 rounded-[5px] bg-[#fafafa] p-3 border border-[#ECECF0]">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#18181B]">
                  {parsedBulkLinks.length === 0
                    ? "No links entered"
                    : `${parsedBulkLinks.length} link${parsedBulkLinks.length === 1 ? "" : "s"} detected`}
                </p>
                <p className="text-[11px] text-[#6B6B76] mt-0.5">
                  {parsedBulkLinks.length === 0
                    ? "Links will be auto-numbered sequentially."
                    : `Will be numbered #${bulkStartNumber} to #${bulkStartNumber + parsedBulkLinks.length - 1}.`}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-1.5">
                <span className="text-xs text-[#6B6B76] font-medium">Start at #:</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={bulkStartNumber}
                  disabled={saving}
                  onChange={(e) => setBulkStartNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-14 rounded-[4px] border border-[#e2e8f0] bg-white px-2 py-1 text-xs text-center text-[#0f172a] focus:outline-none focus:border-[#7A2253]"
                />
              </div>
            </div>

            {bulkProgress && (
              <div className="flex items-center gap-2 rounded-[4px] bg-[#7A2253]/10 p-2 text-xs font-medium text-[#7A2253]">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>{bulkProgress}</span>
              </div>
            )}
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
              disabled={saving || parsedBulkLinks.length === 0}
              className="h-9 px-4 rounded-[5px] bg-[#7A2253] text-xs font-semibold text-white shadow-xs hover:bg-[#601a41] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>
                {saving
                  ? "Adding Episodes..."
                  : parsedBulkLinks.length > 0
                  ? `Add ${parsedBulkLinks.length} Episode${parsedBulkLinks.length === 1 ? "" : "s"}`
                  : "Add Episodes"}
              </span>
            </button>
          </ModalFooter>
        </form>
      ) : (
        /* Single Episode Form */
        <form onSubmit={handleSingleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden text-left">
          <ModalBody className="p-5 sm:p-6 space-y-4 flex-1 min-h-0 overflow-y-auto">
            {/* 1. Video link (MOVED TO TOP) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#0f172a]">
                  Video link <span className="text-rose-500">*</span>
                </label>
                {isAddMode && (
                  <button
                    type="button"
                    onClick={() => setIsBulkMode(true)}
                    className="inline-flex items-center gap-1 text-xs text-[#7A2253] font-medium hover:underline cursor-pointer"
                  >
                    <ListPlus className="h-3.5 w-3.5" />
                    <span>Paste multiple links</span>
                  </button>
                )}
              </div>

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

            {/* 2. Title (with char counter and subtle loader, never blocks Save) */}
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
                    userHasTypedTitleRef.current = true;
                    setTitle(e.target.value);
                    setTitleError(validateTitle(e.target.value));
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, title: true }));
                    setTitleError(validateTitle(title));
                  }}
                  placeholder="Episode title"
                  className={`w-full rounded-[4px] border bg-white pl-3 ${
                    loadingTitle ? "pr-8" : "pr-3"
                  } py-2 text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none transition-colors ${
                    showTitleErr
                      ? "border-rose-500 bg-rose-50/20 focus:border-rose-600 has-edit-error"
                      : "border-[#e2e8f0] focus:border-[#7A2253]"
                  }`}
                />
                {loadingTitle && (
                  <span
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-[#7A2253]"
                    title="Fetching title..."
                  >
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  </span>
                )}
              </div>
              {showTitleErr && <p className="mt-1 text-xs text-rose-500 font-medium">{showTitleErr}</p>}
            </div>

            {/* 3. Episode No. */}
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
      )}
    </Modal>
  );
}
