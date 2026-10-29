"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Loader2,
  AlertCircle,
  Pencil,
  Check,
  Film,
} from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { SeriesService } from "@/services/SeriesService";
import { Series, EpisodePlatform } from "@/types";
import { SeriesCoverUpload } from "@/components/series/SeriesCoverUpload";
import { GenreMultiSelect } from "@/components/ui/GenreMultiSelect";
import { LanguageSelect } from "@/components/ui/LanguageSelect";
import { YoutubeIcon, InstagramIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import {
  validateUrlForSeriesPlatform,
  canSwitchSeriesPlatform,
  slugifySeriesTitle,
} from "@/lib/videoUrl";
import { copyToClipboard } from "@/lib/copyToClipboard";

export interface EpisodeFormRow {
  id: string;
  number: number | string;
  url: string;
  title: string;
  loadingTitle?: boolean;
  isEditingTitle?: boolean;
}

interface SeriesUpsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  seriesToEdit?: Series | null;
  creatorUsername?: string;
  defaultLanguage?: string;
  defaultCategories?: string;
  maxEpisodes?: number;
  onSuccess: (newOrUpdatedSeriesId: string, isNew: boolean, seriesTitle: string) => void;
}

export function SeriesUpsertModal({
  isOpen,
  onClose,
  seriesToEdit,
  creatorUsername = "",
  defaultLanguage = "Hindi",
  defaultCategories = "",
  maxEpisodes = Infinity,
  onSuccess,
}: SeriesUpsertModalProps) {
  const { showToast } = useToast();
  const isEditing = Boolean(seriesToEdit);

  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<EpisodePlatform>("YouTube");
  const [episodeRows, setEpisodeRows] = useState<EpisodeFormRow[]>([
    { id: "row-1", number: 1, url: "", title: "" },
    { id: "row-2", number: 2, url: "", title: "" },
    { id: "row-3", number: 3, url: "", title: "" },
  ]);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [genres, setGenres] = useState("");
  const [language, setLanguage] = useState(defaultLanguage);
  const [saving, setSaving] = useState(false);
  const [platformSwitchError, setPlatformSwitchError] = useState<string | null>(null);

  const titleCacheRef = useRef<Record<string, string>>({});
  const previewAbortRef = useRef<Record<string, AbortController>>({});

  // Initialize form when opening or editing
  useEffect(() => {
    if (!isOpen) return;

    if (seriesToEdit) {
      setTitle(seriesToEdit.title || "");
      const plat = (seriesToEdit.platform as EpisodePlatform) || "YouTube";
      setPlatform(plat);
      setDescription(seriesToEdit.description || "");
      setCoverUrl(seriesToEdit.posterDataUrl || null);
      setGenres(seriesToEdit.genre || defaultCategories);
      setLanguage(seriesToEdit.language || defaultLanguage);
      setPlatformSwitchError(null);
      setShowMoreOptions(true);

      const eps = seriesToEdit.seasons?.[0]?.episodes || [];
      if (eps.length > 0) {
        setEpisodeRows(
          eps.map((ep, idx) => ({
            id: ep.id || `row-${idx}-${Date.now()}`,
            number: ep.episodeNumber || idx + 1,
            url: ep.externalUrl || "",
            title: ep.title || `Episode ${ep.episodeNumber || idx + 1}`,
          }))
        );
      } else {
        setEpisodeRows([
          { id: "row-1", number: 1, url: "", title: "" },
          { id: "row-2", number: 2, url: "", title: "" },
          { id: "row-3", number: 3, url: "", title: "" },
        ]);
      }
    } else {
      setTitle("");
      setPlatform("YouTube");
      setDescription("");
      setCoverUrl(null);
      setGenres(defaultCategories || "");
      setLanguage(defaultLanguage || "Hindi");
      setPlatformSwitchError(null);
      setShowMoreOptions(false);
      setEpisodeRows([
        { id: "row-1", number: 1, url: "", title: "" },
        { id: "row-2", number: 2, url: "", title: "" },
        { id: "row-3", number: 3, url: "", title: "" },
      ]);
    }
  }, [isOpen, seriesToEdit, defaultLanguage, defaultCategories]);

  // Handle switching series platform (check compatibility if editing)
  const handlePlatformChange = (newPlatform: EpisodePlatform) => {
    if (newPlatform === platform) return;

    if (isEditing && seriesToEdit) {
      const currentEps = seriesToEdit.seasons?.[0]?.episodes || [];
      const check = canSwitchSeriesPlatform(
        currentEps.map((e) => ({ external_url: e.externalUrl, platform: e.platform })),
        newPlatform
      );
      if (!check.canSwitch) {
        setPlatformSwitchError(check.reason || `Remove non-${newPlatform} episodes first`);
        return;
      }
    }

    setPlatformSwitchError(null);
    setPlatform(newPlatform);
  };

  // Auto-fetch title for a URL
  const fetchTitleForUrl = async (rowId: string, url: string, currentNumber: number | string) => {
    const trimmed = url.trim();
    if (!trimmed) return;

    if (titleCacheRef.current[trimmed]) {
      setEpisodeRows((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, title: titleCacheRef.current[trimmed], loadingTitle: false } : r
        )
      );
      return;
    }

    // Abort previous fetch for this row
    if (previewAbortRef.current[rowId]) {
      previewAbortRef.current[rowId].abort();
    }
    const controller = new AbortController();
    previewAbortRef.current[rowId] = controller;

    setEpisodeRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, loadingTitle: true } : r))
    );

    try {
      const res = await fetch(`/api/link-preview?url=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        const fetchedTitle = data.title || `Episode ${currentNumber}`;
        titleCacheRef.current[trimmed] = fetchedTitle;
        setEpisodeRows((prev) =>
          prev.map((r) =>
            r.id === rowId ? { ...r, title: fetchedTitle, loadingTitle: false } : r
          )
        );
      } else {
        const fallback = `Episode ${currentNumber}`;
        setEpisodeRows((prev) =>
          prev.map((r) => (r.id === rowId ? { ...r, title: fallback, loadingTitle: false } : r))
        );
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        const fallback = `Episode ${currentNumber}`;
        setEpisodeRows((prev) =>
          prev.map((r) => (r.id === rowId ? { ...r, title: fallback, loadingTitle: false } : r))
        );
      }
    }
  };

  // Paste shortcut: split multiline pastes into consecutive rows
  const handlePasteLinks = (
    e: React.ClipboardEvent<HTMLInputElement>,
    rowIndex: number
  ) => {
    const pasteText = e.clipboardData.getData("text");
    if (!pasteText.includes("\n")) return; // Let default single-line paste handle

    e.preventDefault();
    const lines = pasteText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    setEpisodeRows((prev) => {
      const updated = [...prev];
      const startNum = Number(updated[rowIndex]?.number) || rowIndex + 1;

      // Fill current row
      updated[rowIndex] = {
        ...updated[rowIndex],
        url: lines[0],
      };
      fetchTitleForUrl(updated[rowIndex].id, lines[0], updated[rowIndex].number);

      // Fill or add subsequent rows
      for (let i = 1; i < lines.length; i++) {
        const nextIdx = rowIndex + i;
        const nextNum = startNum + i;
        const lineUrl = lines[i];

        if (nextIdx < updated.length) {
          updated[nextIdx] = {
            ...updated[nextIdx],
            url: lineUrl,
          };
          fetchTitleForUrl(updated[nextIdx].id, lineUrl, updated[nextIdx].number);
        } else {
          const newRowId = `row_${Date.now()}_${i}`;
          updated.push({
            id: newRowId,
            number: nextNum,
            url: lineUrl,
            title: "",
          });
          fetchTitleForUrl(newRowId, lineUrl, nextNum);
        }
      }

      return updated;
    });
  };

  // Remove a row and auto-resequence remaining numbers
  const handleRemoveRow = (rowIndex: number) => {
    setEpisodeRows((prev) => {
      const remaining = prev.filter((_, idx) => idx !== rowIndex);
      return remaining.map((row, idx) => ({
        ...row,
        number: idx + 1,
      }));
    });
  };

  // Add next episode row
  const handleAddRow = () => {
    setEpisodeRows((prev) => [
      ...prev,
      {
        id: `row_${Date.now()}_${prev.length}`,
        number: prev.length + 1,
        url: "",
        title: "",
      },
    ]);
  };

  // Evaluate validation for each row
  const rowValidations = useMemo(() => {
    return episodeRows.map((row, idx) => {
      let urlError: string | null = null;
      let numberError: string | null = null;

      // Validate number
      const parsedNum = Number(row.number);
      if (!row.number || isNaN(parsedNum) || parsedNum <= 0) {
        numberError = "Episode number must be valid";
      } else {
        const duplicateNumIndex = episodeRows.findIndex(
          (other, oIdx) => oIdx !== idx && Number(other.number) === parsedNum
        );
        if (duplicateNumIndex !== -1) {
          numberError = "Episode number must be unique";
        }
      }

      // Validate URL if filled
      const trimmedUrl = row.url.trim();
      if (trimmedUrl) {
        const check = validateUrlForSeriesPlatform(trimmedUrl, platform);
        if (!check.allowed) {
          urlError = check.reason || `Invalid link for ${platform} series`;
        } else {
          // Check for duplicate links among preceding rows
          const prevDuplicateIndex = episodeRows.findIndex(
            (other, oIdx) =>
              oIdx < idx &&
              other.url.trim() &&
              validateUrlForSeriesPlatform(other.url.trim(), platform).normalizedUrl ===
                check.normalizedUrl
          );
          if (prevDuplicateIndex !== -1) {
            urlError = `This video is already added as Ep ${episodeRows[prevDuplicateIndex].number}`;
          }
        }
      }

      return {
        urlError,
        numberError,
        isFilled: Boolean(trimmedUrl),
        isValid: !urlError && !numberError,
      };
    });
  }, [episodeRows, platform]);

  // Overall form validity
  const hasInvalidFilledRows = useMemo(() => {
    return rowValidations.some((v) => v.isFilled && (!v.isValid || Boolean(v.urlError)));
  }, [rowValidations]);

  const hasDuplicateNumbers = useMemo(() => {
    return rowValidations.some((v) => Boolean(v.numberError));
  }, [rowValidations]);

  const isFormSubmittable = !hasInvalidFilledRows && !hasDuplicateNumbers && title.trim().length > 0;

  // Save changes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      showToast("Please enter a series title.", "error");
      return;
    }

    if (hasInvalidFilledRows || hasDuplicateNumbers) {
      showToast("Please fix the errors in your episode rows before saving.", "error");
      return;
    }

    // Filter out empty rows, sort by number, renumber 1..N
    const filledRows = episodeRows.filter((r) => r.url.trim() !== "");
    const sorted = [...filledRows].sort((a, b) => Number(a.number) - Number(b.number));
    const episodesPayload = sorted.map((r, idx) => ({
      number: idx + 1,
      url: r.url.trim(),
      title: r.title.trim() || `Episode ${idx + 1}`,
    }));

    setSaving(true);

    try {
      if (isEditing && seriesToEdit) {
        await SeriesService.update(seriesToEdit.id, {
          title: cleanTitle,
          description: description.trim(),
          posterDataUrl: coverUrl,
          genre: genres,
          language,
          platform,
          episodes: episodesPayload,
        });

        showToast("Series updated! ✨", "success");
        onSuccess(seriesToEdit.id, false, cleanTitle);
        onClose();
      } else {
        const result = await SeriesService.create({
          title: cleanTitle,
          description: description.trim(),
          posterDataUrl: coverUrl,
          genre: genres,
          language,
          platform,
          episodes: episodesPayload,
        });

        const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
        const seriesSlug = slugifySeriesTitle(cleanTitle);
        const publicUrl = `${origin}/${creatorUsername}/series/${seriesSlug}`;

        showToast(
          "Series created! ✨",
          "success",
          {
            label: "Copy link",
            onClick: async () => {
              await copyToClipboard(publicUrl);
              showToast("Series link copied! ✨", "success");
            },
          },
          6000
        );

        onSuccess(result.seriesId, true, cleanTitle);
        onClose();
      }
    } catch (err: any) {
      console.error("Failed to save series:", err);
      showToast(err.message || "Couldn't save. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const getPlatformPlaceholder = (p: EpisodePlatform) => {
    switch (p) {
      case "YouTube":
        return "Paste YouTube video link";
      case "Instagram":
        return "Paste Instagram Reel or Post link";
      case "Facebook":
        return "Paste Facebook video link";
      case "Mix":
        return "Paste video link (YouTube, Instagram, or Facebook)";
      default:
        return "Paste video link";
    }
  };

  if (!isOpen) return null;

  const isAtLimit = maxEpisodes !== Infinity && episodeRows.length >= maxEpisodes;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!saving) onClose();
      }}
      size="lg"
      title={isEditing ? "Edit Series Details" : "Create New Series"}
      description={isEditing ? "Update your series info and episodes." : "Add a video series with episodes for your audience."}
      icon={<Film className="h-5 w-5" />}
      showCloseButton={!saving}
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <ModalBody className="p-5 sm:p-6 space-y-4 flex-1 min-h-0 overflow-y-auto">
          {/* 1. Series Title */}
          <div>
            <label className="block text-[13px] font-semibold text-[#0f172a] mb-1.5">
              Series Title <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                <Film className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 3 Days Street Food Challenge"
                className="flex-1 min-w-0 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                required
                disabled={saving}
                autoFocus
              />
            </div>
          </div>

          {/* Platform Selector (Segmented 4 options: YouTube · Instagram · Facebook · Mix) */}
          <div>
            <label className="block text-[13px] font-semibold text-[#0f172a] mb-1.5">
              Platform
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-[5px] bg-slate-100 border border-slate-200">
              {(["YouTube", "Instagram", "Facebook", "Mix"] as EpisodePlatform[]).map((p) => {
                const isSelected = platform === p;
                return (
                  <button
                    key={p}
                    type="button"
                    disabled={saving}
                    onClick={() => handlePlatformChange(p)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-[4px] transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white text-[#7A2253] shadow-xs border border-slate-200/60"
                        : "text-[#64748b] hover:text-[#0f172a] hover:bg-white/50"
                    }`}
                  >
                    {p === "YouTube" && <YoutubeIcon className="h-3.5 w-3.5 text-red-500" />}
                    {p === "Instagram" && <InstagramIcon className="h-3.5 w-3.5 text-pink-500" />}
                    {p === "Facebook" && <FacebookIcon className="h-3.5 w-3.5 text-blue-600" />}
                    {p === "Mix" && <span className="text-[10px] font-bold">✨</span>}
                    <span>{p}</span>
                  </button>
                );
              })}
            </div>
            {platformSwitchError && (
              <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{platformSwitchError}</span>
              </p>
            )}
          </div>

          {/* 2. Episodes Section (Separate fields per episode) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[13px] font-semibold text-[#0f172a]">
                Episodes
              </label>
              <span className="text-xs text-[#64748b]">
                {episodeRows.filter((r) => r.url.trim()).length} episode(s) entered
              </span>
            </div>

            <div className="space-y-2.5">
              {episodeRows.map((row, idx) => {
                const validation = rowValidations[idx];

                return (
                  <div
                    key={row.id}
                    className="p-2.5 rounded-[5px] border border-slate-200 bg-slate-50/60 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      {/* Ep No. (64px wide numeric input) */}
                      <div className="w-16 shrink-0">
                        <input
                          type="number"
                          min={1}
                          value={row.number}
                          disabled={saving}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEpisodeRows((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, number: val } : r))
                            );
                          }}
                          className={`w-full rounded-[4px] border bg-white px-2 py-1.5 text-xs text-center font-bold text-[#0f172a] focus:outline-none ${
                            validation.numberError
                              ? "border-rose-400 bg-rose-50/40 focus:border-rose-500"
                              : "border-[#e2e8f0] focus:border-[#7A2253]"
                          }`}
                          placeholder="No."
                          title="Episode number"
                        />
                      </div>

                      {/* Video Link Field */}
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={row.url}
                          disabled={saving}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEpisodeRows((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, url: val } : r))
                            );
                            if (val.trim()) {
                              fetchTitleForUrl(row.id, val, row.number);
                            }
                          }}
                          onPaste={(e) => handlePasteLinks(e, idx)}
                          placeholder={getPlatformPlaceholder(platform)}
                          className={`w-full rounded-[4px] border bg-white px-3 py-1.5 text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none ${
                            validation.urlError
                              ? "border-rose-400 bg-rose-50/40 focus:border-rose-500"
                              : "border-[#e2e8f0] focus:border-[#7A2253]"
                          }`}
                        />
                      </div>

                      {/* Remove Row [ ✕ ] */}
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        disabled={saving || episodeRows.length <= 1}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200/60 disabled:opacity-30 cursor-pointer shrink-0"
                        title="Remove episode row"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Auto-fetched title (small muted text, editable on click) */}
                    {row.url.trim() && !validation.urlError && (
                      <div className="pl-18 flex items-center gap-1.5 text-xs text-[#64748b]">
                        {row.loadingTitle ? (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400 italic">
                            <Loader2 className="h-3 w-3 animate-spin text-[#7A2253]" />
                            <span>Fetching video title...</span>
                          </span>
                        ) : row.isEditingTitle ? (
                          <div className="flex items-center gap-1 w-full max-w-sm">
                            <input
                              type="text"
                              value={row.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEpisodeRows((prev) =>
                                  prev.map((r, i) => (i === idx ? { ...r, title: val } : r))
                                );
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === "Escape") {
                                  e.preventDefault();
                                  setEpisodeRows((prev) =>
                                    prev.map((r, i) =>
                                      i === idx ? { ...r, isEditingTitle: false } : r
                                    )
                                  );
                                }
                              }}
                              className="flex-1 rounded-[3px] border border-[#7A2253] bg-white px-1.5 py-0.5 text-xs font-medium text-[#0f172a] focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setEpisodeRows((prev) =>
                                  prev.map((r, i) =>
                                    i === idx ? { ...r, isEditingTitle: false } : r
                                  )
                                );
                              }}
                              className="p-0.5 text-[#7A2253] hover:bg-slate-100 rounded cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => {
                              setEpisodeRows((prev) =>
                                prev.map((r, i) =>
                                  i === idx
                                    ? {
                                        ...r,
                                        isEditingTitle: true,
                                        title: r.title || `Episode ${r.number}`,
                                      }
                                    : r
                                )
                              );
                            }}
                            className="truncate cursor-pointer hover:text-[#7A2253] hover:underline flex items-center gap-1 text-[11px]"
                            title="Click to edit title"
                          >
                            <span className="font-semibold text-slate-700">
                              {row.title || `Episode ${row.number}`}
                            </span>
                            <Pencil className="h-2.5 w-2.5 opacity-60 shrink-0" />
                          </span>
                        )}
                      </div>
                    )}

                    {/* Inline Validation Errors */}
                    {(validation.urlError || validation.numberError) && (
                      <div className="pl-18 space-y-0.5">
                        {validation.numberError && (
                          <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span>{validation.numberError}</span>
                          </p>
                        )}
                        {validation.urlError && (
                          <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span>{validation.urlError}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* + Add episode button or Limit message */}
            <div className="pt-2">
              {isAtLimit ? (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-[5px] font-medium">
                  {maxEpisodes}/{maxEpisodes} episodes · Upgrade for more
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleAddRow}
                  disabled={saving}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#7A2253] hover:text-[#601a41] hover:underline cursor-pointer py-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Add episode</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Collapsed "More options" Section */}
          <div className="border-t border-slate-200 pt-3">
            <button
              type="button"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className="flex w-full items-center justify-between text-xs font-bold text-[#475569] hover:text-[#0f172a] cursor-pointer py-1"
            >
              <span>More options (Cover, Description, Genres, Language)</span>
              {showMoreOptions ? (
                <ChevronUp className="h-4 w-4 text-[#94a3b8]" />
              ) : (
                <ChevronDown className="h-4 w-4 text-[#94a3b8]" />
              )}
            </button>

            {showMoreOptions && (
              <div className="mt-3 space-y-4 pt-1">
                {/* Series Cover Upload */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#0f172a] mb-1.5">
                    Cover Image (Optional 16:9)
                  </label>
                  <SeriesCoverUpload
                    value={coverUrl}
                    onChange={(url) => setCoverUrl(url)}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#0f172a] mb-1.5">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description of this series..."
                    rows={2}
                    disabled={saving}
                    className="w-full rounded-[5px] border border-[#e2e8f0] bg-white px-3 py-2 text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7A2253] focus:outline-none focus:ring-1 focus:ring-[#7A2253]/20 resize-none"
                  />
                </div>

                {/* Genres (Max 3, 12 popular chips + search) */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#0f172a] mb-1.5">
                    Genres (Max 3)
                  </label>
                  <GenreMultiSelect
                    value={genres}
                    onChange={(val) => setGenres(val)}
                  />
                </div>

                {/* Language */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#0f172a] mb-1.5">
                    Language
                  </label>
                  <LanguageSelect
                    value={language}
                    onChange={(val) => setLanguage(val)}
                  />
                </div>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter className="flex items-center justify-between border-t border-[#e2e8f0] px-5 sm:px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-10 px-5 rounded-[5px] border border-[#e2e8f0] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {!isFormSubmittable && (
              <span className="text-[11px] text-rose-500 font-medium">
                {hasDuplicateNumbers
                  ? "Episode numbers must be unique"
                  : hasInvalidFilledRows
                  ? "Fix invalid episode links"
                  : "Enter a series title"}
              </span>
            )}
            <button
              type="submit"
              disabled={saving || !isFormSubmittable}
              className="h-10 inline-flex items-center gap-1.5 rounded-[5px] bg-[#7A2253] px-5 text-xs font-semibold text-white shadow-md shadow-[#7A2253]/20 hover:opacity-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? "Save Changes" : "Create series"}</span>
              )}
            </button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
}
