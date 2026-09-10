"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Sparkles,
  ExternalLink,
  Film,
  Share2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Copy,
  Eye,
  Briefcase,
  Clock,
  CheckCircle2,
  Check,
  MapPin,
  MessageCircle,
  Mail,
  Link as LinkIcon,
  ArrowRight,
  ArrowLeft,
  Star,
  Settings,
  Globe,
  Handshake,
  Award,
  Building2,
  UserCheck,
  Send,
  AtSign,
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
} from "@/components/shared/BrandIcons";
import { InflixoLogoIcon } from "@/components/shared/Logo";
import { useToast } from "@/contexts/ToastContext";
import { ShareSeriesModal } from "@/components/shared/ShareSeriesModal";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { SeriesPoster } from "@/components/shared/SeriesPoster";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { FocusOverlay } from "@/components/theme/FocusOverlay";
import { BrandLeadQualifierModal } from "@/components/mediakit/BrandLeadQualifierModal";
import { CollaborationInquiryModal } from "@/components/mediakit/CollaborationInquiryModal";
import { EpisodeQuickDrawer } from "@/components/series/EpisodeQuickDrawer";
import { VisibilitySettingsModal } from "@/components/shared/VisibilitySettingsModal";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { getInitials } from "@/lib/avatar";

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

const SIGNATURE_PURPLE_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-b from-[#FAF5FF] via-[#FDFBFE] to-[#F8F2F7] border border-[#3a2447]/18 text-slate-900 shadow-lg",
  profBadgeBg: "bg-white/80 backdrop-blur-md",
  profBadgeText: "text-[#3a2447]",
  profBadgeBorder: "border-[#3a2447]/18",
  fanbaseBg: "bg-white/80 backdrop-blur-md",
  fanbaseText: "text-[#17131A]",
  socialItemBg: "bg-white/80 hover:bg-white/95 backdrop-blur-md",
  socialItemBorder: "border-[#3a2447]/18 hover:border-[#3a2447]/30",
  socialNameColor: "text-[#17131A]",
  socialUnitColor: "text-[#6F6872]",
  nameColor: "text-[#17131A]",
  bioColor: "text-[#6F6872]",
  handleColor: "text-[#3a2447]",
};

const MIDNIGHT_DARK_STYLE: ThemeStyleConfig = {
  cardBg: "bg-[#0D1424] text-[#F8FAFC] border border-white/[0.14] shadow-2xl",
  profBadgeBg: "bg-[#111B2D]",
  profBadgeText: "text-[#F8FAFC]",
  profBadgeBorder: "border-white/[0.14]",
  fanbaseBg: "bg-[#111B2D]",
  fanbaseText: "text-[#F8FAFC]",
  socialItemBg: "bg-[#111B2D] hover:bg-[#162238]",
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
  socialItemBg: "bg-[#25173B]/80 hover:bg-[#32204D]/90 backdrop-blur-md",
  socialItemBorder: "border-purple-400/20 hover:border-purple-400/40",
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
  socialItemBg: "bg-[#0F1E33]/80 hover:bg-[#162D4C]/90 backdrop-blur-md",
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
  socialItemBg: "bg-[#361928]/80 hover:bg-[#482236]/90 backdrop-blur-md",
  socialItemBorder: "border-rose-300/20 hover:border-rose-300/40",
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
  socialItemBg: "bg-[#102B4E]/80 hover:bg-[#183B68]/90 backdrop-blur-md",
  socialItemBorder: "border-blue-400/20 hover:border-blue-400/40",
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
  socialItemBg: "bg-[#381827]/80 hover:bg-[#4B2236]/90 backdrop-blur-md",
  socialItemBorder: "border-amber-400/20 hover:border-amber-400/40",
  socialNameColor: "text-[#FFFBEB]",
  socialUnitColor: "text-[#FDE68A]",
  nameColor: "text-[#FFFBEB]",
  bioColor: "text-[#FDE68A]",
  handleColor: "text-[#F59E0B]",
};

const MINIMAL_SPARK_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-b from-white to-[#FAF8FA] text-[#17131A] border border-[#3a2447]/16 shadow-2xs",
  profBadgeBg: "bg-white/90",
  profBadgeText: "text-[#3a2447]",
  profBadgeBorder: "border-[#3a2447]/20",
  fanbaseBg: "bg-white/90 backdrop-blur-md",
  fanbaseText: "text-[#17131A]",
  socialItemBg: "bg-white/80 hover:bg-white/95 backdrop-blur-md",
  socialItemBorder: "border-[#3a2447]/16 hover:border-[#3a2447]/30",
  socialNameColor: "text-[#17131A]",
  socialUnitColor: "text-[#6F6872]",
  nameColor: "text-[#17131A]",
  bioColor: "text-[#6F6872]",
  handleColor: "text-[#3a2447]",
};

const NEON_GRID_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-b from-[#090D1E] to-[#060917] text-[#F8FAFC] border border-cyan-400/25 shadow-2xl",
  profBadgeBg: "bg-[#090D1E]",
  profBadgeText: "text-[#06B6D4]",
  profBadgeBorder: "border-cyan-400/30",
  fanbaseBg: "bg-[#0E162C]/85 backdrop-blur-md",
  fanbaseText: "text-[#F8FAFC]",
  socialItemBg: "bg-[#0E162C]/80 hover:bg-[#162244]/90 backdrop-blur-md",
  socialItemBorder: "border-cyan-400/22 hover:border-cyan-400/45",
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
  socialItemBg: "bg-[#0F2638]/80 hover:bg-[#15344C]/90 backdrop-blur-md",
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
  socialItemBg: "bg-white/80 hover:bg-white/95 backdrop-blur-md",
  socialItemBorder: "border-[#E5E0D8] hover:border-[#E05D44]/35",
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
  socialItemBg: "bg-[#1C1F26]/80 hover:bg-[#282C36]/90 backdrop-blur-md",
  socialItemBorder: "border-amber-400/20 hover:border-amber-400/45",
  socialNameColor: "text-[#FAF8F5]",
  socialUnitColor: "text-[#C7CAD1]",
  nameColor: "text-[#FAF8F5]",
  bioColor: "text-[#C7CAD1]",
  handleColor: "text-[#E5A93C]",
};

const CREATIVE_PAPER_STYLE: ThemeStyleConfig = {
  cardBg: "bg-gradient-to-b from-[#FAF6F0] to-[#EDE5DB] text-[#29221D] border border-[#E3D9CC] shadow-xl",
  profBadgeBg: "bg-white/90",
  profBadgeText: "text-[#3a2447]",
  profBadgeBorder: "border-[#E3D9CC]",
  fanbaseBg: "bg-white/90 backdrop-blur-md",
  fanbaseText: "text-[#29221D]",
  socialItemBg: "bg-white/80 hover:bg-white/95 backdrop-blur-md",
  socialItemBorder: "border-[#E3D9CC] hover:border-[#3a2447]/35",
  socialNameColor: "text-[#29221D]",
  socialUnitColor: "text-[#6A5E57]",
  nameColor: "text-[#29221D]",
  bioColor: "text-[#6A5E57]",
  handleColor: "text-[#3a2447]",
};

export const THEME_STYLES: Record<string, ThemeStyleConfig> = {
  "minimal-white": MINIMAL_WHITE_STYLE,
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

export function formatCategoryDots(category?: string | null, customCategory?: string | null): string {
  const raw = (category || customCategory || "").trim();
  if (!raw) return "";
  if (raw.includes("·")) return raw;
  return raw
    .split(/[,/|&]+/)
    .map((s) => s.trim().replace(/^Genre:\s*/i, ""))
    .filter(Boolean)
    .join(" · ");
}

export interface LivePreviewCardProps {
  profile: CreatorProfile;
  socials: SocialAccounts;
  series?: Series[];
  customLinks?: CustomLink[];
  mediaKitPackages?: MediaKitPackage[];
  mediaKitSettings?: MediaKitSettings;
  reviews?: CreatorReview[];
  team?: { team?: CreatorTeam | null; members: TeamMember[] };
  brands?: CreatorBrand[];
  collaborations?: CreatorCollaboration[];
  otherSocials?: OtherSocialAccount[];
  sections?: CreatorProfileSection[];
  totalAudience?: number;
  themeKey?: ThemeKey;
  compact?: boolean;
  variant?: "compact" | "full";
  cardPadding?: string;
  showSettingsIcon?: boolean;
  onShare?: () => void;
  isInformational?: boolean;
  isOnboarding?: boolean;
  isFinishStep?: boolean;
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
  "midnight",
  "cosmic-purple",
  "aurora-night",
  "rose-glow",
  "ocean-motion",
  "sunset-studio",
]);

const EMPTY_PROFILE_FALLBACK: CreatorProfile = {
  photoDataUrl: null,
  displayName: "",
  username: "",
  category: null,
  bio: "",
  updatedAt: new Date().toISOString(),
};

export function isDarkTheme(themeKey: string = "minimal-white"): boolean {
  return DARK_THEME_KEYS.has(themeKey);
}

export function LivePreviewCard({
  profile: incomingProfile,
  socials: incomingSocials,
  series: incomingSeries = [],
  customLinks: passedCustomLinks,
  mediaKitPackages: passedMediaKitPackages,
  mediaKitSettings: passedMediaKitSettings,
  reviews: passedReviews,
  team: passedTeam,
  brands: passedBrands,
  collaborations: passedCollaborations,
  otherSocials: passedOtherSocials,
  sections: passedSections,
  totalAudience: passedTotalAudience,
  themeKey = "minimal-white",
  compact = false,
  variant,
  cardPadding,
  showSettingsIcon: showSettingsIconProp,
  onShare,
  isInformational: isInformationalProp,
  isOnboarding: isOnboardingProp,
  isFinishStep: isFinishStepProp,
}: LivePreviewCardProps) {
  const profile: CreatorProfile = incomingProfile || EMPTY_PROFILE_FALLBACK;
  const socials: SocialAccounts = incomingSocials || EMPTY_SOCIAL_ACCOUNTS;
  const series: Series[] = incomingSeries || [];

  const { showToast } = useToast();
  const [expandedSeriesMap, setExpandedSeriesMap] = useState<Record<string, boolean>>(() => {
    return series && series.length > 0 ? { [series[0].id]: true } : {};
  });

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
  const [activeContentTab, setActiveContentTab] = useState<"series" | "gigs" | "reviews">("series");
  const [approvedReviews, setApprovedReviews] = useState<CreatorReview[]>(passedReviews || []);
  const [teamData, setTeamData] = useState<{ team?: CreatorTeam | null; members: TeamMember[] }>(
    passedTeam || { members: [] }
  );
  const [brandsList, setBrandsList] = useState<CreatorBrand[]>(passedBrands || []);
  const [collaborationsList, setCollaborationsList] = useState<CreatorCollaboration[]>(passedCollaborations || []);
  const [otherSocialsList, setOtherSocialsList] = useState<OtherSocialAccount[]>(passedOtherSocials || []);
  const [sectionsList, setSectionsList] = useState<CreatorProfileSection[]>(passedSections || DEFAULT_PROFILE_SECTIONS);
  const [isCollabInquiryOpen, setIsCollabInquiryOpen] = useState(false);
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
          const res = await fetch(
            `/api/creator/reviews?email=${encodeURIComponent(email)}&username=${encodeURIComponent(username)}&status=approved`
          ).then((r) => r.json());

          if (res && res.success && Array.isArray(res.reviews)) {
            setApprovedReviews(res.reviews);
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
  const [customLinksList, setCustomLinksList] = useState<CustomLink[]>(passedCustomLinks || []);
  const [selectedGigForWhatsApp, setSelectedGigForWhatsApp] = useState<MediaKitPackage | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [drawerSeries, setDrawerSeries] = useState<Series | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAllGigs, setShowAllGigs] = useState(false);

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
    if (safeProfile.visibilitySettings) return safeProfile.visibilitySettings;
    return storage.get<VisibilitySettings>(STORAGE_KEYS.visibilitySettings, DEFAULT_VISIBILITY_SETTINGS);
  });
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);

  useEffect(() => {
    if (safeProfile.visibilitySettings) {
      setVisibilitySettings(safeProfile.visibilitySettings);
    }
  }, [safeProfile.visibilitySettings]);


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

  useEffect(() => {
    if (passedCustomLinks) {
      setCustomLinksList(passedCustomLinks);
    } else {
      setCustomLinksList(customLinksRepository.get());
    }
  }, [passedCustomLinks]);

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
  ].filter((item) => item.visible && (item.hasAccount || item.count > 0 || (item.url && item.url !== "#")));


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

  const isFull = variant === "full";
  const bleedMargins = isFull ? "-mx-5 -mt-5 sm:-mx-8 sm:-mt-8" : "-mx-4 -mt-4 sm:-mx-6 sm:-mt-6";
  const bleedRadius = isFull ? "rounded-t-3xl" : "rounded-t-[28px]";

  const themeCssVars = getThemeCssVariables(themeMeta);
  const c = themeMeta.colors;
  const typ = themeMeta.typography;
  const eff = themeMeta.effects;

  const surfaceShadow = themeMeta.profileSurface?.shadow || eff.shadow || "0 24px 70px rgba(0,0,0,0.14)";
  const surfaceBorder = themeMeta.profileSurface?.border || c.border;
  const surfaceBg = themeMeta.profileSurface?.background || c.profileBackground;

  const cleanHandle = (profile.username || "").replace(/^@/, "");
  const formattedCategories = formatCategoryDots(profile.category, profile.customCategory);
  const headerSocialList = activeSocialList.filter((s) => s.hasAccount || s.count > 0 || (s.url && s.url !== "#"));

  const cardContent = (
    <div
      style={{
        ...themeCssVars,
        backgroundColor: isFull ? "transparent" : surfaceBg,
        borderColor: isFull ? "transparent" : surfaceBorder,
        color: c.primaryText,
        fontFamily: typ.fontFamily,
        letterSpacing: typ.letterSpacing,
        ["--desktop-surface-shadow" as any]: isFull ? "none" : surfaceShadow,
      }}
      className={`relative overflow-hidden flex-1 flex flex-col ${
        isFull
          ? "p-0 border-0 shadow-none bg-transparent"
          : `${cardPadding ? cardPadding : "p-4 sm:p-6 pt-6 sm:pt-8"} rounded-[24px] border shadow-md`
      } transition-all`}
    >
      {/* Ambient Animation in Preview mode when theme supports it */}
      {themeMeta.animation?.type !== "none" && !isFull && (
        <AmbientAnimation
          type={themeMeta.animation?.type || themeMeta.animationType}
          colors={themeMeta.animation?.colors || themeMeta.particleColors}
          themeKey={themeMeta.key}
          contained={true}
        />
      )}

      {/* Focus Overlay between animated background and content */}
      {!isFull && <FocusOverlay overlay={themeMeta.focusOverlay} contained={true} />}

      {/* Top Action Bar (Left Inflixo Logo Squircle, Right Share Icon Squircle) */}
      <div className="relative z-10 flex items-center justify-between w-full mb-6 px-0.5">
        <Link
          href="/"
          style={{ backgroundColor: c.accent }}
          className="tap-scale flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-white shadow-xs transition-all shrink-0 border border-white/20 select-none hover:scale-105 cursor-pointer"
          title="Inflixo"
          aria-label="Inflixo"
        >
          <InflixoLogoIcon className="h-5 w-5 text-white" />
        </Link>

        {!isOnboardingMode && (
          <button
            type="button"
            onClick={handleShareClick}
            style={{
              backgroundColor: c.cardBackground,
              borderColor: c.border,
              color: c.primaryText,
            }}
            className="tap-scale flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border shadow-2xs transition-all hover:scale-105 cursor-pointer"
            title="Share profile"
            aria-label="Share profile"
          >
            <Share2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 1. Profile Header Section */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Circular Avatar */}
        <div className="relative inline-block mx-auto">
          <CreatorAvatar
            src={profile.photoDataUrl}
            name={profile.displayName || "Creator"}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full aspect-square object-cover overflow-hidden border-2 border-white/80 ring-4 ring-black/5 shadow-md mx-auto"
            style={{ borderColor: c.border || "#FFFFFF" }}
            textClassName="text-xl sm:text-2xl font-extrabold text-white"
            fallbackBgClass="bg-[#3a2447]"
          />
        </div>

        {/* Creator Name & Verified Checkmark */}
        <div className="mt-3.5 sm:mt-4 flex items-center justify-center gap-1.5 max-w-full">
          <h1
            style={{
              color: c.primaryText,
              fontFamily: typ.headingFontFamily,
              fontWeight: 700,
            }}
            className="text-[22px] sm:text-[24px] font-bold tracking-tight"
          >
            {profile.displayName || "Creator Name"}
          </h1>
          {Boolean(profile.isVerified) && (
            <svg className="w-5 h-5 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-label="Verified Creator">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L9 14.17l9.59-9.59L20 6l-10 11z" />
            </svg>
          )}
        </div>

        {/* Username */}
        {cleanHandle && (
          <p
            style={{ color: c.mutedText }}
            className="text-xs sm:text-[13px] font-medium text-center mt-0.5"
          >
            @{cleanHandle}
          </p>
        )}

        {/* Categories: Dot-separated text without pill */}
        {visibilitySettings.showContentCategory !== false && formattedCategories && (
          <p
            style={{ color: c.secondaryText }}
            className="mt-1.5 text-xs sm:text-[13px] font-medium text-center tracking-normal"
          >
            {formattedCategories}
          </p>
        )}

        {/* Short Creator Bio */}
        {profile.bio && profile.bio.trim() && (
          <p
            style={{ color: c.secondaryText }}
            className="mt-2.5 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto font-normal px-2 text-center"
          >
            {profile.bio}
          </p>
        )}

        {/* Clickable Social Icons Row */}
        {headerSocialList.length > 0 && (
          <div className="mt-3.5 flex items-center justify-center gap-2.5 sm:gap-3 flex-wrap">
            {headerSocialList.map((item) => (
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
                  backgroundColor: c.cardBackground,
                  borderColor: c.border,
                  color: c.primaryText,
                }}
                className="tap-scale flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border shadow-2xs transition-all hover:scale-110 cursor-pointer"
                title={`Visit ${item.label}`}
                aria-label={item.label}
              >
                <span className="flex items-center justify-center">
                  {item.platform === "instagram" && <InstagramIcon className="h-4 w-4 text-pink-500" />}
                  {item.platform === "youtube" && <YoutubeIcon className="h-4 w-4 text-red-500" />}
                  {item.platform === "facebook" && <FacebookIcon className="h-4 w-4 text-blue-500" />}
                  {item.platform === "twitter" && <XTwitterIcon className="h-3.5 w-3.5" style={{ color: c.primaryText }} />}
                  {item.platform === "linkedin" && <LinkedinIcon className="h-4 w-4 text-sky-600" />}
                  {item.platform === "threads" && <ThreadsIcon className="h-4 w-4" style={{ color: c.primaryText }} />}
                  {item.platform === "snapchat" && <SnapchatIcon className="h-4 w-4 text-amber-400" />}
                  {item.platform === "spotify" && <SpotifyIcon className="h-4 w-4 text-emerald-500" />}
                  {item.platform === "twitch" && <TwitchIcon className="h-4 w-4 text-purple-500" />}
                  {!["instagram", "youtube", "facebook", "twitter", "linkedin", "threads", "snapchat", "spotify", "twitch"].includes(item.platform) && (
                    <Globe className="h-4 w-4" style={{ color: c.accentText }} />
                  )}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* 2. Total Fanbase USP Block */}
      {visibilitySettings.showFanbase !== false && (
        <div
          style={{
            backgroundColor: c.cardBackground,
            borderColor: c.border,
            boxShadow: eff.cardShadow,
          }}
          className="relative z-10 mt-8 rounded-[16px] p-5 sm:p-6 border text-center w-full shadow-xs"
        >
          <div className="space-y-1">
            <p
              style={{
                color: c.primaryText,
                fontFamily: typ.headingFontFamily,
                fontWeight: 800,
              }}
              className="text-3xl sm:text-4xl leading-none font-extrabold tabular-nums tracking-tight"
            >
              {formatCount(totalAudience)}
            </p>
            <span
              style={{ color: c.secondaryText }}
              className="text-xs sm:text-[13px] font-semibold tracking-wider uppercase block mt-1"
            >
              Total Fanbase
            </span>
          </div>

          {/* Clickable Platform Pills */}
          {activeSocialList.filter((s) => s.hasAccount || s.count > 0).length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
              {activeSocialList
                .filter((s) => s.hasAccount || s.count > 0)
                .map((item) => (
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
                      backgroundColor: "var(--color-surface-alt, rgba(0,0,0,0.03))",
                      borderColor: c.border,
                    }}
                    className="tap-scale inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full border transition-all hover:scale-105 cursor-pointer text-xs sm:text-[13px] font-semibold"
                    title={`Visit ${item.label}`}
                  >
                    <span className="flex items-center justify-center shrink-0">
                      {item.platform === "instagram" && <InstagramIcon className="h-3.5 w-3.5 text-pink-500" />}
                      {item.platform === "youtube" && <YoutubeIcon className="h-3.5 w-3.5 text-red-500" />}
                      {item.platform === "facebook" && <FacebookIcon className="h-3.5 w-3.5 text-blue-500" />}
                      {item.platform === "twitter" && <XTwitterIcon className="h-3 w-3" style={{ color: c.primaryText }} />}
                      {item.platform === "linkedin" && <LinkedinIcon className="h-3.5 w-3.5 text-sky-600" />}
                      {item.platform === "threads" && <ThreadsIcon className="h-3.5 w-3.5" style={{ color: c.primaryText }} />}
                      {item.platform === "snapchat" && <SnapchatIcon className="h-3.5 w-3.5 text-amber-400" />}
                      {item.platform === "spotify" && <SpotifyIcon className="h-3.5 w-3.5 text-emerald-500" />}
                      {item.platform === "twitch" && <TwitchIcon className="h-3.5 w-3.5 text-purple-500" />}
                      {!["instagram", "youtube", "facebook", "twitter", "linkedin", "threads", "snapchat", "spotify", "twitch"].includes(item.platform) && (
                        <Globe className="h-3.5 w-3.5" style={{ color: c.accentText }} />
                      )}
                    </span>
                    <span style={{ color: c.secondaryText }} className="font-medium text-xs">
                      {item.label}
                    </span>
                    <span style={{ color: c.primaryText }} className="font-extrabold tabular-nums ml-0.5">
                      {formatCount(item.count)}
                    </span>
                  </a>
                ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Series Section */}
      {visibilitySettings.showSeries !== false && (series.length > 0 || isOnboardingMode) && (
        <div id="series-section" className="relative z-10 mt-8 w-full text-left space-y-3">
          <h2
            style={{
              color: c.primaryText,
              fontFamily: typ.headingFontFamily,
              fontWeight: 700,
            }}
            className="text-base sm:text-lg font-bold tracking-tight px-0.5"
          >
            Series
          </h2>

          <div className="space-y-3 sm:space-y-4">
            {series.map((s) => {
              const allEps = getSeriesEpisodes(s);
              const epCount = allEps.length;
              const epCountStr = `${epCount} ${epCount === 1 ? "episode" : "episodes"}`;

              const firstEpUrl = allEps[0]?.externalUrl || "";
              const detectedPlatform = (() => {
                const p = (s.platform || "").toLowerCase();
                const u = (firstEpUrl || "").toLowerCase();
                if (p.includes("youtube") || u.includes("youtube.com") || u.includes("youtu.be")) return "YouTube";
                if (p.includes("instagram") || u.includes("instagram.com")) return "Instagram";
                if (p.includes("facebook") || u.includes("facebook.com")) return "Facebook";
                if (s.platform && s.platform.trim()) return s.platform.trim();
                return null;
              })();

              const subtitleParts: string[] = [epCountStr];
              if (detectedPlatform) subtitleParts.push(detectedPlatform);
              const subtitleStr = subtitleParts.join(" · ");
              const seriesUrl = `/${cleanHandle || "creator"}/series/${s.id}`;

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    if (isInformationalMode) {
                      showToast(`Opens ${s.title} dedicated series page ✨`);
                    } else if (typeof window !== "undefined") {
                      window.location.href = seriesUrl;
                    }
                  }}
                  style={{
                    backgroundColor: c.cardBackground,
                    borderColor: c.border,
                    boxShadow: eff.cardShadow,
                  }}
                  className="group rounded-[16px] border overflow-hidden transition-all hover:shadow-md cursor-pointer shadow-xs"
                >
                  {/* Sleek Compact Cover Image (reduced height) */}
                  <div className="relative w-full aspect-[21/9] sm:aspect-[2.2/1] max-h-[190px] sm:max-h-[210px] min-h-[120px] overflow-hidden bg-slate-900/5">
                    {s.posterDataUrl ? (
                      <>
                        <img
                          src={s.posterDataUrl}
                          alt={s.title}
                          className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#241618] to-[#3a2447]">
                        <Film className="h-10 w-10 text-white/40" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-5 space-y-1.5">
                    <h3
                      style={{ color: c.primaryText }}
                      className="text-base sm:text-[17px] font-bold tracking-tight"
                    >
                      {s.title}
                    </h3>
                    <p
                      style={{ color: c.secondaryText }}
                      className="text-xs sm:text-[13px] font-medium"
                    >
                      {subtitleStr}
                    </p>

                    <div
                      style={{ color: c.accentText }}
                      className="pt-1.5 flex items-center gap-1 text-xs sm:text-[13px] font-bold"
                    >
                      <span>View Series</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Links Section */}
      {visibilitySettings.showCustomLinks !== false && customLinksList && customLinksList.filter((l) => l.isEnabled !== false && l.title && l.url).length > 0 && (
        <div id="links-section" className="relative z-10 mt-8 w-full text-left space-y-3">
          <h2
            style={{
              color: c.primaryText,
              fontFamily: typ.headingFontFamily,
              fontWeight: 700,
            }}
            className="text-base sm:text-lg font-bold tracking-tight px-0.5"
          >
            Links
          </h2>

          <div className="space-y-2.5">
            {customLinksList
              .filter((l) => l.isEnabled !== false && l.title && l.url)
              .map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => { if (isInformationalMode) e.preventDefault(); }}
                  style={{
                    backgroundColor: c.cardBackground,
                    borderColor: c.border,
                    boxShadow: eff.cardShadow,
                  }}
                  className="tap-scale h-[56px] sm:h-[60px] rounded-[14px] border px-4 flex items-center justify-between transition-all hover:scale-[1.01] hover:shadow-xs group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <Globe
                      style={{ color: c.accentText }}
                      className="h-4 w-4 shrink-0"
                    />
                    <span
                      style={{ color: c.primaryText }}
                      className="text-xs sm:text-sm font-semibold truncate"
                    >
                      {link.title}
                    </span>
                  </div>

                  <ExternalLink
                    style={{ color: c.secondaryText }}
                    className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </a>
              ))}
          </div>
        </div>
      )}

      {/* 5. Work with Me Section (Only shown if WhatsApp or Email is available) */}
      {(() => {
        const whatsappNum = mediaKitSettings?.whatsappNumber?.trim() || (profile as any).whatsappNumber?.trim() || "";
        const hasWhatsApp = Boolean(whatsappNum);

        const contactEmail = mediaKitSettings?.sponsorEmail?.trim() || profile.email?.trim() || "";
        const hasEmail = Boolean(contactEmail);

        if (!hasWhatsApp && !hasEmail) return null;

        return (
          <div id="work-with-me-section" className="relative z-10 mt-8 w-full text-left space-y-3">
            <div className="space-y-1 px-0.5">
              <h2
                style={{
                  color: c.primaryText,
                  fontFamily: typ.headingFontFamily,
                  fontWeight: 700,
                }}
                className="text-base sm:text-lg font-bold tracking-tight"
              >
                Work with me
              </h2>
              <p
                style={{ color: c.secondaryText }}
                className="text-xs sm:text-[13px] font-normal"
              >
                For collaborations and business enquiries.
              </p>
            </div>

            {/* Services if creator created any */}
            {visibilitySettings.showCollabGigs !== false && mediaKitPackages.filter((p) => p.isActive).length > 0 && (
              <div className="space-y-2.5">
                {mediaKitPackages
                  .filter((p) => p.isActive)
                  .map((pkg) => {
                    const formattedPrice = pkg.price
                      ? pkg.price.startsWith("₹") || pkg.price.toLowerCase().includes("contact")
                        ? pkg.price
                        : `₹${pkg.price}`
                      : "Contact for pricing";

                    return (
                      <div
                        key={pkg.id}
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
                        style={{
                          backgroundColor: c.cardBackground,
                          borderColor: c.border,
                          boxShadow: eff.cardShadow,
                        }}
                        className="tap-scale rounded-[14px] border p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xs group shadow-2xs"
                      >
                        <div className="min-w-0 pr-2 space-y-0.5">
                          <h3
                            style={{ color: c.primaryText }}
                            className="text-xs sm:text-sm font-bold truncate"
                          >
                            {pkg.title}
                          </h3>
                          <p
                            style={{ color: c.secondaryText }}
                            className="text-[11px] sm:text-xs font-medium"
                          >
                            Starting at {formattedPrice}
                          </p>
                        </div>

                        <ArrowRight
                          style={{ color: c.accentText }}
                          className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1"
                        />
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Contact Buttons: WhatsApp only, Email only, or Both */}
            <div className="flex items-center gap-2.5 pt-1">
              {hasWhatsApp && (
                <button
                  type="button"
                  onClick={() => setIsLeadModalOpen(true)}
                  style={{
                    backgroundColor: c.cardBackground,
                    borderColor: c.border,
                    color: c.primaryText,
                  }}
                  className={`tap-scale ${hasEmail ? "flex-1" : "w-full"} h-[48px] rounded-[14px] border flex items-center justify-center gap-2 text-xs sm:text-[13px] font-bold transition-all hover:brightness-95 cursor-pointer shadow-2xs`}
                >
                  <MessageCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>WhatsApp</span>
                </button>
              )}

              {hasEmail && (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(`Brand Collaboration Enquiry: @${cleanHandle || "creator"}`)}`;
                  }}
                  style={{
                    backgroundColor: c.cardBackground,
                    borderColor: c.border,
                    color: c.primaryText,
                  }}
                  className={`tap-scale ${hasWhatsApp ? "flex-1" : "w-full"} h-[48px] rounded-[14px] border flex items-center justify-center gap-2 text-xs sm:text-[13px] font-bold transition-all hover:brightness-95 cursor-pointer shadow-2xs`}
                >
                  <Mail className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>Email</span>
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* 6. Reviews (Compact, only when reviews exist) */}
      {visibilitySettings.showReviews !== false && approvedReviews.length > 0 && (
        <div id="reviews-section" className="relative z-10 mt-8 w-full text-left space-y-3">
          <h2
            style={{
              color: c.primaryText,
              fontFamily: typ.headingFontFamily,
              fontWeight: 700,
            }}
            className="text-base sm:text-lg font-bold tracking-tight px-0.5"
          >
            Reviews
          </h2>

          <div className="space-y-3">
            {approvedReviews.slice(0, 3).map((rev) => {
              const ratingNum = Number(rev.rating) || 5;
              return (
                <div
                  key={rev.id}
                  style={{
                    backgroundColor: c.cardBackground,
                    borderColor: c.border,
                    boxShadow: eff.cardShadow,
                  }}
                  className="rounded-[16px] border p-4 sm:p-5 space-y-2.5 text-left shadow-xs"
                >
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < ratingNum ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
                        }`}
                      />
                    ))}
                  </div>

                  {rev.comment && (
                    <p
                      style={{ color: c.primaryText }}
                      className="text-xs sm:text-[13px] leading-relaxed font-normal italic"
                    >
                      &ldquo;{rev.comment.trim()}&rdquo;
                    </p>
                  )}

                  <p
                    style={{ color: c.primaryText }}
                    className="text-xs sm:text-[13px] font-bold pt-0.5"
                  >
                    {rev.clientName}
                  </p>
                </div>
              );
            })}
          </div>

          {approvedReviews.length > 3 && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  showToast("Showing verified creator reviews ✨");
                }}
                style={{ color: c.accentText }}
                className="text-xs sm:text-[13px] font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <span>View all reviews</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. Subtle Inflixo Attribution */}
      <div className="relative z-10 mt-10 mb-4 flex items-center justify-center select-none">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => { if (isInformationalMode) e.preventDefault(); }}
          style={{ color: c.mutedText }}
          className="tap-scale inline-flex items-center gap-1.5 text-xs font-medium hover:opacity-100 opacity-60 transition-opacity cursor-pointer"
        >
          <InflixoLogoIcon className="h-3.5 w-3.5" />
          <span>Made with Inflixo</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );

  return (
    <div className={`relative w-full mx-auto flex-1 flex flex-col min-h-full transition-all ${isFull ? "max-w-[640px]" : "max-w-[520px]"}`}>
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
    badgeClass: "bg-[#3a2447] text-white shadow-2xs",
    chipClass: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    textColor: "text-[#3a2447]",
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
  if (genresList.length > 0) subtitleParts.push(genresList[0]);
  const subtitleStr = subtitleParts.join(" • ");

  return (
    <div
      id={`series-${series.id}`}
      onClick={() => (onSelectSeries ? onSelectSeries(series) : onToggle ? onToggle() : null)}
      className="px-3.5 py-2.5 sm:py-3 transition-colors flex items-center justify-between hover:bg-[#F7F0EA]/50 group cursor-pointer"
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
                            : "bg-[#3a244714] text-[#3a2447]"
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
        <div className="min-w-0 text-left space-y-0.5">
          <p style={{ color: c.primaryText }} className="truncate text-xs sm:text-[13px] font-bold">
            {series.title}
          </p>
          <p style={{ color: c.mutedText }} className="truncate text-[11px] font-medium">
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
