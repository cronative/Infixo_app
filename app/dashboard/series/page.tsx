"use client";

import { useState, useEffect } from "react";
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
  Globe,
  AlertCircle,
  Check,
  Share2,
  Copy,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
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
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LimitReachedModal } from "@/components/ui/LimitReachedModal";
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
          className={`group tap-scale flex w-full items-center justify-center gap-2.5 rounded-3xl border-2 border-dashed p-5 text-sm font-extrabold shadow-xs transition-all ${
            seriesUsage.isLimitReached
              ? "border-amber-300 bg-amber-50/70 text-amber-800 hover:border-amber-400"
              : "border-purple-200 bg-white text-[#651FFF] hover:border-[#651FFF] hover:shadow-md shadow-purple-600/10"
          }`}
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-2xl text-white shadow-sm group-hover:scale-110 transition-transform ${
              seriesUsage.isLimitReached ? "bg-amber-600" : "bg-[#651FFF]"
            }`}
          >
            <Plus className="h-5 w-5 stroke-[3]" />
          </div>
          <span>
            {seriesUsage.isLimitReached
              ? "Early Access Series Limit Reached (3/3)"
              : "+ Create New OTT Series"}
          </span>
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
    <div className="rounded-3xl border border-purple-200/80 bg-white p-6 shadow-md space-y-5 animate-scale-up text-left">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
            <Film className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-black text-slate-900">Create New Series</h3>
            <p className="text-xs font-bold text-slate-500">
              Series {seriesUsage.current + 1} of {EARLY_ACCESS_LIMITS.maxSeries} allowed in Early Access
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors"
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
          <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
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
                  className={`tap-scale flex items-center justify-center gap-2 rounded-2xl border-2 p-3 text-center transition-all ${
                    isSelected
                      ? "border-purple-600 bg-purple-50/80 text-purple-700 font-black shadow-xs"
                      : "border-slate-200 bg-white font-bold text-slate-600 hover:border-purple-200 hover:bg-slate-50"
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

        <div className="flex gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button fullWidth loading={submitting} onClick={submit}>
            Save &amp; Create Series
          </Button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-purple-100 animate-scale-up text-left space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-display text-lg font-black text-slate-900 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <Pencil className="h-4 w-4" />
            </div>
            Edit Episode #{epNumber}
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-[100px_1fr] gap-3">
            <Input
              label="Ep No."
              type="number"
              min={1}
              value={epNumber}
              onChange={(e) => setEpNumber(Number(e.target.value) || 1)}
            />
            <Input
              label="Episode Title"
              placeholder="e.g. Arrival in Kashmir"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <Input
            label="Video Link / External URL"
            placeholder="https://youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" loading={saving} onClick={handleSave}>
            Save Changes
          </Button>
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

  function handleCopySeriesLink() {
    const handle = profile?.username || "creator";
    const shareUrl = `${window.location.origin}/${handle}/series/${series.id}`;
    const shareText = `Check out my series "${series.title}" on Inflixo! Watch episodes and stream now! 🎬🔥`;
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`).then(() => {
      setCopiedLink(true);
      showToast(`Series direct link & message copied for "${series.title}"! ✨`);
      setTimeout(() => setCopiedLink(false), 2500);
    });
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
    <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-purple-200 space-y-4 text-left">
      {/* Series Card Top Info Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {/* Clean Flat Poster Container */}
          <SeriesPoster
            src={series.posterDataUrl}
            title={series.title}
            className="h-28 w-20 rounded-2xl border border-slate-200"
            textClassName="text-[10px] font-black text-purple-200"
          />

          {/* Right Side Info */}
          <div className="min-w-0 flex-1 space-y-1 text-left">
            {/* Title */}
            <h3 className="truncate font-display text-lg font-black text-slate-900">{series.title}</h3>

            {/* Below Title: Description */}
            {series.description && (
              <p className="text-xs font-medium text-slate-600 line-clamp-2 leading-snug">
                {series.description}
              </p>
            )}

            {/* Below Description: Genre (left) & Language (right) without chips */}
            <div className="pt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-xs font-bold text-slate-700">
              <div>
                <span className="font-extrabold text-slate-400">Genre:</span>{" "}
                <span className="text-slate-900 font-extrabold">{series.genre || "General"}</span>
              </div>
              {series.language && (
                <div>
                  <span className="font-extrabold text-slate-400">Language:</span>{" "}
                  <span className="text-slate-900 font-extrabold">{series.language}</span>
                </div>
              )}
            </div>

            {/* Below Both: Episode Count & Usage Indicator */}
            <div className="pt-1 flex items-center gap-2 text-xs font-bold text-slate-600">
              <span className="font-black text-slate-900">Episodes: {epUsage.current} / 5</span>
              <div className="h-1.5 w-24 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    epUsage.isLimitReached ? "bg-amber-500" : "bg-purple-600"
                  }`}
                  style={{ width: `${epUsage.percentage}%` }}
                />
              </div>
              <span className={epUsage.isLimitReached ? "text-amber-600 font-extrabold text-[11px]" : "text-purple-700 font-extrabold text-[11px]"}>
                {epUsage.isLimitReached ? "5/5 Limit Reached" : `${epUsage.percentage}%`}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleViewPublicSeries}
            className="tap-scale flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 border border-blue-200/80 hover:bg-blue-100 transition-all"
            title="View Public Series Page"
          >
            <Eye className="h-4 w-4" />
          </button>

          <button
            onClick={handleCopySeriesLink}
            className={`tap-scale flex h-9 w-9 items-center justify-center rounded-2xl border transition-all ${
              copiedLink
                ? "bg-emerald-50 text-emerald-600 border-emerald-300"
                : "bg-indigo-50 text-indigo-700 border-indigo-200/80 hover:bg-indigo-100"
            }`}
            title="Copy Direct Series Page Link"
          >
            {copiedLink ? <Check className="h-4 w-4 stroke-[3]" /> : <Copy className="h-4 w-4" />}
          </button>

          <button
            onClick={handleShareSeries}
            className="tap-scale flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 border border-purple-200/80 hover:bg-purple-100 transition-all"
            title="Share Direct Series Page Link"
          >
            <Share2 className="h-4 w-4" />
          </button>

          <button
            onClick={() => onDeleteSeries(series)}
            className="tap-scale flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 hover:bg-rose-100 transition-all"
            title="Delete Series"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <button
            onClick={onToggle}
            className="tap-scale flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-all"
            title={expanded ? "Collapse Episodes" : "Expand Episodes"}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Episodes List */}
      {expanded && (
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-purple-600" />
              Episodes List ({totalEpisodes} / {EARLY_ACCESS_LIMITS.maxEpisodesPerSeries})
            </p>
          </div>

          {totalEpisodes === 0 ? (
            <div className="py-6 text-center bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-sm font-bold text-slate-600">No episodes added yet</p>
              <p className="text-xs text-slate-400">
                Click &ldquo;Add Episode&rdquo; below to attach YouTube, Reels, or video links. (Max 5 per series)
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {series.seasons.flatMap((season) =>
                season.episodes.map((ep) => (
                  <div
                    key={ep.id}
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 transition-all hover:bg-white hover:border-purple-200 hover:shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Episode Number Pill */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-xs font-black text-white shadow-2xs group-hover:bg-purple-600 transition-colors">
                        E{ep.episodeNumber}
                      </div>

                      {/* Episode Title & URL */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-slate-900">
                          {ep.title}
                        </p>
                        <p className="truncate text-xs font-medium text-slate-400 mt-0.5">{ep.externalUrl}</p>
                      </div>
                    </div>

                    {/* Episode Action Toolbar */}
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={ep.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tap-scale flex h-8 px-2.5 items-center gap-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 hover:bg-purple-100 text-xs font-bold transition-all"
                        title="Watch Episode in New Tab"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Watch</span>
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>

                      <button
                        type="button"
                        onClick={() => onEditEpisode(series.id, season.id, ep)}
                        className="tap-scale flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all shadow-2xs"
                        title="Edit Episode Details"
                      >
                        <Pencil className="h-3.5 w-3.5 text-slate-600" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteEpisode(series.id, season.id, ep)}
                        className="tap-scale flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200/80 hover:bg-rose-100 transition-all"
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

          {/* Add Episode Form Box or Limit Reached Indicator */}
          {addingEpisode === series.id ? (
            <div className="space-y-4 rounded-2xl border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50/60 to-pink-50/40 p-4 animate-scale-up">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  Add Episode #{epNumber} (Max {EARLY_ACCESS_LIMITS.maxEpisodesPerSeries})
                </p>
                <button onClick={() => setAddingEpisode(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
                  Close
                </button>
              </div>

              <div className="grid grid-cols-[100px_1fr] gap-3">
                <Input label="Ep No." type="number" min={1} value={epNumber} onChange={(e) => setEpNumber(Number(e.target.value) || 1)} />
                <Input label="Episode Title" placeholder="e.g. Episode 1: The Beginning" value={epTitle} onChange={(e) => setEpTitle(e.target.value)} />
              </div>

              <Input label="Video Link / External URL" placeholder="https://youtube.com/watch?v=... or Reel URL" value={epUrl} onChange={(e) => setEpUrl(e.target.value)} />

              <div className="flex items-center justify-end gap-3 pt-1">
                <Button variant="outline" size="sm" onClick={() => setAddingEpisode(null)}>
                  Cancel
                </Button>
                <Button size="sm" loading={submittingEp} onClick={ensureSeasonAndAdd}>
                  Save &amp; Add Episode
                </Button>
              </div>
            </div>
          ) : (
            <div className="pt-2">
              {epUsage.isLimitReached ? (
                <button
                  type="button"
                  onClick={() => onEpisodeLimitTrigger(series.title)}
                  className="tap-scale flex items-center gap-1.5 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs font-extrabold text-amber-800 hover:bg-amber-100 transition-all"
                >
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span>Episode Limit Reached ({epUsage.current}/5) — Click for Creator Plan Info</span>
                </button>
              ) : (
                <Button variant="secondary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={handleStartAddEpisode}>
                  Add Episode to {series.title}
                </Button>
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
  const { series, refresh } = useCreator();
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
    <div className="mx-auto max-w-3xl px-3 sm:px-8 py-4 sm:py-8 space-y-5 text-left">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700 border border-purple-200/60 mb-2">
          <Film className="h-3.5 w-3.5" />
          OTT Content Manager
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h1 className="font-display text-2xl font-black text-slate-900 sm:text-3xl">Series &amp; Episodes</h1>
          <span className="rounded-full bg-purple-100 text-purple-800 border border-purple-200 px-3.5 py-1 text-xs font-black self-start sm:self-auto">
            {seriesUsage.current} of {seriesUsage.max} Series Used
          </span>
        </div>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Organize your social videos into professional OTT-style series &amp; episodes for your fans.
        </p>

        {/* Series Usage Indicator Bar */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-slate-700">
          <div className="flex items-center gap-2.5">
            <span>Series Usage</span>
            <div className="h-2 w-36 rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  seriesUsage.isLimitReached ? "bg-amber-500" : "bg-purple-600"
                }`}
                style={{ width: `${seriesUsage.percentage}%` }}
              />
            </div>
            <span className="font-black">{seriesUsage.current} of {seriesUsage.max}</span>
          </div>

          <span className="text-[11px] font-semibold text-slate-500">
            {seriesUsage.isLimitReached ? (
              <span className="text-amber-700 font-extrabold">Early Access series limit reached (3/3)</span>
            ) : (
              <span>Max 5 episodes per series allowed in Early Access</span>
            )}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {series.length === 0 ? (
          <EmptyState
            icon={<Layers className="h-6 w-6 text-purple-600" />}
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
  );
}
