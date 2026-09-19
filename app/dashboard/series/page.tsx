"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
import { copyToClipboard } from "@/lib/copyToClipboard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LimitReachedModal } from "@/components/ui/LimitReachedModal";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getSeriesUsage,
  getEpisodeUsage,
  getPlanQuota,
  canCreateSeries,
  canCreateEpisode,
} from "@/services/subscriptionLimits";

const PLATFORM_ICONS: Record<EpisodePlatform, React.ReactNode> = {
  YouTube: <YoutubeIcon className="h-4 w-4 text-red-500" />,
  Instagram: <InstagramIcon className="h-4 w-4 text-pink-500" />,
  Facebook: <FacebookIcon className="h-4 w-4 text-blue-600" />,
  Other: <Globe className="h-4 w-4 text-[#043084]" />,
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
  return { name: "Web Video", host: "external link", icon: <Play className="h-3.5 w-3.5 text-[#043084]" /> };
}

type LegacySeries = Series & { episodes?: Episode[] };

function getSeriesEpisodes(series: Series): Episode[] {
  return series.seasons?.flatMap((season) => season.episodes) || (series as LegacySeries).episodes || [];
}

/* ==========================================================================
   1. CREATE / EDIT SERIES SLIDE-OVER DRAWER
   ========================================================================== */
interface SeriesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  seriesToEdit?: Series | null;
  seriesList: Series[];
  planKey: string;
  onSaved: () => void;
  onLimitTrigger: () => void;
}

function SeriesDrawer({
  isOpen,
  onClose,
  seriesToEdit,
  seriesList,
  planKey,
  onSaved,
  onLimitTrigger,
}: SeriesDrawerProps) {
  const { showToast } = useToast();
  const isEditing = Boolean(seriesToEdit);
  const initialForm = seriesToEdit
    ? {
      title: seriesToEdit.title || "",
      poster: seriesToEdit.posterDataUrl || null,
      description: seriesToEdit.description || "",
      genre: seriesToEdit.genre || "",
      language: seriesToEdit.language || "",
      platform: (seriesToEdit.platform || "YouTube") as EpisodePlatform,
    }
    : {
      title: "",
      poster: null,
      description: "",
      genre: "",
      language: "",
      platform: "YouTube" as EpisodePlatform,
    };

  const [title, setTitle] = useState(initialForm.title);
  const [poster, setPoster] = useState<string | null>(initialForm.poster);
  const [description, setDescription] = useState(initialForm.description);
  const [genre, setGenre] = useState(initialForm.genre);
  const [language, setLanguage] = useState(initialForm.language);
  const [seriesPlatform, setSeriesPlatform] = useState<EpisodePlatform>(initialForm.platform);
  const [submitting, setSubmitting] = useState(false);

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

    if (!isEditing && !canCreateSeries(seriesList, planKey)) {
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
          : `Series ${seriesList.length + 1} of ${getPlanQuota(planKey).maxSeries === Infinity ? "Unlimited" : getPlanQuota(planKey).maxSeries} allowed in ${getPlanQuota(planKey).name}`
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
            <label className="block text-xs font-bold text-[#043084]">
              Series title <span className="text-[#C2414B]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Kashmir Diaries or Tech Masterclass"
              className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-2.5 text-xs font-semibold text-[#043084] placeholder:text-[#64748b]/50 focus:border-[#043084] focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#043084]">
              Short description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell your audience what this series is about..."
              className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3 text-xs font-medium text-[#043084] placeholder:text-[#64748b]/50 focus:border-[#043084] focus:bg-white focus:outline-none transition-colors resize-y"
            />
          </div>

          {/* Primary Platform */}
          {!isEditing && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#043084]">
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
                        ? "border-[#043084] bg-[#043084]/[0.09] text-[#043084]"
                        : "border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f1f5f9]"
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
            className="px-4 py-2 rounded-xl border border-[#e2e8f0] text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#043084] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="series-form"
            disabled={submitting}
            className="bg-[#043084] hover:bg-brand-hover text-white font-semibold text-xs py-2 px-4.5 rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer shadow-xs hover:shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
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
  planKey: string;
  episodeToEdit?: { seasonId: string; episode: Episode } | null;
  onSaved: () => void;
  onLimitTrigger: (title: string) => void;
}

function EpisodeDrawer({
  isOpen,
  onClose,
  series,
  planKey,
  episodeToEdit,
  onSaved,
  onLimitTrigger,
}: EpisodeDrawerProps) {
  const { showToast } = useToast();
  const isEditing = Boolean(episodeToEdit);
  const initialEpNumber = episodeToEdit
    ? episodeToEdit.episode.episodeNumber
    : series
      ? getEpisodeUsage(series, planKey).current + 1
      : 1;

  const [epNumber] = useState(initialEpNumber);
  const [title, setTitle] = useState(episodeToEdit?.episode.title || "");
  const [url, setUrl] = useState(episodeToEdit?.episode.externalUrl || "");
  const [submitting, setSubmitting] = useState(false);

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

    if (!isEditing && !canCreateEpisode(series, planKey)) {
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
          <div className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-2.5">
            <span className="text-xs font-semibold text-[#64748b]">Episode Order</span>
            <span className="text-xs font-bold text-[#043084] bg-[#043084]/[0.09] border border-[#043084]/20 px-2.5 py-0.5 rounded-md">
              {formatEpisodeNumber(epNumber)}
            </span>
          </div>

          {/* Episode Title */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#043084]">
              Episode title <span className="text-[#C2414B]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The journey begins"
              className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-2.5 text-xs font-semibold text-[#043084] placeholder:text-[#64748b]/50 focus:border-[#043084] focus:bg-white focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-[#64748b]">
              A concise title for this episode or reel.
            </p>
          </div>

          {/* Video URL */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#043084]">
              Video or content link <span className="text-[#C2414B]">*</span>
            </label>
            <div className="relative">
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a YouTube, Instagram, or Facebook link"
                className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] pl-3.5 pr-9 py-2.5 text-xs font-semibold text-[#043084] placeholder:text-[#64748b]/50 focus:border-[#043084] focus:bg-white focus:outline-none transition-colors"
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
            className="px-4 py-2 rounded-xl border border-[#e2e8f0] text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#043084] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="episode-form"
            disabled={submitting}
            className="bg-[#043084] hover:bg-brand-hover text-white font-semibold text-xs py-2 px-4.5 rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer shadow-xs hover:shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
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
  planKey: string;
  expanded: boolean;
  onToggle: () => void;
  onEditSeries: (s: Series) => void;
  onDeleteSeries: (s: Series) => void;
  onAddEpisode: (s: Series) => void;
  onEditEpisode: (series: Series, seasonId: string, ep: Episode) => void;
  onDeleteEpisode: (series: Series, seasonId: string, ep: Episode) => void;
}

function SeriesCard({
  series,
  username,
  planKey,
  expanded,
  onToggle,
  onEditSeries,
  onDeleteSeries,
  onAddEpisode,
  onEditEpisode,
  onDeleteEpisode,
}: SeriesCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeEpMenuId, setActiveEpMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const epUsage = getEpisodeUsage(series, planKey);
  const episodes = getSeriesEpisodes(series);
  const firstEpUrl = episodes[0]?.externalUrl || "";
  const detectedPlatform = getSeriesPlatform(series, firstEpUrl);
  const cleanUsername = username.replace(/^@/, "") || "creator";
  const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
  const publicSeriesUrl = `${origin}/${cleanUsername}/series/${series.id}`;

  const handleCopySeriesLink = async () => {
    const success = await copyToClipboard(publicSeriesUrl);
    showToast(success ? "Series link copied!" : "Could not copy series link", success ? "success" : "error");
  };

  const handleShareSeriesLink = async () => {
    const title = `${series.title} on Inflixo`;
    const text = `Open ${series.title} series on Inflixo.`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url: publicSeriesUrl });
        return;
      }

      await handleCopySeriesLink();
    } catch {
      // User dismissed native share sheet.
    }
  };

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

  const subtitleParts: string[] = [`${episodes.length} ${episodes.length === 1 ? "episode" : "episodes"}`];
  if (detectedPlatform) subtitleParts.push(detectedPlatform);
  if (series.genre) subtitleParts.push(series.genre.split(/[,•|/]/)[0].trim());
  if (series.language) subtitleParts.push(series.language.trim());
  const subtitleStr = subtitleParts.join(" · ");

  return (
    <div id={`series-${series.id}`} className="transition-colors first:rounded-t-xl last:rounded-b-xl">
      {/* Series Row Header */}
      <div
        onClick={onToggle}
        className={`px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#f1f5f9] transition-colors group first:rounded-t-xl ${!expanded ? "last:rounded-b-xl" : ""
          }`}
      >
        {/* Left: Thumbnail + Title & Subtitle */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {series.posterDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={series.posterDataUrl}
              alt={series.title}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg border border-[#e2e8f0] shrink-0 object-cover"
            />
          ) : (
            <span
              className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg ${detectedPlatform === "YouTube"
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
                                : "bg-[#04308414] border border-[#e2e8f0] text-[#043084]"
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
            <p className="truncate text-sm sm:text-base font-bold text-[#043084] group-hover:text-[#043084] transition-colors" title={series.title}>
              {series.title}
            </p>
            <p className="truncate text-xs sm:text-[13px] text-[#475569] font-normal">
              {subtitleStr}
            </p>
          </div>
        </div>

        {/* Right: + Add Episode | View | Copy | Share | ⋮ | Chevron */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 sm:gap-2 shrink-0"
        >
          {/* Add Episode Button */}
          <button
            type="button"
            onClick={() => onAddEpisode(series)}
            disabled={epUsage.isLimitReached}
            className={`hidden sm:inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all hover:-translate-y-0.5 cursor-pointer shadow-xs hover:shadow-sm ${epUsage.isLimitReached
              ? "bg-[#f8fafc] border border-[#e2e8f0] text-[#64748b] cursor-not-allowed opacity-60"
              : "bg-[#043084] hover:bg-brand-hover text-white"
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
            className="hidden sm:inline-flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#64748b] transition-all hover:-translate-y-0.5 hover:bg-[#f1f5f9] hover:text-[#043084] hover:shadow-xs"
            title="View public series page"
            aria-label="View public series page"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <button
            type="button"
            onClick={handleCopySeriesLink}
            className="hidden sm:inline-flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#64748b] transition-all hover:-translate-y-0.5 hover:bg-[#f1f5f9] hover:text-[#043084] hover:shadow-xs"
            title="Copy series link"
            aria-label="Copy series link"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={handleShareSeriesLink}
            className="hidden sm:inline-flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#64748b] transition-all hover:-translate-y-0.5 hover:bg-[#f1f5f9] hover:text-[#043084] hover:shadow-xs"
            title="Share series link"
            aria-label="Share series link"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>

          {/* 3-Dot Overflow Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#043084] transition-all hover:-translate-y-0.5 cursor-pointer shadow-xs hover:shadow-sm"
              aria-label="More actions"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-[#e2e8f0] bg-white p-1 shadow-lg z-50 space-y-0.5 animate-in fade-in">
                <button
                  type="button"
                  disabled={epUsage.isLimitReached}
                  onClick={() => {
                    setMenuOpen(false);
                    onAddEpisode(series);
                  }}
                  className="sm:hidden flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#043084] hover:bg-[#f1f5f9] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5 text-[#043084]" />
                  <span>Add Episode</span>
                </button>

                <a
                  href={publicSeriesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="sm:hidden flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#043084] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-[#64748b]" />
                  <span>View Series</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleCopySeriesLink();
                  }}
                  className="sm:hidden flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#043084] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5 text-[#64748b]" />
                  <span>Copy Link</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleShareSeriesLink();
                  }}
                  className="sm:hidden flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#043084] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5 text-[#64748b]" />
                  <span>Share Series</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEditSeries(series);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#043084] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5 text-[#64748b]" />
                  <span>Edit Series</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDeleteSeries(series);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#C2414B] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
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
            className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#043084] transition-all hover:-translate-y-0.5 cursor-pointer shadow-xs hover:shadow-sm"
            aria-expanded={expanded}
            title={expanded ? "Hide episodes" : "Show episodes"}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Episodes List */}
      {expanded && (
        <div className="border-t border-[#e2e8f0] bg-[#f8fafc]/50 last:rounded-b-xl">
          {/* Header strip: Episodes · 1/5 */}
          <div className="px-4 py-1.5 bg-[#f8fafc] flex items-center justify-between border-b border-[#e2e8f0]">
            <span className="text-xs font-medium text-[#043084]">
              Episodes · {episodes.length}/{epUsage.max === Infinity ? "Unlimited" : epUsage.max}
            </span>
            {epUsage.isLimitReached && (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                Episode limit reached
              </span>
            )}
          </div>

          {episodes.length === 0 ? (
            <div className="p-5 text-center space-y-2 bg-white last:rounded-b-xl">
              <p className="text-xs sm:text-sm font-bold text-[#043084]">No episodes added yet</p>
              <p className="text-xs text-[#64748b] max-w-sm mx-auto">
                Add the first part so followers can begin this series.
              </p>
              <button
                type="button"
                onClick={() => onAddEpisode(series)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#043084] hover:bg-brand-hover px-3 py-1.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 cursor-pointer shadow-xs hover:shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add First Episode</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#e2e8f0] bg-white last:rounded-b-xl">
              {series.seasons.flatMap((season) =>
                season.episodes.map((ep, idx) => {
                  const plat = getPlatformInfo(ep.externalUrl);
                  const epNumStr = formatEpisodeNumber(ep.episodeNumber || idx + 1);

                  return (
                    <div
                      key={ep.id}
                      className="px-4 py-2 sm:py-2.5 transition-colors flex items-center justify-between hover:bg-[#f1f5f9] group last:rounded-b-xl"
                    >
                      {/* Left: 01 & Episode Info */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-3">
                        <span className="text-xs font-mono font-bold text-[#64748b] w-6 shrink-0">
                          {epNumStr}
                        </span>

                        <div className="min-w-0 flex-1 text-left space-y-0.5">
                          <p className="truncate text-sm sm:text-[15px] font-semibold text-[#043084]">
                            {ep.title || `Episode ${epNumStr}`}
                          </p>
                          <div className="flex items-center gap-1.5 text-[13px] text-[#475569] font-normal">
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
                            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-xs font-medium text-[#043084] transition-colors shadow-2xs"
                            title="Open original link"
                          >
                            <span>View</span>
                            <ExternalLink className="h-3 w-3 text-[#64748b]" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => onEditEpisode(series, season.id, ep)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-xs font-medium text-[#043084] transition-colors cursor-pointer shadow-2xs"
                          title="Edit Episode"
                        >
                          <Pencil className="h-3 w-3 text-[#64748b]" />
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
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#043084] transition-colors cursor-pointer shadow-2xs"
                            aria-label="Episode options"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>

                          {activeEpMenuId === ep.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1.5 w-36 rounded-xl border border-[#e2e8f0] bg-white p-1 shadow-lg z-50 space-y-0.5 animate-in fade-in"
                            >
                              {ep.externalUrl && (
                                <a
                                  href={ep.externalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setActiveEpMenuId(null)}
                                  className="sm:hidden flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#043084] hover:bg-[#f1f5f9] transition-colors"
                                >
                                  <ExternalLink className="h-3.5 w-3.5 text-[#64748b]" />
                                  <span>View</span>
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveEpMenuId(null);
                                  onDeleteEpisode(series, season.id, ep);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#C2414B] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
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
  const { profile, series, refresh, subscription } = useCreator();
  const { showToast } = useToast();

  const handleStr = profile.username || "creator";
  const cleanHandle = handleStr.replace(/^@/, "") || "creator";
  const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
  const publicSeriesListingUrl = `${origin}/${cleanHandle}/series`;
  const planKey = subscription?.planKey || "early_access";
  const quota = getPlanQuota(planKey);
  const seriesUsage = getSeriesUsage(series, planKey);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSeriesId, setExpandedSeriesId] = useState<string | null>(null);
  const visibleExpandedSeriesId = expandedSeriesId ?? (series.length === 1 ? series[0].id : null);

  // Drawer States
  const [isSeriesDrawerOpen, setIsSeriesDrawerOpen] = useState(false);
  const [seriesToEdit, setSeriesToEdit] = useState<Series | null>(null);

  const [isEpisodeDrawerOpen, setIsEpisodeDrawerOpen] = useState(false);
  const [activeSeriesForEpisode, setActiveSeriesForEpisode] = useState<Series | null>(null);
  const [episodeToEdit, setEpisodeToEdit] = useState<{ seasonId: string; episode: Episode } | null>(null);

  // Confirm Modals
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
      const eps = getSeriesEpisodes(s);
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

  // Handlers
  const handleOpenCreateSeries = () => {
    if (!canCreateSeries(series, planKey)) {
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
    if (!canCreateEpisode(s, planKey)) {
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

  const handleCopySeriesListingLink = async () => {
    const success = await copyToClipboard(publicSeriesListingUrl);
    showToast(success ? "All series listing link copied! 🎬" : "Could not copy series listing link", success ? "success" : "error");
  };

  const handleShareSeriesListingLink = async () => {
    const title = `${profile.displayName || cleanHandle}'s Series on Inflixo`;
    const text = `Explore ${profile.displayName || cleanHandle}'s video series and playlists on Inflixo.`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url: publicSeriesListingUrl });
        return;
      }

      await handleCopySeriesListingLink();
    } catch {
      // User dismissed native share sheet.
    }
  };

  return (
    <div className="space-y-4 sm:space-y-4.5 w-full pb-8 text-left">
      {/* 1. PAGE HEADER: Series + description + Create Series button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Series
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#043084]/10 px-2.5 py-0.5 text-xs font-bold text-[#043084]">
              <Film className="h-3 w-3" />
              <span>{series.length} {series.length === 1 ? "Series" : "Series"}</span>
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
            Group your related video links from Instagram, YouTube, and Facebook into one clean collection fans can follow easily.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <a
            href={publicSeriesListingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#043084] shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-300"
          >
            <span>Live Series</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            onClick={handleOpenCreateSeries}
            disabled={seriesUsage.isLimitReached}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-2xs cursor-pointer ${seriesUsage.isLimitReached
              ? "bg-[#f8fafc] border border-[#e2e8f0] text-[#64748b] opacity-60 cursor-not-allowed"
              : "bg-[#043084] hover:bg-brand-hover text-white"
              }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Series</span>
          </button>
        </div>
      </div>

      {/* COMPACT CONTENT INFO ROW */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-[#e2e8f0] bg-white px-4 py-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium text-[#043084]">
            <span className="font-semibold text-[#043084]">
              {series.length} / {seriesUsage.max === Infinity ? "Unlimited" : seriesUsage.max} Series
            </span>
            <span className="text-[#64748b]/40">·</span>
            <span className="font-semibold text-[#043084]">
              {totalEpisodesCount} {totalEpisodesCount === 1 ? "Episode" : "Episodes"}
            </span>
            <span className="text-[#64748b]/40">·</span>
            <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.2 rounded-full bg-[#043084]/[0.08] text-[#043084] border border-[#043084]/20">
              {quota.name}
            </span>
          </div>

          <div className="text-xs text-[#64748b] font-normal">
            {seriesUsage.max === Infinity
              ? "Unlimited series slots"
              : seriesUsage.max - series.length > 0
                ? `${seriesUsage.max - series.length} series slots remaining`
                : "All series slots filled"}
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#64748b]">All series listing link</p>
            <p className="mt-0.5 truncate text-xs font-semibold text-[#043084]">{publicSeriesListingUrl}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopySeriesListingLink}
              className="inline-flex h-7.5 items-center gap-1 rounded-md border border-[#e2e8f0] bg-white px-2.5 text-xs font-semibold text-[#043084] transition-colors hover:bg-[#f1f5f9]"
            >
              <Copy className="h-3 w-3 text-[#64748b]" />
              <span>Copy</span>
            </button>
            <button
              type="button"
              onClick={handleShareSeriesListingLink}
              className="inline-flex h-7.5 items-center gap-1 rounded-md bg-[#043084] px-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              <Share2 className="h-3 w-3" />
              <span>Share</span>
            </button>
            <a
              href={publicSeriesListingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7.5 items-center gap-1 rounded-md border border-[#e2e8f0] bg-white px-2.5 text-xs font-semibold text-[#043084] transition-colors hover:bg-[#f1f5f9]"
            >
              <ExternalLink className="h-3 w-3 text-[#64748b]" />
              <span>View</span>
            </a>
          </div>
        </div>
      </div>

      {/* TOOLBAR (Search) if multiple series */}
      {series.length > 1 && (
        <div className="flex items-center justify-between gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748b]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search series..."
              className="w-full h-9 rounded-lg border border-[#e2e8f0] bg-white pl-8.5 pr-3 text-xs text-[#043084] placeholder:text-[#64748b]/60 focus:outline-none focus:border-[#043084] focus:ring-2 focus:ring-[#043084]/10 transition-colors"
            />
          </div>
        </div>
      )}

      {/* SERIES LIST SECTION */}
      <div className="space-y-2.5">
        <h2 className="text-sm sm:text-base font-bold text-[#043084]">
          Series
        </h2>

        {/* Clean Empty State */}
        {series.length === 0 ? (
          <EmptyState
            icon={<Film className="h-7 w-7" />}
            title="Create your first series"
            description="Organize multi-part content so your audience can watch it in order."
            action={
              <button
                type="button"
                onClick={handleOpenCreateSeries}
                className="inline-flex items-center gap-2 rounded-[10px] bg-[#043084] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-md cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Create Your First Series</span>
              </button>
            }
          />
        ) : filteredSeries.length === 0 ? (
          <EmptyState
            icon={<Film className="h-7 w-7" />}
            title="No matching series found"
            description={`No series matching "${searchQuery}". Try adjusting your search query.`}
          />
        ) : (
          <div className="rounded-xl border border-[#e2e8f0] bg-white divide-y divide-[#e2e8f0] shadow-xs">
            {filteredSeries.map((s) => (
              <SeriesCard
                key={s.id}
                series={s}
                username={handleStr}
                planKey={planKey}
                expanded={visibleExpandedSeriesId === s.id}
                onToggle={() => setExpandedSeriesId(visibleExpandedSeriesId === s.id ? null : s.id)}
                onEditSeries={handleOpenEditSeries}
                onDeleteSeries={promptDeleteSeries}
                onAddEpisode={handleOpenAddEpisode}
                onEditEpisode={handleOpenEditEpisode}
                onDeleteEpisode={promptDeleteEpisode}
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. DRAWERS & MODALS */}
      <SeriesDrawer
        key={seriesToEdit ? `edit-${seriesToEdit.id}` : `create-${isSeriesDrawerOpen ? "open" : "closed"}`}
        isOpen={isSeriesDrawerOpen}
        onClose={() => setIsSeriesDrawerOpen(false)}
        seriesToEdit={seriesToEdit}
        seriesList={series}
        planKey={planKey}
        onSaved={refresh}
        onLimitTrigger={() => setLimitModalState({ isOpen: true, type: "series" })}
      />

      <EpisodeDrawer
        key={episodeToEdit ? `edit-${episodeToEdit.episode.id}` : `create-${activeSeriesForEpisode?.id || "none"}-${isEpisodeDrawerOpen ? "open" : "closed"}`}
        isOpen={isEpisodeDrawerOpen}
        onClose={() => setIsEpisodeDrawerOpen(false)}
        series={activeSeriesForEpisode}
        planKey={planKey}
        episodeToEdit={episodeToEdit}
        onSaved={refresh}
        onLimitTrigger={(seriesTitle) => setLimitModalState({ isOpen: true, type: "episode", seriesTitle })}
      />

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
