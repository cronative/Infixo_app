"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
} from "@/components/shared/BrandIcons";
import { Series } from "@/types";
import { initials } from "@/utils/format";
import { BRAND_TEXT } from "@/lib/brandColors";
import { SeriesCoverLogo } from "@/components/series/SeriesCoverLogo";

export interface SeriesPosterCardProps {
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
    return <YoutubeIcon className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${BRAND_TEXT.youtube} shrink-0`} />;
  }
  if (p.includes("instagram")) {
    return <InstagramIcon className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${BRAND_TEXT.instagram} shrink-0`} />;
  }
  if (p.includes("facebook")) {
    return <FacebookIcon className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${BRAND_TEXT.facebook} shrink-0`} />;
  }
  return null;
}

// Brand-tinted 1x1 maroon SVG blur data URL to prevent blank flash
const MAROON_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiM3QTIyNTMiLz48L3N2Zz4=";

export function SeriesPosterCard({
  series,
  creatorHandle,
  creatorAvatar,
  creatorName,
  episodesCount,
  detectedPlatform,
  onOpen,
  openMode = "page",
}: SeriesPosterCardProps) {
  const [imgError, setImgError] = useState(false);
  const seriesUrl = `/${creatorHandle}/series/${series.id}`;

  const episodeText = `${episodesCount} ${episodesCount === 1 ? "episode" : "episodes"}`;
  const validPlatform =
    detectedPlatform &&
    detectedPlatform !== "Creator" &&
    detectedPlatform !== "Multi-Platform"
      ? detectedPlatform
      : "";

  // Meta line parts: "5 episodes · Hindi · YouTube" (no empty dots)
  const metaParts: { text: string; icon?: React.ReactNode }[] = [
    { text: episodeText },
    ...(series.language && series.language.trim()
      ? [{ text: series.language.trim() }]
      : []),
    ...(validPlatform
      ? [{ text: validPlatform, icon: getPlatformIcon(validPlatform) }]
      : []),
  ];

  const handleClick = (e: React.MouseEvent) => {
    if (onOpen && openMode === "internal") {
      e.preventDefault();
      onOpen(series);
    }
  };

  const hasPoster = Boolean(series.posterDataUrl) && !imgError;
  const focalPoint = (series as any).focalPoint || (series as any).posterPosition || "center";

  return (
    <Link
      href={seriesUrl}
      onClick={handleClick}
      className="group relative block w-full aspect-[3/1] rounded-xl overflow-hidden bg-(--accent) border border-(--surface-border)/[0.06] shadow-xs hover:shadow-md transition-all duration-300 focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:outline-hidden text-left select-none"
    >
      {/* Background Poster Image or Fallback */}
      {hasPoster ? (
        <Image
          src={series.posterDataUrl!}
          alt=""
          fill
          sizes="(max-width: 600px) 100vw, 540px"
          quality={80}
          loading="lazy"
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

      {/* Content on Poster: Bottom Left */}
      <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3 flex flex-col justify-end text-left z-10 pointer-events-none">
        {/* Series Title: white, bold, max 1 line with text shadow */}
        <h3
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
          className="text-sm sm:text-lg font-bold tracking-tight text-white truncate leading-snug drop-shadow-sm group-hover:text-(--accent-soft) transition-colors"
        >
          {series.title}
        </h3>

        {/* Meta Line: "5 episodes · Hindi · YouTube" (white/85 with text shadow) */}
        <div
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
          className="text-[10px] sm:text-xs font-medium text-white/85 mt-0.5 flex items-center gap-1.5 overflow-hidden min-w-0 truncate"
        >
          {metaParts.map((part, idx) => (
            <span key={idx} className="inline-flex items-center gap-1.5 truncate">
              {idx > 0 && <span className="opacity-50 font-normal">·</span>}
              {part.icon}
              <span className="truncate">{part.text}</span>
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
