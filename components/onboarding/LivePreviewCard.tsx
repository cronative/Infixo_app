import { useState } from "react";
import { Users, Sparkles, ExternalLink, Play, Film, Share2, ChevronDown, ChevronUp, ChevronRight, Copy } from "lucide-react";
import { CreatorProfile, SocialAccounts, ThemeKey, Series } from "@/types";
import { formatCount } from "@/utils/format";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { InflixoLogoIcon } from "@/components/shared/Logo";
import { useToast } from "@/contexts/ToastContext";
import { ShareSeriesModal } from "@/components/shared/ShareSeriesModal";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { SeriesPoster } from "@/components/shared/SeriesPoster";

export interface ThemeStyleConfig {
  cardBg?: string;
  profBadgeBg: string;
  profBadgeText: string;
  profBadgeBorder: string;
  fanbaseBg: string;
  fanbaseText: string;
  socialItemBg: string;
  socialItemBorder: string;
  socialNameColor: string;
  socialUnitColor: string;
  nameColor: string;
  bioColor: string;
  handleColor: string;
}

export const DEFAULT_THEME_STYLE: ThemeStyleConfig = {
  cardBg: "bg-white/95 backdrop-blur-xl border border-slate-200/80 text-slate-900 shadow-xl",
  profBadgeBg: "bg-[#782BFB]/10",
  profBadgeText: "text-[#782BFB]",
  profBadgeBorder: "border-[#782BFB]/30",
  fanbaseBg: "bg-[#782BFB]/10",
  fanbaseText: "text-[#782BFB]",
  socialItemBg: "bg-white/80 backdrop-blur-xs",
  socialItemBorder: "border-slate-200/80",
  socialNameColor: "text-slate-800",
  socialUnitColor: "text-slate-500",
  nameColor: "text-slate-900",
  bioColor: "text-slate-600",
  handleColor: "text-purple-600",
};

const DARK_PURPLE_STYLE: ThemeStyleConfig = {
  cardBg: "bg-slate-950/90 backdrop-blur-xl border border-purple-500/30 text-white shadow-2xl",
  profBadgeBg: "bg-purple-500/20",
  profBadgeText: "text-purple-300",
  profBadgeBorder: "border-purple-500/30",
  fanbaseBg: "bg-purple-500/20",
  fanbaseText: "text-purple-300",
  socialItemBg: "bg-slate-900/80 backdrop-blur-md",
  socialItemBorder: "border-purple-500/20",
  socialNameColor: "text-white",
  socialUnitColor: "text-purple-200/70",
  nameColor: "text-white",
  bioColor: "text-purple-100/80",
  handleColor: "text-purple-400",
};

const OCEAN_BLUE_STYLE: ThemeStyleConfig = {
  cardBg: "bg-slate-950/90 backdrop-blur-xl border border-blue-500/30 text-white shadow-2xl",
  profBadgeBg: "bg-blue-500/20",
  profBadgeText: "text-blue-300",
  profBadgeBorder: "border-blue-500/30",
  fanbaseBg: "bg-blue-500/20",
  fanbaseText: "text-blue-300",
  socialItemBg: "bg-slate-900/80 backdrop-blur-md",
  socialItemBorder: "border-blue-500/20",
  socialNameColor: "text-white",
  socialUnitColor: "text-blue-200/70",
  nameColor: "text-white",
  bioColor: "text-blue-100/80",
  handleColor: "text-blue-400",
};

const EMERALD_LUXE_STYLE: ThemeStyleConfig = {
  cardBg: "bg-emerald-950/90 backdrop-blur-xl border border-emerald-500/30 text-white shadow-2xl",
  profBadgeBg: "bg-emerald-500/20",
  profBadgeText: "text-emerald-300",
  profBadgeBorder: "border-emerald-500/30",
  fanbaseBg: "bg-emerald-500/20",
  fanbaseText: "text-emerald-300",
  socialItemBg: "bg-emerald-900/80 backdrop-blur-md",
  socialItemBorder: "border-emerald-500/20",
  socialNameColor: "text-white",
  socialUnitColor: "text-emerald-200/70",
  nameColor: "text-white",
  bioColor: "text-emerald-100/80",
  handleColor: "text-emerald-400",
};

const CRIMSON_VELVET_STYLE: ThemeStyleConfig = {
  cardBg: "bg-rose-950/90 backdrop-blur-xl border border-rose-500/30 text-white shadow-2xl",
  profBadgeBg: "bg-rose-500/20",
  profBadgeText: "text-rose-300",
  profBadgeBorder: "border-rose-500/30",
  fanbaseBg: "bg-rose-500/20",
  fanbaseText: "text-rose-300",
  socialItemBg: "bg-rose-900/80 backdrop-blur-md",
  socialItemBorder: "border-rose-500/20",
  socialNameColor: "text-white",
  socialUnitColor: "text-rose-200/70",
  nameColor: "text-white",
  bioColor: "text-rose-100/80",
  handleColor: "text-rose-400",
};

const NEON_PULSE_STYLE: ThemeStyleConfig = {
  cardBg: "bg-zinc-950/90 backdrop-blur-xl border border-cyan-500/30 text-white shadow-2xl",
  profBadgeBg: "bg-cyan-500/20",
  profBadgeText: "text-cyan-300",
  profBadgeBorder: "border-cyan-500/30",
  fanbaseBg: "bg-cyan-500/20",
  fanbaseText: "text-cyan-300",
  socialItemBg: "bg-zinc-900/80 backdrop-blur-md",
  socialItemBorder: "border-cyan-500/20",
  socialNameColor: "text-white",
  socialUnitColor: "text-cyan-200/70",
  nameColor: "text-white",
  bioColor: "text-cyan-100/80",
  handleColor: "text-cyan-400",
};

const SUNSET_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-orange-600 via-rose-600 to-purple-700 text-white border border-orange-400/30 shadow-2xl",
  profBadgeBg: "bg-white/20",
  profBadgeText: "text-white",
  profBadgeBorder: "border-white/30",
  fanbaseBg: "bg-white/20",
  fanbaseText: "text-white",
  socialItemBg: "bg-black/20 backdrop-blur-md",
  socialItemBorder: "border-white/20",
  socialNameColor: "text-white",
  socialUnitColor: "text-rose-100/80",
  nameColor: "text-white",
  bioColor: "text-orange-50",
  handleColor: "text-amber-200",
};

const ROSE_GOLD_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-[#fbe9ec] via-pink-50 to-amber-50 text-[#3a1f24] border border-rose-200 shadow-xl",
  profBadgeBg: "bg-rose-100/80",
  profBadgeText: "text-rose-900",
  profBadgeBorder: "border-rose-200",
  fanbaseBg: "bg-rose-100/80",
  fanbaseText: "text-rose-900",
  socialItemBg: "bg-white/80 backdrop-blur-xs",
  socialItemBorder: "border-rose-200/80",
  socialNameColor: "text-[#3a1f24]",
  socialUnitColor: "text-rose-700/70",
  nameColor: "text-[#3a1f24]",
  bioColor: "text-rose-900/80",
  handleColor: "text-rose-700",
};

const MONO_STYLE: ThemeStyleConfig = {
  cardBg: "bg-black text-white border border-zinc-800 shadow-2xl",
  profBadgeBg: "bg-zinc-900",
  profBadgeText: "text-white",
  profBadgeBorder: "border-zinc-700",
  fanbaseBg: "bg-zinc-900",
  fanbaseText: "text-white",
  socialItemBg: "bg-zinc-900/90 backdrop-blur-md",
  socialItemBorder: "border-zinc-800",
  socialNameColor: "text-white",
  socialUnitColor: "text-zinc-400",
  nameColor: "text-white",
  bioColor: "text-zinc-300",
  handleColor: "text-zinc-400",
};

const PASTEL_DREAM_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-purple-100 via-pink-100 to-amber-100 text-slate-900 border border-purple-200 shadow-xl",
  profBadgeBg: "bg-white/70",
  profBadgeText: "text-purple-900",
  profBadgeBorder: "border-purple-200",
  fanbaseBg: "bg-white/70",
  fanbaseText: "text-purple-900",
  socialItemBg: "bg-white/80 backdrop-blur-xs",
  socialItemBorder: "border-purple-200/80",
  socialNameColor: "text-slate-900",
  socialUnitColor: "text-slate-600",
  nameColor: "text-slate-900",
  bioColor: "text-slate-700",
  handleColor: "text-purple-700",
};

const SOLAR_FLARE_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 text-white border border-amber-300/40 shadow-2xl",
  profBadgeBg: "bg-white/20",
  profBadgeText: "text-white",
  profBadgeBorder: "border-white/30",
  fanbaseBg: "bg-white/20",
  fanbaseText: "text-white",
  socialItemBg: "bg-black/20 backdrop-blur-md",
  socialItemBorder: "border-white/20",
  socialNameColor: "text-white",
  socialUnitColor: "text-amber-100/90",
  nameColor: "text-white",
  bioColor: "text-amber-50",
  handleColor: "text-amber-200",
};

const LAVENDER_HAZE_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-[#faf5ff] via-purple-50 to-indigo-50 text-slate-900 border border-purple-200 shadow-xl",
  profBadgeBg: "bg-purple-100",
  profBadgeText: "text-purple-800",
  profBadgeBorder: "border-purple-300",
  fanbaseBg: "bg-purple-100",
  fanbaseText: "text-purple-800",
  socialItemBg: "bg-white/80 backdrop-blur-xs",
  socialItemBorder: "border-purple-200",
  socialNameColor: "text-slate-900",
  socialUnitColor: "text-purple-700/70",
  nameColor: "text-slate-900",
  bioColor: "text-slate-700",
  handleColor: "text-purple-600",
};

const NORDIC_FROST_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-[#0c4a6e] via-sky-950 to-slate-950 text-white border border-sky-400/30 shadow-2xl",
  profBadgeBg: "bg-sky-500/20",
  profBadgeText: "text-sky-300",
  profBadgeBorder: "border-sky-400/30",
  fanbaseBg: "bg-sky-500/20",
  fanbaseText: "text-sky-300",
  socialItemBg: "bg-sky-950/70 backdrop-blur-md",
  socialItemBorder: "border-sky-400/20",
  socialNameColor: "text-white",
  socialUnitColor: "text-sky-200/70",
  nameColor: "text-white",
  bioColor: "text-sky-100/80",
  handleColor: "text-sky-300",
};

const GOLDEN_HOUR_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-[#fef3c7] via-amber-100 to-orange-100 text-[#78350f] border border-amber-300 shadow-xl",
  profBadgeBg: "bg-amber-200/70",
  profBadgeText: "text-amber-900",
  profBadgeBorder: "border-amber-300",
  fanbaseBg: "bg-amber-200/70",
  fanbaseText: "text-amber-900",
  socialItemBg: "bg-white/80 backdrop-blur-xs",
  socialItemBorder: "border-amber-200",
  socialNameColor: "text-[#78350f]",
  socialUnitColor: "text-amber-800/70",
  nameColor: "text-[#78350f]",
  bioColor: "text-amber-900/80",
  handleColor: "text-amber-700",
};

const COSMIC_GALAXY_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-[#1e1b4b] via-indigo-950 to-purple-950 text-white border border-purple-400/30 shadow-2xl",
  profBadgeBg: "bg-purple-500/20",
  profBadgeText: "text-purple-300",
  profBadgeBorder: "border-purple-400/30",
  fanbaseBg: "bg-purple-500/20",
  fanbaseText: "text-purple-300",
  socialItemBg: "bg-indigo-950/70 backdrop-blur-md",
  socialItemBorder: "border-purple-400/20",
  socialNameColor: "text-white",
  socialUnitColor: "text-purple-200/70",
  nameColor: "text-white",
  bioColor: "text-purple-100/80",
  handleColor: "text-purple-300",
};

const TOKYO_DRIFT_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-[#030712] via-slate-950 to-rose-950 text-white border border-rose-500/40 shadow-2xl",
  profBadgeBg: "bg-rose-500/20",
  profBadgeText: "text-rose-300",
  profBadgeBorder: "border-rose-500/40",
  fanbaseBg: "bg-purple-500/20",
  fanbaseText: "text-purple-300",
  socialItemBg: "bg-slate-900/90 backdrop-blur-md",
  socialItemBorder: "border-rose-500/30",
  socialNameColor: "text-white",
  socialUnitColor: "text-rose-200/70",
  nameColor: "text-white",
  bioColor: "text-rose-100/80",
  handleColor: "text-rose-400",
};

const RETRO_SYNTH_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-[#581c87] via-purple-950 to-slate-950 text-white border border-teal-400/40 shadow-2xl",
  profBadgeBg: "bg-teal-500/20",
  profBadgeText: "text-teal-300",
  profBadgeBorder: "border-teal-400/40",
  fanbaseBg: "bg-rose-500/20",
  fanbaseText: "text-rose-300",
  socialItemBg: "bg-purple-950/70 backdrop-blur-md",
  socialItemBorder: "border-teal-400/30",
  socialNameColor: "text-white",
  socialUnitColor: "text-teal-200/70",
  nameColor: "text-white",
  bioColor: "text-teal-100/80",
  handleColor: "text-teal-300",
};

export const THEME_STYLES: Record<string, ThemeStyleConfig> = {
  "minimal-white": DEFAULT_THEME_STYLE,
  "modern-purple": DARK_PURPLE_STYLE,
  midnight: DARK_PURPLE_STYLE,
  "ocean-blue": OCEAN_BLUE_STYLE,
  sunset: SUNSET_STYLE,
  forest: EMERALD_LUXE_STYLE,
  "rose-gold": ROSE_GOLD_STYLE,
  mono: MONO_STYLE,
  "neon-pulse": NEON_PULSE_STYLE,
  "pastel-dream": PASTEL_DREAM_STYLE,
  cyberpunk: NEON_PULSE_STYLE,
  "emerald-luxe": EMERALD_LUXE_STYLE,
  "crimson-velvet": CRIMSON_VELVET_STYLE,
  "solar-flare": SOLAR_FLARE_STYLE,
  "lavender-haze": LAVENDER_HAZE_STYLE,
  "nordic-frost": NORDIC_FROST_STYLE,
  "golden-hour": GOLDEN_HOUR_STYLE,
  "cosmic-galaxy": COSMIC_GALAXY_STYLE,
  "tokyo-drift": TOKYO_DRIFT_STYLE,
  "retro-synth": RETRO_SYNTH_STYLE,
};

function getHandle(url: string): string {
  if (!url) return "";
  const cleaned = url.trim();
  if (cleaned.includes("/")) {
    const parts = cleaned.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    return last.replace(/^@/, "");
  }
  return cleaned.replace(/^@/, "");
}

export function buildSocialUrl(platform: "instagram" | "youtube" | "facebook", rawUrlOrHandle?: string): string {
  if (!rawUrlOrHandle || !rawUrlOrHandle.trim()) return "#";
  const raw = rawUrlOrHandle.trim();
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const clean = raw.replace(/^@/, "");

  switch (platform) {
    case "instagram":
      return `https://instagram.com/${clean}`;
    case "youtube":
      return clean.startsWith("channel/") || clean.startsWith("c/") || clean.startsWith("@")
        ? `https://youtube.com/${clean}`
        : `https://youtube.com/@${clean}`;
    case "facebook":
      return `https://facebook.com/${clean}`;
  }
}

export interface LivePreviewCardProps {
  profile: CreatorProfile;
  socials: SocialAccounts;
  series?: Series[];
  totalAudience?: number;
  themeKey?: ThemeKey;
  compact?: boolean;
  variant?: "compact" | "full";
  onShare?: () => void;
}

function getSeriesEpisodes(s: Series): any[] {
  if (s && Array.isArray(s.seasons) && s.seasons.length > 0) {
    return s.seasons.flatMap((sn) => (sn && Array.isArray(sn.episodes)) ? sn.episodes : []);
  }
  if (s && Array.isArray((s as any).episodes)) {
    return (s as any).episodes;
  }
  return [];
}

export function LivePreviewCard({
  profile,
  socials,
  series = [],
  totalAudience: passedTotalAudience,
  themeKey = "minimal-white",
  compact = false,
  variant,
  onShare,
}: LivePreviewCardProps) {
  const { showToast } = useToast();
  const [expandedSeriesId, setExpandedSeriesId] = useState<string | null>(null);

  const style = THEME_STYLES[themeKey] || DEFAULT_THEME_STYLE;
  const totalEpisodesCount = (series || []).reduce((acc, s) => acc + getSeriesEpisodes(s).length, 0);

  const calculatedTotal =
    (socials.instagram.followers || 0) +
    (socials.youtube.subscribers || 0) +
    (socials.facebook.followers || 0);

  const totalAudience = passedTotalAudience !== undefined ? passedTotalAudience : calculatedTotal;

  const instaHandle = socials.instagram.username || getHandle(socials.instagram.url || "");
  const ytHandle = socials.youtube.username || getHandle(socials.youtube.url || "");
  const fbHandle = socials.facebook.username || getHandle(socials.facebook.url || "");

  const activeSocialList = [
    {
      platform: "instagram",
      label: "Instagram",
      name: socials.instagram.name,
      icon: <InstagramIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-xs",
      handle: instaHandle,
      count: socials.instagram.followers,
      unit: "Followers",
      url: buildSocialUrl("instagram", socials.instagram.url || socials.instagram.username || instaHandle),
      hasAccount: Boolean(instaHandle || socials.instagram.followers > 0 || socials.instagram.url || socials.instagram.username),
    },
    {
      platform: "youtube",
      label: "YouTube",
      name: socials.youtube.channelTitle,
      icon: <YoutubeIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-red-600 shadow-xs",
      handle: ytHandle,
      count: socials.youtube.subscribers,
      unit: "Subscribers",
      url: buildSocialUrl("youtube", socials.youtube.url || socials.youtube.username || ytHandle),
      hasAccount: Boolean(ytHandle || socials.youtube.subscribers > 0 || socials.youtube.url || socials.youtube.username),
    },
    {
      platform: "facebook",
      label: "Facebook",
      name: socials.facebook.name,
      icon: <FacebookIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-blue-600 shadow-xs",
      handle: fbHandle,
      count: socials.facebook.followers,
      unit: "Followers",
      url: buildSocialUrl("facebook", socials.facebook.url || socials.facebook.username || fbHandle),
      hasAccount: Boolean(fbHandle || socials.facebook.followers > 0 || socials.facebook.url || socials.facebook.username),
    },
  ].filter((item) => item.hasAccount || item.count > 0 || (item.url && item.url !== "#"));

  const handleCopyClick = async () => {
    const cleanUsername = profile.username || "username";
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/${cleanUsername}` : "";
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Profile link copied to clipboard! ✨");
      }
    } catch {
      showToast("Could not copy link", "error");
    }
  };

  const handleShareClick = async () => {
    if (onShare) {
      onShare();
      return;
    }
    const cleanUsername = profile.username || "username";
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/${cleanUsername}` : "";
    const title = `${profile.displayName || "Creator"} on Inflixo`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url: shareUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Profile link copied to clipboard! ✨");
      }
    } catch {
      // User dismissed share sheet
    }
  };

  return (
    <div className={`relative w-full mx-auto transition-all ${variant === "full" ? "max-w-4xl" : "max-w-xl sm:max-w-[540px]"}`}>

      <div className={`relative overflow-hidden rounded-[32px] p-4 sm:p-6 transition-all ${style.cardBg || DEFAULT_THEME_STYLE.cardBg}`}>
        {/* Top Header Bar */}
        <div className="relative z-10 flex items-center justify-between w-full mb-4 px-1">
          <div
            className={`tap-scale flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-2xs transition-all ${style.socialItemBg} ${style.socialItemBorder}`}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-gradient-to-br from-[#782BFB] via-[#6512FA] to-[#500CD6] text-white shadow-2xs">
              <InflixoLogoIcon className="h-3.5 w-3.5" />
            </div>
            <span className={`font-display text-sm font-black tracking-tight ${style.nameColor}`}>
              Inflixo
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyClick}
              className={`tap-scale flex h-9 w-9 items-center justify-center rounded-full border shadow-2xs transition-all hover:scale-105 ${style.socialItemBg} ${style.socialItemBorder} ${style.nameColor}`}
              title="Copy Profile Link"
              aria-label="Copy Profile Link"
            >
              <Copy className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleShareClick}
              className={`tap-scale flex h-9 w-9 items-center justify-center rounded-full border shadow-2xs transition-all hover:scale-105 ${style.socialItemBg} ${style.socialItemBorder} ${style.nameColor}`}
              title="Share Profile"
              aria-label="Share Profile"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative">
            <CreatorAvatar
              src={profile.photoDataUrl}
              name={profile.displayName || "Creator"}
              className="h-24 w-24 rounded-full shadow-lg border-2 border-white"
              textClassName="text-3xl font-extrabold text-white"
              fallbackBgClass="bg-gradient-to-br from-[#782BFB] to-[#500CD6]"
            />
          </div>

          <h3 className={`mt-3.5 text-lg font-extrabold tracking-tight sm:text-xl ${style.nameColor}`}>
            {profile.displayName || "Your Name"}
          </h3>

          {/* Username Link with Direct Copy Icon */}
          <button
            type="button"
            onClick={() => {
              const handle = profile.username || "username";
              const profileUrl = `${window.location.origin}/${handle}`;
              if (navigator.clipboard) {
                navigator.clipboard.writeText(profileUrl);
                showToast("Profile link copied to clipboard! ✨");
              }
            }}
            className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shadow-2xs transition-all hover:scale-105 ${style.socialItemBg} ${style.socialItemBorder} ${style.handleColor}`}
            title="Click to copy profile link"
          >
            <span>{profile.username ? `inflixo.com/${profile.username}` : "inflixo.com/username"}</span>
            <Copy className="h-3 w-3 opacity-70" />
          </button>

          {/* Uniform Soft-Chip Category & Sub-type Pills */}
          {(() => {
            const allChips: string[] = [];
            if (profile.category) {
              profile.category.split(",").forEach((c) => {
                const trimmed = c.trim();
                if (trimmed.toLowerCase() === "other") {
                  if (profile.customCategory?.trim()) allChips.push(profile.customCategory.trim());
                } else if (trimmed) {
                  allChips.push(trimmed);
                }
              });
            }
            if (profile.profession) {
              profile.profession.split(",").forEach((p) => {
                const trimmed = p.trim();
                if (trimmed) allChips.push(trimmed);
              });
            }
            if (allChips.length === 0) return null;

            const visibleChips = allChips.slice(0, 4);
            const remainingCount = allChips.length - 4;

            return (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 max-w-sm">
                {visibleChips.map((chip, idx) => (
                  <span
                    key={idx}
                    className={`rounded-full border px-3 py-1 text-[11px] font-extrabold shadow-2xs transition-all ${style.profBadgeBg} ${style.profBadgeText} ${style.profBadgeBorder}`}
                  >
                    {chip}
                  </span>
                ))}
                {remainingCount > 0 && (
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-extrabold shadow-2xs ${style.profBadgeBg} ${style.profBadgeText} ${style.profBadgeBorder}`}
                  >
                    +{remainingCount}
                  </span>
                )}
              </div>
            );
          })()}

          <p className={`mt-3 text-xs sm:text-sm leading-relaxed font-medium line-clamp-3 px-1 ${style.bioColor}`}>
            {profile.bio || "Your bio will appear here. Share your story with your audience."}
          </p>

          {/* Clean Sober Fanbase Card */}
          <div className={`mt-4 rounded-2xl border p-3.5 text-center w-full shadow-2xs ${style.socialItemBg} ${style.socialItemBorder}`}>
            <div className="flex items-center justify-center gap-2">
              <span className="text-base">❤️</span>
              <span className={`font-display text-lg sm:text-xl font-black ${style.nameColor}`}>
                {formatCount(totalAudience)}
              </span>
            </div>
            <p className={`text-[10px] font-extrabold uppercase tracking-widest mt-0.5 opacity-60 ${style.socialNameColor}`}>
              TOTAL FANBASE
            </p>
          </div>
        </div>

        {/* Social Connection Link Cards (Touch-Friendly 44px min tap target) */}
        {activeSocialList.length > 0 && (
          <div className="relative z-10 mt-4 space-y-2 w-full">
            <div className="grid grid-cols-1 gap-2.5 w-full">
              {activeSocialList.map((item) => (
                <a
                  key={item.platform}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center justify-between rounded-2xl border p-3 transition-all hover:scale-[1.01] ${style.socialItemBg} ${style.socialItemBorder}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.badgeBg}`}>
                      {item.icon}
                    </span>
                    <div className="min-w-0 text-left space-y-0.5">
                      <p className={`truncate text-xs font-black leading-tight ${style.socialNameColor}`}>
                        {item.label}
                      </p>
                      {item.handle && (
                        <p className={`truncate text-[11px] font-semibold opacity-80 leading-snug ${style.socialUnitColor}`}>
                          @{item.handle.replace(/^@/, "")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className={`font-display text-xs font-black leading-tight ${style.socialNameColor}`}>
                        {formatCount(item.count)}
                      </p>
                      <p className={`text-[9px] font-extrabold tracking-tight opacity-75 ${style.socialUnitColor}`}>
                        {item.unit}
                      </p>
                    </div>
                    {/* Touch-Friendly Action Button Target */}
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white">
                      <ExternalLink className="h-4 w-4" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {series && series.length > 0 && (
          <div className="relative z-10 mt-6 space-y-3 w-full text-left">
            <div className="text-center space-y-0.5">
              <p className="text-xs font-black uppercase tracking-wider opacity-60">
                SERIES
              </p>
              <p className={`text-[11px] font-extrabold ${style.handleColor}`}>
                🎬 {series.length} {series.length === 1 ? "Series" : "Series"} · {totalEpisodesCount} {totalEpisodesCount === 1 ? "Episode" : "Episodes"}
              </p>
            </div>

            <div className="space-y-4">
              {series.map((s) => (
                <PreviewSeriesItem
                  key={s.id}
                  series={s}
                  style={style}
                  themeKey={themeKey}
                  username={profile.username}
                  expanded={expandedSeriesId === s.id}
                  onToggle={() => setExpandedSeriesId(expandedSeriesId === s.id ? null : s.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="relative z-10 mt-6 pt-3 text-center space-y-2.5">
          <div className="flex flex-col items-center justify-center gap-1.5">
            <span className={`text-xs font-bold opacity-80 ${style.handleColor}`}>
              inflixo.com/{profile.username || "username"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPlatformInfo(platformStr?: string, urlStr?: string) {
  const p = (platformStr || "").toLowerCase();
  const u = (urlStr || "").toLowerCase();

  if (p.includes("youtube") || u.includes("youtube.com") || u.includes("youtu.be")) {
    return {
      name: "YouTube",
      icon: <YoutubeIcon className="h-4 w-4 text-white" />,
      badgeClass: "bg-red-600 text-white shadow-xs",
    };
  }
  if (p.includes("instagram") || u.includes("instagram.com")) {
    return {
      name: "Instagram",
      icon: <InstagramIcon className="h-4 w-4 text-white" />,
      badgeClass: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-xs",
    };
  }
  if (p.includes("facebook") || u.includes("facebook.com")) {
    return {
      name: "Facebook",
      icon: <FacebookIcon className="h-4 w-4 text-white" />,
      badgeClass: "bg-blue-600 text-white shadow-xs",
    };
  }
  return {
    name: platformStr || "Web",
    icon: <Film className="h-4 w-4 text-white" />,
    badgeClass: "bg-purple-600 text-white shadow-xs",
  };
}

function PreviewSeriesItem({
  series,
  style,
  username,
  expanded = false,
  onToggle,
  onShareSeries,
}: {
  series: Series;
  style: any;
  themeKey?: ThemeKey;
  username?: string;
  expanded?: boolean;
  onToggle?: () => void;
  onShareSeries?: (series: Series) => void;
}) {
  const { showToast } = useToast();
  const allEpisodes = getSeriesEpisodes(series);
  const genresList = series.genre ? series.genre.split(",").map((g) => g.trim()).filter(Boolean) : [];

  const handleShareSeriesLink = () => {
    const handle = username || "creator";
    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}/${handle}/series/${series.id}`
      : `https://inflixo.com/${handle}/series/${series.id}`;
    const title = `${series.title} on Inflixo`;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title, url: shareUrl }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast("Series link copied to clipboard! 🎬");
    }
  };

  return (
    <div
      id={`series-${series.id}`}
      className={`overflow-hidden rounded-2xl border transition-all duration-200 shadow-xs ${style.socialItemBg} ${style.socialItemBorder}`}
    >
      <div onClick={onToggle} className="cursor-pointer select-none">
        {/* Clean 16:9 Widescreen Cover Image Container (No Text Overlap Conflict) */}
        <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-950 flex items-center justify-center border-b border-slate-500/20">
          <SeriesPoster
            src={series.posterDataUrl}
            title={series.title}
            className="h-full w-full object-cover"
            textClassName="text-xs font-black text-purple-200"
          />

          {/* Top-Right Share Button */}
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleShareSeriesLink();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all border border-white/20 shadow-xs"
              title="Share Series Link"
              aria-label="Share Series"
            >
              <Share2 className="h-4 w-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Details Container Below Poster */}
        <div className="p-3.5 sm:p-4 space-y-2 text-left">
          {/* Title */}
          <h3 className={`text-base sm:text-lg font-black leading-snug break-words ${style.nameColor}`}>
            {series.title}
          </h3>

          {/* Micro-Badge Genre Chips */}
          {genresList.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {genresList.map((g, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-md border border-purple-200/60 bg-purple-50/60 px-2 py-0.5 text-[10px] font-extrabold text-purple-700"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Description if present */}
          {series.description && (
            <p className={`text-xs font-medium leading-relaxed break-words opacity-75 ${expanded ? "" : "line-clamp-2"} ${style.bioColor}`}>
              {series.description}
            </p>
          )}

          {/* Bottom Row: Episode Count + Prominent Primary Watch Series CTA Button */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200/20">
            <span className={`text-xs font-black ${style.handleColor}`}>
              🎬 {allEpisodes.length} {allEpisodes.length === 1 ? "Episode" : "Episodes"}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle?.();
              }}
              className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-xs transition-all"
            >
              <span>{expanded ? "Hide Episodes ↑" : "Watch Series →"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Episodes Section */}
      {expanded && allEpisodes.length > 0 && (
        <div className={`p-3.5 sm:p-4 space-y-2.5 animate-in fade-in duration-200 border-t ${style.socialItemBorder}`}>
          <div className="space-y-2">
            {allEpisodes.map((ep) => {
              const plat = getPlatformInfo(ep.platform, ep.externalUrl);
              const epNumStr = ep.episodeNumber < 10 ? `E0${ep.episodeNumber}` : `E${ep.episodeNumber}`;
              const epTitleStr = ep.title && ep.title.trim() ? ep.title : `Part ${ep.episodeNumber}`;

              return (
                <a
                  key={ep.id}
                  href={ep.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center justify-between rounded-xl border p-2.5 transition-all hover:scale-[1.01] ${style.socialItemBg} ${style.socialItemBorder}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-2xs ${plat.badgeClass}`}>
                      {plat.icon}
                    </span>
                    <div className="min-w-0 text-left">
                      <p className={`truncate text-xs font-extrabold ${style.socialNameColor}`}>
                        {epNumStr} • {epTitleStr}
                      </p>
                      <p className={`truncate text-[10px] font-medium opacity-75 ${style.socialUnitColor}`}>
                        {plat.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <ExternalLink className={`h-3.5 w-3.5 opacity-75 group-hover:opacity-100 transition-opacity ${style.socialNameColor}`} />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
