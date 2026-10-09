"use client";

import React, { useState } from "react";
import { Film, Play } from "lucide-react";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
  XTwitterIcon,
  LinkedinIcon,
  SpotifyIcon,
  TwitchIcon,
  SnapchatIcon,
} from "@/components/shared/BrandIcons";

export type SupportedPlatform =
  | "YouTube"
  | "Instagram"
  | "Facebook"
  | "Spotify"
  | "Twitch"
  | "X"
  | "LinkedIn"
  | "Snapchat"
  | "Multi-Platform"
  | "Default";

export function detectPlatformFromUrlOrName(
  platform?: string | null,
  url?: string | null
): SupportedPlatform {
  const p = (platform || "").toLowerCase();
  const u = (url || "").toLowerCase();

  if (p.includes("multi") || p.includes("mix")) return "Multi-Platform";
  if (p.includes("youtube") || u.includes("youtube.com") || u.includes("youtu.be")) return "YouTube";
  if (p.includes("instagram") || u.includes("instagram.com") || u.includes("instagr.am")) return "Instagram";
  if (p.includes("facebook") || u.includes("facebook.com") || u.includes("fb.com")) return "Facebook";
  if (p.includes("spotify") || u.includes("spotify.com")) return "Spotify";
  if (p.includes("twitch") || u.includes("twitch.tv")) return "Twitch";
  if (p.includes("twitter") || p.includes("x") || u.includes("twitter.com") || u.includes("x.com")) return "X";
  if (p.includes("linkedin") || u.includes("linkedin.com")) return "LinkedIn";
  if (p.includes("snapchat") || u.includes("snapchat.com")) return "Snapchat";

  return "Default";
}

export function extractYouTubeVideoId(url?: string | null): string | null {
  if (!url) return null;
  try {
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
    );
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export interface PlatformThumbnailBoxProps {
  posterUrl?: string | null;
  videoUrl?: string | null;
  platform?: string | null;
  title?: string;
  badgeText?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
  showTitleOverlay?: boolean;
}

export function PlatformThumbnailBox({
  posterUrl,
  videoUrl,
  platform,
  title,
  badgeText,
  className = "",
  size = "md",
  showTitleOverlay = true,
}: PlatformThumbnailBoxProps) {
  const detected = detectPlatformFromUrlOrName(platform, videoUrl);

  // Derive YouTube thumbnail if no explicit poster is given
  const derivedPoster = (() => {
    if (posterUrl && posterUrl.trim() !== "") return posterUrl.trim();
    const ytId = extractYouTubeVideoId(videoUrl);
    if (ytId) {
      return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    }
    return null;
  })();

  const [hasImageError, setHasImageError] = useState(false);
  const showImage = Boolean(derivedPoster && !hasImageError);

  // Platform styling configurations
  const config = (() => {
    switch (detected) {
      case "YouTube":
        return {
          bgGradient: "bg-gradient-to-br from-[#220407] via-[#150406] to-[#0c0d12]",
          glowColor: "rgba(239, 68, 68, 0.28)",
          badgeBg: "bg-gradient-to-br from-[#FF0000] to-[#C00000] text-white shadow-red-950/60",
          icon: <YoutubeIcon className={size === "sm" ? "h-5 w-5 text-white" : "h-7 w-7 text-white"} />,
          watermark: <YoutubeIcon className="h-32 w-32 text-red-500/10" />,
          pillLabel: badgeText || "YouTube",
        };
      case "Instagram":
        return {
          bgGradient: "bg-gradient-to-br from-[#28051f] via-[#1c0525] to-[#0c0d12]",
          glowColor: "rgba(220, 39, 67, 0.28)",
          badgeBg: "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-pink-950/60",
          icon: <InstagramIcon className={size === "sm" ? "h-5 w-5 text-white" : "h-7 w-7 text-white"} />,
          watermark: <InstagramIcon className="h-32 w-32 text-pink-500/10" />,
          pillLabel: badgeText || "Instagram",
        };
      case "Facebook":
        return {
          bgGradient: "bg-gradient-to-br from-[#061833] via-[#092248] to-[#0c0d12]",
          glowColor: "rgba(24, 119, 242, 0.28)",
          badgeBg: "bg-gradient-to-tr from-[#1877F2] to-[#0c5dc2] text-white shadow-blue-950/60",
          icon: <FacebookIcon className={size === "sm" ? "h-5 w-5 text-white" : "h-7 w-7 text-white"} />,
          watermark: <FacebookIcon className="h-32 w-32 text-blue-500/10" />,
          pillLabel: badgeText || "Facebook",
        };
      case "Spotify":
        return {
          bgGradient: "bg-gradient-to-br from-[#041d0e] via-[#092b15] to-[#0c0d12]",
          glowColor: "rgba(29, 185, 84, 0.28)",
          badgeBg: "bg-gradient-to-tr from-[#1DB954] to-[#128a3c] text-white shadow-emerald-950/60",
          icon: <SpotifyIcon className={size === "sm" ? "h-5 w-5 text-white" : "h-7 w-7 text-white"} />,
          watermark: <SpotifyIcon className="h-32 w-32 text-emerald-500/10" />,
          pillLabel: badgeText || "Spotify",
        };
      case "Twitch":
        return {
          bgGradient: "bg-gradient-to-br from-[#1b0833] via-[#280c4c] to-[#0c0d12]",
          glowColor: "rgba(145, 70, 255, 0.28)",
          badgeBg: "bg-gradient-to-tr from-[#9146FF] to-[#6c1ce0] text-white shadow-purple-950/60",
          icon: <TwitchIcon className={size === "sm" ? "h-5 w-5 text-white" : "h-7 w-7 text-white"} />,
          watermark: <TwitchIcon className="h-32 w-32 text-purple-500/10" />,
          pillLabel: badgeText || "Twitch",
        };
      case "X":
        return {
          bgGradient: "bg-gradient-to-br from-[#16181c] via-[#0f1115] to-[#000000]",
          glowColor: "rgba(255, 255, 255, 0.15)",
          badgeBg: "bg-zinc-800 text-white shadow-black/80",
          icon: <XTwitterIcon className={size === "sm" ? "h-5 w-5 text-white" : "h-6 w-6 text-white"} />,
          watermark: <XTwitterIcon className="h-32 w-32 text-white/10" />,
          pillLabel: badgeText || "X",
        };
      case "LinkedIn":
        return {
          bgGradient: "bg-gradient-to-br from-[#061d36] via-[#092b4f] to-[#0c0d12]",
          glowColor: "rgba(10, 102, 194, 0.28)",
          badgeBg: "bg-[#0A66C2] text-white shadow-blue-950/60",
          icon: <LinkedinIcon className={size === "sm" ? "h-5 w-5 text-white" : "h-7 w-7 text-white"} />,
          watermark: <LinkedinIcon className="h-32 w-32 text-blue-500/10" />,
          pillLabel: badgeText || "LinkedIn",
        };
      case "Snapchat":
        return {
          bgGradient: "bg-gradient-to-br from-[#262402] via-[#1a1904] to-[#0c0d12]",
          glowColor: "rgba(255, 252, 0, 0.22)",
          badgeBg: "bg-[#FFFC00] text-black shadow-amber-950/60",
          icon: <SnapchatIcon className={size === "sm" ? "h-5 w-5 text-black" : "h-7 w-7 text-black"} />,
          watermark: <SnapchatIcon className="h-32 w-32 text-yellow-500/10" />,
          pillLabel: badgeText || "Snapchat",
        };
      default:
        return {
          bgGradient: "bg-gradient-to-br from-[#7A2253] via-[#0d1c44] to-[#0a0e1a]",
          glowColor: "rgba(122, 34, 83, 0.35)",
          badgeBg: "bg-gradient-to-tr from-[#7A2253] to-[#2563eb] text-white shadow-indigo-950/60",
          icon: <Play className={size === "sm" ? "h-5 w-5 fill-white text-white" : "h-6 w-6 fill-white text-white translate-x-0.5"} />,
          watermark: <Film className="h-32 w-32 text-blue-500/10" />,
          pillLabel: badgeText || "Series",
        };
    }
  })();

  const badgeSizeClass =
    size === "sm"
      ? "w-9 h-9 rounded-xl"
      : size === "lg"
      ? "w-16 h-16 sm:w-18 sm:h-18 rounded-3xl"
      : "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl";

  return (
    <div
      className={`relative w-full overflow-hidden select-none ${className}`}
      style={{
        background: !showImage ? undefined : undefined,
      }}
    >
      {showImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={derivedPoster!}
            alt={title || "Cover"}
            loading="lazy"
            decoding="async"
            onError={() => setHasImageError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
        </>
      ) : (
        /* Sleek Dynamic Platform Icon Fallback Box */
        <div
          className={`relative w-full h-full flex items-center justify-center overflow-hidden ${config.bgGradient}`}
        >
          {/* Subtle Radial Glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${config.glowColor} 0%, transparent 72%)`,
            }}
          />

          {/* Watermarked Giant Platform Logo in corner */}
          <div className="absolute -right-6 -bottom-6 pointer-events-none opacity-40 transform rotate-12 scale-110">
            {config.watermark}
          </div>

          {/* Big Center Platform Badge with Glass Ring */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div
              className={`flex items-center justify-center ring-2 ring-white/20 shadow-xl transition-all duration-300 group-hover:scale-108 group-hover:ring-white/35 ${badgeSizeClass} ${config.badgeBg}`}
            >
              {config.icon}
            </div>
          </div>

          {/* Subtle bottom vignette to support title legibility */}
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Title & Platform Pill Overlay */}
      {showTitleOverlay && (
        <div className="absolute inset-x-0 bottom-2 px-3 sm:px-3.5 z-20 pointer-events-none">
          <div className="flex items-end justify-between gap-2">
            {title && (
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-1 text-sm sm:text-base font-bold leading-tight text-white drop-shadow-md">
                  {title}
                </h3>
              </div>
            )}
            <span className="shrink-0 rounded-full border border-white/25 bg-black/45 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-white/95 backdrop-blur-xs shadow-xs">
              {config.pillLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
