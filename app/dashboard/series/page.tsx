"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Film,
  ExternalLink,
  Check,
  Share2,
  Search,
  MoreVertical,
  Play,
  Globe,
  GripVertical,
  Loader2,
  AlertCircle,
  Undo2,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { SeriesService, SeriesApiResponse } from "@/services/SeriesService";
import { Episode, EpisodePlatform, Series } from "@/types";
import { YoutubeIcon, InstagramIcon, FacebookIcon, XTwitterIcon } from "@/components/shared/BrandIcons";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LimitReachedModal } from "@/components/ui/LimitReachedModal";
import { SeriesSharePopover } from "@/components/series/SeriesSharePopover";
import { SeriesRowActionMenu } from "@/components/series/SeriesRowActionMenu";
import { SeriesUpsertModal } from "@/components/series/SeriesUpsertModal";
import { EpisodeEditModal } from "@/components/series/EpisodeEditModal";
import { SeriesCsvImportModal } from "@/components/series/SeriesCsvImportModal";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PAGE_COPY } from "@/components/dashboard/pageCopy";
import { PhonePreview } from "@/components/dashboard/PhonePreview";
import { slugifySeriesTitle, validateVideoUrl, validateUrlForSeriesPlatform } from "@/lib/videoUrl";
import { OverLimitBadge } from "@/components/ui/OverLimitBadge";
import { getPlanQuota } from "@/services/subscriptionLimits";
import { SeriesCoverLogo } from "@/components/series/SeriesCoverLogo";

function formatEpisodeNumber(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

export default function MySeriesPage() {
  const { profile, subscription } = useCreator();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [planData, setPlanData] = useState<{
    plan: string;
    planKey: string;
    limits: { series: number; episodesPerSeries: number };
    used: { series: number; episodes: number };
  }>({
    plan: "Starter",
    planKey: "starter",
    limits: { series: 3, episodesPerSeries: 5 },
    used: { series: 0, episodes: 0 },
  });

  // UI state
  const [expandedSeriesIds, setExpandedSeriesIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [upsertModalOpen, setUpsertModalOpen] = useState(false);
  const [seriesToEdit, setSeriesToEdit] = useState<Series | null>(null);

  const [episodeEditModalOpen, setEpisodeEditModalOpen] = useState(false);
  const [episodeToEdit, setEpisodeToEdit] = useState<{ episode: Episode; seriesId: string } | null>(null);

  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvSeriesId, setCsvSeriesId] = useState<string | undefined>(undefined);

  const [seriesToDelete, setSeriesToDelete] = useState<Series | null>(null);
  const [deletingSeries, setDeletingSeries] = useState(false);
  const [episodeToDelete, setEpisodeToDelete] = useState<{ seriesId: string; episode: Episode } | null>(null);
  const [deletingEpisode, setDeletingEpisode] = useState(false);

  const [limitModalOpen, setLimitModalOpen] = useState(false);

  // Active popovers (Share & Action Menu)
  const [activeShareId, setActiveShareId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Inline episode quick-add inputs per series
  const [inlineInputs, setInlineInputs] = useState<Record<string, string>>({});
  const [addingInline, setAddingInline] = useState<Record<string, boolean>>({});

  // Inline episode title editing
  const [inlineEditingEpId, setInlineEditingEpId] = useState<string | null>(null);
  const [inlineTitleValue, setInlineTitleValue] = useState("");

  // Inline episode number editing (reordering via number edit)
  const [inlineEditingEpNumberId, setInlineEditingEpNumberId] = useState<string | null>(null);
  const [inlineNumberValue, setInlineNumberValue] = useState<number | string>("");

  // Undo delete tracker for episodes
  const pendingDeletesRef = useRef<Map<string, { timer: NodeJS.Timeout; backup: Episode; seriesId: string }>>(new Map());

  // Drag-and-drop state for series only (episodes are ordered by number)
  const [draggedSeriesIndex, setDraggedSeriesIndex] = useState<number | null>(null);
  const [failedCovers, setFailedCovers] = useState<Set<string>>(new Set());

  // Load series data EXACTLY ONCE on mount
  useEffect(() => {
    let mounted = true;
    SeriesService.fetchFromDb()
      .then((res: SeriesApiResponse) => {
        if (!mounted) return;
        setSeriesList(res.series);
        if (res.plan) {
          setPlanData({
            plan: res.plan,
            planKey: res.planKey || "starter",
            limits: res.limits || { series: 3, episodesPerSeries: 5 },
            used: res.used || { series: res.series.length, episodes: 0 },
          });
        }
        // Expand the first series by default if available
        if (res.series.length > 0) {
          setExpandedSeriesIds(new Set([res.series[0].id]));
        }
      })
      .catch((err) => {
        console.error("Failed to load series:", err);
        showToast("Failed to load series. Please refresh.", "error");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [showToast]);

  const handleOpenCreateSeries = () => {
    if (seriesList.length >= planData.limits.series) {
      setLimitModalOpen(true);
      return;
    }
    setSeriesToEdit(null);
    setUpsertModalOpen(true);
  };

  // C6: Keyboard shortcut 'N' for New Series & paste video link anywhere
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        (activeEl as HTMLElement)?.isContentEditable;

      if (isInput) return;

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        handleOpenCreateSeries();
      }
    }

    function handlePaste(e: ClipboardEvent) {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        (activeEl as HTMLElement)?.isContentEditable;

      if (isInput) return;

      const pasted = e.clipboardData?.getData("text");
      if (pasted) {
        const val = validateVideoUrl(pasted);
        if (val.isValid) {
          e.preventDefault();
          handleOpenCreateSeries();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("paste", handlePaste);
    };
  }, [seriesList, planData]);

  const handleOpenEditSeries = (series: Series) => {
    setSeriesToEdit(series);
    setUpsertModalOpen(true);
  };

  const handleToggleExpand = (id: string) => {
    setExpandedSeriesIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Optimistic series creation / edit callback
  const handleSeriesUpsertSuccess = (seriesId: string, isNew: boolean, seriesTitle: string) => {
    // Re-fetch or update list optimistically
    SeriesService.fetchFromDb().then((res) => {
      setSeriesList(res.series);
      setPlanData((prev) => ({
        ...prev,
        used: { ...prev.used, series: res.series.length },
      }));
      if (isNew) {
        setExpandedSeriesIds((prev) => new Set([seriesId, ...Array.from(prev)]));
      }
    });
  };

  // Delete Series
  const handleConfirmDeleteSeries = async () => {
    if (!seriesToDelete) return;
    setDeletingSeries(true);

    const targetId = seriesToDelete.id;
    // Optimistic UI removal
    const previous = [...seriesList];
    setSeriesList((prev) => prev.filter((s) => s.id !== targetId));

    try {
      await SeriesService.remove(targetId);
      showToast("Series deleted.", "success");
      setSeriesToDelete(null);
    } catch (err: any) {
      // Rollback
      setSeriesList(previous);
      showToast(err.message || "Couldn't delete series. Please try again.", "error");
    } finally {
      setDeletingSeries(false);
    }
  };

  // Delete Episode with Confirmation
  const handleConfirmDeleteEpisode = async () => {
    if (!episodeToDelete || deletingEpisode) return;
    setDeletingEpisode(true);
    const { seriesId, episode } = episodeToDelete;
    const episodeId = episode.id;

    // Optimistically remove from state
    const previous = [...seriesList];
    setSeriesList((prev) =>
      prev.map((s) => {
        if (s.id !== seriesId) return s;
        const eps = s.seasons?.[0]?.episodes || [];
        const filtered = eps.filter((e) => e.id !== episodeId);
        return {
          ...s,
          seasons: [{ ...s.seasons[0], episodes: filtered }],
        };
      })
    );

    try {
      await SeriesService.removeEpisode(episodeId);
      showToast(`Episode "${episode.title}" deleted.`, "success");
      setEpisodeToDelete(null);
    } catch (err: any) {
      setSeriesList(previous);
      showToast(err.message || "Couldn't delete episode. Please try again.", "error");
    } finally {
      setDeletingEpisode(false);
    }
  };

  // Inline Quick Add Episode (Paste link & press Enter)
  const handleInlineQuickAdd = async (seriesId: string) => {
    const text = (inlineInputs[seriesId] || "").trim();
    if (!text) return;

    const urls = text
      .split(/\s+/)
      .map((u) => u.trim())
      .filter(Boolean);

    const targetSeries = seriesList.find((s) => s.id === seriesId);
    const seriesPlat = targetSeries?.platform || "YouTube";

    for (let i = 0; i < urls.length; i++) {
      const check = validateUrlForSeriesPlatform(urls[i], seriesPlat);
      if (!check.allowed) {
        showToast(check.reason || `Invalid link for ${seriesPlat} series.`, "error");
        return;
      }
    }

    setAddingInline((prev) => ({ ...prev, [seriesId]: true }));

    try {
      const addedEpisodes = await SeriesService.bulkAddEpisodes(
        seriesId,
        urls.map((u) => ({ url: u }))
      );

      // Optimistically append episodes
      setSeriesList((prev) =>
        prev.map((s) => {
          if (s.id !== seriesId) return s;
          const currentEps = s.seasons?.[0]?.episodes || [];
          return {
            ...s,
            seasons: [{ ...s.seasons[0], episodes: [...currentEps, ...addedEpisodes] }],
          };
        })
      );

      setInlineInputs((prev) => ({ ...prev, [seriesId]: "" }));
      showToast(`Added ${addedEpisodes.length} episode(s)! ✨`, "success");
    } catch (err: any) {
      showToast(err.message || "Couldn't add episodes. Please check the links.", "error");
    } finally {
      setAddingInline((prev) => ({ ...prev, [seriesId]: false }));
    }
  };

  // Inline Title Edit save
  const handleSaveInlineTitle = async (episodeId: string, seriesId: string) => {
    const cleanTitle = inlineTitleValue.trim();
    if (!cleanTitle) {
      setInlineEditingEpId(null);
      return;
    }

    // Optimistic UI update
    setSeriesList((prev) =>
      prev.map((s) => {
        if (s.id !== seriesId) return s;
        const eps = (s.seasons?.[0]?.episodes || []).map((e) =>
          e.id === episodeId ? { ...e, title: cleanTitle } : e
        );
        return {
          ...s,
          seasons: [{ ...s.seasons[0], episodes: eps }],
        };
      })
    );
    setInlineEditingEpId(null);

    try {
      await SeriesService.updateEpisode(episodeId, { title: cleanTitle });
      showToast("Title updated! ✨", "success");
    } catch (err: any) {
      showToast(err.message || "Couldn't save title.", "error");
    }
  };

  // Series Reorder (Drag & Drop)
  const handleSeriesDragStart = (index: number) => {
    setDraggedSeriesIndex(index);
  };

  const handleSeriesDrop = async (targetIndex: number) => {
    if (draggedSeriesIndex === null || draggedSeriesIndex === targetIndex) return;

    const copy = [...seriesList];
    const [moved] = copy.splice(draggedSeriesIndex, 1);
    copy.splice(targetIndex, 0, moved);

    setSeriesList(copy);
    setDraggedSeriesIndex(null);

    try {
      await SeriesService.reorderSeries(copy.map((s) => s.id));
    } catch (err: any) {
      showToast("Couldn't save series order.", "error");
    }
  };

  // Episode Reorder (Decided by Episode Number)
  const handleSaveInlineNumber = async (episodeId: string, seriesId: string) => {
    setInlineEditingEpNumberId(null);
    const series = seriesList.find((s) => s.id === seriesId);
    if (!series) return;

    const episodes = [...(series.seasons?.[0]?.episodes || [])];
    const currIndex = episodes.findIndex((e) => e.id === episodeId);
    if (currIndex === -1) return;

    const targetNum = parseInt(String(inlineNumberValue), 10);
    if (isNaN(targetNum) || targetNum < 1) return;

    const targetIndex = Math.min(Math.max(0, targetNum - 1), episodes.length - 1);
    if (targetIndex === currIndex) return;

    // Move episode to new position
    const [moved] = episodes.splice(currIndex, 1);
    episodes.splice(targetIndex, 0, moved);

    // Renumber live so numbers stay 1..N with no gaps or duplicates
    const renumbered = episodes.map((ep, idx) => ({
      ...ep,
      episodeNumber: idx + 1,
    }));

    setSeriesList((prev) =>
      prev.map((s) =>
        s.id === seriesId
          ? {
              ...s,
              seasons: [{ ...s.seasons[0], episodes: renumbered }],
            }
          : s
      )
    );

    // Call PUT /api/series/:id/episodes/order once
    try {
      await SeriesService.reorderEpisodes(
        seriesId,
        renumbered.map((ep) => ep.id)
      );
    } catch (err: any) {
      showToast("Couldn't save episode order.", "error");
    }
  };

  // Filter series when search is active (> 5 series)
  const filteredSeries = useMemo(() => {
    if (!searchQuery.trim()) return seriesList;
    const q = searchQuery.toLowerCase().trim();
    return seriesList.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }, [seriesList, searchQuery]);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
  const username = profile?.username || "creator";
  const isAtSeriesLimit = seriesList.length >= planData.limits.series;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#7A2253]" />
      </div>
    );
  }

  return (
    <PageContainer>
      {/* C1: Page Header */}
      <PageHeader
        {...PAGE_COPY.series}
        meta={
          <>
            {seriesList.length} of {planData.limits.series === Infinity ? "Unlimited" : planData.limits.series} series · {planData.plan}
            {isAtSeriesLimit && (
              <button
                type="button"
                onClick={() => setLimitModalOpen(true)}
                className="ml-1.5 font-medium text-(--primary) hover:underline cursor-pointer"
              >
                Upgrade
              </button>
            )}
          </>
        }
        actions={
          <button type="button" onClick={handleOpenCreateSeries} className="dash-btn-primary">
            <Plus className="h-4 w-4" />
            <span>New series</span>
          </button>
        }
      />

      <div className="flex items-start gap-8">
        <div className="flex-1 min-w-0 space-y-5">
          {/* Search Input: Only when > 5 series */}
          {seriesList.length > 5 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search series by title..."
            className="w-full rounded-[5px] border border-[#e2e8f0] bg-white pl-9 pr-3 py-2 text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7A2253] focus:outline-none focus:ring-1 focus:ring-[#7A2253]/20"
          />
        </div>
      )}

      {/* C6: Empty State (0 Series) */}
      {seriesList.length === 0 && (
        <div className="rounded-[5px] border-2 border-dashed border-slate-200 bg-white p-8 sm:p-12 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[5px] bg-[#7A2253]/10 text-[#7A2253]">
            <Film className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-[#0f172a]">Create your first series</h3>
            <p className="text-xs text-[#64748b]">
              Organize your YouTube videos, Shorts, and Instagram Reels into binge-worthy seasons with sequential episodes.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenCreateSeries}
              className="inline-flex h-10 items-center gap-2 rounded-[5px] bg-[#7A2253] px-5 text-xs font-semibold text-white shadow-md shadow-[#7A2253]/20 hover:bg-[#601a41] transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Series</span>
            </button>
          </div>
        </div>
      )}

      {/* Series Rows List */}
      <div className="space-y-3">
        {filteredSeries.map((series, sIndex) => {
          const episodes = series.seasons?.[0]?.episodes || [];
          const isExpanded = expandedSeriesIds.has(series.id);
          const coverImg = series.posterDataUrl;

          const publicSeriesSlug = slugifySeriesTitle(series.title);
          const publicSeriesUrl = `${origin}/${username}/series/${publicSeriesSlug}`;

          const isFull =
            planData.limits.episodesPerSeries !== Infinity &&
            episodes.length >= planData.limits.episodesPerSeries;

          return (
            <div
              key={series.id}
              draggable
              onDragStart={() => handleSeriesDragStart(sIndex)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleSeriesDrop(sIndex)}
              className="rounded-[5px] border border-[#ECECF0] bg-white transition-all shadow-none"
            >
              {/* C3: Series Row Header */}
              <div
                onClick={() => handleToggleExpand(series.id)}
                className="flex items-center justify-between gap-3 p-3 sm:p-4 cursor-pointer hover:bg-slate-50/70 transition-colors select-none"
              >
                {/* Left: Drag handle + Cover + Title + Stats */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Drag Handle */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 text-slate-300 hover:text-slate-600 cursor-grab active:cursor-grabbing shrink-0"
                    title="Drag to reorder series"
                  >
                    <GripVertical className="h-4 w-4" />
                  </div>

                  {/* 16:9 96px Cover Thumbnail or Platform Icon */}
                  <div className="relative h-14 w-24 shrink-0 rounded-[5px] bg-slate-100 overflow-hidden border border-[#ECECF0]">
                    {coverImg && !failedCovers.has(series.id) ? (
                      <img
                        src={coverImg}
                        alt={series.title}
                        className="h-full w-full object-cover"
                        onError={() => setFailedCovers((prev) => new Set(prev).add(series.id))}
                      />
                    ) : (
                      // No cover (or it failed to load): same gradient + faint Inflixo logo as the public cards.
                      <div aria-hidden="true" className="relative h-full w-full bg-gradient-to-br from-(--cover-from) to-(--cover-to)">
                        <SeriesCoverLogo size="thumb" />
                      </div>
                    )}
                  </div>

                  {/* Title & Info */}
                  <div className="min-w-0 flex-1">
                    <h2 className="flex items-center gap-1.5 min-w-0 text-[14px] font-semibold text-[#18181B]">
                      <span className="line-clamp-2 break-words" title={series.title}>{series.title}</span>
                      {seriesList.indexOf(series) >= getPlanQuota(subscription?.planKey).maxSeries && <OverLimitBadge />}
                    </h2>
                    <p className="text-[12px] text-[#6B6B76] line-clamp-2 break-words mt-0.5">
                      {episodes.length} {episodes.length === 1 ? "episode" : "episodes"} ·{" "}
                      {series.language || "Hindi"} · {series.platform || "YouTube"}
                    </p>
                  </div>
                </div>

                {/* Right: Only 2 visible actions (Share + ⋮ menu) + Expand Chevron */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 shrink-0"
                >
                  {/* Share Popover Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenuId(null);
                        setActiveShareId(activeShareId === series.id ? null : series.id);
                      }}
                      className="inline-flex h-8 items-center gap-1 rounded-[5px] border border-[#ECECF0] bg-white px-2.5 text-[13px] font-medium text-[#3F3F46] hover:bg-[#FAFAFB] hover:text-[#7A2253] transition-colors cursor-pointer"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Share</span>
                    </button>

                    <SeriesSharePopover
                      url={publicSeriesUrl}
                      title={series.title}
                      isOpen={activeShareId === series.id}
                      onClose={() => setActiveShareId(null)}
                    />
                  </div>

                  {/* ⋮ Menu Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveShareId(null);
                        setActiveMenuId(activeMenuId === series.id ? null : series.id);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-[5px] border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a] transition-colors cursor-pointer"
                      aria-label="More options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    <SeriesRowActionMenu
                      isOpen={activeMenuId === series.id}
                      onClose={() => setActiveMenuId(null)}
                      onEdit={() => handleOpenEditSeries(series)}
                      onViewLive={() => window.open(publicSeriesUrl, "_blank")}
                      onImportCsv={() => {
                        setCsvSeriesId(series.id);
                        setCsvModalOpen(true);
                      }}
                      onDelete={() => setSeriesToDelete(series)}
                    />
                  </div>

                  {/* Expand Chevron visual indicator */}
                  <div className="p-1 text-slate-400">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* C4: Expanded Episodes List */}
              {isExpanded && (
                <div className="border-t border-[#e2e8f0] bg-[#fafafa] p-3 sm:p-4 space-y-3">
                  {/* Episode Rows */}
                  {episodes.length === 0 ? (
                    <p className="text-xs text-[#94a3b8] italic py-2 text-center">
                      No episodes added yet. Paste video links below to add episodes.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {[...episodes]
                        .sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0))
                        .map((ep, epIndex) => {
                          const isInlineEditing = inlineEditingEpId === ep.id;
                          const isEditingNumber = inlineEditingEpNumberId === ep.id;

                          return (
                            <div
                              key={ep.id}
                              className="group flex items-center justify-between gap-3 rounded-[5px] border border-[#ECECF0] bg-[#FAFAFB] px-3 py-2 text-[13px] transition-colors hover:border-[#cbd5e1]"
                            >
                              {/* Left: Number + Title (Inline edit) */}
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {/* Number (click to edit inline, auto-reorders) */}
                                {isEditingNumber ? (
                                  <input
                                    type="number"
                                    min={1}
                                    max={episodes.length}
                                    value={inlineNumberValue}
                                    onChange={(e) => setInlineNumberValue(e.target.value)}
                                    onBlur={() => handleSaveInlineNumber(ep.id, series.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleSaveInlineNumber(ep.id, series.id);
                                      } else if (e.key === "Escape") {
                                        setInlineEditingEpNumberId(null);
                                      }
                                    }}
                                    className="w-9 h-6 rounded-[5px] border border-[#7A2253] bg-white p-0 text-center font-mono text-[12px] font-medium text-[#18181B] focus:outline-none"
                                    autoFocus
                                  />
                                ) : (
                                  <span
                                    onClick={() => {
                                      setInlineEditingEpNumberId(ep.id);
                                      setInlineNumberValue(ep.episodeNumber || epIndex + 1);
                                    }}
                                    className="font-mono text-[12px] font-medium text-[#6B6B76] hover:text-[#7A2253] hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer shrink-0 text-center select-none"
                                    title="Click to edit episode number"
                                  >
                                    {formatEpisodeNumber(ep.episodeNumber || epIndex + 1)}
                                  </span>
                                )}

                                {/* Title (Inline editable) */}
                                <div className="min-w-0 flex-1">
                                  {isInlineEditing ? (
                                    <input
                                      type="text"
                                      value={inlineTitleValue}
                                      onChange={(e) => setInlineTitleValue(e.target.value)}
                                      onBlur={() => handleSaveInlineTitle(ep.id, series.id)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          handleSaveInlineTitle(ep.id, series.id);
                                        } else if (e.key === "Escape") {
                                          setInlineEditingEpId(null);
                                        }
                                      }}
                                      className="w-full rounded-[5px] border border-[#7A2253] bg-white px-1.5 py-0.5 text-[13px] font-medium text-[#18181B] focus:outline-none"
                                      autoFocus
                                    />
                                  ) : (
                                    <span
                                      onClick={() => {
                                        setInlineEditingEpId(ep.id);
                                        setInlineTitleValue(ep.title);
                                      }}
                                      className="font-medium text-[#18181B] hover:text-[#7A2253] cursor-pointer line-clamp-2 break-words block hover:underline"
                                      title="Click to edit title inline"
                                    >
                                      {ep.title}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Right: Platform Icon + Actions (far right, no middle empty space) */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* Platform Icon in 32px / 5px box */}
                                <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#F7EEF2] shrink-0" title={ep.platform || "Video"}>
                                  {ep.platform === "YouTube" && (
                                    <YoutubeIcon className="h-4 w-4 text-red-500" />
                                  )}
                                  {ep.platform === "Instagram" && (
                                    <InstagramIcon className="h-4 w-4 text-pink-500" />
                                  )}
                                  {ep.platform === "Facebook" && (
                                    <FacebookIcon className="h-4 w-4 text-blue-600" />
                                  )}
                                </div>

                                {/* Actions visible at all times: 32px buttons */}
                                <div className="flex items-center gap-1">
                                  {/* Edit details */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEpisodeToEdit({ episode: ep, seriesId: series.id });
                                      setEpisodeEditModalOpen(true);
                                    }}
                                    className="flex h-8 w-8 items-center justify-center rounded-[5px] text-[#6B6B76] hover:text-[#7A2253] hover:bg-white border border-transparent hover:border-[#ECECF0] cursor-pointer transition-colors"
                                    title="Edit title and link"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>

                                  {/* Open link */}
                                  {ep.externalUrl && (
                                    <a
                                      href={ep.externalUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex h-8 w-8 items-center justify-center rounded-[5px] text-[#6B6B76] hover:text-[#18181B] hover:bg-white border border-transparent hover:border-[#ECECF0] transition-colors"
                                      title="Open video"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  )}

                                  {/* Delete with confirmation */}
                                  <button
                                    type="button"
                                    onClick={() => setEpisodeToDelete({ seriesId: series.id, episode: ep })}
                                    className="flex h-8 w-8 items-center justify-center rounded-[5px] text-[#6B6B76] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 cursor-pointer transition-colors"
                                    title="Delete episode"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Bottom: Inline Paste input to add episodes right away */}
                  <div className="pt-1">
                    {isFull ? (
                      <div className="flex items-center justify-between rounded-[5px] border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-800">
                        <span className="flex items-center gap-1.5 font-medium">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span>
                            {episodes.length}/{planData.limits.episodesPerSeries} episodes limit reached
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setLimitModalOpen(true)}
                          className="font-semibold text-[#7A2253] hover:underline cursor-pointer"
                        >
                          Upgrade for more
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={inlineInputs[series.id] || ""}
                          onChange={(e) =>
                            setInlineInputs((prev) => ({ ...prev, [series.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleInlineQuickAdd(series.id);
                            }
                          }}
                          placeholder="Paste video link(s) to add episodes… (press Enter)"
                          disabled={addingInline[series.id]}
                          className="flex-1 rounded-[5px] border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7A2253] focus:outline-none focus:ring-1 focus:ring-[#7A2253]/20"
                        />
                        <button
                          type="button"
                          disabled={addingInline[series.id] || !inlineInputs[series.id]?.trim()}
                          onClick={() => handleInlineQuickAdd(series.id)}
                          className="inline-flex h-8 items-center gap-1 rounded-[5px] bg-[#7A2253] px-3 text-xs font-semibold text-white shadow-xs hover:bg-[#601a41] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#7A2253]"
                        >
                          {addingInline[series.id] ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                          <span>Add</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
        </div>

        <PhonePreview username={username || profile.username} subpath="series" refreshTrigger={seriesList} series={seriesList} />
      </div>

      {/* Create / Edit Series Modal */}
      <SeriesUpsertModal
        isOpen={upsertModalOpen}
        onClose={() => {
          setUpsertModalOpen(false);
          setSeriesToEdit(null);
        }}
        seriesToEdit={seriesToEdit}
        creatorUsername={username}
        defaultLanguage={profile?.state ? "Hindi" : "Hindi"}
        defaultCategories={profile?.category || ""}
        maxEpisodes={planData.limits.episodesPerSeries}
        onSuccess={handleSeriesUpsertSuccess}
      />

      {/* Edit Episode Modal */}
      <EpisodeEditModal
        isOpen={episodeEditModalOpen}
        onClose={() => {
          setEpisodeEditModalOpen(false);
          setEpisodeToEdit(null);
        }}
        episode={episodeToEdit?.episode || null}
        seriesId={episodeToEdit?.seriesId || ""}
        seriesPlatform={
          seriesList.find((s) => s.id === episodeToEdit?.seriesId)?.platform || "YouTube"
        }
        onSaved={(updated) => {
          if (!episodeToEdit) return;
          const { seriesId } = episodeToEdit;
          setSeriesList((prev) =>
            prev.map((s) => {
              if (s.id !== seriesId) return s;
              const eps = (s.seasons?.[0]?.episodes || []).map((e) =>
                e.id === updated.id ? updated : e
              );
              return {
                ...s,
                seasons: [{ ...s.seasons[0], episodes: eps }],
              };
            })
          );
        }}
      />

      {/* CSV Import Modal (from ⋮ menu) */}
      {csvModalOpen && (
        <SeriesCsvImportModal
          series={seriesList}
          planKey={planData.planKey}
          initialSeriesId={csvSeriesId}
          onClose={() => {
            setCsvModalOpen(false);
            setCsvSeriesId(undefined);
          }}
          onImported={(id, count) => {
            setCsvModalOpen(false);
            setCsvSeriesId(undefined);
            SeriesService.fetchFromDb().then((res) => setSeriesList(res.series));
            showToast(`Imported ${count} episode(s) successfully! ✨`, "success");
          }}
        />
      )}

      {/* Delete Series Confirmation Modal (Uses Destructive Red Variant) */}
      <ConfirmModal
        isOpen={Boolean(seriesToDelete)}
        onClose={() => setSeriesToDelete(null)}
        onConfirm={handleConfirmDeleteSeries}
        title={`Delete "${seriesToDelete?.title}"?`}
        description="Are you sure you want to delete this series? All episodes inside will be permanently removed. This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        loading={deletingSeries}
        isDestructive={true}
      />

      {/* Delete Episode Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(episodeToDelete)}
        onClose={() => { if (!deletingEpisode) setEpisodeToDelete(null); }}
        onConfirm={handleConfirmDeleteEpisode}
        title={`Delete "${episodeToDelete?.episode?.title || "Episode"}"?`}
        description="Are you sure you want to delete this episode? This video link will be removed from this series."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        loading={deletingEpisode}
        isDestructive={true}
      />

      {/* Limit Reached Modal */}
      <LimitReachedModal
        isOpen={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        type="series"
        planKey={planData.planKey}
        currentCount={seriesList.length}
        maxLimit={planData.limits.series}
      />
    </PageContainer>
  );
}
