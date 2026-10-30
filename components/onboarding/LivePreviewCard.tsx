"use client";

import type { CreatorProduct } from "@/types";
import { formatProductPrice } from "@/components/products/ProductImage";
import { ProductGrid, ProductGridCard } from "@/components/products/ProductGridCard";

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
  pageHeader,
  showSettingsIcon: showSettingsIconProp,
  onShare,
  hideFooter = false,
  isInformational: isInformationalProp,
  isOnboarding: isOnboardingProp,
  isFinishStep: isFinishStepProp,
  layoutMode = "tabs",
  initialTab,
  landingDemo = false,
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
  const seriesPlatformCounts = useMemo(() => {
    const counts: Record<string, number> = { youtube: 0, instagram: 0, facebook: 0 };
    (series || []).forEach((s) => {
      const allEps = getSeriesEpisodes(s);
      const firstUrl = (allEps[0]?.externalUrl || "").toLowerCase();
      const p = (s.platform || "").toLowerCase();
      if (p.includes("youtube") || firstUrl.includes("youtube.com") || firstUrl.includes("youtu.be")) {
        counts.youtube = (counts.youtube || 0) + 1;
      } else if (p.includes("instagram") || firstUrl.includes("instagram.com")) {
        counts.instagram = (counts.instagram || 0) + 1;
      } else if (p.includes("facebook") || firstUrl.includes("facebook.com")) {
        counts.facebook = (counts.facebook || 0) + 1;
      }
    });
    return counts;
  }, [series]);

  const distinctPlatformCount = Object.values(seriesPlatformCounts).filter((c) => c > 0).length;
  const showPlatformChips = (series || []).length > 6 && distinctPlatformCount >= 2;

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
  const effectiveFanbase = typeof profile.peakFanbase === "number" && profile.peakFanbase >= (totalFanbase ?? 0)
    ? profile.peakFanbase
    : totalFanbase;
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

  const fanbaseSocialCards = activeSocialList.filter((s) => s.hasAccount || s.count > 0);
  const fanbaseSocialGridColumns = `repeat(${Math.min(Math.max(fanbaseSocialCards.length, 1), 3)}, minmax(0, 1fr))`;

  const aboutSocialCards = useMemo(() => {
    if (passedAllSocialAccounts && passedAllSocialAccounts.length > 0) {
      return passedAllSocialAccounts
        .filter((acc) => acc.username || (acc.followerCount && acc.followerCount > 0))
        .map((acc: any) => {
          const platform = (acc.platform || "").toLowerCase();
          const rawHandle = (acc.username || acc.accountName || "").replace(/^@/, "");
          const count = acc.followerCount || 0;
          const isYoutube = platform === "youtube";
          const isInstagram = platform === "instagram";
          const isFacebook = platform === "facebook";
          const url =
            acc.url ||
            (isInstagram
              ? `https://instagram.com/${rawHandle}`
              : isYoutube
              ? `https://youtube.com/@${rawHandle}`
              : isFacebook
              ? `https://facebook.com/${rawHandle}`
              : buildSocialUrl(platform, rawHandle));
          const isPrimary = Boolean(acc.isPrimary || acc.is_primary);
          const label =
            platform === "youtube"
              ? "YouTube"
              : platform === "instagram"
              ? "Instagram"
              : platform === "facebook"
              ? "Facebook"
              : platform;
          const unit = isYoutube ? "Subscribers" : "Followers";
          return {
            id: acc.id,
            platform,
            label,
            handle: rawHandle,
            name: acc.accountName || rawHandle,
            count,
            unit,
            url,
            isPrimary,
          };
        });
    }
    return fanbaseSocialCards;
  }, [passedAllSocialAccounts, fanbaseSocialCards]);

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
  const headerSocialList = activeSocialList.filter((s) => s.hasAccount || s.count > 0 || (s.url && s.url !== "#"));
  const activeTeamMembers = teamData.team?.isActive === false
    ? []
    : (teamData.members || []).filter((member) => member.isActive !== false && member.name?.trim());

  const validLinksList = (customLinksList || []).filter(
    (l) => l.isEnabled !== false && l.title && (l.url || (l.kind === "collection" && l.items?.some((item) => item.isEnabled !== false && item.title && item.url)))
  );
  const validLinksCount = validLinksList.length;

  const isListingPage = Boolean(seriesOnlyMode || productsOnlyMode || reviewsOnlyMode || linksOnlyMode);

  const hasSeriesContent = !isListingPage && effectiveVisibilitySettings.showSeries !== false && series.length > 0;
  const hasLinksContent = !isListingPage && (
    (effectiveVisibilitySettings.showCustomLinks !== false && validLinksCount > 0) ||
    (isDashboardPreview && effectiveVisibilitySettings.showCustomLinks !== false)
  );
  const hasShopContent = !isListingPage && (products && products.length > 0);
  const validSetupList = (setupList || []).filter((it) => it.isActive !== false);
  const hasSetupContent = !isListingPage && validSetupList.length > 0;

  const navActivePackages = (mediaKitPackages || []).filter((p) => p.isActive);
  const hasWorkCollab = !isListingPage && effectiveVisibilitySettings.showCollabGigs !== false && navActivePackages.length > 0;
  const hasReviewsContent = !isListingPage && effectiveVisibilitySettings.showReviews !== false && approvedReviews.length > 0;

  const hasFanbaseTab = !isListingPage && effectiveVisibilitySettings.showFanbase !== false && (totalAudience > 0 || fanbaseSocialCards.length > 0);
  const hasAboutTab = !isListingPage && (Boolean(profile.bio?.trim()) || hasFanbaseTab || hasSetupContent);
  const hasWatchTab = hasSeriesContent;
  const hasLinksTab = hasLinksContent;
  const hasShopTab = hasShopContent;
  const hasWorkTab = hasWorkCollab || hasReviewsContent;

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

  const isTabsLayout = layoutMode !== "stacked" && !isListingPage && navTabs.length >= 1;

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
      className={`relative w-full max-w-full flex-1 flex flex-col ${
        containedScroll ? "overflow-hidden min-h-0 h-full max-h-full" : "min-h-full"
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
              ? `/${cleanHandle}/media-kit`
              : undefined
          }
          usesDarkControls={usesDarkControls}
          onShareClick={handleShareClick}
          onFanbaseClick={() => handleTabChange("about")}
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

        {/* Fixed Listing Header on Dedicated Listing Pages (Series / Shop / Reviews) */}
        {isListingPage && (
          <div className="relative z-20 -mx-4 sm:-mx-5 select-none bg-(--card-bg) ">
            {/* Divider between Total Fanbase and Title */}
            <div style={{ backgroundColor: c.divider }} className="h-px opacity-60" aria-hidden="true" />

            {/* Title & Subtitle for Series */}
            {seriesOnlyMode && (
              <div className="px-4 sm:px-5 pt-3 pb-2.5 text-left">
                <div className="flex items-center justify-between gap-2 px-0.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Clapperboard className="h-4.5 w-4.5 text-(--accent-text) shrink-0" />
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
                      className="appearance-none bg-(--card-bg) border border-(--surface-border)/15 rounded-[5px] text-[11px] sm:text-xs font-medium text-(--text)  py-1 pl-2.5 pr-6 cursor-pointer focus:outline-hidden hover:border-(--surface-border)/30  transition-colors shadow-none"
                    >
                      <option value="latest">Latest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="episodes">Most Episodes</option>
                    </select>
                    <ChevronDown className="h-3 w-3 text-(--icon) absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {/* Title & Subtitle for Products / Shop */}
            {productsOnlyMode && (
              <div className="px-4 sm:px-5 pt-2.5 pb-2 text-left">
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
                      <span>My Products</span>
                    </h2>
                  </div>
                  {products && products.length > 0 && (
                    <span
                      style={{ color: c.mutedText }}
                      className="shrink-0 text-[11px] sm:text-xs font-semibold"
                    >
                      {products.length} {products.length === 1 ? "Product" : "Products"}
                    </span>
                  )}
                </div>
                <p
                  style={{ color: c.secondaryText }}
                  className="text-[11px] sm:text-xs font-normal px-0.5 mt-0.5"
                >
                  Check out my products.
                </p>
              </div>
            )}

            {/* Title & Subtitle for Reviews */}
            {reviewsOnlyMode && (
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
            )}

            {/* Divider separating fixed listing header from scrollable list */}
            <div style={{ backgroundColor: c.divider }} className="h-px opacity-60" aria-hidden="true" />
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

        {/* 2. About Tab (Compact, flat, 5px radius, theme-aware layout) */}
        {!isListingPage && (!isTabsLayout || activeNavTab === "about" || activeNavTab === "fanbase") && (
          <div id="about-section" className={`relative z-10 w-full text-left animate-fade-in ${isTabsLayout ? "order-[4] mt-1 sm:mt-1.5" : "order-[1] mt-4 sm:mt-5 space-y-2"}`}>
            {!isTabsLayout && (
              <TabSectionHeader
                title="About"
                subtitle="Get to know me & find my socials."
                primaryTextColor={c.primaryText}
                secondaryTextColor={c.secondaryText}
                headingFontFamily={typ.headingFontFamily}
              />
            )}

            <div className="space-y-2">
              {/* 1. About Me Card */}
              {profile.bio && profile.bio.trim() && (
                <div
                  style={{
                    backgroundColor: "transparent",
                    borderColor: "var(--surface-border)",
                  }}
                  className="rounded-[5px] border overflow-hidden text-left shadow-none"
                >
                  {/* Compact theme-tinted header */}
                  <div
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--accent) 6%, var(--surface))",
                      borderColor: "var(--surface-border)",
                    }}
                    className="px-3 py-2 sm:px-3.5 sm:py-2.5 border-b"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-(--accent-text) shrink-0" />
                      <h2
                        style={{ color: c.primaryText, fontFamily: typ.headingFontFamily }}
                        className="text-sm font-semibold tracking-tight leading-5 text-(--text)"
                      >
                        About Me
                      </h2>
                    </div>
                    <p style={{ color: c.mutedText }} className="text-xs font-normal leading-[18px] text-(--text-muted) mt-0.5">
                      A little about me and what I love creating.
                    </p>
                  </div>

                  {/* Bio Editorial Text */}
                  <div className="p-3 sm:p-3.5">
                    <ExpandableText
                      text={profile.bio}
                      style={{ color: c.primaryText }}
                      className="text-xs sm:text-[12.5px] leading-relaxed font-normal break-words"
                      buttonStyle={{ color: c.accentText || c.primaryText }}
                      buttonClassName="mt-1 inline-flex items-center gap-0.5 text-[11px] font-bold hover:underline cursor-pointer select-none"
                    />
                  </div>
                </div>
              )}

              {/* 2. Total Fanbase Card */}
              {effectiveVisibilitySettings.showFanbase !== false && (totalAudience > 0 || (effectiveFanbase ?? 0) > 0 || fanbaseSocialCards.length > 0) && (
                <div
                  style={{
                    backgroundColor: "transparent",
                    borderColor: "var(--surface-border)",
                  }}
                  className="rounded-[5px] border overflow-hidden text-left shadow-none"
                >
                  {/* Compact theme-tinted header */}
                  <div
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--accent) 6%, var(--surface))",
                      borderColor: "var(--surface-border)",
                    }}
                    className="px-3 py-2 sm:px-3.5 sm:py-2.5 border-b flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-(--accent-text) shrink-0" />
                        <h2
                          style={{ color: c.primaryText, fontFamily: typ.headingFontFamily }}
                          className="text-sm font-semibold tracking-tight leading-5 text-(--text)"
                        >
                          Total Fanbase
                        </h2>
                      </div>
                      <p style={{ color: c.mutedText }} className="text-xs font-normal leading-[18px] text-(--text-muted) mt-0.5">
                        My creator journey across platforms.
                      </p>
                    </div>
                    <span style={{ color: c.mutedText }} className="text-[11px] font-normal shrink-0 text-(--text-muted)">
                      {aboutSocialCards.length || fanbaseSocialCards.length || 3} platforms
                    </span>
                  </div>

                  {/* Body: Two Columns (Creator Era | Total Fans) */}
                  <div className="flex items-center justify-between">
                    {/* Left Column: Creator Era */}
                    {(() => {
                      const stage = creatorEra?.badge?.includes("Silver")
                        ? "Silver"
                        : creatorEra?.badge?.includes("Gold")
                        ? "Gold"
                        : "Bronze";
                      const medalColor = stage === "Gold" ? "#D4A017" : stage === "Silver" ? "#8E9AA7" : "#C27838";

                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (isInformationalMode) {
                              showToast("Creator Era reflects total cross-platform audience ✨");
                            } else {
                              setBentoEraSheetOpen(true);
                            }
                          }}
                          className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer group/era px-3.5 py-2.5 sm:px-4 sm:py-3"
                        >
                          <Award
                            className="h-4.5 w-4.5 shrink-0 transition-transform group-hover/era:scale-110"
                            style={{ color: medalColor }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span
                                style={{ color: c.primaryText }}
                                className="text-[13px] font-medium leading-[18px] truncate group-hover/era:underline text-(--text)"
                              >
                                {creatorEra?.badge || "Creator Era"}
                              </span>
                              <Info className="h-3 w-3 text-(--text-muted) shrink-0" />
                            </div>
                            <p style={{ color: c.mutedText }} className="text-xs font-normal leading-[17px] text-(--text-muted) mt-0.5">
                              Creator Era
                            </p>
                          </div>
                        </button>
                      );
                    })()}

                    {/* Full-height vertical divider */}
                    <div style={{ backgroundColor: "var(--surface-border)" }} className="self-stretch w-px shrink-0" aria-hidden="true" />

                    {/* Right Column: Total Fans */}
                    <div className="text-right shrink-0 min-w-[85px] sm:min-w-[95px] px-3.5 py-2.5 sm:px-4 sm:py-3 flex flex-col justify-center">
                      <div
                        style={{ color: c.primaryText }}
                        className="text-[15px] sm:text-base font-semibold tabular-nums tracking-tight leading-[21px] text-(--text)"
                      >
                        {formatFans(totalAudience > 0 ? totalAudience : (effectiveFanbase ?? 0))}
                      </div>
                      <p style={{ color: c.mutedText }} className="text-xs font-normal leading-[17px] text-(--text-muted) mt-0.5">
                        Total Fans
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Social Accounts Card */}
              {effectiveVisibilitySettings.showFanbase !== false && aboutSocialCards.length > 0 && (
                <div
                  style={{
                    backgroundColor: "transparent",
                    borderColor: "var(--surface-border)",
                  }}
                  className="rounded-[5px] border overflow-hidden text-left shadow-none"
                >
                  {/* Compact theme-tinted header */}
                  <div
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--accent) 6%, var(--surface))",
                      borderColor: "var(--surface-border)",
                    }}
                    className="px-3 py-2 sm:px-3.5 sm:py-2.5 border-b flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Share2 className="h-4 w-4 text-(--accent-text) shrink-0" />
                        <h2
                          style={{ color: c.primaryText, fontFamily: typ.headingFontFamily }}
                          className="text-sm font-semibold tracking-tight leading-5 text-(--text)"
                        >
                          Social Accounts
                        </h2>
                      </div>
                      <p style={{ color: c.mutedText }} className="text-xs font-normal leading-[18px] text-(--text-muted) mt-0.5">
                        Follow along and stay connected with me.
                      </p>
                    </div>
                    <span style={{ color: c.mutedText }} className="text-[11px] font-normal shrink-0 text-(--text-muted)">
                      {aboutSocialCards.length} connected
                    </span>
                  </div>

                  {/* Body: Individual horizontal cards with 5px radius and ~8px gap */}
                  <div className="p-2 sm:p-2.5 space-y-2">
                    {aboutSocialCards.map((item: any, idx: number) => {
                      const rawHandle = (item.handle || item.name || item.label).replace(/^@/, "");
                      const isServiceOnly = item.platform === "spotify" && rawHandle.toLowerCase() === "spotify";
                      const displayHandle = isServiceOnly ? "Spotify Artist" : `@${rawHandle}`;
                      const countFormatted = item.count > 0 ? formatCount(item.count) : null;

                      const isYoutube = item.platform === "youtube";
                      const isInstagram = item.platform === "instagram";
                      const isFacebook = item.platform === "facebook";

                      return (
                        <a
                          key={item.id ? `soc-${item.id}` : `${item.platform}-${item.handle || item.name}-${idx}`}
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
                            backgroundColor: "transparent",
                            borderColor: "var(--surface-border)",
                          }}
                          className="rounded-[5px] border p-2.5 sm:p-3 flex items-center justify-between gap-2.5 transition-colors hover:border-(--surface-border)/40 cursor-pointer text-left group"
                          title={`Open ${item.label} (${displayHandle})`}
                        >
                          {/* Left: Square Icon with theme wash */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div
                              style={{
                                backgroundColor: "color-mix(in srgb, var(--accent) 8%, var(--surface))",
                                borderColor: "var(--surface-border)",
                              }}
                              className="h-9 w-9 rounded-[5px] border flex items-center justify-center shrink-0 text-(--accent-text)"
                            >
                              {isInstagram && <InstagramOutlineIcon className="h-4.5 w-4.5" />}
                              {isYoutube && <YoutubeOutlineIcon className="h-4.5 w-4.5" />}
                              {isFacebook && <FacebookOutlineIcon className="h-4.5 w-4.5" />}
                              {item.platform === "twitter" && <XTwitterIcon className="h-4 w-4" />}
                              {item.platform === "linkedin" && <LinkedinIcon className="h-4 w-4" />}
                              {item.platform === "threads" && <ThreadsIcon className="h-4 w-4" />}
                              {item.platform === "snapchat" && <SnapchatIcon className="h-4 w-4" />}
                              {item.platform === "spotify" && <SpotifyIcon className="h-4 w-4" />}
                              {item.platform === "twitch" && <TwitchIcon className="h-4 w-4" />}
                              {item.platform === "pinterest" && <PinterestIcon className="h-4 w-4" />}
                              {!["instagram", "youtube", "facebook", "twitter", "linkedin", "threads", "snapchat", "spotify", "twitch", "pinterest"].includes(item.platform) && (
                                <Globe className="h-4 w-4 text-[#71717A]" />
                              )}
                            </div>

                            {/* Center: Platform Name + Username */}
                            <div className="min-w-0 flex-1">
                              <div style={{ color: c.primaryText }} className="text-[13px] font-medium leading-[18px] truncate group-hover:text-(--accent-text) transition-colors text-(--text)">
                                {item.label}
                              </div>
                              <p style={{ color: c.mutedText }} className="text-xs font-normal leading-[17px] text-(--text-muted) mt-0.5 truncate">
                                {displayHandle}
                              </p>
                            </div>
                          </div>

                          {/* Right: Small external-link icon at top, follower count as subtle secondary text below */}
                          <div className="shrink-0 flex flex-col items-end justify-between self-stretch text-right min-h-[34px]">
                            <ExternalLink className="h-3 w-3 text-(--text-muted) group-hover:text-(--text) transition-colors" />
                            {countFormatted && (
                              <span style={{ color: c.mutedText }} className="text-[10px] font-normal lowercase">
                                {countFormatted} {item.unit ? item.unit.toLowerCase() : isYoutube ? "subscribers" : "followers"}
                              </span>
                            )}
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. My Setup Card */}
              {(() => {
                const activeSetupItems = (setupList || []).filter((it) => it.isActive !== false);
                if (activeSetupItems.length === 0) return null;
                const visibleSetupItems = isSetupExpanded ? activeSetupItems : activeSetupItems.slice(0, 4);

                return (
                  <div
                    id="setup-section"
                    style={{
                      backgroundColor: "transparent",
                      borderColor: "var(--surface-border)",
                    }}
                    className="rounded-[5px] border overflow-hidden text-left shadow-none"
                  >
                    {/* Compact theme-tinted header */}
                    <div
                      style={{
                        backgroundColor: "color-mix(in srgb, var(--accent) 6%, var(--surface))",
                        borderColor: "var(--surface-border)",
                      }}
                      className="px-3 py-2 sm:px-3.5 sm:py-2.5 border-b flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Camera className="h-4 w-4 text-(--accent-text) shrink-0" />
                          <h2
                            style={{ color: c.primaryText, fontFamily: typ.headingFontFamily }}
                            className="text-sm font-semibold tracking-tight leading-5 text-(--text)"
                          >
                            My Setup
                          </h2>
                        </div>
                        <p style={{ color: c.mutedText }} className="text-xs font-normal leading-[18px] text-(--text-muted) mt-0.5">
                          A few tools I use to create my content.
                        </p>
                      </div>
                      <span style={{ color: c.mutedText }} className="text-[11px] font-normal shrink-0 text-(--text-muted)">
                        {activeSetupItems.length} items
                      </span>
                    </div>

                    {/* Body: Individual horizontal cards with 5px radius and ~8px gap */}
                    <div className="p-2 sm:p-2.5 space-y-2">
                      {visibleSetupItems.map((item) => (
                        <a
                          key={item.id}
                          href={item.linkUrl || "#"}
                          target={item.linkUrl ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (isInformationalMode) {
                              e.preventDefault();
                              showToast(`Viewing setup item: ${item.name}`);
                            } else if (item.linkUrl) {
                              trackPublicEvent("setup_click", String(item.id));
                            }
                          }}
                          style={{
                            backgroundColor: "transparent",
                            borderColor: "var(--surface-border)",
                          }}
                          className="rounded-[5px] border p-2.5 sm:p-3 flex items-center justify-between gap-2.5 transition-colors hover:border-(--surface-border)/40 cursor-pointer text-left group"
                        >
                          {/* Left: Square Icon with theme wash */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div
                              style={{
                                backgroundColor: "color-mix(in srgb, var(--accent) 8%, var(--surface))",
                                borderColor: "var(--surface-border)",
                              }}
                              className="h-9 w-9 rounded-[5px] border flex items-center justify-center shrink-0 text-(--accent-text)"
                            >
                              <Camera className="h-4 w-4 stroke-[1.75]" />
                            </div>

                            {/* Center: Item Name + Note / description */}
                            <div className="min-w-0 flex-1">
                              <div
                                style={{ color: c.primaryText }}
                                className="text-[13px] font-medium leading-[18px] truncate group-hover:text-(--accent-text) transition-colors text-(--text)"
                              >
                                {item.name}
                              </div>
                              <p style={{ color: c.mutedText }} className="text-xs font-normal leading-[17px] text-(--text-muted) mt-0.5 truncate">
                                {item.usedFor || item.note || item.modelOrPlan || item.brand}
                              </p>
                            </div>
                          </div>

                          {/* Right: Small external-link icon */}
                          <ExternalLink className="h-3 w-3 text-(--text-muted) group-hover:text-(--text) shrink-0 transition-colors" />
                        </a>
                      ))}
                    </div>

                    {/* Footer: View All Items Toggle */}
                    {activeSetupItems.length > 4 && (
                      <div style={{ borderColor: "var(--surface-border)" }} className="border-t">
                        <button
                          type="button"
                          onClick={() => setIsSetupExpanded(!isSetupExpanded)}
                          className="w-full py-2 px-3 text-xs font-semibold text-(--text) hover:opacity-80 flex items-center justify-center gap-1.5 transition-opacity cursor-pointer text-center"
                        >
                          <span>{isSetupExpanded ? "Show Less" : `View All Items (${activeSetupItems.length})`}</span>
                          {isSetupExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* 3. Links Section */}
        {(linksOnlyMode || (!isListingPage && (!isTabsLayout || activeNavTab === "explore" || activeNavTab === "links"))) && (
          (() => {
            const validLinks = (customLinksList || []).filter(
              (l) => l.isEnabled !== false && l.title && (l.url || (l.kind === "collection" && l.items?.some((item) => item.isEnabled !== false && item.title && item.url)))
            );

            // Empty state for owner preview; hide for public
            if (validLinks.length === 0) {
              if (isDashboardPreview || linksOnlyMode) {
                return (
                  <div id="links-section" className={`relative z-10 order-[5] w-full text-left animate-fade-in ${linksOnlyMode ? "mt-1.5 sm:mt-2" : isTabsLayout ? "mt-1.5 sm:mt-2" : "mt-6 sm:mt-7"}`}>
                    {!linksOnlyMode && (
                      <TabSectionHeader
                        title="Links"
                        subtitle="Recommended links, tickets & websites."
                        primaryTextColor={c.primaryText}
                        secondaryTextColor={c.secondaryText}
                        headingFontFamily={typ.headingFontFamily}
                      />
                    )}
                    <div className="rounded-xl border border-dashed border-(--surface-border) p-8 text-center my-2">
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
            // A pinned link may be a top-level link, or inside a collection (must move to top level).
            let pinnedLink: (CustomLink | CustomLinkItem) | null = null;

            // 1. Check top-level links
            for (const link of validLinks) {
              if (link.isPinned && link.kind !== "collection") {
                pinnedLink = link;
                break;
              }
            }

            // 2. If not found in top-level, check inside collections
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

            // Clean up the remaining links:
            // Remove pinned link from direct links or from group items.
            // Hide collection if it was left with 0 items.
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

            return (
              <div id="links-section" className={`relative z-10 order-[5] w-full text-left animate-fade-in ${linksOnlyMode ? "mt-1.5 sm:mt-2" : isTabsLayout ? "mt-1.5 sm:mt-2" : "mt-6 sm:mt-7"}`}>
                {!linksOnlyMode && (
                  <TabSectionHeader
                    title="Links"
                    subtitle="Recommended links, tickets & websites."
                    primaryTextColor={c.primaryText}
                    secondaryTextColor={c.secondaryText}
                    headingFontFamily={typ.headingFontFamily}
                  />
                )}

                <div className="space-y-2 w-full">
                  {/* 3. Pinned Link */}
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

                  {/* 2 & 4. Direct Links & Groups */}
                  {(() => {
                    let groupIndex = 0;
                    return remainingItems.map((item) => {
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
                              // Group children count as "groupId:childIndex".
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
              </div>
            );
          })()
        )}


        {/* 4. Series Section */}
        {(seriesOnlyMode || (!isListingPage && (!isTabsLayout || activeNavTab === "watch" || activeNavTab === "series"))) && effectiveVisibilitySettings.showSeries !== false && (series.length > 0 || seriesOnlyMode) && (
          <div id="series-section" className={`relative z-10 order-[10] w-full text-left pb-12 ${seriesOnlyMode ? "mt-1.5 sm:mt-2" : isTabsLayout ? "mt-1.5 sm:mt-2" : "mt-6 sm:mt-7 space-y-2.5"}`}>
            {!seriesOnlyMode && (
              <TabSectionHeader
                title="Series"
                subtitle={landingDemo ? "Start from Episode 1." : "Watch episodes in the right order."}
                primaryTextColor={c.primaryText}
                secondaryTextColor={c.secondaryText}
                headingFontFamily={typ.headingFontFamily}
                action={
                  showPlatformChips ? (
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {[
                        { key: "all", label: "All" },
                        { key: "youtube", label: "YouTube" },
                        { key: "instagram", label: "Instagram" },
                        { key: "facebook", label: "Facebook" },
                      ]
                        .filter((chip) => chip.key === "all" || (seriesPlatformCounts[chip.key] || 0) > 0)
                        .map((chip) => {
                          const isActive = seriesFilter === chip.key;
                          return (
                            <button
                              key={chip.key}
                              type="button"
                              onClick={() => setSeriesFilter(chip.key)}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
 isActive
 ? "bg-(--accent) text-(--on-accent) shadow-xs"
                                  : "bg-black/5  text-(--text)  hover:bg-black/10 "
                              }`}
                            >
                              {chip.label}
                            </button>
                          );
                        })}
                    </div>
                  ) : undefined
                }
              />
            )}

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
                  })}
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
                  className="tap-scale w-full py-2.5 px-4 rounded-xl bg-(--surface) hover:bg-(--surface-border) text-(--text) border border-(--surface-border)/80 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                >
                  <span>See all series</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Shop / Products Section */}
        {((productsOnlyMode || (!isListingPage && (!isTabsLayout || activeNavTab === "shop"))) && ((products && products.length > 0) || productsOnlyMode)) && (
          <section id="shop-section" aria-label="Shop" className={`relative z-10 order-[15] w-full text-left animate-fade-in ${productsOnlyMode ? "mt-1.5 sm:mt-2" : isTabsLayout ? "mt-1.5 sm:mt-2" : "mt-6 sm:mt-7 space-y-2.5"}`}>
            {landingDemo && (
              <h3
                style={{ color: c.primaryText, fontFamily: typ.headingFontFamily }}
                className="px-0.5 pb-2 text-[13.5px] sm:text-sm font-bold"
              >
                Digital products
              </h3>
            )}
            {!productsOnlyMode && !landingDemo && (
              <TabSectionHeader
                title="Shop"
                subtitle="Products I use and recommend."
                primaryTextColor={c.primaryText}
                secondaryTextColor={c.secondaryText}
                headingFontFamily={typ.headingFontFamily}
                action={
                  products && products.length > 8 ? (
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
                {(isProductsExpanded || productsOnlyMode ? sortedProducts : sortedProducts.slice(0, 6)).map((product: CreatorProduct) => (
                  <ProductGridCard
                    key={product.id}
                    name={product.name}
                    imageUrl={product.imageUrl}
                    href={product.productUrl}
                    price={formatProductPrice(product.pricePaise)}
                    note={product.note}
                    isAffiliate={product.isAffiliate !== false}
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

            {!productsOnlyMode && sortedProducts.length > 6 && (
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

            {/* Affiliate Disclaimer: inside content at bottom */}
            {products && products.length > 0 && (
              <p className="text-center text-[10px] sm:text-[10.5px] pt-3 pb-1 opacity-70" style={{ color: c.mutedText }}>
                Some links may be affiliate links.
              </p>
            )}
          </section>
        )}

        {/* 5. Creator Team */}
        {!isListingPage && (!isTabsLayout ? true : (activeNavTab === "collab" || activeNavTab === "work" || activeNavTab === "reviews")) && activeTeamMembers.length > 0 && (
          <div id="team-section" className={`relative z-10 order-[25] w-full text-left animate-fade-in ${isTabsLayout ? "mt-1.5 sm:mt-2 space-y-2" : "mt-6 sm:mt-7 space-y-2.5"}`}>
            <div>
              <div className="flex items-center justify-between gap-3 px-0.5">
                <div className="flex items-center gap-2">
                  <Users className="h-4.5 w-4.5 text-(--accent-text) shrink-0" />
                  <h2
                    style={{
                      color: c.primaryText,
                      fontFamily: typ.headingFontFamily,
                      fontWeight: 700,
                    }}
                    className="text-base sm:text-lg font-bold tracking-tight"
                  >
                    {teamData.team?.teamName || "My Team"}
                  </h2>
                </div>
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
                  { url: member.instagramUrl, icon: <InstagramIcon className={`h-3.5 w-3.5 ${BRAND_TEXT.instagram}`} />, label: "Instagram" },
                  { url: member.youtubeUrl, icon: <YoutubeIcon className={`h-3.5 w-3.5 ${BRAND_TEXT.youtube}`} />, label: "YouTube" },
                  { url: member.facebookUrl, icon: <FacebookIcon className={`h-3.5 w-3.5 ${BRAND_TEXT.facebook}`} />, label: "Facebook" },
                ].filter((item) => item.url);

                return (
                  <div
                    key={member.id}
                    style={{
                      backgroundColor: c.cardBackground,
                      borderColor: c.border,
                      boxShadow: "none",
                    }}
                    className="rounded-[5px] border p-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <CreatorAvatar
                        src={member.avatarUrl || null}
                        name={member.name || "Team"}
                        className="h-10 w-10 shrink-0 rounded-[5px] object-cover"
                        fallbackBgClass="bg-(--accent)"
                        textClassName="text-xs font-black tracking-tight text-(--on-accent)"
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
                              className="tap-scale flex h-8 w-8 items-center justify-center rounded-[5px] border transition-all hover:scale-105"
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

        {/* 5. Collab / Work with Me Section */}
        {!isListingPage && (!isTabsLayout || activeNavTab === "collab" || activeNavTab === "work") && (() => {
          if (effectiveVisibilitySettings.showCollabGigs === false) return null;

          const activePackages = (mediaKitPackages || []).filter((p) => p.isActive);
          const visibleReviews = showAllReviews ? approvedReviews : approvedReviews.slice(0, 4);
          const hasMoreReviews = approvedReviews.length > 4;

          return (
            <div id="collab-section" className={`relative z-10 order-[20] w-full text-left animate-fade-in ${isTabsLayout ? "mt-1 sm:mt-1.5 space-y-2" : "mt-4 sm:mt-5 space-y-2"}`}>
              {!isTabsLayout && (
                <TabSectionHeader
                  title="Work with me"
                  subtitle="Collab packages & custom brand inquiries."
                  primaryTextColor={c.primaryText}
                  secondaryTextColor={c.secondaryText}
                  headingFontFamily={typ.headingFontFamily}
                />
              )}

              {/* 1. WORK WITH ME SECTION (Matching Reviews Section outer card structure) */}
              <div
                id="collab-packages-section"
                style={{
                  backgroundColor: "transparent",
                  borderColor: "var(--surface-border)",
                }}
                className="rounded-[5px] border overflow-hidden text-left shadow-none"
              >
                {/* Section Header */}
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
                        Work With Me
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

                {/* Packages List: Single vertical column inside the main section container */}
                {activePackages.length > 0 && (
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
                )}
              </div>

              {/* 3. REVIEWS -> "What Brands Say" Card */}
              {effectiveVisibilitySettings.showReviews !== false && approvedReviews.length > 0 && (
                <div
                  id="collab-reviews-section"
                  style={{
                    backgroundColor: "transparent",
                    borderColor: "var(--surface-border)",
                  }}
                  className="rounded-[5px] border overflow-hidden text-left shadow-none"
                >
                  {/* Card Header */}
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

                  {/* Reviews List: Single vertical column across all breakpoints */}
                  <div className="p-2 sm:p-2.5">
                    <div className="flex flex-col space-y-2 w-full">
                      {visibleReviews.map((rev) => {
                        const ratingNum = Number(rev.rating) || 5;
                        const initial = rev.clientName ? rev.clientName.trim().charAt(0).toUpperCase() : "B";

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
              )}

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

        {/* 6. Standalone Reviews Only Mode (when accessing dedicated reviews tab directly) */}
        {reviewsOnlyMode && (
          <div id="reviews-only-section" className="relative z-10 order-[30] w-full text-left animate-fade-in mt-1.5 sm:mt-2 space-y-2">
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
                          {rev.clientName ? rev.clientName.charAt(0).toUpperCase() : "B"}
                        </div>
                        <div className="min-w-0">
                          <p style={{ color: c.primaryText }} className="text-[13px] font-medium text-(--text) leading-[18px] truncate flex items-center gap-1">
                            <span>{rev.clientName}</span>
                            {rev.isVerified && <CheckCircle2 className="h-3 w-3 text-(--accent-text) shrink-0" />}
                          </p>
                          {rev.projectTitle && (
                            <p style={{ color: c.mutedText }} className="text-[10px] font-medium truncate">
                              {rev.projectTitle}
                            </p>
                          )}
                        </div>
                      </div>
                      {rev.isVerified && (
                        <div className="flex items-center gap-0.5 text-(--accent-text) shrink-0">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${i < ratingNum ? "fill-(--accent) text-(--accent-text)" : "fill-(--text-muted) text-(--text-muted)"}`}
                            />
                          ))}
                        </div>
                      )}
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
          </div>
        )}

        {/* 7. Setup & Gear Section (landing demo shop tab or dedicated setup tab only) */}
        {!isListingPage && (landingDemo ? (!isTabsLayout || activeNavTab === "shop") : (activeNavTab === "setup")) && (
          (() => {
            const activeSetupItems = (setupList || []).filter((it) => it.isActive !== false);
            if (activeSetupItems.length === 0) return null;
            const visibleSetupItems = isSetupExpanded ? activeSetupItems : activeSetupItems.slice(0, 3);

            return (
              <div id="setup-section" className={`relative z-10 ${isTabsLayout ? "order-[4] mt-1.5 sm:mt-2 space-y-2" : "order-[45] mt-6 sm:mt-7 space-y-2.5"} w-full text-left animate-fade-in`}>
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
                        {landingDemo ? "My Setup & Shop" : "My Setup"}
                      </h2>
                    </div>
                  </div>
                  <p
                    style={{ color: c.secondaryText }}
                    className="text-xs sm:text-[13px] text-(--text-muted) font-normal px-0.5 mt-1"
                  >
                    {landingDemo ? "Gear I use & products I've made." : "Tools & gear I use to create."}
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
                        note={item.usedFor || item.modelOrPlan || item.brand}
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

        <div className="order-[70] h-3 shrink-0" aria-hidden="true" />

        {/* Normal document flow footer at bottom of scrollable area */}
        {!hideFooter && (
          <div className="order-[80] mt-auto shrink-0 select-none pt-4 -mx-4 sm:-mx-5 border-t border-(--divider) bg-transparent w-[calc(100%+2rem)] sm:w-[calc(100%+2.5rem)]">
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
          }}
          className="tap-scale fixed bottom-6 right-5 sm:bottom-20 sm:right-6 z-40 inline-flex h-11 w-11 sm:h-11 sm:w-11 items-center justify-center rounded-[5px] shadow-lg transition-all hover:scale-110 cursor-pointer"
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
