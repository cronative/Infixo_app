"use client";

import type { CreatorProduct } from "@/types";
import { ProductImage, formatProductPrice } from "@/components/products/ProductImage";
import { ProductImageLightbox } from "@/components/products/ProductImageLightbox";

import { useState, useEffect, useRef, Fragment, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Users,
  Sparkles,
  ExternalLink,
  Film,
  Share2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Briefcase,
  Clock,
  BadgeCheck,
  CheckCircle2,
  Check,
  MapPin,
  MessageCircle,
  Mail,
  Link as LinkIcon,
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Star,
  Settings,
  Globe,
  Handshake,
  Award,
  Building2,
  User,
  UserCheck,
  Send,
  AtSign,
  Laptop,
  ShoppingBag,
  ZoomIn,
  Play,
  Folder,
  Ticket,
  Tv,
  Layers,
  Clapperboard,
  Crown,
  Rocket,
} from "lucide-react";
import {
  CreatorProfile,
  SocialAccounts,
  ThemeKey,
  Series,
  MediaKitPackage,
  MediaKitSettings,
  CustomLink,
  CreatorReview,
  VisibilitySettings,
  DEFAULT_VISIBILITY_SETTINGS,
  CreatorTeam,
  TeamMember,
  CreatorBrand,
  CreatorCollaboration,
  OtherSocialAccount,
  CreatorProfileSection,
  CreatorSetupItem,
  DEFAULT_PROFILE_SECTIONS,
  EMPTY_SOCIAL_ACCOUNTS,
} from "@/types";
import { formatCount } from "@/utils/format";
import { MediaKitService, SAMPLE_PACKAGES } from "@/services/MediaKitService";
import {
  customLinksRepository,
  reviewsRepository,
  teamRepository,
  brandsRepository,
  collaborationsRepository,
  otherSocialsRepository,
  sectionsRepository,
  creatorSetupRepository,
} from "@/repositories/localRepository";
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
  WhatsappIcon,
  TikTokIcon,
} from "@/components/shared/BrandIcons";
import { InflixoLogoIcon } from "@/components/shared/Logo";
import { useToast } from "@/contexts/ToastContext";
import { ShareSeriesModal } from "@/components/shared/ShareSeriesModal";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { MadeWithInflixo } from "@/components/shared/MadeWithInflixo";
import { isDarkTheme, PUBLIC_ICON_BUTTON, PUBLIC_TEXT_BUTTON, PUBLIC_TYPE } from "@/components/public/publicTheme";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { SeriesPoster } from "@/components/shared/SeriesPoster";
import { PlatformThumbnailBox } from "@/components/shared/PlatformThumbnailBox";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { FocusOverlay } from "@/components/theme/FocusOverlay";
import { BrandLeadQualifierModal } from "@/components/mediakit/BrandLeadQualifierModal";
import { CollaborationInquiryModal } from "@/components/mediakit/CollaborationInquiryModal";
import { EpisodeQuickDrawer } from "@/components/series/EpisodeQuickDrawer";
import { VisibilitySettingsModal } from "@/components/shared/VisibilitySettingsModal";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { getInitials } from "@/lib/avatar";

function formatIndianPackagePrice(pkg: MediaKitPackage): string {
  const min = pkg.minPrice?.trim();
  const max = pkg.maxPrice?.trim();
  if (min && max) {
    const formattedMin = min.startsWith("₹") ? min : `₹${min}`;
    const formattedMax = max.startsWith("₹") ? max : `₹${max}`;
    return `${formattedMin} – ${formattedMax}`;
  }
  if (min && !max) {
    const formattedMin = min.startsWith("₹") ? min : `₹${min}`;
    return `Starting from ${formattedMin}`;
  }

  const raw = (pkg.price || "").trim();
  if (!raw) return "Contact for pricing";

  const lower = raw.toLowerCase();
  if (lower.includes("contact") || lower.includes("negotiable") || lower.includes("custom")) {
    return raw;
  }

  if (raw.includes("–") || raw.includes("-") || lower.includes(" to ")) {
    return raw.startsWith("₹") ? raw : `₹${raw}`;
  }

  if (lower.startsWith("starting from") || lower.startsWith("from")) {
    return raw;
  }

  const cleanNumber = raw.replace(/^₹\s*/, "").trim();
  if (/^\d[\d,]*$/.test(cleanNumber)) {
    const num = Number(cleanNumber.replace(/,/g, ""));
    if (!Number.isNaN(num)) {
      return `₹${num.toLocaleString("en-IN")}`;
    }
  }

  return raw.startsWith("₹") ? raw : `₹${raw}`;
}

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
  cardBg: "bg-white border border-slate-200/90 text-slate-900 shadow-xl",
  profBadgeBg: "bg-slate-100",
  profBadgeText: "text-slate-800",
  profBadgeBorder: "border-slate-200",
  fanbaseBg: "bg-slate-100",
  fanbaseText: "text-slate-800",
  socialItemBg: "bg-slate-50/90 backdrop-blur-xs",
  socialItemBorder: "border-slate-200/80",
  socialNameColor: "text-slate-900",
  socialUnitColor: "text-slate-500",
  nameColor: "text-slate-900",
  bioColor: "text-slate-600",
  handleColor: "text-slate-500",
};

const MINIMAL_WHITE_STYLE: ThemeStyleConfig = DEFAULT_THEME_STYLE;

const SAGE_STUDIO_STYLE: ThemeStyleConfig = {
  cardBg: "bg-[#F7F1E4] border border-[#254334]/20 text-[#1E2A20] shadow-xl",
  profBadgeBg: "bg-[#FFFDF6]/85",
  profBadgeText: "text-[#254334]",
  profBadgeBorder: "border-[#254334]/20",
  fanbaseBg: "bg-[#FFFDF6]",
  fanbaseText: "text-[#1E2A20]",
  socialItemBg: "bg-[#FFFDF6] hover:bg-[#ECEFDB]",
  socialItemBorder: "border-[#254334]/18 hover:border-[#254334]/30",
  socialNameColor: "text-[#1E2A20]",
  socialUnitColor: "text-[#75806D]",
  nameColor: "text-[#1E2A20]",
  bioColor: "text-[#4D5A47]",
  handleColor: "text-[#B96A45]",
};

const BLUSH_PAPER_STYLE: ThemeStyleConfig = {
  cardBg: "bg-[#FFF7F6] border border-[#4A2434]/15 text-[#2A1720] shadow-xl",
  profBadgeBg: "bg-white/88",
  profBadgeText: "text-[#4A2434]",
  profBadgeBorder: "border-[#4A2434]/15",
  fanbaseBg: "bg-white",
  fanbaseText: "text-[#2A1720]",
  socialItemBg: "bg-white hover:bg-[#FBECE8]",
  socialItemBorder: "border-[#4A2434]/14 hover:border-[#4A2434]/28",
  socialNameColor: "text-[#2A1720]",
  socialUnitColor: "text-[#9A7E86]",
  nameColor: "text-[#2A1720]",
  bioColor: "text-[#6B4C57]",
  handleColor: "text-[#C75D53]",
};

const STUDIO_FROST_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-b from-[#F8FAFC] via-white to-[#EEF4FF] border border-[#D8E2F0] text-[#7A2253] shadow-xl",
  profBadgeBg: "bg-white/92 backdrop-blur-md",
  profBadgeText: "text-[#7A2253]",
  profBadgeBorder: "border-[#D8E2F0]",
  fanbaseBg: "bg-white/92 backdrop-blur-md",
  fanbaseText: "text-[#7A2253]",
  socialItemBg: "bg-white/88 hover:bg-[#F1F5F9] backdrop-blur-md",
  socialItemBorder: "border-[#D8E2F0] hover:border-[#7A2253]/24",
  socialNameColor: "text-[#7A2253]",
  socialUnitColor: "text-[#64748B]",
  nameColor: "text-[#7A2253]",
  bioColor: "text-[#475569]",
  handleColor: "text-[#64748B]",
};

const TAJ_MAHAL_STYLE: ThemeStyleConfig = {
  cardBg: "bg-[#FFFDF7]/56 border border-white/45 text-[#221A12] shadow-xl backdrop-blur-lg",
  profBadgeBg: "bg-white/72 backdrop-blur-md",
  profBadgeText: "text-[#7A2253]",
  profBadgeBorder: "border-[#DCCDB2]/70",
  fanbaseBg: "bg-white/80 backdrop-blur-md",
  fanbaseText: "text-[#221A12]",
  socialItemBg: "bg-white/78 hover:bg-[#F7F0E4]/88 backdrop-blur-md",
  socialItemBorder: "border-[#DCCDB2]/70 hover:border-[#7A2253]/28",
  socialNameColor: "text-[#221A12]",
  socialUnitColor: "text-[#766A58]",
  nameColor: "text-[#221A12]",
  bioColor: "text-[#5F5446]",
  handleColor: "text-[#8C6A3E]",
};

const MARINE_DRIVE_STYLE: ThemeStyleConfig = {
  cardBg: "bg-[#071827]/64 border border-white/18 text-[#F8FAFC] shadow-2xl backdrop-blur-xl",
  profBadgeBg: "bg-white/12 backdrop-blur-md",
  profBadgeText: "text-[#F8FAFC]",
  profBadgeBorder: "border-white/18",
  fanbaseBg: "bg-white/12 backdrop-blur-md",
  fanbaseText: "text-[#F8FAFC]",
  socialItemBg: "bg-white/10 hover:bg-white/16 backdrop-blur-md",
  socialItemBorder: "border-white/16 hover:border-[#7DD3FC]/40",
  socialNameColor: "text-[#F8FAFC]",
  socialUnitColor: "text-[#B8D7E8]",
  nameColor: "text-[#F8FAFC]",
  bioColor: "text-[#C7D7E5]",
  handleColor: "text-[#7DD3FC]",
};

const BURJ_KHALIFA_STYLE: ThemeStyleConfig = {
  cardBg: "bg-[#090B12]/68 border border-[#F5C76B]/22 text-[#FFF8E7] shadow-2xl backdrop-blur-xl",
  profBadgeBg: "bg-white/10 backdrop-blur-md",
  profBadgeText: "text-[#FFF8E7]",
  profBadgeBorder: "border-[#F5C76B]/22",
  fanbaseBg: "bg-white/10 backdrop-blur-md",
  fanbaseText: "text-[#FFF8E7]",
  socialItemBg: "bg-white/10 hover:bg-white/16 backdrop-blur-md",
  socialItemBorder: "border-[#F5C76B]/18 hover:border-[#F5C76B]/42",
  socialNameColor: "text-[#FFF8E7]",
  socialUnitColor: "text-[#D9C69C]",
  nameColor: "text-[#FFF8E7]",
  bioColor: "text-[#D7DCE7]",
  handleColor: "text-[#F5C76B]",
};

const SOMNATH_TEMPLE_STYLE: ThemeStyleConfig = {
  cardBg: "bg-[#FFF8EC]/60 border border-white/42 text-[#261A0F] shadow-xl backdrop-blur-lg",
  profBadgeBg: "bg-white/74 backdrop-blur-md",
  profBadgeText: "text-[#7A2253]",
  profBadgeBorder: "border-[#E6C58B]/55",
  fanbaseBg: "bg-white/80 backdrop-blur-md",
  fanbaseText: "text-[#261A0F]",
  socialItemBg: "bg-white/78 hover:bg-[#FFF0D4]/90 backdrop-blur-md",
  socialItemBorder: "border-[#E6C58B]/55 hover:border-[#7A2253]/28",
  socialNameColor: "text-[#261A0F]",
  socialUnitColor: "text-[#7B664E]",
  nameColor: "text-[#261A0F]",
  bioColor: "text-[#64523E]",
  handleColor: "text-[#A35A18]",
};

const DWARKA_TEMPLE_STYLE: ThemeStyleConfig = {
  cardBg: "bg-[#F7FBF8]/58 border border-white/42 text-[#14251D] shadow-xl backdrop-blur-lg",
  profBadgeBg: "bg-white/74 backdrop-blur-md",
  profBadgeText: "text-[#7A2253]",
  profBadgeBorder: "border-[#B7D0C0]/60",
  fanbaseBg: "bg-white/80 backdrop-blur-md",
  fanbaseText: "text-[#14251D]",
  socialItemBg: "bg-white/78 hover:bg-[#EAF4ED]/90 backdrop-blur-md",
  socialItemBorder: "border-[#B7D0C0]/60 hover:border-[#7A2253]/28",
  socialNameColor: "text-[#14251D]",
  socialUnitColor: "text-[#597163]",
  nameColor: "text-[#14251D]",
  bioColor: "text-[#465C50]",
  handleColor: "text-[#0E766A]",
};

const GOA_BEACH_STYLE: ThemeStyleConfig = {
  cardBg: "bg-[#FFF8EF]/58 border border-white/44 text-[#241A12] shadow-xl backdrop-blur-lg",
  profBadgeBg: "bg-white/74 backdrop-blur-md",
  profBadgeText: "text-[#7A2253]",
  profBadgeBorder: "border-[#F0C98D]/60",
  fanbaseBg: "bg-white/80 backdrop-blur-md",
  fanbaseText: "text-[#241A12]",
  socialItemBg: "bg-white/78 hover:bg-[#FFF0D8]/90 backdrop-blur-md",
  socialItemBorder: "border-[#F0C98D]/60 hover:border-[#7A2253]/28",
  socialNameColor: "text-[#241A12]",
  socialUnitColor: "text-[#7A5F49]",
  nameColor: "text-[#241A12]",
  bioColor: "text-[#5F4B3A]",
  handleColor: "text-[#0F766E]",
};

const CREATOR_STUDIO_STYLE: ThemeStyleConfig = {
  cardBg: "bg-[#F8FAFC] border border-[#D8E2F0] text-[#7A2253] shadow-xl",
  profBadgeBg: "bg-white",
  profBadgeText: "text-[#7A2253]",
  profBadgeBorder: "border-[#D8E2F0]",
  fanbaseBg: "bg-white",
  fanbaseText: "text-[#7A2253]",
  socialItemBg: "bg-white hover:bg-[#F1F5F9]",
  socialItemBorder: "border-[#D8E2F0] hover:border-[#7A2253]/25",
  socialNameColor: "text-[#7A2253]",
  socialUnitColor: "text-[#64748B]",
  nameColor: "text-[#7A2253]",
  bioColor: "text-[#475569]",
  handleColor: "text-[#64748B]",
};

const NEON_REELS_STYLE: ThemeStyleConfig = {
  cardBg: "bg-[#070A18]/82 border border-[#FF3B8D]/24 text-[#F8FAFC] shadow-2xl backdrop-blur-xl",
  profBadgeBg: "bg-white/10 backdrop-blur-md",
  profBadgeText: "text-[#F8FAFC]",
  profBadgeBorder: "border-[#FF3B8D]/24",
  fanbaseBg: "bg-white/10 backdrop-blur-md",
  fanbaseText: "text-[#F8FAFC]",
  socialItemBg: "bg-white/10 hover:bg-white/16 backdrop-blur-md",
  socialItemBorder: "border-[#FF3B8D]/20 hover:border-[#38BDF8]/45",
  socialNameColor: "text-[#F8FAFC]",
  socialUnitColor: "text-[#C4B5FD]",
  nameColor: "text-[#F8FAFC]",
  bioColor: "text-[#CBD5E1]",
  handleColor: "text-[#38BDF8]",
};

const PODCAST_LOUNGE_STYLE: ThemeStyleConfig = {
  cardBg: "bg-[#17110D]/82 border border-[#D9A441]/24 text-[#FFF7ED] shadow-2xl backdrop-blur-xl",
  profBadgeBg: "bg-white/10 backdrop-blur-md",
  profBadgeText: "text-[#FFF7ED]",
  profBadgeBorder: "border-[#D9A441]/24",
  fanbaseBg: "bg-white/10 backdrop-blur-md",
  fanbaseText: "text-[#FFF7ED]",
  socialItemBg: "bg-white/10 hover:bg-white/16 backdrop-blur-md",
  socialItemBorder: "border-[#D9A441]/20 hover:border-[#D9A441]/45",
  socialNameColor: "text-[#FFF7ED]",
  socialUnitColor: "text-[#D6C2A4]",
  nameColor: "text-[#FFF7ED]",
  bioColor: "text-[#D6C2A4]",
  handleColor: "text-[#D9A441]",
};

const FOOD_VLOG_STYLE: ThemeStyleConfig = {
  cardBg: "bg-[#FFF9F0] border border-[#F2D8B6] text-[#2D1E12] shadow-xl",
  profBadgeBg: "bg-white",
  profBadgeText: "text-[#2D1E12]",
  profBadgeBorder: "border-[#F2D8B6]",
  fanbaseBg: "bg-white",
  fanbaseText: "text-[#2D1E12]",
  socialItemBg: "bg-white hover:bg-[#FFF0D9]",
  socialItemBorder: "border-[#F2D8B6] hover:border-[#C45A25]/35",
  socialNameColor: "text-[#2D1E12]",
  socialUnitColor: "text-[#7A5A3A]",
  nameColor: "text-[#2D1E12]",
  bioColor: "text-[#684A2F]",
  handleColor: "text-[#C45A25]",
};

const GAMER_STREAM_STYLE: ThemeStyleConfig = {
  cardBg: "bg-[#070B13]/86 border border-[#34D399]/22 text-[#ECFDF5] shadow-2xl backdrop-blur-xl",
  profBadgeBg: "bg-white/10 backdrop-blur-md",
  profBadgeText: "text-[#ECFDF5]",
  profBadgeBorder: "border-[#34D399]/24",
  fanbaseBg: "bg-white/10 backdrop-blur-md",
  fanbaseText: "text-[#ECFDF5]",
  socialItemBg: "bg-white/10 hover:bg-white/16 backdrop-blur-md",
  socialItemBorder: "border-[#34D399]/20 hover:border-[#22D3EE]/45",
  socialNameColor: "text-[#ECFDF5]",
  socialUnitColor: "text-[#A7F3D0]",
  nameColor: "text-[#ECFDF5]",
  bioColor: "text-[#BAE6FD]",
  handleColor: "text-[#22D3EE]",
};

const SIGNATURE_PURPLE_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-b from-[#FAF5FF] via-[#FDFBFE] to-[#F8F2F7] border border-[#7A2253]/18 text-slate-900 shadow-lg",
  profBadgeBg: "bg-white/80 backdrop-blur-md",
  profBadgeText: "text-[#7A2253]",
  profBadgeBorder: "border-[#7A2253]/18",
  fanbaseBg: "bg-white/80 backdrop-blur-md",
  fanbaseText: "text-[#17131A]",
  socialItemBg: "bg-white/80 hover:bg-surface-soft backdrop-blur-md",
  socialItemBorder: "border-[#7A2253]/18 hover:border-brand-primary/30",
  socialNameColor: "text-[#17131A]",
  socialUnitColor: "text-[#6F6872]",
  nameColor: "text-[#17131A]",
  bioColor: "text-[#6F6872]",
  handleColor: "text-[#7A2253]",
};

const MIDNIGHT_DARK_STYLE: ThemeStyleConfig = {
  cardBg: "bg-[#0D1424] text-[#F8FAFC] border border-white/[0.14] shadow-2xl",
  profBadgeBg: "bg-[#111B2D]",
  profBadgeText: "text-[#F8FAFC]",
  profBadgeBorder: "border-white/[0.14]",
  fanbaseBg: "bg-[#111B2D]",
  fanbaseText: "text-[#F8FAFC]",
  socialItemBg: "bg-[#111B2D] hover:bg-brand-hover",
  socialItemBorder: "border-white/[0.14]",
  socialNameColor: "text-[#F8FAFC]",
  socialUnitColor: "text-[#7F8A9D]",
  nameColor: "text-[#F8FAFC]",
  bioColor: "text-[#A7B0C0]",
  handleColor: "text-[#A7B0C0]",
};

import { AmbientAnimation } from "@/components/theme/AmbientAnimation";
import { ThemeService, getThemeCssVariables } from "@/services/ThemeService";

const COSMIC_PURPLE_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-b from-[#1C122C] to-[#150E24] text-[#FAF5FF] border border-purple-400/20 shadow-xl",
  profBadgeBg: "bg-[#1C122C]",
  profBadgeText: "text-[#C4B5FD]",
  profBadgeBorder: "border-purple-400/25",
  fanbaseBg: "bg-[#25173B]/85 backdrop-blur-md",
  fanbaseText: "text-[#FAF5FF]",
  socialItemBg: "bg-[#25173B]/80 hover:bg-brand-hover backdrop-blur-md",
  socialItemBorder: "border-purple-400/20 hover:border-brand-primary/40",
  socialNameColor: "text-[#FAF5FF]",
  socialUnitColor: "text-[#C4B5FD]",
  nameColor: "text-[#FAF5FF]",
  bioColor: "text-[#C4B5FD]",
  handleColor: "text-[#C084FC]",
};

const AURORA_NIGHT_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-b from-[#0A1628] to-[#060E1C] text-[#F0FDF4] border border-teal-400/20 shadow-xl",
  profBadgeBg: "bg-[#0A1628]",
  profBadgeText: "text-[#94A3B8]",
  profBadgeBorder: "border-teal-400/25",
  fanbaseBg: "bg-[#0F1E33]/85 backdrop-blur-md",
  fanbaseText: "text-[#F0FDF4]",
  socialItemBg: "bg-[#0F1E33]/80 hover:bg-brand-hover backdrop-blur-md",
  socialItemBorder: "border-teal-400/20 hover:border-teal-400/40",
  socialNameColor: "text-[#F0FDF4]",
  socialUnitColor: "text-[#94A3B8]",
  nameColor: "text-[#F0FDF4]",
  bioColor: "text-[#94A3B8]",
  handleColor: "text-[#2DD4BF]",
};

const ROSE_GLOW_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-b from-[#2A1420] to-[#1E0E17] text-[#FFF1F2] border border-rose-300/20 shadow-xl",
  profBadgeBg: "bg-[#2A1420]",
  profBadgeText: "text-[#FDA4AF]",
  profBadgeBorder: "border-rose-300/25",
  fanbaseBg: "bg-[#361928]/85 backdrop-blur-md",
  fanbaseText: "text-[#FFF1F2]",
  socialItemBg: "bg-[#361928]/80 hover:bg-brand-hover backdrop-blur-md",
  socialItemBorder: "border-rose-300/20 hover:border-brand-border/40",
  socialNameColor: "text-[#FFF1F2]",
  socialUnitColor: "text-[#FDA4AF]",
  nameColor: "text-[#FFF1F2]",
  bioColor: "text-[#FDA4AF]",
  handleColor: "text-[#FB7185]",
};

const OCEAN_MOTION_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-b from-[#0B213F] to-[#07172C] text-[#F0F9FF] border border-blue-400/20 shadow-xl",
  profBadgeBg: "bg-[#0B213F]",
  profBadgeText: "text-[#93C5FD]",
  profBadgeBorder: "border-blue-400/25",
  fanbaseBg: "bg-[#102B4E]/85 backdrop-blur-md",
  fanbaseText: "text-[#F0F9FF]",
  socialItemBg: "bg-[#102B4E]/80 hover:bg-brand-hover backdrop-blur-md",
  socialItemBorder: "border-blue-400/20 hover:border-brand-primary/40",
  socialNameColor: "text-[#F0F9FF]",
  socialUnitColor: "text-[#93C5FD]",
  nameColor: "text-[#F0F9FF]",
  bioColor: "text-[#93C5FD]",
  handleColor: "text-[#38BDF8]",
};

const SUNSET_STUDIO_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-b from-[#291321] to-[#1D0E18] text-[#FFFBEB] border border-amber-400/20 shadow-xl",
  profBadgeBg: "bg-[#291321]",
  profBadgeText: "text-[#FDE68A]",
  profBadgeBorder: "border-amber-400/25",
  fanbaseBg: "bg-[#381827]/85 backdrop-blur-md",
  fanbaseText: "text-[#FFFBEB]",
  socialItemBg: "bg-[#381827]/80 hover:bg-brand-hover backdrop-blur-md",
  socialItemBorder: "border-amber-400/20 hover:border-brand-primary/40",
  socialNameColor: "text-[#FFFBEB]",
  socialUnitColor: "text-[#FDE68A]",
  nameColor: "text-[#FFFBEB]",
  bioColor: "text-[#FDE68A]",
  handleColor: "text-[#F59E0B]",
};

const MINIMAL_SPARK_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-b from-white to-[#FAF8FA] text-[#17131A] border border-[#7A2253]/16 shadow-2xs",
  profBadgeBg: "bg-white/90",
  profBadgeText: "text-[#7A2253]",
  profBadgeBorder: "border-[#7A2253]/20",
  fanbaseBg: "bg-white/90 backdrop-blur-md",
  fanbaseText: "text-[#17131A]",
  socialItemBg: "bg-white/80 hover:bg-surface-soft backdrop-blur-md",
  socialItemBorder: "border-[#7A2253]/16 hover:border-brand-primary/30",
  socialNameColor: "text-[#17131A]",
  socialUnitColor: "text-[#6F6872]",
  nameColor: "text-[#17131A]",
  bioColor: "text-[#6F6872]",
  handleColor: "text-[#7A2253]",
};

const NEON_GRID_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-b from-[#090D1E] to-[#060917] text-[#F8FAFC] border border-cyan-400/25 shadow-2xl",
  profBadgeBg: "bg-[#090D1E]",
  profBadgeText: "text-[#06B6D4]",
  profBadgeBorder: "border-cyan-400/30",
  fanbaseBg: "bg-[#0E162C]/85 backdrop-blur-md",
  fanbaseText: "text-[#F8FAFC]",
  socialItemBg: "bg-[#0E162C]/80 hover:bg-brand-hover backdrop-blur-md",
  socialItemBorder: "border-cyan-400/22 hover:border-brand-primary/45",
  socialNameColor: "text-[#F8FAFC]",
  socialUnitColor: "text-[#94A3B8]",
  nameColor: "text-[#F8FAFC]",
  bioColor: "text-[#94A3B8]",
  handleColor: "text-[#06B6D4]",
};

const LIQUID_AURORA_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-b from-[#0A1D2D] to-[#06121D] text-[#F0FDF4] border border-teal-400/25 shadow-2xl",
  profBadgeBg: "bg-[#0A1D2D]",
  profBadgeText: "text-[#2DD4BF]",
  profBadgeBorder: "border-teal-400/30",
  fanbaseBg: "bg-[#0F2638]/85 backdrop-blur-md",
  fanbaseText: "text-[#F0FDF4]",
  socialItemBg: "bg-[#0F2638]/80 hover:bg-brand-hover backdrop-blur-md",
  socialItemBorder: "border-teal-400/22 hover:border-teal-400/45",
  socialNameColor: "text-[#F0FDF4]",
  socialUnitColor: "text-[#99F6E4]",
  nameColor: "text-[#F0FDF4]",
  bioColor: "text-[#99F6E4]",
  handleColor: "text-[#2DD4BF]",
};

const FLOATING_STUDIO_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-b from-[#FCFAF7] to-[#F5F0E8] text-[#2D2824] border border-[#E5E0D8] shadow-xl",
  profBadgeBg: "bg-white/90",
  profBadgeText: "text-[#E05D44]",
  profBadgeBorder: "border-[#E5E0D8]",
  fanbaseBg: "bg-white/90 backdrop-blur-md",
  fanbaseText: "text-[#2D2824]",
  socialItemBg: "bg-white/80 hover:bg-surface-soft backdrop-blur-md",
  socialItemBorder: "border-[#E5E0D8] hover:border-brand-primary/35",
  socialNameColor: "text-[#2D2824]",
  socialUnitColor: "text-[#6B635B]",
  nameColor: "text-[#2D2824]",
  bioColor: "text-[#6B635B]",
  handleColor: "text-[#E05D44]",
};

const SPOTLIGHT_STAGE_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-b from-[#16181E] to-[#0E1013] text-[#FAF8F5] border border-amber-400/25 shadow-2xl",
  profBadgeBg: "bg-[#16181E]",
  profBadgeText: "text-[#E5A93C]",
  profBadgeBorder: "border-amber-400/30",
  fanbaseBg: "bg-[#1C1F26]/90 backdrop-blur-md",
  fanbaseText: "text-[#FAF8F5]",
  socialItemBg: "bg-[#1C1F26]/80 hover:bg-brand-hover backdrop-blur-md",
  socialItemBorder: "border-amber-400/20 hover:border-brand-primary/45",
  socialNameColor: "text-[#FAF8F5]",
  socialUnitColor: "text-[#C7CAD1]",
  nameColor: "text-[#FAF8F5]",
  bioColor: "text-[#C7CAD1]",
  handleColor: "text-[#E5A93C]",
};

const CREATIVE_PAPER_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-b from-[#FAF6F0] to-[#EDE5DB] text-[#29221D] border border-[#E3D9CC] shadow-xl",
  profBadgeBg: "bg-white/90",
  profBadgeText: "text-[#7A2253]",
  profBadgeBorder: "border-[#E3D9CC]",
  fanbaseBg: "bg-white/90 backdrop-blur-md",
  fanbaseText: "text-[#29221D]",
  socialItemBg: "bg-white/80 hover:bg-surface-soft backdrop-blur-md",
  socialItemBorder: "border-[#E3D9CC] hover:border-brand-primary/35",
  socialNameColor: "text-[#29221D]",
  socialUnitColor: "text-[#6A5E57]",
  nameColor: "text-[#29221D]",
  bioColor: "text-[#6A5E57]",
  handleColor: "text-[#7A2253]",
};

const LOVE_LETTER_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-b from-[#FFF6F8] via-white to-[#FDECEF] border border-[#F4C9D2] text-[#33151D] shadow-xl",
  profBadgeBg: "bg-white/90 backdrop-blur-md",
  profBadgeText: "text-[#33151D]",
  profBadgeBorder: "border-[#F4C9D2]",
  fanbaseBg: "bg-white/90 backdrop-blur-md",
  fanbaseText: "text-[#33151D]",
  socialItemBg: "bg-white/84 hover:bg-[#FFF0F3] backdrop-blur-md",
  socialItemBorder: "border-[#F4C9D2] hover:border-[#B4234A]/35",
  socialNameColor: "text-[#33151D]",
  socialUnitColor: "text-[#8A5360]",
  nameColor: "text-[#33151D]",
  bioColor: "text-[#6F3F4B]",
  handleColor: "text-[#B4234A]",
};

const CHRISTMAS_SNOW_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-b from-[#F8FFFB] via-white to-[#EFF8F2] border border-[#CDE4D3] text-[#173322] shadow-xl",
  profBadgeBg: "bg-white/90 backdrop-blur-md",
  profBadgeText: "text-[#173322]",
  profBadgeBorder: "border-[#CDE4D3]",
  fanbaseBg: "bg-white/90 backdrop-blur-md",
  fanbaseText: "text-[#173322]",
  socialItemBg: "bg-white/84 hover:bg-[#EFF8F2] backdrop-blur-md",
  socialItemBorder: "border-[#CDE4D3] hover:border-[#0F6B3D]/35",
  socialNameColor: "text-[#173322]",
  socialUnitColor: "text-[#5C7465]",
  nameColor: "text-[#173322]",
  bioColor: "text-[#496153]",
  handleColor: "text-[#B4232A]",
};

const MOUNTAIN_MIST_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-b from-[#F3FAF8] via-white to-[#E8F2EF] border border-[#C7DBD5] text-[#102A2B] shadow-xl",
  profBadgeBg: "bg-white/90 backdrop-blur-md",
  profBadgeText: "text-[#102A2B]",
  profBadgeBorder: "border-[#C7DBD5]",
  fanbaseBg: "bg-white/90 backdrop-blur-md",
  fanbaseText: "text-[#102A2B]",
  socialItemBg: "bg-white/84 hover:bg-[#E8F2EF] backdrop-blur-md",
  socialItemBorder: "border-[#C7DBD5] hover:border-[#236B64]/35",
  socialNameColor: "text-[#102A2B]",
  socialUnitColor: "text-[#58706D]",
  nameColor: "text-[#102A2B]",
  bioColor: "text-[#435C59]",
  handleColor: "text-[#236B64]",
};

const STREET_FOOD_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-b from-[#FFF8EA] via-white to-[#FFECCB] border border-[#F5C777] text-[#35200C] shadow-xl",
  profBadgeBg: "bg-white/90 backdrop-blur-md",
  profBadgeText: "text-[#35200C]",
  profBadgeBorder: "border-[#F5C777]",
  fanbaseBg: "bg-white/90 backdrop-blur-md",
  fanbaseText: "text-[#35200C]",
  socialItemBg: "bg-white/84 hover:bg-[#FFF0CF] backdrop-blur-md",
  socialItemBorder: "border-[#F5C777] hover:border-[#D85B19]/35",
  socialNameColor: "text-[#35200C]",
  socialUnitColor: "text-[#7A5429]",
  nameColor: "text-[#35200C]",
  bioColor: "text-[#65431F]",
  handleColor: "text-[#D85B19]",
};

const CAFE_MOCHA_STYLE: ThemeStyleConfig = {
  cardBg: "bg-[#201611]/86 border border-[#C89B6B]/24 text-[#FFF7ED] shadow-2xl backdrop-blur-xl",
  profBadgeBg: "bg-white/10 backdrop-blur-md",
  profBadgeText: "text-[#FFF7ED]",
  profBadgeBorder: "border-[#C89B6B]/24",
  fanbaseBg: "bg-white/10 backdrop-blur-md",
  fanbaseText: "text-[#FFF7ED]",
  socialItemBg: "bg-white/10 hover:bg-white/16 backdrop-blur-md",
  socialItemBorder: "border-[#C89B6B]/20 hover:border-[#EBCB9A]/45",
  socialNameColor: "text-[#FFF7ED]",
  socialUnitColor: "text-[#D7BFA6]",
  nameColor: "text-[#FFF7ED]",
  bioColor: "text-[#D7BFA6]",
  handleColor: "text-[#EBCB9A]",
};

export const THEME_STYLES: Record<string, ThemeStyleConfig> = {
  "minimal-white": MINIMAL_WHITE_STYLE,
  "sage-studio": SAGE_STUDIO_STYLE,
  "blush-paper": BLUSH_PAPER_STYLE,
  "studio-frost": STUDIO_FROST_STYLE,
  "taj-mahal": TAJ_MAHAL_STYLE,
  "marine-drive": MARINE_DRIVE_STYLE,
  "burj-khalifa": BURJ_KHALIFA_STYLE,
  "somnath-temple": SOMNATH_TEMPLE_STYLE,
  "dwarka-temple": DWARKA_TEMPLE_STYLE,
  "goa-beach": GOA_BEACH_STYLE,
  "creator-studio": CREATOR_STUDIO_STYLE,
  "neon-reels": NEON_REELS_STYLE,
  "podcast-lounge": PODCAST_LOUNGE_STYLE,
  "food-vlog": FOOD_VLOG_STYLE,
  "gamer-stream": GAMER_STREAM_STYLE,
  "love-letter": LOVE_LETTER_STYLE,
  "christmas-snow": CHRISTMAS_SNOW_STYLE,
  "mountain-mist": MOUNTAIN_MIST_STYLE,
  "street-food": STREET_FOOD_STYLE,
  "cafe-mocha": CAFE_MOCHA_STYLE,
  "aurora-gradient": NEON_REELS_STYLE,
  "sunrise-pop": STREET_FOOD_STYLE,
  "candy-flow": LOVE_LETTER_STYLE,
  "mint-wave": MOUNTAIN_MIST_STYLE,
  "royal-glow": CAFE_MOCHA_STYLE,
  "signature-purple": SIGNATURE_PURPLE_STYLE,
  midnight: MIDNIGHT_DARK_STYLE,
  "neon-grid": NEON_GRID_STYLE,
  "liquid-aurora": LIQUID_AURORA_STYLE,
  "floating-studio": FLOATING_STUDIO_STYLE,
  "spotlight-stage": SPOTLIGHT_STAGE_STYLE,
  "creative-paper": CREATIVE_PAPER_STYLE,
  "cosmic-purple": COSMIC_PURPLE_STYLE,
  "aurora-night": AURORA_NIGHT_STYLE,
  "rose-glow": ROSE_GLOW_STYLE,
  "ocean-motion": OCEAN_MOTION_STYLE,
  "sunset-studio": SUNSET_STUDIO_STYLE,
  "minimal-spark": MINIMAL_SPARK_STYLE,
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

function safeHostname(urlStr?: string): string {
  if (!urlStr) return "";
  try {
    const raw = urlStr.trim().startsWith("http") ? urlStr.trim() : `https://${urlStr.trim()}`;
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function getLinkPlatformIcon(url?: string, title?: string, c?: { primaryText?: string; accentText?: string;[key: string]: any }, iconUrlOrEmoji?: string) {
  if (iconUrlOrEmoji) {
    if (iconUrlOrEmoji.startsWith("http") || iconUrlOrEmoji.startsWith("/") || iconUrlOrEmoji.startsWith("data:")) {
      return <img src={iconUrlOrEmoji} alt="" className="h-full w-full object-cover" />;
    }
    if (iconUrlOrEmoji.length <= 4) {
      return <span className="text-base sm:text-lg leading-none select-none">{iconUrlOrEmoji}</span>;
    }
  }

  const u = (url || "").toLowerCase();
  const t = (title || "").toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return <YoutubeIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-red-500 shrink-0" />;
  if (u.includes("whatsapp.com") || u.includes("wa.me") || t.includes("whatsapp")) return <WhatsappIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-emerald-500 shrink-0" />;
  if (u.includes("spotify.com") || t.includes("spotify") || t.includes("podcast")) return <SpotifyIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-emerald-500 shrink-0" />;
  if (t.includes("ticket") || t.includes("book") || t.includes("tour") || u.includes("bookmyshow") || u.includes("insider.in")) return <Ticket className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-amber-500 shrink-0" />;
  if (/\b(merch|merchandise|store|shop|apparel|tees)\b/i.test(t)) return <ShoppingBag className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-indigo-500 shrink-0" />;
  if (u.includes("instagram.com") || t.includes("instagram")) return <InstagramIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-pink-500 shrink-0" />;
  if (t.includes("youtube") || t.includes("membership") || t.includes("subscribe")) return <YoutubeIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-red-500 shrink-0" />;
  if (u.includes("twitter.com") || u.includes("x.com") || t.includes("twitter") || t.includes("tcf x")) return <XTwitterIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" style={{ color: c?.primaryText }} />;
  if (u.includes("linkedin.com") || t.includes("linkedin")) return <LinkedinIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-sky-600 shrink-0" />;
  if (u.includes("threads.net") || t.includes("threads")) return <ThreadsIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 shrink-0" style={{ color: c?.primaryText }} />;
  if (u.includes("facebook.com") || t.includes("facebook")) return <FacebookIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-blue-600 shrink-0" />;
  if (u.includes("snapchat.com") || t.includes("snapchat")) return <SnapchatIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-amber-400 shrink-0" />;
  if (u.includes("twitch.tv") || t.includes("twitch")) return <TwitchIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-purple-500 shrink-0" />;
  if (u.includes("pinterest.com") || t.includes("pinterest")) return <PinterestIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-red-600 shrink-0" />;
  if (u.includes("tiktok.com") || t.includes("tiktok")) return <TikTokIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-black dark:text-white shrink-0" />;
  if (u.includes("t.me") || u.includes("telegram")) return <Send className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-sky-500 shrink-0" />;
  if (u.includes("discord")) return <MessageCircle className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-indigo-400 shrink-0" />;
  if (u.startsWith("mailto:")) return <Mail className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-amber-500 shrink-0" />;
  return <Globe className="h-4 w-4 sm:h-4.5 sm:w-4.5 shrink-0" style={{ color: c?.accentText || "#3b82f6" }} />;
}

import { formatCategoryDots } from "@/utils/format";
export { formatCategoryDots };

export interface LivePreviewCardProps {
  profile: CreatorProfile;
  socials: SocialAccounts;
  series?: Series[];
  products?: CreatorProduct[];
  customLinks?: CustomLink[];
  mediaKitPackages?: MediaKitPackage[];
  mediaKitSettings?: MediaKitSettings;
  reviews?: CreatorReview[];
  team?: { team?: CreatorTeam | null; members: TeamMember[] };
  brands?: CreatorBrand[];
  collaborations?: CreatorCollaboration[];
  setupItems?: CreatorSetupItem[];
  otherSocials?: OtherSocialAccount[];
  sections?: CreatorProfileSection[];
  totalAudience?: number;
  themeKey?: ThemeKey;
  compact?: boolean;
  variant?: "compact" | "full";
  cardPadding?: string;
  containedScroll?: boolean;
  onSeriesPreviewOpen?: (series: Series) => void;
  seriesOpenMode?: "internal" | "page";
  seriesPreviewLimit?: number;
  allSeriesHref?: string;
  seriesOnlyMode?: boolean;
  productsPreviewLimit?: number;
  allProductsHref?: string;
  productsOnlyMode?: boolean;
  reviewsPreviewLimit?: number;
  allReviewsHref?: string;
  reviewsOnlyMode?: boolean;
  /** Secondary public page (series list, reviews, products): compact creator header instead of the full profile header. */
  pageHeader?: { pageLabel: string; backHref: string; backLabel: string };
  showSettingsIcon?: boolean;
  onShare?: () => void;
  hideFooter?: boolean;
  isInformational?: boolean;
  isOnboarding?: boolean;
  isFinishStep?: boolean;
  layoutMode?: "tabs" | "stacked";
  initialTab?: CreatorNavTabId;
}

export type CreatorNavTabId = "about" | "series" | "fanbase" | "links" | "shop" | "reviews" | "work" | "setup";

function getSeriesEpisodes(s: Series): any[] {
  if (s && Array.isArray(s.seasons) && s.seasons.length > 0) {
    return s.seasons.flatMap((sn) => (sn && Array.isArray(sn.episodes)) ? sn.episodes : []);
  }
  if (s && Array.isArray((s as any).episodes)) {
    return (s as any).episodes;
  }
  return [];
}

function ExpandableText({
  text,
  className = "",
  style,
  buttonStyle,
  buttonClassName = "",
  inlineMode = false,
  maxChars = 92,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  buttonStyle?: React.CSSProperties;
  buttonClassName?: string;
  inlineMode?: boolean;
  maxChars?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el || !text || !text.trim()) {
      setHasOverflow(false);
      return;
    }

    const checkOverflow = () => {
      const width = el.clientWidth;
      if (!width) return;

      const computed = window.getComputedStyle(el);
      let lh = parseFloat(computed.lineHeight);
      if (!lh || isNaN(lh)) {
        const fs = parseFloat(computed.fontSize) || 13;
        lh = fs * 1.35;
      }

      // Clone element off-screen without line-clamp to measure true natural height at current width
      const clone = document.createElement("div");
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.visibility = "hidden";
      clone.style.pointerEvents = "none";
      clone.style.width = `${width}px`;
      clone.style.height = "auto";
      clone.style.maxHeight = "none";
      clone.style.overflow = "visible";
      clone.style.display = "block";
      clone.className = (el.className || "").replace(/\bline-clamp-\d+\b/g, "");
      clone.textContent = text;

      // Apply key computed typography styles to clone
      clone.style.fontFamily = computed.fontFamily;
      clone.style.fontSize = computed.fontSize;
      clone.style.fontWeight = computed.fontWeight;
      clone.style.lineHeight = computed.lineHeight;
      clone.style.letterSpacing = computed.letterSpacing;
      clone.style.wordBreak = computed.wordBreak;
      clone.style.whiteSpace = computed.whiteSpace;

      document.body.appendChild(clone);
      const naturalHeight = clone.offsetHeight;
      document.body.removeChild(clone);

      // 2 lines max threshold is (2.15 * lineHeight).
      // 1 line is ~1.0 * lh. 2 lines is ~2.0 * lh (at most 2.1 with font descenders).
      // 3 or more lines is >= 3.0 * lh.
      // So naturalHeight > 2.15 * lh strictly detects 3+ lines (more than 2 lines).
      const twoLinesMaxHeight = lh * 2.15;
      setHasOverflow(naturalHeight > twoLinesMaxHeight);
    };

    // Run check on frame
    const animId = requestAnimationFrame(checkOverflow);

    // Also observe resize of container
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        checkOverflow();
      });
      ro.observe(el);
    }

    window.addEventListener("resize", checkOverflow);

    if (typeof document !== "undefined" && (document as any).fonts) {
      (document as any).fonts.ready?.then(checkOverflow).catch(() => { });
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", checkOverflow);
      if (ro) ro.disconnect();
    };
  }, [text]);

  if (!text || !text.trim()) return null;

  if (inlineMode) {
    const isLong = text.length > maxChars + 15;
    if (!isLong) {
      return (
        <p style={style} className={className}>
          {text}
        </p>
      );
    }
    const snippet = (() => {
      const sub = text.slice(0, maxChars);
      const lastSpace = sub.lastIndexOf(" ");
      return (lastSpace > 50 ? sub.slice(0, lastSpace) : sub).replace(/[.,;!?]+$/, "");
    })();
    return (
      <p style={style} className={className}>
        <span>{expanded ? text : `${snippet}...`}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((prev) => !prev);
          }}
          style={buttonStyle}
          className={
            buttonClassName ||
            "ml-1 inline-flex items-center text-[11px] sm:text-xs font-bold hover:underline cursor-pointer select-none"
          }
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      </p>
    );
  }

  return (
    <div>
      <p
        ref={textRef}
        style={style}
        className={`${className} ${expanded ? "" : "line-clamp-2"}`}
      >
        {text}
      </p>
      {hasOverflow && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((prev) => !prev);
          }}
          style={buttonStyle}
          className={
            buttonClassName ||
            "mt-0.5 inline-block text-[11px] sm:text-xs font-semibold hover:underline cursor-pointer select-none opacity-90 hover:opacity-100"
          }
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

const EMPTY_PROFILE_FALLBACK: CreatorProfile = {
  photoDataUrl: null,
  displayName: "",
  username: "",
  category: null,
  bio: "",
  updatedAt: new Date().toISOString(),
};

// Single source of truth lives in the shared public design tokens.
export { isDarkTheme };

export function LivePreviewCard({
  profile: incomingProfile,
  socials: incomingSocials,
  series: incomingSeries = [],
  products = [],
  customLinks: passedCustomLinks,
  mediaKitPackages: passedMediaKitPackages,
  mediaKitSettings: passedMediaKitSettings,
  reviews: passedReviews,
  team: passedTeam,
  brands: passedBrands,
  collaborations: passedCollaborations,
  setupItems: passedSetupItems,
  otherSocials: passedOtherSocials,
  sections: passedSections,
  totalAudience: passedTotalAudience,
  themeKey = "minimal-white",
  compact = false,
  variant,
  cardPadding,
  containedScroll = false,
  onSeriesPreviewOpen,
  seriesOpenMode = "internal",
  seriesPreviewLimit,
  allSeriesHref,
  seriesOnlyMode = false,
  productsPreviewLimit = 3,
  allProductsHref,
  productsOnlyMode = false,
  reviewsPreviewLimit,
  allReviewsHref,
  reviewsOnlyMode = false,
  pageHeader,
  showSettingsIcon: showSettingsIconProp,
  onShare,
  hideFooter = false,
  isInformational: isInformationalProp,
  isOnboarding: isOnboardingProp,
  isFinishStep: isFinishStepProp,
  layoutMode = "tabs",
  initialTab,
}: LivePreviewCardProps) {
  const router = useRouter();
  const profile: CreatorProfile = incomingProfile || EMPTY_PROFILE_FALLBACK;
  const socials: SocialAccounts = incomingSocials || EMPTY_SOCIAL_ACCOUNTS;
  const series: Series[] = incomingSeries || [];
  const displayedSeries = typeof seriesPreviewLimit === "number" ? series.slice(0, seriesPreviewLimit) : series;
  const { showToast } = useToast();
  const [expandedSeriesMap, setExpandedSeriesMap] = useState<Record<string, boolean>>(() => {
    return series && series.length > 0 ? { [series[0].id]: true } : {};
  });
  const [seriesFilter, setSeriesFilter] = useState<string>("all");
  const [seriesSortOrder, setSeriesSortOrder] = useState<string>("latest");
  const [shopSortOrder, setShopSortOrder] = useState<string>("latest");
  const [isShopSortOpen, setIsShopSortOpen] = useState(false);
  const [collapsedCollectionsMap, setCollapsedCollectionsMap] = useState<Record<string, boolean>>({});
  const toggleCollection = (id: string) => {
    setCollapsedCollectionsMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const sortedProducts: CreatorProduct[] = useMemo(() => {
    const list: CreatorProduct[] = [...products];
    if (shopSortOrder === "price_asc") {
      list.sort((a, b) => (a.pricePaise || 0) - (b.pricePaise || 0));
    } else if (shopSortOrder === "price_desc") {
      list.sort((a, b) => (b.pricePaise || 0) - (a.pricePaise || 0));
    }
    if (productsOnlyMode) return list;
    if (typeof productsPreviewLimit === "number") {
      return list.slice(0, productsPreviewLimit);
    }
    return list.slice(0, 3);
  }, [products, shopSortOrder, productsOnlyMode, productsPreviewLimit]);

  useEffect(() => {
    if (series && series.length > 0) {
      setExpandedSeriesMap((prev) => {
        if (Object.keys(prev).length === 0) {
          return { [series[0].id]: true };
        }
        return prev;
      });
    }
  }, [series]);

  const [selectedSeriesDetail, setSelectedSeriesDetail] = useState<Series | null>(null);
  const [selectedSeriesSeasonIdx, setSelectedSeriesSeasonIdx] = useState<number>(0);
  const [activeNavTab, setActiveNavTab] = useState<CreatorNavTabId>(() => {
    if (initialTab === "fanbase") return "about";
    if (initialTab && ["about", "series", "links", "shop", "reviews", "work", "setup"].includes(initialTab)) {
      return initialTab;
    }
    return "about";
  });
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [expandedSeriesDescMap, setExpandedSeriesDescMap] = useState<Record<string, boolean>>({});
  const [approvedReviews, setApprovedReviews] = useState<CreatorReview[]>(passedReviews || []);
  const [teamData, setTeamData] = useState<{ team?: CreatorTeam | null; members: TeamMember[] }>(
    passedTeam || { members: [] }
  );
  const [brandsList, setBrandsList] = useState<CreatorBrand[]>(passedBrands || []);
  const [collaborationsList, setCollaborationsList] = useState<CreatorCollaboration[]>(passedCollaborations || []);
  const [setupList, setSetupList] = useState<CreatorSetupItem[]>(passedSetupItems || []);
  const [otherSocialsList, setOtherSocialsList] = useState<OtherSocialAccount[]>(passedOtherSocials || []);
  const [sectionsList, setSectionsList] = useState<CreatorProfileSection[]>(passedSections || DEFAULT_PROFILE_SECTIONS);
  const [isCollabInquiryOpen, setIsCollabInquiryOpen] = useState(false);
  const [selectedProductForZoom, setSelectedProductForZoom] = useState<CreatorProduct | null>(null);
  const [isDashboardPreview, setIsDashboardPreview] = useState<boolean>(false);
  const [isInformationalMode, setIsInformationalMode] = useState<boolean>(Boolean(isInformationalProp));
  const [isOnboardingMode, setIsOnboardingMode] = useState<boolean>(Boolean(isOnboardingProp));
  const [isFinishStepMode, setIsFinishStepMode] = useState<boolean>(Boolean(isFinishStepProp));

  useEffect(() => {
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      const isFinish = Boolean(isFinishStepProp || pathname === "/onboarding/finish");
      const onb = pathname.startsWith("/onboarding") && !isFinish;
      setIsDashboardPreview(
        showSettingsIconProp ?? (
          pathname.startsWith("/dashboard") ||
          onb
        )
      );
      setIsInformationalMode(isInformationalProp ?? onb);
      setIsOnboardingMode(isOnboardingProp ?? onb);
      setIsFinishStepMode(isFinish);
    }
  }, [showSettingsIconProp, isInformationalProp, isOnboardingProp, isFinishStepProp]);

  useEffect(() => {
    if (passedReviews !== undefined) {
      setApprovedReviews(passedReviews || []);
      return;
    }
    async function loadApprovedReviews() {
      if (isOnboardingMode || !profile.id) {
        setApprovedReviews([]);
        return;
      }
      const email = profile.email || "";
      const username = profile.username || "";

      try {
        if (email || username) {
          const httpResponse = await fetch(
            `/api/creator/reviews?email=${encodeURIComponent(email)}&username=${encodeURIComponent(username)}&status=approved`
          );
          const apiResponse = await httpResponse.json();
          const revList = apiResponse.data?.reviews || apiResponse.reviews;

          if (httpResponse.ok && (apiResponse.status === 1 || apiResponse.success) && Array.isArray(revList)) {
            setApprovedReviews(revList);
            return;
          }
        }
      } catch (e) { }


      // Only fallback to local reviews in dashboard preview or onboarding mode
      if (isDashboardPreview) {
        const all = reviewsRepository.getAll();
        const approved = all.filter((r) => r.status === "approved");
        setApprovedReviews(approved);
      } else {
        setApprovedReviews([]);
      }
    }
    loadApprovedReviews();
  }, [profile.email, profile.username, passedReviews, isDashboardPreview]);

  useEffect(() => {
    if (passedTeam !== undefined) {
      setTeamData(passedTeam || { members: [] });
    } else if (isDashboardPreview) {
      const localTeam = teamRepository.get();
      if (localTeam) {
        setTeamData({
          team: localTeam.team || localTeam,
          members: Array.isArray(localTeam.members) ? localTeam.members : [],
        });
      } else {
        setTeamData({ members: [] });
      }
    }
  }, [passedTeam, isDashboardPreview]);

  useEffect(() => {
    if (passedBrands !== undefined) {
      setBrandsList(passedBrands);
    } else if (isDashboardPreview) {
      setBrandsList(brandsRepository.getAll());
    }
  }, [passedBrands, isDashboardPreview]);

  useEffect(() => {
    if (passedCollaborations !== undefined) {
      setCollaborationsList(passedCollaborations);
    } else if (isDashboardPreview) {
      setCollaborationsList(collaborationsRepository.getAll());
    }
  }, [passedCollaborations, isDashboardPreview]);

  useEffect(() => {
    if (passedSetupItems !== undefined) {
      setSetupList(passedSetupItems);
    } else if (isDashboardPreview) {
      setSetupList(creatorSetupRepository.getAll());
    }
  }, [passedSetupItems, isDashboardPreview]);

  useEffect(() => {
    if (passedOtherSocials !== undefined) {
      setOtherSocialsList(passedOtherSocials);
    } else if (isDashboardPreview) {
      setOtherSocialsList(otherSocialsRepository.getAll());
    }
  }, [passedOtherSocials, isDashboardPreview]);

  useEffect(() => {
    if (passedSections !== undefined) {
      setSectionsList(passedSections);
    } else if (isDashboardPreview) {
      setSectionsList(sectionsRepository.getAll());
    }
  }, [passedSections, isDashboardPreview]);

  const [mediaKitPackages, setMediaKitPackages] = useState<MediaKitPackage[]>(passedMediaKitPackages || []);
  const [mediaKitSettings, setMediaKitSettings] = useState<MediaKitSettings>(passedMediaKitSettings || MediaKitService.DEFAULT_SETTINGS);
  const [customLinksList, setCustomLinksList] = useState<CustomLink[]>(() => {
    if (seriesOnlyMode || productsOnlyMode || reviewsOnlyMode) return [];
    return passedCustomLinks || [];
  });
  const [selectedGigForWhatsApp, setSelectedGigForWhatsApp] = useState<MediaKitPackage | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [drawerSeries, setDrawerSeries] = useState<Series | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAllGigs, setShowAllGigs] = useState(false);
  const profileScrollRef = useRef<HTMLDivElement | null>(null);
  const [showMoveToTop, setShowMoveToTop] = useState(false);
  const [showStickyProfileHeader, setShowStickyProfileHeader] = useState(false);

  const safeProfile: CreatorProfile = Object.assign(
    {
      photoDataUrl: null,
      displayName: "",
      username: "",
      category: null,
      bio: "",
      updatedAt: new Date().toISOString(),
    },
    profile || {}
  );

  const [visibilitySettings, setVisibilitySettings] = useState<VisibilitySettings>(() => {
    if (safeProfile.username === "demo_creator") {
      return DEFAULT_VISIBILITY_SETTINGS;
    }
    if (safeProfile.visibilitySettings) return safeProfile.visibilitySettings;
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
        return storage.get<VisibilitySettings>(STORAGE_KEYS.visibilitySettings, DEFAULT_VISIBILITY_SETTINGS);
      }
    }
    return DEFAULT_VISIBILITY_SETTINGS;
  });
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);

  useEffect(() => {
    if (safeProfile.username === "demo_creator") {
      setVisibilitySettings(DEFAULT_VISIBILITY_SETTINGS);
      return;
    }
    if (safeProfile.visibilitySettings) {
      setVisibilitySettings(safeProfile.visibilitySettings);
    }
  }, [safeProfile.visibilitySettings, safeProfile.username]);

  const effectiveVisibilitySettings: VisibilitySettings = seriesOnlyMode
    ? {
      ...visibilitySettings,
      showFanbase: false,
      showCustomLinks: false,
      showCollabGigs: false,
      showReviews: false,
      showSeries: true,
    }
    : reviewsOnlyMode
      ? {
        ...visibilitySettings,
        showFanbase: false,
        showCustomLinks: false,
        showCollabGigs: false,
        showSeries: false,
        showReviews: true,
      }
      : productsOnlyMode
        ? {
          ...visibilitySettings,
          showFanbase: false,
          showCustomLinks: false,
          showCollabGigs: false,
          showSeries: false,
          showReviews: false,
        }
        : visibilitySettings;


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
  const isSignaturePurple = themeKey === "signature-purple";
  const themeMeta = ThemeService.getThemeMeta(themeKey);
  const style = THEME_STYLES[themeKey] || DEFAULT_THEME_STYLE;
  const usesDarkControls = isDark || themeMeta.mode === "dark";

  useEffect(() => {
    if (seriesOnlyMode || productsOnlyMode || reviewsOnlyMode) {
      setCustomLinksList([]);
      return;
    }
    if (passedCustomLinks && passedCustomLinks.length > 0) {
      setCustomLinksList(passedCustomLinks);
    } else if (safeProfile.username === "demo_creator") {
      import("@/data/expertDemoCreator").then(({ EXPERT_DEMO_CUSTOM_LINKS }) => {
        setCustomLinksList(EXPERT_DEMO_CUSTOM_LINKS);
      });
    } else if (passedCustomLinks) {
      setCustomLinksList(passedCustomLinks);
    } else {
      setCustomLinksList(customLinksRepository.get());
    }
  }, [passedCustomLinks, seriesOnlyMode, productsOnlyMode, reviewsOnlyMode, safeProfile.username]);

  useEffect(() => {
    if (passedMediaKitPackages !== undefined) {
      setMediaKitPackages(passedMediaKitPackages || []);
      if (passedMediaKitSettings) setMediaKitSettings(passedMediaKitSettings);
      return;
    }
    async function loadMediaKit() {
      if (isOnboardingMode || !profile.id) {
        setMediaKitPackages([]);
        return;
      }
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
  }, [profile.id, profile.email, profile.username, passedMediaKitPackages, passedMediaKitSettings]);

  const totalEpisodesCount = (series || []).reduce((acc, s) => acc + getSeriesEpisodes(s).length, 0);

  const safeSocials: SocialAccounts = {
    ...EMPTY_SOCIAL_ACCOUNTS,
    ...(socials || {}),
  };

  const calculatedTotal =
    (safeSocials.instagram?.followers || 0) +
    (safeSocials.youtube?.subscribers || 0) +
    (safeSocials.facebook?.followers || 0) +
    (safeSocials.twitter?.followers || 0) +
    (safeSocials.linkedin?.followers || 0) +
    (safeSocials.threads?.followers || 0) +
    (safeSocials.snapchat?.followers || 0) +
    (safeSocials.pinterest?.followers || 0) +
    (safeSocials.twitch?.followers || 0) +
    (safeSocials.spotify?.followers || 0);

  const totalAudience = passedTotalAudience !== undefined ? passedTotalAudience : calculatedTotal;

  const instaHandle = safeSocials.instagram?.username || getHandle(safeSocials.instagram?.url || "");
  const ytHandle = safeSocials.youtube?.username || getHandle(safeSocials.youtube?.url || "");
  const fbHandle = safeSocials.facebook?.username || getHandle(safeSocials.facebook?.url || "");
  const twHandle = safeSocials.twitter?.username || getHandle(safeSocials.twitter?.url || "");
  const liHandle = safeSocials.linkedin?.username || getHandle(safeSocials.linkedin?.url || "");
  const thHandle = safeSocials.threads?.username || getHandle(safeSocials.threads?.url || "");
  const scHandle = safeSocials.snapchat?.username || getHandle(safeSocials.snapchat?.url || "");
  const pinHandle = safeSocials.pinterest?.username || getHandle(safeSocials.pinterest?.url || "");
  const twiHandle = safeSocials.twitch?.username || getHandle(safeSocials.twitch?.url || "");
  const spHandle = safeSocials.spotify?.username || getHandle(safeSocials.spotify?.url || "");
  const ttHandle = safeSocials.tiktok?.username || getHandle(safeSocials.tiktok?.url || "");

  const hasInsta = Boolean(instaHandle || (safeSocials.instagram?.followers || 0) > 0 || safeSocials.instagram?.url);
  const instaUrl = buildSocialUrl("instagram", safeSocials.instagram?.url || safeSocials.instagram?.username || instaHandle);

  const hasYt = Boolean(ytHandle || (safeSocials.youtube?.subscribers || 0) > 0 || safeSocials.youtube?.url);
  const ytUrl = buildSocialUrl("youtube", safeSocials.youtube?.url || safeSocials.youtube?.username || ytHandle);

  const hasFb = Boolean(fbHandle || (safeSocials.facebook?.followers || 0) > 0 || safeSocials.facebook?.url);
  const fbUrl = buildSocialUrl("facebook", safeSocials.facebook?.url || safeSocials.facebook?.username || fbHandle);

  const activeSocialList = [
    {
      platform: "instagram",
      label: "Instagram",
      name: safeSocials.instagram?.name,
      icon: <InstagramIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-xs",
      handle: instaHandle,
      count: safeSocials.instagram?.followers || 0,
      unit: "Followers",
      url: buildSocialUrl("instagram", safeSocials.instagram?.url || safeSocials.instagram?.username || instaHandle),
      hasAccount: Boolean(instaHandle || (safeSocials.instagram?.followers || 0) > 0 || safeSocials.instagram?.url),
      visible: visibilitySettings.showInstagram !== false,
    },
    {
      platform: "youtube",
      label: "YouTube",
      name: safeSocials.youtube?.channelTitle,
      icon: <YoutubeIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-red-600 shadow-xs",
      handle: ytHandle,
      count: safeSocials.youtube?.subscribers || 0,
      unit: "Subscribers",
      url: buildSocialUrl("youtube", safeSocials.youtube?.url || safeSocials.youtube?.username || ytHandle),
      hasAccount: Boolean(ytHandle || (safeSocials.youtube?.subscribers || 0) > 0 || safeSocials.youtube?.url),
      visible: visibilitySettings.showYoutube !== false,
    },
    {
      platform: "facebook",
      label: "Facebook",
      name: safeSocials.facebook?.name,
      icon: <FacebookIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-blue-600 shadow-xs",
      handle: fbHandle,
      count: safeSocials.facebook?.followers || 0,
      unit: "Followers",
      url: buildSocialUrl("facebook", safeSocials.facebook?.url || safeSocials.facebook?.username || fbHandle),
      hasAccount: Boolean(fbHandle || (safeSocials.facebook?.followers || 0) > 0 || safeSocials.facebook?.url),
      visible: visibilitySettings.showFacebook !== false,
    },
    {
      platform: "twitter",
      label: "X (Twitter)",
      name: safeSocials.twitter?.name,
      icon: <XTwitterIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-slate-900 shadow-xs",
      handle: twHandle,
      count: safeSocials.twitter?.followers || 0,
      unit: "Followers",
      url: buildSocialUrl("twitter", safeSocials.twitter?.url || twHandle),
      hasAccount: Boolean(twHandle || (safeSocials.twitter?.followers || 0) > 0 || safeSocials.twitter?.url),
      visible: visibilitySettings.showTwitter !== false,
    },
    {
      platform: "linkedin",
      label: "LinkedIn",
      name: safeSocials.linkedin?.name,
      icon: <LinkedinIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-sky-700 shadow-xs",
      handle: liHandle,
      count: safeSocials.linkedin?.followers || 0,
      unit: "Connections",
      url: buildSocialUrl("linkedin", safeSocials.linkedin?.url || liHandle),
      hasAccount: Boolean(liHandle || (safeSocials.linkedin?.followers || 0) > 0 || safeSocials.linkedin?.url),
      visible: visibilitySettings.showLinkedin !== false,
    },
    {
      platform: "threads",
      label: "Threads",
      name: safeSocials.threads?.name,
      icon: <ThreadsIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-slate-900 shadow-xs",
      handle: thHandle,
      count: safeSocials.threads?.followers || 0,
      unit: "Followers",
      url: buildSocialUrl("threads", safeSocials.threads?.url || thHandle),
      hasAccount: Boolean(thHandle || (safeSocials.threads?.followers || 0) > 0 || safeSocials.threads?.url),
      visible: visibilitySettings.showThreads !== false,
    },
    {
      platform: "snapchat",
      label: "Snapchat",
      name: safeSocials.snapchat?.name,
      icon: <SnapchatIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-yellow-500 shadow-xs",
      handle: scHandle,
      count: safeSocials.snapchat?.followers || 0,
      unit: "Subscribers",
      url: buildSocialUrl("snapchat", safeSocials.snapchat?.url || scHandle),
      hasAccount: Boolean(scHandle || (safeSocials.snapchat?.followers || 0) > 0 || safeSocials.snapchat?.url),
      visible: visibilitySettings.showSnapchat !== false,
    },
    {
      platform: "pinterest",
      label: "Pinterest",
      name: safeSocials.pinterest?.name,
      icon: <PinterestIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-red-700 shadow-xs",
      handle: pinHandle,
      count: safeSocials.pinterest?.followers || 0,
      unit: "Followers",
      url: buildSocialUrl("pinterest", safeSocials.pinterest?.url || pinHandle),
      hasAccount: Boolean(pinHandle || (safeSocials.pinterest?.followers || 0) > 0 || safeSocials.pinterest?.url),
      visible: visibilitySettings.showPinterest !== false,
    },
    {
      platform: "twitch",
      label: "Twitch",
      name: safeSocials.twitch?.name,
      icon: <TwitchIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-purple-700 shadow-xs",
      handle: twiHandle,
      count: safeSocials.twitch?.followers || 0,
      unit: "Followers",
      url: buildSocialUrl("twitch", safeSocials.twitch?.url || twiHandle),
      hasAccount: Boolean(twiHandle || (safeSocials.twitch?.followers || 0) > 0 || safeSocials.twitch?.url),
      visible: visibilitySettings.showTwitch !== false,
    },
    {
      platform: "spotify",
      label: "Spotify",
      name: safeSocials.spotify?.name,
      icon: <SpotifyIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-emerald-600 shadow-xs",
      handle: spHandle,
      count: safeSocials.spotify?.followers || 0,
      unit: "Listeners",
      url: buildSocialUrl("spotify", safeSocials.spotify?.url || spHandle),
      hasAccount: Boolean(spHandle || (safeSocials.spotify?.followers || 0) > 0 || safeSocials.spotify?.url),
      visible: visibilitySettings.showSpotify !== false,
    },
    {
      platform: "tiktok",
      label: "TikTok",
      name: safeSocials.tiktok?.name,
      icon: <TikTokIcon className="h-4 w-4 text-white" />,
      badgeBg: "bg-black shadow-xs",
      handle: ttHandle,
      count: safeSocials.tiktok?.followers || 0,
      unit: "Followers",
      url: buildSocialUrl("tiktok", safeSocials.tiktok?.url || ttHandle),
      hasAccount: Boolean(ttHandle || (safeSocials.tiktok?.followers || 0) > 0 || safeSocials.tiktok?.url),
      visible: true,
    },
  ].filter((item) => item.visible && (item.hasAccount || item.count > 0 || (item.url && item.url !== "#")));

  const fanbaseSocialCards = activeSocialList.filter((s) => s.hasAccount || s.count > 0);
  const fanbaseSocialGridColumns = `repeat(${Math.min(Math.max(fanbaseSocialCards.length, 1), 3)}, minmax(0, 1fr))`;

  const handleCopyClick = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isInformationalMode) {
      showToast("Link copy is informational in preview mode ✨");
      return;
    }
    const cleanUsername = (profile.username || "username").replace(/^@/, "");
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inflixo.com";
    const shareUrl = typeof window !== "undefined"
      ? (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? `${window.location.origin}/${cleanUsername}`
        : `${baseUrl.replace(/\/$/, "")}/${cleanUsername}`)
      : `${baseUrl.replace(/\/$/, "")}/${cleanUsername}`;

    const success = await copyToClipboard(shareUrl);
    if (success) {
      showToast("Profile link copied! ✨");
    } else {
      showToast("Could not copy link", "error");
    }
  };

  const handleShareClick = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isInformationalMode) {
      showToast("Share options active on your live public profile 🚀");
      return;
    }
    if (onShare) {
      onShare();
      return;
    }
    const cleanUsername = (profile.username || "username").replace(/^@/, "");
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inflixo.com";
    const shareUrl = typeof window !== "undefined"
      ? (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? `${window.location.origin}/${cleanUsername}`
        : `${baseUrl.replace(/\/$/, "")}/${cleanUsername}`)
      : `${baseUrl.replace(/\/$/, "")}/${cleanUsername}`;

    const title = `${profile.displayName || "Creator"} on Inflixo`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, url: shareUrl });
      } else {
        const success = await copyToClipboard(shareUrl);
        if (success) showToast("Profile link copied! ✨");
      }
    } catch {
      // User dismissed share sheet
    }
  };

  const headerTouchStartY = useRef<number | null>(null);
  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    headerTouchStartY.current = e.touches[0].clientY;
  };
  const handleHeaderTouchMove = (e: React.TouchEvent) => {
    if (headerTouchStartY.current !== null && profileScrollRef.current) {
      const deltaY = headerTouchStartY.current - e.touches[0].clientY;
      profileScrollRef.current.scrollTop += deltaY;
      headerTouchStartY.current = e.touches[0].clientY;
    }
  };
  const handleHeaderTouchEnd = () => {
    headerTouchStartY.current = null;
  };

  const handleHeaderWheel = (e: React.WheelEvent) => {
    if (profileScrollRef.current) {
      profileScrollRef.current.scrollTop += e.deltaY;
    }
  };

  const handleContainedScroll = (event: { currentTarget: HTMLDivElement }) => {
    const el = event.currentTarget;
    setShowMoveToTop(el.scrollTop > 200);
    setShowStickyProfileHeader(el.scrollTop > 80);
  };

  const handleMoveToTop = () => {
    profileScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      if (scrollY > 80) {
        setShowStickyProfileHeader(true);
        setShowMoveToTop(scrollY > 200);
      } else if (!containedScroll || (profileScrollRef.current?.scrollTop || 0) <= 80) {
        setShowStickyProfileHeader(false);
        if (!containedScroll) setShowMoveToTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [containedScroll]);

  const isFull = variant === "full";
  // Live public pages (profile, series, reviews) render the card with contained scroll.
  // They share the exact card surface used by every public page (see components/public).
  const isPublicSurface = isFull || containedScroll;
  const bleedMargins = isFull ? "-mx-5 -mt-5 sm:-mx-8 sm:-mt-8" : "-mx-4 -mt-4 sm:-mx-6 sm:-mt-6";
  const bleedRadius = isFull ? "rounded-t-3xl" : "rounded-t-[28px]";

  const themeCssVars = getThemeCssVariables(themeMeta);
  const c = themeMeta.colors;
  const typ = themeMeta.typography;
  const eff = themeMeta.effects;
  const isDefaultCleanLayout = themeKey === "minimal-white" || themeKey === "sage-studio" || themeKey === "blush-paper" || themeKey === "studio-frost" || themeKey === "taj-mahal" || themeKey === "somnath-temple" || themeKey === "dwarka-temple" || themeKey === "goa-beach" || themeKey === "creator-studio" || themeKey === "food-vlog" || themeKey === "love-letter" || themeKey === "christmas-snow" || themeKey === "mountain-mist" || themeKey === "street-food" || themeKey === "aurora-gradient" || themeKey === "sunrise-pop" || themeKey === "candy-flow" || themeKey === "mint-wave" || themeKey === "royal-glow";

  const surfaceShadow = themeMeta.profileSurface?.shadow || eff.shadow || "0 24px 70px rgba(0,0,0,0.14)";
  const surfaceBorder = themeMeta.profileSurface?.border || c.border;
  const surfaceBg = themeMeta.profileSurface?.background || c.profileBackground;

  const cleanHandle = (profile.username || "").replace(/^@/, "");
  const formattedCategories = formatCategoryDots(profile.category, profile.customCategory);
  const headerSocialList = activeSocialList.filter((s) => s.hasAccount || s.count > 0 || (s.url && s.url !== "#"));
  const activeTeamMembers = teamData.team?.isActive === false
    ? []
    : (teamData.members || []).filter((member) => member.isActive !== false && member.name?.trim());

  const validLinksList = (customLinksList || []).filter(
    (l) => l.isEnabled !== false && l.title && (l.url || (l.kind === "collection" && l.items?.some((item) => item.isEnabled !== false && item.title && item.url)))
  );
  const validLinksCount = validLinksList.length;

  const isListingPage = Boolean(seriesOnlyMode || productsOnlyMode || reviewsOnlyMode);

  const hasSeriesTab = !isListingPage && effectiveVisibilitySettings.showSeries !== false && series.length > 0;
  const hasLinksTab = !isListingPage && (safeProfile.username === "demo_creator" || (effectiveVisibilitySettings.showCustomLinks !== false && validLinksCount > 0));
  const hasShopTab = !isListingPage && (products && products.length > 0);

  const navWhatsappNum = mediaKitSettings?.whatsappNumber?.trim() || (profile as any).whatsappNumber?.trim() || "";
  const navContactEmail = mediaKitSettings?.sponsorEmail?.trim() || profile.email?.trim() || "";
  const navActivePackages = (mediaKitPackages || []).filter((p) => p.isActive);
  const hasWorkTab = !isListingPage && effectiveVisibilitySettings.showCollabGigs !== false && (Boolean(navWhatsappNum) || Boolean(navContactEmail) || navActivePackages.length > 0);

  const hasReviewsTab = !isListingPage && effectiveVisibilitySettings.showReviews !== false && approvedReviews.length > 0;

  const validSetupList = (setupList || []).filter((it) => it.isActive !== false);
  const hasSetupTab = !isListingPage && validSetupList.length > 0;
  const hasFanbaseTab = !isListingPage && effectiveVisibilitySettings.showFanbase !== false && (totalAudience > 0 || fanbaseSocialCards.length > 0);
  const hasAboutTab = !isListingPage && (Boolean(profile.bio?.trim()) || hasFanbaseTab);

  const navTabs: { id: CreatorNavTabId; label: string; icon: any; count?: number | string }[] = [];
  if (hasAboutTab) navTabs.push({ id: "about", label: "About", icon: User, count: totalAudience > 0 ? formatCount(totalAudience) : undefined });
  if (hasSeriesTab) navTabs.push({ id: "series", label: "Series", icon: Film, count: series.length });
  if (hasLinksTab) navTabs.push({ id: "links", label: "My Links", icon: LinkIcon, count: validLinksCount });
  if (hasShopTab) navTabs.push({ id: "shop", label: "My Shop", icon: ShoppingBag, count: products?.length || 0 });
  if (hasReviewsTab) navTabs.push({ id: "reviews", label: "Reviews", icon: Star, count: approvedReviews.length });
  if (hasWorkTab) navTabs.push({ id: "work", label: "Work", icon: Briefcase, count: navActivePackages.length > 0 ? navActivePackages.length : undefined });
  if (hasSetupTab) navTabs.push({ id: "setup", label: "Setup", icon: Laptop, count: validSetupList.length });

  const isTabsLayout = layoutMode !== "stacked" && !isListingPage && navTabs.length >= 1;

  const navScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(() => navTabs.length > 3);

  const checkTabScroll = () => {
    const el = navScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  };

  useEffect(() => {
    const el = navScrollRef.current;
    if (!el) return;
    checkTabScroll();
    el.addEventListener("scroll", checkTabScroll, { passive: true });
    window.addEventListener("resize", checkTabScroll);
    return () => {
      el.removeEventListener("scroll", checkTabScroll);
      window.removeEventListener("resize", checkTabScroll);
    };
  }, [navTabs.length]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab") as CreatorNavTabId | null;
      const normalizedTab = tabParam === "fanbase" ? "about" : tabParam;
      if (normalizedTab && navTabs.some((t) => t.id === normalizedTab)) {
        setActiveNavTab(normalizedTab);
        return;
      }
    }
    if (navTabs.length > 0 && !navTabs.some((t) => t.id === activeNavTab)) {
      setActiveNavTab(navTabs[0].id);
    }
  }, [navTabs.length]);

  const handleTabChange = (tabId: CreatorNavTabId) => {
    setActiveNavTab(tabId);
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tabId);
        window.history.replaceState({}, "", url.toString());
      } catch { }
    }
    const tabEl = document.getElementById(`tab-${tabId}`);
    if (tabEl) {
      tabEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  };

  useEffect(() => {
    const tabEl = document.getElementById(`tab-${activeNavTab}`);
    if (tabEl) {
      tabEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
    checkTabScroll();
  }, [activeNavTab]);

  const publicSurfaceShadow = themeMeta.profileSurface?.shadow || (isDark
    ? "0 24px 60px -12px rgba(0, 0, 0, 0.45), 0 8px 24px -4px rgba(0, 0, 0, 0.3)"
    : "0 20px 50px -12px rgba(0, 0, 0, 0.08), 0 4px 16px -2px rgba(0, 0, 0, 0.04)");

  const cardContent = (
    <div
      style={{
        ...themeCssVars,
        backgroundColor: surfaceBg,
        borderColor: surfaceBorder,
        color: c.primaryText,
        fontFamily: typ.fontFamily,
        letterSpacing: typ.letterSpacing,
        ["--desktop-surface-shadow" as any]: surfaceShadow,
        boxShadow: isPublicSurface ? publicSurfaceShadow : undefined,
      }}
      className={`relative w-full max-w-full overflow-hidden flex-1 min-h-0 h-full max-h-full flex flex-col ${isPublicSurface
        ? "px-3 pt-[20px] sm:px-4 sm:pt-[20px] rounded-[24px] sm:rounded-[26px] border backdrop-blur-xl"
        : `${cardPadding ? cardPadding : "p-3 sm:p-4.5 pt-[20px]"} rounded-[18px] border shadow-md`
        } transition-all`}
    >
      {/* Ambient Animation in Preview mode when theme supports it */}
      {themeMeta.animation?.type !== "none" && !isPublicSurface && (
        <AmbientAnimation
          type={themeMeta.animation?.type || themeMeta.animationType}
          colors={themeMeta.animation?.colors || themeMeta.particleColors}
          themeKey={themeMeta.key}
          contained={true}
        />
      )}

      {/* Focus Overlay between animated background and content */}
      {!isPublicSurface && <FocusOverlay overlay={themeMeta.focusOverlay} contained={true} />}

      {/* Top Action Bar: Inflixo Logo & Wordmark on Left, Share on Right */}
      <div
        onWheel={handleHeaderWheel}
        onTouchStart={handleHeaderTouchStart}
        onTouchMove={handleHeaderTouchMove}
        onTouchEnd={handleHeaderTouchEnd}
        className="relative z-30 flex items-center justify-between gap-2 w-full px-0.5 py-0 rounded-xl bg-transparent border-transparent shrink-0 mb-0"
      >
        {/* Left: Back button (if pageHeader) OR Inflixo Logo + Wordmark */}
        <div className="shrink-0 flex items-center">
          {pageHeader ? (
            <button
              type="button"
              onPointerEnter={() => router.prefetch(pageHeader.backHref)}
              onClick={() => router.push(pageHeader.backHref)}
              style={{
                backgroundColor: usesDarkControls ? "rgba(255, 255, 255, 0.12)" : c.cardBackground,
                borderColor: usesDarkControls ? "rgba(255, 255, 255, 0.22)" : c.border,
                color: usesDarkControls ? "#FFFFFF" : c.primaryText,
              }}
              className="tap-scale flex h-7.5 w-7.5 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-[9px] border shadow-2xs transition-all hover:scale-105 cursor-pointer select-none"
              title={pageHeader.backLabel}
              aria-label={pageHeader.backLabel}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Link
              href="/"
              className="tap-scale flex items-center gap-1.5 select-none group cursor-pointer"
              title="Inflixo"
              aria-label="Inflixo"
            >
              <div className="flex h-7 w-7 sm:h-7.5 sm:w-7.5 shrink-0 items-center justify-center rounded-[8px] overflow-hidden shadow-2xs border border-white/20 bg-[#7A2253]">
                <Image
                  src="/images/inflixo-logo-3d.png"
                  alt="Inflixo"
                  width={28}
                  height={28}
                  className="h-full w-full object-cover select-none"
                  priority
                />
              </div>
              <span className="text-[#7A2253] text-[17px] sm:text-[18px] font-bold tracking-tight lowercase select-none leading-none">
                inflixo
              </span>
            </Link>
          )}
        </div>

        {/* Right: Share & Media Kit Button */}
        {!isOnboardingMode ? (
          <div className="flex items-center gap-1.5 shrink-0">
            {containedScroll && cleanHandle && cleanHandle !== "demo_creator" && !isDashboardPreview && !pageHeader && (
              <Link
                href={`/${cleanHandle}/media-kit`}
                onClick={(e) => {
                  if (isInformationalMode) {
                    e.preventDefault();
                    showToast("Opens the creator's media kit on the live profile ✨");
                  }
                }}
                style={{
                  backgroundColor: usesDarkControls ? "rgba(255, 255, 255, 0.12)" : c.cardBackground,
                  borderColor: usesDarkControls ? "rgba(255, 255, 255, 0.22)" : c.border,
                  color: usesDarkControls ? "#FFFFFF" : c.primaryText,
                }}
                className={PUBLIC_TEXT_BUTTON}
                title="View media kit"
              >
                <Briefcase className="h-3 w-3" />
                <span className="text-xs">Media kit</span>
              </Link>
            )}
            <button
              type="button"
              onClick={handleShareClick}
              style={{
                backgroundColor: usesDarkControls ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.8)",
                borderColor: usesDarkControls ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 0, 0, 0.06)",
                color: usesDarkControls ? "#FFFFFF" : c.primaryText,
              }}
              className="flex h-7 w-7 sm:h-7.5 sm:w-7.5 items-center justify-center rounded-full border shadow-2xs transition-all hover:scale-105 cursor-pointer backdrop-blur-xs"
              title={pageHeader ? `Share ${pageHeader.pageLabel.toLowerCase()}` : "Share profile"}
              aria-label={pageHeader ? `Share ${pageHeader.pageLabel.toLowerCase()}` : "Share profile"}
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="w-7 shrink-0" aria-hidden="true" />
        )}
      </div>

      {/* 1. FIXED TOP HEADER AREA (Centered Avatar, Creator Info, Socials, Tabs) */}
      <div
        onWheel={handleHeaderWheel}
        onTouchStart={handleHeaderTouchStart}
        onTouchMove={handleHeaderTouchMove}
        onTouchEnd={handleHeaderTouchEnd}
        className="shrink-0 w-full z-20"
      >
        <div className="relative flex flex-col items-center text-center -mt-7 sm:-mt-7">
          {/* Centered Compact Creator Avatar with Instagram Story Gradient Ring */}
          <div className="relative inline-block">
            <div className="p-[2px] rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] shadow-xs">
              <div className="p-[1.5px] bg-white dark:bg-[#18181B] rounded-full">
                <CreatorAvatar
                  src={profile.photoDataUrl}
                  name={profile.displayName || "Creator"}
                  className="h-13 w-13 sm:h-14 sm:w-14 rounded-full aspect-square object-cover object-center overflow-hidden mx-auto bg-white"
                  textClassName="text-sm font-extrabold"
                  textStyle={{ color: c.primaryText }}
                  fallbackBgClass="bg-[#7A2253]"
                />
              </div>
            </div>
            {profile.isVerified !== false && (
              <span className="absolute bottom-0 right-0 flex items-center justify-center" title="Verified Creator">
                <BadgeCheck className="h-4 w-4 fill-[#1877F2] text-white drop-shadow-xs" />
              </span>
            )}
          </div>

          {/* Creator Name (8px from avatar) */}
          <h1
            style={{
              color: c.primaryText,
              fontFamily: typ.headingFontFamily,
              fontWeight: 700,
            }}
            className="mt-2 text-[16px] sm:text-[17px] font-bold tracking-tight text-center break-words line-clamp-1 px-2 leading-tight"
          >
            {profile.displayName || "Creator Name"}
          </h1>

          {/* Username (8px from name) */}
          {cleanHandle && (
            <p
              style={{ color: c.mutedText }}
              className="mt-2 text-[11px] font-semibold text-center text-gray-500 truncate max-w-[280px] leading-none"
            >
              @{cleanHandle}
            </p>
          )}

          {/* Categories (8px from username) */}
          {effectiveVisibilitySettings.showContentCategory !== false && formattedCategories && (
            <p
              style={{ color: c.mutedText }}
              className="mt-2 text-[10px] sm:text-[10.5px] font-medium text-center text-gray-500/90 break-words line-clamp-1 px-4 leading-tight"
            >
              {formattedCategories.replace(/,\s*/g, " • ")}
            </p>
          )}

          {/* Clickable Social Icons Row (8px from category) */}
          {headerSocialList.length > 0 && (
            <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap">
              {headerSocialList.map((item) => {
                let bgClass = "bg-gray-800 text-white";
                if (item.platform === "instagram") {
                  bgClass = "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white";
                } else if (item.platform === "youtube") {
                  bgClass = "bg-[#FF0000] text-white";
                } else if (item.platform === "facebook") {
                  bgClass = "bg-[#1877F2] text-white";
                } else if (item.platform === "tiktok") {
                  bgClass = "bg-[#000000] text-white";
                } else if (item.platform === "twitter" || item.platform === "threads") {
                  bgClass = "bg-black text-white";
                } else if (item.platform === "linkedin") {
                  bgClass = "bg-[#0A66C2] text-white";
                } else if (item.platform === "snapchat") {
                  bgClass = "bg-[#FFFC00] text-black";
                } else if (item.platform === "spotify") {
                  bgClass = "bg-[#1DB954] text-white";
                } else if (item.platform === "twitch") {
                  bgClass = "bg-[#9146FF] text-white";
                } else if (item.platform === "pinterest") {
                  bgClass = "bg-[#E60023] text-white";
                }

                return (
                  <a
                    key={item.platform}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (isInformationalMode) {
                        e.preventDefault();
                        showToast(`Redirects to ${item.label} on live profile ✨`);
                      }
                    }}
                    className={`tap-scale flex h-6.5 w-6.5 items-center justify-center rounded-[7px] ${bgClass} shadow-2xs hover:scale-105 transition-all cursor-pointer`}
                    title={`Visit ${item.label}`}
                    aria-label={item.label}
                  >
                    <span className="flex items-center justify-center">
                      {item.platform === "instagram" && <InstagramIcon className="h-3 w-3" />}
                      {item.platform === "youtube" && <YoutubeIcon className="h-3 w-3" />}
                      {item.platform === "facebook" && <FacebookIcon className="h-3 w-3" />}
                      {item.platform === "twitter" && <XTwitterIcon className="h-2.5 w-2.5" />}
                      {item.platform === "linkedin" && <LinkedinIcon className="h-2.5 w-2.5" />}
                      {item.platform === "threads" && <ThreadsIcon className="h-2.5 w-2.5" />}
                      {item.platform === "snapchat" && <SnapchatIcon className="h-2.5 w-2.5" />}
                      {item.platform === "spotify" && <SpotifyIcon className="h-2.5 w-2.5" />}
                      {item.platform === "twitch" && <TwitchIcon className="h-2.5 w-2.5" />}
                      {item.platform === "pinterest" && <PinterestIcon className="h-2.5 w-2.5" />}
                      {item.platform === "tiktok" && <TikTokIcon className="h-3 w-3" />}
                      {!["instagram", "youtube", "facebook", "twitter", "linkedin", "threads", "snapchat", "spotify", "twitch", "pinterest", "tiktok"].includes(item.platform) && (
                        <Globe className="h-2.5 w-2.5 text-white" />
                      )}
                    </span>
                  </a>
                );
              })}
            </div>
          )}

          {/* Total Fanbase Pill (8px from social icons) */}
          {totalAudience > 0 && (
            <div className="mt-2 flex items-center justify-center">
              <div
                style={{
                  backgroundColor: usesDarkControls ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.9)",
                  borderColor: usesDarkControls ? "rgba(255, 255, 255, 0.16)" : "rgba(0, 0, 0, 0.06)",
                  color: c.primaryText,
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] sm:text-[10.5px] font-semibold shadow-2xs select-none backdrop-blur-xs leading-none"
              >
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-extrabold tabular-nums text-[11px]">{formatCount(totalAudience)}</span>
                <span className="text-gray-300 dark:text-gray-600 font-light mx-0.5">|</span>
                <span style={{ color: c.mutedText }} className="font-medium text-[10px]">Total Fanbase</span>
                <ChevronRight className="h-2.5 w-2.5 opacity-60 text-current ml-0.5" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs Bar - Fixed at bottom of top header (Never scrolls) */}
        {isTabsLayout && (
          <div className="relative z-20 mt-2 sm:mt-2.5 -mx-3 sm:-mx-4 text-left select-none border-y border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#18181B]">
            <div
              ref={navScrollRef}
              role="tablist"
              aria-label="Creator content sections"
              className="flex items-stretch min-w-full overflow-x-auto scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-x-contain scroll-smooth bg-white dark:bg-[#18181B]"
            >
              {navTabs.map((tab) => {
                const isActive = activeNavTab === tab.id;
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`tab-${tab.id}`}
                    aria-controls={`section-${tab.id}`}
                    aria-selected={isActive}
                    onClick={() => handleTabChange(tab.id)}
                    style={{
                      color: isActive
                        ? (usesDarkControls ? "#FFFFFF" : "#7A2253")
                        : (usesDarkControls ? "rgba(255, 255, 255, 0.65)" : "#64748B"),
                      borderBottomColor: isActive
                        ? (usesDarkControls ? "#FFFFFF" : "#7A2253")
                        : "transparent",
                    }}
                    className={`group/tab relative flex-1 shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-none text-xs font-bold border-b-2 border-r border-black/[0.05] dark:border-white/[0.06] last:border-r-0 transition-colors duration-150 cursor-pointer whitespace-nowrap select-none bg-white dark:bg-[#18181B] ${isActive
                        ? "-mb-px"
                        : "hover:bg-slate-50/80 dark:hover:bg-white/[0.04] hover:text-black dark:hover:text-white"
                      }`}
                  >
                    <IconComponent
                      className={`h-3.5 w-3.5 shrink-0 transition-opacity ${isActive
                          ? "opacity-100"
                          : "opacity-60 group-hover/tab:opacity-90"
                        }`}
                    />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count !== null && tab.count !== 0 && tab.count !== "" && (
                      <span
                        style={{
                          backgroundColor: isActive
                            ? (usesDarkControls ? "rgba(255, 255, 255, 0.16)" : "rgba(122, 34, 83, 0.1)")
                            : (usesDarkControls ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"),
                          color: isActive
                            ? (usesDarkControls ? "#FFFFFF" : "#7A2253")
                            : (usesDarkControls ? "rgba(255, 255, 255, 0.7)" : "#64748B"),
                        }}
                        className="text-[9.5px] font-black px-1.5 py-0.5 rounded-none tabular-nums"
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Fixed Listing Header on Dedicated Listing Pages (Series / Shop / Reviews) */}
        {isListingPage && (
          <div className="relative z-20 -mx-3.5 sm:-mx-5 select-none bg-white dark:bg-[#18181B]">
            {/* Divider between Total Fanbase and Title */}
            <div style={{ backgroundColor: c.divider }} className="h-px opacity-60" aria-hidden="true" />

            {/* Title & Subtitle for Series */}
            {seriesOnlyMode && (
              <div className="px-3.5 sm:px-5 pt-3 pb-2.5 text-left">
                <div className="flex items-center justify-between gap-2 px-0.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Clapperboard className="h-4.5 w-4.5 text-[#7A2253] dark:text-pink-400 shrink-0" />
                      <h2
                        style={{
                          color: c.primaryText,
                          fontFamily: typ.headingFontFamily,
                          fontWeight: 700,
                        }}
                        className="text-[14.5px] sm:text-[15.5px] font-bold tracking-tight truncate"
                      >
                        My Series &amp; Shows
                      </h2>
                    </div>
                    <p
                      style={{ color: c.secondaryText }}
                      className="text-[11px] sm:text-xs font-normal mt-0.5 truncate"
                    >
                      Binge-worthy multi-part series, masterclasses &amp; playlists in one place.
                    </p>
                  </div>

                  <div className="relative shrink-0">
                    <select
                      value={seriesSortOrder}
                      onChange={(e) => setSeriesSortOrder(e.target.value)}
                      className="appearance-none bg-white dark:bg-[#18181B] border border-black/15 dark:border-white/15 rounded-lg text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 py-1 pl-2.5 pr-6 cursor-pointer focus:outline-hidden hover:border-black/30 dark:hover:border-white/30 transition-colors shadow-2xs"
                    >
                      <option value="latest">Latest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="episodes">Most Episodes</option>
                    </select>
                    <ChevronDown className="h-3 w-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {/* Title & Subtitle for Products / Shop */}
            {productsOnlyMode && (
              <div className="px-3.5 sm:px-5 pt-2.5 pb-2 text-left">
                <div className="flex items-center justify-between px-0.5">
                  <div className="min-w-0">
                    <h2
                      style={{
                        color: c.primaryText,
                        fontFamily: typ.headingFontFamily,
                        fontWeight: 700,
                      }}
                      className={`flex items-center gap-1.5 ${PUBLIC_TYPE.sectionTitle}`}
                    >
                      <ShoppingBag className="h-3.5 w-3.5 opacity-70" style={{ color: c.primaryText }} />
                      <span>Curated Store &amp; Gear Picks</span>
                    </h2>
                  </div>
                  {products && products.length > 0 && (
                    <span
                      style={{ color: c.mutedText }}
                      className="shrink-0 text-[11px] sm:text-xs font-semibold"
                    >
                      {products.length} {products.length === 1 ? "Pick" : "Picks"}
                    </span>
                  )}
                </div>
                <p
                  style={{ color: c.secondaryText }}
                  className="text-[11px] sm:text-xs font-normal px-0.5 mt-0.5"
                >
                  Handpicked tech, creative tools &amp; daily essentials I personally trust &amp; recommend.
                </p>
              </div>
            )}

            {/* Title & Subtitle for Reviews */}
            {reviewsOnlyMode && (
              <div className="px-3.5 sm:px-5 pt-2.5 pb-2 text-left">
                <div className="flex items-center justify-between px-0.5">
                  <h2
                    style={{
                      color: c.primaryText,
                      fontFamily: typ.headingFontFamily,
                      fontWeight: 700,
                    }}
                    className={`flex items-center gap-1.5 ${PUBLIC_TYPE.sectionTitle}`}
                  >
                    <Star className="h-3.5 w-3.5 opacity-70" style={{ color: c.primaryText }} />
                    <span>Brand Endorsements &amp; Trust</span>
                  </h2>
                  {approvedReviews.length > 0 && (
                    <span
                      style={{ color: c.mutedText }}
                      className="text-[11px] sm:text-xs font-semibold"
                    >
                      {approvedReviews.length} {approvedReviews.length === 1 ? "Review" : "Reviews"}
                    </span>
                  )}
                </div>
                <p
                  style={{ color: c.secondaryText }}
                  className="text-[11px] sm:text-xs font-normal px-0.5 mt-0.5"
                >
                  Verified feedback and testimonials from leading brands &amp; collaboration partners.
                </p>
              </div>
            )}

            {/* Divider separating fixed listing header from scrollable list */}
            <div style={{ backgroundColor: c.divider }} className="h-px opacity-60" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* 2. SCROLLABLE TAB CONTENT AREA (Smoothly scrolls under the fixed tab bar) */}
      <div
        ref={profileScrollRef}
        onScroll={handleContainedScroll}
        className="relative z-10 flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pt-2.5 pb-6"
      >

        {/* 2. About Tab (Creator Bio Story Bento + Rich Verified Channels Showcase) */}
        {!isListingPage && (!isTabsLayout || activeNavTab === "about" || activeNavTab === "fanbase") && (
          <div id="about-section" className={`relative z-10 w-full text-left animate-fade-in ${isTabsLayout ? "order-[4] mt-3 sm:mt-3.5 space-y-2.5 sm:space-y-3" : "order-[1] mt-5 sm:mt-6 space-y-3"}`}>

            {/* A. Creator Story Card */}
            {isTabsLayout && profile.bio && profile.bio.trim() && (
              <div
                style={{
                  backgroundColor: usesDarkControls ? "#18181B" : "#FFFFFF",
                  borderColor: usesDarkControls ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
                }}
                className="rounded-[5px] border p-3.5 sm:p-4 text-left transition-all space-y-2.5"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] dark:border-white/[0.08] pb-2.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <User className="h-4 w-4 text-[#7A2253] dark:text-pink-400 shrink-0" />
                    <h2
                      style={{ color: c.primaryText, fontFamily: typ.headingFontFamily }}
                      className="text-[13.5px] sm:text-sm font-bold truncate"
                    >
                      About {profile.displayName || "The Creator"}
                    </h2>
                  </div>
                  {formattedCategories && (
                    <span className="shrink-0 rounded-full bg-pink-50 dark:bg-pink-950/40 text-[#7A2253] dark:text-pink-300 border border-pink-200/60 dark:border-pink-800/40 px-2.5 py-0.5 text-[10.5px] sm:text-[11px] font-semibold truncate max-w-[180px]">
                      {formattedCategories}
                    </span>
                  )}
                </div>

                {/* Bio Editorial Text */}
                <ExpandableText
                  text={profile.bio}
                  style={{ color: c.secondaryText }}
                  className="text-xs sm:text-[13px] leading-relaxed font-normal break-words"
                  buttonStyle={{ color: c.accentText || c.primaryText }}
                  buttonClassName="mt-1 inline-flex items-center gap-0.5 text-[11px] sm:text-xs font-bold hover:underline cursor-pointer select-none"
                />
              </div>
            )}

            {/* B. Total Fanbase Bento Banner (matching screenshot) */}
            {effectiveVisibilitySettings.showFanbase !== false && (totalAudience > 0 || fanbaseSocialCards.length > 0) && (
              <div
                style={{
                  background: usesDarkControls
                    ? "linear-gradient(135deg, rgba(122, 34, 83, 0.14) 0%, rgba(30, 20, 28, 0.6) 100%)"
                    : "linear-gradient(135deg, rgba(254, 242, 247, 0.75) 0%, rgba(255, 255, 255, 0.95) 100%)",
                  borderColor: usesDarkControls ? "rgba(244, 63, 94, 0.22)" : "rgba(244, 63, 94, 0.16)",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
                }}
                className="rounded-[5px] border p-4 sm:p-5 text-left transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left Column: Metric & Subtitle */}
                  <div className="flex-1 min-w-0">
                    <span
                      style={{ fontFamily: typ.headingFontFamily }}
                      className="text-xs sm:text-[13px] font-bold text-[#7A2253] dark:text-pink-400 tracking-tight"
                    >
                      Total Fanbase
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        style={{ fontFamily: typ.headingFontFamily, color: c.primaryText }}
                        className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight leading-none"
                      >
                        {formatCount(totalAudience)}
                      </span>
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    </div>
                    <p style={{ color: c.mutedText }} className="text-[11px] sm:text-xs font-medium mt-1.5">
                      Verified community across {fanbaseSocialCards.length > 0 ? `${fanbaseSocialCards.length} connected platforms` : "3 connected platforms"}
                    </p>
                  </div>

                  {/* Vertical Divider for sm+ screens */}
                  <div className="hidden sm:block h-14 w-px bg-pink-200/60 dark:bg-pink-800/40" />

                  {/* Right Column: Community Graphic & 3 Bullet Points */}
                  <div className="flex items-center gap-3.5 shrink-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-100/60 dark:bg-pink-950/40 text-[#7A2253] dark:text-pink-400 shrink-0">
                      <Users className="h-6 w-6 stroke-[1.75]" />
                    </div>
                    <div className="space-y-1 text-xs sm:text-[12px] font-medium text-slate-700 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#7A2253] dark:text-pink-400 shrink-0 fill-pink-100 dark:fill-pink-950" />
                        <span>{fanbaseSocialCards.length > 0 ? `${fanbaseSocialCards.length} Platforms Connected` : "3 Platforms Connected"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#7A2253] dark:text-pink-400 shrink-0 fill-pink-100 dark:fill-pink-950" />
                        <span>Real Audience</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#7A2253] dark:text-pink-400 shrink-0 fill-pink-100 dark:fill-pink-950" />
                        <span>Growing Community</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* C. Social Accounts Bento Card (matching screenshot) */}
            {effectiveVisibilitySettings.showFanbase !== false && fanbaseSocialCards.length > 0 && (
              <div
                style={{
                  backgroundColor: usesDarkControls ? "#18181B" : "#FFFFFF",
                  borderColor: usesDarkControls ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
                }}
                className="rounded-[5px] border p-3.5 sm:p-4 text-left transition-all space-y-3"
              >
                {/* Header */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <LinkIcon className="h-4 w-4 text-[#7A2253] dark:text-pink-400" />
                    <h2
                      style={{ color: c.primaryText, fontFamily: typ.headingFontFamily }}
                      className="text-[13.5px] sm:text-sm font-bold"
                    >
                      Social Accounts
                    </h2>
                  </div>
                  <p style={{ color: c.mutedText }} className="text-[11px] sm:text-xs font-normal mt-0.5">
                    Follow me on these platforms for the latest updates, videos and behind the scenes.
                  </p>
                </div>

                {/* Social Accounts List */}
                <div className="space-y-2">
                  {fanbaseSocialCards.map((item) => {
                    const rawHandle = (item.handle || item.name || item.label).replace(/^@/, "");
                    const isServiceOnly = item.platform === "spotify" && rawHandle.toLowerCase() === "spotify";
                    const displayHandle = isServiceOnly ? "Spotify Artist" : `@${rawHandle}`;
                    const countFormatted = item.count > 0 ? formatCount(item.count) : null;

                    const isYoutube = item.platform === "youtube";
                    const isInstagram = item.platform === "instagram";
                    const isFacebook = item.platform === "facebook";

                    const badgeBg = isYoutube
                      ? "bg-[#FF0000]"
                      : isInstagram
                        ? "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]"
                        : isFacebook
                          ? "bg-[#1877F2]"
                          : "bg-black/[0.05] dark:bg-white/[0.08]";

                    return (
                      <a
                        key={item.platform}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (isInformationalMode) {
                            e.preventDefault();
                            showToast(`Redirects to ${item.label} on live profile ✨`);
                          }
                        }}
                        style={{
                          backgroundColor: usesDarkControls ? "#1F1F23" : "#FFFFFF",
                          borderColor: usesDarkControls ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
                        }}
                        className="group/ch flex items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-[12px] border transition-all hover:border-black/20 dark:hover:border-white/20 hover:shadow-xs cursor-pointer text-left"
                        title={`Open ${item.label} (${displayHandle})`}
                      >
                        {/* Left: Platform Icon + Handle + Platform Label */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className={`shrink-0 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-[12px] ${badgeBg} text-white shadow-2xs transition-transform group-hover/ch:scale-105`}>
                            {isInstagram && <InstagramIcon className="h-5 w-5 text-white" />}
                            {isYoutube && <YoutubeIcon className="h-5 w-5 text-white" />}
                            {isFacebook && <FacebookIcon className="h-5 w-5 text-white" />}
                            {item.platform === "twitter" && <XTwitterIcon className="h-4 w-4 text-white" />}
                            {item.platform === "linkedin" && <LinkedinIcon className="h-4 w-4 text-white" />}
                            {item.platform === "threads" && <ThreadsIcon className="h-4 w-4 text-white" />}
                            {item.platform === "snapchat" && <SnapchatIcon className="h-4 w-4 text-white" />}
                            {item.platform === "spotify" && <SpotifyIcon className="h-4 w-4 text-white" />}
                            {item.platform === "twitch" && <TwitchIcon className="h-4 w-4 text-white" />}
                            {item.platform === "pinterest" && <PinterestIcon className="h-4 w-4 text-white" />}
                            {!["instagram", "youtube", "facebook", "twitter", "linkedin", "threads", "snapchat", "spotify", "twitch", "pinterest"].includes(item.platform) && (
                              <Globe className="h-4 w-4 text-slate-700 dark:text-white" />
                            )}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs sm:text-[13px] font-bold truncate group-hover/ch:text-[#7A2253] dark:group-hover/ch:text-pink-400 transition-colors" style={{ color: c.primaryText }}>
                                {displayHandle}
                              </span>
                              <CheckCircle2 className="h-3.5 w-3.5 fill-blue-500 text-white shrink-0" />
                            </div>
                            <p style={{ color: c.mutedText }} className="text-[10.5px] sm:text-[11px] font-medium capitalize truncate">
                              {item.label}
                            </p>
                          </div>
                        </div>

                        {/* Right: Follower Count + External Link */}
                        <div className="shrink-0 flex items-center gap-2 sm:gap-2.5">
                          <div className="text-right">
                            <div className="text-xs sm:text-[13px] font-black tabular-nums tracking-tight leading-tight" style={{ color: c.primaryText }}>
                              {countFormatted || "0"}
                            </div>
                            <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: c.mutedText }}>
                              {item.unit || (isYoutube ? "Subscribers" : "Followers")}
                            </div>
                          </div>

                          <ExternalLink className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0 opacity-70 group-hover/ch:opacity-100 transition-opacity" />
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Links Section */}
        {!isListingPage && (!isTabsLayout || activeNavTab === "links") && (safeProfile.username === "demo_creator" || (effectiveVisibilitySettings.showCustomLinks !== false && customLinksList && customLinksList.filter((l) => l.isEnabled !== false && l.title && (l.url || (l.kind === "collection" && l.items?.some((item) => item.isEnabled !== false && item.title && item.url)))).length > 0)) && (
          <div id="links-section" className={`relative z-10 order-[5] w-full text-left animate-fade-in ${isTabsLayout ? "mt-2.5 sm:mt-3" : "mt-5 sm:mt-6 space-y-2"}`}>
            {/* Header: My Links + Subtitle (clean, compact) */}
            <div className="pb-1.5 sm:pb-2">
              <div className="flex items-center justify-between px-0.5">
                <h2
                  style={{
                    color: c.primaryText,
                    fontFamily: typ.headingFontFamily,
                  }}
                  className="text-base sm:text-lg font-bold tracking-tight"
                >
                  My Links
                </h2>
              </div>
              <p
                style={{ color: c.secondaryText }}
                className="text-xs text-slate-500 dark:text-slate-400 font-normal px-0.5 mt-0.5"
              >
                Find all my important links, projects and more.
              </p>
            </div>

            <div className="space-y-2 sm:space-y-2.5 w-full">
              {(() => {
                const getCollectionTheme = (index: number, link: CustomLink) => {
                  const titleLower = (link.title || "").toLowerCase();
                  if (titleLower.includes("official") || titleLower.includes("channel") || index === 0) {
                    return {
                      container: "bg-[#FFF9FB] dark:bg-white/[0.02] border-[#FCE7F1] dark:border-pink-950/50",
                      title: "text-[#7A2253] dark:text-pink-400",
                      badge: "bg-[#FDF2F7] text-[#7A2253] dark:bg-pink-950/40 dark:text-pink-300 border-pink-200/60 dark:border-pink-900/50",
                      chevron: "text-[#7A2253] dark:text-pink-400",
                    };
                  }
                  if (titleLower.includes("project") || titleLower.includes("collab") || index === 1) {
                    return {
                      container: "bg-[#F8FAFC] dark:bg-white/[0.02] border-[#E0E7FF] dark:border-sky-950/50",
                      title: "text-[#1E3A8A] dark:text-sky-400",
                      badge: "bg-[#EFF6FF] text-[#1E3A8A] dark:bg-sky-950/40 dark:text-sky-300 border-sky-200/60 dark:border-sky-900/50",
                      chevron: "text-[#1E3A8A] dark:text-sky-400",
                    };
                  }
                  return {
                    container: "bg-[#F0FDF4]/50 dark:bg-white/[0.02] border-[#D1FAE5] dark:border-emerald-950/50",
                    title: "text-[#065F46] dark:text-emerald-400",
                    badge: "bg-[#ECFDF5] text-[#065F46] dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/50",
                    chevron: "text-[#065F46] dark:text-emerald-400",
                  };
                };

                let collectionIndex = 0;

                return customLinksList
                  .filter((l) => l.isEnabled !== false && l.title && (l.url || (l.kind === "collection" && l.items?.some((item) => item.isEnabled !== false && item.title && item.url))))
                  .map((link) => {
                    if (link.kind === "collection") {
                      const collectionItems = link.items?.filter((item) => item.isEnabled !== false && item.title && item.url) || [];
                      const theme = getCollectionTheme(collectionIndex, link);
                      collectionIndex++;
                      const isCollapsed = Boolean(collapsedCollectionsMap[link.id]);

                      return (
                        <div
                          key={link.id}
                          className={`rounded-2xl border p-2.5 sm:p-3 space-y-2 transition-all shadow-2xs ${theme.container}`}
                        >
                          {/* Folder Header */}
                          <button
                            type="button"
                            onClick={() => toggleCollection(link.id)}
                            className="w-full flex items-center justify-between text-left cursor-pointer select-none group/colheader"
                            aria-expanded={!isCollapsed}
                          >
                            <div className="min-w-0 pr-2">
                              <h3 className={`text-[14px] sm:text-[14.5px] font-bold tracking-tight ${theme.title}`}>
                                {link.title}
                              </h3>
                              {link.subtitle ? (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 line-clamp-1">
                                  {link.subtitle}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`rounded-full border text-[10px] font-bold px-2.5 py-0.5 shadow-2xs leading-none ${theme.badge}`}>
                                {collectionItems.length} {collectionItems.length === 1 ? "Link" : "Links"}
                              </span>
                              {isCollapsed ? (
                                <ChevronDown className={`h-3.5 w-3.5 ${theme.chevron} transition-transform duration-200`} />
                              ) : (
                                <ChevronUp className={`h-3.5 w-3.5 ${theme.chevron} transition-transform duration-200`} />
                              )}
                            </div>
                          </button>

                          {/* Expanded Items */}
                          {!isCollapsed && (
                            <div className="space-y-1.5 pt-0.5 animate-in fade-in duration-200">
                              {collectionItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="group/item rounded-xl border border-slate-100 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-center justify-between gap-3 shadow-2xs hover:border-black/15 dark:hover:border-white/20 transition-all"
                                >
                                  <span className="text-xs sm:text-[13px] font-semibold text-slate-800 dark:text-slate-100 min-w-0 truncate">
                                    {item.title}
                                  </span>
                                  <a
                                    href={item.url || "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                      if (isInformationalMode) {
                                        e.preventDefault();
                                        showToast(`Opens ${item.title} ✨`);
                                      }
                                    }}
                                    className="tap-scale shrink-0 h-6.5 w-6.5 sm:h-7 sm:w-7 rounded-full bg-pink-50 dark:bg-pink-950/40 border border-pink-100 dark:border-pink-900/40 text-[#7A2253] dark:text-pink-300 flex items-center justify-center hover:bg-pink-100 dark:hover:bg-pink-950/70 transition-all shadow-2xs cursor-pointer"
                                    aria-label={`Open ${item.title}`}
                                    title={`Open ${item.title}`}
                                  >
                                    <ArrowUpRight className="h-3 w-3" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Standalone Card (e.g. Book Tickets: Middle Class Dreams Tour)
                    return (
                      <div
                        key={link.id}
                        className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2.5 sm:px-3.5 sm:py-3 flex items-center justify-between gap-3 shadow-2xs hover:border-black/20 dark:hover:border-white/20 transition-all"
                      >
                        <span className="text-xs sm:text-[13.5px] font-bold text-slate-900 dark:text-white min-w-0 truncate">
                          {link.title}
                        </span>
                        <a
                          href={link.url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (isInformationalMode) {
                              e.preventDefault();
                              showToast(`Opens ${link.title} ✨`);
                            }
                          }}
                          className="tap-scale shrink-0 h-6.5 w-6.5 sm:h-7 sm:w-7 rounded-full bg-pink-50 dark:bg-pink-950/40 border border-pink-100 dark:border-pink-900/40 text-[#7A2253] dark:text-pink-300 flex items-center justify-center hover:bg-pink-100 dark:hover:bg-pink-950/70 transition-all shadow-2xs cursor-pointer"
                          aria-label={`Open ${link.title}`}
                          title={`Open ${link.title}`}
                        >
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      </div>
                    );
                  });
              })()}
            </div>
          </div>
        )}

        {/* 4. Series Section */}
        {(seriesOnlyMode || (!isListingPage && (!isTabsLayout || activeNavTab === "series"))) && effectiveVisibilitySettings.showSeries !== false && (series.length > 0 || seriesOnlyMode) && (
          <div id="series-section" className={`relative z-10 order-[10] w-full text-left animate-fade-in ${seriesOnlyMode ? "mt-1.5 sm:mt-2" : isTabsLayout ? "mt-3 sm:mt-3.5" : "mt-6 sm:mt-7 space-y-2.5"}`}>
            {!seriesOnlyMode && (
              <div className="pb-1">
                <div className="flex items-center justify-between gap-2 px-0.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Film className="h-4 w-4 text-slate-700 dark:text-slate-300 shrink-0" />
                      <h2
                        style={{
                          color: c.primaryText,
                          fontFamily: typ.headingFontFamily,
                          fontWeight: 700,
                        }}
                        className="text-[14px] sm:text-[15px] font-bold tracking-tight truncate"
                      >
                        Featured Series &amp; Shows
                      </h2>
                    </div>
                    <p
                      style={{ color: c.secondaryText }}
                      className="text-[11px] sm:text-xs font-normal mt-0.5"
                    >
                      Binge-worthy multi-part series, masterclasses &amp; playlists in structured order.
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      style={{ color: c.mutedText }}
                      className="text-[11px] sm:text-xs font-semibold tabular-nums"
                    >
                      {series.length} {series.length === 1 ? "Series" : "Series"}
                    </span>
                    <div className="relative">
                      <select
                        value={seriesFilter}
                        onChange={(e) => setSeriesFilter(e.target.value)}
                        className="appearance-none bg-white dark:bg-[#18181B] border border-black/15 dark:border-white/15 rounded-lg text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 py-0.5 pl-2.5 pr-6 cursor-pointer focus:outline-hidden hover:border-black/30 dark:hover:border-white/30 transition-colors shadow-2xs"
                      >
                        <option value="all">All Series</option>
                        <option value="youtube">YouTube</option>
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                      </select>
                      <ChevronDown className="h-3 w-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {series.length === 0 ? (
              <div
                style={{
                  backgroundColor: c.elevatedBackground,
                  borderColor: c.border,
                }}
                className="rounded-[12px] border p-3.5 sm:p-4 text-center space-y-0.5"
              >
                <p
                  style={{ color: c.primaryText }}
                  className="text-xs sm:text-sm font-semibold"
                >
                  No series added yet
                </p>
                <p
                  style={{ color: c.mutedText }}
                  className="text-[11px] sm:text-xs"
                >
                  Stay tuned! Episodes and playlists will appear here soon.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 sm:space-y-3">
                {displayedSeries
                  .filter((s) => {
                    if (seriesFilter === "all") return true;
                    const p = (s.platform || "").toLowerCase();
                    const allEps = getSeriesEpisodes(s);
                    const firstUrl = (allEps[0]?.externalUrl || "").toLowerCase();
                    return p.includes(seriesFilter) || firstUrl.includes(seriesFilter);
                  })
                  .sort((a, b) => {
                    if (seriesSortOrder === "oldest") {
                      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
                    }
                    if (seriesSortOrder === "episodes") {
                      return getSeriesEpisodes(b).length - getSeriesEpisodes(a).length;
                    }
                    return 0; // maintain natural curated order by default
                  })
                  .map((s, idx) => {
                    const allEps = getSeriesEpisodes(s);
                    const epCount = allEps.length;
                    const epCountStr = `${epCount} ${epCount === 1 ? "Episode" : "Episodes"}`;

                    const firstEpUrl = allEps[0]?.externalUrl || "";
                    const detectedPlatform = (() => {
                      const p = (s.platform || "").toLowerCase();
                      const u = (firstEpUrl || "").toLowerCase();
                      if (p.includes("creator")) return "Creator";
                      if (p.includes("multi") || p.includes("mix")) return "Multi-Platform";
                      if (p.includes("youtube") || u.includes("youtube.com") || u.includes("youtu.be")) return "YouTube";
                      if (p.includes("instagram") || u.includes("instagram.com")) return "Instagram";
                      if (p.includes("facebook") || u.includes("facebook.com")) return "Facebook";
                      if (s.platform && s.platform.trim()) return s.platform.trim();
                      return "YouTube";
                    })();

                    const isYoutube = detectedPlatform === "YouTube";
                    const isInstagram = detectedPlatform === "Instagram";
                    const isFacebook = detectedPlatform === "Facebook";
                    const isCreator = detectedPlatform === "Creator";
                    const isMulti = detectedPlatform === "Multi-Platform";

                    const seriesGenres = s.genre
                      ? s.genre.split(/[,•|/]/).map((g: string) => g.trim().replace(/^Genre:\s*/i, "")).filter(Boolean)
                      : [];
                    const genrePills = seriesGenres.length > 0
                      ? seriesGenres.slice(0, 2)
                      : s.genre
                        ? [s.genre.replace(/^Genre:\s*/i, "").trim()]
                        : [];

                    const seriesPills: string[] = [
                      ...genrePills,
                      ...(s.language && s.language.trim() ? [s.language.trim()] : []),
                    ].filter(Boolean);

                    const seriesUrl = `/${cleanHandle || "creator"}/series/${s.id}`;

                    return (
                      <div
                        key={s.id}
                        onPointerEnter={() => {
                          if (seriesUrl && seriesOpenMode === "page") {
                            router.prefetch(seriesUrl);
                          }
                        }}
                        onClick={() => {
                          if (onSeriesPreviewOpen) {
                            onSeriesPreviewOpen(s);
                          } else if (isInformationalMode) {
                            showToast(`Opens ${s.title} dedicated series page ✨`);
                          } else if (seriesOpenMode === "internal") {
                            setDrawerSeries(s);
                            setIsDrawerOpen(true);
                          } else {
                            router.push(seriesUrl);
                          }
                        }}
                        style={{
                          backgroundColor: usesDarkControls ? "#18181B" : "#FFFFFF",
                          borderColor: usesDarkControls ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
                          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
                        }}
                        className="group flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-[5px] border transition-all duration-200 hover:border-black/20 dark:hover:border-white/20 hover:shadow-xs cursor-pointer text-left"
                      >
                        {/* Left: Thumbnail Image + Badges */}
                        <div className="relative shrink-0 w-[140px] sm:w-[170px] h-[95px] sm:h-[105px] rounded-[14px] overflow-hidden bg-black/5 dark:bg-white/5">
                          {/* Top-Left Badge: Featured on 1st, or Platform Series on others */}
                          {idx === 0 ? (
                            <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-[#FEF08A] text-amber-950 px-2 py-0.5 text-[9px] sm:text-[9.5px] font-black shadow-xs tracking-wide">
                              <Crown className="h-2.5 w-2.5 fill-amber-950 text-amber-950" />
                              <span>Featured</span>
                            </span>
                          ) : (
                            <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/80 backdrop-blur-xs text-white px-2 py-0.5 text-[9px] sm:text-[9.5px] font-bold shadow-xs">
                              {isYoutube && <YoutubeIcon className="h-2.5 w-2.5 text-red-500 fill-red-500" />}
                              {isInstagram && <InstagramIcon className="h-2.5 w-2.5 text-pink-400" />}
                              {isFacebook && <FacebookIcon className="h-2.5 w-2.5 text-blue-400 fill-blue-400" />}
                              {isCreator && <Rocket className="h-2.5 w-2.5 text-slate-200" />}
                              {isMulti && <Layers className="h-2.5 w-2.5 text-slate-200" />}
                              {!isYoutube && !isInstagram && !isFacebook && !isCreator && !isMulti && <Film className="h-2.5 w-2.5 text-white" />}
                              <span>
                                {isCreator
                                  ? "Creator Series"
                                  : isYoutube
                                    ? "YouTube Series"
                                    : isInstagram
                                      ? "Instagram Series"
                                      : isFacebook
                                        ? "Facebook Series"
                                        : `${detectedPlatform} Series`}
                              </span>
                            </span>
                          )}

                          {/* Bottom-Left Badge: Episodes Count */}
                          <span className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/80 backdrop-blur-xs text-white px-2 py-0.5 text-[9px] sm:text-[9.5px] font-bold shadow-xs">
                            <Play className="h-2 w-2 fill-white text-white" />
                            <span>{epCountStr}</span>
                          </span>

                          {/* Image */}
                          {s.posterDataUrl ? (
                            <img
                              src={s.posterDataUrl}
                              alt={s.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <PlatformThumbnailBox
                              posterUrl={s.posterDataUrl}
                              videoUrl={firstEpUrl}
                              platform={s.platform || detectedPlatform}
                              title={s.title}
                              badgeText={detectedPlatform}
                              className="w-full h-full"
                              size="sm"
                              showTitleOverlay={false}
                            />
                          )}
                        </div>

                        {/* Middle: Title, Description, Colored Tags */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <h3
                            style={{
                              color: c.primaryText,
                              fontFamily: typ.headingFontFamily,
                            }}
                            className="text-[13.5px] sm:text-[14.5px] font-bold leading-snug line-clamp-1 group-hover:text-[#7A2253] dark:group-hover:text-pink-400 transition-colors"
                          >
                            {s.title}
                          </h3>

                          {s.description && (
                            <p
                              style={{ color: c.secondaryText }}
                              className="text-[11px] sm:text-xs leading-relaxed line-clamp-2"
                            >
                              {s.description}
                            </p>
                          )}

                          {/* Distinct Colored Tags Matching Screenshot: Pink, Blue, Slate */}
                          {seriesPills.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {seriesPills.map((pill, pIdx) => {
                                const pillStyleClass = pIdx === 0
                                  ? "bg-pink-50 dark:bg-pink-950/40 text-[#7A2253] dark:text-pink-300 border border-pink-200/50 dark:border-pink-900/40"
                                  : pIdx === 1
                                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40"
                                    : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/10";
                                return (
                                  <span
                                    key={pIdx}
                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${pillStyleClass}`}
                                  >
                                    {pill}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Far Right: Circular Plum Arrow Button */}
                        <div className="shrink-0 flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-pink-50 dark:bg-pink-950/40 text-[#7A2253] dark:text-pink-300 group-hover:bg-pink-100 dark:group-hover:bg-pink-900/60 transition-colors self-center">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {!seriesOnlyMode && allSeriesHref && series.length > 0 && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onPointerEnter={() => {
                    if (allSeriesHref && !isInformationalMode) {
                      router.prefetch(allSeriesHref);
                    }
                  }}
                  onClick={() => {
                    if (isInformationalMode) {
                      showToast("Opens all creator series on live profile ✨");
                      return;
                    }
                    router.push(allSeriesHref);
                  }}
                  className="w-full py-2.5 px-4 rounded-full bg-pink-50/70 hover:bg-pink-100/90 text-[#7A2253] dark:bg-pink-950/40 dark:text-pink-300 border border-pink-200/60 dark:border-pink-900/40 text-xs sm:text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>View all series &amp; shows</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Shop / Products Section */}
        {(productsOnlyMode || (!isListingPage && (!isTabsLayout || activeNavTab === "shop"))) && ((products && products.length > 0) || productsOnlyMode) && (
          <section id="shop-section" aria-label="Shop" className={`relative z-10 order-[15] w-full text-left animate-fade-in ${productsOnlyMode ? "mt-1.5 sm:mt-2" : isTabsLayout ? "mt-3 sm:mt-3.5" : "mt-6 sm:mt-7 space-y-2.5"}`}>
            {!productsOnlyMode && (
              <div className="pb-1">
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-[#7A2253] dark:text-pink-400" />
                    <h2
                      style={{
                        color: c.primaryText,
                        fontFamily: typ.headingFontFamily,
                      }}
                      className="text-base sm:text-lg font-black tracking-tight"
                    >
                      My Shop
                    </h2>
                  </div>

                  {/* Latest First Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsShopSortOpen(!isShopSortOpen)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition-all cursor-pointer shadow-2xs"
                    >
                      <span>
                        {shopSortOrder === "price_asc" ? "Price: Low to High" : shopSortOrder === "price_desc" ? "Price: High to Low" : "Latest First"}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                    </button>

                    {isShopSortOpen && (
                      <div className="absolute right-0 top-full mt-1.5 z-30 min-w-[150px] rounded-xl border border-slate-100 dark:border-white/10 bg-white dark:bg-zinc-900 p-1 shadow-lg animate-in fade-in zoom-in-95">
                        <button
                          type="button"
                          onClick={() => { setShopSortOrder("latest"); setIsShopSortOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold ${shopSortOrder === "latest" ? "bg-pink-50 text-[#7A2253] dark:bg-pink-950/40 dark:text-pink-300" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"}`}
                        >
                          Latest First
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShopSortOrder("price_asc"); setIsShopSortOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold ${shopSortOrder === "price_asc" ? "bg-pink-50 text-[#7A2253] dark:bg-pink-950/40 dark:text-pink-300" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"}`}
                        >
                          Price: Low to High
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShopSortOrder("price_desc"); setIsShopSortOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold ${shopSortOrder === "price_desc" ? "bg-pink-50 text-[#7A2253] dark:bg-pink-950/40 dark:text-pink-300" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"}`}
                        >
                          Price: High to Low
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p
                  style={{ color: c.secondaryText }}
                  className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-normal px-0.5 mt-1"
                >
                  Handpicked gear, creative tools &amp; daily essentials I personally use and recommend.
                </p>
              </div>
            )}

            {products.length === 0 ? (
              <div
                style={{
                  backgroundColor: c.elevatedBackground,
                  borderColor: c.border,
                }}
                className="rounded-[12px] border p-3.5 sm:p-4 text-center space-y-0.5"
              >
                <p style={{ color: c.primaryText }} className="text-xs sm:text-sm font-semibold">
                  No products yet
                </p>
                <p style={{ color: c.mutedText }} className="text-[11px] sm:text-xs">
                  Curated recommendations and products will appear here once added.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-2">
                {sortedProducts.map((product: CreatorProduct) => (
                  <article
                    key={product.id}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-zinc-900 p-2.5 shadow-2xs hover:shadow-md transition-all duration-200"
                  >
                    <div className="w-full">
                      {/* Image Container */}
                      <button
                        type="button"
                        onClick={() => setSelectedProductForZoom(product)}
                        className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 cursor-zoom-in block"
                        title={`Click to zoom ${product.name}`}
                        aria-label={`View full image for ${product.name}`}
                      >
                        <ProductImage
                          src={product.imageUrl}
                          name={product.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </button>

                      {/* Title */}
                      <h3
                        className="mt-2 text-[11px] sm:text-[12px] font-bold text-slate-900 dark:text-white line-clamp-1 leading-tight tracking-tight"
                        title={product.name}
                      >
                        {product.name}
                      </h3>

                      {/* Price in Plum */}
                      {product.pricePaise !== null && (
                        <p className="mt-0.5 text-[11px] sm:text-xs font-extrabold text-[#7A2253] dark:text-pink-400 tabular-nums">
                          {formatProductPrice(product.pricePaise)}
                        </p>
                      )}
                    </div>

                    {/* Solid Plum CTA Button */}
                    <div className="pt-2 w-full">
                      <a
                        href={product.productUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        onClick={(e) => {
                          if (isInformationalMode) {
                            e.preventDefault();
                            showToast(`Opens ${product.name} external product page ✨`);
                          }
                        }}
                        className="tap-scale w-full py-1.5 sm:py-2 px-2.5 rounded-xl bg-[#7A2253] hover:bg-[#681c46] text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
                      >
                        <span>View Product</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {!productsOnlyMode && allProductsHref && products.length > 0 && (
              <div className="pt-3 w-full">
                <button
                  type="button"
                  onPointerEnter={() => {
                    if (allProductsHref && !isInformationalMode) {
                      router.prefetch(allProductsHref);
                    }
                  }}
                  onClick={() => {
                    if (isInformationalMode) {
                      showToast("Opens all creator products on live profile ✨");
                      return;
                    }
                    router.push(allProductsHref);
                  }}
                  className="tap-scale w-full py-2.5 sm:py-3 px-4 rounded-full bg-pink-50 dark:bg-pink-950/40 border border-pink-100 dark:border-pink-900/50 text-[#7A2253] dark:text-pink-300 font-bold text-xs sm:text-[13px] flex items-center justify-center gap-2 hover:bg-pink-100 dark:hover:bg-pink-950/60 transition-all cursor-pointer shadow-2xs"
                >
                  <span>View All Products</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            )}

            {/* Affiliate Disclaimer: At bottom on dedicated product listing page */}
            {products && products.length > 0 && productsOnlyMode && (
              <p className="text-center text-[10px] sm:text-[10.5px] pt-2 pb-1 opacity-70" style={{ color: c.mutedText }}>
                Some links may be affiliate links.
              </p>
            )}
          </section>
        )}

        {/* 5. Creator Team */}
        {!isListingPage && (!isTabsLayout ? true : activeNavTab === "work") && activeTeamMembers.length > 0 && (
          <div id="team-section" className={`relative z-10 order-[20] w-full text-left animate-fade-in ${isTabsLayout ? "mt-3 sm:mt-3.5 space-y-2" : "mt-6 sm:mt-7 space-y-2.5"}`}>
            <div>
              <div className="flex items-center justify-between gap-3 px-0.5">
                <h2
                  style={{
                    color: c.primaryText,
                    fontFamily: typ.headingFontFamily,
                    fontWeight: 700,
                  }}
                  className={`flex items-center gap-1.5 ${PUBLIC_TYPE.sectionTitle}`}
                >
                  <Users className="h-3.5 w-3.5 opacity-70" style={{ color: c.primaryText }} />
                  <span>{teamData.team?.teamName || "My Team"}</span>
                </h2>
                <span
                  style={{ color: c.mutedText }}
                  className="text-[11px] sm:text-xs font-medium"
                >
                  {activeTeamMembers.length} {activeTeamMembers.length === 1 ? "member" : "members"}
                </span>
              </div>
              <p
                style={{ color: c.secondaryText }}
                className="text-[11px] sm:text-xs font-normal px-0.5 mt-0.5 pb-2"
              >
                Creative production crew, editors &amp; management team.
              </p>
              <div style={{ backgroundColor: c.divider }} className="-mx-3.5 sm:-mx-5 h-px opacity-60" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              {activeTeamMembers.map((member) => {
                const memberLinks = [
                  { url: member.instagramUrl, icon: <InstagramIcon className="h-3.5 w-3.5 text-pink-500" />, label: "Instagram" },
                  { url: member.youtubeUrl, icon: <YoutubeIcon className="h-3.5 w-3.5 text-red-500" />, label: "YouTube" },
                  { url: member.facebookUrl, icon: <FacebookIcon className="h-3.5 w-3.5 text-blue-500" />, label: "Facebook" },
                ].filter((item) => item.url);

                return (
                  <div
                    key={member.id}
                    style={{
                      backgroundColor: c.cardBackground,
                      borderColor: c.border,
                      boxShadow: eff.cardShadow,
                    }}
                    className="rounded-[12px] border p-2.5 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <CreatorAvatar
                        src={member.avatarUrl || null}
                        name={member.name || "Team"}
                        className="h-10 w-10 shrink-0 rounded-[10px] object-cover"
                        fallbackBgClass="bg-[#7A2253]"
                        textClassName="text-xs font-black tracking-tight text-white"
                        style={{ backgroundColor: c.accent }}
                      />

                      <div className="min-w-0 flex-1">
                        <p
                          style={{ color: c.primaryText }}
                          className="truncate text-xs sm:text-[13px] font-bold leading-tight"
                        >
                          {member.name}
                        </p>
                        <p
                          style={{ color: c.secondaryText }}
                          className="mt-0.5 truncate text-[11px] font-medium"
                        >
                          {member.role || "Team member"}
                        </p>
                      </div>

                      {memberLinks.length > 0 && (
                        <div className="flex shrink-0 items-center gap-1.5">
                          {memberLinks.map((link) => (
                            <a
                              key={link.label}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${member.name} ${link.label}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isInformationalMode) e.preventDefault();
                              }}
                              style={{ borderColor: c.border, backgroundColor: c.profileBackground }}
                              className="tap-scale flex h-8 w-8 items-center justify-center rounded-[8px] border transition-all hover:scale-105"
                            >
                              {link.icon}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. Work with Me Section (Only shown if WhatsApp or Email is available) */}
        {!isListingPage && (!isTabsLayout || activeNavTab === "work") && (() => {
          if (effectiveVisibilitySettings.showCollabGigs === false) return null;

          const whatsappNum = mediaKitSettings?.whatsappNumber?.trim() || (profile as any).whatsappNumber?.trim() || "";
          const hasWhatsApp = Boolean(whatsappNum);

          const contactEmail = mediaKitSettings?.sponsorEmail?.trim() || profile.email?.trim() || "";
          const hasEmail = Boolean(contactEmail);
          const activePackages = mediaKitPackages.filter((p) => p.isActive);

          if (!hasWhatsApp && !hasEmail && activePackages.length === 0) return null;

          return (
            <div id="work-with-me-section" className={`relative z-10 order-[40] w-full text-left animate-fade-in ${isTabsLayout ? "mt-3 sm:mt-3.5 space-y-3.5" : "mt-6 sm:mt-7 space-y-4"}`}>
              {/* Work Header with Shopping Bag Icon and Title */}
              <div className="flex items-center gap-3 px-0.5">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-pink-50/80 dark:bg-white/[0.05] border border-pink-200/60 dark:border-white/10 text-[#7A2253] dark:text-pink-400">
                  <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2
                    style={{
                      color: c.primaryText || "#111827",
                      fontFamily: typ.headingFontFamily,
                      fontWeight: 700,
                    }}
                    className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
                  >
                    Work
                  </h2>
                  <p
                    style={{ color: c.secondaryText || "#6B7280" }}
                    className="text-xs sm:text-[13px] font-normal mt-0.5 text-gray-500 dark:text-gray-400"
                  >
                    Collaboration packages and services to work with me.
                  </p>
                </div>
              </div>

              {/* Collaboration Packages Listing */}
              {activePackages.length > 0 && (
                <div className="space-y-3 sm:space-y-3.5 pt-1">
                  {activePackages.map((pkg) => {
                    const rawPrice = pkg.price?.trim() || "";
                    const displayPrice = rawPrice.startsWith("₹") ? rawPrice : `₹${rawPrice}`;
                    const isMostPopular = Boolean(pkg.isPopular || pkg.badge === "Most Popular");
                    const turnaround = pkg.turnaroundDays ? `${pkg.turnaroundDays} Days` : null;
                    const platformName = pkg.platform || "Instagram Reel";
                    const isInstagram = platformName.toLowerCase().includes("instagram") || platformName.toLowerCase().includes("reel") || platformName.toLowerCase().includes("story");
                    const isYoutube = platformName.toLowerCase().includes("youtube");
                    const defaultUnit = platformName.toLowerCase().includes("video") ? "per video" : platformName.toLowerCase().includes("story") ? "per bundle" : platformName.toLowerCase().includes("visit") ? "per visit" : "per reel";
                    const priceUnit = pkg.priceUnit || defaultUnit;

                    return (
                      <div
                        key={pkg.id}
                        style={{
                          backgroundColor: usesDarkControls ? "#1F1F23" : "#FFFFFF",
                          borderColor: usesDarkControls ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
                        }}
                        className="rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-stretch justify-between gap-4 transition-all hover:border-black/20 dark:hover:border-white/20 hover:shadow-xs group"
                      >
                        {/* Left Details */}
                        <div className="min-w-0 flex-1 flex flex-col justify-between space-y-2.5">
                          <div>
                            {/* Most Popular Badge */}
                            {isMostPopular && (
                              <span className="inline-block bg-[#FDF2F8] text-[#9D174D] border border-[#FCE7F3] text-[10.5px] font-bold px-2.5 py-0.5 rounded-full mb-1.5">
                                Most Popular
                              </span>
                            )}

                            {/* Title */}
                            <h3
                              style={{ color: c.primaryText || "#111827" }}
                              className="text-base sm:text-[17px] font-bold tracking-tight leading-snug text-gray-900 dark:text-white"
                            >
                              {pkg.title}
                            </h3>

                            {/* Description */}
                            {pkg.description && (
                              <p
                                style={{ color: c.secondaryText || "#6B7280" }}
                                className="text-xs sm:text-[13px] font-normal leading-relaxed text-gray-500 dark:text-gray-400 mt-1"
                              >
                                {pkg.description}
                              </p>
                            )}
                          </div>

                          <div>
                            {/* Meta Chips (Delivery & Platform) */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {turnaround && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-2xs">
                                  <Clock className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                                  <span>{turnaround}</span>
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-2xs">
                                {isInstagram ? (
                                  <InstagramIcon className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                                ) : isYoutube ? (
                                  <YoutubeIcon className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                ) : (
                                  <Briefcase className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                )}
                                <span>{platformName}</span>
                              </span>
                            </div>

                            {/* Feature / Deliverables Tags */}
                            {pkg.deliverables && pkg.deliverables.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2">
                                {pkg.deliverables.map((deliv, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-white/[0.04] text-[11px] font-medium text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-white/[0.06]"
                                  >
                                    {deliv}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Pricing & Action Box */}
                        <div className="shrink-0 w-full sm:w-[155px] md:w-[165px] rounded-xl p-3.5 sm:p-4 bg-[#FDF2F8]/80 dark:bg-white/[0.05] border border-[#FCE7F3] dark:border-white/10 flex flex-col items-center justify-between text-center self-stretch">
                          <div>
                            <div className="text-xl sm:text-2xl font-black text-[#7A2253] dark:text-pink-400 tabular-nums tracking-tight">
                              {displayPrice}
                            </div>
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                              {priceUnit}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedGigForWhatsApp(pkg);
                              if (hasWhatsApp) {
                                setIsLeadModalOpen(true);
                              } else if (hasEmail) {
                                window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(`Collaboration Inquiry: ${pkg.title} (@${cleanHandle || "creator"})`)}`;
                              } else {
                                setIsCollabInquiryOpen(true);
                              }
                            }}
                            className="tap-scale flex items-center justify-center gap-1.5 w-full bg-[#7A2253] hover:bg-[#631B43] text-white text-xs font-bold py-2.5 px-3 rounded-xl mt-3 shadow-2xs transition-all cursor-pointer"
                          >
                            <span>Get This Package</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* 6. Reviews (Compact, only when reviews exist, or when reviewsOnlyMode is true) */}
        {(reviewsOnlyMode || (!isListingPage && (!isTabsLayout || activeNavTab === "reviews"))) && effectiveVisibilitySettings.showReviews !== false && (approvedReviews.length > 0 || reviewsOnlyMode) && (
          <div id="reviews-section" className={`relative z-10 order-[30] w-full text-left animate-fade-in ${reviewsOnlyMode ? "mt-1.5 sm:mt-2 space-y-2" : isTabsLayout ? "mt-3 sm:mt-3.5 space-y-2" : "mt-6 sm:mt-7 space-y-2.5"}`}>
            {!reviewsOnlyMode && (
              <div>
                <div className="flex items-center justify-between px-0.5">
                  <h2
                    style={{
                      color: c.primaryText,
                      fontFamily: typ.headingFontFamily,
                      fontWeight: 700,
                    }}
                    className={`flex items-center gap-1.5 ${PUBLIC_TYPE.sectionTitle}`}
                  >
                    <Star className="h-3.5 w-3.5 opacity-70" style={{ color: c.primaryText }} />
                    <span>Brand Endorsements &amp; Trust</span>
                  </h2>
                  {approvedReviews.length > 0 && (
                    <span
                      style={{ color: c.mutedText }}
                      className="text-[11px] sm:text-xs font-semibold"
                    >
                      {approvedReviews.length} {approvedReviews.length === 1 ? "Review" : "Reviews"}
                    </span>
                  )}
                </div>
                <p
                  style={{ color: c.secondaryText }}
                  className="text-[11px] sm:text-xs font-normal px-0.5 mt-0.5 pb-2"
                >
                  Verified feedback and testimonials from leading brands &amp; collaboration partners.
                </p>
                <div style={{ backgroundColor: c.divider }} className="-mx-3.5 sm:-mx-5 h-px opacity-60" aria-hidden="true" />
              </div>
            )}

            {approvedReviews.length === 0 ? (
              <div
                style={{
                  backgroundColor: c.elevatedBackground,
                  borderColor: c.border,
                }}
                className="rounded-[12px] border p-3.5 sm:p-4 text-center space-y-0.5"
              >
                <p
                  style={{ color: c.primaryText }}
                  className="text-xs sm:text-sm font-semibold"
                >
                  No reviews yet
                </p>
                <p
                  style={{ color: c.mutedText }}
                  className="text-[11px] sm:text-xs"
                >
                  Verified client and brand reviews will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {(typeof reviewsPreviewLimit === "number" ? approvedReviews.slice(0, reviewsPreviewLimit) : approvedReviews).map((rev) => {
                  const ratingNum = Number(rev.rating) || 5;
                  return (
                    <div
                      key={rev.id}
                      style={{
                        backgroundColor: usesDarkControls ? "#1F1F23" : "#FFFFFF",
                        borderColor: usesDarkControls ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
                      }}
                      className="rounded-[12px] border p-3 sm:p-3.5 space-y-2 text-left transition-all hover:border-black/20 dark:hover:border-white/20 hover:shadow-xs"
                    >
                      {/* Top Row: Client Avatar + Name & Verified Badge + Stars */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-7 w-7 rounded-full bg-[#7A2253]/10 text-[#7A2253] dark:text-rose-400 font-black text-xs flex items-center justify-center shrink-0">
                            {rev.clientName ? rev.clientName.charAt(0) : "B"}
                          </div>
                          <div className="min-w-0">
                            <p style={{ color: c.primaryText }} className="text-xs font-bold truncate flex items-center gap-1">
                              <span>{rev.clientName}</span>
                              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                            </p>
                            {rev.projectTitle && (
                              <p style={{ color: c.mutedText }} className="text-[10px] font-medium truncate">
                                {rev.projectTitle}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${i < ratingNum ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Comment */}
                      {rev.comment && (
                        <p
                          style={{ color: c.secondaryText }}
                          className="text-xs leading-relaxed font-normal italic pt-0.5"
                        >
                          &ldquo;{rev.comment.trim()}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!reviewsOnlyMode && allReviewsHref && approvedReviews.length > 0 && (
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    if (isInformationalMode) {
                      showToast("Opens all creator reviews on live profile ✨");
                      return;
                    }
                    router.push(allReviewsHref);
                  }}
                  style={{ color: c.accentText }}
                  className="group inline-flex items-center justify-center gap-1.5 py-1 px-2 text-xs sm:text-[13px] font-bold transition-all hover:opacity-80 cursor-pointer"
                >
                  <span>View all reviews</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* 7. Setup & Gear Section */}
        {!isListingPage && (!isTabsLayout || activeNavTab === "setup") && setupList && setupList.filter((it) => it.isActive !== false).length > 0 && (
          <div id="setup-section" className={`relative z-10 order-[45] w-full text-left animate-fade-in ${isTabsLayout ? "mt-3 sm:mt-3.5 space-y-2" : "mt-6 sm:mt-7 space-y-2.5"}`}>
            <div>
              <div className="flex items-center justify-between px-0.5">
                <h2
                  style={{
                    color: c.primaryText,
                    fontFamily: typ.headingFontFamily,
                    fontWeight: 700,
                  }}
                  className={`flex items-center gap-1.5 ${PUBLIC_TYPE.sectionTitle}`}
                >
                  <Laptop className="h-3.5 w-3.5 opacity-70" style={{ color: c.primaryText }} />
                  <span>Studio Rig &amp; Creative Setup</span>
                </h2>
                <span
                  style={{ color: c.mutedText }}
                  className="text-[11px] sm:text-xs font-semibold"
                >
                  {setupList.filter((it) => it.isActive !== false).length} Items
                </span>
              </div>
              <p
                style={{ color: c.secondaryText }}
                className="text-[11px] sm:text-xs font-normal px-0.5 mt-0.5 pb-2"
              >
                The exact hardware, cameras &amp; workstation gear behind my content creation.
              </p>
              <div style={{ backgroundColor: c.divider }} className="-mx-3.5 sm:-mx-5 h-px opacity-60" aria-hidden="true" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {setupList
                .filter((it) => it.isActive !== false)
                .map((item) => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: usesDarkControls ? "#1F1F23" : "#FFFFFF",
                      borderColor: usesDarkControls ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
                    }}
                    className="rounded-[12px] border p-2.5 flex flex-col justify-between space-y-1.5 transition-all hover:border-black/20 dark:hover:border-white/20 hover:shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <span
                          style={{
                            backgroundColor: usesDarkControls ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
                            color: c.secondaryText,
                          }}
                          className="rounded-md px-1.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider"
                        >
                          {item.category}
                        </span>
                        {item.brand && (
                          <span
                            style={{ color: c.mutedText }}
                            className="text-[10px] sm:text-[11px] font-semibold truncate"
                          >
                            {item.brand}
                          </span>
                        )}
                      </div>

                      <h4
                        style={{ color: c.primaryText }}
                        className={`line-clamp-2 break-words ${PUBLIC_TYPE.cardTitle}`}
                        title={item.name}
                      >
                        {item.name}
                      </h4>

                      {item.modelOrPlan && (
                        <p
                          style={{ color: c.secondaryText }}
                          className="text-[10.5px] truncate mt-0.5"
                        >
                          {item.modelOrPlan}
                        </p>
                      )}

                      {item.usedFor && (
                        <p
                          style={{ color: c.secondaryText }}
                          className="text-[10.5px] line-clamp-2 mt-1 opacity-90"
                        >
                          <span className="font-semibold">Used for: </span>
                          {item.usedFor}
                        </p>
                      )}
                    </div>

                    {item.linkUrl && (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => { if (isInformationalMode) e.preventDefault(); }}
                        style={{ color: c.accentText }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold pt-0.5 transition-opacity hover:opacity-80"
                      >
                        <span>View Gear</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {!containedScroll && !isPublicSurface && !hideFooter && (
          <div className="relative z-10 order-[60] mt-6 mb-3 flex items-center justify-center select-none">
            <MadeWithInflixo
              color={c.secondaryText}
              backgroundColor={c.accentSoft}
              borderColor={c.accentBorder}
              disabled={isInformationalMode}
            />
          </div>
        )}
        {containedScroll && <div className="order-[70] h-6 sm:h-8 shrink-0" aria-hidden="true" />}
      </div>

      {containedScroll && (
        <div
          className={`relative z-30 shrink-0 select-none ${isPublicSurface ? "-mx-3.5 -mb-3.5 sm:-mx-5 sm:-mb-4" : "-mx-3.5 -mb-5 sm:-mx-7 sm:-mb-7"}`}
        >
          <div
            style={{ backgroundColor: c.divider }}
            className="h-px w-full"
            aria-hidden="true"
          />
          <div className="flex items-center justify-center pt-2.5 pb-2.5">
            <MadeWithInflixo
              color={c.secondaryText}
              backgroundColor={c.accentSoft}
              borderColor={c.accentBorder}
              disabled={isInformationalMode}
            />
          </div>
        </div>
      )}

      {showMoveToTop && (
        <button
          type="button"
          onClick={handleMoveToTop}
          style={{
            backgroundColor: c.accent,
            color: "#FFFFFF",
            boxShadow: eff.shadow,
          }}
          className="tap-scale fixed bottom-6 right-5 sm:bottom-20 sm:right-6 z-40 inline-flex h-11 w-11 sm:h-11 sm:w-11 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 cursor-pointer"
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <ChevronUp className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.5]" />
        </button>
      )}
    </div>
  );

  return (
    <div className={`relative w-full mx-auto flex-1 min-h-0 h-full max-h-full flex flex-col transition-all ${isFull ? "max-w-[580px]" : "max-w-[560px]"}`}>
      {cardContent}

      {/* Collaboration Inquiry Modal */}
      <CollaborationInquiryModal
        isOpen={isCollabInquiryOpen}
        onClose={() => setIsCollabInquiryOpen(false)}
        creatorId={profile.id || profile.username || "creator"}
        creatorEmail={profile.email}
        creatorName={profile.displayName || "Creator"}
        creatorUsername={profile.username || "creator"}
        packages={mediaKitPackages}
      />

      {/* Brand Lead Qualifier Anti-Spam Modal */}
      <BrandLeadQualifierModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        creatorName={profile.displayName || "Creator"}
        creatorUsername={profile.username || "creator"}
        whatsappNumber={mediaKitSettings?.whatsappNumber || (profile as any)?.whatsappNumber || ""}
        packageName={selectedGigForWhatsApp?.title}
        packagePrice={selectedGigForWhatsApp?.price}
        deliverableText={selectedGigForWhatsApp?.deliverables?.join(", ")}
      />

      {/* Episode Quick Drawer */}
      <EpisodeQuickDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        series={drawerSeries}
        themeKey={themeKey}
      />

      {/* Page Display Settings Modal */}
      <VisibilitySettingsModal
        isOpen={isVisibilityModalOpen}
        onClose={() => setIsVisibilityModalOpen(false)}
        settings={visibilitySettings}
        onSave={handleSaveVisibilitySettings}
      />

      {/* Product Image Fullscreen Zoom Lightbox Modal */}
      <ProductImageLightbox
        product={selectedProductForZoom}
        isOpen={Boolean(selectedProductForZoom)}
        onClose={() => setSelectedProductForZoom(null)}
        isInformationalMode={isInformationalMode}
        onExternalClick={(name) => showToast(`Opens ${name} external product page ✨`)}
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
      badgeClass: "bg-[#FF0000] text-white shadow-2xs",
      chipClass: "bg-red-50 text-red-700 border-red-200/80",
      textColor: "text-[#FF0000]",
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
      badgeClass: "bg-[#1877F2] text-white shadow-2xs",
      chipClass: "bg-blue-50 text-blue-700 border-blue-200/80",
      textColor: "text-[#1877F2]",
    };
  }
  return {
    name: platformStr || "Web",
    icon: <Film className="h-3 w-3 text-white" />,
    badgeClass: "bg-[#7A2253] text-white shadow-2xs",
    chipClass: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    textColor: "text-[#7A2253]",
  };
}

export function PreviewSeriesItem({
  series,
  style,
  themeKey = "minimal-white",
  username,
  expanded = false,
  onToggle,
  onSelectSeries,
  onShareSeries,
  isOnboarding = false,
  isInformational = false,
}: {
  series: Series;
  style: any;
  themeKey?: ThemeKey;
  username?: string;
  expanded?: boolean;
  onToggle?: () => void;
  onSelectSeries?: (series: Series) => void;
  onShareSeries?: (series: Series) => void;
  isOnboarding?: boolean;
  isInformational?: boolean;
}) {
  const themeMeta = ThemeService.getThemeMeta(themeKey);
  const c = themeMeta.colors;

  const allEpisodes = getSeriesEpisodes(series);
  const epCount = allEpisodes.length;
  const epCountStr = `${epCount} ${epCount === 1 ? "Episode" : "Episodes"}`;

  // Robust platform detection from series.platform OR first episode URL
  const firstEpUrl = allEpisodes[0]?.externalUrl || "";
  const detectedPlatform = (() => {
    const p = (series.platform || "").toLowerCase();
    const u = (firstEpUrl || "").toLowerCase();

    if (p.includes("youtube") || u.includes("youtube.com") || u.includes("youtu.be")) return "YouTube";
    if (p.includes("instagram") || u.includes("instagram.com")) return "Instagram";
    if (p.includes("facebook") || u.includes("facebook.com")) return "Facebook";
    if (p.includes("twitter") || p.includes("x.com") || u.includes("twitter.com") || u.includes("x.com")) return "X";
    if (p.includes("linkedin") || u.includes("linkedin.com")) return "LinkedIn";
    if (p.includes("threads") || u.includes("threads.net")) return "Threads";
    if (p.includes("snapchat") || u.includes("snapchat.com")) return "Snapchat";
    if (p.includes("spotify") || u.includes("spotify.com")) return "Spotify";
    if (p.includes("twitch") || u.includes("twitch.tv")) return "Twitch";
    if (series.platform && series.platform.trim()) return series.platform.trim();
    return null;
  })();

  const genresList = series.genre
    ? series.genre
      .split(/[,•|/]/)
      .map((g) => g.trim().replace(/^Genre:\s*/i, ""))
      .filter(Boolean)
    : [];

  const subtitleParts: string[] = [epCountStr];
  if (detectedPlatform) subtitleParts.push(detectedPlatform);
  const subtitleStr = subtitleParts.join(" • ");

  return (
    <div
      id={`series-${series.id}`}
      onClick={() => (onSelectSeries ? onSelectSeries(series) : onToggle ? onToggle() : null)}
      className="px-3.5 py-2.5 sm:py-3 transition-colors flex items-center justify-between hover:bg-[var(--theme-accent-soft)] group cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${detectedPlatform === "YouTube"
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
                        ? "bg-amber-400 shadow-xs text-slate-950"
                        : detectedPlatform === "Spotify"
                          ? "bg-emerald-600 shadow-xs text-white"
                          : detectedPlatform === "Twitch"
                            ? "bg-purple-600 shadow-xs text-white"
                            : "bg-[#7A225314] text-[#7A2253]"
            }`}
        >
          {detectedPlatform === "YouTube" ? (
            <YoutubeIcon className="h-4 w-4 text-white" />
          ) : detectedPlatform === "Instagram" ? (
            <InstagramIcon className="h-4 w-4 text-white" />
          ) : detectedPlatform === "Facebook" ? (
            <FacebookIcon className="h-4 w-4 text-white" />
          ) : detectedPlatform === "X" ? (
            <XTwitterIcon className="h-3.5 w-3.5 text-white" />
          ) : detectedPlatform === "LinkedIn" ? (
            <LinkedinIcon className="h-3.5 w-3.5 text-white" />
          ) : detectedPlatform === "Threads" ? (
            <ThreadsIcon className="h-3.5 w-3.5 text-white" />
          ) : detectedPlatform === "Snapchat" ? (
            <SnapchatIcon className="h-4 w-4 text-slate-950" />
          ) : detectedPlatform === "Spotify" ? (
            <SpotifyIcon className="h-4 w-4 text-white" />
          ) : detectedPlatform === "Twitch" ? (
            <TwitchIcon className="h-4 w-4 text-white" />
          ) : (
            <span className="text-[11px] sm:text-xs font-bold tracking-tight select-none">
              {getInitials(series.title)}
            </span>
          )}
        </span>
        <div className="min-w-0 text-left space-y-0">
          <p style={{ color: c.primaryText }} className="truncate text-xs sm:text-[13px] font-bold leading-snug">
            {series.title}
          </p>
          {genresList.length > 0 && (
            <p style={{ color: c.mutedText }} className="truncate text-[11px] font-medium leading-snug">
              {genresList.slice(0, 3).join(" • ")}
            </p>
          )}
          <p style={{ color: c.mutedText }} className="truncate text-[11px] font-medium leading-snug opacity-70">
            {subtitleStr}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <ChevronRight
          style={{ color: c.secondaryText }}
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
        />
      </div>
    </div>
  );
}
