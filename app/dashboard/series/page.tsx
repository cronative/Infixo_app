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
import {
  YoutubeIcon,
  InstagramIcon,
  FacebookIcon,
  XTwitterIcon,
  LinkedinIcon,
  ThreadsIcon,
  SnapchatIcon,
  SpotifyIcon,
  TwitchIcon,
} from "@/components/shared/BrandIcons";
import { getInitials } from "@/lib/avatar";
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
  Other: <Globe className="h-4 w-4 text-[#151933]" />,
};

function formatEpisodeNumber(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

function getSeriesPlatform(series: Series, firstEpUrl: string = ""): string | null {
  const p = (series.platform || "").toLowerCase();
  const u = (firstEpUrl || "").toLowerCase();

  if (p.includes("youtube") || u.includes("youtube.com") || u.includes("youtu.be")) return "YouTube";
  if (p.includes("instagram") || u.includes("instagram.com")) return "Instagram";
  if (p.includes("facebook") || u.includes("facebook.com") || u.includes("fb.watch")) return "Facebook";
  if (p.includes("twitter") || p.includes("x.com") || u.includes("twitter.com") || u.includes("x.com")) return "X";
  if (p.includes("linkedin") || u.includes("linkedin.com")) return "LinkedIn";
  if (p.includes("threads") || u.includes("threads.net")) return "Threads";
  if (p.includes("snapchat") || u.includes("snapchat.com")) return "Snapchat";
  if (p.includes("spotify") || u.includes("spotify.com")) return "Spotify";
  if (p.includes("twitch") || u.includes("twitch.tv")) return "Twitch";
  if (series.platform && series.platform.trim()) return series.platform.trim();
  return null;
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
  if (lower.includes("twitter.com") || lower.includes("x.com")) {
    return { name: "X", host: "x.com", icon: <XTwitterIcon className="h-3.5 w-3.5 text-slate-800" /> };
  }
  if (lower.includes("spotify.com")) {
    return { name: "Spotify", host: "spotify.com", icon: <SpotifyIcon className="h-3.5 w-3.5 text-emerald-600" /> };
  }
  return { name: "Web Video", host: "external link", icon: <Play className="h-3.5 w-3.5 text-[#151933]" /> };
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
              className="w-full rounded-xl border border-[#E7E3DC] bg-[#fbfbfb] px-3.5 py-2.5 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#151933] focus:bg-white focus:outline-none transition-colors"
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
              className="w-full rounded-xl border border-[#E7E3DC] bg-[#fbfbfb] p-3 text-xs font-medium text-[#181716] placeholder:text-[#797570]/50 focus:border-[#151933] focus:bg-white focus:outline-none transition-colors resize-y"
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
                      className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition-all cursor-pointer ${isSelected
                        ? "border-[#151933] bg-[#151933]/[0.09] text-[#151933]"
                        : "border-[#E7E3DC] bg-white text-[#797570] hover:bg-[#fbfbfb]"
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
            className="px-4 py-2 rounded-xl border border-[#E7E3DC] text-xs font-semibold text-[#797570] hover:bg-[#fbfbfb] hover:text-[#181716] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="series-form"
            disabled={submitting}
            className="bg-[#151933] hover:bg-[#2c1937] text-white font-semibold text-xs py-2 px-4.5 rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
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
          <div className="flex items-center justify-between rounded-xl border border-[#E7E3DC] bg-[#fbfbfb] px-4 py-2.5">
            <span className="text-xs font-semibold text-[#797570]">Episode Order</span>
            <span className="text-xs font-bold text-[#151933] bg-[#151933]/[0.09] border border-[#151933]/20 px-2.5 py-0.5 rounded-md">
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
              className="w-full rounded-xl border border-[#E7E3DC] bg-[#fbfbfb] px-3.5 py-2.5 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#151933] focus:bg-white focus:outline-none transition-colors"
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
                className="w-full rounded-xl border border-[#E7E3DC] bg-[#fbfbfb] pl-3.5 pr-9 py-2.5 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#151933] focus:bg-white focus:outline-none transition-colors"
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
            className="px-4 py-2 rounded-xl border border-[#E7E3DC] text-xs font-semibold text-[#797570] hover:bg-[#fbfbfb] hover:text-[#181716] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="episode-form"
            disabled={submitting}
            className="bg-[#151933] hover:bg-[#2c1937] text-white font-semibold text-xs py-2 px-4.5 rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>{submitting ? "Saving..." : isEditing ? "Save Changes" : "Add Episode"}</span>
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

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
  const [activeEpMenuId, setActiveEpMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const epUsage = getEpisodeUsage(series);
  const episodes = series.seasons?.flatMap((sn) => sn.episodes) || (series as any).episodes || [];
  const firstEpUrl = episodes[0]?.externalUrl || "";
  const detectedPlatform = getSeriesPlatform(series, firstEpUrl);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      setActiveEpMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const subtitleParts: string[] = [`${episodes.length} ${episodes.length === 1 ? "episode" : "episodes"}`];
  if (detectedPlatform) subtitleParts.push(detectedPlatform);
  if (series.genre) subtitleParts.push(series.genre.split(/[,•|/]/)[0].trim());
  if (series.language) subtitleParts.push(series.language.trim());
  const subtitleStr = subtitleParts.join(" · ");

  return (
    <div id={`series-${series.id}`} className="transition-colors first:rounded-t-2xl last:rounded-b-2xl">
      {/* Series Row Header */}
      <div
        onClick={onToggle}
        className={`px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between gap-3.5 cursor-pointer hover:bg-[#FAF8F5]/80 transition-colors group first:rounded-t-2xl ${!expanded ? "last:rounded-b-2xl" : ""
          }`}
      >
        {/* Left: 48-52px Thumbnail + Title & Subtitle */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {series.posterDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={series.posterDataUrl}
              alt={series.title}
              className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-xl border border-[#E7E3DC] shrink-0 object-cover"
            />
          ) : (
            <span
              className={`flex h-12 w-12 sm:h-[52px] sm:w-[52px] shrink-0 items-center justify-center rounded-xl ${detectedPlatform === "YouTube"
                  ? "bg-red-600 shadow-xs text-white"
                  : detectedPlatform === "Instagram"
                    ? "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-xs text-white"
                    : detectedPlatform === "Facebook"
                      ? "bg-blue-600 shadow-xs text-white"
                      : detectedPlatform === "X"
                        ? "bg-slate-900 shadow-xs text-white"
                        : detectedPlatform === "LinkedIn"
                          ? "bg-sky-700 shadow-xs text-white"
                          : detectedPlatform === "Threads"
                            ? "bg-slate-900 shadow-xs text-white"
                            : detectedPlatform === "Snapchat"
                              ? "bg-[#FFFC00] shadow-xs text-black"
                              : detectedPlatform === "Spotify"
                                ? "bg-[#1DB954] shadow-xs text-white"
                                : detectedPlatform === "Twitch"
                                  ? "bg-[#9146FF] shadow-xs text-white"
                                  : "bg-[#15193314] border border-[#E7D0D4] text-[#151933]"
                }`}
            >
              {detectedPlatform === "YouTube" ? (
                <YoutubeIcon className="h-5 w-5 text-white" />
              ) : detectedPlatform === "Instagram" ? (
                <InstagramIcon className="h-5 w-5 text-white" />
              ) : detectedPlatform === "Facebook" ? (
                <FacebookIcon className="h-5 w-5 text-white" />
              ) : detectedPlatform === "X" ? (
                <XTwitterIcon className="h-4 w-4 text-white" />
              ) : detectedPlatform === "LinkedIn" ? (
                <LinkedinIcon className="h-4 w-4 text-white" />
              ) : detectedPlatform === "Threads" ? (
                <ThreadsIcon className="h-4 w-4 text-white" />
              ) : detectedPlatform === "Snapchat" ? (
                <SnapchatIcon className="h-5 w-5 text-black" />
              ) : detectedPlatform === "Spotify" ? (
                <SpotifyIcon className="h-5 w-5 text-white" />
              ) : detectedPlatform === "Twitch" ? (
                <TwitchIcon className="h-5 w-5 text-white" />
              ) : (
                <span className="text-xs font-bold tracking-tight select-none">
                  {getInitials(series.title)}
                </span>
              )}
            </span>
          )}

          <div className="min-w-0 flex-1 text-left space-y-0.5">
            <p className="truncate text-sm sm:text-base font-bold text-[#181716] group-hover:text-[#151933] transition-colors" title={series.title}>
              {series.title}
            </p>
            <p className="truncate text-xs sm:text-[13px] text-[#54514D] font-normal">
              {subtitleStr}
            </p>
          </div>
        </div>

        {/* Right: + Add Episode | View | ⋮ | Chevron */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 sm:gap-2 shrink-0"
        >
          {/* Add Episode Button */}
          <button
            type="button"
            onClick={() => onAddEpisode(series)}
            disabled={epUsage.isLimitReached}
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer shadow-xs ${epUsage.isLimitReached
                ? "bg-[#FAF8F5] border border-[#E7E3DC] text-[#797570] cursor-not-allowed opacity-60"
                : "bg-[#151933] hover:bg-[#2c1937] text-white"
              }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Episode</span>
          </button>

          {/* View Series Button */}
          <a
            href={`/${username}/series/${series.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] px-3 py-1.5 text-xs font-semibold text-[#181716] transition-colors shadow-xs"
            title="View public series page"
          >
            <span>View</span>
            <ExternalLink className="h-3 w-3 text-[#151933]" />
          </a>

          {/* 3-Dot Overflow Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-[#797570] hover:text-[#181716] transition-colors cursor-pointer shadow-xs"
              aria-label="More actions"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-[#E7E3DC] bg-white p-1 shadow-lg z-50 space-y-0.5 animate-in fade-in">
                <button
                  type="button"
                  disabled={epUsage.isLimitReached}
                  onClick={() => {
                    setMenuOpen(false);
                    onAddEpisode(series);
                  }}
                  className="sm:hidden flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#151933] hover:bg-[#FAF8F5] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5 text-[#151933]" />
                  <span>Add Episode</span>
                </button>

                <a
                  href={`/${username}/series/${series.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="sm:hidden flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-[#797570]" />
                  <span>View Series</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEditSeries(series);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5 text-[#797570]" />
                  <span>Edit Series</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
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
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
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

          {/* Expand / Collapse Chevron */}
          <button
            type="button"
            onClick={onToggle}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-[#797570] hover:text-[#181716] transition-colors cursor-pointer shadow-xs"
            aria-expanded={expanded}
            title={expanded ? "Hide episodes" : "Show episodes"}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Episodes List */}
      {expanded && (
        <div className="border-t border-[#E7E3DC] bg-[#FAF8F5]/50 last:rounded-b-2xl">
          {/* Header strip: Episodes · 1/5 */}
          <div className="px-5 py-2 bg-[#FAF8F5] flex items-center justify-between border-b border-[#E7E3DC]">
            <span className="text-xs font-medium text-[#181716]">
              Episodes · {episodes.length}/{EARLY_ACCESS_LIMITS.maxEpisodesPerSeries}
            </span>
            {epUsage.isLimitReached && (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                Episode limit reached
              </span>
            )}
          </div>

          {episodes.length === 0 ? (
            <div className="p-6 text-center space-y-2.5 bg-white last:rounded-b-2xl">
              <p className="text-sm font-bold text-[#181716]">No episodes added yet</p>
              <p className="text-xs text-[#797570] max-w-sm mx-auto">
                Add the first part so followers can begin this series.
              </p>
              <button
                type="button"
                onClick={() => onAddEpisode(series)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#151933] hover:bg-[#2c1937] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add First Episode</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#E7E3DC] bg-white last:rounded-b-2xl">
              {series.seasons.flatMap((season) =>
                season.episodes.map((ep, idx) => {
                  const plat = getPlatformInfo(ep.externalUrl);
                  const epNumStr = formatEpisodeNumber(ep.episodeNumber || idx + 1);

                  return (
                    <div
                      key={ep.id}
                      className="px-5 py-3 transition-colors flex items-center justify-between hover:bg-[#FAF8F5]/60 group last:rounded-b-2xl"
                    >
                      {/* Left: 01 & Episode Info */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-3">
                        <span className="text-xs font-mono font-bold text-[#797570] w-6 shrink-0">
                          {epNumStr}
                        </span>

                        <div className="min-w-0 flex-1 text-left space-y-0.5">
                          <p className="truncate text-sm sm:text-[15px] font-semibold text-[#181716]">
                            {ep.title || `Episode ${epNumStr}`}
                          </p>
                          <div className="flex items-center gap-1.5 text-[13px] text-[#54514D] font-normal">
                            {plat.icon}
                            <span>{plat.name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions (View, Edit, ⋮ with Delete inside) */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {ep.externalUrl && (
                          <a
                            href={ep.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-xs font-medium text-[#181716] transition-colors shadow-2xs"
                            title="Open original link"
                          >
                            <span>View</span>
                            <ExternalLink className="h-3 w-3 text-[#797570]" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => onEditEpisode(series, season.id, ep)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-xs font-medium text-[#181716] transition-colors cursor-pointer shadow-2xs"
                          title="Edit Episode"
                        >
                          <Pencil className="h-3 w-3 text-[#797570]" />
                          <span>Edit</span>
                        </button>

                        {/* ⋮ Menu for Episode (Contains Delete episode per #11) */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveEpMenuId(activeEpMenuId === ep.id ? null : ep.id);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-[#797570] hover:text-[#181716] transition-colors cursor-pointer shadow-2xs"
                            aria-label="Episode options"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>

                          {activeEpMenuId === ep.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1.5 w-36 rounded-xl border border-[#E7E3DC] bg-white p-1 shadow-lg z-50 space-y-0.5 animate-in fade-in"
                            >
                              {ep.externalUrl && (
                                <a
                                  href={ep.externalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setActiveEpMenuId(null)}
                                  className="sm:hidden flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors"
                                >
                                  <ExternalLink className="h-3.5 w-3.5 text-[#797570]" />
                                  <span>View</span>
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveEpMenuId(null);
                                  onDeleteEpisode(series, season.id, ep);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#C2414B] hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete episode</span>
                              </button>
                            </div>
                          )}
                        </div>
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
      description: `Episode ${formatEpisodeNumber(ep.episodeNumber)} will be removed from this series. The original content will remain on its platform.`,
      action: async () => {
        await SeriesService.removeEpisode(s.id, seasonId, ep.id);
        showToast(`Episode ${formatEpisodeNumber(ep.episodeNumber)} removed! 🗑️`);
        refresh();
      },
    });
  };

  return (
    <div className="space-y-6 w-full pb-12 text-left">
      {/* 1. PAGE HEADER: Content + description + Create Series button (h-11 rounded-xl) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] sm:text-[30px] font-bold tracking-tight text-[#181716] leading-tight">
            Content
          </h1>
          <p className="text-sm sm:text-[15px] text-[#54514D] font-normal mt-1">
            Organize your multi-part content into series your audience can watch in order.
          </p>
        </div>

        <div className="shrink-0 self-start sm:self-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={handleOpenCreateSeries}
            disabled={seriesUsage.isLimitReached}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-medium transition-colors shadow-xs cursor-pointer ${seriesUsage.isLimitReached
                ? "bg-[#FAF8F5] border border-[#E7E3DC] text-[#797570] opacity-60 cursor-not-allowed"
                : "bg-[#151933] hover:bg-[#2c1937] text-white"
              }`}
          >
            <Plus className="h-4 w-4" />
            <span>Create Series</span>
          </button>
        </div>
      </div>

      {/* 3 & 4. COMPACT CONTENT INFO ROW (Replaces the 3 big metric cards) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E7E3DC] bg-white px-5 py-3.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 text-sm font-medium text-[#181716]">
          <span className="font-semibold text-[#181716]">
            {series.length} / {EARLY_ACCESS_LIMITS.maxSeries} Series
          </span>
          <span className="text-[#797570]/40">·</span>
          <span className="font-semibold text-[#181716]">
            {totalEpisodesCount} {totalEpisodesCount === 1 ? "Episode" : "Episodes"}
          </span>
          <span className="text-[#797570]/40">·</span>
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#151933]/[0.08] text-[#151933] border border-[#151933]/20">
            Early Access
          </span>
        </div>

        <div className="text-xs text-[#797570] font-normal">
          {EARLY_ACCESS_LIMITS.maxSeries - series.length > 0
            ? `${EARLY_ACCESS_LIMITS.maxSeries - series.length} series slots remaining`
            : "All series slots filled"}
        </div>
      </div>

      {/* TOOLBAR (Search) if multiple series */}
      {series.length > 1 && (
        <div className="flex items-center justify-between gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#797570]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search series..."
              className="w-full h-10 rounded-xl border border-[#E7E3DC] bg-white pl-9 pr-3 text-xs sm:text-sm text-[#181716] placeholder:text-[#797570]/60 focus:outline-none focus:border-[#151933] focus:ring-1 focus:ring-[#151933]/20 transition-colors"
            />
          </div>
        </div>
      )}

      {/* 5 & 6. SERIES LIST SECTION: Simple "Series" heading, no duplicate counts/descriptions */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#181716]">
          Series
        </h2>

        {/* 15. Clean Empty State */}
        {series.length === 0 ? (
          <div className="rounded-2xl border border-[#E7E3DC] bg-white p-8 sm:p-12 text-center space-y-4 shadow-xs">
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base sm:text-lg font-bold text-[#181716]">
                Create your first series
              </h3>
              <p className="text-xs sm:text-sm text-[#54514D] font-normal leading-relaxed">
                Organize multi-part content so your audience can watch it in order.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenCreateSeries}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[#151933] hover:bg-[#2c1937] text-sm font-medium text-white transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="h-4 w-4" />
                <span>Create Series</span>
              </button>
            </div>
          </div>
        ) : filteredSeries.length === 0 ? (
          <div className="rounded-2xl border border-[#E7E3DC] bg-white p-6 text-center text-xs text-[#797570]">
            No series matching &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E7E3DC] bg-white divide-y divide-[#E7E3DC] shadow-xs">
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
