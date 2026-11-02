"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Crown, Play } from "lucide-react";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
} from "@/components/shared/BrandIcons";
import { Series } from "@/types";
import { initials } from "@/utils/format";
import {
  SHOW_SERIES_BADGES,
  SHOW_START_WATCHING,
} from "@/components/series/seriesConfig";
import { BRAND_TEXT } from "@/lib/brandColors";
import { SeriesCoverLogo } from "@/components/series/SeriesCoverLogo";
import { getSeriesCoverUrl } from "@/lib/videoUrl";

export interface FeaturedSeriesCardProps {
  series: Series;
  creatorHandle: string;
  creatorAvatar?: string | null;
  creatorName?: string;
  episodesCount: number;
  detectedPlatform: string;
  onOpen?: (series: Series) => void;
  openMode?: "page" | "internal";
}

function getPlatformIcon(platform: string) {
  const p = platform.toLowerCase();
  if (p.includes("youtube")) {
    return <YoutubeIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-500 shrink-0" />;
  }
  if (p.includes("instagram")) {
    return <InstagramIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-pink-500 shrink-0" />;
  }
  if (p.includes("facebook")) {
    return <FacebookIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-500 shrink-0" />;
  }
  if (p.includes("mix") || p.includes("multi")) {
    return <span className="text-[10px] leading-none shrink-0">✨</span>;
  }
  return null;
}

// Brand-tinted 1x1 maroon SVG blur data URL to prevent blank flash
const MAROON_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiM3QTIyNTMiLz48L3N2Zz4=";

export function FeaturedSeriesCard({
  series,
  creatorHandle,
  creatorAvatar,
  creatorName,
  episodesCount,
  detectedPlatform,
  onOpen,
  openMode = "page",
}: FeaturedSeriesCardProps) {
  const [imgError, setImgError] = useState(false);
  const [nowMs] = useState(() => Date.now());
  const seriesUrl = `/${creatorHandle}/series/${series.id}`;

  // Check if an episode was released in the last 7 days
  const hasNewEpisode = (() => {
    if (!series.createdAt) return false;
    const createdMs = new Date(series.createdAt).getTime();
    if (Number.isNaN(createdMs)) return false;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return nowMs - createdMs <= sevenDaysMs;
  })();

  const isCompleted = (series as any).status === "completed" || (series as any).isCompleted === true;
  const statusLabel = isCompleted ? "Completed" : "Ongoing";

  // Wording: "1 episode" vs "5 episodes"
  const episodeText = `${episodesCount} ${episodesCount === 1 ? "episode" : "episodes"}`;

  // Meta line 1: "{n} episodes · {language}"
  const line1 = [episodeText, series.language?.trim()].filter(Boolean).join(" · ");

  // Platform info formatted cleanly
  const platformName = (() => {
    const p = (detectedPlatform || series.platform || "").toLowerCase();
    if (p.includes("youtube")) return "YouTube";
    if (p.includes("instagram")) return "Instagram";
    if (p.includes("facebook")) return "Facebook";
    if (p.includes("mix") || p.includes("multi")) return "Mix";
    return detectedPlatform || series.platform || "YouTube";
  })();

  // Meta line 2: platform icon + name · first genre (+N if more). Mobile <=400px: hide genres.
  const parsedGenres = (series.genre || "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);

  const firstGenre = parsedGenres[0] || "";
  const remainingGenreCount = parsedGenres.length - 1;
  const genreText = firstGenre
    ? `${firstGenre}${remainingGenreCount > 0 ? ` (+${remainingGenreCount})` : ""}`
    : "";

  const handleClick = (e: React.MouseEvent) => {
    if (onOpen && openMode === "internal") {
      e.preventDefault();
      onOpen(series);
    }
  };

  const coverUrl = getSeriesCoverUrl(series);
  const hasPoster = Boolean(coverUrl) && !imgError;
  const focalPoint = (series as any).focalPoint || (series as any).posterPosition || "center";

  return (
    <div className="w-full text-left">
      {/* 5:2 Hero Poster Card */}
      <Link
        href={seriesUrl}
        onClick={handleClick}
        className="group relative block w-full aspect-[5/2] rounded-2xl overflow-hidden bg-(--accent) shadow-md hover:shadow-xl transition-all duration-300 focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:outline-hidden select-none"
      >
        {/* Background Poster Image or Fallback */}
        {hasPoster ? (
          <Image
            src={coverUrl!}
            alt=""
            fill
            sizes="(max-width: 600px) 100vw, 540px"
            quality={80}
            priority
            placeholder="blur"
            blurDataURL={MAROON_BLUR_DATA_URL}
            onError={() => setImgError(true)}
            style={{ objectPosition: focalPoint }}
            className="object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out select-none"
          />
        ) : (
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-(--cover-from) to-(--cover-to)">
            <SeriesCoverLogo />
          </div>
        )}

        {/* Strong bottom scrim: covers bottom ~65% of poster for 100% text readability */}
        <div
          className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Content on Poster: Bottom Left & Bottom Right */}
        <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3.5 z-10 flex flex-col justify-end text-left pointer-events-none">
          {/* Status Badge Row (solid backgrounds for contrast on bright skies) */}
          {SHOW_SERIES_BADGES && (
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5 sm:mb-1">
              <span className="inline-flex items-center gap-1 rounded-[4px] bg-(--accent) text-(--on-accent) px-1.5 sm:px-2 py-0.5 text-[9.5px] sm:text-[10.5px] font-bold tracking-wide shadow-xs">
                <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-white text-white shrink-0" />
                <span>Featured</span>
              </span>

              <span className="inline-flex items-center rounded-[4px] bg-black/60 text-white px-1.5 sm:px-2 py-0.5 text-[9.5px] sm:text-[10.5px] font-semibold shadow-xs">
                {statusLabel}
              </span>

              {hasNewEpisode && (
                <span className="inline-flex items-center rounded-[4px] bg-(--accent) text-(--on-accent) px-1.5 sm:px-2 py-0.5 text-[9.5px] sm:text-[10.5px] font-bold shadow-xs">
                  New episode
                </span>
              )}
            </div>
          )}

          {/* Series Title: white, semibold, max 1 line with subtle text-shadow */}
          <h3
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
            className="text-base sm:text-lg font-semibold tracking-tight text-white line-clamp-1 break-words leading-snug drop-shadow-sm group-hover:text-(--accent-soft) transition-colors"
          >
            {series.title}
          </h3>

          {/* Meta lines (max 2 lines) */}
          <div className="mt-1 space-y-0.5 min-w-0">
            {/* Line 1: {n} episodes · {language} */}
            <div
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
              className="text-[11px] sm:text-xs font-medium text-white/85 line-clamp-1 break-words"
            >
              {line1}
            </div>

            {/* Line 2: platform icon + name · first genre (+N if more). Mobile <=400px: hide genres */}
            <div
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
              className="text-[11px] sm:text-xs font-medium text-white/85 flex items-center gap-1.5 line-clamp-1 break-words min-w-0"
            >
              {getPlatformIcon(platformName)}
              <span className="shrink-0">{platformName}</span>
              {genreText && (
                <span className="hidden min-[401px]:inline truncate">
                  · {genreText}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
