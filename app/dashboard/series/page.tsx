"use client";

import { useState, useEffect } from "react";
import { Layers, Plus, Trash2, ChevronDown, ChevronUp, Eye, Pencil, X, Sparkles, Film, ExternalLink, Globe } from "lucide-react";
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
import { ConfirmModal } from "@/components/ui/ConfirmModal";

const PLATFORM_ICONS: Record<EpisodePlatform, React.ReactNode> = {
  YouTube: <YoutubeIcon className="h-4 w-4 text-red-500" />,
  Instagram: <InstagramIcon className="h-4 w-4 text-pink-500" />,
  Facebook: <FacebookIcon className="h-4 w-4 text-blue-600" />,
};

function NewSeriesForm({ onCreated }: { onCreated: () => void }) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [poster, setPoster] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("");
  const [seriesPlatform, setSeriesPlatform] = useState<EpisodePlatform>("YouTube");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="group tap-scale flex w-full items-center justify-center gap-2.5 rounded-3xl border-2 border-dashed border-purple-300/80 bg-gradient-to-r from-purple-50/50 via-white to-pink-50/50 p-5 text-sm font-extrabold text-inflixo-purple shadow-xs hover:border-inflixo-purple hover:shadow-md transition-all"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-inflixo-purple text-white shadow-sm group-hover:scale-110 transition-transform">
          <Plus className="h-5 w-5" />
        </div>
        <span>Create New OTT Series</span>
      </button>
    );
  }

  async function submit() {
    if (!title.trim()) {
      showToast("Series title is required", "error");
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
      showToast("Could not save series to database. Please try again! 💡", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-purple-200/80 bg-white p-6 shadow-md space-y-5 animate-scale-up">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-100 text-inflixo-purple">
            <Film className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-black text-slate-900">Create New Series</h3>
            <p className="text-xs font-bold text-slate-500">Choose primary platform, poster, genres & language</p>
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
          <PhotoUpload value={poster} onChange={setPoster} shape="rounded" size={100} label="Upload poster preview" />
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
                      ? "border-inflixo-purple bg-purple-50/80 text-inflixo-purple font-black shadow-xs"
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
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-100 text-inflixo-purple">
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
  onChange,
  onEditEpisode,
  onDeleteEpisode,
  onDeleteSeries,
}: {
  series: Series;
  onChange: () => void;
  onEditEpisode: (seriesId: string, seasonId: string, ep: Episode) => void;
  onDeleteEpisode: (seriesId: string, seasonId: string, ep: Episode) => void;
  onDeleteSeries: (series: Series) => void;
}) {
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(true);
  const [addingEpisode, setAddingEpisode] = useState<string | null>(null);
  const [submittingEp, setSubmittingEp] = useState(false);

  const totalEpisodes = SeriesService.totalEpisodeCount(series);
  const [epNumber, setEpNumber] = useState(totalEpisodes + 1);
  const [epTitle, setEpTitle] = useState("");
  const [epUrl, setEpUrl] = useState("");

  async function ensureSeasonAndAdd() {
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
    <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-purple-200 space-y-4">
      {/* Series Card Top Info Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {/* Poster Image */}
          <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-purple-900 border border-slate-200 shadow-xs flex items-center justify-center">
            {series.posterDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={series.posterDataUrl} alt={series.title} className="h-full w-full object-cover" />
            ) : (
              <Film className="h-6 w-6 text-purple-300" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-lg font-black text-slate-900">{series.title}</h3>
            
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {/* Social Platform Chip */}
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-extrabold text-slate-800 border border-slate-200 shadow-2xs">
                {PLATFORM_ICONS[series.seasons[0]?.episodes[0]?.platform || "YouTube"]}
                {series.seasons[0]?.episodes[0]?.platform || "YouTube"}
              </span>

              {/* Genres Separate Chips */}
              {series.genre &&
                series.genre
                  .split(",")
                  .map((g) => g.trim())
                  .filter(Boolean)
                  .map((g) => (
                    <span
                      key={g}
                      className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-extrabold text-inflixo-purple border border-purple-200/60"
                    >
                      {g}
                    </span>
                  ))}

              {series.language && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                  <Globe className="h-3 w-3 text-slate-400" />
                  {series.language}
                </span>
              )}

              <span className="text-xs font-bold text-slate-500 ml-1">
                <strong className="text-purple-700 font-black">{totalEpisodes} Episode{totalEpisodes !== 1 ? "s" : ""}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onDeleteSeries(series)}
            className="tap-scale flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 hover:bg-rose-100 transition-all"
            title="Delete Series"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
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
              <Layers className="h-4 w-4 text-inflixo-purple" />
              Episodes List ({totalEpisodes})
            </p>
          </div>

          {totalEpisodes === 0 ? (
            <div className="py-6 text-center bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-sm font-bold text-slate-600">No episodes added yet</p>
              <p className="text-xs text-slate-400">Click &ldquo;Add Episode&rdquo; below to attach YouTube, Reels, or video links.</p>
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
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-xs font-black text-white shadow-2xs group-hover:bg-inflixo-purple transition-colors">
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
                      {/* Watch Eye Icon */}
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

                      {/* Edit Pencil Icon */}
                      <button
                        type="button"
                        onClick={() => onEditEpisode(series.id, season.id, ep)}
                        className="tap-scale flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all shadow-2xs"
                        title="Edit Episode Details"
                      >
                        <Pencil className="h-3.5 w-3.5 text-slate-600" />
                      </button>

                      {/* Delete Trash Icon */}
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

          {/* Add Episode Form Box */}
          {addingEpisode === series.id ? (
            <div className="space-y-4 rounded-2xl border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50/60 to-pink-50/40 p-4 animate-scale-up">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold text-inflixo-purple uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  Add Episode #{epNumber}
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
              <Button variant="secondary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setAddingEpisode(series.id)}>
                Add Episode to {series.title}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardSeriesPage() {
  const { series, refresh } = useCreator();
  const { showToast } = useToast();
  const [editingEpisode, setEditingEpisode] = useState<{ seriesId: string; seasonId: string; episode: Episode } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    type: "episode" | "series";
    title: string;
    description: string;
    action: () => void;
  } | null>(null);

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
      description: `Are you sure you want to remove "${ep.title}" from this series? This will delete it permanently from the database.`,
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
      description: `Are you sure you want to delete "${s.title}" and all its episodes from the database? This cannot be undone.`,
      action: async () => {
        await SeriesService.remove(s.id);
        showToast(`Series "${s.title}" deleted! 🗑️`);
        refresh();
      },
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8 sm:py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-inflixo-purple border border-purple-200/60 mb-2">
          <Film className="h-3.5 w-3.5" />
          OTT Content Manager
        </div>
        <h1 className="font-display text-2xl font-black text-slate-900 sm:text-3xl">Series &amp; Episodes</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Organize your social videos into professional OTT-style series &amp; episodes for your fans.
        </p>
      </div>

      <div className="space-y-4">
        {series.length === 0 ? (
          <EmptyState
            icon={<Layers className="h-6 w-6 text-inflixo-purple" />}
            title="No series created yet"
            description="Create your first OTT series to organize your video links into seasons & episodes."
          />
        ) : (
          series.map((s) => (
            <SeriesRow
              key={s.id}
              series={s}
              onChange={refresh}
              onEditEpisode={(seriesId, seasonId, ep) => setEditingEpisode({ seriesId, seasonId, episode: ep })}
              onDeleteEpisode={promptDeleteEpisode}
              onDeleteSeries={promptDeleteSeries}
            />
          ))
        )}

        <NewSeriesForm onCreated={refresh} />
      </div>

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
