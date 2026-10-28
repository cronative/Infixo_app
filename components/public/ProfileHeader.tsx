"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Share2,
  ArrowLeft,
  Briefcase,
  BadgeCheck,
  ChevronRight,
  Globe,
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

export interface ProfileHeaderSocialItem {
  platform: string;
  label: string;
  url: string;
  count?: number;
  handle?: string;
  hasAccount?: boolean;
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
  pageHeader?: {
    pageLabel: string;
    backHref: string;
    backLabel: string;
  } | null;
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
  pageHeader,
  mediaKitHref,
  usesDarkControls = false,
  onShareClick,
  navScrolled = false,
  onFanbaseClick,
  fansLabel = "followers",
  showPlatformBreakdown = false,
}: ProfileHeaderProps) {
  const [imgError, setImgError] = useState(false);
  const cleanHandle = username.replace(/^@/, "");
  const hasAvatar = Boolean(photoUrl) && !imgError;
  const isDataUrl = Boolean(photoUrl && photoUrl.startsWith("data:"));
  const hasSocials = socialList.length > 0;
  const hasFollowers = Boolean(totalAudience && totalAudience > 0);

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
      {/* ROW 2: LEFT-ALIGNED PROFILE ROW (Avatar + Right Column)         */}
      {/* ============================================================== */}
      <div className="flex items-center justify-start gap-3.5 sm:gap-4.5 w-full mt-2 sm:mt-2.5">
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
                    onError={() => setImgError(true)}
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

        {/* RIGHT COLUMN: Name / @username · Tagline / Socials + Followers Stat */}
        <div className="min-w-0 max-w-[calc(100%-96px)] sm:max-w-xs md:max-w-sm text-left space-y-0.5 sm:space-y-1">
          {/* 1. Name */}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text) truncate leading-tight">
            {displayName || "Creator"}
          </h1>

          {/* 2. @username · Tagline on ONE line, muted, text-sm, truncate */}
          <p className="text-xs sm:text-sm font-medium text-(--text-muted) truncate leading-tight">
            <span>@{cleanHandle}</span>
            {tagline ? (
              <>
                <span className="mx-1 text-(--text-muted) ">·</span>
                <span className="text-(--text-muted) ">{tagline}</span>
              </>
            ) : null}
          </p>

          {/* 3. Row: Social Icons (28px) | Divider | "21K followers >" */}
          {(hasSocials || hasFollowers) && (
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 pt-0.5">
              {/* Social Platform Icons Row */}
              {hasSocials && (
                <div className="flex items-center gap-2 shrink-0">
                  {socialList.map((item) => {
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

              {/* Vertical Divider - only when both socials and followers exist, hidden when wrapped on narrow screens */}
              {hasSocials && hasFollowers && (
                <div
                  className="h-3.5 w-px bg-(--surface-border) shrink-0 hidden min-[380px]:block"
                  aria-hidden="true"
                />
              )}

              {/* Followers Stat: "21K followers" with small chevron */}
              {hasFollowers && (
                <button
                  type="button"
                  onClick={onFanbaseClick}
                  aria-label="View audience details"
                  title="View audience details"
                  className="tap-scale inline-flex items-center gap-1.5 text-left group cursor-pointer focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:outline-hidden rounded-[3px] py-0.5"
                >
                  <span className="text-base sm:text-lg font-extrabold text-(--accent-text) tabular-nums leading-none">
                    {formatCount(totalAudience!)}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-(--text-muted) group-hover:text-(--text) transition-colors">
                    {fansLabel}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-(--icon) group-hover:text-(--icon-active) group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              )}
            </div>
          )}

          {/* 4. Optional per-platform breakdown: icon + count for each connected platform */}
          {showPlatformBreakdown && hasFollowers && platformBreakdown.length > 1 && (
            <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10.5px] sm:text-[11px] font-medium text-(--text-muted) leading-tight">
              {platformBreakdown.map((p, i) => (
                <span key={p.platform} className="inline-flex items-center gap-1">
                  {i > 0 && (
                    <span aria-hidden="true" className="mr-0.5 text-(--text-muted) ">
                      ·
                    </span>
                  )}
                  <span
                    className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] ${getPlatformBgClass(p.platform)}`}
                    aria-hidden="true"
                  >
                    {getMiniPlatformIcon(p.platform)}
                  </span>
                  <span>
                    {p.label || p.shortLabel} {formatCount(p.count)}
                  </span>
                </span>
              ))}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
