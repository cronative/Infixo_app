"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Sparkles, ExternalLink, Play, Film, Share2, ChevronDown, ChevronUp, ChevronRight, Copy, Eye, Briefcase, Clock, CheckCircle2, MessageCircle, Mail, Link as LinkIcon, ArrowRight, Star, Settings } from "lucide-react";
import { CreatorProfile, SocialAccounts, ThemeKey, Series, MediaKitPackage, MediaKitSettings, CustomLink, CreatorReview, VisibilitySettings, DEFAULT_VISIBILITY_SETTINGS } from "@/types";
import { formatCount } from "@/utils/format";
import { MediaKitService, SAMPLE_PACKAGES } from "@/services/MediaKitService";
import { customLinksRepository, reviewsRepository } from "@/repositories/localRepository";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
  XTwitterIcon,
  LinkedinIcon,
  ThreadsIcon,
  SnapchatIcon,
  PinterestIcon,
  TwitchIcon,
  SpotifyIcon,
} from "@/components/shared/BrandIcons";
import { InflixoLogoIcon } from "@/components/shared/Logo";
import { useToast } from "@/contexts/ToastContext";
import { ShareSeriesModal } from "@/components/shared/ShareSeriesModal";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { SeriesPoster } from "@/components/shared/SeriesPoster";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { BrandLeadQualifierModal } from "@/components/mediakit/BrandLeadQualifierModal";
import { EpisodeQuickDrawer } from "@/components/series/EpisodeQuickDrawer";
import { VisibilitySettingsModal } from "@/components/shared/VisibilitySettingsModal";
import { STORAGE_KEYS, storage } from "@/utils/storage";

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
  isShimmerName?: boolean;
  isShimmerFanbase?: boolean;
}

export const DEFAULT_THEME_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] border border-[#e2e8f0] text-slate-900 shadow-xl",
  profBadgeBg: "bg-[#803D63]/10",
  profBadgeText: "text-[#803D63]",
  profBadgeBorder: "border-[#803D63]/30",
  fanbaseBg: "bg-[#803D63]/10",
  fanbaseText: "text-[#803D63]",
  socialItemBg: "bg-white/80 backdrop-blur-xs",
  socialItemBorder: "border-slate-200/80",
  socialNameColor: "text-slate-800",
  socialUnitColor: "text-slate-500",
  nameColor: "text-slate-900",
  bioColor: "text-slate-600",
  handleColor: "text-slate-500",
};

const DARK_PURPLE_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-[#1e1b4b] via-[#4c1d95] to-[#0f172a] text-white border border-purple-500/30 shadow-2xl",
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
  cardBg: "bg-gradient-to-br from-[#0c4a6e] via-[#0f172a] to-[#0284c7] text-white border border-blue-500/30 shadow-2xl",
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
  cardBg: "bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#065f46] text-white border border-emerald-500/30 shadow-2xl",
  profBadgeBg: "bg-emerald-500/20",
  profBadgeText: "text-emerald-300",
  profBadgeBorder: "border-emerald-500/30",
  fanbaseBg: "bg-emerald-500/20",
  fanbaseText: "text-emerald-300",
  socialItemBg: "bg-slate-900/80 backdrop-blur-md",
  socialItemBorder: "border-emerald-500/20",
  socialNameColor: "text-white",
  socialUnitColor: "text-emerald-200/70",
  nameColor: "text-white",
  bioColor: "text-emerald-100/80",
  handleColor: "text-emerald-400",
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
  cardBg: "bg-gradient-to-br from-[#f5f3ff] via-[#fce7f3] to-[#fed7aa] text-slate-900 border border-purple-200 shadow-xl",
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
  cardBg: "bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#f1f5f9] text-[#0284c7] border border-sky-200/90 shadow-xl",
  profBadgeBg: "bg-sky-100/90",
  profBadgeText: "text-sky-900",
  profBadgeBorder: "border-sky-300",
  fanbaseBg: "bg-sky-100/90",
  fanbaseText: "text-sky-900",
  socialItemBg: "bg-white/85 backdrop-blur-xs",
  socialItemBorder: "border-sky-200/80",
  socialNameColor: "text-[#0284c7]",
  socialUnitColor: "text-sky-800/70",
  nameColor: "text-[#0284c7]",
  bioColor: "text-sky-900/80",
  handleColor: "text-sky-700",
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

const MATCHA_CREAM_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-[#dcfce7] via-[#f0fdf4] to-[#fef3c7] text-[#14532d] border border-emerald-200/90 shadow-xl",
  profBadgeBg: "bg-emerald-100/90",
  profBadgeText: "text-emerald-900",
  profBadgeBorder: "border-emerald-300",
  fanbaseBg: "bg-emerald-100/90",
  fanbaseText: "text-emerald-900",
  socialItemBg: "bg-white/85 backdrop-blur-xs",
  socialItemBorder: "border-emerald-200/80",
  socialNameColor: "text-[#14532d]",
  socialUnitColor: "text-emerald-800/70",
  nameColor: "text-[#14532d]",
  bioColor: "text-emerald-900/80",
  handleColor: "text-emerald-700",
};

const CLOUD_FLUFF_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-[#e0f2fe] via-[#f0f9ff] to-[#E8DCE4] text-[#0369a1] border border-sky-200/90 shadow-xl",
  profBadgeBg: "bg-sky-100/90",
  profBadgeText: "text-sky-900",
  profBadgeBorder: "border-sky-300",
  fanbaseBg: "bg-sky-100/90",
  fanbaseText: "text-sky-900",
  socialItemBg: "bg-white/85 backdrop-blur-xs",
  socialItemBorder: "border-sky-200/80",
  socialNameColor: "text-[#0369a1]",
  socialUnitColor: "text-sky-800/70",
  nameColor: "text-[#0369a1]",
  bioColor: "text-sky-900/80",
  handleColor: "text-sky-700",
};

const BOBA_MILK_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-[#fef3c7] via-[#ffedd5] to-[#f5f5f4] text-[#78350f] border border-amber-300/80 shadow-xl",
  profBadgeBg: "bg-amber-100",
  profBadgeText: "text-amber-950",
  profBadgeBorder: "border-amber-300",
  fanbaseBg: "bg-amber-100",
  fanbaseText: "text-amber-950",
  socialItemBg: "bg-white/85 backdrop-blur-xs",
  socialItemBorder: "border-amber-200",
  socialNameColor: "text-[#78350f]",
  socialUnitColor: "text-amber-900/70",
  nameColor: "text-[#78350f]",
  bioColor: "text-amber-900/80",
  handleColor: "text-amber-800",
};

const SAKURA_BLOSSOM_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-[#fce7f3] via-[#fbcfe8] to-[#faf5ff] text-[#831843] border border-pink-200/90 shadow-xl",
  profBadgeBg: "bg-pink-100",
  profBadgeText: "text-pink-950",
  profBadgeBorder: "border-pink-300",
  fanbaseBg: "bg-pink-100",
  fanbaseText: "text-pink-950",
  socialItemBg: "bg-white/85 backdrop-blur-xs",
  socialItemBorder: "border-pink-200",
  socialNameColor: "text-[#831843]",
  socialUnitColor: "text-pink-900/70",
  nameColor: "text-[#831843]",
  bioColor: "text-pink-900/80",
  handleColor: "text-pink-700",
};

const SAND_DUNE_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-[#f5f5f4] via-[#fafaf9] to-[#fef3c7] text-[#44403c] border border-stone-300/80 shadow-xl",
  profBadgeBg: "bg-stone-200/80",
  profBadgeText: "text-stone-900",
  profBadgeBorder: "border-stone-300",
  fanbaseBg: "bg-stone-200/80",
  fanbaseText: "text-stone-900",
  socialItemBg: "bg-white/85 backdrop-blur-xs",
  socialItemBorder: "border-stone-200",
  socialNameColor: "text-[#44403c]",
  socialUnitColor: "text-stone-700/70",
  nameColor: "text-[#44403c]",
  bioColor: "text-stone-800/80",
  handleColor: "text-stone-700",
};

const SHIMMER_GOLD_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-[#fef3c7] via-[#fffbeb] to-[#fde68a] text-[#78350f] border border-amber-300 shadow-xl",
  profBadgeBg: "bg-amber-200/80",
  profBadgeText: "text-amber-950 font-black",
  profBadgeBorder: "border-amber-400",
  fanbaseBg: "bg-amber-200/80",
  fanbaseText: "text-amber-950 font-black",
  socialItemBg: "bg-white/90 backdrop-blur-xs",
  socialItemBorder: "border-amber-300/90",
  socialNameColor: "text-[#78350f]",
  socialUnitColor: "text-amber-900/80",
  nameColor: "text-[#78350f]",
  bioColor: "text-amber-950/90",
  handleColor: "text-amber-800",
  isShimmerName: true,
};

const HOLOGRAPHIC_WAVE_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-[#E8DCE4] via-[#f3e8ff] to-[#fce7f3] text-[#4c1d95] border border-purple-200 shadow-xl",
  profBadgeBg: "bg-purple-200/80",
  profBadgeText: "text-purple-950 font-black",
  profBadgeBorder: "border-purple-300",
  fanbaseBg: "bg-purple-200/80",
  fanbaseText: "text-purple-950 font-black",
  socialItemBg: "bg-white/90 backdrop-blur-xs",
  socialItemBorder: "border-purple-200",
  socialNameColor: "text-[#4c1d95]",
  socialUnitColor: "text-purple-900/80",
  nameColor: "text-[#4c1d95]",
  bioColor: "text-purple-950/90",
  handleColor: "text-purple-700",
  isShimmerName: true,
};

const LUMINOUS_PEARL_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#f1f5f9] text-[#0f172a] border border-slate-200/90 shadow-xl",
  profBadgeBg: "bg-slate-100",
  profBadgeText: "text-slate-900 font-black",
  profBadgeBorder: "border-slate-300",
  fanbaseBg: "bg-slate-100",
  fanbaseText: "text-slate-900 font-black",
  socialItemBg: "bg-white/95 backdrop-blur-xs",
  socialItemBorder: "border-slate-200",
  socialNameColor: "text-[#0f172a]",
  socialUnitColor: "text-slate-600",
  nameColor: "text-[#0f172a]",
  bioColor: "text-slate-700",
  handleColor: "text-purple-600",
  isShimmerName: true,
  isShimmerFanbase: true,
};

const MINIMAL_WHITE_STYLE: ThemeStyleConfig = {
  cardBg: "bg-[#F8FAFC] text-[#0F172A] border border-[#E5E7EB] shadow-2xs",
  profBadgeBg: "bg-[#F3F4F6]",
  profBadgeText: "text-[#0F172A] font-semibold",
  profBadgeBorder: "border-[#E5E7EB]",
  fanbaseBg: "bg-white",
  fanbaseText: "text-[#0F172A] font-bold",
  socialItemBg: "bg-white",
  socialItemBorder: "border-[#E5E7EB]",
  socialNameColor: "text-[#0F172A] font-bold",
  socialUnitColor: "text-slate-500",
  nameColor: "text-[#0F172A]",
  bioColor: "text-[#4B5563]",
  handleColor: "text-[#1F2937]",
};
const SIGNATURE_PURPLE_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-[#6b21a8] via-[#a78bfa] to-[#c4b5fd] text-white border border-purple-500/30 shadow-2xl",
  profBadgeBg: "bg-purple-500/20",
  profBadgeText: "text-purple-200",
  profBadgeBorder: "border-purple-500/30",
  fanbaseBg: "bg-purple-500/20",
  fanbaseText: "text-purple-200",
  socialItemBg: "bg-slate-900/80 backdrop-blur-md",
  socialItemBorder: "border-purple-500/20",
  socialNameColor: "text-white",
  socialUnitColor: "text-purple-200/70",
  nameColor: "text-white",
  bioColor: "text-purple-100/80",
  handleColor: "text-purple-400",
};

const NEON_PULSE_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-[#ff00ff] via-[#00ffff] to-[#ff00ff] text-black border border-pink-500/30 shadow-xl",
  profBadgeBg: "bg-pink-500/20",
  profBadgeText: "text-pink-100",
  profBadgeBorder: "border-pink-500/30",
  fanbaseBg: "bg-pink-500/20",
  fanbaseText: "text-pink-100",
  socialItemBg: "bg-black/80 backdrop-blur-md",
  socialItemBorder: "border-pink-500/20",
  socialNameColor: "text-pink-100",
  socialUnitColor: "text-pink-200/70",
  nameColor: "text-pink-100",
  bioColor: "text-pink-100/80",
  handleColor: "text-pink-200",
  isShimmerName: true,
};

const CRIMSON_VELVET_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-[#7f1d1d] via-[#b91c1c] to-[#dc2626] text-white border border-red-500/30 shadow-2xl",
  profBadgeBg: "bg-red-500/20",
  profBadgeText: "text-red-200",
  profBadgeBorder: "border-red-500/30",
  fanbaseBg: "bg-red-500/20",
  fanbaseText: "text-red-200",
  socialItemBg: "bg-slate-900/80 backdrop-blur-md",
  socialItemBorder: "border-red-500/20",
  socialNameColor: "text-white",
  socialUnitColor: "text-red-200/70",
  nameColor: "text-white",
  bioColor: "text-red-100/80",
  handleColor: "text-red-400",
};


export const THEME_STYLES: Record<string, ThemeStyleConfig> = {
  "minimal-white": MINIMAL_WHITE_STYLE,
  "signature-purple": SIGNATURE_PURPLE_STYLE,
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
  "shimmer-gold": SHIMMER_GOLD_STYLE,
  "holographic-wave": HOLOGRAPHIC_WAVE_STYLE,
  "aurora-borealis": EMERALD_LUXE_STYLE,
  "electric-cyber": NEON_PULSE_STYLE,
  "luminous-pearl": LUMINOUS_PEARL_STYLE,
  "cosmic-pulse": COSMIC_GALAXY_STYLE,
  "matcha-cream": MATCHA_CREAM_STYLE,
  "cloud-fluff": CLOUD_FLUFF_STYLE,
  "boba-milk": BOBA_MILK_STYLE,
  "sakura-pink": SAKURA_BLOSSOM_STYLE,
  "sand-linen": SAND_DUNE_STYLE,
  "sakura-blossom": SAKURA_BLOSSOM_STYLE,
  "sand-dune": SAND_DUNE_STYLE,
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

export function buildSocialUrl(platform: string, rawUrlOrHandle?: string): string {
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
    case "twitter":
      return `https://x.com/${clean}`;
    case "linkedin":
      return clean.startsWith("in/") || clean.startsWith("company/")
        ? `https://linkedin.com/${clean}`
        : `https://linkedin.com/in/${clean}`;
    case "threads":
      return `https://threads.net/@${clean}`;
    case "snapchat":
      return `https://snapchat.com/add/${clean}`;
    case "pinterest":
      return `https://pinterest.com/${clean}`;
    case "twitch":
      return `https://twitch.tv/${clean}`;
    case "spotify":
      return clean.startsWith("artist/") || clean.startsWith("user/") || clean.startsWith("show/")
        ? `https://open.spotify.com/${clean}`
        : `https://open.spotify.com/artist/${clean}`;
    default:
      return `https://${clean}`;
  }
}

export interface LivePreviewCardProps {
  profile: CreatorProfile;
  socials: SocialAccounts;
  series?: Series[];
  customLinks?: CustomLink[];
  mediaKitPackages?: MediaKitPackage[];
  mediaKitSettings?: MediaKitSettings;
  reviews?: CreatorReview[];
  totalAudience?: number;
  themeKey?: ThemeKey;
  compact?: boolean;
  variant?: "compact" | "full";
  showSettingsIcon?: boolean;
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

const DARK_THEME_KEYS = new Set([
  "modern-purple",
  "midnight",
  "ocean-blue",
  "forest",
  "emerald-luxe",
  "crimson-velvet",
  "neon-pulse",
  "sunset",
  "mono",
  "solar-flare",
  "cosmic-galaxy",
  "tokyo-drift",
  "retro-synth",
  "aurora-borealis",
  "electric-cyber",
  "cosmic-pulse",
]);

export function isDarkTheme(themeKey: string = "minimal-white"): boolean {
  return DARK_THEME_KEYS.has(themeKey);
}

export function LivePreviewCard({
  profile,
  socials,
  series = [],
  customLinks: passedCustomLinks,
  mediaKitPackages: passedMediaKitPackages,
  mediaKitSettings: passedMediaKitSettings,
  reviews: passedReviews,
  totalAudience: passedTotalAudience,
  themeKey = "minimal-white",
  compact = false,
  variant,
  showSettingsIcon: showSettingsIconProp,
  onShare,
}: LivePreviewCardProps) {
  const { showToast } = useToast();
  const [expandedSeriesId, setExpandedSeriesId] = useState<string | null>(null);
  const [activeContentTab, setActiveContentTab] = useState<"series" | "gigs" | "reviews">("series");
  const [approvedReviews, setApprovedReviews] = useState<CreatorReview[]>(passedReviews || []);
  const [isDashboardPreview, setIsDashboardPreview] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      setIsDashboardPreview(
        showSettingsIconProp ?? (
          pathname.startsWith("/dashboard") ||
          pathname.startsWith("/onboarding")
        )
      );
    }
  }, [showSettingsIconProp]);

  useEffect(() => {
    if (passedReviews && passedReviews.length > 0) {
      setApprovedReviews(passedReviews);
      return;
    }
    async function loadApprovedReviews() {
      const email = profile.email || "";
      const username = profile.username || "";

      try {
        if (email || username) {
          const res = await fetch(
            `/api/creator/reviews?email=${encodeURIComponent(email)}&username=${encodeURIComponent(username)}&status=approved`
          ).then((r) => r.json());

          if (res && res.success && Array.isArray(res.reviews) && res.reviews.length > 0) {
            setApprovedReviews(res.reviews);
            return;
          }
        }
      } catch (e) {}

      const all = reviewsRepository.getAll();
      const approved = all.filter((r) => r.status === "approved");
      if (approved.length > 0) {
        setApprovedReviews(approved);
      }
    }
    loadApprovedReviews();
  }, [profile.email, profile.username, passedReviews]);
  const [mediaKitPackages, setMediaKitPackages] = useState<MediaKitPackage[]>(passedMediaKitPackages || []);
  const [mediaKitSettings, setMediaKitSettings] = useState<MediaKitSettings>(passedMediaKitSettings || MediaKitService.DEFAULT_SETTINGS);
  const [customLinksList, setCustomLinksList] = useState<CustomLink[]>(passedCustomLinks || []);
  const [selectedGigForWhatsApp, setSelectedGigForWhatsApp] = useState<MediaKitPackage | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [drawerSeries, setDrawerSeries] = useState<Series | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAllGigs, setShowAllGigs] = useState(false);

  const [visibilitySettings, setVisibilitySettings] = useState<VisibilitySettings>(() => {
    if (profile.visibilitySettings) return profile.visibilitySettings;
    return storage.get<VisibilitySettings>(STORAGE_KEYS.visibilitySettings, DEFAULT_VISIBILITY_SETTINGS);
  });
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);

  useEffect(() => {
    if (profile.visibilitySettings) {
      setVisibilitySettings(profile.visibilitySettings);
    }
  }, [profile.visibilitySettings]);

  const handleSaveVisibilitySettings = async (newSettings: VisibilitySettings) => {
    setVisibilitySettings(newSettings);
    storage.set(STORAGE_KEYS.visibilitySettings, newSettings);
    try {
      const { ProfileService } = await import("@/services/ProfileService");
      ProfileService.saveLocal({ visibilitySettings: newSettings });
      const targetEmail = profile.email || ProfileService.getProfile().email;
      const targetUsername = profile.username;

      if (targetEmail || targetUsername) {
        await Promise.all([
          fetch("/api/creator/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: targetEmail,
              username: targetUsername,
              visibilitySettings: newSettings,
            }),
          }),
          fetch("/api/creator/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: targetEmail || `${targetUsername}@inflixo.com`,
              visibilitySettings: newSettings,
            }),
          }),
        ]);
      }
    } catch (e) {
      console.warn("Error saving visibility settings to DB:", e);
    }

    showToast("Page display settings saved! ⚙️", "success");
  };

  const isDark = isDarkTheme(themeKey);

  useEffect(() => {
    if (passedCustomLinks) {
      setCustomLinksList(passedCustomLinks);
    } else {
      setCustomLinksList(customLinksRepository.get());
    }
  }, [passedCustomLinks]);

  useEffect(() => {
    if (passedMediaKitPackages && passedMediaKitPackages.length > 0) {
      setMediaKitPackages(passedMediaKitPackages);
      if (passedMediaKitSettings) setMediaKitSettings(passedMediaKitSettings);
    } else {
      async function loadMediaKit() {
        const identifier = profile.id || profile.email || profile.username;
        if (identifier) {
          const data = await MediaKitService.fetchFromDb(identifier, profile.id);
          if (data) {
            setMediaKitPackages(data.packages || []);
            setMediaKitSettings(data.settings || MediaKitService.DEFAULT_SETTINGS);
          }
        }
      }
      loadMediaKit();
    }
  }, [profile.id, profile.email, profile.username, passedMediaKitPackages, passedMediaKitSettings]);

  const style = THEME_STYLES[themeKey] || DEFAULT_THEME_STYLE;
  const totalEpisodesCount = (series || []).reduce((acc, s) => acc + getSeriesEpisodes(s).length, 0);

  const calculatedTotal =
    (socials.instagram?.followers || 0) +
    (socials.youtube?.subscribers || 0) +
    (socials.facebook?.followers || 0) +
    (socials.twitter?.followers || 0) +
    (socials.linkedin?.followers || 0) +
    (socials.threads?.followers || 0) +
    (socials.snapchat?.followers || 0) +
    (socials.pinterest?.followers || 0) +
    (socials.twitch?.followers || 0) +
    (socials.spotify?.followers || 0);

  const totalAudience = passedTotalAudience !== undefined ? passedTotalAudience : calculatedTotal;

  const instaHandle = socials.instagram?.username || getHandle(socials.instagram?.url || "");
  const ytHandle = socials.youtube?.username || getHandle(socials.youtube?.url || "");
  const fbHandle = socials.facebook?.username || getHandle(socials.facebook?.url || "");
  const twHandle = socials.twitter?.username || getHandle(socials.twitter?.url || "");
  const liHandle = socials.linkedin?.username || getHandle(socials.linkedin?.url || "");
  const thHandle = socials.threads?.username || getHandle(socials.threads?.url || "");
  const scHandle = socials.snapchat?.username || getHandle(socials.snapchat?.url || "");
  const pinHandle = socials.pinterest?.username || getHandle(socials.pinterest?.url || "");
  const twiHandle = socials.twitch?.username || getHandle(socials.twitch?.url || "");
  const spHandle = socials.spotify?.username || getHandle(socials.spotify?.url || "");

  const activeSocialList = [
    {
      platform: "instagram",
      label: "Instagram",
      name: socials.instagram?.name,
      icon: <InstagramIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-xs",
      handle: instaHandle,
      count: socials.instagram?.followers || 0,
      unit: "Followers",
      url: buildSocialUrl("instagram", socials.instagram?.url || socials.instagram?.username || instaHandle),
      hasAccount: Boolean(instaHandle || (socials.instagram?.followers || 0) > 0 || socials.instagram?.url),
      visible: visibilitySettings.showInstagram !== false,
    },
    {
      platform: "youtube",
      label: "YouTube",
      name: socials.youtube?.channelTitle,
      icon: <YoutubeIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-red-600 shadow-xs",
      handle: ytHandle,
      count: socials.youtube?.subscribers || 0,
      unit: "Subscribers",
      url: buildSocialUrl("youtube", socials.youtube?.url || socials.youtube?.username || ytHandle),
      hasAccount: Boolean(ytHandle || (socials.youtube?.subscribers || 0) > 0 || socials.youtube?.url),
      visible: visibilitySettings.showYoutube !== false,
    },
    {
      platform: "facebook",
      label: "Facebook",
      name: socials.facebook?.name,
      icon: <FacebookIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-blue-600 shadow-xs",
      handle: fbHandle,
      count: socials.facebook?.followers || 0,
      unit: "Followers",
      url: buildSocialUrl("facebook", socials.facebook?.url || socials.facebook?.username || fbHandle),
      hasAccount: Boolean(fbHandle || (socials.facebook?.followers || 0) > 0 || socials.facebook?.url),
      visible: visibilitySettings.showFacebook !== false,
    },
    {
      platform: "twitter",
      label: "X (Twitter)",
      name: socials.twitter?.name,
      icon: <XTwitterIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-slate-900 shadow-xs",
      handle: twHandle,
      count: socials.twitter?.followers || 0,
      unit: "Followers",
      url: buildSocialUrl("twitter", socials.twitter?.url || twHandle),
      hasAccount: Boolean(twHandle || (socials.twitter?.followers || 0) > 0 || socials.twitter?.url),
      visible: visibilitySettings.showTwitter !== false,
    },
    {
      platform: "linkedin",
      label: "LinkedIn",
      name: socials.linkedin?.name,
      icon: <LinkedinIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-sky-700 shadow-xs",
      handle: liHandle,
      count: socials.linkedin?.followers || 0,
      unit: "Connections",
      url: buildSocialUrl("linkedin", socials.linkedin?.url || liHandle),
      hasAccount: Boolean(liHandle || (socials.linkedin?.followers || 0) > 0 || socials.linkedin?.url),
      visible: visibilitySettings.showLinkedin !== false,
    },
    {
      platform: "threads",
      label: "Threads",
      name: socials.threads?.name,
      icon: <ThreadsIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-slate-900 shadow-xs",
      handle: thHandle,
      count: socials.threads?.followers || 0,
      unit: "Followers",
      url: buildSocialUrl("threads", socials.threads?.url || thHandle),
      hasAccount: Boolean(thHandle || (socials.threads?.followers || 0) > 0 || socials.threads?.url),
      visible: visibilitySettings.showThreads !== false,
    },
    {
      platform: "snapchat",
      label: "Snapchat",
      name: socials.snapchat?.name,
      icon: <SnapchatIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-yellow-500 shadow-xs",
      handle: scHandle,
      count: socials.snapchat?.followers || 0,
      unit: "Subscribers",
      url: buildSocialUrl("snapchat", socials.snapchat?.url || scHandle),
      hasAccount: Boolean(scHandle || (socials.snapchat?.followers || 0) > 0 || socials.snapchat?.url),
      visible: visibilitySettings.showSnapchat !== false,
    },
    {
      platform: "pinterest",
      label: "Pinterest",
      name: socials.pinterest?.name,
      icon: <PinterestIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-red-700 shadow-xs",
      handle: pinHandle,
      count: socials.pinterest?.followers || 0,
      unit: "Followers",
      url: buildSocialUrl("pinterest", socials.pinterest?.url || pinHandle),
      hasAccount: Boolean(pinHandle || (socials.pinterest?.followers || 0) > 0 || socials.pinterest?.url),
      visible: visibilitySettings.showPinterest !== false,
    },
    {
      platform: "twitch",
      label: "Twitch",
      name: socials.twitch?.name,
      icon: <TwitchIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-purple-700 shadow-xs",
      handle: twiHandle,
      count: socials.twitch?.followers || 0,
      unit: "Followers",
      url: buildSocialUrl("twitch", socials.twitch?.url || twiHandle),
      hasAccount: Boolean(twiHandle || (socials.twitch?.followers || 0) > 0 || socials.twitch?.url),
      visible: visibilitySettings.showTwitch !== false,
    },
    {
      platform: "spotify",
      label: "Spotify",
      name: socials.spotify?.name,
      icon: <SpotifyIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-emerald-600 shadow-xs",
      handle: spHandle,
      count: socials.spotify?.followers || 0,
      unit: "Listeners",
      url: buildSocialUrl("spotify", socials.spotify?.url || spHandle),
      hasAccount: Boolean(spHandle || (socials.spotify?.followers || 0) > 0 || socials.spotify?.url),
      visible: visibilitySettings.showSpotify !== false,
    },
  ].filter((item) => item.visible && (item.hasAccount || item.count > 0 || (item.url && item.url !== "#")));

  const handleCopyClick = async () => {
    const cleanUsername = profile.username || "username";
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/${cleanUsername}` : "";
    const success = await copyToClipboard(shareUrl);
    if (success) {
      showToast("Profile link copied to clipboard! ✨");
    } else {
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
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, url: shareUrl });
      } else {
        const success = await copyToClipboard(shareUrl);
        if (success) showToast("Profile link copied to clipboard! ✨");
      }
    } catch {
      // User dismissed share sheet
    }
  };

  const isFull = variant === "full";

  const cardContent = (
    <div className={`relative overflow-hidden ${isFull ? "rounded-3xl p-5 sm:p-8" : "rounded-[28px] p-4 sm:p-6"} transition-all ${style.cardBg || DEFAULT_THEME_STYLE.cardBg}`}>
      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between w-full mb-4 px-1">
        <div
          className="tap-scale flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#803D63] text-white shadow-md transition-all shrink-0 cursor-pointer border border-white/20"
          title="Inflixo"
          aria-label="Inflixo"
        >
          <InflixoLogoIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white animate-[spin_8s_linear_infinite]" />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyClick}
            className={`tap-scale flex h-8 w-8 items-center justify-center rounded-full border shadow-2xs transition-all hover:scale-105 ${style.socialItemBg} ${style.socialItemBorder} ${
              isDark ? "text-slate-200 hover:text-white" : "text-slate-600 hover:text-[#803D63]"
            }`}
            title="Copy Profile Link"
            aria-label="Copy Profile Link"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={handleShareClick}
            className={`tap-scale flex h-8 w-8 items-center justify-center rounded-full border shadow-2xs transition-all hover:scale-105 ${style.socialItemBg} ${style.socialItemBorder} ${
              isDark ? "text-slate-200 hover:text-white" : "text-slate-600 hover:text-[#803D63]"
            }`}
            title="Share Profile"
            aria-label="Share Profile"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>


        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Circular Profile Avatar (Fix vertical slicing bug) */}
        <div className="relative">
          <CreatorAvatar
            src={profile.photoDataUrl}
            name={profile.displayName || "Creator"}
            className="w-24 h-24 rounded-full aspect-square object-cover overflow-hidden border-2 border-white shadow-md mx-auto"
            textClassName="text-2xl font-extrabold text-white"
            fallbackBgClass="bg-[#803D63]"
          />
        </div>

        {/* Name & Verified Creator Badge */}
        <div className="mt-3 flex items-center justify-center gap-1.5 max-w-full">
          <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${
            style.isShimmerName
              ? "bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 bg-clip-text text-transparent animate-pulse"
              : style.nameColor
          }`}>
            {profile.displayName || "Your Name"}
          </h3>
          {/* Verified SVG Checkmark Badge */}
          <svg className={`w-5 h-5 ${isDark ? "text-amber-400" : themeKey === "minimal-white" ? "text-[#0F172A]" : "text-[#803D63]"} shrink-0`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L9 14.17l9.59-9.59L20 6l-10 11z" />
          </svg>
        </div>

        {/* Clean Interactive Handle Chip */}
        <button
          type="button"
          onClick={async () => {
            const handle = profile.username || "username";
            const profileUrl = typeof window !== "undefined" ? `${window.location.origin}/${handle}` : `https://inflixo.com/${handle}`;
            const success = await copyToClipboard(profileUrl);
            if (success) {
              showToast("Profile link copied to clipboard! ✨");
            } else {
              showToast("Could not copy link", "error");
            }
          }}
          className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full text-xs font-semibold px-3 py-1.5 transition-colors cursor-pointer ${
            isDark
              ? "bg-white/10 text-indigo-200 border border-white/20 hover:bg-white/20"
              : themeKey === "minimal-white"
              ? "bg-[#F3F4F6] text-[#1F2937] border border-[#E5E7EB] hover:bg-[#E5E7EB]"
              : "bg-[#F6EBF1] text-[#803D63] border border-[#E8DCE4] hover:bg-rose-100/60"
          }`}
          title="Click to copy profile link"
        >
          <span>{profile.username ? `inflixo.com/${profile.username}` : "inflixo.com/username"}</span>
          <Copy className="h-3 w-3 opacity-70" />
        </button>

        {/* Category Chips (Max 3 prominent chips) */}
        {visibilitySettings.showContentCategory !== false && (() => {
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
          const visibleChips = allChips.slice(0, 3);

          return (
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 max-w-xs">
              {visibleChips.map((chip, idx) => (
                <span
                  key={idx}
                  className={`${
                    isDark
                      ? "bg-slate-900/60 text-slate-100 border-white/20"
                      : "bg-white/80 text-slate-800 border-white/60"
                  } backdrop-blur-md text-xs font-semibold px-3 py-1 rounded-full border shadow-2xs`}
                >
                  {chip}
                </span>
              ))}
            </div>
          );
        })()}

        {/* Bio Formatting */}
        <p className={`mt-2.5 text-xs leading-relaxed max-w-sm mx-auto font-medium px-1 ${
          isDark ? "text-slate-200" : "text-[#4B5563]"
        }`}>
          {profile.bio || "Sharing my journey & content. Stream original series and connect across all platforms."}
        </p>

        {/* "Total Fanbase" Authority Card */}
        {visibilitySettings.showFanbase !== false && (
          <div className={`mt-4 rounded-2xl p-4 shadow-2xs text-center w-full space-y-1 ${
            isDark
              ? "bg-slate-900/60 backdrop-blur-md border border-white/15 text-white"
              : "bg-white/75 backdrop-blur-md border border-white/60 text-slate-900"
          }`}>
            {totalAudience > 0 ? (
              <div className="space-y-1">
                <p className={`text-2xl font-black tabular-nums ${isDark ? "text-white" : "text-[#111827]"}`}>
                  ❤️ {formatCount(totalAudience)}
                </p>
                <p className={`text-[11px] font-bold tracking-wider uppercase ${themeKey === "minimal-white" ? "text-[#0F172A]" : isDark ? "text-amber-400 font-extrabold" : "text-[#803D63]"}`}>
                  TOTAL FANBASE
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className={`text-2xl font-black tabular-nums ${isDark ? "text-white" : "text-[#111827]"}`}>
                  ❤️ 0
                </p>
                <p className={`text-[11px] font-bold tracking-wider uppercase ${themeKey === "minimal-white" ? "text-[#0F172A]" : isDark ? "text-amber-400 font-extrabold" : "text-[#803D63]"}`}>
                  TOTAL FANBASE
                </p>
                <p className={`text-[10px] font-medium ${isDark ? "text-slate-400" : "text-gray-400"}`}>
                  Connect socials to display total reach
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Direct Social Platform Link Tiles */}
      {activeSocialList.length > 0 && (
        <div className="relative z-10 mt-4 space-y-2 w-full">
          <div className="grid grid-cols-1 gap-2.5 w-full">
            {activeSocialList.map((item) => (
              <a
                key={item.platform}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group rounded-xl p-3.5 transition-all flex items-center justify-between shadow-2xs border ${
                  isDark
                    ? "bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md border-white/15 hover:border-white/30 text-white"
                    : "bg-white/80 hover:bg-white/95 backdrop-blur-md border-white/60 hover:border-[#803D63] text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.badgeBg}`}>
                    {item.icon}
                  </span>
                  <div className="min-w-0 text-left space-y-0.5">
                    <p className={`truncate text-xs font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                      {item.label}
                    </p>
                    {item.handle && (
                      <p className={`truncate text-xs font-medium ${isDark ? "text-slate-300" : "text-[#4B5563]"}`}>
                        @{item.handle.replace(/^@/, "")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-sm font-bold tabular-nums ${isDark ? "text-white" : "text-gray-900"}`}>
                    {formatCount(item.count)}
                  </span>
                  <ExternalLink className={`h-4 w-4 transition-colors ${isDark ? "text-slate-400 group-hover:text-purple-300" : "text-gray-400 group-hover:text-[#803D63]"}`} />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Additional Custom Links (Linktree Style) */}
      {visibilitySettings.showCustomLinks !== false && customLinksList && customLinksList.filter((l) => l.isEnabled !== false && l.title && l.url).length > 0 && (
        <div className="relative z-10 mt-3 space-y-2 w-full text-left">
          <div className="grid grid-cols-1 gap-2 w-full">
            {customLinksList
              .filter((l) => l.isEnabled !== false && l.title && l.url)
              .map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group rounded-xl p-3 text-xs font-bold transition-all flex items-center justify-between shadow-2xs border ${
                    isDark
                      ? "bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md border-white/15 hover:border-white/30 text-white"
                      : "bg-white/80 hover:bg-white/95 backdrop-blur-md border-white/60 hover:border-[#803D63] text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        isDark ? "bg-white/10 text-purple-300" : "bg-[#803D63]/10 text-[#803D63]"
                      }`}
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="truncate">{link.title}</span>
                  </div>
                  <ExternalLink
                    className={`h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                      isDark ? "text-slate-400 group-hover:text-purple-300" : "text-slate-400 group-hover:text-[#803D63]"
                    }`}
                  />
                </a>
              ))}
          </div>
        </div>
      )}

      {/* Interactive Content Switcher (Series, Gigs, Reviews) */}
      {(visibilitySettings.showSeries !== false || visibilitySettings.showCollabGigs !== false || visibilitySettings.showReviews !== false) && (
        <div className="relative z-10 mt-6 w-full text-left">
          {/* Tab Pill Switcher */}
          <div className={`flex items-center gap-1.5 p-1 rounded-2xl border mb-4 ${
            isDark
              ? "bg-slate-950/60 backdrop-blur-md border-white/15"
              : "bg-white/60 backdrop-blur-md border-white/60"
          }`}>
            {visibilitySettings.showSeries !== false && (
              <button
                type="button"
                onClick={() => setActiveContentTab("series")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeContentTab === "series"
                    ? isDark
                      ? "bg-[#803D63]/30 text-white border border-[#803D63]/40 shadow-sm"
                      : "bg-[#803D63]/10 text-[#803D63] border border-[#803D63]/20 shadow-2xs"
                    : isDark
                      ? "text-slate-300 hover:text-white hover:bg-white/10"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <Film className="h-3.5 w-3.5" />
                <span>🎬 Series ({series ? series.length : 0})</span>
              </button>
            )}

            {visibilitySettings.showCollabGigs !== false && (
              <button
                type="button"
                onClick={() => setActiveContentTab("gigs")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeContentTab === "gigs"
                    ? isDark
                      ? "bg-[#803D63]/30 text-white border border-[#803D63]/40 shadow-sm"
                      : "bg-[#803D63]/10 text-[#803D63] border border-[#803D63]/20 shadow-2xs"
                    : isDark
                      ? "text-slate-300 hover:text-white hover:bg-white/10"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <Briefcase className="h-3.5 w-3.5" />
                <span>💼 Gigs ({mediaKitPackages.filter((p) => p.isActive).length})</span>
              </button>
            )}

            {visibilitySettings.showReviews !== false && (
              <button
                type="button"
                onClick={() => setActiveContentTab("reviews")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeContentTab === "reviews"
                    ? isDark
                      ? "bg-[#803D63]/30 text-white border border-[#803D63]/40 shadow-sm"
                      : "bg-[#803D63]/10 text-[#803D63] border border-[#803D63]/20 shadow-2xs"
                    : isDark
                      ? "text-slate-300 hover:text-white hover:bg-white/10"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <Star className="h-3.5 w-3.5" />
                <span>⭐ Reviews ({approvedReviews.length})</span>
              </button>
            )}
          </div>

        {/* TAB 1: 🎬 SERIES & SHOWS */}
        {activeContentTab === "series" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {series && series.length > 0 ? (
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
            ) : (
              <div className={`rounded-2xl border-2 border-dashed p-6 text-center space-y-1.5 ${
                isDark
                  ? "bg-slate-900/60 backdrop-blur-md border-white/20 text-white"
                  : "bg-white/70 backdrop-blur-md border-gray-200 text-slate-900"
              }`}>
                <Film className={`h-7 w-7 mx-auto ${isDark ? "text-slate-400" : "text-slate-400"}`} />
                <p className={`font-bold text-xs ${isDark ? "text-white" : "text-slate-800"}`}>No Series Published Yet</p>
                <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Check back soon for original web series &amp; trailers!</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: 💼 COLLAB GIGS & RATE CARDS */}
        {activeContentTab === "gigs" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {(() => {
              const activePkgs = mediaKitPackages.filter((p) => p.isActive);
              const displayPackages = activePkgs.length > 0 ? activePkgs : SAMPLE_PACKAGES;
              const visiblePackages = showAllGigs ? displayPackages : displayPackages.slice(0, 1);
              const remainingCount = displayPackages.length - 1;

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    {visiblePackages.map((pkg) => {
                      const mailSubject = encodeURIComponent(`[Inflixo Collab Inquiry] - ${pkg.title}`);
                      const mailBody = encodeURIComponent(
                        `Hi ${profile.displayName || "Creator"},\n\nI would like to inquire about collaborating on your "${pkg.title}" package listed on Inflixo.\n\nBest regards,\n[Brand Representative]`
                      );
                      const mailUrl = `mailto:${mediaKitSettings.sponsorEmail}?subject=${mailSubject}&body=${mailBody}`;

                      return (
                        <div
                          key={pkg.id}
                          className={`rounded-2xl p-4 space-y-3 transition-all text-left border ${
                            isDark
                              ? "bg-slate-900/60 backdrop-blur-md border-white/10 text-white"
                              : "bg-white/80 backdrop-blur-md border-slate-200/80 text-slate-900 shadow-2xs"
                          }`}
                        >
                          {/* Header Row: Platform Pill + Badge + Price */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                  isDark
                                    ? "bg-purple-900/40 text-purple-300 border border-purple-500/30"
                                    : "bg-[#F6EBF1] text-[#803D63] border border-[#E8DCE4]"
                                }`}
                              >
                                {pkg.platform}
                              </span>
                              {(pkg.badge || pkg.packageName || pkg.isPopular) && (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isDark ? "bg-amber-400/20 text-amber-300" : "bg-amber-100 text-amber-900"
                                  }`}
                                >
                                  {pkg.badge || pkg.packageName || "⭐ POPULAR"}
                                </span>
                              )}
                            </div>
                            <span
                              className={`font-display text-base font-extrabold shrink-0 ${
                                isDark ? "text-amber-400" : "text-[#803D63]"
                              }`}
                            >
                              {pkg.price}
                            </span>
                          </div>

                          {/* Title & Turnaround */}
                          <div>
                            <h5 className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
                              {pkg.title}
                            </h5>
                            <p
                              className={`text-[11px] font-medium mt-0.5 flex items-center gap-1 ${
                                isDark ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              <Clock className="h-3 w-3 shrink-0" /> Turnaround: {pkg.turnaroundDays} Days
                            </p>
                          </div>

                          {/* Deliverables List */}
                          {pkg.deliverables && pkg.deliverables.length > 0 && (
                            <ul
                              className={`text-xs space-y-1.5 pt-2 border-t ${
                                isDark ? "border-white/10 text-slate-300" : "border-slate-100 text-slate-600"
                              }`}
                            >
                              {pkg.deliverables.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  <span className="leading-snug">{item}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {/* Direct Contact Actions */}
                          {(() => {
                            const hasPhone = Boolean(mediaKitSettings?.whatsappNumber && mediaKitSettings.whatsappNumber.trim());
                            const hasEmail = Boolean(mediaKitSettings?.sponsorEmail && mediaKitSettings.sponsorEmail.trim());

                            let showWhatsApp = true;
                            let showEmail = true;
                            if (hasPhone && !hasEmail) {
                              showWhatsApp = true;
                              showEmail = false;
                            } else if (!hasPhone && hasEmail) {
                              showWhatsApp = false;
                              showEmail = true;
                            } else {
                              showWhatsApp = true;
                              showEmail = true;
                            }

                            return (
                              <div
                                className={`pt-2.5 border-t ${
                                  showWhatsApp && showEmail ? "grid grid-cols-2 gap-2" : "flex w-full"
                                } ${isDark ? "border-white/10" : "border-slate-100"}`}
                              >
                                {showWhatsApp && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedGigForWhatsApp(pkg);
                                      setIsLeadModalOpen(true);
                                    }}
                                    className={`bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-2.5 rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                                      !showEmail ? "w-full" : ""
                                    }`}
                                  >
                                    <MessageCircle className="h-3.5 w-3.5 fill-white" />
                                    <span>Book WhatsApp</span>
                                  </button>
                                )}

                                {showEmail && (
                                  <a
                                    href={mailUrl}
                                    className={`${
                                      isDark
                                        ? "bg-white text-slate-900 hover:bg-slate-100"
                                        : "bg-slate-900 text-white hover:bg-slate-800"
                                    } text-xs font-bold py-2 px-2.5 rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 shadow-2xs ${
                                      !showWhatsApp ? "w-full" : ""
                                    }`}
                                  >
                                    <Mail className="h-3.5 w-3.5" />
                                    <span>Email Brief</span>
                                  </a>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>

                  {/* Toggle / View All Gigs Pill Button */}
                  {displayPackages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setShowAllGigs(!showAllGigs)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                        isDark
                          ? "bg-slate-900/80 text-purple-300 border-purple-500/30 hover:bg-slate-900"
                          : "bg-[#F6EBF1] text-[#803D63] border-[#E8DCE4] hover:bg-[#ECD3E2]"
                      }`}
                    >
                      <span>
                        {showAllGigs
                          ? "Show Fewer Gigs ↑"
                          : `+ ${remainingCount} More Collab Gig${remainingCount > 1 ? "s" : ""} Available ↓`}
                      </span>
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 3: ⭐ CLIENT REVIEWS & TESTIMONIALS */}
        {activeContentTab === "reviews" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {approvedReviews && approvedReviews.length > 0 ? (
              <div className="space-y-3">
                {/* Summary Header */}
                {(() => {
                  const total = approvedReviews.length;
                  const avg = (
                    approvedReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / total
                  ).toFixed(1);

                  // Calculate average scores for category highlights
                  const cqAvg =
                    approvedReviews.reduce(
                      (acc, r) => acc + (r.ratingContentQuality || r.rating || 5),
                      0
                    ) / total;
                  const profAvg =
                    approvedReviews.reduce(
                      (acc, r) => acc + (r.ratingProfessionalism || r.rating || 5),
                      0
                    ) / total;
                  const tdAvg =
                    approvedReviews.reduce(
                      (acc, r) => acc + (r.ratingTimelyDelivery || r.rating || 5),
                      0
                    ) / total;

                  const scores = [
                    { name: "Content Quality", score: cqAvg },
                    { name: "Professionalism", score: profAvg },
                    { name: "Timely Delivery", score: tdAvg },
                  ].sort((a, b) => b.score - a.score);

                  const top2 = scores.slice(0, 2).map((s) => s.name);

                  return (
                    <div
                      className={`rounded-2xl p-3.5 border text-left flex items-center justify-between gap-3 ${
                        isDark
                          ? "bg-[#803D63]/20 border-[#803D63]/40 text-white"
                          : "bg-[#F6EBF1] border-[#E8DCE4] text-slate-900"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-400 text-sm">⭐</span>
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {avg}
                          </span>
                          <span className="text-slate-400 font-bold text-xs">·</span>
                          <span className="font-bold text-xs text-slate-700 dark:text-slate-200">
                            {total} Collaboration{total > 1 ? "s" : ""}
                          </span>
                        </div>
                        <p
                          className={`text-[11px] font-semibold mt-0.5 ${
                            isDark ? "text-purple-200" : "text-[#803D63]"
                          }`}
                        >
                          <strong>Highly rated for:</strong> {top2.join(" · ")}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Individual Review Cards */}
                {approvedReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className={`rounded-2xl p-4 space-y-2.5 transition-all text-left border ${
                      isDark
                        ? "bg-slate-900/60 backdrop-blur-md border-white/10 text-white"
                        : "bg-white/90 backdrop-blur-md border-slate-200/80 text-slate-900 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < (rev.rating || 5)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300 fill-slate-300 opacity-30"
                            }`}
                          />
                        ))}
                      </div>
                      {rev.projectTitle && (
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border truncate max-w-[140px] ${
                              isDark
                                ? "bg-purple-900/40 text-purple-300 border-purple-500/30"
                                : "bg-[#F6EBF1] text-[#803D63] border-[#E8DCE4]"
                            }`}
                          >
                            {rev.projectTitle}
                          </span>
                          {rev.contentUrl && (
                            <a
                              href={rev.contentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border hover:underline flex items-center gap-0.5 ${
                                isDark
                                  ? "bg-slate-800 text-purple-200 border-slate-700"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              <span>Work ↗</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {rev.comment && (
                      <p
                        className={`text-xs font-medium italic leading-relaxed ${
                          isDark ? "text-slate-200" : "text-slate-700"
                        }`}
                      >
                        “{rev.comment}”
                      </p>
                    )}

                    <div className="pt-1 flex items-center justify-between text-[11px] border-t border-slate-200/30">
                      <div className="min-w-0 flex-1 truncate pr-2">
                        <span className={`font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>
                          {rev.clientName}
                        </span>
                        {rev.clientDesignation && (
                          <span className={`ml-1 font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            • {rev.clientDesignation}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-0.5 shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Verified Collaboration
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`rounded-2xl border-2 border-dashed p-6 text-center space-y-1.5 ${
                isDark
                  ? "bg-slate-900/60 backdrop-blur-md border-white/20 text-white"
                  : "bg-white/70 backdrop-blur-md border-gray-200 text-slate-900"
              }`}>
                <Star className="h-7 w-7 mx-auto text-amber-400" />
                <p className={`font-bold text-xs ${isDark ? "text-white" : "text-slate-800"}`}>
                  No Reviews Published Yet
                </p>
                <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Verified brand testimonials &amp; client ratings will appear here once approved.
                </p>
              </div>
            )}
          </div>
        )}
        </div>
      )}

      {/* Bottom Conversion Watermark */}
      <div className="relative z-10 mt-6 pt-4 text-center border-t border-gray-200/30">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={`text-[11px] font-semibold px-3.5 py-1.5 rounded-full border transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
            isDark
              ? "bg-slate-900/80 backdrop-blur-md border-white/20 text-slate-200 hover:bg-slate-900 hover:text-white"
              : "bg-white/80 backdrop-blur-md border-white/60 text-slate-700 hover:bg-white hover:text-[#803D63]"
          }`}
        >
          <InflixoLogoIcon className="h-3.5 w-3.5 text-[#803D63]" />
          <span>Create your own Inflixo</span>
        </a>
      </div>
    </div>
  );

  return (
    <div className={`relative w-full mx-auto transition-all ${isFull ? "max-w-4xl" : "max-w-xl sm:max-w-[540px]"}`}>
      {cardContent}

      {/* Brand Lead Qualifier Anti-Spam Modal */}
      <BrandLeadQualifierModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        creatorName={profile.displayName || "Creator"}
        creatorUsername={profile.username || "creator"}
        whatsappNumber={mediaKitSettings.whatsappNumber || ""}
        packageName={selectedGigForWhatsApp?.title}
        packagePrice={selectedGigForWhatsApp?.price}
        deliverableText={selectedGigForWhatsApp?.deliverables?.join(", ")}
      />

      {/* Episode Quick Drawer */}
      <EpisodeQuickDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        series={drawerSeries}
      />

      {/* Page Display Settings Modal */}
      <VisibilitySettingsModal
        isOpen={isVisibilityModalOpen}
        onClose={() => setIsVisibilityModalOpen(false)}
        settings={visibilitySettings}
        onSave={handleSaveVisibilitySettings}
      />
    </div>
  );
}

function getPlatformInfo(platformStr?: string, urlStr?: string) {
  const p = (platformStr || "").toLowerCase();
  const u = (urlStr || "").toLowerCase();

  if (p.includes("youtube") || u.includes("youtube.com") || u.includes("youtu.be")) {
    return {
      name: "YouTube",
      icon: <YoutubeIcon className="h-3 w-3 text-white" />,
      badgeClass: "bg-red-600 text-white shadow-2xs",
      chipClass: "bg-red-50 text-red-700 border-red-200/80",
      textColor: "text-red-600",
    };
  }
  if (p.includes("instagram") || u.includes("instagram.com")) {
    return {
      name: "Instagram",
      icon: <InstagramIcon className="h-3 w-3 text-white" />,
      badgeClass: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-2xs",
      chipClass: "bg-rose-50 text-rose-700 border-rose-200/80",
      textColor: "text-rose-600",
    };
  }
  if (p.includes("facebook") || u.includes("facebook.com")) {
    return {
      name: "Facebook",
      icon: <FacebookIcon className="h-3 w-3 text-white" />,
      badgeClass: "bg-blue-600 text-white shadow-2xs",
      chipClass: "bg-blue-50 text-blue-700 border-blue-200/80",
      textColor: "text-blue-600",
    };
  }
  return {
    name: platformStr || "Web",
    icon: <Film className="h-3 w-3 text-white" />,
    badgeClass: "bg-[#803D63] text-white shadow-2xs",
    chipClass: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    textColor: "text-[#803D63]",
  };
}

export function PreviewSeriesItem({
  series,
  style,
  themeKey = "minimal-white",
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
  const isDark = isDarkTheme(themeKey);
  const [localExpanded, setLocalExpanded] = useState(false);
  const isOpen = onToggle ? expanded : localExpanded;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onToggle) {
      onToggle();
    }
    setLocalExpanded(!localExpanded);
  };

  const allEpisodes = getSeriesEpisodes(series);
  const genresList = series.genre ? series.genre.split(",").map((g) => g.trim()).filter(Boolean) : [];
  const seriesCategory = genresList.length > 0 ? genresList[0] : (series.genre || "Series");

  const handleShareSeriesLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const handle = username || "creator";
    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}/${handle}/series/${series.id}`
      : `https://inflixo.com/${handle}/series/${series.id}`;
    const title = `${series.title} on Inflixo`;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title, url: shareUrl }).catch(async () => {
        const success = await copyToClipboard(shareUrl);
        if (success) showToast("Series link copied to clipboard! 🎬");
      });
    } else {
      const success = await copyToClipboard(shareUrl);
      if (success) showToast("Series link copied to clipboard! 🎬");
    }
  };

  const seriesLinkUrl = username ? `/${username}/series/${series.id}` : `#`;

  return (
    <div
      id={`series-${series.id}`}
      className={`rounded-2xl p-4 sm:p-5 transition-all text-left border space-y-3.5 ${
        isDark
          ? "bg-slate-900/70 backdrop-blur-md border-white/15 hover:border-purple-400/60 text-white shadow-md"
          : "bg-white/85 backdrop-blur-md border-slate-200/80 hover:border-[#803D63]/50 hover:bg-white text-slate-900 shadow-2xs"
      }`}
    >
      {/* 1. Header: Title, Subtitle, Description & Share Button */}
      <div className="flex items-start justify-between gap-3 text-left">
        <div className="min-w-0 flex-1 space-y-0.5">
          <Link href={seriesLinkUrl} className="group inline-block">
            <h3 className={`text-base sm:text-lg font-extrabold leading-tight break-words text-left transition-colors ${
              isDark ? "text-white group-hover:text-purple-300" : "text-slate-900 group-hover:text-[#803D63]"
            }`}>
              {series.title}
            </h3>
          </Link>
          <p className={`text-xs font-semibold text-left ${
            isDark ? "text-purple-300/80" : "text-slate-500"
          }`}>
            {seriesCategory} • {allEpisodes.length} {allEpisodes.length === 1 ? "Episode" : "Episodes"}
          </p>
          {series.description && (
            <p className={`text-xs font-medium leading-relaxed line-clamp-2 pt-1 text-left ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}>
              {series.description}
            </p>
          )}
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShareSeriesLink}
          className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-colors cursor-pointer shrink-0 ${
            isDark
              ? "border-white/15 bg-white/10 text-slate-300 hover:text-white hover:bg-white/20"
              : "border-slate-200 bg-slate-50 text-slate-500 hover:text-[#803D63] hover:bg-rose-50/50 shadow-2xs"
          }`}
          title="Share Series Link"
          aria-label="Share Series"
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 2. Interactive Toggle Button: View All X Episodes ↓ / ↑ */}
      <button
        type="button"
        onClick={handleToggle}
        className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-extrabold transition-all border shadow-2xs cursor-pointer ${
          isOpen
            ? "bg-[#803D63] border-[#803D63] text-white"
            : isDark
            ? "bg-purple-900/50 border-purple-400/30 text-purple-200 hover:bg-purple-800/70 hover:border-purple-400 hover:text-white"
            : "bg-[#F6EBF1] border-[#E8DCE4] text-[#803D63] hover:bg-[#803D63] hover:text-white"
        }`}
      >
        <span>
          {isOpen
            ? `Hide Episodes (${allEpisodes.length}) ↑`
            : `View All ${allEpisodes.length} ${allEpisodes.length === 1 ? "Episode" : "Episodes"} ↓`}
        </span>
      </button>

      {/* 3. Expanded Episodes List */}
      {isOpen && (
        <div className="space-y-2.5 pt-1 animate-in fade-in duration-200">
          {allEpisodes.length > 0 ? (
            <div className="space-y-1.5">
              {allEpisodes.map((ep, idx) => {
                const partNum = ep.episodeNumber || idx + 1;
                const partNumStr = partNum < 10 ? `0${partNum}` : `${partNum}`;
                const epTitleStr = ep.title && ep.title.trim() ? ep.title : `Part ${partNumStr}`;

                return (
                  <a
                    key={ep.id || idx}
                    href={ep.externalUrl || "#"}
                    target={ep.externalUrl ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition-all border text-left cursor-pointer ${
                      isDark
                        ? "bg-slate-950/40 border-white/10 hover:border-purple-400/40 hover:bg-purple-950/30 text-white"
                        : "bg-slate-50/80 border-slate-200/70 hover:border-[#803D63]/30 hover:bg-purple-50/40 text-slate-900"
                    }`}
                  >
                    {/* ▶ Play Icon */}
                    <div className={`flex h-6 w-6 items-center justify-center rounded-lg shrink-0 transition-colors ${
                      isDark
                        ? "bg-purple-500/20 text-purple-300 group-hover:bg-purple-600 group-hover:text-white"
                        : "bg-[#803D63]/10 text-[#803D63] group-hover:bg-[#803D63] group-hover:text-white"
                    }`}>
                      <Play className="h-3 w-3 fill-current ml-0.5" />
                    </div>

                    {/* Part 01 Badge Label */}
                    <span className={`font-extrabold text-xs shrink-0 tracking-tight min-w-[52px] ${
                      isDark ? "text-purple-300" : "text-[#803D63]"
                    }`}>
                      Part {partNumStr}
                    </span>

                    {/* Episode Title */}
                    <span className={`font-semibold text-xs truncate flex-1 ${
                      isDark ? "text-slate-200 group-hover:text-white" : "text-slate-800 group-hover:text-slate-950"
                    }`}>
                      {epTitleStr}
                    </span>

                    {/* External Link Arrow Icon */}
                    <ExternalLink className={`h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0 ${
                      isDark ? "text-purple-300" : "text-[#803D63]"
                    }`} />
                  </a>
                );
              })}
            </div>
          ) : (
            <div className={`text-xs font-medium py-3 px-3 rounded-xl border text-center ${
              isDark ? "bg-slate-950/30 border-white/10 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
            }`}>
              No episodes published in this series yet.
            </div>
          )}

          {/* Link to Full Series Detail Page inside expanded section */}
          <div className="pt-1 text-center">
            <Link
              href={seriesLinkUrl}
              className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors ${
                isDark ? "text-purple-300 hover:text-purple-200" : "text-[#803D63] hover:text-[#6D3254]"
              }`}
            >
              <span>Go to Full Series Details Page</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
