"use client";

import { useState } from "react";
import Image from "next/image";
import type { Series } from "@/types";
import { ArrowUpRight, ChevronRight, Layers } from "lucide-react";
import { SeriesCoverLogo } from "@/components/series/SeriesCoverLogo";
import { getSeriesCoverUrl } from "@/lib/videoUrl";
import { getSeriesEpisodes } from "@/lib/seriesMetrics";
import { ListRow } from "./ListRow";
import { BrandPlatformIcon } from "./BrandPlatformIcon";
import { CARD_ITEM, CARD_ITEM_HOVER } from "./tokens";

const BLUR =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiM3QTIyNTMiLz48L3N2Zz4=";

function platformKey(p?: string | null) {
  const v = (p || "").toLowerCase();
  if (v.includes("youtube")) return "youtube";
  if (v.includes("instagram")) return "instagram";
  if (v.includes("facebook")) return "facebook";
  return null;
}

const PLATFORM_LABEL: Record<string, string> = { youtube: "YouTube", instagram: "Instagram", facebook: "Facebook" };

/** Thin vertical bar between meta items. */
const Sep = () => <span aria-hidden className="h-3 w-px shrink-0 bg-(--surface-border)" />;

export interface SeriesRowProps {
  series: Series;
  /** Public series page for this series (all episodes, in order). */
  seriesHref: string;
  onOpenSeries?: (e: React.MouseEvent, series: Series) => void;
  /** Card look like the episode cards: 12px corners and an outlined "View" button. */
  variant?: "row" | "card";
}

/**
 * Series row: 16:9 cover on the left, 2-line title, episode count + language
 * + platform, chevron to the series page (episodes live there).
 */
export function SeriesRow({ series, seriesHref, onOpenSeries, variant = "row" }: SeriesRowProps) {
  const isCard = variant === "card";
  const [coverFailed, setCoverFailed] = useState(false);
  const episodes = getSeriesEpisodes(series);
  const cover = getSeriesCoverUrl(series);
  const hasCover = Boolean(cover) && !coverFailed;
  const focal = (series as { focalPoint?: string }).focalPoint || (series as { posterPosition?: string }).posterPosition || "center";
  const pKey = platformKey(series.platform) || platformKey(episodes[0]?.platform);
  const language = series.language?.trim();

  return (
    <ListRow
      href={seriesHref}
      onClick={(e) => onOpenSeries?.(e, series)}
      // Separate white card (white on light themes, card colour on dark ones).
      className={isCard ? `gap-3 rounded-[12px]! border border-(--surface-border) bg-[var(--header-bg,var(--card-bg))] p-2.5 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--surface-border))]` : `gap-3 p-2 ${CARD_ITEM} ${CARD_ITEM_HOVER}`}
      leading={
        <span className={`relative h-[52px] w-[92px] shrink-0 overflow-hidden bg-(--accent) min-[400px]:h-[63px] min-[400px]:w-28 ${isCard ? "rounded-[10px]" : "rounded-[5px]"}`}>
          {hasCover ? (
            <Image
              src={cover!}
              alt=""
              fill
              sizes="112px"
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
      titleClassName="text-[15px] font-bold leading-[19px] text-(--text)"
      subtitle={
        <span className={`mt-1 flex min-w-0 items-center gap-1.5 min-[400px]:gap-2 text-[12px] text-(--text-muted) ${isCard ? "flex-wrap gap-y-0.5" : "whitespace-nowrap"}`} title={[`${episodes.length} episodes`, language, pKey && PLATFORM_LABEL[pKey]].filter(Boolean).join(" · ")}>
          <span className="inline-flex shrink-0 items-center gap-1">
            <Layers aria-hidden className="h-3.5 w-3.5" />
            {episodes.length} {episodes.length === 1 ? "episode" : "episodes"}
          </span>
          {language && (
            <>
              <Sep />
              <span className="min-w-0 truncate">{language}</span>
            </>
          )}
          {pKey && (
            <>
              <Sep />
              <span className="inline-flex shrink-0 items-center gap-1">
                <BrandPlatformIcon platform={pKey} size={14} />
                {/* Narrow phones: icon only, so the meta stays on one line. */}
                <span className="max-[399px]:sr-only">{PLATFORM_LABEL[pKey]}</span>
              </span>
            </>
          )}
        </span>
      }
      arrow={
        isCard ? (
          <span aria-hidden className="inline-flex h-8 shrink-0 items-center gap-1 rounded-[8px] border border-[color-mix(in_srgb,var(--accent)_45%,transparent)] px-3 text-[12px] font-bold text-(--accent-text) transition-colors group-hover:bg-(--accent-soft)">
            View <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        ) : (
        <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] bg-(--accent-soft) text-(--accent-text) transition-colors group-hover:bg-[color-mix(in_srgb,var(--accent-text)_18%,var(--accent-soft))]">
          <ChevronRight className="h-4 w-4" />
        </span>
        )
      }
    />
  );
}
