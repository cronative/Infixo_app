"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Share2,
  ArrowLeft,
  Briefcase,
  BadgeCheck,
  ChevronRight,
  Globe,
  Crown,
  Users,
  ExternalLink,
  Info,
  Handshake,
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
import { EraAwardMedal, EraBadge } from "@/components/shared/EraBadge";
import { eraInk, eraRing, getEraConfig } from "@/lib/eraConfig";
import { platformRank } from "@/components/public/about/AboutSections";
import { Popover } from "@/components/public/ui";
import {
  type CreatorEra,
  formatFans,
  getMedalGradient,
  getCreatorEra,
  getEraProgress,
  MAIN_ERAS,
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
  /** When set, shows a small "Work with me" button beside the socials (opens the Collab tab). */
  onWorkWithMe?: () => void;
}

function getPlatformIcon(platform: string, className?: string) {
  const cls = className || "h-4 w-4 sm:h-5 sm:w-5 text-white";
  const clsSmall = className || "h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 text-white";
  switch (platform.toLowerCase()) {
    case "instagram":
      return <InstagramIcon className={cls} />;
    case "youtube":
      return <YoutubeIcon className={cls} />;
    case "facebook":
      return <FacebookIcon className={cls} />;
    case "twitter":
      return <XTwitterIcon className={clsSmall} />;
    case "linkedin":
      return <LinkedinIcon className={clsSmall} />;
    case "threads":
      return <ThreadsIcon className={clsSmall} />;
    case "snapchat":
      return <SnapchatIcon className={className ? `${className} text-(--text)` : "h-4 w-4 sm:h-5 sm:w-5 text-(--text)"} />;
    case "spotify":
      return <SpotifyIcon className={cls} />;
    case "twitch":
      return <TwitchIcon className={cls} />;
    case "pinterest":
      return <PinterestIcon className={cls} />;
    case "tiktok":
      return <TikTokIcon className={cls} />;
    default:
      return <Globe className={clsSmall} />;
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
      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-[5px] bg-gradient-to-tr from-[#fd5949] via-[#d6249f] to-[#285AEB] text-white shrink-0">
        <InstagramIcon className="h-2.5 w-2.5 text-white" />
      </span>
    );
  }
  if (p === "youtube") {
    return (
      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-[5px] bg-[#FF0000] text-white shrink-0">
        <YoutubeIcon className="h-2.5 w-2.5 text-white" />
      </span>
    );
  }
  if (p === "facebook") {
    return (
      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-[5px] bg-[#1877F2] text-white shrink-0">
        <FacebookIcon className="h-2.5 w-2.5 text-white" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-[5px] bg-[#18181B] text-white shrink-0">
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
  onWorkWithMe,
}: ProfileHeaderProps) {
  // Once the big name scrolls under the sticky nav, the nav shows it centred.
  const nameRef = useRef<HTMLHeadingElement>(null);
  const [nameUnderNav, setNameUnderNav] = useState(false);
  useEffect(() => {
    const el = nameRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setNameUnderNav(!entry.isIntersecting && entry.boundingClientRect.top < 48), {
      rootMargin: "-48px 0px 0px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const formattedTagline = useMemo(() => {
    if (!tagline) return null;
    const parts = tagline.split(/\s*[,•·.]\s*/).filter(Boolean);
    return parts.length === 0 ? null : parts;
  }, [tagline]);
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
  const eraCfg = currentEra ? getEraConfig(currentEra.era) : null;

  // Creator Era popover: current badge, what it means, progress to the next tier.
  const [eraOpen, setEraOpen] = useState(false);
  const eraListRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (!eraOpen) return;
    // After paint: bring the current era into view, one row below the top of the list.
    const id = requestAnimationFrame(() => {
      const list = eraListRef.current;
      const cur = list?.querySelector<HTMLElement>("[data-current]");
      if (list && cur) list.scrollTop += cur.getBoundingClientRect().top - list.getBoundingClientRect().top - 44;
    });
    return () => cancelAnimationFrame(id);
  }, [eraOpen]);

  // Total Fans popover: per-platform counts (primary accounts only, same as the total).
  const [fansOpen, setFansOpen] = useState(false);
  const fanPlatforms = useMemo(() => {
    const main = ["instagram", "youtube", "facebook"];
    const fromBreakdown = platformBreakdown
      .filter((pb) => main.includes(pb.platform.toLowerCase()))
      .map((pb) => ({ platform: pb.platform.toLowerCase(), label: pb.label || pb.shortLabel, count: pb.count }));
    if (fromBreakdown.length > 0) return fromBreakdown.sort((a, b) => platformRank(a.platform) - platformRank(b.platform));
    return socialList
      .filter((s) => main.includes(s.platform.toLowerCase()) && typeof s.count === "number" && s.count > 0)
      .map((s) => ({ platform: s.platform.toLowerCase(), label: s.label, count: s.count as number }));
  }, [platformBreakdown, socialList]);

  const allActiveSocials = useMemo(() => {
    const list = socialList
      .filter((s) => s.hasAccount || (typeof s.count === "number" && s.count > 0) || (s.url && s.url !== "#"))
      .sort((a, b) => platformRank(a.platform) - platformRank(b.platform));
    if (list.length > 0) return list;

    if (platformBreakdown && platformBreakdown.length > 0) {
      return [...platformBreakdown].sort((a, b) => platformRank(a.platform) - platformRank(b.platform)).map((pb) => ({
        platform: pb.platform,
        label: pb.label || pb.shortLabel,
        count: pb.count,
        url: socialList.find((s) => s.platform.toLowerCase() === pb.platform.toLowerCase())?.url || "#",
        unit: pb.platform === "youtube" ? "Subscribers" : "Followers",
        hasAccount: true,
      }));
    }

    return [];
  }, [socialList, platformBreakdown]);

  return (
    // display: contents lets the nav below stick to the whole card (not just this header box).
    <header className="contents select-none">
      {/* ============================================================== */}
      {/* ROW 1: APP-STYLE NAV BAR (Compact 44px/48px, full card width)  */}
      {/* Bleeds over the card's 20px top / 16-20px side padding. It sits */}
      {/* above the card's scroll area, so it stays pinned while content  */}
      {/* scrolls underneath (z above content).                          */}
      {/* ============================================================== */}
      <div
        className="sticky top-0 z-30 -mx-[var(--card-px,16px)] -mt-5 flex h-12 items-center justify-between gap-2 px-3 rounded-none border-b border-(--divider) bg-[var(--header-bg,var(--card-bg))]"
      >
        {/* Creator name, centred, once the profile name has scrolled under the nav */}
        <span
          aria-hidden={!nameUnderNav}
          className={`pointer-events-none absolute left-1/2 top-1/2 max-w-[44%] -translate-x-1/2 -translate-y-1/2 truncate text-[14px] font-semibold text-(--text) transition-opacity duration-150 ${nameUnderNav ? "opacity-100" : "opacity-0"}`}
        >
          {displayName || "Creator"}
        </span>
        {/* Left: Back button (on subpages) OR Small Inflixo Logo (no tagline) */}
        <div className="shrink-0 flex items-center">
          {pageHeader ? (
            <Link
              href={pageHeader.backHref}
              className="tap-scale flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] border border-(--surface-border)/[0.08] bg-(--card-bg)/80 text-(--text)   hover:bg-(--surface)  transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:outline-hidden"
              title={pageHeader.backLabel}
              aria-label={pageHeader.backLabel}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/"
              className="tap-44 tap-scale flex items-center gap-1.5 group cursor-pointer focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:outline-hidden rounded-[5px] p-0.5"
              title="Inflixo"
              aria-label="Inflixo home"
            >
              <InflixoWordmark className="h-6 sm:h-7" />
            </Link>
          )}
        </div>

        {/* Right: Media Kit Pill (if present) & Share Profile Button */}
        <div className="flex items-center gap-2 shrink-0">
          {mediaKitHref && (
            <Link
              href={mediaKitHref}
              className="tap-scale inline-flex items-center gap-1 px-2.5 py-1 rounded-[5px] border border-(--surface-border)/[0.08] bg-(--card-bg)/80 hover:bg-(--surface)  text-[11px] sm:text-xs font-semibold text-(--text)  transition-all  cursor-pointer focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:outline-hidden"
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
            className="tap-scale relative inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-[5px] border border-(--surface-border) bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] px-0 text-(--accent-text) transition-colors cursor-pointer hover:bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:outline-hidden after:absolute after:-inset-1 after:content-[''] min-[360px]:px-3"
          >
            <Share2 className="h-[18px] w-[18px] shrink-0" />
            <span className="hidden text-[13px] font-semibold min-[360px]:inline">Share</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 2: STACKED PROFILE (photo on top, details centered below)       */}
      {/* ============================================================== */}
      {/* Profile block on the header surface (white on light themes), bleeding to the card edges. */}
      <div className="-mx-[var(--card-px,16px)] mb-1 border-b border-(--divider) bg-[var(--header-bg,var(--card-bg))] px-[var(--card-px,16px)] pb-3 pt-3">
      <div className="flex w-full flex-col items-center gap-2.5 mx-auto text-center">
        {/* LEFT: Creator Avatar (reduced slightly as requested: 68px on mobile, 76px on sm) */}
        <div className="relative shrink-0">
          <div className="p-[2px] sm:p-[2.5px] rounded-full " style={{ background: eraCfg ? eraRing(eraCfg) : "var(--avatar-ring)" }}>
            <div className="p-[2px] bg-[var(--header-bg,var(--card-bg))] rounded-full">
              <div className="relative h-[88px] w-[88px] sm:h-24 sm:w-24 rounded-full overflow-hidden bg-(--card-bg) ">
                {hasAvatar && photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt={displayName || "Creator"}
                    width={152}
                    height={152}
                    sizes="96px"
                    priority
                    unoptimized={isDataUrl}
                    onError={() => setFailedSrc(photoUrl)}
                    className="h-full w-full object-cover object-top rounded-full select-none"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-(--avatar-bg) text-(--avatar-text) text-lg sm:text-xl font-black select-none">
                    {initials(displayName || "Creator")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Proportional Verified Badge at Bottom-Right */}
          {isVerified && (
            <span
              className="absolute bottom-0.5 right-0.5 flex h-6 w-6 sm:h-[26px] sm:w-[26px] items-center justify-center rounded-full bg-white "
              title="Verified Creator"
              aria-label="Verified creator"
            >
              <BadgeCheck className={`h-[19px] w-[19px] sm:h-[21px] sm:w-[21px] ${BRAND_VERIFIED_FILL} text-white`} strokeWidth={2.2} />
            </span>
          )}
        </div>

        {/* DETAILS (centered under the photo): Name / @username / Category */}
        <div className="min-w-0 w-full text-center space-y-0.5">
          {/* 1. Title / Name */}
          <h1 ref={nameRef} className="text-[22px] sm:text-2xl font-bold tracking-tight text-(--text) break-words leading-tight">
            {displayName || "Creator"}
          </h1>

          {/* 2. @username */}
          <p className="text-[13px] sm:text-sm font-normal text-(--text-muted) break-all leading-tight">
            @{cleanHandle}
          </p>

          {/* 3. Category / Tagline with . separator */}
          {formattedTagline && (
            <ul className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 pt-2" aria-label="Categories">
              {formattedTagline.map((t, i) => (
                <li key={`${t}-${i}`} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-(--text-muted) opacity-50" />}
                  <span className="rounded-full bg-(--accent-soft) px-2.5 py-0.5 text-[12px] font-medium text-(--accent-text) sm:text-[13px]">{t}</span>
                </li>
              ))}
            </ul>
          )}

          {/* 4. Social Icons directly under Category */}
          {(allActiveSocials.length > 0 || onWorkWithMe) && (
            <div className="flex w-full flex-wrap items-center justify-center gap-2 pt-3">
              {allActiveSocials.map((item) => {
                const hasUrl = Boolean(item.url && item.url !== "#");

                const iconContent = (
                  <span className="flex h-10 w-10 items-center justify-center rounded-[5px] border border-(--surface-border) bg-(--surface) text-(--text) transition-colors hover:border-(--accent-text) hover:text-(--accent-text)">
                    {getPlatformIcon(item.platform, "h-[18px] w-[18px] text-current")}
                  </span>
                );

                return hasUrl ? (
                  <a
                    key={item.platform}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Visit ${item.label || item.platform}`}
                    aria-label={`Visit ${item.label || item.platform}`}
                    className="tap-44 tap-scale inline-flex items-center justify-center transition-transform cursor-pointer"
                  >
                    {iconContent}
                  </a>
                ) : (
                  <div key={item.platform} className="inline-flex items-center justify-center">
                    {iconContent}
                  </div>
                );
              })}
              {onWorkWithMe && (
                <>
                  <button
                    type="button"
                    onClick={onWorkWithMe}
                    style={{ backgroundColor: "var(--accent)", color: "var(--on-accent)" }}
                    className="tap-scale inline-flex h-10 min-w-[140px] flex-1 items-center justify-center gap-2 rounded-[5px] px-4 text-[14px] font-semibold transition-opacity hover:opacity-95 cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2 focus-visible:outline-hidden"
                    title="See collab packages"
                  >
                    <Handshake className="h-4 w-4 shrink-0" />
                    <span>Work with me</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 3: COMPACT CREATOR ERA + TOTAL FANS PILL (5px radius)      */}
      {/* ============================================================== */}
      {(currentEra || effectiveFanbase > 0) && (
        <div
          style={{
            backgroundColor: "color-mix(in srgb, var(--accent) 6%, var(--card-bg))",
            borderColor: "color-mix(in srgb, var(--accent) 16%, var(--surface-border))",
          }}
          className="mt-3 flex w-full items-center justify-evenly gap-1 rounded-[5px] border px-1 py-1"
        >
          {/* Creator Era (era colour + tier medal); opens the Era sheet */}
          {currentEra ? (
            <Popover
              open={eraOpen}
              onClose={() => setEraOpen(false)}
              label="Creator Era"
              align="left"
              widthClassName="w-[260px]"
              className="flex min-w-0 shrink justify-center"
              panelClassName="overflow-hidden"
              trigger={
                <EraBadge
                  era={currentEra.era}
                  stage={currentEra.stage}
                  label={currentEra.badge}
                  showInfo
                  expanded={eraOpen}
                  onClick={() => {
                    setFansOpen(false);
                    setEraOpen((v) => !v);
                  }}
                  style={{
                    background: "transparent",
                    borderColor: "transparent",
                    // Era ink pulled toward the theme text: deeper on light cards, lighter on dark ones.
                    color: `color-mix(in srgb, ${eraInk(getEraConfig(currentEra.era).color)} 60%, var(--text))`,
                  }}
                  className="min-w-0 max-w-full"
                />
              }
            >
              <div className="flex items-center gap-2 px-1.5 pb-2">
                <EraAwardMedal era={currentEra.era} stage={currentEra.stage} size={28} />
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold leading-[18px] text-(--text)">{currentEra.badge}</span>
                  <span className="block text-[11px] leading-4 text-(--text-muted)">{getEraConfig(currentEra.era).award} award</span>
                </span>
              </div>
              <p className="px-1.5 pb-2 text-[12px] leading-snug text-(--text-secondary)">
                Every fan is a step forward. Creator Era is made by Inflixo&apos;s AI to celebrate a creator&apos;s journey, from the first spark to legend. It grows with the fans on their Instagram, YouTube &amp; Facebook, so every milestone feels like a win worth chasing.
              </p>
              <div className="border-t border-(--surface-border) px-1.5 pt-2">
                {eraProgress.nextBadge ? (
                  <>
                    <div className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="text-(--text-muted)">Next: <span className="font-semibold text-(--text)">{eraProgress.nextBadge}</span></span>
                      <span className="shrink-0 font-semibold tabular-nums text-(--text)">{eraProgress.progressPercent}%</span>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={eraProgress.progressPercent}
                      aria-label={`Progress to ${eraProgress.nextBadge}`}
                      className="mt-1.5 h-1.5 w-full overflow-hidden rounded-[5px] bg-(--surface)"
                    >
                      <div className="h-full rounded-[5px] bg-(--accent-text)" style={{ width: `${eraProgress.progressPercent}%` }} />
                    </div>
                    <p className="mt-1.5 text-[11px] text-(--text-muted)">
                      <span className="font-semibold tabular-nums text-(--text)">{formatFans(eraProgress.fansNeeded)}</span> more fans to go
                    </p>
                  </>
                ) : (
                  <p className="text-[12px] text-(--text-muted)">Top era reached. Legendary! 👑</p>
                )}
              </div>
              {/* All eras, scrollable inside the popover (current era scrolled into view). */}
              <div className="-mx-2 -mb-2 mt-2 border-t border-(--surface-border) pt-2">
                <p className="px-3.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-(--text-muted)">All eras</p>
                {/* Full-width 1px dividers between eras (edge to edge of the popover). */}
                <ul ref={eraListRef} className="max-h-[188px] divide-y divide-(--surface-border) overflow-y-auto overscroll-contain border-t border-(--surface-border)">
                  {MAIN_ERAS.map((e, i) => {
                    const isCurrent = e.name === currentEra.era;
                    const reached = i <= MAIN_ERAS.findIndex((x) => x.name === currentEra.era);
                    return (
                      <li
                        key={e.name}
                        data-current={isCurrent || undefined}
                        aria-current={isCurrent ? "true" : undefined}
                        className={`flex items-center gap-2 px-3.5 py-2 ${isCurrent ? "bg-(--accent-soft)" : ""}`}
                      >
                        <EraAwardMedal era={e.name} stage={isCurrent ? currentEra.stage : "Gold"} size={22} className={reached ? "" : "opacity-50"} />
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[12px] font-semibold leading-4 ${isCurrent ? "text-(--accent-text)" : reached ? "text-(--text)" : "text-(--text-muted)"}`}>
                            {e.name}
                          </span>
                          <span className="block text-[11px] leading-4 text-(--text-muted)">{getEraConfig(e.name).award}</span>
                        </span>
                        {isCurrent && <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-(--accent-text)">Now</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Popover>
          ) : null}

          {currentEra && effectiveFanbase > 0 && <span aria-hidden style={{ backgroundColor: "color-mix(in srgb, var(--accent) 28%, var(--surface-border))" }} className="mx-1 h-6 w-px shrink-0" />}

          {/* Total Fans: tap for per-platform counts */}
          <Popover
            open={fansOpen}
            onClose={() => setFansOpen(false)}
            label="Fans by platform"
            align="right"
            widthClassName="w-[248px]"
            className="flex shrink-0 justify-center"
            trigger={
              <button
                type="button"
                onClick={() => {
                  setEraOpen(false);
                  setFansOpen((v) => !v);
                }}
                aria-expanded={fansOpen}
                aria-haspopup="dialog"
                className="tap-44 tap-scale inline-flex h-8 items-center gap-1.5 rounded-[5px] px-2 transition-colors cursor-pointer hover:bg-(--surface)/60 focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:outline-hidden sm:h-9"
                title="See fans by platform"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--accent-soft) sm:h-7 sm:w-7">
                  <Users className="h-3.5 w-3.5 text-(--accent-text) sm:h-4 sm:w-4" aria-hidden />
                </span>
                <span className="text-[13px] sm:text-sm font-bold text-(--text) tabular-nums leading-none">{formatFans(effectiveFanbase)}</span>
                <span className="text-[12px] sm:text-[13px] text-(--text-muted) leading-none whitespace-nowrap"><span className="hidden min-[360px]:inline">Total </span>Fans</span>
                <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-(--text-muted)" aria-hidden />
              </button>
            }
          >
            <p className="px-1.5 pb-2 text-[12px] leading-snug text-(--text-secondary)">
              Total Fans is your combined audience from your primary Instagram, YouTube &amp; Facebook accounts, calculated by Inflixo AI.
            </p>
            {fanPlatforms.length === 0 ? (
              <p className="px-1.5 py-1.5 text-xs text-(--text-muted)">No platform counts yet.</p>
            ) : (
              <ul>
                {fanPlatforms.map((p) => (
                  <li key={p.platform} className="flex items-center gap-2 rounded-[5px] px-1.5 py-1.5">
                    {getPlatformCardIcon(p.platform)}
                    <span className="min-w-0 flex-1 truncate text-[13px] text-(--text) capitalize">{p.label || p.platform}</span>
                    <span className="text-[13px] font-semibold text-(--text) tabular-nums">{formatFans(p.count)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-1 flex items-center justify-between border-t border-(--surface-border) px-1.5 pt-1.5 text-[12px]">
              <span className="text-(--text-muted)">Total</span>
              <span className="font-semibold text-(--text) tabular-nums">{formatFans(effectiveFanbase)}</span>
            </div>
          </Popover>
        </div>
      )}
      </div>

    </header>
  );
}
