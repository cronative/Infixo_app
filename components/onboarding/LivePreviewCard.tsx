import { useState } from "react";
import { Users, Sparkles, ExternalLink, Play, Film, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { CreatorProfile, SocialAccounts, ThemeKey, Series } from "@/types";
import { formatCount, initials } from "@/utils/format";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";

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

const DEFAULT_THEME_STYLE: ThemeStyleConfig = {
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

const THEME_STYLES: Record<string, ThemeStyleConfig> = {
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
  themeKey = "modern-purple",
}: {
  profile: CreatorProfile;
  socials: SocialAccounts;
  series?: Series[];
  totalAudience: number;
  compact?: boolean;
  themeKey?: ThemeKey;
}) {
  const instaHandle = getHandle(socials.instagram.url);
  const ytHandle = getHandle(socials.youtube.url);
  const fbHandle = getHandle(socials.facebook.url);

  const style = THEME_STYLES[themeKey] || THEME_STYLES["modern-purple"] || DEFAULT_THEME_STYLE;

  // Filter ONLY added/linked social accounts
  const activeSocialList = [
    {
      platform: "instagram",
      label: "Instagram",
      icon: <InstagramIcon className="h-4 w-4 text-pink-500" />,
      handle: instaHandle,
      count: socials.instagram.followers,
      unit: "Followers",
      url: socials.instagram.url
        ? socials.instagram.url.startsWith("http")
          ? socials.instagram.url
          : `https://${socials.instagram.url}`
        : instaHandle
        ? `https://instagram.com/${instaHandle}`
        : "",
      hasAccount: Boolean(instaHandle || socials.instagram.followers > 0 || socials.instagram.url),
    },
    {
      platform: "youtube",
      label: "YouTube",
      icon: <YoutubeIcon className="h-4 w-4 text-red-500" />,
      handle: ytHandle,
      count: socials.youtube.subscribers,
      unit: "Subscribers",
      url: socials.youtube.url
        ? socials.youtube.url.startsWith("http")
          ? socials.youtube.url
          : `https://${socials.youtube.url}`
        : ytHandle
        ? `https://youtube.com/@${ytHandle}`
        : "",
      hasAccount: Boolean(ytHandle || socials.youtube.subscribers > 0 || socials.youtube.url),
    },
    {
      platform: "facebook",
      label: "Facebook",
      icon: <FacebookIcon className="h-4 w-4 text-blue-600" />,
      handle: fbHandle,
      count: socials.facebook.followers,
      unit: "Followers",
      url: socials.facebook.url
        ? socials.facebook.url.startsWith("http")
          ? socials.facebook.url
          : `https://${socials.facebook.url}`
        : fbHandle
        ? `https://facebook.com/${fbHandle}`
        : "",
      hasAccount: Boolean(fbHandle || socials.facebook.followers > 0 || socials.facebook.url),
    },
  ].filter((item) => item.hasAccount);

  return (
    <div className="w-full max-w-[95%] mx-auto">
      {/* Top Header Badge Bar — Always Shown Throughout Onboarding */}
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live Profile Card
        </p>
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200/60">
          <Sparkles className="h-3 w-3 text-purple-600" />
          Real-time
        </span>
      </div>

      {/* Main Theme-Aware Card Container */}
      <div
        className={`relative w-full overflow-hidden rounded-[28px] border p-6 sm:p-7 transition-all duration-300 hover:shadow-2xl ${style.cardBg}`}
      >
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* 1. Profile Avatar */}
          <div className="relative">
            {profile.photoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photoDataUrl}
                alt={profile.displayName || "Profile"}
                className="h-20 w-20 rounded-full object-cover ring-4 ring-purple-100/90 shadow-sm"
              />
            ) : (
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full text-xl font-bold text-white ring-4 ring-purple-100/90 shadow-sm"
                style={{ backgroundImage: "var(--gradient-premium)" }}
              >
                {initials(profile.displayName) || "IN"}
              </div>
            )}
          </div>

          {/* 2. Creator Display Name */}
          <h3 className={`mt-3.5 text-lg font-extrabold tracking-tight sm:text-xl ${style.nameColor}`}>
            {profile.displayName || "Your Name"}
          </h3>

          {/* 3. Official Link of Inflixo */}
          <p className={`mt-0.5 text-xs font-semibold ${style.handleColor}`}>
            {profile.username ? `inflixo.com/${profile.username}` : "inflixo.com/username"}
          </p>

          {/* 4. Content Category & Profession Badges */}
          {(profile.category || profile.profession) && (
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
              {profile.category && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold shadow-2xs ${style.catBadgeBg} ${style.catBadgeText}`}>
                  {profile.category}
                </span>
              )}
              {profile.profession &&
                profile.profession
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((prof, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${style.profBadgeBg} ${style.profBadgeText} ${style.profBadgeBorder}`}
                    >
                      ✨ {prof}
                    </span>
                  ))}
            </div>
          )}

          {/* 5. Short Bio */}
          <p className={`mt-2.5 text-xs leading-relaxed font-medium line-clamp-3 px-1 ${style.bioColor}`}>
            {profile.bio || "Your bio will appear here. Share your story with your audience."}
          </p>

          {/* 6. Clean ❤️ Fanbase Total Reach Box */}
          <div className={`mt-4 flex items-center justify-between rounded-2xl border p-3.5 w-[95%] mx-auto ${style.fanbaseBg}`}>
            <div className="text-left">
              <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-80 flex items-center gap-1">
                <span className="text-xs">❤️</span> Total Fanbase
              </p>
              <p className={`text-xl font-black tracking-tight mt-0.5 ${style.fanbaseText}`}>
                {formatCount(totalAudience)}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 border border-emerald-200/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Reach
            </div>
          </div>

          {/* 6b. Separate Total Series & Total Episodes Counts Bar */}
          <div className="mt-2.5 grid grid-cols-2 gap-2 w-[95%] mx-auto">
            <div className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left ${style.socialItemBg} ${style.socialItemBorder}`}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                <Film className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-70">Total Series</p>
                <p className={`text-sm font-black ${style.socialNameColor}`}>
                  {series ? series.length : 0}
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left ${style.socialItemBg} ${style.socialItemBorder}`}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-500/20 text-pink-400">
                <Play className="h-4 w-4 fill-current" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-70">Total Episodes</p>
                <p className={`text-sm font-black ${style.socialNameColor}`}>
                  {series ? series.reduce((acc, s) => acc + s.seasons.reduce((ea, sn) => ea + sn.episodes.length, 0), 0) : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 7. Clean Connected Social Accounts List (SHOW ONLY ADDED PLATFORMS) */}
        {activeSocialList.length > 0 && (
          <div className="relative z-10 mt-3.5 space-y-1.5 w-[95%] mx-auto">
            <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-60 text-left px-1">
              Connected Socials
            </p>
            <div className="space-y-1.5">
              {activeSocialList.map((item) => (
                <a
                  key={item.platform}
                  href={item.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!item.url) e.preventDefault();
                  }}
                  className={`group flex items-center justify-between rounded-xl border p-2.5 transition-all duration-200 hover:scale-[1.01] hover:shadow-md cursor-pointer ${style.socialItemBg} ${style.socialItemBorder}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50/20 border border-slate-100/20 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <div className="text-left min-w-0">
                      <p className={`text-xs font-bold truncate ${style.socialNameColor} flex items-center gap-1`}>
                        <span>{item.label}</span>
                        <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </p>
                      {item.handle && (
                        <p className={`text-[10px] font-semibold truncate ${style.handleColor}`}>@{item.handle}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-black leading-none ${style.socialNameColor}`}>
                      {formatCount(item.count)}
                    </p>
                    <p className={`text-[10px] font-semibold mt-0.5 ${style.socialUnitColor}`}>
                      {item.unit}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 8. Theme-Styled OTT Series & Episodes Section */}
        {series && series.length > 0 && (
          <div className="relative z-10 mt-5 space-y-2.5 w-[95%] mx-auto text-left">
            <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-60 px-1">
              🎬 Series &amp; Episodes ({series.length})
            </p>

            <div className="space-y-3">
              {series.map((s, idx) => (
                <PreviewSeriesItem key={s.id} series={s} style={style} defaultExpanded={idx === 0} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewSeriesItem({
  series,
  style,
  defaultExpanded = false,
}: {
  series: Series;
  style: ThemeStyleConfig;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const allEpisodes = series.seasons.flatMap((sn) => sn.episodes);

  return (
    <div className={`rounded-2xl border p-3.5 transition-all ${style.socialItemBg} ${style.socialItemBorder}`}>
      {/* Series Header Row — Click anywhere or Chevron to toggle expand/collapse */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-900/40 border border-white/20 flex items-center justify-center">
            {series.posterDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={series.posterDataUrl} alt={series.title} className="h-full w-full object-cover" />
            ) : (
              <Film className="h-5 w-5 opacity-70" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className={`text-sm font-extrabold truncate ${style.socialNameColor}`}>{series.title}</p>
            <div className="flex flex-wrap items-center gap-1 mt-1">
              {/* Platform Badge */}
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-xs px-2 py-0.5 text-[10px] font-extrabold shadow-2xs">
                {allEpisodes[0]?.platform || "YouTube"}
              </span>

              {/* Genres Chips */}
              {series.genre &&
                series.genre
                  .split(",")
                  .map((g) => g.trim())
                  .filter(Boolean)
                  .map((g) => (
                    <span key={g} className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold">
                      {g}
                    </span>
                  ))}

              {series.language && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold opacity-80">
                  {series.language}
                </span>
              )}

              <span className="text-[10px] font-bold opacity-85 ml-0.5">
                <strong>{allEpisodes.length} Ep{allEpisodes.length !== 1 ? "s" : ""}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Chevron Expand/Collapse Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 transition-all text-current"
          title={expanded ? "Collapse Episodes" : "Expand Episodes"}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Expanded Episodes List */}
      {expanded && allEpisodes.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5 animate-in fade-in duration-150">
          {allEpisodes.map((ep) => (
            <a
              key={ep.id}
              href={ep.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-between gap-3 rounded-xl border p-2.5 transition-all hover:scale-[1.01] ${style.socialItemBg} ${style.socialItemBorder}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15 text-[11px] font-black">
                  E{ep.episodeNumber}
                </span>
                <p className={`truncate text-xs font-bold ${style.socialNameColor}`}>{ep.title}</p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-extrabold opacity-90 shrink-0">
                <Eye className="h-3.5 w-3.5 text-purple-400" />
                <ExternalLink className="h-3 w-3 opacity-60" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}


