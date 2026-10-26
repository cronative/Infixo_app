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
  onFanbaseClick?: () => void;
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
      return <SnapchatIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-950" />;
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
      return "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white";
    case "youtube":
      return "bg-[#FF0000] text-white";
    case "facebook":
      return "bg-[#1877F2] text-white";
    case "twitter":
    case "threads":
    case "tiktok":
      return "bg-black text-white";
    case "linkedin":
      return "bg-[#0A66C2] text-white";
    case "snapchat":
      return "bg-[#FFFC00] text-black";
    case "spotify":
      return "bg-[#1DB954] text-white";
    case "twitch":
      return "bg-[#9146FF] text-white";
    case "pinterest":
      return "bg-[#E60023] text-white";
    default:
      return "bg-slate-800 text-white";
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
  onFanbaseClick,
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
      {/* ROW 1: SLIM TOP BAR (~32-36px)                                  */}
      {/* ============================================================== */}
      <div className="flex items-center justify-between gap-2 h-8 sm:h-9 w-full">
        {/* Left: Back button (on subpages) OR Small Inflixo Logo (no tagline) */}
        <div className="shrink-0 flex items-center">
          {pageHeader ? (
            <Link
              href={pageHeader.backHref}
              className="tap-scale flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7A2253] focus-visible:outline-hidden"
              title={pageHeader.backLabel}
              aria-label={pageHeader.backLabel}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/"
              className="tap-scale flex items-center gap-1.5 group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7A2253] focus-visible:outline-hidden rounded-[4px] p-0.5"
              title="Inflixo"
              aria-label="Inflixo home"
            >
              <div className="flex h-5 w-5 sm:h-[22px] sm:w-[22px] shrink-0 items-center justify-center rounded-[4px] overflow-hidden shadow-2xs border border-white/20 bg-[#7A2253]">
                <Image
                  src="/images/inflixo-logo-3d.png"
                  alt="Inflixo"
                  width={22}
                  height={22}
                  className="h-full w-full object-cover select-none"
                  priority
                />
              </div>
              <Image
                src={
                  usesDarkControls
                    ? "/images/inflixo-wordmark-title-white.png"
                    : "/images/inflixo-wordmark-title.png"
                }
                alt="Inflixo"
                width={628}
                height={186}
                className="h-[18px] sm:h-[20px] w-auto max-w-[65px] sm:max-w-[72px] object-contain select-none opacity-85 group-hover:opacity-100 transition-opacity"
                priority
              />
            </Link>
          )}
        </div>

        {/* Right: Media Kit Pill (if present) & Share Profile Button */}
        <div className="flex items-center gap-2 shrink-0">
          {mediaKitHref && (
            <Link
              href={mediaKitHref}
              className="tap-scale inline-flex items-center gap-1 px-2.5 py-1 rounded-[5px] border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 hover:bg-slate-50 dark:hover:bg-zinc-800 text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7A2253] focus-visible:outline-hidden"
              title="View media kit"
              aria-label="View media kit"
            >
              <Briefcase className="h-3 w-3 text-[#7A2253] dark:text-rose-400 shrink-0" />
              <span>Media kit</span>
            </Link>
          )}

          <button
            type="button"
            onClick={onShareClick}
            title="Share profile"
            aria-label="Share profile"
            className="tap-scale flex h-8 w-8 items-center justify-center rounded-[5px] border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-200 transition-all shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7A2253] focus-visible:outline-hidden"
          >
            <Share2 className="h-3.5 w-3.5 shrink-0" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 2: LEFT-ALIGNED PROFILE ROW (Avatar + Right Column)         */}
      {/* ============================================================== */}
      <div className="flex items-center justify-start gap-3.5 sm:gap-4.5 w-full mt-2 sm:mt-2.5">
        {/* LEFT: Creator Avatar (80px on mobile, 88px on >=640px) */}
        <div className="relative shrink-0">
          <div className="p-[2px] sm:p-[2.5px] rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] shadow-xs">
            <div className="p-[1.5px] bg-white dark:bg-[#18181B] rounded-full">
              <div className="relative h-20 w-20 sm:h-[88px] sm:w-[88px] rounded-full overflow-hidden bg-white dark:bg-zinc-900">
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
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-[#7A2253] text-white text-xl sm:text-2xl font-black select-none">
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
              <BadgeCheck className="h-4.5 w-4.5 sm:h-5 sm:w-5 fill-[#1877F2] text-white drop-shadow-xs" />
            </span>
          )}
        </div>

        {/* RIGHT COLUMN: Name / @username · Tagline / Socials + Followers Stat */}
        <div className="min-w-0 max-w-[calc(100%-96px)] sm:max-w-xs md:max-w-sm text-left space-y-0.5 sm:space-y-1">
          {/* 1. Name */}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate leading-tight">
            {displayName || "Creator"}
          </h1>

          {/* 2. @username · Tagline on ONE line, muted, text-sm, truncate */}
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 truncate leading-tight">
            <span>@{cleanHandle}</span>
            {tagline ? (
              <>
                <span className="mx-1 text-slate-400 dark:text-slate-500">·</span>
                <span className="text-slate-600 dark:text-slate-300">{tagline}</span>
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
                        className={`tap-scale flex h-7 w-7 items-center justify-center rounded-[5px] ${bgClass} shadow-2xs hover:scale-105 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7A2253] focus-visible:outline-hidden`}
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
                  className="h-3.5 w-px bg-slate-300 dark:bg-white/15 shrink-0 hidden min-[380px]:block"
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
                  className="tap-scale inline-flex items-center gap-1.5 text-left group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7A2253] focus-visible:outline-hidden rounded-[3px] py-0.5"
                >
                  <span className="text-base sm:text-lg font-extrabold text-[#7A2253] dark:text-rose-400 tabular-nums leading-none">
                    {formatCount(totalAudience!)}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                    followers
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#7A2253] dark:group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
