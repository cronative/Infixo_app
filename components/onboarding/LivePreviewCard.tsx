import { useState, useEffect } from "react";
import { Users, Sparkles, ExternalLink, Play, Film, Eye, ChevronDown, ChevronUp, Share2, ChevronRight } from "lucide-react";
import { CreatorProfile, SocialAccounts, ThemeKey, Series } from "@/types";
import { formatCount, initials } from "@/utils/format";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { Logo, InflixoLogoIcon } from "@/components/shared/Logo";
import { useToast } from "@/contexts/ToastContext";
import { ShareSeriesModal } from "@/components/shared/ShareSeriesModal";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { SeriesPoster } from "@/components/shared/SeriesPoster";

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

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  const clean = raw.replace(/^@/, "");

  if (platform === "instagram") {
    if (clean.toLowerCase().includes("instagram.com/")) {
      return `https://${clean.replace(/^https?:\/\//i, "")}`;
    }
    return `https://instagram.com/${clean}`;
  }

  if (platform === "youtube") {
    if (clean.toLowerCase().includes("youtube.com/")) {
      return `https://${clean.replace(/^https?:\/\//i, "")}`;
    }
    if (clean.startsWith("UC") || clean.startsWith("channel/")) {
      return `https://youtube.com/${clean.startsWith("channel/") ? clean : `channel/${clean}`}`;
    }
    return `https://youtube.com/@${clean}`;
  }

  if (platform === "facebook") {
    if (clean.toLowerCase().includes("facebook.com/")) {
      return `https://${clean.replace(/^https?:\/\//i, "")}`;
    }
    return `https://facebook.com/${clean}`;
  }

  return `https://${clean}`;
}

interface ThemeStyleConfig {
  cardBg: string;
  nameColor: string;
  handleColor: string;
  bioColor: string;
  catBadgeBg: string;
  catBadgeText: string;
  profBadgeBg: string;
  profBadgeText: string;
  profBadgeBorder: string;
  fanbaseBg: string;
  fanbaseText: string;
  socialItemBg: string;
  socialItemBorder: string;
  socialNameColor: string;
  socialUnitColor: string;
}

export const DEFAULT_THEME_STYLE: ThemeStyleConfig = {
  cardBg: "bg-white border-slate-200/90 shadow-xl shadow-slate-200/50",
  nameColor: "text-slate-900",
  handleColor: "text-purple-600",
  bioColor: "text-slate-500",
  catBadgeBg: "bg-slate-900",
  catBadgeText: "text-white",
  profBadgeBg: "bg-purple-50",
  profBadgeText: "text-purple-700",
  profBadgeBorder: "border-purple-200/70",
  fanbaseBg: "bg-slate-50/90 border-slate-200/80",
  fanbaseText: "text-slate-900",
  socialItemBg: "bg-white",
  socialItemBorder: "border-slate-200/70",
  socialNameColor: "text-slate-900",
  socialUnitColor: "text-slate-500",
};

export const THEME_STYLES: Record<string, ThemeStyleConfig> = {
  "minimal-white": DEFAULT_THEME_STYLE,
  "modern-purple": {
    cardBg: "bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 border-purple-500/30 text-white shadow-xl shadow-purple-900/30",
    nameColor: "text-white",
    handleColor: "text-purple-200",
    bioColor: "text-purple-200/80",
    catBadgeBg: "bg-white/20 backdrop-blur-md",
    catBadgeText: "text-white",
    profBadgeBg: "bg-purple-500/20 backdrop-blur-md",
    profBadgeText: "text-purple-200",
    profBadgeBorder: "border-purple-400/40",
    fanbaseBg: "bg-white/10 border-white/20 backdrop-blur-md",
    fanbaseText: "text-white",
    socialItemBg: "bg-white/10 backdrop-blur-md",
    socialItemBorder: "border-white/15",
    socialNameColor: "text-white",
    socialUnitColor: "text-purple-200/70",
  },
  midnight: {
    cardBg: "bg-slate-950 border-slate-800 text-white shadow-2xl shadow-slate-950",
    nameColor: "text-white",
    handleColor: "text-indigo-400",
    bioColor: "text-slate-400",
    catBadgeBg: "bg-indigo-600",
    catBadgeText: "text-white",
    profBadgeBg: "bg-slate-800",
    profBadgeText: "text-indigo-300",
    profBadgeBorder: "border-indigo-500/30",
    fanbaseBg: "bg-slate-900 border-slate-800",
    fanbaseText: "text-white",
    socialItemBg: "bg-slate-900/80",
    socialItemBorder: "border-slate-800",
    socialNameColor: "text-white",
    socialUnitColor: "text-slate-400",
  },
  "ocean-blue": {
    cardBg: "bg-gradient-to-br from-blue-900 via-sky-900 to-slate-900 border-blue-500/30 text-white shadow-xl shadow-blue-900/30",
    nameColor: "text-white",
    handleColor: "text-sky-300",
    bioColor: "text-blue-100/80",
    catBadgeBg: "bg-sky-500/30 backdrop-blur-md",
    catBadgeText: "text-white",
    profBadgeBg: "bg-blue-500/20 backdrop-blur-md",
    profBadgeText: "text-sky-200",
    profBadgeBorder: "border-sky-400/40",
    fanbaseBg: "bg-white/10 border-white/20 backdrop-blur-md",
    fanbaseText: "text-white",
    socialItemBg: "bg-white/10 backdrop-blur-md",
    socialItemBorder: "border-white/15",
    socialNameColor: "text-white",
    socialUnitColor: "text-sky-200/70",
  },
  sunset: {
    cardBg: "bg-gradient-to-br from-orange-600 via-rose-600 to-purple-700 border-rose-400/30 text-white shadow-xl shadow-rose-900/30",
    nameColor: "text-white",
    handleColor: "text-amber-200",
    bioColor: "text-orange-100/90",
    catBadgeBg: "bg-white/20 backdrop-blur-md",
    catBadgeText: "text-white",
    profBadgeBg: "bg-amber-400/20 backdrop-blur-md",
    profBadgeText: "text-amber-100",
    profBadgeBorder: "border-amber-300/40",
    fanbaseBg: "bg-white/15 border-white/25 backdrop-blur-md",
    fanbaseText: "text-white",
    socialItemBg: "bg-white/15 backdrop-blur-md",
    socialItemBorder: "border-white/20",
    socialNameColor: "text-white",
    socialUnitColor: "text-orange-100/80",
  },
  forest: {
    cardBg: "bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 border-emerald-500/30 text-white shadow-xl",
    nameColor: "text-white",
    handleColor: "text-emerald-300",
    bioColor: "text-emerald-100/80",
    catBadgeBg: "bg-emerald-600/40 backdrop-blur-md",
    catBadgeText: "text-white",
    profBadgeBg: "bg-teal-500/20 backdrop-blur-md",
    profBadgeText: "text-emerald-200",
    profBadgeBorder: "border-emerald-400/40",
    fanbaseBg: "bg-white/10 border-white/20 backdrop-blur-md",
    fanbaseText: "text-white",
    socialItemBg: "bg-white/10 backdrop-blur-md",
    socialItemBorder: "border-white/15",
    socialNameColor: "text-white",
    socialUnitColor: "text-emerald-200/70",
  },
  "rose-gold": {
    cardBg: "bg-gradient-to-br from-rose-100 via-pink-50 to-amber-50 border-rose-200 text-slate-900 shadow-xl",
    nameColor: "text-slate-900",
    handleColor: "text-rose-700",
    bioColor: "text-rose-900/70",
    catBadgeBg: "bg-rose-900",
    catBadgeText: "text-white",
    profBadgeBg: "bg-rose-200/60",
    profBadgeText: "text-rose-900",
    profBadgeBorder: "border-rose-300",
    fanbaseBg: "bg-white/80 border-rose-200",
    fanbaseText: "text-slate-900",
    socialItemBg: "bg-white",
    socialItemBorder: "border-rose-200/70",
    socialNameColor: "text-slate-900",
    socialUnitColor: "text-rose-700/70",
  },
  mono: {
    cardBg: "bg-black border-zinc-800 text-white shadow-2xl",
    nameColor: "text-white",
    handleColor: "text-zinc-400",
    bioColor: "text-zinc-400",
    catBadgeBg: "bg-white",
    catBadgeText: "text-black",
    profBadgeBg: "bg-zinc-900",
    profBadgeText: "text-zinc-200",
    profBadgeBorder: "border-zinc-700",
    fanbaseBg: "bg-zinc-900 border-zinc-800",
    fanbaseText: "text-white",
    socialItemBg: "bg-zinc-900",
    socialItemBorder: "border-zinc-800",
    socialNameColor: "text-white",
    socialUnitColor: "text-zinc-400",
  },
  "neon-pulse": {
    cardBg: "bg-slate-950 border-cyan-500/40 text-white shadow-2xl shadow-cyan-950/50",
    nameColor: "text-white",
    handleColor: "text-cyan-400",
    bioColor: "text-cyan-100/70",
    catBadgeBg: "bg-cyan-500",
    catBadgeText: "text-slate-950",
    profBadgeBg: "bg-fuchsia-500/20",
    profBadgeText: "text-fuchsia-300",
    profBadgeBorder: "border-fuchsia-500/40",
    fanbaseBg: "bg-slate-900 border-cyan-500/30",
    fanbaseText: "text-white",
    socialItemBg: "bg-slate-900/90",
    socialItemBorder: "border-cyan-500/20",
    socialNameColor: "text-white",
    socialUnitColor: "text-cyan-300/70",
  },
  "pastel-dream": {
    cardBg: "bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 border-pink-200 text-slate-800 shadow-xl",
    nameColor: "text-slate-900",
    handleColor: "text-purple-600",
    bioColor: "text-slate-600",
    catBadgeBg: "bg-purple-600",
    catBadgeText: "text-white",
    profBadgeBg: "bg-white/70 backdrop-blur-md",
    profBadgeText: "text-purple-800",
    profBadgeBorder: "border-purple-200",
    fanbaseBg: "bg-white/70 border-pink-200/80 backdrop-blur-md",
    fanbaseText: "text-slate-900",
    socialItemBg: "bg-white/80 backdrop-blur-md",
    socialItemBorder: "border-pink-200/60",
    socialNameColor: "text-slate-900",
    socialUnitColor: "text-purple-600/70",
  },
  cyberpunk: {
    cardBg: "bg-zinc-950 border-pink-500/50 text-white shadow-2xl shadow-pink-950/60",
    nameColor: "text-white",
    handleColor: "text-cyan-400",
    bioColor: "text-pink-100/70",
    catBadgeBg: "bg-pink-600",
    catBadgeText: "text-white",
    profBadgeBg: "bg-cyan-500/20",
    profBadgeText: "text-cyan-300",
    profBadgeBorder: "border-cyan-500/50",
    fanbaseBg: "bg-zinc-900 border-pink-500/40",
    fanbaseText: "text-white",
    socialItemBg: "bg-zinc-900/90",
    socialItemBorder: "border-pink-500/30",
    socialNameColor: "text-white",
    socialUnitColor: "text-cyan-400/80",
  },
  "emerald-luxe": {
    cardBg: "bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 border-amber-500/40 text-amber-100 shadow-2xl",
    nameColor: "text-amber-200",
    handleColor: "text-amber-300",
    bioColor: "text-emerald-100/80",
    catBadgeBg: "bg-amber-500 text-slate-950 font-black",
    catBadgeText: "text-slate-950",
    profBadgeBg: "bg-emerald-900/60",
    profBadgeText: "text-amber-200",
    profBadgeBorder: "border-amber-400/40",
    fanbaseBg: "bg-emerald-900/40 border-amber-500/30",
    fanbaseText: "text-amber-100",
    socialItemBg: "bg-emerald-950/80",
    socialItemBorder: "border-amber-500/20",
    socialNameColor: "text-amber-100",
    socialUnitColor: "text-amber-300/70",
  },
  "crimson-velvet": {
    cardBg: "bg-gradient-to-br from-rose-950 via-red-950 to-slate-950 border-rose-500/30 text-rose-100 shadow-2xl",
    nameColor: "text-white",
    handleColor: "text-rose-300",
    bioColor: "text-rose-200/80",
    catBadgeBg: "bg-rose-600",
    catBadgeText: "text-white",
    profBadgeBg: "bg-rose-900/50",
    profBadgeText: "text-rose-200",
    profBadgeBorder: "border-rose-400/40",
    fanbaseBg: "bg-rose-900/30 border-rose-500/30",
    fanbaseText: "text-white",
    socialItemBg: "bg-rose-950/80",
    socialItemBorder: "border-rose-500/20",
    socialNameColor: "text-white",
    socialUnitColor: "text-rose-300/70",
  },
  "solar-flare": {
    cardBg: "bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 border-amber-300/40 text-white shadow-xl",
    nameColor: "text-white",
    handleColor: "text-amber-100",
    bioColor: "text-amber-50/90",
    catBadgeBg: "bg-white/20 backdrop-blur-md",
    catBadgeText: "text-white",
    profBadgeBg: "bg-black/20 backdrop-blur-md",
    profBadgeText: "text-amber-100",
    profBadgeBorder: "border-white/30",
    fanbaseBg: "bg-white/15 border-white/25 backdrop-blur-md",
    fanbaseText: "text-white",
    socialItemBg: "bg-white/15 backdrop-blur-md",
    socialItemBorder: "border-white/20",
    socialNameColor: "text-white",
    socialUnitColor: "text-amber-100/80",
  },
  "lavender-haze": {
    cardBg: "bg-gradient-to-br from-purple-200 via-indigo-100 to-pink-100 border-purple-300 text-slate-900 shadow-xl",
    nameColor: "text-purple-950",
    handleColor: "text-purple-700",
    bioColor: "text-purple-900/75",
    catBadgeBg: "bg-purple-900",
    catBadgeText: "text-white",
    profBadgeBg: "bg-white/80 backdrop-blur-md",
    profBadgeText: "text-purple-900",
    profBadgeBorder: "border-purple-300",
    fanbaseBg: "bg-white/80 border-purple-200 backdrop-blur-md",
    fanbaseText: "text-purple-950",
    socialItemBg: "bg-white/85 backdrop-blur-md",
    socialItemBorder: "border-purple-200/80",
    socialNameColor: "text-purple-950",
    socialUnitColor: "text-purple-700/70",
  },
  "nordic-frost": {
    cardBg: "bg-gradient-to-br from-sky-900 via-slate-900 to-blue-950 border-sky-400/30 text-sky-100 shadow-xl",
    nameColor: "text-white",
    handleColor: "text-sky-300",
    bioColor: "text-sky-200/80",
    catBadgeBg: "bg-sky-500",
    catBadgeText: "text-slate-950",
    profBadgeBg: "bg-sky-900/50",
    profBadgeText: "text-sky-200",
    profBadgeBorder: "border-sky-400/40",
    fanbaseBg: "bg-sky-950/60 border-sky-400/30",
    fanbaseText: "text-white",
    socialItemBg: "bg-slate-900/80",
    socialItemBorder: "border-sky-400/20",
    socialNameColor: "text-white",
    socialUnitColor: "text-sky-300/70",
  },
  "golden-hour": {
    cardBg: "bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 border-amber-300 text-amber-950 shadow-xl",
    nameColor: "text-amber-950",
    handleColor: "text-amber-700",
    bioColor: "text-amber-900/80",
    catBadgeBg: "bg-amber-900",
    catBadgeText: "text-amber-50",
    profBadgeBg: "bg-amber-200/70",
    profBadgeText: "text-amber-950",
    profBadgeBorder: "border-amber-400",
    fanbaseBg: "bg-white/85 border-amber-300/80",
    fanbaseText: "text-amber-950",
    socialItemBg: "bg-white",
    socialItemBorder: "border-amber-200",
    socialNameColor: "text-amber-950",
    socialUnitColor: "text-amber-700/70",
  },
  "cosmic-galaxy": {
    cardBg: "bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 border-purple-500/40 text-purple-100 shadow-2xl",
    nameColor: "text-white",
    handleColor: "text-purple-300",
    bioColor: "text-purple-200/80",
    catBadgeBg: "bg-purple-600",
    catBadgeText: "text-white",
    profBadgeBg: "bg-indigo-900/60",
    profBadgeText: "text-purple-200",
    profBadgeBorder: "border-purple-400/40",
    fanbaseBg: "bg-purple-950/60 border-purple-500/30",
    fanbaseText: "text-white",
    socialItemBg: "bg-indigo-950/80",
    socialItemBorder: "border-purple-500/20",
    socialNameColor: "text-white",
    socialUnitColor: "text-purple-300/70",
  },
  "tokyo-drift": {
    cardBg: "bg-gray-950 border-rose-500/40 text-white shadow-2xl shadow-rose-950/50",
    nameColor: "text-white",
    handleColor: "text-rose-400",
    bioColor: "text-rose-100/70",
    catBadgeBg: "bg-rose-600",
    catBadgeText: "text-white",
    profBadgeBg: "bg-purple-900/50",
    profBadgeText: "text-purple-300",
    profBadgeBorder: "border-purple-500/40",
    fanbaseBg: "bg-gray-900 border-rose-500/30",
    fanbaseText: "text-white",
    socialItemBg: "bg-gray-900/90",
    socialItemBorder: "border-rose-500/20",
    socialNameColor: "text-white",
    socialUnitColor: "text-rose-300/70",
  },
  "retro-synth": {
    cardBg: "bg-gradient-to-br from-purple-950 via-fuchsia-950 to-slate-950 border-teal-400/40 text-white shadow-2xl",
    nameColor: "text-white",
    handleColor: "text-teal-300",
    bioColor: "text-fuchsia-100/75",
    catBadgeBg: "bg-fuchsia-600",
    catBadgeText: "text-white",
    profBadgeBg: "bg-teal-500/20",
    profBadgeText: "text-teal-300",
    profBadgeBorder: "border-teal-400/40",
    fanbaseBg: "bg-purple-900/50 border-teal-400/30",
    fanbaseText: "text-white",
    socialItemBg: "bg-purple-950/80",
    socialItemBorder: "border-teal-400/20",
    socialNameColor: "text-white",
    socialUnitColor: "text-teal-300/70",
  },
};

export function LivePreviewCard({
  profile,
  socials,
  series,
  totalAudience,
  compact = false,
  themeKey = "minimal-white",
  onShare,
}: {
  profile: CreatorProfile;
  socials: SocialAccounts;
  series?: Series[];
  totalAudience: number;
  compact?: boolean;
  themeKey?: ThemeKey;
  onShare?: () => void;
}) {
  const instaHandle = getHandle(socials.instagram.url);
  const ytHandle = getHandle(socials.youtube.url);
  const fbHandle = getHandle(socials.facebook.url);

  const { showToast } = useToast();
  const style = THEME_STYLES[themeKey] || THEME_STYLES["minimal-white"] || DEFAULT_THEME_STYLE;

  async function handleShareClick(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    if (onShare) {
      onShare();
      return;
    }
    const shareUrl = profile.username
      ? `${window.location.origin}/${profile.username}`
      : typeof window !== "undefined"
      ? window.location.href
      : "https://inflixo.com";
    const shareText = `Check out ${profile.displayName ? `${profile.displayName}'s` : "my"} Inflixo profile to see fanbase stats, social channels & original series! 🎬✨`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${profile.displayName || "Creator"} on Inflixo`,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
          showToast("Profile link & message copied to clipboard! ✨");
        }
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      showToast("Profile link & message copied to clipboard! ✨");
    }
  }

  // Filter ONLY added/linked social accounts with solid high-contrast brand badges
  const activeSocialList = [
    {
      platform: "instagram",
      label: "Instagram",
      name: socials.instagram.name,
      icon: <InstagramIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-sm",
      handle: instaHandle || socials.instagram.username,
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
      badgeBg: "bg-red-600 shadow-sm",
      handle: ytHandle || socials.youtube.username,
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
      badgeBg: "bg-blue-600 shadow-sm",
      handle: fbHandle || socials.facebook.username,
      count: socials.facebook.followers,
      unit: "Followers",
      url: buildSocialUrl("facebook", socials.facebook.url || socials.facebook.username || fbHandle),
      hasAccount: Boolean(fbHandle || socials.facebook.followers > 0 || socials.facebook.url || socials.facebook.username),
    },
  ].filter((item) => item.hasAccount);

  const [expandedSeriesId, setExpandedSeriesId] = useState<string | null>(null);

  return (
    <div className="w-full">
      <div
        className={`relative w-full overflow-hidden rounded-2xl sm:rounded-[28px] border p-4 sm:p-6 transition-all duration-300 hover:shadow-2xl ${style.cardBg}`}
      >
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

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative">
            <CreatorAvatar
              src={profile.photoDataUrl}
              name={profile.displayName || "Creator"}
              className="h-24 w-24 rounded-full shadow-lg border-2 border-white/20"
              textClassName="text-3xl font-extrabold text-white"
              fallbackBgClass="bg-gradient-to-br from-[#782BFB] to-[#500CD6]"
            />
          </div>

          <h3 className={`mt-3.5 text-lg font-extrabold tracking-tight sm:text-xl ${style.nameColor}`}>
            {profile.displayName || "Your Name"}
          </h3>

          <button
            type="button"
            onClick={() => {
              const handle = profile.username || "username";
              const profileUrl = `${window.location.origin}/${handle}`;
              navigator.clipboard.writeText(profileUrl);
              showToast("Profile link copied to clipboard! ✨");
            }}
            className={`mt-0.5 text-xs font-semibold hover:underline inline-flex items-center gap-1 opacity-90 transition-opacity hover:opacity-100 ${style.handleColor}`}
            title="Click to copy profile link"
          >
            <span>{profile.username ? `inflixo.com/${profile.username}` : "inflixo.com/username"}</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </button>

          {(() => {
            const rawItems: string[] = [];
            if (profile.category) rawItems.push(profile.category);
            if ((profile as any).profession) {
              const profs = (profile as any).profession.split(",").map((s: string) => s.trim()).filter(Boolean);
              rawItems.push(...profs);
            }
            if (rawItems.length === 0) return null;

            return (
              <div className="mt-2.5">
                <span
                  className={`inline-flex flex-wrap items-center justify-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-extrabold shadow-2xs ${style.profBadgeBg} ${style.profBadgeText} ${style.profBadgeBorder}`}
                >
                  {rawItems.map((item, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5">
                      {idx > 0 && <span className="opacity-50 text-[10px]">·</span>}
                      <span>{item}</span>
                    </span>
                  ))}
                </span>
              </div>
            );
          })()}

          <p className={`mt-3 text-xs sm:text-sm leading-relaxed font-medium line-clamp-3 px-1 ${style.bioColor}`}>
            {profile.bio || "Your bio will appear here. Share your story with your audience."}
          </p>

          <div className={`mt-4 flex items-center justify-between rounded-2xl border p-3.5 sm:p-4 w-full ${style.fanbaseBg}`}>
            <div className="flex items-center gap-2">
              <span className="text-base">❤️</span>
              <span className={`text-xs sm:text-sm font-extrabold ${style.fanbaseText}`}>Total Fanbase</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className={`font-display text-base sm:text-lg font-black ${style.fanbaseText}`}>
                {formatCount(totalAudience)}
              </span>
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2 w-full">
            <div className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left ${style.socialItemBg} ${style.socialItemBorder}`}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                <Film className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className={`text-[10px] font-extrabold uppercase tracking-wider opacity-60 ${style.socialNameColor}`}>Series</p>
                <p className={`text-xs font-black truncate ${style.socialNameColor}`}>
                  {series ? series.length : 0}
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left ${style.socialItemBg} ${style.socialItemBorder}`}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                <Play className="h-4 w-4 fill-current" />
              </div>
              <div className="min-w-0">
                <p className={`text-[10px] font-extrabold uppercase tracking-wider opacity-60 ${style.socialNameColor}`}>Episodes</p>
                <p className={`text-xs font-black truncate ${style.socialNameColor}`}>
                  {series ? series.reduce((acc, s) => acc + s.seasons.reduce((ea, sn) => ea + sn.episodes.length, 0), 0) : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {activeSocialList.length > 0 && (
          <div className="relative z-10 mt-3.5 space-y-2 w-full">
            <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-60 text-left px-1">
              Social Connections
            </p>
            <div className="grid grid-cols-1 gap-2.5 w-full">
              {activeSocialList.map((item) => (
                <a
                  key={item.platform}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center justify-between rounded-xl border p-3 transition-all hover:scale-[1.01] ${style.socialItemBg} ${style.socialItemBorder}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${item.badgeBg}`}>
                      {item.icon}
                    </span>
                    {/* Vertical Stack: Account Name -> Username -> Platform */}
                    <div className="min-w-0 text-left space-y-0.5">
                      {/* 1. Account Name */}
                      <p className={`truncate text-sm font-black leading-tight ${style.socialNameColor}`}>
                        {item.name || profile.displayName || "Account Name"}
                      </p>
                      {/* 2. Username / Handle */}
                      {item.handle && (
                        <p className={`truncate text-xs font-semibold opacity-90 leading-snug ${style.socialUnitColor}`}>
                          @{item.handle.replace(/^@/, "")}
                        </p>
                      )}
                      {/* 3. Platform Name Tag */}
                      <p className={`truncate text-[10px] font-extrabold uppercase tracking-wider opacity-75 leading-none ${style.socialUnitColor}`}>
                        {item.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="text-right">
                      <p className={`font-display text-xs font-black leading-tight ${style.socialNameColor}`}>
                        {formatCount(item.count)}
                      </p>
                      <p className={`text-[9px] font-extrabold tracking-tight opacity-75 ${style.socialUnitColor}`}>
                        {item.unit}
                      </p>
                    </div>
                    <ExternalLink className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {series && series.length > 0 && (
          <div className="relative z-10 mt-5 space-y-2.5 w-full sm:w-[95%] mx-auto text-left">
            <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-60 px-1">
              Series ({series.length})
            </p>

            <div className="space-y-3">
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

        {/* Viral Growth Engine: "Powered by Inflixo" Watermark Badge */}
        <div className="relative z-10 mt-6 pt-3 text-center">
          <a
            href={profile.username ? `/login?ref=${encodeURIComponent(profile.username)}` : "/login"}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-scale inline-flex items-center gap-1.5 rounded-full border border-purple-200/60 bg-gradient-to-r from-purple-50 via-white to-purple-50 px-3.5 py-1 text-[11px] font-black text-purple-700 shadow-2xs hover:border-purple-400 hover:shadow-xs transition-all"
          >
            <Sparkles className="h-3 w-3 text-purple-600 fill-current animate-pulse" />
            <span>Built with <strong className="font-black text-purple-900">Inflixo</strong> • Build your Creator Home →</span>
          </a>
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
  themeKey,
  username,
  expanded = false,
  onToggle,
}: {
  series: Series;
  style: ThemeStyleConfig;
  themeKey?: ThemeKey;
  username?: string;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const { showToast } = useToast();
  const allEpisodes = series.seasons.flatMap((sn) => sn.episodes);
  const firstEp = allEpisodes[0];
  const seriesPlatform =
    (series as any).platform ||
    firstEp?.platform ||
    (firstEp?.externalUrl ? getPlatformInfo(undefined, firstEp.externalUrl).name : "YouTube");

  const isDark =
    style.nameColor.includes("white") ||
    themeKey === "neon-pulse" ||
    themeKey === "emerald-luxe" ||
    themeKey === "crimson-velvet" ||
    themeKey === "solar-flare" ||
    themeKey === "cosmic-galaxy" ||
    themeKey === "tokyo-drift" ||
    themeKey === "retro-synth";

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  function handleShareSeriesLink() {
    setIsShareModalOpen(true);
  }

  // Single line compact metadata string: Genre • Language • Episodes Count
  const metaParts = [
    series.genre || "General",
    series.language || "Hindi",
    `${allEpisodes.length} ${allEpisodes.length === 1 ? "Episode" : "Episodes"}`,
  ].filter(Boolean);
  const metaStr = metaParts.join(" • ");

  return (
    <div
      id={`series-${series.id}`}
      className={`overflow-hidden rounded-2xl border transition-all duration-200 shadow-xs ${style.socialItemBg} ${style.socialItemBorder}`}
    >
      <div onClick={onToggle} className="cursor-pointer select-none">
        {/* Ultra-sleek Widescreen Cover Image Container with Share & Expand Overlay */}
        <div className="relative w-full aspect-[2.2/1] overflow-hidden bg-slate-950 flex items-center justify-center border-b border-slate-500/20">
          <SeriesPoster
            src={series.posterDataUrl}
            title={series.title}
            className="h-full w-full object-cover"
            textClassName="text-xs font-black text-purple-200"
          />

          {/* Top-Right Compact Overlay Buttons */}
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleShareSeriesLink();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all border border-white/20 shadow-xs"
              title="Share Series Link"
              aria-label="Share Series"
            >
              <Share2 className="h-3.5 w-3.5 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle?.();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all border border-white/20 shadow-xs"
              title={expanded ? "Collapse Episodes" : "Expand Episodes"}
              aria-label="Toggle Episodes"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5 stroke-[2.5]" /> : <ChevronDown className="h-3.5 w-3.5 stroke-[2.5]" />}
            </button>
          </div>
        </div>

        {/* Details Container Below Poster */}
        <div className="p-3.5 sm:p-4 space-y-1.5 text-left">
          {/* Title */}
          <h3 className={`text-base sm:text-lg font-black leading-snug break-words ${style.nameColor}`}>
            {series.title}
          </h3>

          {/* Single Line Stacked Metadata: Genre • Language • Episodes */}
          <p className={`text-xs font-bold opacity-90 ${style.bioColor}`}>
            {metaStr}
          </p>

          {/* Description if present or rich creator fallback */}
          <p className={`text-xs font-medium leading-relaxed break-words pt-0.5 opacity-80 ${expanded ? "" : "line-clamp-2"} ${style.bioColor}`}>
            {series.description || "Explore our Farali food collection, recipes & specials."}
          </p>

          {/* Expand / Collapse Indicator Prompt */}
          <div className={`pt-1 flex items-center gap-1 text-[11px] font-black transition-colors ${style.handleColor}`}>
            <span>{expanded ? "Hide Episodes ↑" : `View Episodes (${allEpisodes.length}) ↓`}</span>
          </div>
        </div>
      </div>

      {/* Episodes Section */}
      {expanded && allEpisodes.length > 0 && (
        <div className={`p-3.5 sm:p-4 space-y-2.5 animate-in fade-in duration-200 border-t ${style.socialItemBorder}`}>
          <div className="flex items-center justify-between">
            <p className={`text-xs font-black ${style.handleColor}`}>
              Episodes ({allEpisodes.length})
            </p>
          </div>

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

          {/* View Full Series Link CTA - Only rendered if > 3 episodes exist */}
          {allEpisodes.length > 3 && username && (
            <div className="pt-2 text-center">
              <a
                href={`/${username}/series/${series.id}`}
                className={`inline-flex items-center gap-1 text-xs font-black transition-colors ${style.handleColor}`}
              >
                <span>View Full Series →</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Share Series Modal */}
      <ShareSeriesModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        series={series}
        username={username || "creator"}
      />
    </div>
  );
}


