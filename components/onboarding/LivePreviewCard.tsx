import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Sparkles, ExternalLink, Play, Film, Share2, ChevronDown, ChevronUp, ChevronRight, Copy, Eye, Briefcase, Clock, CheckCircle2, MessageCircle, Mail, Link as LinkIcon } from "lucide-react";
import { CreatorProfile, SocialAccounts, ThemeKey, Series, MediaKitPackage, MediaKitSettings, CustomLink } from "@/types";
import { formatCount } from "@/utils/format";
import { MediaKitService, SAMPLE_PACKAGES } from "@/services/MediaKitService";
import { customLinksRepository } from "@/repositories/localRepository";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { InflixoLogoIcon } from "@/components/shared/Logo";
import { useToast } from "@/contexts/ToastContext";
import { ShareSeriesModal } from "@/components/shared/ShareSeriesModal";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { SeriesPoster } from "@/components/shared/SeriesPoster";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { BrandLeadQualifierModal } from "@/components/mediakit/BrandLeadQualifierModal";
import { EpisodeQuickDrawer } from "@/components/series/EpisodeQuickDrawer";

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
  cardBg: "bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] border border-slate-200 text-slate-900 shadow-xl",
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
  handleColor: "text-[#803D63]",
};

const SIGNATURE_PURPLE_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-br from-[#faf5ff] via-[#f3e8ff] to-[#e9d5ff] text-slate-900 border border-purple-200 shadow-xl",
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
  cardBg: "bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#047857] text-white border border-emerald-500/30 shadow-2xl",
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
  cardBg: "bg-gradient-to-br from-[#881337] via-[#4c0519] to-[#9f1239] text-white border border-rose-500/30 shadow-2xl",
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
  cardBg: "bg-gradient-to-br from-[#09090b] via-[#0f172a] to-[#164e63] text-white border border-cyan-500/30 shadow-2xl",
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
  customLinks?: CustomLink[];
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
  totalAudience: passedTotalAudience,
  themeKey = "minimal-white",
  compact = false,
  variant,
  onShare,
}: LivePreviewCardProps) {
  const { showToast } = useToast();
  const [expandedSeriesId, setExpandedSeriesId] = useState<string | null>(null);
  const [activeContentTab, setActiveContentTab] = useState<"series" | "gigs">("series");
  const [mediaKitPackages, setMediaKitPackages] = useState<MediaKitPackage[]>([]);
  const [mediaKitSettings, setMediaKitSettings] = useState<MediaKitSettings>(MediaKitService.DEFAULT_SETTINGS);
  const [customLinksList, setCustomLinksList] = useState<CustomLink[]>(passedCustomLinks || []);
  const [selectedGigForWhatsApp, setSelectedGigForWhatsApp] = useState<MediaKitPackage | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [drawerSeries, setDrawerSeries] = useState<Series | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAllGigs, setShowAllGigs] = useState(false);

  const isDark = isDarkTheme(themeKey);

  useEffect(() => {
    if (passedCustomLinks) {
      setCustomLinksList(passedCustomLinks);
    } else {
      setCustomLinksList(customLinksRepository.get());
    }
  }, [passedCustomLinks]);

  useEffect(() => {
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
  }, [profile.id, profile.email, profile.username]);

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
          className={`tap-scale flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-2xs transition-all ${style.socialItemBg} ${style.socialItemBorder}`}
        >
          <div className={`flex h-6 w-6 items-center justify-center rounded-xl text-white shadow-2xs ${
            isDark ? "bg-gradient-to-tr from-purple-600 to-rose-600" : "bg-[#803D63]"
          }`}>
            <InflixoLogoIcon className="h-3.5 w-3.5" />
          </div>
          <span className={`font-display text-sm font-black tracking-tight ${
            isDark ? "text-white" : "text-[#803D63]"
          }`}>
            Inflixo
          </span>
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
      {customLinksList && customLinksList.filter((l) => l.isEnabled !== false && l.title && l.url).length > 0 && (
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

      {/* Interactive 2-Tab Content Switcher (Series & Shows vs Collab Gigs) */}
      <div className="relative z-10 mt-6 w-full text-left">
        {/* 2-Tab Pill Switcher */}
        <div className={`flex items-center gap-1.5 p-1 rounded-2xl border mb-4 ${
          isDark
            ? "bg-slate-950/60 backdrop-blur-md border-white/15"
            : "bg-white/60 backdrop-blur-md border-white/60"
        }`}>
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
            <span>💼 Collab Gigs ({mediaKitPackages.filter((p) => p.isActive).length})</span>
          </button>
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
                          <div
                            className={`pt-2.5 border-t grid grid-cols-2 gap-2 ${
                              isDark ? "border-white/10" : "border-slate-100"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedGigForWhatsApp(pkg);
                                setIsLeadModalOpen(true);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-2.5 rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <MessageCircle className="h-3.5 w-3.5 fill-white" />
                              <span>Book WhatsApp</span>
                            </button>

                            {mediaKitSettings.sponsorEmail && (
                              <a
                                href={mailUrl}
                                className={`${
                                  isDark
                                    ? "bg-white text-slate-900 hover:bg-slate-100"
                                    : "bg-slate-900 text-white hover:bg-slate-800"
                                } text-xs font-bold py-2 px-2.5 rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 shadow-2xs`}
                              >
                                <Mail className="h-3.5 w-3.5" />
                                <span>Email Brief</span>
                              </a>
                            )}
                          </div>
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
    </div>

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
  const allEpisodes = getSeriesEpisodes(series);
  const genresList = series.genre ? series.genre.split(",").map((g) => g.trim()).filter(Boolean) : [];

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

  const firstEp = allEpisodes[0];
  const mainPlatform = firstEp ? getPlatformInfo(firstEp.platform, firstEp.externalUrl) : getPlatformInfo("YouTube");
  const seriesLinkUrl = username ? `/${username}/series/${series.id}` : `#`;

  return (
    <div
      id={`series-${series.id}`}
      className={`rounded-2xl p-3.5 sm:p-4 transition-all text-left border ${
        isDark
          ? "bg-slate-900/70 backdrop-blur-md border-white/15 hover:border-purple-400 text-white shadow-md"
          : "bg-white/80 backdrop-blur-md border-white/60 hover:border-[#803D63] hover:bg-white/95 text-slate-900 shadow-2xs"
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-4 w-full text-left">
        {/* Widescreen 16:9 Netflix-Style Hero Poster Thumbnail */}
        <div className={`relative w-full sm:w-48 aspect-video rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border shrink-0 shadow-2xs ${
          isDark ? "border-white/15" : "border-gray-200"
        }`}>
          <SeriesPoster
            src={series.posterDataUrl}
            title={series.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            textClassName="text-[11px] font-bold text-indigo-200"
          />

          {/* Top-Left Genre Badge Overlay on Thumbnail */}
          {genresList.length > 0 && (
            <div className="absolute top-1.5 left-1.5 z-10 max-w-[75%]">
              <span className="bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs border border-white/20 truncate inline-block">
                {genresList[0]}
              </span>
            </div>
          )}

          {/* Episode Count Badge inside Thumbnail (Bottom-Right) */}
          <div className="absolute bottom-1.5 right-1.5 z-10">
            <span className="bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs border border-white/10">
              {allEpisodes.length} {allEpisodes.length === 1 ? "Ep" : "Eps"}
            </span>
          </div>
        </div>

        {/* Series Info & Details on Right (Clean Left Alignment) */}
        <div className="min-w-0 flex-1 space-y-1.5 text-left w-full">
          <div className="flex items-center justify-between gap-2 text-left">
            <h3 className={`text-sm sm:text-base font-bold leading-snug break-words text-left ${
              isDark ? "text-white" : "text-[#111827]"
            }`}>
              {series.title}
            </h3>

            {/* Action Icon Group: Share + View Page Icon Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Share Icon Button */}
              <button
                type="button"
                onClick={handleShareSeriesLink}
                className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                  isDark
                    ? "border-white/15 bg-white/10 text-slate-300 hover:text-white hover:bg-white/20"
                    : "border-gray-200 bg-white/80 text-gray-500 hover:text-[#803D63]"
                }`}
                title="Share Series Link"
                aria-label="Share Series"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>

              {/* View Page Icon Button (Next to Share button -> Opens Series Detail Page) */}
              <Link
                href={seriesLinkUrl}
                className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                  isDark
                    ? "border-purple-400/40 bg-purple-900/60 text-purple-200 hover:bg-purple-800/80"
                    : "border-indigo-200 bg-[#F6EBF1] hover:bg-indigo-100 text-[#803D63]"
                }`}
                title="View Series Details Page"
                aria-label="View Series Page"
              >
                <Eye className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {series.description && (
            <p className={`text-xs font-medium leading-relaxed line-clamp-2 text-left ${
              isDark ? "text-slate-300" : "text-[#4B5563]"
            }`}>
              {series.description}
            </p>
          )}

          {/* Bottom Platform Tag & Episode Count Meta Row */}
          <div className={`pt-2 mt-1 flex items-center justify-between gap-2 border-t text-left w-full ${
            isDark ? "border-white/10" : "border-gray-100"
          }`}>
            <div className="flex items-center gap-2 min-w-0 text-left shrink-0">
              {/* Logo-Only Platform Badge (No Text) */}
              <span
                className={`inline-flex items-center justify-center h-6.5 w-6.5 rounded-md border shrink-0 ${mainPlatform.chipClass}`}
                title={mainPlatform.name}
                aria-label={mainPlatform.name}
              >
                <span className={`flex h-4 w-4 items-center justify-center rounded ${mainPlatform.badgeClass}`}>
                  {mainPlatform.icon}
                </span>
              </span>

              {/* Highlighted Interactive Episodes Count Link Button */}
              <button
                type="button"
                onClick={onToggle}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
                  expanded
                    ? "bg-[#803D63] text-white border-[#803D63] ring-2 ring-[#803D63]/30 shadow-xs"
                    : isDark
                    ? "bg-purple-900/60 text-purple-200 border-purple-400/40 hover:bg-purple-800/80"
                    : "bg-[#F6EBF1] text-[#803D63] border-[#E8DCE4] hover:bg-[#803D63] hover:text-white"
                }`}
                title="Click to view episode playlist"
              >
                <Film className="h-3.5 w-3.5" />
                <span>{allEpisodes.length} {allEpisodes.length === 1 ? "Episode" : "Episodes"}</span>
                <span className="font-extrabold">{expanded ? "↑" : "↓"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Episodes List Drawer (In-line List Below Card) */}
      {expanded && allEpisodes.length > 0 && (
        <div className={`mt-3 pt-3 border-t space-y-2 rounded-xl p-3 text-left ${
          isDark
            ? "border-white/10 bg-slate-950/60 backdrop-blur-md"
            : "border-gray-200/60 bg-white/50 backdrop-blur-md"
        }`}>
          <div className="flex items-center justify-between pb-1 text-left">
            <span className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-gray-700"}`}>
              Episodes Playlist ({allEpisodes.length})
            </span>
            <span className={`text-[10px] font-medium ${isDark ? "text-slate-400" : "text-gray-500"}`}>
              Click Watch to open video
            </span>
          </div>
          <div className="space-y-2">
            {allEpisodes.map((ep) => {
              const plat = getPlatformInfo(ep.platform, ep.externalUrl);
              const epNumStr = ep.episodeNumber < 10 ? `EP 0${ep.episodeNumber}` : `EP ${ep.episodeNumber}`;
              const epTitleStr = ep.title && ep.title.trim() ? ep.title : `Part ${ep.episodeNumber}`;

              return (
                <a
                  key={ep.id}
                  href={ep.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center justify-between gap-3 rounded-xl p-2.5 sm:p-3 transition-all text-left border ${
                    isDark
                      ? "bg-slate-900/80 backdrop-blur-sm border-white/15 hover:border-purple-400 text-white"
                      : "bg-white/80 backdrop-blur-sm border-white/50 hover:border-[#803D63] text-slate-900 shadow-2xs"
                  }`}
                >
                  {/* Left Side: EP Badge + Platform Logo + Multiline Title */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
                    <span className={`font-bold text-[11px] px-2 py-1 rounded-md border shrink-0 ${
                      isDark
                        ? "bg-purple-900/60 text-purple-200 border-purple-400/40"
                        : "bg-[#F6EBF1] text-[#803D63] border-[#E8DCE4]"
                    }`}>
                      {epNumStr}
                    </span>

                    {/* Logo-Only Platform Badge (No Text) */}
                    <span
                      className={`inline-flex items-center justify-center h-6 w-6 rounded-md border shrink-0 ${plat.chipClass}`}
                      title={plat.name}
                      aria-label={plat.name}
                    >
                      <span className={`flex h-4 w-4 items-center justify-center rounded ${plat.badgeClass}`}>
                        {plat.icon}
                      </span>
                    </span>

                    {/* Multiline Episode Title (No Truncation) */}
                    <p className={`text-xs font-bold leading-normal break-words transition-colors text-left flex-1 min-w-0 ${
                      isDark ? "text-white group-hover:text-purple-300" : "text-gray-900 group-hover:text-[#803D63]"
                    }`}>
                      {epTitleStr}
                    </p>
                  </div>

                  {/* Right Side: Icon-Only Watch Button (40x40 Target) */}
                  <div className="flex items-center shrink-0 ml-1">
                    <span
                      className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        isDark
                          ? "bg-gradient-to-r from-purple-600 to-rose-600 text-white border-purple-400/40 group-hover:from-purple-500 group-hover:to-rose-500 shadow-2xs"
                          : "bg-[#F6EBF1] text-[#803D63] border-[#E8DCE4] group-hover:bg-[#803D63] group-hover:text-white shadow-2xs"
                      }`}
                      aria-label="Watch episode"
                      title="Watch episode"
                    >
                      <ExternalLink className="h-4 w-4 stroke-[2.5]" />
                    </span>
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
