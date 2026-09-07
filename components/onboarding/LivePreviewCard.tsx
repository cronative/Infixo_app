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
  cardBg: "bg-gradient-to-b from-[#FAF5FF] via-[#FDFBFE] to-[#F8F2F7] border border-[#B85C6B]/18 text-slate-900 shadow-lg",
  profBadgeBg: "bg-white/80 backdrop-blur-md",
  profBadgeText: "text-[#B85C6B]",
  profBadgeBorder: "border-[#B85C6B]/18",
  fanbaseBg: "bg-white/80 backdrop-blur-md",
  fanbaseText: "text-[#17131A]",
  socialItemBg: "bg-white/80 hover:bg-white/95 backdrop-blur-md",
  socialItemBorder: "border-[#B85C6B]/18 hover:border-[#B85C6B]/30",
  socialNameColor: "text-[#17131A]",
  socialUnitColor: "text-[#6F6872]",
  nameColor: "text-[#17131A]",
  bioColor: "text-[#6F6872]",
  handleColor: "text-[#B85C6B]",
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
  cardBg: "bg-gradient-to-b from-white to-[#FAF8FA] text-[#17131A] border border-[#B85C6B]/16 shadow-2xs",
  profBadgeBg: "bg-white/90",
  profBadgeText: "text-[#B85C6B]",
  profBadgeBorder: "border-[#B85C6B]/20",
  fanbaseBg: "bg-white/90 backdrop-blur-md",
  fanbaseText: "text-[#17131A]",
  socialItemBg: "bg-white/80 hover:bg-white/95 backdrop-blur-md",
  socialItemBorder: "border-[#B85C6B]/16 hover:border-[#B85C6B]/30",
  socialNameColor: "text-[#17131A]",
  socialUnitColor: "text-[#6F6872]",
  nameColor: "text-[#17131A]",
  bioColor: "text-[#6F6872]",
  handleColor: "text-[#B85C6B]",
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
  profBadgeText: "text-[#B85C6B]",
  profBadgeBorder: "border-[#E3D9CC]",
  fanbaseBg: "bg-white/90 backdrop-blur-md",
  fanbaseText: "text-[#29221D]",
  socialItemBg: "bg-white/80 hover:bg-white/95 backdrop-blur-md",
  socialItemBorder: "border-[#E3D9CC] hover:border-[#B85C6B]/35",
  socialNameColor: "text-[#29221D]",
  socialUnitColor: "text-[#6A5E57]",
  nameColor: "text-[#29221D]",
  bioColor: "text-[#6A5E57]",
  handleColor: "text-[#B85C6B]",
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
  const [expandedSeriesId, setExpandedSeriesId] = useState<string | null>(null);
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
      } catch (e) {}

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
      setTeamData(passedTeam);
    } else if (isDashboardPreview) {
      setTeamData(teamRepository.get());
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

  const hasInsta = Boolean(instaHandle || (socials.instagram?.followers || 0) > 0 || socials.instagram?.url);
  const instaUrl = buildSocialUrl("instagram", socials.instagram?.url || socials.instagram?.username || instaHandle);

  const hasYt = Boolean(ytHandle || (socials.youtube?.subscribers || 0) > 0 || socials.youtube?.url);
  const ytUrl = buildSocialUrl("youtube", socials.youtube?.url || socials.youtube?.username || ytHandle);

  const hasFb = Boolean(fbHandle || (socials.facebook?.followers || 0) > 0 || socials.facebook?.url);
  const fbUrl = buildSocialUrl("facebook", socials.facebook?.url || socials.facebook?.username || fbHandle);

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
      }}
      className={`relative overflow-hidden flex-1 flex flex-col ${
        selectedSeriesDetail
          ? "min-h-[calc(100dvh-4rem)] sm:min-h-[calc(100dvh-5rem)] p-0"
          : isFull
          ? "p-6 sm:p-8 pt-7 sm:pt-8"
          : "p-4 sm:p-6 pt-6 sm:pt-8"
      } rounded-[24px] border shadow-md transition-all`}
    >
      {/* Ambient Animation in Preview mode when theme supports it */}
      {themeMeta.animation?.type !== "none" && (
        <AmbientAnimation
          type={themeMeta.animation?.type || themeMeta.animationType}
          colors={themeMeta.animation?.colors || themeMeta.particleColors}
          themeKey={themeMeta.key}
          contained={true}
        />
      )}

      {/* Focus Overlay between animated background and content */}
      <FocusOverlay overlay={themeMeta.focusOverlay} contained={true} />

      {/* Top Action Bar (Rendered only on main profile view) */}
      {!selectedSeriesDetail && (
        <div className="relative z-10 flex items-center justify-between w-full mb-6 px-0.5">
          <div
            className="tap-scale flex h-9 w-9 items-center justify-center rounded-xl text-white font-bold text-sm shadow-xs transition-all shrink-0 border border-white/20 select-none bg-[#B85C6B]"
            title="Inflixo"
            aria-label="Inflixo"
          >
            I
          </div>

          {!isOnboardingMode && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyClick}
                className="tap-scale flex h-8.5 w-8.5 items-center justify-center rounded-full border border-[#E4DAD5] bg-white text-[#6B5A5D] shadow-2xs transition-all hover:scale-105 cursor-pointer"
                title="Copy profile link"
                aria-label="Copy profile link"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={handleShareClick}
                className="tap-scale flex h-8.5 w-8.5 items-center justify-center rounded-full border border-[#E4DAD5] bg-white text-[#6B5A5D] shadow-2xs transition-all hover:scale-105 cursor-pointer"
                title="Share profile"
                aria-label="Share profile"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {selectedSeriesDetail ? (
        /* IN-CARD SERIES DETAIL VIEW */
        <div className="relative z-10 flex-1 flex flex-col justify-between animate-in fade-in duration-200">
          <div className="flex-1 flex flex-col">
            {/* 1. FULL-WIDTH HERO COVER HEADER (Maroon Gradient or Valid Poster) */}
            <div className="relative w-full aspect-[21/9] min-h-[140px] sm:min-h-[160px] overflow-hidden bg-gradient-to-r from-[#B85C6B] via-[#A24B5A] to-[#8C3F4D] m-0 p-0 shrink-0">
              {selectedSeriesDetail.posterDataUrl && selectedSeriesDetail.posterDataUrl.trim() !== "" && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedSeriesDetail.posterDataUrl}
                    alt={selectedSeriesDetail.title}
                    className="block w-full h-full object-cover object-center m-0 p-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />
                </>
              )}

              {/* OVERLAY: TOP ACTION BAR */}
              <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 z-20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSeriesDetail(null)}
                    className="tap-scale flex h-8.5 w-8.5 items-center justify-center rounded-full bg-black/35 hover:bg-black/55 active:bg-black/70 backdrop-blur-md border border-white/25 text-white transition-all shadow-md cursor-pointer"
                    title="Back to profile"
                    aria-label="Back to profile"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <div
                    className="tap-scale flex h-8.5 w-8.5 items-center justify-center rounded-full text-white shadow-xs transition-all shrink-0 border border-white/25 select-none"
                    style={{ backgroundColor: c.accent }}
                    title="Inflixo"
                    aria-label="Inflixo"
                  >
                    <InflixoLogoIcon className="h-4 w-4 text-white" />
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      const cleanUsername = (profile.username || "creator").replace(/^@/, "");
                      const shareUrl = typeof window !== "undefined"
                        ? `${window.location.origin}/${cleanUsername}/series/${selectedSeriesDetail.id}`
                        : `https://inflixo.com/${cleanUsername}/series/${selectedSeriesDetail.id}`;
                      await copyToClipboard(shareUrl);
                      showToast("Series link copied! 🎬✨");
                    }}
                    className="tap-scale flex h-8.5 w-8.5 items-center justify-center rounded-full bg-black/35 hover:bg-black/55 active:bg-black/70 backdrop-blur-md border border-white/25 text-white transition-all cursor-pointer shadow-md"
                    title="Copy Series Link"
                    aria-label="Copy Series Link"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      const cleanUsername = (profile.username || "creator").replace(/^@/, "");
                      const shareUrl = typeof window !== "undefined"
                        ? `${window.location.origin}/${cleanUsername}/series/${selectedSeriesDetail.id}`
                        : `https://inflixo.com/${cleanUsername}/series/${selectedSeriesDetail.id}`;
                      const title = `${selectedSeriesDetail.title} by ${profile.displayName || "Creator"}`;
                      try {
                        if (typeof navigator !== "undefined" && navigator.share) {
                          await navigator.share({ title, url: shareUrl });
                        } else {
                          await copyToClipboard(shareUrl);
                          showToast("Series link copied! 🎬✨");
                        }
                      } catch {}
                    }}
                    className="tap-scale flex h-8.5 w-8.5 items-center justify-center rounded-full bg-black/35 hover:bg-black/55 active:bg-black/70 backdrop-blur-md border border-white/25 text-white transition-all cursor-pointer shadow-md"
                    title="Share Series Link"
                    aria-label="Share Series Link"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Bottom Right Overlay: Platform */}
              {selectedSeriesDetail.platform && (
                <div className="absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold shadow-sm">
                  {selectedSeriesDetail.platform === "YouTube" && <YoutubeIcon className="h-3 w-3 text-red-500" />}
                  {selectedSeriesDetail.platform === "Instagram" && <InstagramIcon className="h-3 w-3 text-pink-500" />}
                  {selectedSeriesDetail.platform === "Facebook" && <FacebookIcon className="h-3 w-3 text-blue-500" />}
                  {selectedSeriesDetail.platform === "Other" && <Globe className="h-3 w-3 text-purple-400" />}
                  <span>{selectedSeriesDetail.platform}</span>
                </div>
              )}
            </div>

            {/* 2. BODY CONTENT: TITLE, DESCRIPTION, PILL TAGS, EPISODES */}
            <div className="p-5 sm:p-7 pt-6 sm:pt-7 flex-1 flex flex-col">
              <div className="text-center px-1">
                <h2
                  style={{
                    color: c.primaryText,
                    fontFamily: typ.headingFontFamily,
                    fontWeight: typ.headingWeight as any,
                  }}
                  className="text-xl sm:text-2xl font-extrabold leading-tight tracking-tight text-[#241618]"
                >
                  {selectedSeriesDetail.title}
                </h2>

                {selectedSeriesDetail.description && (
                  <p
                    style={{ color: c.secondaryText }}
                    className="mt-2 sm:mt-2.5 text-xs sm:text-sm leading-relaxed text-[#6B5A5D] font-normal max-w-md mx-auto"
                  >
                    {selectedSeriesDetail.description}
                  </p>
                )}

                {/* Category / Genre & Language Pill Tags */}
                {(() => {
                  const parts: string[] = [];
                  if (selectedSeriesDetail.genre) {
                    const gItems = selectedSeriesDetail.genre
                      .split(/[,•|/]/)
                      .map((g) => g.trim().replace(/^Genre:\s*/i, ""))
                      .filter(Boolean);
                    parts.push(...gItems);
                  }
                  if (selectedSeriesDetail.language && selectedSeriesDetail.language.trim()) {
                    parts.push(selectedSeriesDetail.language.trim());
                  }

                  if (parts.length === 0) return null;

                  return (
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      {parts.map((tag, idx) => (
                        <span
                          key={idx}
                          style={{
                            backgroundColor: c.accentSoft,
                            borderColor: c.accentBorder,
                            color: c.accentText,
                          }}
                          className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold border transition-all"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Seasons Filter Tabs (If multiple) */}
              {selectedSeriesDetail.seasons && selectedSeriesDetail.seasons.length > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {selectedSeriesDetail.seasons.map((sn, idx) => (
                    <button
                      key={sn.id || idx}
                      type="button"
                      onClick={() => setSelectedSeriesSeasonIdx(idx)}
                      style={
                        selectedSeriesSeasonIdx === idx
                          ? { backgroundColor: c.accentSoft, borderColor: c.accentBorder, color: c.accentText }
                          : { backgroundColor: c.cardBackground, borderColor: c.border, color: c.secondaryText }
                      }
                      className="tap-scale px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border"
                    >
                      {sn.title || `Season ${sn.seasonNumber || idx + 1}`} ({sn.episodes?.length || 0})
                    </button>
                  ))}
                </div>
              )}

              {/* 3. EPISODES HEADER & GROUPED LIST */}
              {(() => {
                const seasons = selectedSeriesDetail.seasons || [];
                const currentEps =
                  seasons.length > 0 && seasons[selectedSeriesSeasonIdx]
                    ? seasons[selectedSeriesSeasonIdx].episodes || []
                    : getSeriesEpisodes(selectedSeriesDetail);

                return (
                  <div className="mt-8 sm:mt-9 space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span
                        style={{ color: c.mutedText }}
                        className="text-[11px] font-bold uppercase tracking-wider text-[#6B5A5D]"
                      >
                        {seasons.length > 1
                          ? `${seasons[selectedSeriesSeasonIdx]?.title || `Season ${selectedSeriesSeasonIdx + 1}`} Episodes (${currentEps.length})`
                          : `Episodes (${currentEps.length})`}
                      </span>
                    </div>

                    {currentEps.length === 0 ? (
                      <div
                        style={{ borderColor: c.border, color: c.mutedText }}
                        className="p-6 text-center text-xs font-semibold rounded-2xl border border-dashed border-[#E4DAD5] bg-[#F7F0EA]/30 text-[#6B5A5D]"
                      >
                        No episodes uploaded for this series yet.
                      </div>
                    ) : (
                      <div
                        style={{
                          borderColor: c.divider,
                          backgroundColor: c.cardBackground,
                        }}
                        className="rounded-2xl border border-[#E4DAD5] bg-white divide-y divide-[#E4DAD5] overflow-hidden shadow-xs"
                      >
                        {currentEps.map((ep, idx) => {
                          const partNum = ep.episodeNumber || idx + 1;
                          const partNumStr = partNum < 10 ? `0${partNum}` : `${partNum}`;
                          const epTitleStr = ep.title && ep.title.trim() ? ep.title : `Episode ${partNum}`;

                          return (
                            <a
                              key={ep.id || idx}
                              href={ep.externalUrl || "#"}
                              target={ep.externalUrl ? "_blank" : undefined}
                              rel="noopener noreferrer"
                              className="group flex items-center justify-between w-full px-4 py-3.5 transition-colors hover:bg-[#F7F0EA]/50 cursor-pointer"
                            >
                              {/* Left: Number & Title */}
                              <div className="flex items-center gap-3.5 min-w-0 pr-2">
                                <span
                                  style={{ color: c.mutedText }}
                                  className="text-xs font-mono font-medium text-[#6B5A5D] w-6 shrink-0"
                                >
                                  {partNumStr}
                                </span>
                                <span
                                  style={{ color: c.primaryText }}
                                  className="text-xs sm:text-sm font-bold text-[#241618] truncate group-hover:text-[#8C3F4D] transition-colors"
                                >
                                  {epTitleStr}
                                </span>
                              </div>

                              {/* Right: Enlarged 34px Circular View Icon */}
                              <div
                                style={{
                                  borderColor: c.border,
                                  color: c.accentText,
                                }}
                                className="h-8.5 w-8.5 rounded-full border border-[#E4DAD5] bg-white text-[#8C3F4D] flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-[#F3DDE0] group-hover:border-[#B85C6B]/30 group-hover:scale-105 transition-all"
                              >
                                <Eye className="h-4 w-4" />
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Creator Identity Header */}
          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Profile Avatar */}
            <div className="relative inline-block mx-auto">
              <CreatorAvatar
                src={profile.photoDataUrl}
                name={profile.displayName || "Creator"}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full aspect-square object-cover overflow-hidden border-2 border-white ring-4 ring-[#F3DDE0] shadow-md mx-auto"
                style={{ borderColor: "#FFFFFF" }}
                textClassName="text-xl sm:text-2xl font-extrabold text-white"
                fallbackBgClass="bg-[#B85C6B]"
              />
            </div>

            {/* Creator Name & Verified Checkmark */}
            <div className="mt-4 flex items-center justify-center gap-1.5 max-w-full">
              <h1
                style={{
                  color: c.primaryText,
                  fontFamily: typ.headingFontFamily,
                  fontWeight: typ.headingWeight as any,
                }}
                className="text-xl sm:text-2xl font-bold tracking-tight"
              >
                {profile.displayName || "Creator Name"}
              </h1>
              {Boolean(profile.isVerified) && (
                <svg className="w-5 h-5 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-label="Verified Creator">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L9 14.17l9.59-9.59L20 6l-10 11z" />
                </svg>
              )}
            </div>

            {/* Creator Handle (4px under name) */}
            <p
              style={{ color: c.secondaryText }}
              className="mt-1 text-xs font-semibold"
            >
              @{profile.username || "username"}
            </p>

            {/* Category Chips (16px under handle) */}
            {visibilitySettings.showContentCategory !== false && (() => {
              const allChips: string[] = [];
              if (profile.category) {
                profile.category.split(",").forEach((cat) => {
                  const trimmed = cat.trim();
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
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 max-w-xs">
                  {visibleChips.map((chip, idx) => (
                    <span
                      key={idx}
                      className="bg-[#F3DDE0] text-[#8C3F4D] text-xs font-semibold px-3.5 py-1.5 rounded-full"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              );
            })()}

            {/* Bio (16px under chips/handle) */}
            {profile.bio && profile.bio.trim() && (
              <p
                style={{ color: c.secondaryText }}
                className="mt-4 text-xs sm:text-sm leading-relaxed max-w-md mx-auto font-normal px-2"
              >
                {profile.bio}
              </p>
            )}

            {/* Quick Social Icon Buttons (20px under bio) */}
            {(hasInsta || hasYt || hasFb) && (
              <div className="mt-5 flex items-center justify-center gap-3.5">
                {hasInsta && (
                  <a
                    href={instaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { if (isInformationalMode) e.preventDefault(); }}
                    style={{
                      backgroundColor: c.cardBackground,
                      borderColor: c.border,
                    }}
                    className="tap-scale flex h-10 w-10 items-center justify-center rounded-xl border transition-all shadow-2xs hover:-translate-y-0.5 hover:shadow-xs"
                    title={`Instagram: ${instaHandle ? `@${instaHandle.replace(/^@/, "")}` : "Visit Profile"}`}
                    aria-label="Instagram Profile"
                  >
                    <InstagramIcon className="h-5 w-5" />
                  </a>
                )}

                {hasYt && (
                  <a
                    href={ytUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { if (isInformationalMode) e.preventDefault(); }}
                    style={{
                      backgroundColor: c.cardBackground,
                      borderColor: c.border,
                    }}
                    className="tap-scale flex h-10 w-10 items-center justify-center rounded-xl border transition-all shadow-2xs hover:-translate-y-0.5 hover:shadow-xs"
                    title={`YouTube: ${ytHandle ? `@${ytHandle.replace(/^@/, "")}` : "Visit Channel"}`}
                    aria-label="YouTube Channel"
                  >
                    <YoutubeIcon className="h-5 w-5" />
                  </a>
                )}

                {hasFb && (
                  <a
                    href={fbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { if (isInformationalMode) e.preventDefault(); }}
                    style={{
                      backgroundColor: c.cardBackground,
                      borderColor: c.border,
                    }}
                    className="tap-scale flex h-10 w-10 items-center justify-center rounded-xl border transition-all shadow-2xs hover:-translate-y-0.5 hover:shadow-xs"
                    title={`Facebook: ${fbHandle ? `@${fbHandle.replace(/^@/, "")}` : "Visit Page"}`}
                    aria-label="Facebook Page"
                  >
                    <FacebookIcon className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}

            {/* Clean Total Fanbase Card (28px section gap) */}
            {visibilitySettings.showFanbase !== false && (
              <div
                style={{
                  backgroundColor: c.cardBackground,
                  borderColor: c.border,
                  boxShadow: eff.cardShadow,
                }}
                className="mt-7 rounded-2xl py-3.5 px-4 border text-center w-full space-y-0.5"
              >
                <span
                  style={{ color: c.accentText }}
                  className="text-[11px] font-bold tracking-wider uppercase block"
                >
                  TOTAL FANBASE
                </span>
                <p
                  style={{
                    color: c.primaryText,
                    fontFamily: typ.headingFontFamily,
                    fontWeight: typ.headingWeight as any,
                  }}
                  className="text-[34px] leading-tight font-extrabold tabular-nums"
                >
                  {formatCount(totalAudience)}
                </p>
                <p
                  style={{ color: c.mutedText }}
                  className="text-xs font-medium mt-0.5"
                >
                  {(() => {
                    const connectedPlatformsCount = activeSocialList.filter((s) => s.hasAccount && s.visible).length;
                    return connectedPlatformsCount > 0
                      ? `Across ${connectedPlatformsCount} connected platform${connectedPlatformsCount === 1 ? "" : "s"}`
                      : "Across connected creator platforms";
                  })()}
                </p>
              </div>
            )}
          </div>

          {/* Connected Social Accounts List: Single Card with Dividers (28px section gap) */}
          {activeSocialList.length > 0 && (
            <div className="relative z-10 mt-7 w-full">
              <div
                style={{
                  backgroundColor: c.cardBackground,
                  borderColor: c.border,
                  boxShadow: eff.cardShadow,
                }}
                className="rounded-2xl border divide-y divide-[#E4DAD5] overflow-hidden"
              >
                {activeSocialList.map((item) => (
                  <a
                    key={item.platform}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { if (isInformationalMode) e.preventDefault(); }}
                    className="p-3.5 sm:p-4 transition-all flex items-center justify-between hover:bg-[var(--color-surface-alt,#fbfbfb)] group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg ${item.badgeBg}`}>
                        {item.icon}
                      </span>
                      <div className="min-w-0 text-left space-y-0.5">
                        <p style={{ color: c.primaryText }} className="truncate text-xs sm:text-sm font-bold">
                          {item.label}
                        </p>
                        {item.handle && (
                          <p style={{ color: c.mutedText }} className="truncate text-[11px] font-medium">
                            @{item.handle.replace(/^@/, "")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      {item.count > 0 && (
                        <span style={{ color: c.primaryText }} className="text-xs sm:text-sm font-bold tabular-nums">
                          {formatCount(item.count)}{" "}
                          <span style={{ color: c.mutedText }} className="font-normal text-[11px]">{item.unit.toLowerCase()}</span>
                        </span>
                      )}
                      <ExternalLink style={{ color: c.secondaryText }} className="h-3.5 w-3.5 transition-colors group-hover:translate-x-0.5" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Custom Links List (28px section gap) */}
          {visibilitySettings.showCustomLinks !== false && customLinksList && customLinksList.filter((l) => l.isEnabled !== false && l.title && l.url).length > 0 && (
            <div className="relative z-10 mt-7 space-y-2 w-full text-left">
              <span style={{ color: c.mutedText }} className="text-[11px] font-bold uppercase tracking-wider px-1 block">
                LINKS
              </span>
              <div className="grid grid-cols-1 gap-2.5 w-full">
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
                      className="group rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm font-bold transition-all flex items-center justify-between border cursor-pointer hover:bg-[var(--color-surface-alt,#fbfbfb)]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3DDE0] text-[#8C3F4D]"
                        >
                          <LinkIcon className="h-4.5 w-4.5" />
                        </span>
                        <span style={{ color: c.primaryText }} className="truncate font-semibold">{link.title}</span>
                      </div>
                      <ExternalLink
                        style={{ color: c.secondaryText }}
                        className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                      />
                    </a>
                  ))}
              </div>
            </div>
          )}

          {/* Onboarding Compact Upcoming Sections Indicator */}
          {!isFinishStepMode && isOnboardingMode && (!series || series.length === 0) && mediaKitPackages.filter((p) => p.isActive).length === 0 && approvedReviews.length === 0 ? (
            <div
              style={{
                backgroundColor: c.cardBackground,
                borderColor: c.border,
              }}
              className="relative z-10 mt-7 rounded-2xl p-4 border border-dashed text-center space-y-1.5 transition-all"
            >
              <div style={{ color: c.accentText }} className="flex items-center justify-center gap-1.5 text-xs font-bold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>More sections unlocked next</span>
              </div>
              <p style={{ color: c.mutedText }} className="text-[11px] font-medium leading-relaxed max-w-xs mx-auto">
                Your OTT Series, Services &amp; Reviews will appear here after the next onboarding steps.
              </p>
            </div>
          ) : (() => {
            const isPreviewMode = isOnboardingMode || isFinishStepMode;
            const activePkgs = mediaKitPackages.filter((p) => p.isActive);
            const hasSeries = Boolean(series && series.length > 0);
            const hasGigs = activePkgs.length > 0;
            const hasReviews = Boolean(approvedReviews && approvedReviews.length > 0);

            const showSeriesTab = visibilitySettings.showSeries !== false && (isPreviewMode || hasSeries);
            const showGigsTab = visibilitySettings.showCollabGigs !== false && (isPreviewMode || hasGigs);
            const showReviewsTab = visibilitySettings.showReviews !== false && (isPreviewMode || hasReviews);

            const visibleTabKeys = [
              showSeriesTab ? "series" : null,
              showGigsTab ? "gigs" : null,
              showReviewsTab ? "reviews" : null,
            ].filter(Boolean) as ("series" | "gigs" | "reviews")[];

            if (visibleTabKeys.length === 0) return null;

            const resolvedTab = visibleTabKeys.includes(activeContentTab as any)
              ? (activeContentTab as "series" | "gigs" | "reviews")
              : visibleTabKeys[0];

            const showSegmentedTabs = visibleTabKeys.length >= 2;

            return (
              <div className="relative z-10 mt-7 w-full text-left">
                {/* Segmented Control (Tabs) */}
                {showSegmentedTabs ? (
                  <div
                    style={{
                      backgroundColor: c.cardBackground,
                      borderColor: c.border,
                    }}
                    className="flex items-center gap-1 p-1 rounded-xl sm:rounded-2xl border mb-3.5 sm:mb-4"
                  >
                    {showSeriesTab && (
                      <button
                        type="button"
                        onClick={() => setActiveContentTab("series")}
                        style={
                          resolvedTab === "series"
                            ? { backgroundColor: c.accentSoft, borderColor: c.accentBorder, color: c.accentText }
                            : {}
                        }
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          resolvedTab === "series"
                            ? "border-transparent shadow-xs"
                            : "text-[#6B5A5D] hover:text-[#241618] border-transparent"
                        }`}
                      >
                        <span>Content ({series ? series.length : 0})</span>
                      </button>
                    )}

                    {showGigsTab && (
                      <button
                        type="button"
                        onClick={() => setActiveContentTab("gigs")}
                        style={
                          resolvedTab === "gigs"
                            ? { backgroundColor: c.accentSoft, borderColor: c.accentBorder, color: c.accentText }
                            : {}
                        }
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          resolvedTab === "gigs"
                            ? "border-transparent shadow-xs"
                            : "text-[#6B5A5D] hover:text-[#241618] border-transparent"
                        }`}
                      >
                        <span>Services ({activePkgs.length})</span>
                      </button>
                    )}

                    {showReviewsTab && (
                      <button
                        type="button"
                        onClick={() => setActiveContentTab("reviews")}
                        style={
                          resolvedTab === "reviews"
                            ? { backgroundColor: c.accentSoft, borderColor: c.accentBorder, color: c.accentText }
                            : {}
                        }
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          resolvedTab === "reviews"
                            ? "border-transparent shadow-xs"
                            : "text-[#6B5A5D] hover:text-[#241618] border-transparent"
                        }`}
                      >
                        <span>Reviews ({approvedReviews.length})</span>
                      </button>
                    )}
                  </div>
                ) : (
                  /* Single Section Heading */
                  <div className="mb-2 px-1">
                    <span style={{ color: c.mutedText }} className="text-[11px] font-bold uppercase tracking-wider">
                      {resolvedTab === "series" ? `CONTENT (${series?.length || 0})` : resolvedTab === "gigs" ? `SERVICES (${activePkgs.length})` : `REVIEWS (${approvedReviews.length})`}
                    </span>
                  </div>
                )}

                {/* TAB 1: CONTENT (SERIES) */}
                {resolvedTab === "series" && (
                  <div className="space-y-2.5 sm:space-y-3 animate-in fade-in duration-200">
                    {series && series.length > 0 ? (
                      <div className="space-y-3">
                        {series.map((s) => (
                          <PreviewSeriesItem
                            key={s.id}
                            series={s}
                            style={style}
                            themeKey={themeKey}
                            username={profile.username}
                            expanded={expandedSeriesId === s.id}
                            isOnboarding={isOnboardingMode}
                            isInformational={isInformationalMode}
                            onSelectSeries={(selected) => setSelectedSeriesDetail(selected)}
                            onToggle={() => {
                              if (isOnboardingMode || isInformationalMode) return;
                              if (typeof window !== "undefined" && window.innerWidth < 640) {
                                setDrawerSeries(s);
                                setIsDrawerOpen(true);
                              } else {
                                setExpandedSeriesId(expandedSeriesId === s.id ? null : s.id);
                              }
                            }}
                          />
                        ))}
                      </div>
                    ) : isPreviewMode ? (
                      <div
                        style={{
                          backgroundColor: c.cardBackground,
                          borderColor: c.border,
                        }}
                        className="rounded-2xl border-2 border-dashed p-5 text-center space-y-1"
                      >
                        <Film style={{ color: c.accentText }} className="h-5 w-5 mx-auto" />
                        <p style={{ color: c.primaryText }} className="font-bold text-xs">
                          {isFinishStepMode ? "No series added yet. You can create one from your dashboard." : "No public series yet"}
                        </p>
                        {!isFinishStepMode && (
                          <p style={{ color: c.mutedText }} className="text-[11px]">Check back soon for upcoming video series &amp; episodes.</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* TAB 2: SERVICES (COLLAB GIGS) */}
                {resolvedTab === "gigs" && (
                  <div className="space-y-2.5 sm:space-y-3 animate-in fade-in duration-200">
                    {(() => {
                      if (activePkgs.length === 0) {
                        if (!isPreviewMode) return null;
                        return (
                          <div
                            style={{
                              backgroundColor: c.cardBackground,
                              borderColor: c.border,
                            }}
                            className="rounded-2xl border-2 border-dashed p-5 text-center space-y-1"
                          >
                            <Briefcase style={{ color: c.accentText }} className="h-5 w-5 mx-auto" />
                            <p style={{ color: c.primaryText }} className="font-bold text-xs">
                              No collaboration services are listed right now
                            </p>
                            <p style={{ color: c.mutedText }} className="text-[11px]">
                              Explore other creator options or check back later.
                            </p>
                          </div>
                        );
                      }

                      const visiblePackages = showAllGigs ? activePkgs : activePkgs.slice(0, 1);
                      const remainingCount = activePkgs.length - 1;

                      return (
                        <div className="space-y-2.5">
                          <div className="grid grid-cols-1 gap-2.5">
                            {visiblePackages.map((pkg) => {
                              const mailSubject = encodeURIComponent(`[Inflixo Collab Inquiry] - ${pkg.title}`);
                              const mailBody = encodeURIComponent(
                                `Hi ${profile.displayName || "Creator"},\n\nI would like to inquire about collaborating on your "${pkg.title}" package listed on Inflixo.\n\nBest regards,\n[Brand Representative]`
                              );
                              const mailUrl = `mailto:${mediaKitSettings?.sponsorEmail || profile.email}?subject=${mailSubject}&body=${mailBody}`;

                              const hasPhone = Boolean(mediaKitSettings?.whatsappNumber && mediaKitSettings.whatsappNumber.trim());
                              const hasEmail = Boolean(mediaKitSettings?.sponsorEmail || profile.email);

                              return (
                                <div
                                  key={pkg.id}
                                  style={{
                                    backgroundColor: c.cardBackground,
                                    borderColor: c.border,
                                    boxShadow: eff.cardShadow,
                                  }}
                                  className="rounded-2xl p-3.5 sm:p-4 space-y-2.5 transition-all text-left border"
                                >
                                  {/* Platform Tag & Price */}
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span
                                        style={{
                                          backgroundColor: c.accentSoft,
                                          borderColor: c.accentBorder,
                                          color: c.accentText,
                                        }}
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider border"
                                      >
                                        {pkg.platform}
                                      </span>
                                      {(pkg.badge || pkg.packageName) && (
                                        <span
                                          style={{
                                            backgroundColor: c.cardBackground,
                                            borderColor: c.border,
                                            color: c.secondaryText,
                                          }}
                                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md border"
                                        >
                                          {pkg.badge || pkg.packageName}
                                        </span>
                                      )}
                                    </div>
                                    <span
                                      style={{
                                        color: c.accentText,
                                        fontFamily: typ.headingFontFamily,
                                      }}
                                      className="text-base font-bold shrink-0"
                                    >
                                      {pkg.price}
                                    </span>
                                  </div>

                                  {/* Title & Delivery Time */}
                                  <div>
                                    <h3
                                      style={{
                                        color: c.primaryText,
                                        fontFamily: typ.headingFontFamily,
                                        fontWeight: typ.headingWeight as any,
                                      }}
                                      className="font-bold text-sm leading-snug"
                                    >
                                      {pkg.title}
                                    </h3>
                                    <p
                                      style={{ color: c.mutedText }}
                                      className="text-[11px] font-medium mt-0.5 flex items-center gap-1"
                                    >
                                      <Clock className="h-3 w-3 shrink-0" /> {pkg.turnaroundDays}-day delivery
                                    </p>
                                  </div>

                                  {/* Deliverables List */}
                                  {pkg.deliverables && pkg.deliverables.length > 0 && (
                                    <ul
                                      style={{
                                        borderColor: c.divider,
                                        color: c.secondaryText,
                                      }}
                                      className="text-xs space-y-1 pt-1.5 border-t"
                                    >
                                      {pkg.deliverables.slice(0, 3).map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                          <span className="leading-snug">{item}</span>
                                        </li>
                                      ))}
                                      {pkg.deliverables.length > 3 && (
                                        <li style={{ color: c.accentText }} className="text-[11px] font-semibold pl-5">
                                          +{pkg.deliverables.length - 3} more deliverables
                                        </li>
                                      )}
                                    </ul>
                                  )}

                                  {/* Direct Contact Actions */}
                                  {(hasPhone || hasEmail) && (
                                    <div
                                      style={{ borderColor: c.divider }}
                                      className={`pt-2 border-t ${
                                        hasPhone && hasEmail ? "grid grid-cols-2 gap-2" : "flex w-full"
                                      }`}
                                    >
                                      {hasPhone && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedGigForWhatsApp(pkg);
                                            setIsLeadModalOpen(true);
                                          }}
                                          className={`bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 px-2.5 rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                                            !hasEmail ? "w-full" : ""
                                          }`}
                                        >
                                          <MessageCircle className="h-3.5 w-3.5 fill-white" />
                                          <span>Enquire on WhatsApp</span>
                                        </button>
                                      )}

                                      {hasEmail && (
                                        <a
                                          href={mailUrl}
                                          style={{
                                            backgroundColor: c.accentSoft,
                                            borderColor: c.accentBorder,
                                            color: c.accentText,
                                          }}
                                          className={`text-xs font-semibold py-2 px-2.5 rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 border shadow-2xs ${
                                            !hasPhone ? "w-full" : ""
                                          }`}
                                        >
                                          <Mail className="h-3.5 w-3.5" />
                                          <span>Send Email</span>
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Toggle More Services */}
                          {activePkgs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setShowAllGigs(!showAllGigs)}
                              style={{
                                backgroundColor: c.cardBackground,
                                borderColor: c.border,
                                color: c.secondaryText,
                              }}
                              className="w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer border"
                            >
                              <span>
                                {showAllGigs
                                  ? "Show fewer services ↑"
                                  : `+ ${remainingCount} more collaboration service${remainingCount > 1 ? "s" : ""} available ↓`}
                              </span>
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* TAB 3: REVIEWS */}
                {resolvedTab === "reviews" && (
                  <div className="space-y-2.5 sm:space-y-3 animate-in fade-in duration-200">
                    {approvedReviews && approvedReviews.length > 0 ? (
                      <div className="space-y-2.5">
                        {/* Rating Summary Header */}
                        {(() => {
                          const total = approvedReviews.length;
                          const avg = (
                            approvedReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / total
                          ).toFixed(1);

                          return (
                            <div
                              style={{
                                backgroundColor: c.cardBackground,
                                borderColor: c.border,
                              }}
                              className="rounded-2xl p-3 border text-left flex items-center justify-between gap-3"
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span style={{ color: c.primaryText }} className="font-bold text-xs sm:text-sm">
                                    {avg} out of 5
                                  </span>
                                  <span style={{ color: c.mutedText }} className="font-bold text-xs">·</span>
                                  <span style={{ color: c.secondaryText }} className="font-medium text-xs">
                                    Based on {total} client review{total > 1 ? "s" : ""}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Individual Review Cards */}
                        {approvedReviews.map((rev) => {
                          const ratingNum = Number(rev.rating) || 5;
                          return (
                            <div
                              key={rev.id}
                              style={{
                                backgroundColor: c.cardBackground,
                                borderColor: c.border,
                                boxShadow: eff.cardShadow,
                              }}
                              className="rounded-2xl p-3.5 sm:p-4 space-y-2 transition-all text-left border"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-0.5 text-amber-400" aria-label={`Rated ${ratingNum} out of 5`}>
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3.5 w-3.5 ${
                                        i < ratingNum
                                          ? "fill-amber-400 text-amber-400"
                                          : "text-slate-200 fill-slate-200"
                                      }`}
                                    />
                                  ))}
                                </div>
                                {rev.projectTitle && (
                                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                    <span
                                      style={{
                                        backgroundColor: c.accentSoft,
                                        borderColor: c.accentBorder,
                                        color: c.accentText,
                                      }}
                                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md border truncate max-w-[140px]"
                                    >
                                      {rev.projectTitle}
                                    </span>
                                    {rev.contentUrl && (
                                      <a
                                        href={rev.contentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: c.accentText }}
                                        className="text-[10px] font-semibold hover:underline flex items-center gap-0.5"
                                      >
                                        <span>View related work ↗</span>
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>

                              {rev.comment && (
                                <p
                                  style={{ color: c.secondaryText }}
                                  className="text-xs font-normal leading-relaxed"
                                >
                                  “{rev.comment}”
                                </p>
                              )}

                              <div
                                style={{ borderColor: c.divider }}
                                className="pt-1.5 flex items-center justify-between text-[11px] border-t"
                              >
                                <div className="min-w-0 flex-1 truncate pr-2">
                                  <span style={{ color: c.primaryText }} className="font-bold">
                                    {rev.clientName}
                                  </span>
                                  {rev.clientDesignation && (
                                    <span style={{ color: c.mutedText }} className="ml-1 font-medium">
                                      • {rev.clientDesignation}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : isPreviewMode ? (
                      <div
                        style={{
                          backgroundColor: c.cardBackground,
                          borderColor: c.border,
                        }}
                        className="rounded-2xl border-2 border-dashed p-5 text-center space-y-1"
                      >
                        <Star className="h-5 w-5 mx-auto text-amber-400" />
                        <p style={{ color: c.primaryText }} className="font-bold text-xs">
                          No public reviews yet
                        </p>
                        <p style={{ color: c.mutedText }} className="text-[11px]">
                          Client ratings will appear here once approved.
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Secondary / Other Social Profiles */}
          {otherSocialsList && otherSocialsList.filter((s) => s.isActive !== false && s.username).length > 0 && (
            <div className="relative z-10 mt-3.5 space-y-1.5 w-full text-left">
              <span style={{ color: c.mutedText }} className="text-[10px] font-bold uppercase tracking-wider px-1 block">
                Secondary &amp; Other Profiles
              </span>
              <div className="grid grid-cols-1 gap-2 w-full">
                {otherSocialsList
                  .filter((s) => s.isActive !== false && s.username)
                  .map((acc) => (
                    <a
                      key={acc.id}
                      href={acc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => { if (isInformationalMode) e.preventDefault(); }}
                      style={{
                        backgroundColor: c.cardBackground,
                        borderColor: c.border,
                        boxShadow: eff.cardShadow,
                      }}
                      className="group rounded-xl p-2.5 sm:p-3 text-xs font-bold transition-all flex items-center justify-between border"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          style={{
                            backgroundColor: c.accentSoft,
                            borderColor: c.accentBorder,
                            color: c.accentText,
                          }}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                        >
                          <AtSign className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <span style={{ color: c.primaryText }} className="truncate block font-bold">{acc.label || acc.platform}</span>
                          <span style={{ color: c.mutedText }} className="text-[10px] font-normal truncate block">
                            @{acc.username.replace(/^@/, "")}
                          </span>
                        </div>
                      </div>
                      <ExternalLink
                        style={{ color: c.secondaryText }}
                        className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                      />
                    </a>
                  ))}
              </div>
            </div>
          )}

          {/* Creator Team Section */}
          {teamData.members && teamData.members.length > 0 && (
            <div className="relative z-10 mt-4 sm:mt-5 space-y-2 w-full text-left">
              <div className="flex items-center justify-between px-1">
                <span style={{ color: c.mutedText }} className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Users style={{ color: c.accentText }} className="h-3 w-3" />
                  {teamData.team?.teamName || "Creator Team"} ({teamData.members.length})
                </span>
              </div>

              <div className={`grid grid-cols-1 ${teamData.members.length === 1 ? "" : "sm:grid-cols-2"} gap-2 sm:gap-2.5 w-full`}>
                {teamData.members.map((member) => (
                  <div
                    key={member.id}
                    style={{
                      backgroundColor: c.cardBackground,
                      borderColor: c.border,
                      boxShadow: eff.cardShadow,
                    }}
                    className="rounded-2xl p-3 sm:p-3.5 transition-all flex items-center justify-between gap-2.5 border"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        style={{
                          backgroundColor: c.accentSoft,
                          borderColor: c.accentBorder,
                          color: c.accentText,
                        }}
                        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full font-extrabold text-xs shrink-0 border"
                      >
                        {getInitials(member.name)}
                      </div>
                      <div className="min-w-0">
                        <p style={{ color: c.primaryText }} className="font-bold text-xs truncate">{member.name}</p>
                        <p style={{ color: c.accentText }} className="text-[10px] font-semibold truncate">
                          {member.role}
                        </p>
                      </div>
                    </div>

                    {member.instagramUrl && (
                      <a
                        href={member.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: c.secondaryText }}
                        className="p-1 rounded-lg transition-colors hover:scale-110"
                      >
                        <InstagramIcon className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Work With Me Banner & Direct Inquiry CTA */}
          {!isOnboardingMode && (
            <div
              style={{
                backgroundColor: "var(--color-surface-alt, #fbfbfb)",
                borderColor: c.border,
                boxShadow: eff.cardShadow,
              }}
              className="relative z-10 mt-7 rounded-2xl p-4 sm:p-5 border transition-all text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
            >
              <div className="space-y-1">
                <h3
                  style={{
                    color: c.primaryText,
                    fontFamily: typ.headingFontFamily,
                    fontWeight: typ.headingWeight as any,
                  }}
                  className="text-xs sm:text-sm font-bold flex items-center gap-1.5"
                >
                  <Briefcase style={{ color: c.accentText }} className="h-4 w-4" />
                  Work with @{profile.username || "creator"}
                </h3>
                <p style={{ color: c.secondaryText }} className="text-[11px] sm:text-xs leading-relaxed">
                  Interested in brand partnerships, sponsorships, or custom campaigns?
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCollabInquiryOpen(true)}
                style={{
                  backgroundColor: c.accentSoft,
                  borderColor: c.accentBorder,
                  color: c.accentText,
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer border shrink-0 w-full sm:w-auto hover:brightness-105"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Brand Inquiry</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* Subtle Inflixo Attribution (32px bottom margin) */}
      <div
        style={{ borderColor: c.divider }}
        className={`relative z-10 mt-auto flex items-center justify-center px-5 pt-5 pb-8 mb-8 select-none border-t ${
          selectedSeriesDetail
            ? ""
            : isFull
            ? "-mx-6 sm:-mx-8 -mb-6 sm:-mb-8 mt-7 sm:mt-8"
            : "-mx-4 sm:-mx-6 -mb-4 sm:-mb-6 mt-7 sm:mt-8"
        }`}
      >
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => { if (isInformationalMode) e.preventDefault(); }}
          style={{
            backgroundColor: c.cardBackground,
            borderColor: c.border,
            color: c.secondaryText,
          }}
          className="tap-scale inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[11px] font-bold shadow-2xs hover:scale-105 transition-all cursor-pointer"
        >
          <span style={{ color: c.accentText }} className="inline-flex items-center">
            <InflixoLogoIcon className="h-3.5 w-3.5" />
          </span>
          <span>Made with Inflixo</span>
        </a>
      </div>
    </div>
  );

  return (
    <div className="relative w-full mx-auto flex-1 flex flex-col min-h-full transition-all max-w-[520px]">
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
    badgeClass: "bg-[#B85C6B] text-white shadow-2xs",
    chipClass: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    textColor: "text-[#B85C6B]",
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
  const { showToast } = useToast();
  const themeMeta = ThemeService.getThemeMeta(themeKey);
  const c = themeMeta.colors;
  const typ = themeMeta.typography;
  const eff = themeMeta.effects;

  const allEpisodes = getSeriesEpisodes(series);
  const genresList = series.genre ? series.genre.split(",").map((g) => g.trim()).filter(Boolean) : [];
  const seriesCategory = genresList.length > 0 ? genresList.join(", ") : (series.genre || "Series");

  const handleShareSeriesLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOnboarding || isInformational) {
      showToast("Series link active on live profile ✨");
      return;
    }
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

  return (
    <div
      id={`series-${series.id}`}
      onClick={() => onSelectSeries ? onSelectSeries(series) : onToggle ? onToggle() : null}
      style={{
        backgroundColor: c.cardBackground,
        borderColor: c.border,
        boxShadow: eff.cardShadow,
      }}
      className="group relative rounded-2xl p-3.5 sm:p-4 transition-all text-left border cursor-pointer hover:scale-[1.01] hover:brightness-[1.02]"
    >
      <div className="flex items-start justify-between gap-3 text-left">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            style={{
              backgroundColor: c.accentSoft,
              borderColor: c.accentBorder,
              color: c.accentText,
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl mt-0.5 border shadow-2xs"
          >
            <Film className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            {/* Platform Badge & Category */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {series.platform && (
                <span
                  style={{
                    backgroundColor: c.accentSoft,
                    borderColor: c.accentBorder,
                    color: c.accentText,
                  }}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border"
                >
                  {series.platform === "YouTube" && <YoutubeIcon className="h-2.5 w-2.5 text-red-500" />}
                  {series.platform === "Instagram" && <InstagramIcon className="h-2.5 w-2.5 text-pink-500" />}
                  {series.platform === "Facebook" && <FacebookIcon className="h-2.5 w-2.5 text-blue-500" />}
                  {series.platform === "Other" && <Globe className="h-2.5 w-2.5 text-purple-400" />}
                  <span>{series.platform}</span>
                </span>
              )}

              <span style={{ color: c.mutedText }} className="text-[10px] font-semibold">
                {seriesCategory}{series.language ? ` • ${series.language}` : ""} • {allEpisodes.length} {allEpisodes.length === 1 ? "Ep" : "Eps"}
              </span>
            </div>

            <h3
              style={{
                color: c.primaryText,
                fontFamily: typ.headingFontFamily,
                fontWeight: typ.headingWeight as any,
              }}
              className="text-sm sm:text-base font-extrabold leading-tight break-words transition-colors group-hover:opacity-90"
            >
              {series.title}
            </h3>

            {series.description && (
              <p
                style={{ color: c.secondaryText }}
                className="text-xs font-normal leading-relaxed line-clamp-2 text-left"
              >
                {series.description}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Share Button & Subtle Navigation Arrow */}
        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
          {!isOnboarding && (
            <button
              type="button"
              onClick={handleShareSeriesLink}
              style={{
                backgroundColor: c.cardBackground,
                borderColor: c.border,
                color: c.secondaryText,
              }}
              className="flex h-7.5 w-7.5 items-center justify-center rounded-xl border transition-all cursor-pointer shadow-2xs hover:scale-105 hover:brightness-105"
              title="Share Series Link"
              aria-label="Share Series"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          )}

          <div
            style={{ color: c.accentText }}
            className="flex h-7.5 w-7.5 items-center justify-center rounded-xl transition-transform group-hover:translate-x-1"
          >
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
