"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Layers,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Sparkles,
  Film,
  ExternalLink,
  Check,
  Share2,
  Copy,
  Search,
  MoreVertical,
  Play,
  Globe,
} from "lucide-react";
import { SeriesCoverUpload } from "@/components/series/SeriesCoverUpload";
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
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
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
  Other: <Globe className="h-4 w-4 text-[#803D63]" />,
};

function formatEpisodeNumber(num: number): string {
  return num < 10 ? `Part 0${num}` : `Part ${num}`;
}

function getPlatformInfo(url: string = ""): { name: string; host: string; icon: React.ReactNode } {
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return { name: "YouTube", host: "youtube.com", icon: <YoutubeIcon className="h-3.5 w-3.5 text-red-500" /> };
  }
  if (lower.includes("instagram.com")) {
    return { name: "Instagram", host: "instagram.com", icon: <InstagramIcon className="h-3.5 w-3.5 text-pink-500" /> };
  }
  if (lower.includes("facebook.com") || lower.includes("fb.watch")) {
    return { name: "Facebook", host: "facebook.com", icon: <FacebookIcon className="h-3.5 w-3.5 text-blue-600" /> };
  }
  return { name: "Web Video", host: "external link", icon: <Play className="h-3.5 w-3.5 text-[#803D63]" /> };
}

/* ==========================================================================
   1. CREATE / EDIT SERIES SLIDE-OVER DRAWER
   ========================================================================== */
interface SeriesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  seriesToEdit?: Series | null;
  seriesList: Series[];
  onSaved: () => void;
  onLimitTrigger: () => void;
}

function SeriesDrawer({
  isOpen,
  onClose,
  seriesToEdit,
  seriesList,
  onSaved,
  onLimitTrigger,
}: SeriesDrawerProps) {
  const { showToast } = useToast();
  const isEditing = Boolean(seriesToEdit);

  const [title, setTitle] = useState("");
  const [poster, setPoster] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("");
  const [seriesPlatform, setSeriesPlatform] = useState<EpisodePlatform>("YouTube");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (seriesToEdit) {
      setTitle(seriesToEdit.title || "");
      setPoster(seriesToEdit.posterDataUrl || null);
      setDescription(seriesToEdit.description || "");
      setGenre(seriesToEdit.genre || "");
      setLanguage(seriesToEdit.language || "");
    } else {
      setTitle("");
      setPoster(null);
      setDescription("");
      setGenre("");
      setLanguage("");
      setSeriesPlatform("YouTube");
    }
  }, [seriesToEdit, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Enter a series title.", "error");
      return;
    }

    if (!isEditing && !canCreateSeries(seriesList)) {
      onClose();
      onLimitTrigger();
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && seriesToEdit) {
        await SeriesService.update(seriesToEdit.id, {
          title: title.trim(),
          posterDataUrl: poster,
          description: description.trim(),
          genre: genre.trim(),
          language: language.trim(),
        });
        showToast("Series updated successfully! ✨");
      } else {
        await SeriesService.create({
          title: title.trim(),
          posterDataUrl: poster,
          description: description.trim(),
          genre: genre.trim(),
          language: language.trim(),
        });
        showToast("Series created! 🎉");
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error("Failed to save series:", err);
      showToast("Could not save series. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={isEditing ? "Edit Series" : "Create Series"}
      description={
        isEditing
          ? "Update series details and cover poster."
          : `Series ${seriesList.length + 1} of ${EARLY_ACCESS_LIMITS.maxSeries} allowed in Early Access`
      }
      icon={<Film className="h-4 w-4" />}
    >
      <form id="series-form" onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <ModalBody className="p-5 sm:p-6 space-y-4 text-left">
          {/* Full-Width 16:9 Landscape Series Cover */}
          <SeriesCoverUpload
            value={poster}
            onChange={setPoster}
            maxSizeMB={5}
            label="Series Cover"
          />

          {/* Series Title */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#181716]">
              Series title <span className="text-[#C2414B]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Kashmir Diaries or Tech Masterclass"
              className="w-full rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] px-3.5 py-2.5 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#803D63] focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#181716]">
              Short description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell your audience what this series is about..."
              className="w-full rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] p-3 text-xs font-medium text-[#181716] placeholder:text-[#797570]/50 focus:border-[#803D63] focus:bg-white focus:outline-none transition-colors resize-y"
            />
          </div>

          {/* Primary Platform */}
          {!isEditing && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#181716]">
                Primary content platform
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["YouTube", "Instagram", "Facebook", "Other"] as EpisodePlatform[]).map((p) => {
                  const isSelected = seriesPlatform === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSeriesPlatform(p)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#803D63] bg-[#803D63]/[0.09] text-[#803D63]"
                          : "border-[#E7E3DC] bg-white text-[#797570] hover:bg-[#F8F7F3]"
                      }`}
                    >
                      {PLATFORM_ICONS[p]}
                      <span>{p}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Genre & Language Selectors */}
          <div className="space-y-3 pt-1">
            <GenreMultiSelect value={genre} onChange={setGenre} max={5} />
            <LanguageSelect value={language} onChange={setLanguage} />
          </div>
        </ModalBody>

        <ModalFooter className="px-5 sm:px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E7E3DC] text-xs font-semibold text-[#797570] hover:bg-[#F8F7F3] hover:text-[#181716] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="series-form"
            disabled={submitting}
            className="bg-[#803D63] hover:bg-[#6F3456] text-white font-semibold text-xs py-2 px-4.5 rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>{submitting ? "Saving..." : isEditing ? "Save Changes" : "Create Series"}</span>
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

/* ==========================================================================
   2. ADD / EDIT EPISODE SLIDE-OVER DRAWER
   ========================================================================== */
interface EpisodeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  series: Series | null;
  episodeToEdit?: { seasonId: string; episode: Episode } | null;
  onSaved: () => void;
  onLimitTrigger: (title: string) => void;
}

function EpisodeDrawer({
  isOpen,
  onClose,
  series,
  episodeToEdit,
  onSaved,
  onLimitTrigger,
}: EpisodeDrawerProps) {
  const { showToast } = useToast();
  const isEditing = Boolean(episodeToEdit);

  const [epNumber, setEpNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const epUsage = series ? getEpisodeUsage(series) : { current: 0, max: 5, isLimitReached: false };

  useEffect(() => {
    if (episodeToEdit) {
      setEpNumber(episodeToEdit.episode.episodeNumber);
      setTitle(episodeToEdit.episode.title);
      setUrl(episodeToEdit.episode.externalUrl || "");
    } else if (series) {
      setEpNumber(epUsage.current + 1);
      setTitle("");
      setUrl("");
    }
  }, [episodeToEdit, series, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen, onClose]);

  if (!isOpen || !series) return null;

  const platformInfo = getPlatformInfo(url);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!series) return;

    if (!title.trim()) {
      showToast("Enter an episode title.", "error");
      return;
    }
    if (!url.trim()) {
      showToast("Paste a valid video or content link.", "error");
      return;
    }

    if (!isEditing && !canCreateEpisode(series)) {
      onClose();
      onLimitTrigger(series.title);
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && episodeToEdit) {
        await SeriesService.updateEpisode(series.id, episodeToEdit.seasonId, episodeToEdit.episode.id, {
          episodeNumber: epNumber,
          title: title.trim(),
          externalUrl: url.trim(),
        });
        showToast("Episode updated! ✨");
      } else {
        let seasonId = series.seasons[0]?.id;
        if (!seasonId) {
          const season = SeriesService.addSeason(series.id, { title: "Season 1", seasonNumber: 1 });
          seasonId = season.id;
        }
        await SeriesService.addEpisode(series.id, seasonId, {
          episodeNumber: epNumber,
          title: title.trim(),
          thumbnailDataUrl: null,
          platform: (platformInfo.name as EpisodePlatform) || "YouTube",
          externalUrl: url.trim(),
          description: "",
        });
        showToast(`Episode added to ${series.title}! 🎬`);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error("Failed to save episode:", err);
      showToast("Could not save episode. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={isEditing ? `Edit ${formatEpisodeNumber(epNumber)}` : "Add Episode"}
      description={isEditing ? `Updating episode in ${series.title}` : `Adding to ${series.title}`}
      icon={<Play className="h-4 w-4" />}
    >
      <form id="episode-form" onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <ModalBody className="p-5 space-y-4 text-left">
          {/* Episode Number Display */}
          <div className="flex items-center justify-between rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] px-4 py-2.5">
            <span className="text-xs font-semibold text-[#797570]">Episode Order</span>
            <span className="text-xs font-bold text-[#803D63] bg-[#803D63]/[0.09] border border-[#803D63]/20 px-2.5 py-0.5 rounded-md">
              {formatEpisodeNumber(epNumber)}
            </span>
          </div>

          {/* Episode Title */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#181716]">
              Episode title <span className="text-[#C2414B]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The journey begins"
              className="w-full rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] px-3.5 py-2.5 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#803D63] focus:bg-white focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-[#797570]">
              A concise title for this episode or reel.
            </p>
          </div>

          {/* Video URL */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#181716]">
              Video or content link <span className="text-[#C2414B]">*</span>
            </label>
            <div className="relative">
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a YouTube, Instagram, or Facebook link"
                className="w-full rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] pl-3.5 pr-9 py-2.5 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#803D63] focus:bg-white focus:outline-none transition-colors"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {platformInfo.icon}
              </div>
            </div>
            {url.trim() && (
              <p className="text-[11px] font-semibold text-[#17845B] flex items-center gap-1">
                <Check className="h-3 w-3" />
                <span>Detected: {platformInfo.name} ({platformInfo.host})</span>
              </p>
            )}
          </div>
        </ModalBody>

        <ModalFooter className="px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E7E3DC] text-xs font-semibold text-[#797570] hover:bg-[#F8F7F3] hover:text-[#181716] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="episode-form"
            disabled={submitting}
            className="bg-[#803D63] hover:bg-[#6F3456] text-white font-semibold text-xs py-2 px-4.5 rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>{submitting ? "Saving..." : isEditing ? "Save Changes" : "Add Episode"}</span>
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

/* ==========================================================================
   3. SERIES CARD ROW COMPONENT
   ========================================================================== */
interface SeriesCardProps {
  series: Series;
  username: string;
  expanded: boolean;
  onToggle: () => void;
  onEditSeries: (s: Series) => void;
  onDeleteSeries: (s: Series) => void;
  onAddEpisode: (s: Series) => void;
  onEditEpisode: (series: Series, seasonId: string, ep: Episode) => void;
  onDeleteEpisode: (series: Series, seasonId: string, ep: Episode) => void;
  onShareSeries: (s: Series) => void;
}

function SeriesCard({
  series,
  username,
  expanded,
  onToggle,
  onEditSeries,
  onDeleteSeries,
  onAddEpisode,
  onEditEpisode,
  onDeleteEpisode,
  onShareSeries,
}: SeriesCardProps) {
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const epUsage = getEpisodeUsage(series);
  const episodes = series.seasons?.flatMap((sn) => sn.episodes) || (series as any).episodes || [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleCopyLink = async () => {
    setMenuOpen(false);
    const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
    const shareUrl = `${origin}/${username}/series/${series.id}`;
    const success = await copyToClipboard(shareUrl);
    if (success) {
      showToast("Series link copied! 🎬");
    } else {
      showToast("Could not copy series link", "error");
    }
  };

  return (
    <div
      id={`series-${series.id}`}
      className="rounded-2xl border border-[#E7E3DC] bg-white transition-all shadow-xs overflow-hidden"
    >
      {/* Collapsed / Header Card Content */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Thumbnail & Series Info */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          <SeriesPoster
            src={series.posterDataUrl}
            title={series.title}
            className="w-28 sm:w-36 aspect-video rounded-xl border border-[#E7E3DC] shrink-0 object-cover"
            textClassName="text-xs font-bold text-white"
          />

          <div className="min-w-0 flex-1 space-y-1 text-left">
            <h3 className="font-display text-base font-bold text-[#181716] truncate" title={series.title}>
              {series.title}
            </h3>
            <p className="text-xs text-[#797570] font-medium truncate">
              {series.genre || "General"} • {series.language || "All Languages"} • {episodes.length} {episodes.length === 1 ? "episode" : "episodes"}
            </p>
            {series.description && (
              <p className="text-xs text-[#797570]/80 font-normal line-clamp-1">
                {series.description}
              </p>
            )}
          </div>
        </div>

        {/* Middle: Progress Indicator */}
        <div className="hidden lg:flex flex-col items-center justify-center px-4 shrink-0 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#181716]">
            <span>{episodes.length} of {EARLY_ACCESS_LIMITS.maxEpisodesPerSeries} episodes</span>
          </div>
          <div className="h-1.5 w-28 rounded-full bg-[#F8F7F3] border border-[#E7E3DC] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                epUsage.isLimitReached ? "bg-amber-500" : "bg-[#803D63]"
              }`}
              style={{ width: `${(episodes.length / EARLY_ACCESS_LIMITS.maxEpisodesPerSeries) * 100}%` }}
            />
          </div>
        </div>

        {/* Right: Actions & Overflow Menu */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
          {/* Primary Action: Add Episode */}
          <button
            type="button"
            onClick={() => onAddEpisode(series)}
            disabled={epUsage.isLimitReached}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer shadow-xs ${
              epUsage.isLimitReached
                ? "bg-[#F8F7F3] border border-[#E7E3DC] text-[#797570] cursor-not-allowed opacity-60"
                : "bg-[#803D63] hover:bg-[#6F3456] text-white"
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{episodes.length === 0 ? "Add First Episode" : "Add Episode"}</span>
          </button>

          {/* Secondary Action: View Series */}
          <a
            href={`/${username}/series/${series.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#F8F7F3] px-3 py-2 text-xs font-semibold text-[#181716] transition-colors"
            title="View public series page"
          >
            <span className="hidden sm:inline">View</span>
            <ExternalLink className="h-3 w-3 text-[#803D63]" />
          </a>

          {/* Three-dot Overflow Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#F8F7F3] text-[#797570] hover:text-[#181716] transition-colors cursor-pointer"
              aria-label="More actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-[#E7E3DC] bg-white p-1 shadow-lg z-20 space-y-0.5 animate-in fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEditSeries(series);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#F8F7F3] transition-colors cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5 text-[#797570]" />
                  <span>Edit Series</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#F8F7F3] transition-colors cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5 text-[#797570]" />
                  <span>Copy Link</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onShareSeries(series);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#F8F7F3] transition-colors cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5 text-[#797570]" />
                  <span>Share Series</span>
                </button>

                <div className="my-1 border-t border-[#E7E3DC]" />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDeleteSeries(series);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#C2414B] hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Series</span>
                </button>
              </div>
            )}
          </div>

          {/* Expand / Collapse Control */}
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1 rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] hover:bg-[#803D63]/[0.09] hover:text-[#803D63] px-2.5 py-2 text-xs font-semibold text-[#181716] transition-colors cursor-pointer"
            aria-expanded={expanded}
            title={expanded ? "Hide episodes" : "Show episodes"}
          >
            <span className="hidden sm:inline">{expanded ? "Hide" : "Episodes"}</span>
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Episodes List */}
      {expanded && (
        <div className="border-t border-[#E7E3DC] bg-[#F8F7F3]/60 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#797570]">
              Episodes ({episodes.length} of {EARLY_ACCESS_LIMITS.maxEpisodesPerSeries})
            </span>
            {epUsage.isLimitReached && (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                Episode limit reached
              </span>
            )}
          </div>

          {episodes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E7E3DC] bg-white p-6 text-center space-y-2">
              <p className="text-xs font-bold text-[#181716]">No episodes added yet</p>
              <p className="text-xs text-[#797570] max-w-sm mx-auto">
                Add the first part so followers can begin this series.
              </p>
              <button
                type="button"
                onClick={() => onAddEpisode(series)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#803D63] hover:bg-[#6F3456] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add First Episode</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {series.seasons.flatMap((season) =>
                season.episodes.map((ep) => {
                  const plat = getPlatformInfo(ep.externalUrl);
                  return (
                    <div
                      key={ep.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[#E7E3DC] bg-white p-3 transition-colors hover:border-[#803D63]/30 shadow-xs"
                    >
                      {/* Left: Part Badge & Episode Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="flex h-7 w-16 items-center justify-center rounded-lg bg-[#803D63]/[0.09] text-[#803D63] text-xs font-bold shrink-0">
                          {formatEpisodeNumber(ep.episodeNumber)}
                        </span>

                        <div className="min-w-0 flex-1 text-left">
                          <p className="truncate text-xs font-bold text-[#181716]">
                            {ep.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#797570] font-medium mt-0.5">
                            {plat.icon}
                            <span>{plat.name} • {plat.host}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {ep.externalUrl && (
                          <a
                            href={ep.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-[#E7E3DC] bg-white hover:bg-[#F8F7F3] px-2.5 py-1 text-xs font-medium text-[#181716] transition-colors"
                            title="Open original video link"
                          >
                            <span className="hidden sm:inline">Open Original</span>
                            <ExternalLink className="h-3 w-3 text-[#803D63]" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => onEditEpisode(series, season.id, ep)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E7E3DC] bg-white hover:bg-[#F8F7F3] text-[#797570] hover:text-[#181716] transition-colors cursor-pointer"
                          title="Edit Episode"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteEpisode(series, season.id, ep)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-100 bg-white hover:bg-rose-50 text-[#C2414B] transition-colors cursor-pointer"
                          title="Remove Episode"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   4. MAIN DASHBOARD CONTENT PAGE
   ========================================================================== */
export default function DashboardContentPage() {
  const { profile, series, refresh } = useCreator();
  const { showToast } = useToast();

  const handleStr = profile.username || "creator";
  const seriesUsage = getSeriesUsage(series);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSeriesId, setExpandedSeriesId] = useState<string | null>(null);

  // Drawer States
  const [isSeriesDrawerOpen, setIsSeriesDrawerOpen] = useState(false);
  const [seriesToEdit, setSeriesToEdit] = useState<Series | null>(null);

  const [isEpisodeDrawerOpen, setIsEpisodeDrawerOpen] = useState(false);
  const [activeSeriesForEpisode, setActiveSeriesForEpisode] = useState<Series | null>(null);
  const [episodeToEdit, setEpisodeToEdit] = useState<{ seasonId: string; episode: Episode } | null>(null);

  // Share & Confirm Modals
  const [shareSeriesData, setShareSeriesData] = useState<Series | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
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

  // Calculate total episodes across all series
  const totalEpisodesCount = useMemo(() => {
    return series.reduce((acc, s) => {
      const eps = s.seasons?.flatMap((sn) => sn.episodes) || (s as any).episodes || [];
      return acc + eps.length;
    }, 0);
  }, [series]);

  // Filter series by search query
  const filteredSeries = useMemo(() => {
    if (!searchQuery.trim()) return series;
    const query = searchQuery.trim().toLowerCase();
    return series.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        (s.genre && s.genre.toLowerCase().includes(query)) ||
        (s.language && s.language.toLowerCase().includes(query))
    );
  }, [series, searchQuery]);

  // Automatically expand if only 1 series exists
  useEffect(() => {
    if (series.length === 1 && expandedSeriesId === null) {
      setExpandedSeriesId(series[0].id);
    }
  }, [series, expandedSeriesId]);

  // Handlers
  const handleOpenCreateSeries = () => {
    if (!canCreateSeries(series)) {
      setLimitModalState({ isOpen: true, type: "series" });
    } else {
      setSeriesToEdit(null);
      setIsSeriesDrawerOpen(true);
    }
  };

  const handleOpenEditSeries = (s: Series) => {
    setSeriesToEdit(s);
    setIsSeriesDrawerOpen(true);
  };

  const handleOpenAddEpisode = (s: Series) => {
    if (!canCreateEpisode(s)) {
      setLimitModalState({ isOpen: true, type: "episode", seriesTitle: s.title });
    } else {
      setActiveSeriesForEpisode(s);
      setEpisodeToEdit(null);
      setIsEpisodeDrawerOpen(true);
      setExpandedSeriesId(s.id);
    }
  };

  const handleOpenEditEpisode = (s: Series, seasonId: string, ep: Episode) => {
    setActiveSeriesForEpisode(s);
    setEpisodeToEdit({ seasonId, episode: ep });
    setIsEpisodeDrawerOpen(true);
  };

  const promptDeleteSeries = (s: Series) => {
    setConfirmModal({
      title: "Delete this series?",
      description: `"${s.title}" and its episode organization will be removed. This action cannot be undone.`,
      action: async () => {
        await SeriesService.remove(s.id);
        showToast(`Series "${s.title}" deleted! 🗑️`);
        refresh();
      },
    });
  };

  const promptDeleteEpisode = (s: Series, seasonId: string, ep: Episode) => {
    setConfirmModal({
      title: "Remove this episode?",
      description: `${formatEpisodeNumber(ep.episodeNumber)} will be removed from this series. The original content will remain on its platform.`,
      action: async () => {
        await SeriesService.removeEpisode(s.id, seasonId, ep.id);
        showToast(`${formatEpisodeNumber(ep.episodeNumber)} removed! 🗑️`);
        refresh();
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#181716] tracking-tight">
            Content
          </h1>
          <p className="text-xs sm:text-sm text-[#797570] font-medium mt-1">
            Organize your multi-part content into series your audience can watch in order.
          </p>
        </div>

        <div className="shrink-0 self-start sm:self-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={handleOpenCreateSeries}
            disabled={seriesUsage.isLimitReached}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors shadow-xs cursor-pointer ${
              seriesUsage.isLimitReached
                ? "bg-[#F8F7F3] border border-[#E7E3DC] text-[#797570] opacity-60 cursor-not-allowed"
                : "bg-[#803D63] hover:bg-[#6F3456] text-white"
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Create Series</span>
          </button>
        </div>
      </div>

      {/* 2. COMPACT CONTENT SUMMARY (3 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: Series Created */}
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-4 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#797570] uppercase tracking-wider">
              Series Created
            </span>
            <Film className="h-4 w-4 text-[#803D63]" />
          </div>
          <p className="font-display text-2xl font-bold text-[#181716]">
            {series.length} of {EARLY_ACCESS_LIMITS.maxSeries}
          </p>
          <p className="text-[11px] text-[#797570] font-medium">
            {EARLY_ACCESS_LIMITS.maxSeries - series.length} series slots remaining
          </p>
        </div>

        {/* Card 2: Total Episodes */}
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-4 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#797570] uppercase tracking-wider">
              Total Episodes
            </span>
            <Layers className="h-4 w-4 text-[#803D63]" />
          </div>
          <p className="font-display text-2xl font-bold text-[#181716]">
            {totalEpisodesCount} total
          </p>
          <p className="text-[11px] text-[#797570] font-medium">
            Across {series.length} {series.length === 1 ? "series" : "series"}
          </p>
        </div>

        {/* Card 3: Early Access Status */}
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-4 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#797570] uppercase tracking-wider">
              Early Access
            </span>
            <Sparkles className="h-4 w-4 text-[#803D63]" />
          </div>
          <p className="font-display text-2xl font-bold text-[#181716]">
            Active
          </p>
          <p className="text-[11px] text-[#797570] font-medium">
            Up to 5 episodes per series
          </p>
        </div>
      </div>

      {/* 3. TOOLBAR (Search) */}
      {series.length > 1 && (
        <div className="flex items-center justify-between gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#797570]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search series"
              className="w-full rounded-xl border border-[#E7E3DC] bg-white pl-9 pr-3.5 py-2 text-xs text-[#181716] placeholder:text-[#797570]/60 focus:outline-none focus:border-[#803D63] focus:ring-1 focus:ring-[#803D63]/20 transition-colors"
            />
          </div>
        </div>
      )}

      {/* 4. SERIES LIST SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <div>
            <h2 className="font-display text-base font-bold text-[#181716]">
              Your Series
            </h2>
            <p className="text-xs text-[#797570] font-medium mt-0.5">
              Manage your series and keep every episode in the correct order.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#797570]">
            {filteredSeries.length} {filteredSeries.length === 1 ? "series" : "series"}
          </span>
        </div>

        {/* Empty State */}
        {series.length === 0 ? (
          <div className="rounded-2xl border border-[#E7E3DC] bg-white p-8 text-center space-y-4 shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#803D63]/[0.09] text-[#803D63] mx-auto">
              <Film className="h-6 w-6" />
            </div>

            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="font-display text-base font-bold text-[#181716]">
                Create your first content series
              </h3>
              <p className="text-xs text-[#797570] font-medium leading-relaxed">
                Bring related reels and videos together so followers can start from Part 1 and find every next episode.
              </p>
            </div>

            {/* Guided Steps */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 max-w-xl mx-auto text-left">
              {[
                { num: "01", label: "Name your series" },
                { num: "02", label: "Add content links" },
                { num: "03", label: "Arrange in order" },
                { num: "04", label: "Share one link" },
              ].map((step) => (
                <div key={step.num} className="rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] p-2.5 space-y-0.5">
                  <span className="text-[10px] font-bold text-[#803D63]">{step.num}</span>
                  <p className="text-xs font-semibold text-[#181716]">{step.label}</p>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenCreateSeries}
                className="inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6F3456] px-5 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="h-4 w-4" />
                <span>Create First Series</span>
              </button>
            </div>
          </div>
        ) : filteredSeries.length === 0 ? (
          <div className="rounded-2xl border border-[#E7E3DC] bg-white p-8 text-center text-xs text-[#797570]">
            No series matching &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSeries.map((s) => (
              <SeriesCard
                key={s.id}
                series={s}
                username={handleStr}
                expanded={expandedSeriesId === s.id}
                onToggle={() => setExpandedSeriesId(expandedSeriesId === s.id ? null : s.id)}
                onEditSeries={handleOpenEditSeries}
                onDeleteSeries={promptDeleteSeries}
                onAddEpisode={handleOpenAddEpisode}
                onEditEpisode={handleOpenEditEpisode}
                onDeleteEpisode={promptDeleteEpisode}
                onShareSeries={setShareSeriesData}
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. DRAWERS & MODALS */}
      <SeriesDrawer
        isOpen={isSeriesDrawerOpen}
        onClose={() => setIsSeriesDrawerOpen(false)}
        seriesToEdit={seriesToEdit}
        seriesList={series}
        onSaved={refresh}
        onLimitTrigger={() => setLimitModalState({ isOpen: true, type: "series" })}
      />

      <EpisodeDrawer
        isOpen={isEpisodeDrawerOpen}
        onClose={() => setIsEpisodeDrawerOpen(false)}
        series={activeSeriesForEpisode}
        episodeToEdit={episodeToEdit}
        onSaved={refresh}
        onLimitTrigger={(seriesTitle) => setLimitModalState({ isOpen: true, type: "episode", seriesTitle })}
      />

      {shareSeriesData && (
        <ShareSeriesModal
          isOpen={Boolean(shareSeriesData)}
          onClose={() => setShareSeriesData(null)}
          series={shareSeriesData}
          username={handleStr}
        />
      )}

      <LimitReachedModal
        isOpen={limitModalState.isOpen}
        onClose={() => setLimitModalState({ ...limitModalState, isOpen: false })}
        type={limitModalState.type}
        seriesTitle={limitModalState.seriesTitle}
      />

      <ConfirmModal
        isOpen={Boolean(confirmModal)}
        onClose={() => setConfirmModal(null)}
        onConfirm={() => {
          if (confirmModal) confirmModal.action();
          setConfirmModal(null);
        }}
        title={confirmModal?.title || "Confirm Action"}
        description={confirmModal?.description || ""}
        confirmText="Yes, Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
