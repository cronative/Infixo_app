"use client";

import { useState } from "react";
import Image from "next/image";
import type { Series } from "@/types";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "@/components/shared/BrandIcons";
import { SeriesCoverLogo } from "@/components/series/SeriesCoverLogo";
import { getSeriesCoverUrl } from "@/lib/videoUrl";
import { getSeriesEpisodes } from "@/lib/seriesMetrics";
import { ListRow } from "./ListRow";

const BLUR =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiM3QTIyNTMiLz48L3N2Zz4=";

function platformKey(p?: string | null) {
  const v = (p || "").toLowerCase();
  if (v.includes("youtube")) return "youtube";
  if (v.includes("instagram")) return "instagram";
  if (v.includes("facebook")) return "facebook";
  return null;
}

const PLATFORM: Record<string, { label: string; icon: React.ReactNode }> = {
  youtube: { label: "YouTube", icon: <YoutubeIcon className="h-3 w-3 shrink-0 text-red-500" /> },
  instagram: { label: "Instagram", icon: <InstagramIcon className="h-3 w-3 shrink-0 text-pink-500" /> },
  facebook: { label: "Facebook", icon: <FacebookIcon className="h-3 w-3 shrink-0 text-blue-500" /> },
};

export interface SeriesRowProps {
  series: Series;
  /** Public series page for this series (all episodes, in order). */
  seriesHref: string;
  onOpenSeries?: (e: React.MouseEvent, series: Series) => void;
}

/**
 * Series row: 16:9 cover on the left, 2-line title, episode count + language
 * + platform, chevron to the series page (episodes live there).
 */
export function SeriesRow({ series, seriesHref, onOpenSeries }: SeriesRowProps) {
  const [coverFailed, setCoverFailed] = useState(false);
  const episodes = getSeriesEpisodes(series);
  const cover = getSeriesCoverUrl(series);
  const hasCover = Boolean(cover) && !coverFailed;
  const focal = (series as { focalPoint?: string }).focalPoint || (series as { posterPosition?: string }).posterPosition || "center";
  const pKey = platformKey(series.platform) || platformKey(episodes[0]?.platform);
  const platform = pKey ? PLATFORM[pKey] : null;
  const meta = [`${episodes.length} ${episodes.length === 1 ? "episode" : "episodes"}`, series.language?.trim()].filter(Boolean).join(" · ");

  return (
    <ListRow
      href={seriesHref}
      onClick={(e) => onOpenSeries?.(e, series)}
      className="gap-3 px-3 py-2.5 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_4%,transparent)] sm:px-4"
      leading={
        <span className="relative h-[54px] w-24 shrink-0 overflow-hidden rounded-[5px] border border-(--surface-border) bg-(--accent)">
          {hasCover ? (
            <Image
              src={cover!}
              alt=""
              fill
              sizes="96px"
              quality={75}
              loading="lazy"
              placeholder="blur"
              blurDataURL={BLUR}
              onError={() => setCoverFailed(true)}
              style={{ objectPosition: focal }}
              className="object-cover"
            />
          ) : (
            <span aria-hidden className="absolute inset-0 bg-gradient-to-br from-(--cover-from) to-(--cover-to)">
              <SeriesCoverLogo />
            </span>
          )}
        </span>
      }
      title={series.title}
      titleClassName="text-[14px] font-semibold leading-[18px] text-(--text)"
      subtitle={
        <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 text-xs text-(--text-muted)">
          <span className="shrink-0">{meta}</span>
          {platform && <span className="inline-flex items-center gap-1">{platform.icon}{platform.label}</span>}
        </span>
      }
      arrow="chevron"
    />
  );
}
