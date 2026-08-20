"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  Pencil,
  X,
  Sparkles,
  Film,
  ExternalLink,
  Check,
  Share2,
  Copy,
  LogOut,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { SeriesService } from "@/services/SeriesService";
import { Episode, EpisodePlatform, Series } from "@/types";
import { YoutubeIcon, InstagramIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { GenreMultiSelect } from "@/components/ui/GenreMultiSelect";
import { LanguageSelect } from "@/components/ui/LanguageSelect";
import { ShareSeriesModal } from "@/components/shared/ShareSeriesModal";
import { SeriesPoster } from "@/components/shared/SeriesPoster";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LimitReachedModal } from "@/components/ui/LimitReachedModal";
import { AuthService } from "@/services/AuthService";
import {
  getSeriesUsage,
  getEpisodeUsage,
  canCreateSeries,
  canCreateEpisode,
  EARLY_ACCESS_LIMITS,
} from "@/services/subscriptionLimits";

const PLATFORM_ICONS: Record<EpisodePlatform, React.ReactNode> = {
  YouTube: <YoutubeIcon className="h-4 w-4 text-red-500" />,
  Instagram: <InstagramIcon className="h-4 w-4 text-pink-500" />,
  Facebook: <FacebookIcon className="h-4 w-4 text-blue-600" />,
};

function NewSeriesForm({
  seriesList,
  onCreated,
  onLimitTrigger,
}: {
  seriesList: Series[];
  onCreated: () => void;
  onLimitTrigger: () => void;
}) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [poster, setPoster] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("");
  const [seriesPlatform, setSeriesPlatform] = useState<EpisodePlatform>("YouTube");

  const seriesUsage = getSeriesUsage(seriesList);

  function handleOpenClick() {
    if (!canCreateSeries(seriesList)) {
      onLimitTrigger();
    } else {
      setOpen(true);
    }
  }

  if (!open) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleOpenClick}
          className="w-full py-3.5 border-2 border-dashed border-[#E5E7EB] hover:border-[#803D63] hover:bg-[#F6EBF1]/30 rounded-xl text-sm font-semibold text-[#803D63] flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-[#803D63]">
            <Plus className="h-4 w-4" />
          </div>
          <span>+ Create New Series ({3 - seriesList.length} slots remaining)</span>
        </button>

        {seriesUsage.isLimitReached && (
          <p className="text-center text-xs font-bold text-amber-700">
            Early Access includes up to 3 Series. Unlimited Series coming with Creator Plan.
          </p>
        )}
      </div>
    );
  }

  async function submit() {
    if (!title.trim()) {
      showToast("Series title is required", "error");
      return;
    }

    if (!canCreateSeries(seriesList)) {
      setOpen(false);
      onLimitTrigger();
      return;
    }

    setSubmitting(true);
    try {
      await SeriesService.create({ title: title.trim(), posterDataUrl: poster, description, genre, language });
      showToast("Series created successfully! 🎉");
      setOpen(false);
      setTitle("");
      setPoster(null);
      setDescription("");
      setGenre("");
      setLanguage("");
      onCreated();
    } catch (err: any) {
      console.error("Failed to save series:", err);
      showToast("Could not save series. Please try again! 💡", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-2xs space-y-5 text-left">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-[#803D63]">
            <Film className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">Create New Series</h3>
            <p className="text-xs font-medium text-slate-500">
              Series {seriesUsage.current + 1} of {EARLY_ACCESS_LIMITS.maxSeries} allowed in Early Access
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center sm:justify-start">
          <PhotoUpload value={poster} onChange={setPoster} shape="landscape" label="Upload Series Landscape Poster" />
        </div>
        <Input label="Series Title" placeholder="e.g. Kashmir Diaries or Tech Masterclass" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label="Short Description" placeholder="Tell your audience what this series is about..." rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />

        {/* Primary Social Platform Selector */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
            Primary Social Platform
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(["YouTube", "Instagram", "Facebook"] as EpisodePlatform[]).map((p) => {
              const isSelected = seriesPlatform === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSeriesPlatform(p)}
                  className={`tap-scale flex items-center justify-center gap-2 rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#803D63] bg-indigo-50 text-[#803D63] font-bold"
                      : "border-gray-200 bg-white font-medium text-slate-600 hover:border-gray-300"
                  }`}
                >
                  {PLATFORM_ICONS[p]}
                  <span className="text-xs">{p}</span>
                </button>
              );
            })}
          </div>
        </div>

        <GenreMultiSelect value={genre} onChange={setGenre} max={5} />
        <LanguageSelect value={language} onChange={setLanguage} />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={submit}
            className="tap-scale bg-[#803D63] hover:bg-[#6D3254] text-white px-5 py-2 rounded-lg text-xs font-medium shadow-none transition-colors cursor-pointer"
          >
            {submitting ? "Creating..." : "Save & Create Series"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditEpisodeModal({
  isOpen,
  episode,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  episode: { seriesId: string; seasonId: string; episode: Episode } | null;
  onClose: () => void;
  onSave: (seriesId: string, seasonId: string, episodeId: string, updated: Partial<Episode>) => Promise<void>;
}) {
  const [epNumber, setEpNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (episode) {
      setEpNumber(episode.episode.episodeNumber);
      setTitle(episode.episode.title);
      setUrl(episode.episode.externalUrl || "");
    }
  }, [episode]);

  if (!isOpen || !episode) return null;

  async function handleSave() {
    if (!episode || !title.trim() || !url.trim()) return;
    setSaving(true);
    try {
      await onSave(episode.seriesId, episode.seasonId, episode.episode.id, {
        episodeNumber: epNumber,
        title: title.trim(),
        externalUrl: url.trim(),
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-200 animate-scale-up text-left space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-[#803D63]">
              <Pencil className="h-4 w-4" />
            </div>
            <span>Edit Episode #{epNumber}</span>
          </h3>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-[80px_1fr] gap-3">
            <Input
              label="EP NO."
              type="number"
              min={1}
              value={epNumber}
              onChange={(e) => setEpNumber(Number(e.target.value) || 1)}
              className="bg-white border-[#E5E7EB] text-center font-bold text-gray-900"
            />
            <Input
              label="Episode Title"
              placeholder="e.g. Arrival in Kashmir"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white border-[#E5E7EB] h-10 px-3 text-sm text-gray-900"
            />
          </div>

          <Input
            label="Video Link / External URL"
            placeholder="https://youtube.com/watch?v=..."
            leftIcon={<YoutubeIcon className="h-4 w-4 text-red-500" />}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-white border-[#E5E7EB] text-sm text-gray-900"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="tap-scale bg-[#803D63] hover:bg-[#6D3254] text-white px-5 py-2 rounded-lg text-xs font-medium shadow-none transition-colors cursor-pointer"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SeriesRow({
  series,
  expanded = false,
  onToggle,
  onChange,
  onEditEpisode,
  onDeleteEpisode,
  onDeleteSeries,
  onEpisodeLimitTrigger,
}: {
  series: Series;
  expanded?: boolean;
  onToggle?: () => void;
  onChange: () => void;
  onEditEpisode: (seriesId: string, seasonId: string, ep: Episode) => void;
  onDeleteEpisode: (seriesId: string, seasonId: string, ep: Episode) => void;
  onDeleteSeries: (series: Series) => void;
  onEpisodeLimitTrigger: (seriesTitle: string) => void;
}) {
  const { showToast } = useToast();
  const { profile } = useCreator();
  const [addingEpisode, setAddingEpisode] = useState<string | null>(null);
  const [submittingEp, setSubmittingEp] = useState(false);

  const epUsage = getEpisodeUsage(series);
  const totalEpisodes = epUsage.current;
  const [epNumber, setEpNumber] = useState(totalEpisodes + 1);
  const [epTitle, setEpTitle] = useState("");
  const [epUrl, setEpUrl] = useState("");

  const [copiedLink, setCopiedLink] = useState(false);

  function handleViewPublicSeries() {
    const handle = profile?.username || "creator";
    const previewUrl = `/${handle}/series/${series.id}`;
    window.open(previewUrl, "_blank");
  }

  async function handleCopySeriesLink() {
    const handle = profile?.username || "creator";
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/${handle}/series/${series.id}` : `https://inflixo.com/${handle}/series/${series.id}`;
    const shareText = `Check out my series "${series.title}" on Inflixo! Watch episodes and stream now! 🎬🔥`;
    const success = await copyToClipboard(`${shareText}\n${shareUrl}`);
    if (success) {
      setCopiedLink(true);
      showToast(`Series direct link & message copied for "${series.title}"! ✨`);
      setTimeout(() => setCopiedLink(false), 2500);
    } else {
      showToast("Could not copy series link", "error");
    }
  }

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  function handleShareSeries() {
    setIsShareModalOpen(true);
  }

  function handleStartAddEpisode() {
    if (!canCreateEpisode(series)) {
      onEpisodeLimitTrigger(series.title);
    } else {
      setAddingEpisode(series.id);
      if (!expanded) onToggle?.();
      setEpNumber(totalEpisodes + 1);
    }
  }

  async function ensureSeasonAndAdd() {
    if (!canCreateEpisode(series)) {
      setAddingEpisode(null);
      onEpisodeLimitTrigger(series.title);
      return;
    }

    let seasonId = series.seasons[0]?.id;
    if (!seasonId) {
      const season = SeriesService.addSeason(series.id, { title: "Season 1", seasonNumber: 1 });
      seasonId = season.id;
    }
    if (!epTitle.trim() || !epUrl.trim()) {
      showToast("Please enter an episode title and video link 💡", "error");
      return;
    }
    setSubmittingEp(true);
    try {
      const input: Omit<Episode, "id"> = {
        episodeNumber: epNumber,
        title: epTitle.trim(),
        thumbnailDataUrl: null,
        platform: "YouTube",
        externalUrl: epUrl.trim(),
        description: "",
      };
      await SeriesService.addEpisode(series.id, seasonId, input);
      showToast(`Episode #${epNumber} added to series! ✨`);
      setAddingEpisode(null);
      setEpNumber((n) => n + 1);
      setEpTitle("");
      setEpUrl("");
      onChange();
    } catch (err: any) {
      console.error("Failed to add episode:", err);
      showToast("Could not save episode. Please try again!", "error");
    } finally {
      setSubmittingEp(false);
    }
  }

  return (
    <div
      id={`series-${series.id}`}
      className={`rounded-2xl border border-gray-200 bg-white p-5 transition-all shadow-2xs hover:border-gray-300 ${
        expanded ? "ring-2 ring-indigo-500/10 shadow-xs" : ""
      }`}
    >
      {/* Series Card Top Info Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          {/* 16:9 Landscape Poster Thumbnail */}
          <SeriesPoster
            src={series.posterDataUrl}
            title={series.title}
            className="w-40 aspect-video rounded-lg border border-[#E5E7EB] shrink-0 object-cover"
            textClassName="text-xs font-bold text-white"
          />

          {/* Series Info & Typography */}
          <div className="min-w-0 flex-1 space-y-1.5 text-left">
            <h3 className="truncate font-display text-base sm:text-lg font-bold text-[#111827]">
              {series.title}
            </h3>

            {/* Genre & Language Micro-chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="bg-[#F6EBF1] text-[#803D63] text-xs font-medium px-2.5 py-0.5 rounded-md border border-[#E8DCE4]">
                Genre: {series.genre || "General"}
              </span>
              {series.language && (
                <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-md border border-gray-200">
                  Language: {series.language}
                </span>
              )}
            </div>

            {/* Episode Progress Bar */}
            <div className="pt-0.5 flex items-center gap-2.5 text-xs font-medium text-[#4B5563]">
              <div className="h-1.5 w-28 rounded-full bg-gray-100 overflow-hidden shrink-0">
                <div
                  className="h-full bg-[#803D63] transition-all duration-300 rounded-full"
                  style={{ width: `${epUsage.percentage}%` }}
                />
              </div>
              <span>
                {epUsage.current} / 5 Episodes ({epUsage.percentage}%)
              </span>
            </div>
          </div>
        </div>

        {/* Clean Square Icon Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={handleViewPublicSeries}
            className="w-8 h-8 rounded-lg border border-[#E5E7EB] bg-white text-gray-500 hover:text-[#803D63] hover:bg-[#F6EBF1] flex items-center justify-center cursor-pointer transition-colors"
            title="View Public Series Page"
          >
            <Eye className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleCopySeriesLink}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${
              copiedLink
                ? "bg-emerald-50 text-emerald-600 border-emerald-300"
                : "border-[#E5E7EB] bg-white text-gray-500 hover:text-[#803D63] hover:bg-[#F6EBF1]"
            }`}
            title="Copy Series Link"
          >
            {copiedLink ? <Check className="h-4 w-4 stroke-[3]" /> : <Copy className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={handleShareSeries}
            className="w-8 h-8 rounded-lg border border-[#E5E7EB] bg-white text-gray-500 hover:text-[#803D63] hover:bg-[#F6EBF1] flex items-center justify-center cursor-pointer transition-colors"
            title="Share Series"
          >
            <Share2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onDeleteSeries(series)}
            className="w-8 h-8 rounded-lg border border-red-100 bg-white text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer transition-colors"
            title="Delete Series"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onToggle}
            className="w-8 h-8 rounded-lg border border-[#E5E7EB] bg-white text-gray-500 hover:text-[#803D63] hover:bg-gray-50 flex items-center justify-center cursor-pointer transition-colors"
            title={expanded ? "Collapse Episodes" : "Expand Episodes"}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Episodes List */}
      {expanded && (
        <div className="space-y-3 border-t border-gray-100 pt-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-[#803D63]" />
              <span>Episodes List ({totalEpisodes} / {EARLY_ACCESS_LIMITS.maxEpisodesPerSeries})</span>
            </p>
          </div>

          {totalEpisodes === 0 ? (
            <div className="py-6 text-center bg-slate-50/80 rounded-xl border border-gray-100 space-y-1">
              <p className="text-xs font-bold text-slate-700">No episodes added yet</p>
              <p className="text-xs text-slate-400">
                Click &ldquo;Add Episode&rdquo; below to attach YouTube, Reels, or video links. (Max 5 per series)
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {series.seasons.flatMap((season) =>
                season.episodes.map((ep) => (
                  <div
                    key={ep.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-all hover:border-gray-300"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Light SaaS E1 Badge */}
                      <div className="bg-[#F6EBF1] text-[#803D63] font-bold text-xs w-8 h-8 rounded-lg flex items-center justify-center border border-[#E8DCE4] shrink-0">
                        E{ep.episodeNumber}
                      </div>

                      {/* Episode Title & Truncated URL */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-900">
                          {ep.title}
                        </p>
                        <p className="max-w-xs truncate text-[11px] font-medium text-slate-400 mt-0.5">
                          {ep.externalUrl}
                        </p>
                      </div>
                    </div>

                    {/* Episode Action Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={ep.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white border border-[#E5E7EB] text-[#4B5563] hover:border-[#803D63] hover:text-[#803D63] text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Watch Episode in New Tab"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Watch</span>
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>

                      <button
                        type="button"
                        onClick={() => onEditEpisode(series.id, season.id, ep)}
                        className="w-8 h-8 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-slate-900 transition-colors cursor-pointer"
                        title="Edit Episode Details"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteEpisode(series.id, season.id, ep)}
                        className="w-8 h-8 rounded-lg border border-red-100 bg-white flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Episode"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Add Episode Form Box (Flat Surface bg-[#F9FAFB]) */}
          {addingEpisode === series.id ? (
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-5 shadow-2xs space-y-4 animate-scale-up mt-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#803D63]" />
                  <span>Add Episode #{epNumber} (Max {EARLY_ACCESS_LIMITS.maxEpisodesPerSeries})</span>
                </p>
                <button onClick={() => setAddingEpisode(null)} className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer">
                  Close
                </button>
              </div>

              <div className="grid grid-cols-[80px_1fr] gap-3">
                <Input
                  label="EP NO."
                  type="number"
                  min={1}
                  value={epNumber}
                  onChange={(e) => setEpNumber(Number(e.target.value) || 1)}
                  className="bg-white border-[#E5E7EB] text-center font-bold text-gray-900"
                />
                <Input
                  label="Episode Title"
                  placeholder="e.g. Episode 1: The Beginning"
                  value={epTitle}
                  onChange={(e) => setEpTitle(e.target.value)}
                  className="bg-white border-[#E5E7EB] h-10 px-3 text-sm text-gray-900 focus:border-[#803D63]"
                />
              </div>

              <Input
                label="Video Link / External URL"
                placeholder="https://youtube.com/watch?v=... or Reel URL"
                leftIcon={<YoutubeIcon className="h-4 w-4 text-red-500" />}
                value={epUrl}
                onChange={(e) => setEpUrl(e.target.value)}
                className="bg-white border-[#E5E7EB] text-sm text-gray-900 focus:border-[#803D63]"
              />

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setAddingEpisode(null)}
                  className="bg-white border border-[#E5E7EB] text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingEp}
                  onClick={ensureSeasonAndAdd}
                  className="bg-[#803D63] hover:bg-[#6D3254] text-white px-5 py-2 rounded-lg text-xs font-medium shadow-none transition-colors cursor-pointer"
                >
                  {submittingEp ? "Saving..." : "Save & Add Episode"}
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2">
              {epUsage.isLimitReached ? (
                <button
                  type="button"
                  onClick={() => onEpisodeLimitTrigger(series.title)}
                  className="w-full py-2.5 bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Episode Limit Reached ({epUsage.current}/5) — Click for Info</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartAddEpisode}
                  className="w-full py-2.5 bg-white border border-[#E5E7EB] hover:border-[#803D63] hover:bg-[#F6EBF1]/30 text-xs font-semibold text-[#803D63] rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Add Episode to {series.title}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Share Series Modal */}
      <ShareSeriesModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        series={series}
        username={profile?.username || "creator"}
      />
    </div>
  );
}

export default function DashboardSeriesPage() {
  const router = useRouter();
  const { profile, series, refresh } = useCreator();
  const { showToast } = useToast();

  const seriesUsage = getSeriesUsage(series);

  const [editingEpisode, setEditingEpisode] = useState<{ seriesId: string; seasonId: string; episode: Episode } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    type: "episode" | "series";
    title: string;
    description: string;
    action: () => void;
  } | null>(null);

  const [limitModalState, setLimitModalState] = useState<{
    isOpen: boolean;
    type: "series" | "episode";
    seriesTitle?: string;
  }>({
    isOpen: false,
    type: "series",
  });

  const handleStr = profile.username || "nikzios30";
  const profileUrl = `inflixo.com/${handleStr}`;

  async function handleCopyLink() {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
    const fullLink = `${origin}/${handleStr}`;
    const success = await copyToClipboard(fullLink);
    if (success) {
      showToast("Profile link copied! ✨");
    } else {
      showToast("Could not copy link", "error");
    }
  }

  async function handleSaveEditedEpisode(seriesId: string, seasonId: string, episodeId: string, patch: Partial<Episode>) {
    await SeriesService.updateEpisode(seriesId, seasonId, episodeId, patch);
    setEditingEpisode(null);
    showToast("Episode updated successfully! ✨");
    refresh();
  }

  function promptDeleteEpisode(seriesId: string, seasonId: string, ep: Episode) {
    setConfirmModal({
      type: "episode",
      title: `Delete Episode #${ep.episodeNumber}?`,
      description: `Are you sure you want to remove "${ep.title}" from this series? This action cannot be undone.`,
      action: async () => {
        await SeriesService.removeEpisode(seriesId, seasonId, ep.id);
        showToast(`Episode #${ep.episodeNumber} deleted! 🗑️`);
        refresh();
      },
    });
  }

  function promptDeleteSeries(s: Series) {
    setConfirmModal({
      type: "series",
      title: `Delete Series: ${s.title}?`,
      description: `Are you sure you want to delete "${s.title}" and all its episodes? This cannot be undone.`,
      action: async () => {
        await SeriesService.remove(s.id);
        showToast(`Series "${s.title}" deleted! 🗑️`);
        refresh();
      },
    });
  }

  const [expandedSeriesId, setExpandedSeriesId] = useState<string | null>(null);

  return (
    <div className="min-h-dvh bg-[#F9FAFB] text-slate-900 pb-16">
      {/* Sticky Page Subheader */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-8 py-3.5 shadow-2xs text-left mb-6">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-base font-extrabold text-slate-900 truncate">
              Series &amp; Episodes
            </h1>
            <p className="text-xs text-slate-500 font-medium truncate">
              Organize your social videos into professional OTT episode playlists
            </p>
          </div>
          <a
            href="#new-series-form"
            className="bg-[#803D63] hover:bg-[#6D3254] text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Series</span>
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 sm:px-6 space-y-5">
        {/* Series Usage Strip */}
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-medium text-slate-700 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-slate-900">Series Usage:</span>
            <div className="h-1.5 w-32 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  seriesUsage.isLimitReached ? "bg-amber-500" : "bg-[#803D63]"
                }`}
                style={{ width: `${seriesUsage.percentage}%` }}
              />
            </div>
            <span className="font-bold text-[#803D63]">{seriesUsage.current} of {seriesUsage.max}</span>
          </div>

          <span className="text-xs text-[#9CA3AF] font-medium">
            {seriesUsage.isLimitReached ? (
              <span className="text-amber-700 font-bold">Early Access series limit reached (3/3)</span>
            ) : (
              <span>Max 5 episodes per series allowed in Early Access</span>
            )}
          </span>
        </div>

        <div className="space-y-4">
          {series.length === 0 ? (
            <EmptyState
              icon={<Layers className="h-6 w-6 text-[#803D63]" />}
              title="Turn your content into a Series"
              description="Organize your Instagram, YouTube and Facebook content part by part — all in one place. Early Access includes up to 3 series."
            />
          ) : (
            series.map((s) => (
              <SeriesRow
                key={s.id}
                series={s}
                expanded={expandedSeriesId === s.id}
                onToggle={() => setExpandedSeriesId(expandedSeriesId === s.id ? null : s.id)}
                onChange={refresh}
                onEditEpisode={(seriesId, seasonId, ep) => setEditingEpisode({ seriesId, seasonId, episode: ep })}
                onDeleteEpisode={promptDeleteEpisode}
                onDeleteSeries={promptDeleteSeries}
                onEpisodeLimitTrigger={(seriesTitle) => setLimitModalState({ isOpen: true, type: "episode", seriesTitle })}
              />
            ))
          )}

          <NewSeriesForm
            seriesList={series}
            onCreated={refresh}
            onLimitTrigger={() => setLimitModalState({ isOpen: true, type: "series" })}
          />
        </div>

        {/* Limit Reached Modal Popup */}
        <LimitReachedModal
          isOpen={limitModalState.isOpen}
          onClose={() => setLimitModalState({ ...limitModalState, isOpen: false })}
          type={limitModalState.type}
          seriesTitle={limitModalState.seriesTitle}
        />

        {/* Edit Episode Modal Popup */}
        <EditEpisodeModal
          isOpen={Boolean(editingEpisode)}
          episode={editingEpisode}
          onClose={() => setEditingEpisode(null)}
          onSave={handleSaveEditedEpisode}
        />

        {/* Confirmation Modal for Delete */}
        <ConfirmModal
          isOpen={Boolean(confirmModal)}
          onClose={() => setConfirmModal(null)}
          onConfirm={() => {
            if (confirmModal) confirmModal.action();
            setConfirmModal(null);
          }}
          title={confirmModal?.title || "Delete Item?"}
          description={confirmModal?.description || ""}
          confirmText="Yes, Delete"
          cancelText="Cancel"
        />
      </div>
    </div>
  );
}

