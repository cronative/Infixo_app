"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Share2,
  ArrowLeft,
  Briefcase,
  BadgeCheck,
  ChevronRight,
  Globe,
  Info,
  Crown,
  Users,
  ExternalLink,
} from "lucide-react";
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
  TikTokIcon,
} from "@/components/shared/BrandIcons";
import { formatCount, initials } from "@/utils/format";
import { BRAND_BG, BRAND_VERIFIED_FILL } from "@/lib/brandColors";
import { InflixoWordmark } from "@/components/brand/InflixoLogo";
import { CreatorEraBadge } from "@/components/shared/CreatorEraBadge";
import { CreatorEraBottomSheet } from "@/components/shared/CreatorEraBottomSheet";
import {
  type CreatorEra,
  formatFans,
  getMedalGradient,
  getCreatorEra,
  getEraProgress,
} from "@/lib/creatorEra";

function getEraBadgeColors(stage?: string) {
  switch (stage) {
    case "Bronze":
      return "bg-[#FFE4D6] text-[#9A3412] border-[#FED7AA]/60";
    case "Silver":
      return "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]";
    case "Gold":
      return "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]";
    default:
      return "bg-[#FFE4D6] text-[#9A3412] border-[#FED7AA]/60";
  }
}

export interface ProfileHeaderSocialItem {
  platform: string;
  label: string;
  url: string;
  count?: number;
  handle?: string;
  hasAccount?: boolean;
  unit?: string;
}

export interface ProfileHeaderPlatformBreakdown {
  platform: string;
  shortLabel: string;
  label?: string;
  count: number;
}

export interface ProfileHeaderProps {
  displayName: string;
  username: string;
  photoUrl?: string | null;
  isVerified?: boolean;
  tagline?: string | null;
  socialList?: ProfileHeaderSocialItem[];
  totalAudience?: number;
  fanbasePlatformCount?: number;
  singlePlatformName?: string;
  platformBreakdown?: ProfileHeaderPlatformBreakdown[];
  eraBadge?: string | null;
  creatorEra?: CreatorEra | null;
  pageHeader?: {
    pageLabel: string;
    backHref: string;
    backLabel: string;
  } | null;
  isListingPage?: boolean;
  mediaKitHref?: string;
  usesDarkControls?: boolean;
  onShareClick: (e?: React.MouseEvent) => void;
  /** Card content has scrolled: the nav bar's shadow gets a little stronger. */
  navScrolled?: boolean;
  onFanbaseClick?: () => void;
  /** Word shown after the combined count (default "followers"). */
  fansLabel?: string;
  /** Show a per-platform breakdown line (icon + count) under the combined count. */
  showPlatformBreakdown?: boolean;
}

function getPlatformIcon(platform: string) {
  switch (platform.toLowerCase()) {
    case "instagram":
      return <InstagramIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />;
    case "youtube":
      return <YoutubeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />;
    case "facebook":
      return <FacebookIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />;
    case "twitter":
      return <XTwitterIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />;
    case "linkedin":
      return <LinkedinIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />;
    case "threads":
      return <ThreadsIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />;
    case "snapchat":
      return <SnapchatIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-(--text)" />;
    case "spotify":
      return <SpotifyIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />;
    case "twitch":
      return <TwitchIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />;
    case "pinterest":
      return <PinterestIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />;
    case "tiktok":
      return <TikTokIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />;
    default:
      return <Globe className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />;
  }
}

function getPlatformBgClass(platform: string) {
  switch (platform.toLowerCase()) {
    case "instagram":
      return `${BRAND_BG.instagram} text-white`;
    case "youtube":
      return `${BRAND_BG.youtube} text-white`;
    case "facebook":
      return `${BRAND_BG.facebook} text-white`;
    case "twitter":
    case "threads":
    case "tiktok":
      return "bg-black text-white";
    case "linkedin":
      return `${BRAND_BG.linkedin} text-white`;
    case "snapchat":
      return `${BRAND_BG.snapchat} text-black`;
    case "spotify":
      return `${BRAND_BG.spotify} text-white`;
    case "twitch":
      return `${BRAND_BG.twitch} text-white`;
    case "pinterest":
      return `${BRAND_BG.pinterest} text-white`;
    default:
      return "bg-(--accent) text-(--on-accent)";
  }
}

function getMiniPlatformIcon(platform: string) {
  const cls = "h-2 w-2 text-white";
  switch (platform.toLowerCase()) {
    case "instagram":
      return <InstagramIcon className={cls} />;
    case "youtube":
      return <YoutubeIcon className={cls} />;
    case "facebook":
      return <FacebookIcon className={cls} />;
    default:
      return <Globe className={cls} />;
  }
}

function getPlatformMiniBadge(platform: string) {
  const p = platform.toLowerCase();
  if (p === "instagram") {
    return (
      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-[3px] bg-gradient-to-tr from-[#fd5949] via-[#d6249f] to-[#285AEB] text-white shrink-0">
        <InstagramIcon className="h-2.5 w-2.5 text-white" />
      </span>
    );
  }
  if (p === "youtube") {
    return (
      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-[3px] bg-[#FF0000] text-white shrink-0">
        <YoutubeIcon className="h-2.5 w-2.5 text-white" />
      </span>
    );
  }
  if (p === "facebook") {
    return (
      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-[3px] bg-[#1877F2] text-white shrink-0">
        <FacebookIcon className="h-2.5 w-2.5 text-white" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-[3px] bg-[#18181B] text-white shrink-0">
      {getPlatformIcon(p)}
    </span>
  );
}

function getPlatformRowStyles(platform: string) {
  const p = platform.toLowerCase();
  switch (p) {
    case "instagram":
      return {
        boxBg: "bg-[#FDF2F8]",
        boxBorder: "border-[#FCE7F3]",
        unit: "Followers",
      };
    case "youtube":
      return {
        boxBg: "bg-[#FEF2F2]",
        boxBorder: "border-[#FEE2E2]",
        unit: "Subscribers",
      };
    case "facebook":
      return {
        boxBg: "bg-[#EFF6FF]",
        boxBorder: "border-[#DBEAFE]",
        unit: "Followers",
      };
    case "twitter":
    case "x":
      return {
        boxBg: "bg-[#F4F4F5]",
        boxBorder: "border-[#E4E4E7]",
        unit: "Followers",
      };
    case "linkedin":
      return {
        boxBg: "bg-[#EFF6FF]",
        boxBorder: "border-[#DBEAFE]",
        unit: "Followers",
      };
    default:
      return {
        boxBg: "bg-[#FAFAFB]",
        boxBorder: "border-[#ECECF0]",
        unit: "Followers",
      };
  }
}

function getPlatformCircleIcon(platform: string) {
  const p = platform.toLowerCase();
  if (p === "instagram") {
    return (
      <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="ig-stats-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f09433" />
            <stop offset="25%" stopColor="#e6683c" />
            <stop offset="50%" stopColor="#dc2743" />
            <stop offset="75%" stopColor="#cc2366" />
            <stop offset="100%" stopColor="#bc1888" />
          </linearGradient>
        </defs>
        <path
          fill="url(#ig-stats-grad)"
          d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
        />
      </svg>
    );
  }
  if (p === "youtube") {
    return <YoutubeIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#FF0000]" />;
  }
  if (p === "facebook") {
    return <FacebookIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#1877F2]" />;
  }
  if (p === "twitter" || p === "x") {
    return <XTwitterIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#18181B]" />;
  }
  if (p === "linkedin") {
    return <LinkedinIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A66C2]" />;
  }
  return <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#71717A]" />;
}

function getPlatformCardIcon(platform: string) {
  const p = platform.toLowerCase();
  if (p === "instagram") {
    return (
      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-[5px] flex items-center justify-center shrink-0 bg-gradient-to-tr from-[#fd5949] via-[#d6249f] to-[#285AEB] text-white">
        <InstagramIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
      </div>
    );
  }
  if (p === "youtube") {
    return (
      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-[5px] flex items-center justify-center shrink-0 bg-[#FF0000] text-white">
        <YoutubeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
      </div>
    );
  }
  if (p === "facebook") {
    return (
      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-[5px] flex items-center justify-center shrink-0 bg-[#1877F2] text-white">
        <FacebookIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
      </div>
    );
  }
  return (
    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-[5px] flex items-center justify-center shrink-0 bg-[#18181B] text-white">
      {getPlatformIcon(p)}
    </div>
  );
}

export function ProfileHeader({
  displayName,
  username,
  photoUrl,
  isVerified = true,
  tagline,
  socialList = [],
  totalAudience = 0,
  fanbasePlatformCount = 0,
  singlePlatformName = "Instagram",
  platformBreakdown = [],
  eraBadge,
  creatorEra,
  pageHeader,
  isListingPage,
  mediaKitHref,
  usesDarkControls = false,
  onShareClick,
  navScrolled = false,
  onFanbaseClick,
  fansLabel = "followers",
  showPlatformBreakdown = false,
}: ProfileHeaderProps) {
  const formattedTagline = useMemo(() => {
    if (!tagline) return null;
    const parts = tagline.split(/\s*[,•·.]\s*/).filter(Boolean);
    if (parts.length === 0) return null;
    return parts.join(" • ");
  }, [tagline]);
  const [eraSheetOpen, setEraSheetOpen] = useState(false);
  // Track the failed URL (not a boolean) so a new photoUrl gets a fresh attempt; expired Instagram URLs fall back to initials.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const cleanHandle = username.replace(/^@/, "");
  const hasAvatar = Boolean(photoUrl) && failedSrc !== photoUrl;
  const isDataUrl = Boolean(photoUrl && photoUrl.startsWith("data:"));
  const hasSocials = socialList.length > 0;
  const hasFollowers = Boolean(totalAudience && totalAudience > 0);
  const effectiveFanbase = totalAudience || creatorEra?.min || 0;
  const currentEra = creatorEra || (effectiveFanbase > 0 ? getCreatorEra(effectiveFanbase) : null);
  const eraProgress = getEraProgress(effectiveFanbase);

  const primaryPlatforms = useMemo(() => {
    const priority = ["instagram", "youtube", "facebook"];
    const found = priority
      .map((p) => socialList.find((s) => s.platform.toLowerCase() === p))
      .filter(Boolean) as ProfileHeaderSocialItem[];

    if (found.some((s) => s.hasAccount || (typeof s.count === "number" && s.count > 0))) {
      return found.filter((s) => s.hasAccount || (typeof s.count === "number" && s.count > 0));
    }

    if (platformBreakdown && platformBreakdown.length > 0) {
      return platformBreakdown.map((pb) => ({
        platform: pb.platform,
        label: pb.label || pb.shortLabel,
        count: pb.count,
        url: socialList.find((s) => s.platform.toLowerCase() === pb.platform.toLowerCase())?.url || "#",
        unit: pb.platform === "youtube" ? "Subscribers" : "Followers",
        hasAccount: true,
      }));
    }

    return socialList.filter((s) => s.hasAccount || (typeof s.count === "number" && s.count > 0));
  }, [socialList, platformBreakdown]);

  const otherSocials = useMemo(() => {
    return socialList.filter(
      (s) =>
        !primaryPlatforms.some((p) => p.platform.toLowerCase() === s.platform.toLowerCase()) &&
        (s.hasAccount || (typeof s.count === "number" && s.count > 0) || (s.url && s.url !== "#"))
    );
  }, [socialList, primaryPlatforms]);

  return (
    <header className="w-full shrink-0 select-none pb-1">
      {/* ============================================================== */}
      {/* ROW 1: APP-STYLE NAV BAR (56px, full card width)               */}
      {/* Bleeds over the card's 20px top / 16-20px side padding. It sits */}
      {/* above the card's scroll area, so it stays pinned while content  */}
      {/* scrolls underneath (z above content).                          */}
      {/* ============================================================== */}
      <div
        className="relative z-30 -mx-4 sm:-mx-5 -mt-[20px] mb-3 flex h-14 items-center justify-between gap-2 px-5 rounded-none border-b border-(--divider) bg-transparent transition-shadow duration-200"
        style={{ boxShadow: navScrolled ? "var(--nav-shadow-scrolled)" : "var(--nav-shadow)" }}
      >
        {/* Left: Back button (on subpages) OR Small Inflixo Logo (no tagline) */}
        <div className="shrink-0 flex items-center">
          {pageHeader ? (
            <Link
              href={pageHeader.backHref}
              className="tap-scale flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] border border-(--surface-border)/[0.08] bg-(--card-bg)/80 text-(--text)  shadow-2xs hover:bg-(--surface)  transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:outline-hidden"
              title={pageHeader.backLabel}
              aria-label={pageHeader.backLabel}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/"
              className="tap-scale flex items-center gap-1.5 group cursor-pointer focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:outline-hidden rounded-[4px] p-0.5"
              title="Inflixo"
              aria-label="Inflixo home"
            >
              <InflixoWordmark className="h-7" />
            </Link>
          )}
        </div>

        {/* Right: Media Kit Pill (if present) & Share Profile Button */}
        <div className="flex items-center gap-2 shrink-0">
          {mediaKitHref && (
            <Link
              href={mediaKitHref}
              className="tap-scale inline-flex items-center gap-1 px-2.5 py-1 rounded-[5px] border border-(--surface-border)/[0.08] bg-(--card-bg)/80 hover:bg-(--surface)  text-[11px] sm:text-xs font-semibold text-(--text)  transition-all shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:outline-hidden"
              title="View media kit"
              aria-label="View media kit"
            >
              <Briefcase className="h-3 w-3 text-(--accent-text) shrink-0" />
              <span>Media kit</span>
            </Link>
          )}

          <button
            type="button"
            onClick={onShareClick}
            title="Share profile"
            aria-label="Share profile"
            className="tap-scale flex h-9 w-9 items-center justify-center rounded-[5px] bg-transparent hover:bg-(--accent-soft) text-(--icon) transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:outline-hidden"
          >
            <Share2 className="h-4 w-4 shrink-0" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* ROW 2: CENTER-ALIGNED PROFILE ROW (Avatar + Right Column)       */}
      {/* ============================================================== */}
      <div className="flex items-center justify-center gap-3.5 sm:gap-4.5 w-full mt-2 sm:mt-2.5 mx-auto">
        {/* LEFT: Creator Avatar (80px on mobile, 88px on >=640px) */}
        <div className="relative shrink-0">
          <div className="p-[2px] sm:p-[2.5px] rounded-full shadow-xs" style={{ background: "var(--avatar-ring)" }}>
            <div className="p-[1.5px] bg-(--card-bg) rounded-full">
              <div className="relative h-20 w-20 sm:h-[88px] sm:w-[88px] rounded-full overflow-hidden bg-(--card-bg) ">
                {hasAvatar && photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt={displayName || "Creator"}
                    width={176}
                    height={176}
                    sizes="88px"
                    priority
                    unoptimized={isDataUrl}
                    onError={() => setFailedSrc(photoUrl)}
                    className="h-full w-full object-cover object-top rounded-full select-none"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-(--avatar-bg) text-(--avatar-text) text-xl sm:text-2xl font-black select-none">
                    {initials(displayName || "Creator")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Proportional Verified Badge at Bottom-Right */}
          {isVerified && (
            <span
              className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center"
              title="Verified Creator"
              aria-label="Verified creator"
            >
              <BadgeCheck className={`h-4.5 w-4.5 sm:h-5 sm:w-5 ${BRAND_VERIFIED_FILL} text-white drop-shadow-xs`} />
            </span>
          )}
        </div>

        {/* RIGHT COLUMN: Name / @username / Category (Clean layout or compact listing layout) */}
        <div className="min-w-0 text-left space-y-0.5">
          {/* 1. Title / Name */}
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-(--text) truncate leading-tight">
            {displayName || "Creator"}
          </h1>

          {/* 2. @username */}
          <p className="text-xs sm:text-sm font-medium text-(--text-muted) truncate leading-tight">
            @{cleanHandle}
          </p>

          {/* 3. Category / Tagline with . separator */}
          {formattedTagline && (
            <p className="text-xs sm:text-sm font-normal text-(--text-muted) truncate leading-tight">
              {formattedTagline}
            </p>
          )}

          {/* Era Badge inline (mockup: Square crown icon + Peach pill + Info icon) */}
          {currentEra && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setEraSheetOpen(true);
                  if (onFanbaseClick) onFanbaseClick();
                }}
                className="tap-scale inline-flex items-center gap-2 cursor-pointer group text-left select-none"
                title="View Creator Era details"
                aria-label="View Creator Era details"
              >
                {/* Square icon with crown */}
                <div
                  className="w-5 h-5 rounded-[4px] flex items-center justify-center shrink-0 shadow-2xs text-white"
                  style={{
                    background:
                      currentEra.stage === "Gold"
                        ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
                        : currentEra.stage === "Silver"
                        ? "linear-gradient(135deg, #94A3B8 0%, #64748B 100%)"
                        : "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)",
                  }}
                >
                  <Crown className="h-3 w-3 fill-white text-white drop-shadow-xs" />
                </div>

                {/* Pill with era badge title */}
                <span
                  className="px-2.5 py-0.5 rounded-[5px] text-xs font-bold leading-normal truncate"
                  style={{
                    background:
                      currentEra.stage === "Gold"
                        ? "#FEF3C7"
                        : currentEra.stage === "Silver"
                        ? "#F1F5F9"
                        : "#FFF7ED",
                    color:
                      currentEra.stage === "Gold"
                        ? "#92400E"
                        : currentEra.stage === "Silver"
                        ? "#334155"
                        : "#9A3412",
                  }}
                >
                  {currentEra.badge}
                </span>

                {/* Info icon */}
                <Info className="h-4 w-4 text-[#71717A] group-hover:text-[#18181B] transition-colors shrink-0" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 3: STATS GRID (Dashboard-style Rectangular Boxes)          */}
      {/* 2 columns on mobile, 4 columns on tablet/desktop               */}
      {/* ============================================================== */}
      {(effectiveFanbase > 0 || primaryPlatforms.length > 0) && (
        <div className="w-full mt-3 sm:mt-4 pt-0.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2.5 w-full">
            {/* Box 1: Total Fans */}
            <button
              type="button"
              onClick={() => {
                setEraSheetOpen(true);
                if (onFanbaseClick) onFanbaseClick();
              }}
              className="tap-scale flex items-stretch rounded-[5px] border border-[#ECECF0] hover:border-[#CBD5E1] bg-white overflow-hidden transition-all text-left cursor-pointer group h-[38px] sm:h-[42px]"
              title="View fanbase breakdown"
              aria-label="View fanbase breakdown"
            >
              {/* Full-height Square Left Icon Box */}
              <div className="flex w-8 sm:w-9 shrink-0 items-center justify-center border-r border-[#ECECF0] bg-[#FAFAFB] text-[#71717A] group-hover:bg-[#F4F4F5] transition-colors">
                <Users className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              </div>
              {/* Right Content: Baju me Count, Niche Label */}
              <div className="flex-1 min-w-0 px-2 py-0.5 sm:px-2.5 sm:py-1 flex flex-col justify-center">
                <div className="text-[12px] sm:text-[13px] font-bold text-[#18181B] leading-tight tabular-nums truncate">
                  {formatFans(effectiveFanbase)}
                </div>
                <div className="text-[9px] sm:text-[10px] text-[#71717A] leading-none font-normal truncate mt-0.5">
                  Total Fans
                </div>
              </div>
            </button>

            {/* Platform Boxes */}
            {primaryPlatforms.map((item) => {
              const styles = getPlatformRowStyles(item.platform);
              const unitText = item.unit || styles.unit;
              const hasUrl = Boolean(item.url && item.url !== "#");

              const boxContent = (
                <>
                  {/* Full-height Square Left Icon Box */}
                  <div
                    className={`flex w-8 sm:w-9 shrink-0 items-center justify-center border-r ${styles.boxBorder} ${styles.boxBg}`}
                  >
                    {getPlatformCircleIcon(item.platform)}
                  </div>
                  {/* Right Content: Baju me Count, Niche Label */}
                  <div className="flex-1 min-w-0 px-2 py-0.5 sm:px-2.5 sm:py-1 flex flex-col justify-center">
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className="text-[12px] sm:text-[13px] font-bold text-[#18181B] leading-tight tabular-nums truncate">
                        {formatFans(item.count || 0)}
                      </span>
                      {hasUrl && (
                        <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#A1A1AA] group-hover:text-[#18181B] transition-colors shrink-0" />
                      )}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-[#71717A] leading-none font-normal truncate mt-0.5">
                      {unitText}
                    </div>
                  </div>
                </>
              );

              const boxClass =
                "tap-scale flex items-stretch rounded-[5px] border border-[#ECECF0] hover:border-[#CBD5E1] bg-white overflow-hidden transition-all text-left group h-[38px] sm:h-[42px]";

              return hasUrl ? (
                <a
                  key={item.platform}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Visit ${item.label || item.platform}`}
                  aria-label={`Visit ${item.label || item.platform}`}
                  className={`${boxClass} cursor-pointer`}
                >
                  {boxContent}
                </a>
              ) : (
                <div key={item.platform} className={boxClass}>
                  {boxContent}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Extra Social Accounts (if creator has Twitter, LinkedIn, etc. not in primary card) */}
      {otherSocials.length > 0 && (
        <div className="flex items-center gap-2 pt-2.5 w-full">
          {otherSocials.map((item) => {
            const bgClass = getPlatformBgClass(item.platform);
            return (
              <a
                key={item.platform}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`Visit ${item.label}`}
                aria-label={`${item.label} profile of ${displayName || "creator"}`}
                className={`tap-scale flex h-7 w-7 items-center justify-center rounded-[5px] ${bgClass} shadow-2xs hover:scale-105 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:outline-hidden`}
              >
                <span className="flex items-center justify-center">
                  {getPlatformIcon(item.platform)}
                </span>
              </a>
            );
          })}
        </div>
      )}

      {currentEra && (
        <CreatorEraBottomSheet
          isOpen={eraSheetOpen}
          onClose={() => setEraSheetOpen(false)}
          era={currentEra}
          totalFans={effectiveFanbase}
          creatorName={displayName}
          creatorUsername={cleanHandle}
          isCreatorView={false}
          primaryAccounts={socialList
            .filter((s) => s.handle || (typeof s.count === "number" && s.count > 0))
            .map((s) => ({
              platform: s.platform,
              username: s.handle || s.label || "",
              count: s.count,
              url: s.url,
            }))}
        />
      )}
    </header>
  );
}
