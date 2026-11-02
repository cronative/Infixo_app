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
import { ConfirmModal } from "@/components/ui/ConfirmModal";
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
  normalizeVideoUrl,
} from "@/lib/videoUrl";
import { copyToClipboard } from "@/lib/copyToClipboard";

export interface EpisodeFormRow {
  id: string;
  number: number | string;
  url: string;
  title: string;
  loadingTitle?: boolean;
}

function isRowCompletelyEmpty(row: EpisodeFormRow, defaultPos: number): boolean {
  const noUrl = !row.url || !row.url.trim();
  const noTitle = !row.title || !row.title.trim();
  const noNumber =
    row.number === "" ||
    row.number === null ||
    row.number === undefined ||
    Number(row.number) === defaultPos;
  return noUrl && noTitle && noNumber;
}

interface SeriesUpsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  seriesToEdit?: Series | null;
  creatorUsername?: string;
  defaultLanguage?: string;
  defaultCategories?: string;
  maxEpisodes?: number;
  onSuccess: (newOrUpdatedSeriesId: string, isNew: boolean, seriesTitle: string, createdSeries?: Series) => void;
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
  const [platform, setPlatform] = useState<EpisodePlatform | "">("");
  const [episodeRows, setEpisodeRows] = useState<EpisodeFormRow[]>([
    { id: "row-1", number: 1, url: "", title: "" },
    { id: "row-2", number: 2, url: "", title: "" },
    { id: "row-3", number: 3, url: "", title: "" },
  ]);
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [genres, setGenres] = useState("");
  const [language, setLanguage] = useState(defaultLanguage);
  const [saving, setSaving] = useState(false);
  const [platformSwitchError, setPlatformSwitchError] = useState<string | null>(null);
  const [platformConfirmTarget, setPlatformConfirmTarget] = useState<EpisodePlatform | null>(null);

  // Field touched & submit state for inline validation
  const [titleTouched, setTitleTouched] = useState(false);
  const [touchedRows, setTouchedRows] = useState<
    Record<string, { number?: boolean; title?: boolean; url?: boolean }>
  >({});
  const [submitted, setSubmitted] = useState(false);

  const titleCacheRef = useRef<Record<string, string>>({});
  const previewAbortRef = useRef<Record<string, AbortController>>({});

  // Initialize form when opening or editing
  useEffect(() => {
    if (!isOpen) return;

    setTitleTouched(false);
    setTouchedRows({});
    setSubmitted(false);

    if (seriesToEdit) {
      setTitle(seriesToEdit.title || "");
      const plat = (seriesToEdit.platform as EpisodePlatform) || "YouTube";
      setPlatform(plat);
      setDescription(seriesToEdit.description || "");
      setCoverUrl(seriesToEdit.posterDataUrl || null);
      setGenres(seriesToEdit.genre || "");
      setLanguage(seriesToEdit.language || defaultLanguage);
      setPlatformSwitchError(null);

      const eps = seriesToEdit.seasons?.[0]?.episodes || [];
      if (eps.length > 0) {
        setEpisodeRows(
          eps.map((ep, idx) => ({
            id: ep.id || `row-${idx}-${Date.now()}`,
            number: idx + 1,
            url: ep.externalUrl || "",
            title: ep.title || `Episode ${idx + 1}`,
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
      setPlatform("");
      setDescription("");
      setCoverUrl(null);
      setGenres("");
      setLanguage(defaultLanguage || "Hindi");
      setPlatformSwitchError(null);
      setEpisodeRows([
        { id: "row-1", number: 1, url: "", title: "" },
        { id: "row-2", number: 2, url: "", title: "" },
        { id: "row-3", number: 3, url: "", title: "" },
      ]);
    }
  }, [isOpen, seriesToEdit, defaultLanguage, defaultCategories]);

  // Handle switching series platform (check compatibility if existing episodes have links)
  const handlePlatformChange = (newPlatform: EpisodePlatform) => {
    if (newPlatform === platform) return;

    const episodesWithLinks = episodeRows.filter((r) => r.url && r.url.trim());
    if (episodesWithLinks.length > 0) {
      const nonMatching = episodesWithLinks.some((r) => {
        const check = validateUrlForSeriesPlatform(r.url.trim(), newPlatform);
        return !check.allowed;
      });

      if (nonMatching) {
        setPlatformConfirmTarget(newPlatform);
        return;
      }
    }

    setPlatformSwitchError(null);
    setPlatform(newPlatform);
  };

  const confirmPlatformSwitch = () => {
    if (!platformConfirmTarget) return;
    const target = platformConfirmTarget;
    // Remove non-matching episode links
    setEpisodeRows((prev) =>
      prev.map((r) => {
        if (!r.url || !r.url.trim()) return r;
        const check = validateUrlForSeriesPlatform(r.url.trim(), target);
        if (!check.allowed) {
          return { ...r, url: "", title: "" };
        }
        return r;
      })
    );
    setPlatform(target);
    setPlatformSwitchError(null);
    setPlatformConfirmTarget(null);
  };

  // URL input/paste handler with official oEmbed for YouTube & default "Episode {n}" for IG/FB
  const handleUrlChangeOrPaste = async (rowId: string, rawVal: string, rowIndex: number) => {
    const cleanUrl = normalizeVideoUrl(rawVal.trim());
    const currentNumber = episodeRows[rowIndex]?.number || rowIndex + 1;

    setEpisodeRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, url: cleanUrl } : r))
    );

    if (!cleanUrl) return;

    const check = validateUrlForSeriesPlatform(cleanUrl, platform);
    if (!check.allowed) return;

    if (check.detectedPlatform === "YouTube") {
      if (titleCacheRef.current[cleanUrl]) {
        const cached = titleCacheRef.current[cleanUrl];
        setEpisodeRows((prev) =>
          prev.map((r) => {
            if (r.id !== rowId) return r;
            if (!r.title.trim() || /^Episode\s*\d*$/i.test(r.title.trim())) {
              return { ...r, title: cached.slice(0, 100) };
            }
            return r;
          })
        );
        return;
      }

      if (previewAbortRef.current[rowId]) {
        previewAbortRef.current[rowId].abort();
      }
      const controller = new AbortController();
      previewAbortRef.current[rowId] = controller;

      setEpisodeRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, loadingTitle: true } : r))
      );

      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(cleanUrl)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          const fetchedTitle = data.title || `Episode ${currentNumber}`;
          titleCacheRef.current[cleanUrl] = fetchedTitle;
          setEpisodeRows((prev) =>
            prev.map((r) => {
              if (r.id !== rowId) return r;
              if (!r.title.trim() || /^Episode\s*\d*$/i.test(r.title.trim())) {
                return { ...r, title: fetchedTitle.slice(0, 100), loadingTitle: false };
              }
              return { ...r, loadingTitle: false };
            })
          );
        } else {
          setEpisodeRows((prev) =>
            prev.map((r) => (r.id === rowId ? { ...r, loadingTitle: false } : r))
          );
        }
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setEpisodeRows((prev) =>
            prev.map((r) => (r.id === rowId ? { ...r, loadingTitle: false } : r))
          );
        }
      }
    } else if (check.detectedPlatform === "Instagram" || check.detectedPlatform === "Facebook") {
      setEpisodeRows((prev) =>
        prev.map((r) => {
          if (r.id !== rowId) return r;
          if (!r.title.trim() || /^Episode\s*\d*$/i.test(r.title.trim())) {
            return { ...r, title: `Episode ${currentNumber}` };
          }
          return r;
        })
      );
    }
  };

  // Paste shortcut: split multiline pastes into consecutive cards
  const handlePasteLinks = (
    e: React.ClipboardEvent<HTMLInputElement>,
    rowIndex: number
  ) => {
    const pasteText = e.clipboardData.getData("text");
    if (!pasteText.includes("\n")) {
      // Single line paste: strip tracking params immediately
      e.preventDefault();
      const stripped = normalizeVideoUrl(pasteText.trim());
      handleUrlChangeOrPaste(episodeRows[rowIndex].id, stripped, rowIndex);
      setTouchedRows((prev) => ({
        ...prev,
        [episodeRows[rowIndex].id]: { ...prev[episodeRows[rowIndex].id], url: true },
      }));
      return;
    }

    e.preventDefault();
    const lines = pasteText
      .split("\n")
      .map((l) => normalizeVideoUrl(l.trim()))
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
      handleUrlChangeOrPaste(updated[rowIndex].id, lines[0], rowIndex);

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
          handleUrlChangeOrPaste(updated[nextIdx].id, lineUrl, nextIdx);
        } else {
          const newRowId = `row_${Date.now()}_${i}`;
          updated.push({
            id: newRowId,
            number: nextNum,
            url: lineUrl,
            title: "",
          });
          handleUrlChangeOrPaste(newRowId, lineUrl, nextIdx);
        }
      }

      return updated;
    });
  };

  // Remove a card
  const handleRemoveRow = (rowIndex: number) => {
    setEpisodeRows((prev) => {
      const remaining = prev.filter((_, idx) => idx !== rowIndex);
      return remaining.map((row, idx) => ({
        ...row,
        number: idx + 1,
      }));
    });
  };

  // Add next episode card
  const handleAddRow = () => {
    if (maxEpisodes !== Infinity && episodeRows.length >= maxEpisodes) {
      showToast(`Max ${maxEpisodes} episodes on your plan`, "info");
      return;
    }
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

  // Row validations
  const rowValidations = useMemo(() => {
    return episodeRows.map((row, idx) => {
      const isEmpty = isRowCompletelyEmpty(row, idx + 1);
      if (isEmpty) {
        return {
          isEmpty: true,
          numberError: null,
          titleError: null,
          urlError: null,
          isValid: true,
        };
      }

      let numberError: string | null = null;
      let titleError: string | null = null;
      let urlError: string | null = null;

      // 1. Episode No. (required, whole number >= 1, unique in series)
      if (row.number === "" || row.number === null || row.number === undefined) {
        numberError = "Episode number is required.";
      } else {
        const parsedNum = Number(row.number);
        if (isNaN(parsedNum) || !Number.isInteger(parsedNum) || parsedNum < 1) {
          numberError = "Episode number must be a whole number ≥ 1.";
        } else {
          const dupIdx = episodeRows.findIndex(
            (other, oIdx) =>
              oIdx !== idx &&
              !isRowCompletelyEmpty(other, oIdx + 1) &&
              Number(other.number) === parsedNum
          );
          if (dupIdx !== -1) {
            numberError = "Episode number already used.";
          }
        }
      }

      // 2. Title (text, required, max 100)
      const trimmedTitle = (row.title || "").trim();
      if (!trimmedTitle) {
        titleError = "Title is required.";
      } else if (trimmedTitle.length > 100) {
        titleError = "Title must be 100 characters or less.";
      }

      // 3. Video link (url, required, must match series platform)
      const trimmedUrl = (row.url || "").trim();
      if (!trimmedUrl) {
        urlError = "Video link is required.";
      } else {
        const check = validateUrlForSeriesPlatform(trimmedUrl, platform);
        if (!check.allowed) {
          urlError = check.reason || `Only ${platform} links are allowed in a ${platform} series.`;
        } else {
          // Duplicate check inside same series
          const norm = normalizeVideoUrl(trimmedUrl).toLowerCase();
          const dupUrlIdx = episodeRows.findIndex(
            (other, oIdx) =>
              oIdx !== idx &&
              !isRowCompletelyEmpty(other, oIdx + 1) &&
              other.url &&
              normalizeVideoUrl(other.url.trim()).toLowerCase() === norm
          );
          if (dupUrlIdx !== -1) {
            urlError = "This video is already in this series.";
          }
        }
      }

      return {
        isEmpty: false,
        numberError,
        titleError,
        urlError,
        isValid: !numberError && !titleError && !urlError,
      };
    });
  }, [episodeRows, platform]);

  const seriesTitleError = !title.trim()
    ? "Series title is required."
    : title.trim().length > 80
    ? "Series title must be 80 characters or less."
    : null;

  const nonEmptyRows = rowValidations.filter((v) => !v.isEmpty);
  const hasAnyRowError = nonEmptyRows.some((v) => !v.isValid);
  const hasValidEpisodes = nonEmptyRows.length > 0 && !hasAnyRowError;

  const isFormSubmittable = !seriesTitleError && Boolean(platform) && hasValidEpisodes;

  // Save changes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!isFormSubmittable) {
      setTimeout(() => {
        const firstErrorEl = document.querySelector(".has-series-error");
        if (firstErrorEl) {
          firstErrorEl.scrollIntoView({ behavior: "smooth", block: "center" });
          if ("focus" in firstErrorEl) {
            (firstErrorEl as HTMLElement).focus();
          }
        }
      }, 50);

      if (seriesTitleError) {
        showToast(seriesTitleError, "error");
      } else if (nonEmptyRows.length === 0) {
        showToast("At least 1 episode is required.", "error");
      } else {
        showToast("Please fix the errors in your episode cards before saving.", "error");
      }
      return;
    }

    // Filter out empty rows, sort by number, strip tracking params, auto-renumber
    const validRows = episodeRows.filter((r, idx) => !isRowCompletelyEmpty(r, idx + 1));
    const sorted = [...validRows].sort((a, b) => Number(a.number) - Number(b.number));
    const episodesPayload = sorted.map((r, idx) => {
      const cleanUrl = normalizeVideoUrl(r.url.trim());
      const check = validateUrlForSeriesPlatform(cleanUrl, platform || "Mix");
      const epPlatform = check.detectedPlatform || (platform === "Mix" ? "YouTube" : platform);
      return {
        number: idx + 1,
        url: cleanUrl,
        title: r.title.trim() || `Episode ${idx + 1}`,
        platform: epPlatform,
      };
    });

    const cleanTitle = title.trim();
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

        onSuccess(result.seriesId, true, cleanTitle, result.series);
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
    <>
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
          {/* 1. Cover Image (Optional 16:9) */}
          <div>
            <label className="block text-[13px] font-semibold text-[#0f172a] mb-1.5">
              Cover Image <span className="text-[#94a3b8] font-normal">(Optional 16:9)</span>
            </label>
            <SeriesCoverUpload
              value={coverUrl}
              onChange={(url) => setCoverUrl(url)}
            />
          </div>

          {/* 2. Series Title (required, max 80) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[13px] font-semibold text-[#0f172a]">
                Series Title <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-[#94a3b8] tabular-nums">
                {title.length}/80
              </span>
            </div>
            <div
              className={`flex items-center rounded-[5px] border ${
                (titleTouched || submitted) && seriesTitleError
                  ? "border-rose-500 bg-rose-50/20 focus-within:border-rose-600 has-series-error"
                  : "border-[#e2e8f0] focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10"
              } bg-white overflow-hidden transition-colors`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                <Film className="h-4 w-4" />
              </span>
              <input
                type="text"
                maxLength={80}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setTitleTouched(true)}
                placeholder="e.g. 3 Days Street Food Challenge"
                className="flex-1 min-w-0 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                disabled={saving}
                autoFocus
              />
            </div>
            {(titleTouched || submitted) && seriesTitleError && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{seriesTitleError}</p>
            )}
          </div>

          {/* 3. Short description (max 160) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[13px] font-semibold text-[#0f172a]">
                Short Description <span className="text-[#94a3b8] font-normal">(Optional)</span>
              </label>
              <span className="text-[11px] text-[#94a3b8] tabular-nums">
                {description.length}/160
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 160))}
              placeholder="Short description of this series..."
              rows={2}
              maxLength={160}
              disabled={saving}
              className="w-full rounded-[5px] border border-[#e2e8f0] bg-white px-3 py-2 text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7A2253] focus:outline-none focus:ring-1 focus:ring-[#7A2253]/20 resize-none"
            />
          </div>

          {/* 4. Genres (1-3, none preselected) & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-[#0f172a] mb-1.5">
                Genres <span className="text-[#94a3b8] font-normal">(Max 3)</span>
              </label>
              <GenreMultiSelect
                value={genres}
                onChange={(val) => setGenres(val)}
              />
            </div>
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

          {/* 5. Platform Selector (Segmented 4 options: YouTube · Instagram · Facebook · Mix) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[13px] font-semibold text-[#0f172a]">
                Platform <span className="text-rose-500">*</span>
              </label>
              {!platform && (
                <span className="text-[11px] text-amber-600 font-medium">Select a platform first</span>
              )}
            </div>
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

          {/* 6. Episodes Section (Disabled until a platform is selected) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[13px] font-semibold text-[#0f172a]">
                Episodes
              </label>
              {platform && (
                <span className="text-xs text-[#64748b]">
                  {episodeRows.filter((r, i) => !isRowCompletelyEmpty(r, i + 1)).length} episode(s) entered
                </span>
              )}
            </div>

            {!platform ? (
              <div className="rounded-[5px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs font-medium text-slate-500">
                Select a platform first to add episodes.
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {episodeRows.map((row, idx) => {
                    const validation = rowValidations[idx];
                    const touched = touchedRows[row.id] || {};
                    const showNumberErr = (touched.number || submitted) && validation.numberError;
                    const showTitleErr = (touched.title || submitted) && validation.titleError;
                    const showUrlErr = (touched.url || submitted) && validation.urlError;

                    return (
                      <div
                        key={row.id}
                        className="relative p-3.5 sm:p-4 rounded-[5px] border border-slate-200 bg-white space-y-3 transition-colors shadow-xs text-left"
                      >
                        {/* Card Top: Episode label + delete (x) button top-right */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#18181B]">
                            Episode {idx + 1}
                          </span>
                          {episodeRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              disabled={saving}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Remove episode"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {/* 1. Episode No. (auto-assigned, default = position) */}
                        <div>
                          <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                            Episode No.
                          </label>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={idx + 1}
                            disabled
                            readOnly
                            className="w-full rounded-[4px] border border-[#e2e8f0] bg-slate-50 px-3 py-1.5 text-xs text-[#0f172a] focus:outline-none cursor-not-allowed"
                          />
                        </div>

                        {/* 2. Title (text, required, max 100) */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-[#0f172a]">
                              Title <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[11px] text-[#94a3b8] tabular-nums">
                              {(row.title || "").length}/100
                            </span>
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              maxLength={100}
                              value={row.title}
                              disabled={saving}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEpisodeRows((prev) =>
                                  prev.map((r, i) => (i === idx ? { ...r, title: val } : r))
                                );
                              }}
                              onBlur={() => {
                                setTouchedRows((prev) => ({
                                  ...prev,
                                  [row.id]: { ...prev[row.id], title: true },
                                }));
                              }}
                              placeholder={platform === "YouTube" ? "e.g. Episode Title" : `Episode ${idx + 1}`}
                              className={`w-full rounded-[4px] border bg-white px-3 py-1.5 text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none transition-colors ${
                                showTitleErr
                                  ? "border-rose-500 bg-rose-50/20 focus:border-rose-600 has-series-error"
                                  : "border-[#e2e8f0] focus:border-[#7A2253]"
                              }`}
                            />
                            {row.loadingTitle && (
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-[#7A2253]">
                                <Loader2 className="h-3 w-3 animate-spin" />
                              </span>
                            )}
                          </div>
                          {showTitleErr && (
                            <p className="mt-1 text-xs text-rose-500 font-medium">{validation.titleError}</p>
                          )}
                        </div>

                        {/* 3. Video link (url, required) */}
                        <div>
                          <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                            Video link <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="url"
                            value={row.url}
                            disabled={saving}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEpisodeRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, url: val } : r))
                              );
                            }}
                            onPaste={(e) => handlePasteLinks(e, idx)}
                            onBlur={() => {
                              setTouchedRows((prev) => ({
                                ...prev,
                                [row.id]: { ...prev[row.id], url: true },
                              }));
                              if (row.url.trim()) {
                                handleUrlChangeOrPaste(row.id, row.url, idx);
                              }
                            }}
                            placeholder={getPlatformPlaceholder(platform)}
                            className={`w-full rounded-[4px] border bg-white px-3 py-1.5 text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none transition-colors ${
                              showUrlErr
                                ? "border-rose-500 bg-rose-50/20 focus:border-rose-600 has-series-error"
                                : "border-[#e2e8f0] focus:border-[#7A2253]"
                            }`}
                          />
                          {showUrlErr && (
                            <p className="mt-1 text-xs text-rose-500 font-medium">{validation.urlError}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* + Add episode button below last card OR plan limit */}
                <div className="pt-2">
                  {isAtLimit ? (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-[5px] font-medium">
                      Max {maxEpisodes} episodes on your plan
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
              </>
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
            {!isFormSubmittable && submitted && (
              <span className="text-[11px] text-rose-500 font-medium">
                {seriesTitleError ||
                  (nonEmptyRows.length === 0
                    ? "At least 1 episode is required"
                    : "Fix errors above")}
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

    <ConfirmModal
      isOpen={Boolean(platformConfirmTarget)}
      onClose={() => setPlatformConfirmTarget(null)}
      onConfirm={confirmPlatformSwitch}
      title={`Switch platform to ${platformConfirmTarget}?`}
      description={`Changing the series platform to ${platformConfirmTarget} will remove any episode links that don't match ${platformConfirmTarget}.`}
      confirmText="Yes, switch platform"
      cancelText="Cancel"
      isDestructive={true}
    />
  </>
  );
}
