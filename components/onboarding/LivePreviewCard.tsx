"use client";

import type { CreatorProduct } from "@/types";
import { formatProductPrice } from "@/components/products/ProductImage";
import { ProductGrid, ProductGridCard } from "@/components/products/ProductGridCard";

import { useState, useEffect, useRef, Fragment, useMemo, useCallback } from "react";
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
  MessageSquare,
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
  Camera,
  Box,
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
  Compass,
  Info,
} from "lucide-react";
import { TabSectionHeader, TabSectionBody } from "@/components/profile/TabSectionHeader";
import { PackageCard } from "@/components/collab/PackageCard";
import { MediaKitSnapshotCard } from "@/components/collab/MediaKitSnapshotCard";
import { BrandLogosWrap } from "@/components/collab/BrandLogosWrap";
import { CollabEnquirySheet } from "@/components/collab/CollabEnquirySheet";
import { MediaKitV2Content } from "@/components/mediakit/MediaKitV2Content";
import { PublicTeamGroups } from "@/components/team/PublicTeamGroups";
import { PublicSetupGroups, PublicSetupCard, STAGES, getStageForCategory } from "@/components/setup/PublicSetupGroups";
import { EmptyProfileCard } from "@/components/public/EmptyProfileCard";
import {
  CreatorProfile,
  SocialAccounts,
  ThemeKey,
  Series,
  MediaKitPackage,
  MediaKitSettings,
  CustomLink,
  CustomLinkItem,
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
  InstagramOutlineIcon,
  YoutubeOutlineIcon,
  FacebookOutlineIcon,
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
import { FeaturedSeriesCard } from "@/components/series/FeaturedSeriesCard";
import { SeriesPosterCard } from "@/components/series/SeriesPosterCard";
import { PlatformThumbnailBox } from "@/components/shared/PlatformThumbnailBox";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { FocusOverlay } from "@/components/theme/FocusOverlay";
import { BrandLeadQualifierModal } from "@/components/mediakit/BrandLeadQualifierModal";
import { CollaborationInquiryModal } from "@/components/mediakit/CollaborationInquiryModal";
import { EpisodeQuickDrawer } from "@/components/series/EpisodeQuickDrawer";
import { VisibilitySettingsModal } from "@/components/shared/VisibilitySettingsModal";
import { ShareProfileModal } from "@/components/public/ShareProfileModal";
import { ProfileHeader } from "@/components/public/ProfileHeader";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { LinkRow } from "@/components/links/LinkRow";
import { LinkGroupRow } from "@/components/links/LinkGroupRow";
import { getInitials } from "@/lib/avatar";
import { DEFAULT_THEME_KEY } from "@/lib/themeKeys";
import { trackPublicEvent } from "@/lib/publicTrack";
import { AmbientAnimation } from "@/components/theme/AmbientAnimation";
import { ThemeService, getThemeCssVariables } from "@/services/ThemeService";
import {
  calculateTotalFanbase,
  getCreatorEra,
  formatFans,
  getMedalGradient,
} from "@/lib/creatorEra";
import { CreatorEraBadge } from "@/components/shared/CreatorEraBadge";
import { CreatorEraBottomSheet } from "@/components/shared/CreatorEraBottomSheet";
import { AboutMeBlock, FanbaseByPlatform, SocialAccountsBlock } from "@/components/public/about/AboutSections";
import { AudienceSnapshot, CustomCollaboration, WhatBrandsSay, WorkWithMe } from "@/components/public/collab/CollabSections";


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

/** Every value is a theme token (see themes/config.ts); no colours live here. */
const TOKEN_STYLE: ThemeStyleConfig = {
  cardBg: "bg-(--card-bg) border border-(--card-border) text-(--text)",
  profBadgeBg: "bg-(--surface)",
  profBadgeText: "text-(--accent-text)",
  profBadgeBorder: "border-(--surface-border)",
  fanbaseBg: "bg-(--surface)",
  fanbaseText: "text-(--text)",
  socialItemBg: "bg-(--surface) hover:bg-(--accent-soft)",
  socialItemBorder: "border-(--surface-border) hover:border-(--accent)",
  socialNameColor: "text-(--text)",
  socialUnitColor: "text-(--text-muted)",
  nameColor: "text-(--text)",
  bioColor: "text-(--text-muted)",
  handleColor: "text-(--accent-text)",
};

export const THEME_STYLES: Record<string, ThemeStyleConfig> = {
  "inflixo-maroon": TOKEN_STYLE,
};

/** Unknown or removed theme ids render with the default (token) theme. */
export const DEFAULT_THEME_STYLE: ThemeStyleConfig = TOKEN_STYLE;

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
  if (u.includes("youtube.com") || u.includes("youtu.be")) return <YoutubeIcon className={`h-4 w-4 sm:h-4.5 sm:w-4.5 ${BRAND_TEXT.youtube} shrink-0`} />;
  if (u.includes("whatsapp.com") || u.includes("wa.me") || t.includes("whatsapp")) return <WhatsappIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-(--accent-text) shrink-0" />;
  if (u.includes("spotify.com") || t.includes("spotify") || t.includes("podcast")) return <SpotifyIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-(--accent-text) shrink-0" />;
  if (t.includes("ticket") || t.includes("book") || t.includes("tour") || u.includes("bookmyshow") || u.includes("insider.in")) return <Ticket className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-(--accent-text) shrink-0" />;
  if (/\b(merch|merchandise|store|shop|apparel|tees)\b/i.test(t)) return <ShoppingBag className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-(--accent-text) shrink-0" />;
  if (u.includes("instagram.com") || t.includes("instagram")) return <InstagramIcon className={`h-4 w-4 sm:h-4.5 sm:w-4.5 ${BRAND_TEXT.instagram} shrink-0`} />;
  if (t.includes("youtube") || t.includes("membership") || t.includes("subscribe")) return <YoutubeIcon className={`h-4 w-4 sm:h-4.5 sm:w-4.5 ${BRAND_TEXT.youtube} shrink-0`} />;
  if (u.includes("twitter.com") || u.includes("x.com") || t.includes("twitter") || t.includes("tcf x")) return <XTwitterIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" style={{ color: c?.primaryText }} />;
  if (u.includes("linkedin.com") || t.includes("linkedin")) return <LinkedinIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-(--accent-text) shrink-0" />;
  if (u.includes("threads.net") || t.includes("threads")) return <ThreadsIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 shrink-0" style={{ color: c?.primaryText }} />;
  if (u.includes("facebook.com") || t.includes("facebook")) return <FacebookIcon className={`h-4 w-4 sm:h-4.5 sm:w-4.5 ${BRAND_TEXT.facebook} shrink-0`} />;
  if (u.includes("snapchat.com") || t.includes("snapchat")) return <SnapchatIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-(--accent-text) shrink-0" />;
  if (u.includes("twitch.tv") || t.includes("twitch")) return <TwitchIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-(--accent-text) shrink-0" />;
  if (u.includes("pinterest.com") || t.includes("pinterest")) return <PinterestIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-(--accent-text) shrink-0" />;
  if (u.includes("tiktok.com") || t.includes("tiktok")) return <TikTokIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-(--text) shrink-0" />;
  if (u.includes("t.me") || u.includes("telegram")) return <Send className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-(--accent-text) shrink-0" />;
  if (u.includes("discord")) return <MessageCircle className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-(--accent-text) shrink-0" />;
  if (u.startsWith("mailto:")) return <Mail className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-(--accent-text) shrink-0" />;
  return <Globe className="h-4 w-4 sm:h-4.5 sm:w-4.5 shrink-0" style={{ color: c?.accentText || "var(--accent)" }} />;
}

import { formatCategoryDots } from "@/utils/format";
import { BRAND_BG, BRAND_TEXT } from "@/lib/brandColors";
import { getThemeDefinition, themeTokenStyle } from "@/themes/config";
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
  allSocialAccounts?: Array<{
    id?: string | number;
    platform: string;
    username: string;
    followerCount?: number;
    isPrimary?: boolean;
    is_primary?: boolean;
    accountName?: string;
    isVerified?: boolean;
    url?: string;
  }>;
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
  linksOnlyMode?: boolean;
  mediaKitOnlyMode?: boolean;
  teamOnlyMode?: boolean;
  setupOnlyMode?: boolean;
  setupSettings?: { whereIStarted?: string | null };
  allSetupHref?: string;
  /** Secondary public page (series list, reviews, products): compact creator header instead of the full profile header. */
  pageHeader?: { pageLabel: string; backHref: string; backLabel: string };
  showSettingsIcon?: boolean;
  onShare?: () => void;
  hideFooter?: boolean;
  isInformational?: boolean;
  isOnboarding?: boolean;
  isFinishStep?: boolean;
  layoutMode?: "tabs" | "stacked" | "premium";
  allLinksHref?: string;
  initialTab?: CreatorNavTabId;
  /** Marketing landing page demo: shows fan-count breakdown, "My Setup & Shop" in the Shop tab and verified-collab badges. */
  landingDemo?: boolean;
}

export type CreatorNavTabId =
  | "about"
  | "watch"
  | "explore"
  | "collab"
  | "work"
  | "series"
  | "fanbase"
  | "links"
  | "shop"
  | "reviews"
  | "setup";

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
  allSocialAccounts: passedAllSocialAccounts,
  totalAudience: passedTotalAudience,
  themeKey = DEFAULT_THEME_KEY,
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
  linksOnlyMode = false,
  mediaKitOnlyMode = false,
  teamOnlyMode = false,
  setupOnlyMode = false,
  setupSettings,
  pageHeader,
  showSettingsIcon: showSettingsIconProp,
  onShare,
  hideFooter = false,
  isInformational: isInformationalProp,
  isOnboarding: isOnboardingProp,
  isFinishStep: isFinishStepProp,
  layoutMode = "tabs",
  allLinksHref,
  allSetupHref,
  initialTab,
  landingDemo = false,
}: LivePreviewCardProps) {
  const router = useRouter();
  const profile: CreatorProfile = incomingProfile || EMPTY_PROFILE_FALLBACK;
  const socials: SocialAccounts = incomingSocials || EMPTY_SOCIAL_ACCOUNTS;
  const series: Series[] = incomingSeries || [];
  const isListingPage = Boolean(seriesOnlyMode || productsOnlyMode || reviewsOnlyMode || linksOnlyMode || mediaKitOnlyMode || teamOnlyMode || setupOnlyMode);
  const isPremiumLayout = !isListingPage && (layoutMode === "premium" || layoutMode === "stacked");
  const effectiveSeriesPreviewLimit = isPremiumLayout ? 3 : seriesPreviewLimit;
  const displayedSeries = typeof effectiveSeriesPreviewLimit === "number" ? series.slice(0, effectiveSeriesPreviewLimit) : series;
  const { showToast } = useToast();
  const [expandedSeriesMap, setExpandedSeriesMap] = useState<Record<string, boolean>>(() => {
    return series && series.length > 0 ? { [series[0].id]: true } : {};
  });
  const getCanonicalSeriesPlatform = useCallback((s: Series): "YouTube" | "Instagram" | "Facebook" | "Mix" => {
    const p = (s.platform || "").trim().toLowerCase();
    if (p === "mix" || p.includes("mix") || p.includes("multi")) return "Mix";
    if (p.includes("youtube")) return "YouTube";
    if (p.includes("instagram")) return "Instagram";
    if (p.includes("facebook")) return "Facebook";

    const allEps = getSeriesEpisodes(s);
    const firstUrl = (allEps[0]?.externalUrl || "").toLowerCase();
    if (firstUrl.includes("youtube.com") || firstUrl.includes("youtu.be")) return "YouTube";
    if (firstUrl.includes("instagram.com")) return "Instagram";
    if (firstUrl.includes("facebook.com") || firstUrl.includes("fb.watch")) return "Facebook";
    return "YouTube";
  }, []);

  const [seriesFilter, setSeriesFilter] = useState<string>("All");

  const availableSeriesPlatforms = useMemo(() => {
    const set = new Set<"YouTube" | "Instagram" | "Facebook" | "Mix">();
    (series || []).forEach((s) => {
      set.add(getCanonicalSeriesPlatform(s));
    });
    const order: ("YouTube" | "Instagram" | "Facebook" | "Mix")[] = ["YouTube", "Instagram", "Facebook", "Mix"];
    return order.filter((p) => set.has(p));
  }, [series, getCanonicalSeriesPlatform]);

  const [seriesSortOrder, setSeriesSortOrder] = useState<string>("latest");
  const [shopSortOrder, setShopSortOrder] = useState<string>("latest");
  const [isShopSortOpen, setIsShopSortOpen] = useState(false);
  const [openCollectionsMap, setOpenCollectionsMap] = useState<Record<string, boolean>>({});
  const toggleCollection = (id: string) => {
    setOpenCollectionsMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const sortedProducts: CreatorProduct[] = useMemo(() => {
    const list: CreatorProduct[] = [...products];
    if (shopSortOrder === "price_asc") {
      list.sort((a, b) => (a.pricePaise || 0) - (a.pricePaise || 0));
    } else if (shopSortOrder === "price_desc") {
      list.sort((a, b) => (b.pricePaise || 0) - (a.pricePaise || 0));
    } else {
      list.sort((a, b) => (b.isTopPick ? 1 : 0) - (a.isTopPick ? 1 : 0) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
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
  const [isEnquirySheetOpen, setIsEnquirySheetOpen] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const p = new URLSearchParams(window.location.search);
        return p.get("enquire") === "1" || p.get("enquire") === "true";
      } catch {}
    }
    return false;
  });
  const [selectedEnquiryPackage, setSelectedEnquiryPackage] = useState<MediaKitPackage | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<CreatorNavTabId>(() => {
    let urlTab: string | null = null;
    if (typeof window !== "undefined") {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        urlTab = urlParams.get("tab");
      } catch {}
    }
    const raw = (urlTab || initialTab || (profile as any)?.defaultTab || profile.visibilitySettings?.defaultTab) as string | undefined;
    const normalized =
      raw === "series" || raw === "watch" ? "watch" :
      raw === "links" || raw === "explore" ? "links" :
      raw === "shop" || raw === "products" ? "shop" :
      raw === "setup" || raw === "fanbase" || raw === "about" ? "about" :
      raw === "reviews" || raw === "work" || raw === "collab" ? "collab" :
      undefined;

    const hasSeries = Boolean(series && series.length > 0);
    const passedLinks = passedCustomLinks || [];

    if (normalized) {
      if (normalized === "watch" && !hasSeries) {
        if (passedLinks.length > 0) return "links";
        if (products && products.length > 0) return "shop";
        return "about";
      }
      return normalized;
    }

    // Series is hero feature: Watch is the default tab whenever series exist!
    if (hasSeries) return "watch";
    if (passedLinks.length > 0) return "links";
    if (products && products.length > 0) return "shop";
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
  const [allSocialAccountsList, setAllSocialAccountsList] = useState<any[]>(passedAllSocialAccounts || []);
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
      const search = window.location.search;
      const isOwnerParam = search.includes("owner=true") || search.includes("preview=true");
      setIsDashboardPreview(
        showSettingsIconProp ?? (
          pathname.startsWith("/dashboard") ||
          onb ||
          isOwnerParam
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
    if (profile.username === "demo_creator") {
      import("@/data/expertDemoCreator").then(({ EXPERT_DEMO_REVIEWS }) => {
        setApprovedReviews(EXPERT_DEMO_REVIEWS);
      });
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
      return;
    }
    if (profile.username === "demo_creator") {
      import("@/data/expertDemoCreator").then(({ EXPERT_DEMO_TEAM }) => {
        setTeamData(EXPERT_DEMO_TEAM);
      });
      return;
    }
    if (isDashboardPreview) {
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
    if (profile.username) {
      fetch(`/api/creator/team?username=${encodeURIComponent(profile.username)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          const t = json?.data?.team || json?.team;
          const m = json?.data?.members || json?.members || t?.members || [];
          if (t && Array.isArray(m)) {
            setTeamData({ team: t, members: m });
          }
        })
        .catch(() => {});
    }
  }, [passedTeam, isDashboardPreview, profile.username]);

  useEffect(() => {
    if (passedBrands !== undefined) {
      setBrandsList(passedBrands);
    } else if (profile.username === "demo_creator") {
      import("@/data/expertDemoCreator").then(({ EXPERT_DEMO_BRANDS }) => {
        setBrandsList(EXPERT_DEMO_BRANDS);
      });
    } else if (isDashboardPreview) {
      setBrandsList(brandsRepository.getAll());
    }
  }, [passedBrands, isDashboardPreview, profile.username]);

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
    } else if (profile.username === "demo_creator") {
      import("@/data/expertDemoCreator").then(({ EXPERT_DEMO_SETUP_ITEMS }) => {
        setSetupList(EXPERT_DEMO_SETUP_ITEMS);
      });
    } else if (isDashboardPreview) {
      setSetupList(creatorSetupRepository.getAll());
    }
  }, [passedSetupItems, isDashboardPreview, profile.username]);

  useEffect(() => {
    if (passedOtherSocials !== undefined) {
      setOtherSocialsList(passedOtherSocials);
    } else if (profile.username === "demo_creator") {
      import("@/data/expertDemoCreator").then(({ EXPERT_DEMO_OTHER_SOCIALS }) => {
        setOtherSocialsList(EXPERT_DEMO_OTHER_SOCIALS);
      });
    } else if (isDashboardPreview) {
      setOtherSocialsList(otherSocialsRepository.getAll());
    }
  }, [passedOtherSocials, isDashboardPreview, profile.username]);

  useEffect(() => {
    if (passedSections !== undefined) {
      setSectionsList(passedSections);
    } else if (isDashboardPreview) {
      setSectionsList(sectionsRepository.getAll());
    }
  }, [passedSections, isDashboardPreview]);

  useEffect(() => {
    if (passedAllSocialAccounts !== undefined && passedAllSocialAccounts.length > 0) {
      setAllSocialAccountsList(passedAllSocialAccounts);
    } else if (profile.username === "demo_creator") {
      import("@/data/expertDemoCreator").then(({ EXPERT_DEMO_ALL_SOCIAL_ACCOUNTS }) => {
        setAllSocialAccountsList(EXPERT_DEMO_ALL_SOCIAL_ACCOUNTS);
      });
    }
  }, [passedAllSocialAccounts, profile.username]);

  const [mediaKitPackages, setMediaKitPackages] = useState<MediaKitPackage[]>(passedMediaKitPackages || []);
  const [mediaKitSettings, setMediaKitSettings] = useState<MediaKitSettings>(passedMediaKitSettings || MediaKitService.DEFAULT_SETTINGS);
  const [customLinksList, setCustomLinksList] = useState<CustomLink[]>(() => {
    if (seriesOnlyMode || productsOnlyMode || reviewsOnlyMode) return [];
    return passedCustomLinks || [];
  });
  const [selectedGigForWhatsApp, setSelectedGigForWhatsApp] = useState<MediaKitPackage | null>(null);
  const [selectedPackageForInquiry, setSelectedPackageForInquiry] = useState<MediaKitPackage | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [drawerSeries, setDrawerSeries] = useState<Series | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAllGigs, setShowAllGigs] = useState(false);
  const [isProductsExpanded, setIsProductsExpanded] = useState(false);
  const [isSetupExpanded, setIsSetupExpanded] = useState(false);
  const [isLinksExpanded, setIsLinksExpanded] = useState(false);
  const profileScrollRef = useRef<HTMLDivElement | null>(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const [showMoveToTop, setShowMoveToTop] = useState(false);
  // How much of the footer is on screen; the back-to-top button rises by this so it never covers "Powered by".
  const [moveTopLift, setMoveTopLift] = useState(0);
  const footerRef = useRef<HTMLDivElement>(null);
  const updateMoveTopLift = () => {
    const rect = footerRef.current?.getBoundingClientRect();
    const visible = rect ? Math.max(0, Math.min(rect.height, window.innerHeight - rect.top)) : 0;
    setMoveTopLift((prev) => (Math.abs(prev - visible) < 1 ? prev : Math.round(visible)));
  };
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
      : linksOnlyMode
        ? {
          ...visibilitySettings,
          showFanbase: false,
          showCustomLinks: true,
          showCollabGigs: false,
          showSeries: false,
          showReviews: false,
        }
      : mediaKitOnlyMode
        ? {
          ...visibilitySettings,
          showFanbase: false,
          showCustomLinks: false,
          showCollabGigs: true,
          showSeries: false,
          showReviews: false,
        }
      : teamOnlyMode
        ? {
          ...visibilitySettings,
          showFanbase: false,
          showCustomLinks: false,
          showCollabGigs: false,
          showSeries: false,
          showReviews: false,
        }
      : setupOnlyMode
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
  const themeMeta = ThemeService.getThemeMeta(themeKey);
  const style = THEME_STYLES[themeKey] || DEFAULT_THEME_STYLE;
  const usesDarkControls = isDark || themeMeta.mode === "dark";

  useEffect(() => {
    if (seriesOnlyMode || productsOnlyMode || reviewsOnlyMode) {
      setCustomLinksList([]);
      return;
    }
    if (passedCustomLinks !== undefined) {
      setCustomLinksList(passedCustomLinks);
    } else if (safeProfile.username === "demo_creator") {
      import("@/data/expertDemoCreator").then(({ EXPERT_DEMO_CUSTOM_LINKS }) => {
        setCustomLinksList(EXPERT_DEMO_CUSTOM_LINKS);
      });
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
    if (safeProfile.username === "demo_creator") {
      import("@/data/expertDemoCreator").then(({ EXPERT_DEMO_GIGS, EXPERT_DEMO_MEDIA_KIT_SETTINGS }) => {
        setMediaKitPackages(EXPERT_DEMO_GIGS);
        setMediaKitSettings(EXPERT_DEMO_MEDIA_KIT_SETTINGS);
      });
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
  const totalFanbase = useMemo(() => calculateTotalFanbase(socials || safeSocials), [socials, safeSocials]);
  const effectiveFanbase = totalFanbase !== null ? totalFanbase : (typeof profile.peakFanbase === "number" ? profile.peakFanbase : null);
  const creatorEra = useMemo(() => getCreatorEra(effectiveFanbase), [effectiveFanbase]);
  const [bentoEraSheetOpen, setBentoEraSheetOpen] = useState(false);

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
      badgeBg: "bg-gradient-to-tr from-(--accent) via-(--accent) to-(--accent) shadow-xs",
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
      badgeBg: "bg-(--accent) shadow-xs",
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
      badgeBg: "bg-(--accent) shadow-xs",
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
      badgeBg: "bg-(--text) shadow-xs",
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
      badgeBg: "bg-(--accent) shadow-xs",
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
      badgeBg: "bg-(--text) shadow-xs",
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
      badgeBg: "bg-(--accent) shadow-xs",
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
      badgeBg: "bg-(--accent) shadow-xs",
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
      badgeBg: "bg-(--accent) shadow-xs",
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
      badgeBg: "bg-(--accent) shadow-xs",
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

  // Only primary social accounts (YouTube, Instagram, Facebook) fetch/display follower & subscriber counts
  const PRIMARY_SOCIAL_PLATFORMS = useMemo(() => new Set(["youtube", "instagram", "facebook"]), []);
  const fanbaseSocialCards = activeSocialList.filter(
    (s) => PRIMARY_SOCIAL_PLATFORMS.has(s.platform) && (s.hasAccount || s.count > 0)
  );
  const fanbaseSocialGridColumns = `repeat(${Math.min(Math.max(fanbaseSocialCards.length, 1), 3)}, minmax(0, 1fr))`;

  const aboutSocialCards = useMemo(() => {
    const rawList =
      allSocialAccountsList && allSocialAccountsList.length > 0
        ? allSocialAccountsList
        : passedAllSocialAccounts && passedAllSocialAccounts.length > 0
        ? passedAllSocialAccounts
        : null;

    if (rawList && rawList.length > 0) {
      return rawList
        .filter((acc) => !Boolean(acc.isHidden || acc.is_hidden) && (acc.username || (acc.followerCount && acc.followerCount > 0)))
        .map((acc: any) => {
          const platform = (acc.platform || "").toLowerCase();
          const rawHandle = (acc.username || "").replace(/^@/, "");
          const isYoutube = platform === "youtube";
          const isInstagram = platform === "instagram";
          const isFacebook = platform === "facebook";
          const isPrimary = Boolean(acc.isPrimary || acc.is_primary);
          // Follower & subscriber count is only fetched/shown for primary YouTube, Instagram, Facebook
          const isCountEligible = (isYoutube || isInstagram || isFacebook) && isPrimary;
          const count = isCountEligible ? (acc.followerCount || 0) : 0;
          const url =
            acc.url ||
            (isInstagram
              ? `https://instagram.com/${rawHandle}`
              : isYoutube
              ? `https://youtube.com/@${rawHandle}`
              : isFacebook
              ? `https://facebook.com/${rawHandle}`
              : buildSocialUrl(platform, rawHandle));
          const platformLabel =
            platform === "youtube"
              ? "YouTube"
              : platform === "instagram"
              ? "Instagram"
              : platform === "facebook"
              ? "Facebook"
              : platform;
          const label = platformLabel;
          const unit = isYoutube ? "Subscribers" : "Followers";
          return {
            id: acc.id,
            platform,
            platformLabel,
            label,
            handle: rawHandle,
            name: rawHandle,
            count,
            unit,
            url,
            isPrimary,
          };
        });
    }
    return fanbaseSocialCards;
  }, [allSocialAccountsList, passedAllSocialAccounts, fanbaseSocialCards]);

  // "Find me elsewhere": everything except the primary Instagram/YouTube/Facebook accounts,
  // which already appear in "Fanbase by platform". (The fallback list only holds primaries.)
  const extraSocialCards = useMemo(
    () =>
      aboutSocialCards.filter((card: any) => {
        const isMain = PRIMARY_SOCIAL_PLATFORMS.has((card.platform || "").toLowerCase());
        const isPrimary = card.isPrimary === undefined ? isMain : Boolean(card.isPrimary);
        return !(isMain && isPrimary);
      }),
    [aboutSocialCards, PRIMARY_SOCIAL_PLATFORMS]
  );

  const groupedSocials = useMemo(() => {
    const platformOrder = ["instagram", "youtube", "facebook"];
    const titles: Record<string, string> = {
      instagram: "More on Instagram",
      youtube: "More on YouTube",
      facebook: "More on Facebook",
    };
    const groups: Array<{ groupTitle: string | null; platform: string; items: any[] }> = [];
    platformOrder.forEach((plat) => {
      const items = extraSocialCards.filter((c: any) => (c.platform || "").toLowerCase() === plat);
      if (items.length > 0) groups.push({ groupTitle: titles[plat], platform: plat, items });
    });
    const otherItems = extraSocialCards.filter((c: any) => !platformOrder.includes((c.platform || "").toLowerCase()));
    if (otherItems.length > 0) groups.push({ groupTitle: "Also find me on", platform: "other", items: otherItems });
    // A single group needs no sub-heading.
    return groups.length === 1 ? [{ ...groups[0], groupTitle: null }] : groups;
  }, [extraSocialCards]);

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
    setIsShareModalOpen(true);
  };

  const headerTouchStartY = useRef<number | null>(null);
  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    headerTouchStartY.current = e.touches[0].clientY;
  };
  const handleHeaderTouchMove = (e: React.TouchEvent) => {
    if (containedScroll && headerTouchStartY.current !== null && profileScrollRef.current) {
      const deltaY = headerTouchStartY.current - e.touches[0].clientY;
      profileScrollRef.current.scrollTop += deltaY;
      headerTouchStartY.current = e.touches[0].clientY;
    }
  };
  const handleHeaderTouchEnd = () => {
    headerTouchStartY.current = null;
  };

  const handleHeaderWheel = (e: React.WheelEvent) => {
    if (containedScroll && profileScrollRef.current) {
      profileScrollRef.current.scrollTop += e.deltaY;
    }
  };

  const handleContainedScroll = (event: { currentTarget: HTMLDivElement }) => {
    const el = event.currentTarget;
    setShowMoveToTop(el.scrollTop > 200);
    updateMoveTopLift();
    setShowStickyProfileHeader(el.scrollTop > 80);
    setNavScrolled(el.scrollTop > 0);
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
      setNavScrolled(scrollY > 0);
      updateMoveTopLift();
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
  const bleedRadius = "rounded-t-[5px]";

  const themeCssVars = getThemeCssVariables(themeMeta);
  const c = themeMeta.colors;
  const typ = themeMeta.typography;
  const eff = themeMeta.effects;
  const isDefaultCleanLayout = themeKey === DEFAULT_THEME_KEY;

  const surfaceShadow = themeMeta.profileSurface?.shadow || eff.shadow || "var(--card-shadow)";
  const surfaceBorder = themeMeta.profileSurface?.border || c.border;
  const surfaceBg = themeMeta.profileSurface?.background || c.profileBackground;

  const cleanHandle = (profile.username || "").replace(/^@/, "");
  const formattedCategories = formatCategoryDots(profile.category, profile.customCategory);
  const aboutColors = { primary: c.primaryText, secondary: c.secondaryText, muted: c.mutedText, headingFont: typ.headingFontFamily };
  const headerSocialList = activeSocialList.filter((s) => s.hasAccount || s.count > 0 || (s.url && s.url !== "#"));
  const activeTeamMembers = teamData.team?.isActive === false
    ? []
    : (teamData.members || []).filter((member) => member.isActive !== false && member.name?.trim());

  const validLinksList = (customLinksList || []).filter(
    (l) => l.isEnabled !== false && l.title && (l.url || (l.kind === "collection" && l.items?.some((item) => item.isEnabled !== false && item.title && item.url)))
  );
  const validLinksCount = validLinksList.length;

  const hasSeriesContent = !isListingPage && effectiveVisibilitySettings.showSeries !== false && series.length > 0;
  const hasLinksContent = !isListingPage && (
    (effectiveVisibilitySettings.showCustomLinks !== false && validLinksCount > 0) ||
    (isDashboardPreview && effectiveVisibilitySettings.showCustomLinks !== false)
  );
  const hasShopContent = !isListingPage && (products && products.length > 0);
  const validSetupList = (setupList || []).filter((it) => it.isActive !== false);
  const hasSetupContent = !isListingPage && validSetupList.length > 0;

  const navActivePackages = (mediaKitPackages || []).filter((p) => p.isActive);
  const hasMediaKitV2Story = Boolean(
    mediaKitSettings?.intro?.trim() ||
    mediaKitSettings?.nowMaking?.trim() ||
    mediaKitSettings?.audienceDesc?.trim() ||
    (mediaKitSettings?.fitTags && mediaKitSettings.fitTags.length > 0) ||
    (mediaKitSettings?.nofitTags && mediaKitSettings.nofitTags.length > 0) ||
    (mediaKitSettings?.promises && mediaKitSettings.promises.length > 0)
  );
  const hasWorkCollab =
    !isListingPage &&
    effectiveVisibilitySettings.showCollabGigs !== false &&
    (navActivePackages.length > 0 || hasMediaKitV2Story);
  const hasReviewsContent = !isListingPage && effectiveVisibilitySettings.showReviews !== false && approvedReviews.length > 0;

  const hasFanbaseTab = !isListingPage && effectiveVisibilitySettings.showFanbase !== false && (totalAudience > 0 || fanbaseSocialCards.length > 0);
  const hasAboutTab = !isListingPage && (Boolean(profile.bio?.trim()) || hasFanbaseTab || hasSetupContent || activeTeamMembers.length > 0 || (isDashboardPreview && initialTab === "about"));
  const hasWatchTab = hasSeriesContent || (!isListingPage && isDashboardPreview && initialTab === "watch");
  const hasLinksTab = hasLinksContent || (!isListingPage && isDashboardPreview && initialTab === "links");
  const hasShopTab = hasShopContent || (!isListingPage && isDashboardPreview && initialTab === "shop");
  const hasWorkTab = hasWorkCollab || hasReviewsContent || (!isListingPage && isDashboardPreview && initialTab === "collab");

  const aboutTabObj = { id: "about" as CreatorNavTabId, label: "About", icon: User };
  const watchTabObj = { id: "watch" as CreatorNavTabId, label: "Watch", icon: Film };
  const linksTabObj = {
    id: "links" as CreatorNavTabId,
    label: "Links",
    icon: LinkIcon,
  };
  const shopTabObj = {
    id: "shop" as CreatorNavTabId,
    label: "Shop",
    icon: ShoppingBag,
  };
  const collabTabObj = {
    id: "collab" as CreatorNavTabId,
    label: "Collab",
    icon: Briefcase,
  };

  const navTabs: { id: CreatorNavTabId; label: string; icon: any; count?: number | string }[] = [];
  if (hasWatchTab) {
    navTabs.push(watchTabObj);
    if (hasLinksTab) navTabs.push(linksTabObj);
    if (hasShopTab) navTabs.push(shopTabObj);
    if (hasAboutTab) navTabs.push(aboutTabObj);
    if (hasWorkTab) navTabs.push(collabTabObj);
  } else if (hasLinksTab) {
    navTabs.push(linksTabObj);
    if (hasShopTab) navTabs.push(shopTabObj);
    if (hasAboutTab) navTabs.push(aboutTabObj);
    if (hasWorkTab) navTabs.push(collabTabObj);
  } else if (hasShopTab) {
    navTabs.push(shopTabObj);
    if (hasAboutTab) navTabs.push(aboutTabObj);
    if (hasWorkTab) navTabs.push(collabTabObj);
  } else if (hasAboutTab) {
    navTabs.push(aboutTabObj);
    if (hasWorkTab) navTabs.push(collabTabObj);
  } else if (hasWorkTab) {
    navTabs.push(collabTabObj);
  }

  // Profile is fresh/empty if creator has not added bio, socials, series, links, products, setups, or collab packages
  const isProfileEmpty =
    !isListingPage &&
    !Boolean(profile.bio?.trim()) &&
    fanbaseSocialCards.length === 0 &&
    series.length === 0 &&
    validLinksCount === 0 &&
    (!products || products.length === 0) &&
    validSetupList.length === 0 &&
    navActivePackages.length === 0 &&
    approvedReviews.length === 0 &&
    activeTeamMembers.length === 0;

  const isTabsLayout = !isPremiumLayout && !isListingPage && !isProfileEmpty && navTabs.length >= 1;

  // collab_package_view: once per page view per package, when the Collab section shows its card.
  const collabSectionVisible =
    !isListingPage &&
    (!isTabsLayout || activeNavTab === "collab" || activeNavTab === "work") &&
    effectiveVisibilitySettings.showCollabGigs !== false;
  const activePackageIds = navActivePackages.map((p) => String(p.id)).join("|");
  const viewedPackagesRef = useRef(new Set<string>());
  useEffect(() => {
    if (!collabSectionVisible || isInformationalMode || !activePackageIds) return;
    for (const id of activePackageIds.split("|")) {
      if (viewedPackagesRef.current.has(id)) continue;
      viewedPackagesRef.current.add(id);
      trackPublicEvent("collab_package_view", id);
    }
  }, [collabSectionVisible, isInformationalMode, activePackageIds]);

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
      const tabParam = urlParams.get("tab");
      const target = tabParam || initialTab;
      const normalizedTab: CreatorNavTabId | null =
        target === "fanbase" || target === "about" || target === "setup" ? "about" :
        target === "series" || target === "watch" ? "watch" :
        target === "links" || target === "explore" ? "links" :
        target === "shop" || target === "products" ? "shop" :
        target === "reviews" || target === "work" || target === "collab" ? "collab" :
        (target as CreatorNavTabId | null);

      if (normalizedTab && navTabs.some((t) => t.id === normalizedTab)) {
        setActiveNavTab(normalizedTab);
        if (tabParam === "work" || tabParam === "reviews") {
          try {
            const url = new URL(window.location.href);
            url.searchParams.set("tab", "collab");
            window.history.replaceState({}, "", url.toString());
          } catch {}
        }
        return;
      }
      if (!tabParam && !initialTab && navTabs.length > 0) {
        setActiveNavTab(navTabs[0].id);
        return;
      }
    }
    if (navTabs.length > 0 && !navTabs.some((t) => t.id === activeNavTab)) {
      setActiveNavTab(navTabs[0].id);
    }
  }, [navTabs, initialTab]);

  const resetContentScrollToTop = () => {
    if (profileScrollRef.current) {
      profileScrollRef.current.scrollTop = 0;
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    // Double ensure after DOM updates
    requestAnimationFrame(() => {
      if (profileScrollRef.current) {
        profileScrollRef.current.scrollTop = 0;
      }
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    });
  };

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
    resetContentScrollToTop();
  };

  useEffect(() => {
    const tabEl = document.getElementById(`tab-${activeNavTab}`);
    if (tabEl) {
      tabEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
    checkTabScroll();
    resetContentScrollToTop();
  }, [activeNavTab]);

  const handleGetPackage = (pkg: MediaKitPackage) => {
    setSelectedPackageForInquiry(pkg);
    setSelectedGigForWhatsApp(pkg);

    const whatsappNum = mediaKitSettings?.whatsappNumber?.trim() || (profile as any)?.whatsappNumber?.trim() || (profile as any)?.phone?.trim() || "";
    const contactEmail = mediaKitSettings?.sponsorEmail?.trim() || profile.email?.trim() || "";

    const rawPrice = pkg.price?.trim() || "";
    const displayPrice = rawPrice ? (rawPrice.startsWith("₹") ? rawPrice : `₹${rawPrice}`) : "Custom Price";
    const creatorName = profile.displayName || "Creator";
    const profileUrl = typeof window !== "undefined" ? window.location.href : `https://inflixo.com/${cleanHandle || "creator"}`;
    const deliverablesList = pkg.deliverables?.length ? `\n• Deliverables: ${pkg.deliverables.join(", ")}` : "";

    // 1. Agar creator ne phone / WhatsApp number diya ho -> directly open WhatsApp with pre-filled package inquiry message:
    if (whatsappNum) {
      const cleanDigits = whatsappNum.replace(/\D/g, "");
      const fullPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
      const waText = `Hi ${creatorName}, I want to book your "${pkg.title}" package (${displayPrice}) listed on your Inflixo profile (${profileUrl}).${deliverablesList}\n\nPlease share your availability and collaboration details!`;
      const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(waText)}`;

      showToast(`Opening WhatsApp for "${pkg.title}"... ✨`);
      window.open(waUrl, "_blank", "noopener,noreferrer");
      return;
    }

    // 2. Agar email dala ho (aur phone number nahi hai) -> directly open Email with pre-filled package inquiry:
    if (contactEmail) {
      const subject = `Collaboration Inquiry: ${pkg.title} (${displayPrice}) - ${creatorName}`;
      const body = `Hi ${creatorName},\n\nI want to book your "${pkg.title}" collaboration package (${displayPrice}) listed on your Inflixo profile (${profileUrl}).${deliverablesList}\n\nPlease let me know your availability and next steps!\n\nBest regards,\n[Your Name / Brand Name]\n[Contact Info]`;
      const mailtoUrl = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      showToast(`Opening Email for "${pkg.title}"... ✨`);
      try {
        window.open(mailtoUrl, "_blank");
      } catch {
        window.location.href = mailtoUrl;
      }

      // Also open on-site inquiry modal with pre-selected package as fallback in case mailto has no handler
      setIsCollabInquiryOpen(true);
      return;
    }

    // 3. Fallback: on-site inquiry modal
    setIsCollabInquiryOpen(true);
  };

  const publicSurfaceShadow = "none";

  const cardContent = (
    <div
      data-card-glass={getThemeDefinition(themeMeta.key).tokens["--card-blur"] !== "0px"}
      style={{
        ...themeTokenStyle(themeMeta.key),
        ...themeCssVars,
        backgroundColor: surfaceBg,
        borderColor: surfaceBorder,
        color: c.primaryText,
        fontFamily: typ.fontFamily,
        letterSpacing: typ.letterSpacing,
        ["--desktop-surface-shadow" as any]: isPublicSurface ? "none" : surfaceShadow,
        boxShadow: isPublicSurface ? "none" : undefined,
      }}
      className={`relative w-full max-w-full flex-1 flex flex-col overflow-hidden ${
        containedScroll ? "min-h-0 h-full max-h-full" : "min-h-full"
      } ${
        isPublicSurface
          ? "px-4 pt-[20px] sm:px-5 sm:pt-[20px] rounded-[5px] border profile-card-glass"
          : `${cardPadding ? cardPadding : "px-4 sm:px-5 pt-[20px]"} rounded-[5px] border shadow-none`
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

      {/* 1. FIXED TOP HEADER AREA (Horizontal Compact ProfileHeader) */}
      <div
        onWheel={handleHeaderWheel}
        onTouchStart={handleHeaderTouchStart}
        onTouchMove={handleHeaderTouchMove}
        onTouchEnd={handleHeaderTouchEnd}
        className="shrink-0 w-full z-20"
      >
        <ProfileHeader
          navScrolled={navScrolled}
          displayName={profile.displayName || "Creator Name"}
          username={profile.username || "creator"}
          photoUrl={profile.photoDataUrl}
          isVerified={profile.isVerified !== false}
          tagline={
            effectiveVisibilitySettings.showContentCategory !== false && formattedCategories
              ? formattedCategories.replace(/\s*[•·,]\s*/g, " . ")
              : null
          }
          socialList={headerSocialList}
          totalAudience={totalAudience}
          fanbasePlatformCount={fanbaseSocialCards.length}
          singlePlatformName={fanbaseSocialCards[0]?.label || "Instagram"}
          platformBreakdown={fanbaseSocialCards.map((s) => ({
            platform: s.platform,
            shortLabel:
              s.platform === "instagram"
                ? "IG"
                : s.platform === "youtube"
                ? "YT"
                : s.platform === "facebook"
                ? "FB"
                : s.label.slice(0, 3).toUpperCase(),
            label: s.label,
            count: s.count,
          }))}
          fansLabel={landingDemo ? "total fans" : undefined}
          showPlatformBreakdown={landingDemo}
          eraBadge={creatorEra?.badge}
          creatorEra={creatorEra}
          pageHeader={pageHeader}
          isListingPage={isListingPage}
          mediaKitHref={
            containedScroll && cleanHandle && cleanHandle !== "demo_creator" && !isDashboardPreview && !pageHeader
              ? `/${cleanHandle}/mediakit`
              : undefined
          }
          usesDarkControls={usesDarkControls}
          onShareClick={handleShareClick}
          onFanbaseClick={() => handleTabChange("about")}
          onWorkWithMe={
            isTabsLayout && !isListingPage && navTabs.some((t) => t.id === "collab")
              ? () => handleTabChange("collab")
              : undefined
          }
        />

        {/* Navigation Tabs Bar - Fixed at bottom of top header (Never scrolls) */}
        {isTabsLayout && (
          <div className="relative z-20 mt-1.5 sm:mt-2 -mx-4 sm:-mx-5 text-left select-none border-y border-solid border-(--divider) bg-transparent">
            <div
              ref={navScrollRef}
              role="tablist"
              aria-label="Creator content sections"
              className="flex items-stretch min-w-full overflow-x-auto scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-x-contain scroll-smooth bg-transparent"
            >
              {navTabs.map((tab) => {
                const isActive = activeNavTab === tab.id;
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    data-profile-tab=""
                    id={`tab-${tab.id}`}
                    aria-controls={`section-${tab.id}`}
                    aria-selected={isActive}
                    onClick={() => handleTabChange(tab.id)}
                    style={{ color: isActive ? "var(--tab-active)" : "var(--tab-inactive)" }}
                    className={`group/tab relative flex-1 min-w-0 shrink-0 flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 min-[360px]:px-2 sm:px-3 py-1.5 sm:py-2 min-h-[38px] sm:min-h-[40px] rounded-none text-[11px] min-[360px]:text-[11.5px] sm:text-xs md:text-[12.5px] font-bold border-r border-solid border-(--divider) last:border-r-0 transition-colors duration-150 cursor-pointer whitespace-nowrap select-none bg-transparent ${isActive
                        ? ""
                        : "hover:bg-(--surface)/80 hover:text-(--text)"
                      }`}
                  >
                    {/* Active indicator: straight 2px bar across the whole tab, square ends. */}
                    {isActive && (
                      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] rounded-none bg-(--tab-indicator)" />
                    )}
                    <IconComponent
                      style={{ color: isActive ? "var(--icon-active)" : "var(--icon)" }}
                      className={`h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 transition-opacity ${isActive
 ? "opacity-100"
                          : "opacity-60 group-hover/tab:opacity-90"
                        }`}
                    />
                    <span className="shrink-0">{tab.label}</span>
                    {tab.count !== undefined && tab.count !== null && tab.count !== 0 && tab.count !== "" && (
                      <span
                        style={{
                          backgroundColor: isActive
                            ? "var(--accent-soft)"
                            : "var(--surface)",
                          color: isActive
                            ? "var(--tab-active)"
                            : "var(--tab-inactive)",
                        }}
                        className="text-[9px] sm:text-[9.5px] font-black px-1.5 py-0.5 rounded-[3px] tabular-nums shrink-0"
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

        {/* Divider below ProfileHeader on Standalone Listing Pages & Dashboard Previews */}
        {isListingPage && (
          <div className="relative z-20 mt-2.5 sm:mt-3 -mx-4 sm:-mx-5 select-none bg-(--card-bg)">
            <div style={{ backgroundColor: c.divider }} className="h-px opacity-60" aria-hidden="true" />

            {/* Title & Subtitle for Reviews */}
            {reviewsOnlyMode && (
              <>
                <div className="px-4 sm:px-5 pt-2.5 pb-2 text-left">
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
                <div style={{ backgroundColor: c.divider }} className="h-px opacity-60" aria-hidden="true" />
              </>
            )}

            {/* Title & Subtitle for Media Kit */}
            {mediaKitOnlyMode && (
              <>
                <div className="px-4 sm:px-5 pt-2.5 pb-2 text-left">
                  <div className="flex items-center justify-between px-0.5">
                    <h2
                      style={{
                        color: c.primaryText,
                        fontFamily: typ.headingFontFamily,
                        fontWeight: 700,
                      }}
                      className={`flex items-center gap-1.5 ${PUBLIC_TYPE.sectionTitle}`}
                    >
                      <Briefcase className="h-3.5 w-3.5 opacity-70" style={{ color: c.primaryText }} />
                      <span>Media Kit</span>
                    </h2>
                    <a
                      href={`/api/creator/mediakit/pdf?username=${encodeURIComponent(cleanHandle || "creator")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: c.accentText || c.primaryText }}
                      className="text-[11px] sm:text-xs font-semibold hover:underline"
                    >
                      Download PDF
                    </a>
                  </div>
                  <p
                    style={{ color: c.secondaryText }}
                    className="text-[11px] sm:text-xs font-normal px-0.5 mt-0.5"
                  >
                    Who I am, the people who tune in, and how we can work together.
                  </p>
                </div>
                <div style={{ backgroundColor: c.divider }} className="h-px opacity-60" aria-hidden="true" />
              </>
            )}
          </div>
        )}
      </div>

      {/* 2. SCROLLABLE TAB CONTENT AREA (Smoothly scrolls under the fixed tab bar) */}
      <div
        ref={profileScrollRef}
        onScroll={containedScroll ? handleContainedScroll : undefined}
        className={`relative z-10 flex-1 w-full flex flex-col ${
          containedScroll
            ? "min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : ""
        } pt-1.5 sm:pt-2 pb-6`}
      >

        {/* Fresh / In-Progress Profile State: Warm emotional visitor welcome & interactive nudge */}
        {isProfileEmpty && (
          <EmptyProfileCard
            creatorName={profile.displayName || profile.username || "Creator"}
            creatorId={profile.id}
            creatorUsername={profile.username}
            isDashboardPreview={isDashboardPreview}
          />
        )}

        {/* 4. About Section */}
        {!isListingPage && !isProfileEmpty && (isPremiumLayout || (!isTabsLayout ? true : (activeNavTab === "about" || activeNavTab === "fanbase"))) && (profile.bio?.trim() || effectiveVisibilitySettings.showFanbase !== false || isDashboardPreview) && (
          <div
            id="about-section"
            style={
              isPremiumLayout
                ? {
                    backgroundColor: "color-mix(in srgb, var(--accent) 4.5%, var(--surface))",
                    borderColor: "var(--surface-border)",
                  }
                : undefined
            }
            className={`relative z-10 w-full text-left animate-fade-in ${
              isPremiumLayout
                ? "order-[4] mt-5 sm:mt-6 p-3.5 sm:p-4 rounded-[5px] border shadow-xs space-y-3"
                : isTabsLayout
                ? "order-[4] mt-1 sm:mt-1.5"
                : "order-[4] mt-4 sm:mt-5 space-y-2"
            }`}
          >
            {!isTabsLayout && (
              <TabSectionHeader
                title="About"
                subtitle="Get to know me & find my socials."
                action={
                  isPremiumLayout ? (
                    <span
                      style={{
                        color: "var(--accent-text)",
                        backgroundColor: "color-mix(in srgb, var(--accent) 12%, var(--surface))",
                        borderColor: "var(--surface-border)",
                      }}
                      className="text-[10.5px] sm:text-[11px] font-bold px-2 py-0.5 rounded-[4px] border uppercase tracking-wider shrink-0"
                    >
                      Bio &amp; Reach
                    </span>
                  ) : undefined
                }
                primaryTextColor={c.primaryText}
                secondaryTextColor={c.secondaryText}
                headingFontFamily={typ.headingFontFamily}
              />
            )}

            <div className="space-y-2">
              {/* 1. About me: bio + location + languages + content tags (hidden on public when no bio) */}
              <AboutMeBlock
                bio={
                  profile.bio?.trim() ? (
                    <ExpandableText
                      text={profile.bio}
                      style={{ color: c.primaryText }}
                      className="text-xs sm:text-[12.5px] leading-relaxed font-normal break-words"
                      buttonStyle={{ color: c.accentText || c.primaryText }}
                      buttonClassName="mt-1 inline-flex items-center gap-0.5 text-[11px] font-bold hover:underline cursor-pointer select-none"
                    />
                  ) : null
                }
                location={[profile.city, profile.state, profile.country].map((v) => (v || "").trim()).filter(Boolean).join(", ") || null}
                languages={(Array.isArray(mediaKitSettings?.contentLanguages)
                  ? mediaKitSettings.contentLanguages
                  : String(mediaKitSettings?.contentLanguages || "").split(",")
                ).map((l) => String(l).trim()).filter(Boolean)}
                tags={formattedCategories ? formattedCategories.split(" · ") : []}
                ownerPreview={isDashboardPreview}
                showHeader={!isPremiumLayout}
                colors={aboutColors}
              />

              {/* 2. Fanbase by platform (primary accounts) — replaces the duplicate Era/Fans card */}
              {effectiveVisibilitySettings.showFanbase !== false && (
                <FanbaseByPlatform
                  items={fanbaseSocialCards.map((s) => ({ platform: s.platform, label: s.label, handle: s.handle, unit: s.unit, count: Number(s.count) || 0 }))}
                  total={totalAudience}
                  colors={aboutColors}
                />
              )}
            </div>
          </div>
        )}

        {/* 9. My Setup Section (on About tab or standalone setupOnlyMode) */}
        {(setupOnlyMode || (!isListingPage && (isPremiumLayout || (!isTabsLayout ? true : activeNavTab === "about")))) && (() => {
          const activeSetupItems = (setupList || []).filter((it) => it.isActive !== false && it.name?.trim());
          if (activeSetupItems.length === 0 && !isDashboardPreview && !setupOnlyMode) return null;

          const cleanHandle = (profile.username || "").replace(/^@/, "");
          const setupHref = allSetupHref || (cleanHandle ? `/${cleanHandle}/setup` : "/dashboard/setup");

          if (setupOnlyMode) {
            return (
              <div id="setup-section" className="relative z-10 w-full text-left animate-fade-in order-[5] mt-1 sm:mt-1.5 space-y-4">
                {activeSetupItems.length > 0 ? (
                  <PublicSetupGroups
                    items={activeSetupItems}
                    variant="standalone"
                    whereIStarted={setupSettings?.whereIStarted}
                    primaryTextColor={c.primaryText}
                    secondaryTextColor={c.secondaryText}
                    mutedTextColor={c.mutedText}
                    accentColor={c.accent}
                    borderColor={c.border}
                    cardBgColor={c.profileBackground}
                    isInformational={isInformationalMode}
                  />
                ) : (
                  <div
                    style={{ borderColor: "var(--surface-border)" }}
                    className="rounded-[5px] border p-8 text-center"
                  >
                    <Laptop className="mx-auto h-8 w-8 mb-2 opacity-50" style={{ color: c.mutedText }} />
                    <p style={{ color: c.mutedText }} className="text-xs font-medium">
                      No setup items added yet.
                    </p>
                  </div>
                )}
              </div>
            );
          }

          // About tab: show 4 items + "See full setup →"
          const displayItems = activeSetupItems.slice(0, 4);

          return (
            <div
              id="setup-section"
              className={`relative z-10 w-full text-left animate-fade-in ${
                isPremiumLayout
                  ? "order-[5] mt-5 sm:mt-6 space-y-3"
                  : isTabsLayout
                  ? "order-[4] mt-1.5 sm:mt-2 space-y-2"
                  : "order-[5] mt-6 sm:mt-7 space-y-2"
              }`}
            >
              {isPremiumLayout && (
                <TabSectionHeader
                  title="My Setup"
                  subtitle={setupSettings?.whereIStarted || "The tools, gear and software behind my content."}
                  action={
                    <span
                      style={{
                        color: "var(--accent-text)",
                        backgroundColor: "color-mix(in srgb, var(--accent) 12%, var(--surface))",
                        borderColor: "var(--surface-border)",
                      }}
                      className="text-[10.5px] sm:text-[11px] font-bold px-2 py-0.5 rounded-[4px] border uppercase tracking-wider shrink-0"
                    >
                      {activeSetupItems.length} {activeSetupItems.length === 1 ? "Item" : "Items"}
                    </span>
                  }
                  primaryTextColor={c.primaryText}
                  secondaryTextColor={c.secondaryText}
                  headingFontFamily={typ.headingFontFamily}
                />
              )}
              <div
                style={{
                  backgroundColor: "transparent",
                  borderColor: "var(--surface-border)",
                }}
                className="rounded-[5px] border overflow-hidden text-left shadow-none"
              >
                {!isPremiumLayout && (
                  <div
                    style={{
                      backgroundColor: "transparent",
                      borderColor: "var(--surface-border)",
                    }}
                    className="px-3 py-2 sm:px-3.5 sm:py-2.5 border-b flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h2
                          style={{ color: c.primaryText, fontFamily: typ.headingFontFamily }}
                          className="text-sm font-semibold tracking-tight leading-5 text-(--text)"
                        >
                          My Setup
                        </h2>
                      </div>
                      <p style={{ color: c.mutedText }} className="text-xs font-normal leading-[18px] text-(--text-muted) mt-0.5">
                        {setupSettings?.whereIStarted?.trim() || "The tools, gear and software behind my content."}
                      </p>
                    </div>
                    <span style={{ color: c.mutedText }} className="text-[11px] font-normal shrink-0 text-(--text-muted)">
                      {activeSetupItems.length} items
                    </span>
                  </div>
                )}

                {/* 4 items grouped by stage: Shoot / Sound / Light / Edit / Ideas & AI */}
                <div className="p-2 sm:p-2.5 space-y-3">
                  {STAGES.map((stageDef) => {
                    const stageItems = displayItems.filter(
                      (it) => getStageForCategory(it.category) === stageDef.id
                    );
                    if (stageItems.length === 0) return null;
                    const StageIcon = stageDef.icon;
                    return (
                      <div key={stageDef.id} className="space-y-1.5">
                        <div className="flex items-center gap-1.5 px-0.5">
                          <StageIcon className="h-3.5 w-3.5" style={{ color: c.accent }} />
                          <span
                            style={{ color: c.mutedText }}
                            className="text-[11px] font-bold uppercase tracking-wider"
                          >
                            {stageDef.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {stageItems.map((item) => (
                            <PublicSetupCard
                              key={item.id}
                              item={item}
                              primaryTextColor={c.primaryText}
                              secondaryTextColor={c.secondaryText}
                              mutedTextColor={c.mutedText}
                              accentColor={c.accent}
                              borderColor={c.border}
                              cardBgColor={c.profileBackground}
                              isInformational={isInformationalMode}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom link: "See full setup →" */}
                <div style={{ borderColor: "var(--surface-border)" }} className="border-t">
                  <Link
                    href={setupHref}
                    className="w-full py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-opacity hover:opacity-80 text-center cursor-pointer"
                    style={{ color: c.accent }}
                  >
                    <span>See full setup</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 10. Social Accounts Section */}
        {!isListingPage && effectiveVisibilitySettings.showFanbase !== false && (isPremiumLayout || (!isTabsLayout ? true : (activeNavTab === "about" || activeNavTab === "fanbase"))) && extraSocialCards.length > 0 && (
          <div id="socials-section" className={`relative z-10 w-full text-left animate-fade-in ${isPremiumLayout ? "order-[9] mt-5 sm:mt-6 space-y-3" : isTabsLayout ? "order-[4] mt-1 sm:mt-1.5 space-y-2" : "order-[10] mt-6 sm:mt-7 space-y-2"}`}>
            {isPremiumLayout && (
              <TabSectionHeader
                title="Find me elsewhere"
                subtitle="My other channels & profiles — come say hi!"
                action={
                  <span
                    style={{
                      color: "var(--accent-text)",
                      backgroundColor: "color-mix(in srgb, var(--accent) 12%, var(--surface))",
                      borderColor: "var(--surface-border)",
                    }}
                    className="text-[10.5px] sm:text-[11px] font-bold px-2 py-0.5 rounded-[4px] border uppercase tracking-wider shrink-0"
                  >
                    {extraSocialCards.length} More
                  </span>
                }
                primaryTextColor={c.primaryText}
                secondaryTextColor={c.secondaryText}
                headingFontFamily={typ.headingFontFamily}
              />
            )}
            <SocialAccountsBlock
              groups={groupedSocials.map((g) => ({ groupTitle: g.groupTitle, items: g.items }))}
              total={extraSocialCards.length}
              colors={aboutColors}
              showHeader={!isPremiumLayout}
              onLinkClick={(item) => {
                if (isInformationalMode) {
                  showToast(`Redirects to ${item.label || item.platform} on live profile ✨`);
                  return false;
                }
                return true;
              }}
            />
          </div>
        )}

        {/* 2. Links Section */}
        {(linksOnlyMode || (!isListingPage && (isPremiumLayout || !isTabsLayout || activeNavTab === "explore" || activeNavTab === "links"))) && (
          (() => {
            const validLinks = (customLinksList || []).filter(
              (l) => l.isEnabled !== false && l.title && (l.url || (l.kind === "collection" && l.items?.some((item) => item.isEnabled !== false && item.title && item.url)))
            );

            // Empty state for owner preview; hide for public
            if (validLinks.length === 0) {
              if (isDashboardPreview || linksOnlyMode) {
                return (
                  <div id="links-section" className={`relative z-10 w-full text-left animate-fade-in ${isPremiumLayout ? "order-[2] mt-4 sm:mt-5" : linksOnlyMode ? "order-[5] mt-1.5 sm:mt-2" : isTabsLayout ? "order-[5] mt-1.5 sm:mt-2" : "order-[5] mt-6 sm:mt-7"}`}>
                    <TabSectionHeader
                      title="Links"
                      subtitle="Recommended links, tickets & websites"
                      primaryTextColor={c.primaryText}
                      secondaryTextColor={c.secondaryText}
                      headingFontFamily={typ.headingFontFamily}
                    />
                    <div className="rounded-[5px] border border-dashed border-(--surface-border) p-8 text-center my-2">
                      <div className="w-10 h-10 rounded-full bg-(--surface) flex items-center justify-center mx-auto mb-2 text-(--text-muted)">
                        <LinkIcon className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold text-(--text) ">No links yet</p>
                      <p className="text-xs text-(--text-muted) mt-0.5">Add your recommended links in the dashboard</p>
                    </div>
                  </div>
                );
              }
              return null;
            }

            // Find pinned link (max 1 per creator).
            let pinnedLink: (CustomLink | CustomLinkItem) | null = null;
            for (const link of validLinks) {
              if (link.isPinned && link.kind !== "collection") {
                pinnedLink = link;
                break;
              }
            }
            if (!pinnedLink) {
              for (const group of validLinks) {
                if (group.kind === "collection" && group.items) {
                  const found = group.items.find((item) => item.isPinned && item.isEnabled !== false && item.title && item.url);
                  if (found) {
                    pinnedLink = found;
                    break;
                  }
                }
              }
            }

            const remainingItems = validLinks
              .map((link) => {
                if (link.kind === "collection") {
                  const filteredItems = (link.items || []).filter(
                    (it) => it.isEnabled !== false && it.title && it.url && String(it.id) !== String(pinnedLink?.id)
                  );
                  return {
                    ...link,
                    items: filteredItems,
                  };
                }
                return link;
              })
              .filter((link) => {
                if (pinnedLink && String(link.id) === String(pinnedLink.id)) {
                  return false;
                }
                if (link.kind === "collection" && (!link.items || link.items.length === 0)) {
                  return false;
                }
                return true;
              });

            const maxLinks = isPremiumLayout ? (pinnedLink ? 9 : 10) : undefined;
            const displayedRemainingItems = typeof maxLinks === "number" ? remainingItems.slice(0, maxLinks) : remainingItems;
            const hasMoreLinks = validLinks.length > (pinnedLink ? displayedRemainingItems.length + 1 : displayedRemainingItems.length);

            return (
              <div
                id="links-section"
                style={
                  isPremiumLayout
                    ? {
                        backgroundColor: "color-mix(in srgb, var(--accent) 4.5%, var(--surface))",
                        borderColor: "var(--surface-border)",
                      }
                    : undefined
                }
                className={`relative z-10 w-full text-left animate-fade-in ${
                  isPremiumLayout
                    ? "order-[2] mt-5 sm:mt-6 p-3.5 sm:p-4 rounded-[5px] border shadow-xs space-y-2.5"
                    : linksOnlyMode
                    ? "order-[5] mt-1.5 sm:mt-2"
                    : isTabsLayout
                    ? "order-[5] mt-1.5 sm:mt-2"
                    : "order-[5] mt-6 sm:mt-7"
                }`}
              >
                <TabSectionHeader
                  title="Links"
                  subtitle="Recommended links, tickets & websites"
                  action={
                    isPremiumLayout ? (
                      <span
                        style={{
                          color: "var(--accent-text)",
                          backgroundColor: "color-mix(in srgb, var(--accent) 12%, var(--surface))",
                          borderColor: "var(--surface-border)",
                        }}
                        className="text-[10.5px] sm:text-[11px] font-bold px-2 py-0.5 rounded-[4px] border uppercase tracking-wider shrink-0"
                      >
                        {validLinks.length} {validLinks.length === 1 ? "Link" : "Links"}
                      </span>
                    ) : undefined
                  }
                  primaryTextColor={c.primaryText}
                  secondaryTextColor={c.secondaryText}
                  headingFontFamily={typ.headingFontFamily}
                />

                <div className="space-y-2 w-full">
                  {/* Pinned Link */}
                  {pinnedLink && (
                    <LinkRow
                      link={pinnedLink}
                      isPinned={true}
                      onClick={(e) => {
                        if (isInformationalMode) {
                          e.preventDefault();
                          showToast(`Opens ${pinnedLink.title} ✨`);
                          return;
                        }
                        trackPublicEvent("link_click", String(pinnedLink.id));
                      }}
                    />
                  )}

                  {/* Direct Links & Groups */}
                  {(() => {
                    let groupIndex = 0;
                    return displayedRemainingItems.map((item) => {
                      if (item.kind === "collection") {
                        const curGroupIndex = groupIndex++;
                        const isExpandedByParam = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("expandGroup") === "1" && curGroupIndex === 0;
                        return (
                          <LinkGroupRow
                            key={item.id}
                            group={item}
                            index={curGroupIndex}
                            initiallyOpen={isExpandedByParam}
                            onLinkClick={(innerLink) => {
                              if (isInformationalMode) {
                                showToast(`Opens ${innerLink.title} ✨`);
                                return;
                              }
                              const childIndex = (item.items || []).indexOf(innerLink);
                              trackPublicEvent("link_click", `${item.id}:${childIndex}`);
                            }}
                          />
                        );
                      }
                      return (
                        <LinkRow
                          key={item.id}
                          link={item}
                          onClick={(e) => {
                            if (isInformationalMode) {
                              e.preventDefault();
                              showToast(`Opens ${item.title} ✨`);
                              return;
                            }
                            trackPublicEvent("link_click", String(item.id));
                          }}
                        />
                      );
                    });
                  })()}
                </div>

                {/* View All Links button when count > 10 */}
                {hasMoreLinks && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (isInformationalMode) {
                          showToast("Opens all creator links ✨");
                          return;
                        }
                        router.push(allLinksHref || `/${cleanHandle || "creator"}/links`);
                      }}
                      className="tap-scale w-full py-2.5 px-4 rounded-[5px] bg-(--surface) hover:bg-(--surface-border) text-(--text) border border-(--surface-border)/80 text-xs sm:text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center shadow-none"
                    >
                      <span>{`View all links (${validLinks.length})`}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                    </button>
                  </div>
                )}
              </div>
            );
          })()
        )}


        {/* 1. Series Section */}
        {(seriesOnlyMode || (!isListingPage && (isPremiumLayout || !isTabsLayout || activeNavTab === "watch" || activeNavTab === "series"))) && effectiveVisibilitySettings.showSeries !== false && (series.length > 0 || seriesOnlyMode || isDashboardPreview) && (
          <div id="series-section" className={`relative z-10 w-full text-left ${isPremiumLayout ? "order-[1] mt-4 sm:mt-5 space-y-2.5" : seriesOnlyMode ? "order-[10] mt-1.5 sm:mt-2 pb-4" : isTabsLayout ? `order-[10] mt-1.5 sm:mt-2 ${isDashboardPreview ? "pb-2" : "pb-12"}` : `order-[10] mt-6 sm:mt-7 space-y-2.5 ${isDashboardPreview ? "pb-2" : "pb-12"}`}`}>
            <TabSectionHeader
              title={isPremiumLayout ? "Series & Playlists" : "Series"}
              subtitle={landingDemo ? "Start from Episode 1." : "Watch episodes in the right order."}
              primaryTextColor={c.primaryText}
              secondaryTextColor={c.secondaryText}
              headingFontFamily={typ.headingFontFamily}
              action={
                availableSeriesPlatforms.length > 0 ? (
                  <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {["All", ...availableSeriesPlatforms].map((plat) => {
                      const isActive = seriesFilter.toLowerCase() === plat.toLowerCase();
                      return (
                        <button
                          key={plat}
                          type="button"
                          onClick={() => setSeriesFilter(plat)}
                          className={`tap-scale px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-full transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                            isActive
                              ? "bg-(--accent) text-(--on-accent) border-(--accent) shadow-xs"
                              : "bg-(--card-bg) text-(--text-muted) border-(--surface-border) hover:text-(--text) hover:bg-(--surface)"
                          }`}
                        >
                          {plat}
                        </button>
                      );
                    })}
                  </div>
                ) : undefined
              }
            />

            {series.length === 0 ? (
              <div
                style={{
                  backgroundColor: c.elevatedBackground,
                  borderColor: c.border,
                }}
                className="rounded-2xl border p-4 text-center space-y-1"
              >
                <p
                  style={{ color: c.primaryText }}
                  className="text-sm font-semibold"
                >
                  No series added yet
                </p>
                <p
                  style={{ color: c.mutedText }}
                  className="text-xs"
                >
                  Stay tuned! Episodes and playlists will appear here soon.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const filtered = displayedSeries.filter((s) => {
                    if (seriesFilter.toLowerCase() === "all") return true;
                    const canonical = getCanonicalSeriesPlatform(s);
                    return canonical.toLowerCase() === seriesFilter.toLowerCase();
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="rounded-[5px] border border-dashed border-(--surface-border) p-6 text-center text-xs text-(--text-muted)">
                        No {seriesFilter} series found.
                      </div>
                    );
                  }

                  return filtered.map((s, idx) => {
                    const allEps = getSeriesEpisodes(s);
                    const epCount = allEps.length;
                    const detectedPlatform = getCanonicalSeriesPlatform(s);

                    if (idx === 0) {
                      return (
                        <FeaturedSeriesCard
                          key={s.id}
                          series={s}
                          creatorHandle={cleanHandle || "creator"}
                          creatorAvatar={safeProfile.photoDataUrl}
                          creatorName={safeProfile.displayName}
                          episodesCount={epCount}
                          detectedPlatform={detectedPlatform}
                          openMode={seriesOpenMode}
                          onOpen={(selected) => {
                            if (onSeriesPreviewOpen) {
                              onSeriesPreviewOpen(selected);
                            } else if (isInformationalMode) {
                              showToast(`Opens ${selected.title} dedicated series page ✨`);
                            } else if (seriesOpenMode === "internal") {
                              setDrawerSeries(selected);
                              setIsDrawerOpen(true);
                            } else {
                              router.push(`/${cleanHandle || "creator"}/series/${selected.id}`);
                            }
                          }}
                        />
                      );
                    }

                    return (
                      <SeriesPosterCard
                        key={s.id}
                        series={s}
                        creatorHandle={cleanHandle || "creator"}
                        creatorAvatar={safeProfile.photoDataUrl}
                        creatorName={safeProfile.displayName}
                        episodesCount={epCount}
                        detectedPlatform={detectedPlatform}
                        openMode={seriesOpenMode}
                        onOpen={(selected) => {
                          if (onSeriesPreviewOpen) {
                            onSeriesPreviewOpen(selected);
                          } else if (isInformationalMode) {
                            showToast(`Opens ${selected.title} dedicated series page ✨`);
                          } else if (seriesOpenMode === "internal") {
                            setDrawerSeries(selected);
                            setIsDrawerOpen(true);
                          } else {
                            router.push(`/${cleanHandle || "creator"}/series/${selected.id}`);
                          }
                        }}
                      />
                    );
                  });
                })()}
              </div>
            )}

            {!seriesOnlyMode && allSeriesHref && series.length > displayedSeries.length && (
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
                  className="tap-scale w-full py-2.5 px-4 rounded-[5px] bg-(--surface) hover:bg-(--surface-border) text-(--text) border border-(--surface-border)/80 text-xs sm:text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center shadow-none"
                >
                  <span>{`View all series (${series.length})`}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Shop / Products Section */}
        {/* 3. Products Section */}
        {((productsOnlyMode || (!isListingPage && (isPremiumLayout || !isTabsLayout || activeNavTab === "shop"))) && ((products && products.length > 0) || productsOnlyMode || isDashboardPreview)) && (
          <section id="shop-section" aria-label="Shop" className={`relative z-10 w-full text-left animate-fade-in ${isPremiumLayout ? "order-[3] mt-5 sm:mt-6 space-y-3" : productsOnlyMode ? "order-[15] mt-1.5 sm:mt-2" : isTabsLayout ? "order-[15] mt-1.5 sm:mt-2" : "order-[15] mt-6 sm:mt-7 space-y-2.5"}`}>
            {landingDemo && (
              <h3
                style={{ color: c.primaryText, fontFamily: typ.headingFontFamily }}
                className="px-0.5 pb-2 text-[13.5px] sm:text-sm font-bold"
              >
                Digital products
              </h3>
            )}
            {!landingDemo && (
              <TabSectionHeader
                title={isPremiumLayout ? "Products" : "Shop"}
                subtitle="Products I use and recommend."
                primaryTextColor={c.primaryText}
                secondaryTextColor={c.secondaryText}
                headingFontFamily={typ.headingFontFamily}
                action={
                  isPremiumLayout && products && products.length > 0 ? (
                    <span
                      style={{
                        color: "var(--accent-text)",
                        backgroundColor: "color-mix(in srgb, var(--accent) 12%, var(--surface))",
                        borderColor: "var(--surface-border)",
                      }}
                      className="text-[10.5px] sm:text-[11px] font-bold px-2 py-0.5 rounded-[4px] border uppercase tracking-wider shrink-0"
                    >
                      {products.length} {products.length === 1 ? "Product" : "Products"}
                    </span>
                  ) : products && products.length > 8 ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsShopSortOpen(!isShopSortOpen)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-[5px] border border-(--surface-border) bg-(--card-bg) text-xs font-semibold text-(--text)  hover:bg-(--surface)  transition-all cursor-pointer shadow-none"
                      >
                        <span>
                          {shopSortOrder === "price_asc" ? "Price: Low to High" : shopSortOrder === "price_desc" ? "Price: High to Low" : "Latest"}
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-(--icon)" />
                      </button>

                      {isShopSortOpen && (
                        <div className="absolute right-0 top-full mt-1.5 z-30 min-w-[150px] rounded-[5px] border border-(--surface-border) bg-(--card-bg) p-1 shadow-lg animate-in fade-in zoom-in-95">
                          <button
                            type="button"
                            onClick={() => { setShopSortOrder("latest"); setIsShopSortOpen(false); }}
                            className={`w-full text-left px-3 py-1.5 rounded-[5px] text-xs font-semibold ${shopSortOrder === "latest" ? "bg-(--surface) text-(--text) font-bold  " : "text-(--text)  hover:bg-(--surface) "}`}
                          >
                            Latest
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShopSortOrder("price_asc"); setIsShopSortOpen(false); }}
                            className={`w-full text-left px-3 py-1.5 rounded-[5px] text-xs font-semibold ${shopSortOrder === "price_asc" ? "bg-(--surface) text-(--text) font-bold  " : "text-(--text)  hover:bg-(--surface) "}`}
                          >
                            Price: Low to High
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShopSortOrder("price_desc"); setIsShopSortOpen(false); }}
                            className={`w-full text-left px-3 py-1.5 rounded-[5px] text-xs font-semibold ${shopSortOrder === "price_desc" ? "bg-(--surface) text-(--text) font-bold  " : "text-(--text)  hover:bg-(--surface) "}`}
                          >
                            Price: High to Low
                          </button>
                        </div>
                      )}
                    </div>
                  ) : undefined
                }
              />
            )}

            {products.length === 0 ? (
              <div
                style={{
                  backgroundColor: c.elevatedBackground,
                  borderColor: c.border,
                }}
                className="rounded-[5px] border p-3.5 sm:p-4 text-center space-y-0.5 shadow-none"
              >
                <p style={{ color: c.primaryText }} className="text-xs sm:text-sm font-semibold">
                  No products yet
                </p>
                <p style={{ color: c.mutedText }} className="text-[11px] sm:text-xs">
                  Products will appear here once added.
                </p>
              </div>
            ) : (
              <ProductGrid>
                {(isPremiumLayout ? sortedProducts.slice(0, 3) : (isProductsExpanded || productsOnlyMode ? sortedProducts : sortedProducts.slice(0, 6))).map((product: CreatorProduct, idx: number) => (
                  <ProductGridCard
                    key={product.id}
                    name={product.name}
                    imageUrl={product.imageUrl || (product as any).image || ""}
                    href={product.productUrl || (product as any).url || ""}
                    price={formatProductPrice(product.pricePaise)}
                    note={product.note}
                    isAffiliate={Boolean(product.isAffiliate)}
                    couponCode={product.couponCode}
                    discountText={product.discountText}
                    isTopPick={Boolean(product.isTopPick) && idx === 0}
                    onClick={(e) => {
                      if (isInformationalMode) {
                        e.preventDefault();
                        showToast(`Opens ${product.name} external product page ✨`);
                        return;
                      }
                      trackPublicEvent("product_click", String(product.id));
                    }}
                  />
                ))}
              </ProductGrid>
            )}

            {isPremiumLayout && sortedProducts.length > 3 && (
              <div className="pt-2.5 w-full text-center">
                <button
                  type="button"
                  onClick={() => {
                    if (isInformationalMode) {
                      showToast("Opens all creator products ✨");
                      return;
                    }
                    router.push(allProductsHref || `/${cleanHandle || "creator"}/products`);
                  }}
                  className="w-full py-2.5 px-4 rounded-[5px] bg-(--surface) hover:bg-(--surface-border) text-(--text) border border-(--surface-border)/80 text-xs sm:text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center shadow-none"
                >
                  <span>{`View all products (${sortedProducts.length})`}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-(--icon)" />
                </button>
              </div>
            )}

            {!isPremiumLayout && !productsOnlyMode && sortedProducts.length > 6 && (
              <div className="pt-2.5 w-full text-center">
                <button
                  type="button"
                  onClick={() => setIsProductsExpanded(!isProductsExpanded)}
                  className="w-full py-2.5 px-4 rounded-[5px] bg-(--surface) hover:bg-(--surface-border) text-(--text) border border-(--surface-border)/80 text-xs sm:text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center shadow-none"
                >
                  <span>{isProductsExpanded ? "Show Less Products" : `View All Products (${sortedProducts.length})`}</span>
                  {isProductsExpanded ? <ChevronUp className="h-3.5 w-3.5 shrink-0 text-(--icon)" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-(--icon)" />}
                </button>
              </div>
            )}

            {/* Affiliate Disclaimer: inside content at bottom, ONLY IF at least one product has is_affiliate = true */}
            {products && products.some((p) => p.isAffiliate) && (
              <p className="text-center text-[10px] sm:text-[10.5px] pt-3 pb-1 opacity-70" style={{ color: c.mutedText }}>
                Some links are affiliate links.
              </p>
            )}
          </section>
        )}

        {/* 8. Creator Team */}
        {(teamOnlyMode || (!isListingPage && (isPremiumLayout || (!isTabsLayout ? true : activeNavTab === "about")))) &&
          (activeTeamMembers.length > 0 || teamOnlyMode) && (
          <div
            id="team-section"
            style={
              isPremiumLayout
                ? {
                    backgroundColor: "color-mix(in srgb, var(--accent) 4.5%, var(--surface))",
                    borderColor: "var(--surface-border)",
                  }
                : undefined
            }
            className={`relative z-10 ${
              teamOnlyMode
                ? "order-[5] mt-1 sm:mt-1.5"
                : isPremiumLayout
                ? "order-[8] mt-5 sm:mt-6 p-3.5 sm:p-4 rounded-[5px] border shadow-xs space-y-3"
                : isTabsLayout
                ? "order-[25] mt-1.5 sm:mt-2"
                : "order-[25] mt-6 sm:mt-7"
            } w-full text-left animate-fade-in`}
          >
            {isPremiumLayout && (
              <TabSectionHeader
                title={teamData.team?.teamName?.trim() || "The Crew"}
                subtitle={teamData.team?.teamDescription?.trim() || "Creative production crew, editors & management team."}
                action={
                  <span
                    style={{
                      color: "var(--accent-text)",
                      backgroundColor: "color-mix(in srgb, var(--accent) 12%, var(--surface))",
                      borderColor: "var(--surface-border)",
                    }}
                    className="text-[10.5px] sm:text-[11px] font-bold px-2 py-0.5 rounded-[4px] border uppercase tracking-wider shrink-0"
                  >
                    {activeTeamMembers.length} {activeTeamMembers.length === 1 ? "Member" : "Members"}
                  </span>
                }
                primaryTextColor={c.primaryText}
                secondaryTextColor={c.secondaryText}
                headingFontFamily={typ.headingFontFamily}
              />
            )}
            <div
              style={{
                backgroundColor: isPremiumLayout ? "var(--surface)" : "transparent",
                borderColor: "var(--surface-border)",
              }}
              className="rounded-[5px] border overflow-hidden shadow-none w-full"
            >
              {/* Compact theme-tinted header (shown in tabs layout / teamOnlyMode to avoid duplicate header in premium) */}
              {!isPremiumLayout && (
                <div
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--accent) 7%, transparent)",
                    borderColor: "var(--surface-border)",
                  }}
                  className="px-3 py-2 sm:px-3.5 sm:py-2.5 border-b flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h2
                        style={{
                          color: c.primaryText,
                          fontFamily: typ.headingFontFamily,
                        }}
                        className="text-sm font-semibold tracking-tight leading-5 text-(--text)"
                      >
                        {teamData.team?.teamName?.trim() || "The Crew"}
                      </h2>
                    </div>
                    <p
                      style={{ color: c.mutedText }}
                      className="text-xs font-normal leading-[18px] text-(--text-muted) mt-0.5"
                    >
                      {teamData.team?.teamDescription?.trim() || "Creative production crew, editors & management team."}
                    </p>
                  </div>
                  <span
                    style={{ color: c.mutedText }}
                    className="text-[11px] font-normal shrink-0 text-(--text-muted)"
                  >
                    {activeTeamMembers.length} {activeTeamMembers.length === 1 ? "member" : "members"}
                  </span>
                </div>
              )}

              {activeTeamMembers.length > 0 ? (
                <div className="p-3 sm:p-3.5">
                  <PublicTeamGroups
                    members={activeTeamMembers}
                    variant="profile"
                    primaryTextColor={c.primaryText}
                    secondaryTextColor={c.secondaryText}
                    mutedTextColor={c.mutedText}
                    accentColor={c.accent}
                    borderColor={c.border}
                    cardBgColor={c.profileBackground}
                    isInformational={isInformationalMode}
                  />
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <p style={{ color: c.mutedText }} className="text-xs font-medium">
                    No team members added yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. Media Kit v2 (Only on standalone /:username/mediakit page) */}
        {mediaKitOnlyMode && (
          <div id="collab-section" className="relative z-10 order-[20] mt-1 sm:mt-1.5 w-full text-left animate-fade-in">
            <MediaKitV2Content
              profile={profile}
              socials={safeSocials}
              totalAudience={totalAudience}
              series={series}
              packages={mediaKitPackages}
              settings={mediaKitSettings}
              reviews={approvedReviews}
              team={teamData}
              hideTeam={false}
              isInformational={isInformationalMode}
              onEnquirePackage={(selected) => {
                setSelectedEnquiryPackage(selected);
                setIsEnquirySheetOpen(true);
              }}
            />

            <CollabEnquirySheet
              isOpen={isEnquirySheetOpen}
              onClose={() => setIsEnquirySheetOpen(false)}
              creatorId={profile.id || profile.username || "creator"}
              creatorDisplayName={profile.displayName || profile.username}
              creatorEmail={profile.email}
              creatorWhatsapp={(profile as any).whatsappNumber}
              packages={(mediaKitPackages || []).filter((p) => p.isActive !== false)}
              preselectedPackage={selectedEnquiryPackage}
              settings={mediaKitSettings}
              brandPrimary="var(--accent)"
            />
          </div>
        )}

        {/* 6b. Collaboration Packages Section (Restored classic Collab tab design) */}
        {!isListingPage && (isPremiumLayout || (!isTabsLayout || activeNavTab === "collab" || activeNavTab === "work")) && (() => {
          const activePackages = (mediaKitPackages || []).filter((p) => p.isActive);

          // Tabs / stacked layouts: About-style sections (Audience → Packages → Reviews → Custom).
          if (!isPremiumLayout) {
            const showPackages = effectiveVisibilitySettings.showCollabGigs !== false;
            const reviewsList = effectiveVisibilitySettings.showReviews === false ? [] : approvedReviews;
            const brandNames = [
              ...(brandsList || []).filter((b) => b.isActive !== false).map((b) => b.brandName || ""),
              ...(mediaKitSettings?.pastBrands || []).map((b) => b.name || ""),
            ].filter(Boolean);
            const hasContent = (showPackages && activePackages.length > 0) || reviewsList.length > 0 || brandNames.length > 0;
            if (!isTabsLayout && !isDashboardPreview && !hasContent) return null;
            const topPlatform = [...fanbaseSocialCards]
              .filter((s) => (Number(s.count) || 0) > 0)
              .sort((a, b) => (Number(b.count) || 0) - (Number(a.count) || 0))[0];
            const openEnquiry = (pkg: MediaKitPackage | null) => {
              setSelectedEnquiryPackage(pkg);
              setIsEnquirySheetOpen(true);
            };
            return (
              <div
                id="collab-section"
                className={`relative z-10 ${isTabsLayout ? "order-[20] mt-1 sm:mt-1.5" : "order-[20] mt-4 sm:mt-5"} w-full space-y-2 text-left animate-fade-in`}
              >
                <AudienceSnapshot
                  totalFans={totalAudience}
                  topPlatform={topPlatform ? { platform: topPlatform.platform, handle: topPlatform.handle, count: Number(topPlatform.count) || 0, unit: topPlatform.unit } : null}
                  tags={formattedCategories ? formattedCategories.split(" · ") : []}
                  mediaKitHref={cleanHandle && cleanHandle !== "demo_creator" ? `/${cleanHandle}/mediakit` : undefined}
                  onMediaKitClick={(e) => {
                    if (isInformationalMode) {
                      e.preventDefault();
                      showToast("Opens your public media kit on the live profile ✨");
                    }
                  }}
                  colors={aboutColors}
                />
                {showPackages && <WorkWithMe packages={activePackages} colors={aboutColors} onEnquire={(pkg) => openEnquiry(pkg)} />}
                <WhatBrandsSay reviews={reviewsList} brands={brandNames} colors={aboutColors} />
                {showPackages && <CustomCollaboration colors={aboutColors} onRequest={() => openEnquiry(null)} />}
                <CollabEnquirySheet
                  isOpen={isEnquirySheetOpen}
                  onClose={() => setIsEnquirySheetOpen(false)}
                  creatorId={profile.id || profile.username || "creator"}
                  creatorDisplayName={profile.displayName || profile.username}
                  creatorEmail={profile.email}
                  creatorWhatsapp={(profile as any).whatsappNumber}
                  packages={activePackages}
                  preselectedPackage={selectedEnquiryPackage}
                  settings={mediaKitSettings}
                  brandPrimary="var(--accent)"
                />
              </div>
            );
          }

          if (effectiveVisibilitySettings.showCollabGigs === false) return null;
          if (!isDashboardPreview && activePackages.length === 0 && !isTabsLayout) return null;

          return (
            <div
              id="collab-section"
              style={
                isPremiumLayout
                  ? {
                      backgroundColor: "color-mix(in srgb, var(--accent) 4.5%, var(--surface))",
                      borderColor: "var(--surface-border)",
                    }
                  : undefined
              }
              className={`relative z-10 ${
                isPremiumLayout
                  ? "order-[6] mt-5 sm:mt-6 p-3.5 sm:p-4 rounded-[5px] border shadow-xs space-y-3"
                  : isTabsLayout
                  ? "order-[20] mt-1 sm:mt-1.5 space-y-2"
                  : "order-[20] mt-4 sm:mt-5 space-y-2"
              } w-full text-left animate-fade-in`}
            >
              {!isTabsLayout && (
                <TabSectionHeader
                  title={isPremiumLayout ? "Collaboration Packages" : "Work with me"}
                  subtitle="Collab packages & custom brand inquiries."
                  action={
                    isPremiumLayout && activePackages.length > 0 ? (
                      <span
                        style={{
                          color: "var(--accent-text)",
                          backgroundColor: "color-mix(in srgb, var(--accent) 12%, var(--surface))",
                          borderColor: "var(--surface-border)",
                        }}
                        className="text-[10.5px] sm:text-[11px] font-bold px-2 py-0.5 rounded-[4px] border uppercase tracking-wider shrink-0"
                      >
                        {activePackages.length} {activePackages.length === 1 ? "Package" : "Packages"}
                      </span>
                    ) : activePackages.length > 0 ? (
                      <span style={{ color: c.mutedText }} className="text-[11px] font-normal shrink-0 text-(--text-muted)">
                        {activePackages.length} {activePackages.length === 1 ? "package" : "packages"}
                      </span>
                    ) : undefined
                  }
                  primaryTextColor={c.primaryText}
                  secondaryTextColor={c.secondaryText}
                  headingFontFamily={typ.headingFontFamily}
                />
              )}

              {/* 1. WORK WITH ME SECTION (Matching Reviews Section outer card structure) */}
              <div
                id="collab-packages-section"
                style={{
                  backgroundColor: isPremiumLayout ? "var(--surface)" : "transparent",
                  borderColor: "var(--surface-border)",
                }}
                className="rounded-[5px] border overflow-hidden text-left shadow-none"
              >
                {/* Section Header (shown in tabs layout to avoid duplicate header in premium) */}
                {!isPremiumLayout && (
                  <div
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--accent) 6%, var(--surface))",
                      borderColor: "var(--surface-border)",
                    }}
                    className="px-3 py-2 sm:px-3.5 sm:py-2.5 border-b flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Handshake className="h-4 w-4 text-(--accent-text) shrink-0" />
                        <h2
                          style={{ color: c.primaryText, fontFamily: typ.headingFontFamily }}
                          className="text-sm font-semibold tracking-tight leading-5 text-(--text)"
                        >
                          {isPremiumLayout ? "Packages" : "Work With Me"}
                        </h2>
                      </div>
                      <p style={{ color: c.mutedText }} className="text-xs font-normal leading-[18px] text-(--text-muted) mt-0.5">
                        I&apos;d love to bring your brand into my content. Explore my collab packages below.
                      </p>
                    </div>
                    {activePackages.length > 0 && (
                      <span style={{ color: c.mutedText }} className="text-[11px] font-normal shrink-0 text-(--text-muted)">
                        {activePackages.length} {activePackages.length === 1 ? "package" : "packages"}
                      </span>
                    )}
                  </div>
                )}

                {/* Packages List: Single vertical column inside the main section container */}
                {activePackages.length > 0 ? (
                  <div className="p-2 sm:p-2.5">
                    <div className="flex flex-col space-y-2 w-full">
                      {activePackages.map((pkg) => (
                        <PackageCard
                          key={pkg.id}
                          pkg={pkg}
                          onEnquire={(selected) => {
                            setSelectedEnquiryPackage(selected);
                            setIsEnquirySheetOpen(true);
                          }}
                          brandPrimary="var(--accent)"
                          isDark={usesDarkControls}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p style={{ color: c.mutedText }} className="text-xs font-medium">
                      No packages available at the moment.
                    </p>
                  </div>
                )}
              </div>

              {/* 4. Custom Collaboration Card */}
              <div
                style={{
                  backgroundColor: "transparent",
                  borderColor: "var(--surface-border)",
                }}
                className="rounded-[5px] border overflow-hidden text-left shadow-none"
              >
                {/* Header */}
                <div
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--accent) 6%, var(--surface))",
                    borderColor: "var(--surface-border)",
                  }}
                  className="px-3 py-2 sm:px-3.5 sm:py-2.5 border-b"
                >
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-(--accent-text) shrink-0" />
                    <h3
                      style={{ color: c.primaryText, fontFamily: typ.headingFontFamily }}
                      className="text-sm font-semibold tracking-tight leading-5 text-(--text)"
                    >
                      Custom Collaboration
                    </h3>
                  </div>
                  <p style={{ color: c.mutedText }} className="text-xs font-normal leading-[18px] text-(--text-muted) mt-0.5">
                    Have something different in mind? I&apos;d love to hear your idea.
                  </p>
                </div>

                {/* Body */}
                <div className="p-3 sm:p-3.5">
                  <p style={{ color: c.secondaryText }} className="text-xs sm:text-[12.5px] font-normal leading-relaxed text-(--text-muted)">
                    Looking for a custom campaign, long-term ambassadorship, or a bespoke creative package? Send a custom brief and I&apos;ll get back to you with a tailor-made proposal.
                  </p>
                </div>

                {/* Edge-to-edge CTA */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEnquiryPackage(null);
                    setIsEnquirySheetOpen(true);
                  }}
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "var(--on-accent)",
                  }}
                  className="w-full min-h-[44px] py-2.5 px-3 rounded-none border-t border-(--surface-border) font-medium text-[13px] leading-[18px] flex items-center justify-center gap-1.5 transition-all hover:opacity-95 shadow-none cursor-pointer select-none active:scale-[0.99]"
                >
                  <span>Send a Custom Request</span>
                  <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
                </button>
              </div>

              {/* 5. ENQUIRY SHEET */}
              <CollabEnquirySheet
                isOpen={isEnquirySheetOpen}
                onClose={() => setIsEnquirySheetOpen(false)}
                creatorId={profile.id || profile.username || "creator"}
                creatorDisplayName={profile.displayName || profile.username}
                creatorEmail={profile.email}
                creatorWhatsapp={(profile as any).whatsappNumber}
                packages={activePackages}
                preselectedPackage={selectedEnquiryPackage}
                settings={mediaKitSettings}
                brandPrimary="var(--accent)"
              />
            </div>
          );
        })()}

        {/* 7. Reviews Section */}
        {!isListingPage && (isPremiumLayout || (!isTabsLayout || activeNavTab === "collab" || activeNavTab === "work" || activeNavTab === "reviews")) && (() => {
          if (!isPremiumLayout) return null; // tabs/stacked: shown in the Collab sections
          if (effectiveVisibilitySettings.showReviews === false) return null;
          if (approvedReviews.length === 0) return null;

          const visibleReviews = showAllReviews ? approvedReviews : approvedReviews.slice(0, 4);
          const hasMoreReviews = approvedReviews.length > 4;

          return (
            <div id="reviews-section" className={`relative z-10 ${isPremiumLayout ? "order-[7] mt-5 sm:mt-6 space-y-3" : isTabsLayout ? "order-[21] mt-1 sm:mt-1.5 space-y-2" : "order-[21] mt-4 sm:mt-5 space-y-2"} w-full text-left animate-fade-in`}>
              {isPremiumLayout && (
                <TabSectionHeader
                  title="Reviews"
                  subtitle="Verified feedback and testimonials from leading brands & collaboration partners."
                  action={
                    approvedReviews.length > 0 ? (
                      <span
                        style={{
                          color: "var(--accent-text)",
                          backgroundColor: "color-mix(in srgb, var(--accent) 12%, var(--surface))",
                          borderColor: "var(--surface-border)",
                        }}
                        className="text-[10.5px] sm:text-[11px] font-bold px-2 py-0.5 rounded-[4px] border uppercase tracking-wider shrink-0"
                      >
                        {approvedReviews.length} {approvedReviews.length === 1 ? "Review" : "Reviews"}
                      </span>
                    ) : undefined
                  }
                  primaryTextColor={c.primaryText}
                  secondaryTextColor={c.secondaryText}
                  headingFontFamily={typ.headingFontFamily}
                />
              )}

              <div
                id="collab-reviews-section"
                style={{
                  backgroundColor: "transparent",
                  borderColor: "var(--surface-border)",
                }}
                className="rounded-[5px] border overflow-hidden text-left shadow-none"
              >
                {/* Card Header (for tabs layout) */}
                {!isPremiumLayout && (
                  <div
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--accent) 6%, var(--surface))",
                      borderColor: "var(--surface-border)",
                    }}
                    className="px-3 py-2 sm:px-3.5 sm:py-2.5 border-b flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-(--accent-text) shrink-0" />
                        <h3
                          style={{ color: c.primaryText, fontFamily: typ.headingFontFamily }}
                          className="text-sm font-semibold tracking-tight leading-5 text-(--text)"
                        >
                          What Brands Say
                        </h3>
                      </div>
                      <p style={{ color: c.mutedText }} className="text-xs font-normal leading-[18px] text-(--text-muted) mt-0.5">
                        Here&apos;s what brands I&apos;ve worked with have to say about our collaborations.
                      </p>
                    </div>
                    <span style={{ color: c.mutedText }} className="text-[11px] font-normal shrink-0 text-(--text-muted)">
                      {approvedReviews.length} {approvedReviews.length === 1 ? "review" : "reviews"}
                    </span>
                  </div>
                )}

                {/* Reviews List: Single vertical column across all breakpoints */}
                <div className="p-2 sm:p-2.5">
                  <div className="flex flex-col space-y-2 w-full">
                    {visibleReviews.map((rev) => {
                      const ratingNum = Number(rev.rating) || 5;
                      const initial = getInitials(rev.clientName, "B");

                      return (
                        <div
                          key={rev.id}
                          style={{
                            backgroundColor: "transparent",
                            borderColor: "var(--surface-border)",
                          }}
                          className="rounded-[5px] border overflow-hidden text-left shadow-none flex flex-col justify-between"
                        >
                          {/* Client Header */}
                          <div className="px-2.5 py-2 sm:px-3 sm:py-2 flex items-center gap-2">
                            <div
                              style={{
                                borderColor: "var(--surface-border)",
                                backgroundColor: "color-mix(in srgb, var(--accent) 8%, var(--surface))",
                                color: "var(--accent-text)",
                              }}
                              className="h-7 w-7 rounded-[4px] border font-bold text-xs flex items-center justify-center shrink-0"
                            >
                              {initial}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <p style={{ color: c.primaryText }} className="text-[13px] font-medium text-(--text) truncate leading-[18px]">
                                  {rev.clientName}
                                </p>
                                {rev.isVerified && (
                                  <CheckCircle2 className="h-3 w-3 text-(--accent-text) shrink-0" />
                                )}
                              </div>
                              {rev.projectTitle && (
                                <p style={{ color: c.mutedText }} className="text-[10.5px] font-normal truncate">
                                  {rev.projectTitle}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Quote Content */}
                          {rev.comment && (
                            <div
                              style={{ borderColor: "var(--surface-border)" }}
                              className="px-2.5 py-2 sm:px-3 sm:py-2 border-t flex-1"
                            >
                              <p style={{ color: c.primaryText }} className="text-xs leading-relaxed font-normal">
                                &ldquo;{rev.comment.trim()}&rdquo;
                              </p>
                            </div>
                          )}

                          {/* Star Rating Footer */}
                          <div
                            style={{ borderColor: "var(--surface-border)" }}
                            className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 border-t flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-0.5 text-amber-500">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < ratingNum ? "fill-amber-400 text-amber-500" : "text-slate-300 dark:text-zinc-600"}`}
                                />
                              ))}
                            </div>
                            <span style={{ color: c.mutedText }} className="text-[11px] font-semibold tabular-nums">
                              {ratingNum.toFixed(1)} / 5
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Show All / Show Less Toggle */}
                {hasMoreReviews && (
                  <div style={{ borderColor: "var(--surface-border)" }} className="border-t py-2 sm:py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => setShowAllReviews(!showAllReviews)}
                      style={{ color: c.accentText || "var(--accent-text)" }}
                      className="text-xs font-semibold hover:underline cursor-pointer"
                    >
                      {showAllReviews ? "Show less" : `Show all ${approvedReviews.length} reviews`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* 10. Trusted Brands Section */}
        {!isListingPage && isPremiumLayout && (() => {
          const activeBrands = (brandsList || []).filter((b) => b.isActive !== false);
          if (activeBrands.length === 0) return null;

          return (
            <div
              id="brands-section"
              style={
                isPremiumLayout
                  ? {
                      backgroundColor: "color-mix(in srgb, var(--accent) 4.5%, var(--surface))",
                      borderColor: "var(--surface-border)",
                    }
                  : undefined
              }
              className={`relative z-10 ${
                isPremiumLayout
                  ? "order-[10] mt-5 sm:mt-6 p-3.5 sm:p-4 rounded-[5px] border shadow-xs space-y-3"
                  : isTabsLayout
                  ? "order-[24] mt-1.5 sm:mt-2 space-y-2"
                  : "order-[24] mt-6 sm:mt-7 space-y-2"
              } w-full text-left animate-fade-in`}
            >
              <TabSectionHeader
                title="Trusted By Brands"
                subtitle="Brands partnered with for podcasts, campaigns & keynotes."
                action={
                  <span
                    style={{
                      color: "var(--accent-text)",
                      backgroundColor: "color-mix(in srgb, var(--accent) 12%, var(--surface))",
                      borderColor: "var(--surface-border)",
                    }}
                    className="text-[10.5px] sm:text-[11px] font-bold px-2 py-0.5 rounded-[4px] border uppercase tracking-wider shrink-0"
                  >
                    {activeBrands.length} {activeBrands.length === 1 ? "Brand" : "Brands"}
                  </span>
                }
                primaryTextColor={c.primaryText}
                secondaryTextColor={c.secondaryText}
                headingFontFamily={typ.headingFontFamily}
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {activeBrands.map((brand) => (
                  <a
                    key={brand.id}
                    href={brand.websiteUrl || "#"}
                    target={brand.websiteUrl ? "_blank" : undefined}
                    rel={brand.websiteUrl ? "noopener noreferrer" : undefined}
                    style={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--surface-border)",
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-[5px] border text-center transition-transform hover:-translate-y-0.5 cursor-pointer group shadow-none"
                  >
                    <span
                      style={{ color: c.primaryText, fontFamily: typ.headingFontFamily }}
                      className="text-xs sm:text-[13px] font-bold group-hover:text-(--accent-text) transition-colors"
                    >
                      {brand.brandName}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          );
        })()}

        {/* 6. Standalone Reviews Only Mode (when accessing dedicated reviews tab directly) */}
        {reviewsOnlyMode && (
          <div id="reviews-only-section" className="relative z-10 order-[30] w-full text-left animate-fade-in mt-1.5 sm:mt-2 space-y-2">
            {approvedReviews.length === 0 ? (
              <div
                style={{
                  backgroundColor: c.elevatedBackground,
                  borderColor: c.border,
                }}
                className="rounded-[5px] border p-5 sm:p-6 text-center space-y-1 shadow-none my-2"
              >
                <div className="mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-(--surface) text-(--text-muted)">
                  <Star className="h-4 w-4" />
                </div>
                <p style={{ color: c.primaryText }} className="text-xs sm:text-sm font-semibold">
                  No brand reviews yet
                </p>
                <p style={{ color: c.mutedText }} className="text-[11px] sm:text-xs">
                  Published brand reviews will appear here.
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
                        backgroundColor: "transparent",
                        borderColor: "var(--surface-border)",
                      }}
                      className="rounded-[5px] border p-2.5 sm:p-3 space-y-2 text-left shadow-none"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-(--accent)/10 text-(--accent-text) font-bold text-xs flex items-center justify-center shrink-0">
                            {getInitials(rev.clientName, "B")}
                          </div>
                          <div className="min-w-0">
                            <p style={{ color: c.primaryText }} className="text-[13px] font-medium text-(--text) leading-[18px] truncate flex items-center gap-1">
                              <span>{rev.clientName}</span>
                              <CheckCircle2 className="h-3 w-3 text-(--accent-text) shrink-0" />
                            </p>
                            {rev.projectTitle && (
                              <p style={{ color: c.mutedText }} className="text-[10px] font-medium truncate">
                                {rev.projectTitle}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${i < ratingNum ? "fill-amber-400 text-amber-500" : "text-slate-300 dark:text-zinc-600"}`}
                            />
                          ))}
                        </div>
                      </div>
                      {rev.comment && (
                        <p style={{ color: c.secondaryText }} className="text-xs leading-relaxed italic pt-0.5">
                          &ldquo;{rev.comment.trim()}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 5. Creator Setups Section for landing demo if activeNavTab === "shop" */}
        {!isListingPage && !isPremiumLayout && landingDemo && activeNavTab === "shop" && (
          (() => {
            const activeSetupItems = (setupList || []).filter((it) => it.isActive !== false);
            if (activeSetupItems.length === 0) return null;
            const visibleSetupItems = isSetupExpanded ? activeSetupItems : activeSetupItems.slice(0, 3);

            return (
              <div id="setup-section" className="relative z-10 order-[45] mt-6 sm:mt-7 space-y-2.5 w-full text-left animate-fade-in">
                <div>
                  <div className="flex items-center justify-between px-0.5">
                    <div className="flex items-center gap-2">
                      <Laptop className="h-4.5 w-4.5 text-(--accent-text) shrink-0" />
                      <h2
                        style={{
                          color: c.primaryText,
                          fontFamily: typ.headingFontFamily,
                          fontWeight: 800,
                        }}
                        className="text-lg sm:text-xl font-extrabold tracking-tight"
                      >
                        My Setup &amp; Shop
                      </h2>
                    </div>
                  </div>
                  <p
                    style={{ color: c.secondaryText }}
                    className="text-xs sm:text-[13px] text-(--text-muted) font-normal px-0.5 mt-1"
                  >
                    Gear I use &amp; products I&apos;ve made.
                  </p>
                </div>

                <div className="w-full pt-1">
                  <ProductGrid>
                    {visibleSetupItems.map((item) => (
                      <ProductGridCard
                        key={item.id}
                        name={item.name}
                        imageUrl={item.imageUrl}
                        href={item.linkUrl}
                        note={item.whyLoveIt || item.usedFor || item.modelOrPlan || item.brand}
                        isAffiliate={item.isAffiliate}
                        onClick={(e) => {
                          if (isInformationalMode) e.preventDefault();
                          else trackPublicEvent("setup_click", String(item.id));
                        }}
                      />
                    ))}
                  </ProductGrid>
                </div>

                {activeSetupItems.length > 3 && (
                  <div className="pt-2 w-full text-center">
                    <button
                      type="button"
                      onClick={() => setIsSetupExpanded(!isSetupExpanded)}
                      className="w-full py-2.5 px-4 rounded-[5px] bg-(--surface) hover:bg-(--surface-border) text-(--text) border border-(--surface-border)/80 text-xs sm:text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center shadow-none"
                    >
                      <span>{isSetupExpanded ? "Show Less Items" : `View All Items (${activeSetupItems.length})`}</span>
                      {isSetupExpanded ? <ChevronUp className="h-3.5 w-3.5 shrink-0 text-(--icon)" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-(--icon)" />}
                    </button>
                  </div>
                )}
              </div>
            );
          })()
        )}

        {/* Normal document flow footer at bottom of scrollable area: full width spanning card borders with zero bottom padding */}
        {!hideFooter && (
          <div ref={footerRef} className="order-[80] mt-auto pt-4 shrink-0 select-none -mx-4 sm:-mx-5 -mb-6 rounded-none rounded-b-[5px] overflow-hidden">
            <MadeWithInflixo
              variant="card-footer"
              disabled={isInformationalMode}
              creatorUsername={profile.username}
              creatorDisplayName={profile.displayName}
            />
          </div>
        )}
      </div>

      {showMoveToTop && (
        <button
          type="button"
          onClick={handleMoveToTop}
          style={{
            backgroundColor: c.accent,
            color: "var(--on-accent)",
            boxShadow: eff.shadow,
            ["--mt-lift" as string]: `${moveTopLift}px`,
          }}
          className="tap-scale fixed bottom-[calc(1.5rem+var(--mt-lift,0px))] right-5 sm:bottom-[calc(5rem+var(--mt-lift,0px))] sm:right-6 z-40 inline-flex h-11 w-11 sm:h-11 sm:w-11 items-center justify-center rounded-[5px] shadow-lg transition-all hover:scale-110 cursor-pointer"
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
        onClose={() => {
          setIsCollabInquiryOpen(false);
          setSelectedPackageForInquiry(null);
        }}
        creatorId={profile.id || profile.username || "creator"}
        creatorEmail={profile.email}
        creatorName={profile.displayName || "Creator"}
        creatorUsername={profile.username || "creator"}
        packages={mediaKitPackages}
        selectedPackageTitle={selectedPackageForInquiry?.title}
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

      {/* Share Profile & QR Code Modal */}
      <ShareProfileModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        displayName={profile.displayName || "Creator"}
        username={profile.username || "creator"}
        shareUrl={(() => {
          const cleanUsername = (profile.username || "username").replace(/^@/, "");
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inflixo.com";
          return typeof window !== "undefined"
            ? (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
              ? `${window.location.origin}/${cleanUsername}`
              : `${baseUrl.replace(/\/$/, "")}/${cleanUsername}`)
            : `${baseUrl.replace(/\/$/, "")}/${cleanUsername}`;
        })()}
      />

      {creatorEra && (
        <CreatorEraBottomSheet
          isOpen={bentoEraSheetOpen}
          onClose={() => setBentoEraSheetOpen(false)}
          era={creatorEra}
          totalFans={totalAudience}
          creatorName={profile.displayName || "Creator"}
          creatorUsername={cleanHandle}
          isCreatorView={isDashboardPreview || false}
          primaryAccounts={fanbaseSocialCards.map((s) => ({
            platform: s.platform,
            username: s.handle || s.name || s.label,
            count: s.count,
            url: s.url,
          }))}
        />
      )}
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
      badgeClass: `${BRAND_BG.youtube} text-white shadow-2xs`,
      chipClass: "bg-(--accent-soft) text-(--accent-text) border-(--surface-border)/80",
      textColor: BRAND_TEXT.youtube,
    };
  }
  if (p.includes("instagram") || u.includes("instagram.com")) {
    return {
      name: "Instagram",
      icon: <InstagramIcon className="h-3 w-3 text-white" />,
      badgeClass: "bg-(--accent) text-(--on-accent) shadow-2xs",
      chipClass: "bg-(--accent-soft) text-(--accent-text) border-(--surface-border)/80",
      textColor: "text-(--accent-text)",
    };
  }
  if (p.includes("facebook") || u.includes("facebook.com")) {
    return {
      name: "Facebook",
      icon: <FacebookIcon className="h-3 w-3 text-white" />,
      badgeClass: `${BRAND_BG.facebook} text-white shadow-2xs`,
      chipClass: "bg-(--accent-soft) text-(--accent-text) border-(--surface-border)/80",
      textColor: BRAND_TEXT.facebook,
    };
  }
  return {
    name: platformStr || "Web",
    icon: <Film className="h-3 w-3 text-white" />,
    badgeClass: "bg-(--accent) text-(--on-accent) shadow-2xs",
    chipClass: "bg-(--accent-soft) text-(--accent-text) border-(--surface-border)/80",
    textColor: "text-(--accent-text)",
  };
}

export function PreviewSeriesItem({
  series,
  style,
  themeKey = DEFAULT_THEME_KEY,
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
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] ${detectedPlatform === "YouTube"
            ? "bg-(--accent) shadow-xs text-(--on-accent)"
            : detectedPlatform === "Instagram"
              ? "bg-gradient-to-tr from-(--accent) via-(--accent) to-(--accent) shadow-xs text-(--on-accent)"
              : detectedPlatform === "Facebook"
                ? "bg-(--accent) shadow-xs text-(--on-accent)"
                : detectedPlatform === "X"
                  ? "bg-(--text) shadow-xs text-(--on-accent)"
                  : detectedPlatform === "LinkedIn"
                    ? "bg-(--accent) shadow-xs text-(--on-accent)"
                    : detectedPlatform === "Threads"
                      ? "bg-(--text) shadow-xs text-(--on-accent)"
                      : detectedPlatform === "Snapchat"
                        ? "bg-(--accent) shadow-xs text-(--text)"
                        : detectedPlatform === "Spotify"
                          ? "bg-(--accent) shadow-xs text-(--on-accent)"
                          : detectedPlatform === "Twitch"
                            ? "bg-(--accent) shadow-xs text-(--on-accent)"
                            : "bg-(--accent-soft) text-(--accent-text)"
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
            <SnapchatIcon className="h-4 w-4 text-(--text)" />
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
