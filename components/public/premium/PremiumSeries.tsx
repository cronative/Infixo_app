"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Play } from "lucide-react";
import type { Episode, Series } from "@/types";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "@/components/shared/BrandIcons";
import { SeriesCoverLogo } from "@/components/series/SeriesCoverLogo";
import { extractVideoThumbnail, getSeriesCoverUrl } from "@/lib/videoUrl";
import { getSeriesEpisodes } from "@/lib/seriesMetrics";

const BLUR =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiM3QTIyNTMiLz48L3N2Zz4=";

/** "Ep 01: The Bootstrapped Broker — How We Built…" → "The Bootstrapped Broker — How We Built…" */
function episodeTitle(ep: Episode) {
  return (ep.title || "").replace(/^(ep|episode|part)\s*\d+\s*[:.\-–—]\s*/i, "").trim() || `Episode ${ep.episodeNumber}`;
}

function platformKey(p?: string | null) {
  const v = (p || "").toLowerCase();
  if (v.includes("youtube")) return "youtube";
  if (v.includes("instagram")) return "instagram";
  if (v.includes("facebook")) return "facebook";
  return null;
}

function PlatformGlyph({ platform, className = "h-3.5 w-3.5" }: { platform?: string | null; className?: string }) {
  const key = platformKey(platform);
  if (key === "youtube") return <YoutubeIcon className={`${className} text-red-500`} />;
  if (key === "instagram") return <InstagramIcon className={`${className} text-pink-500`} />;
  if (key === "facebook") return <FacebookIcon className={`${className} text-blue-500`} />;
  return null;
}

const PLATFORM_LABEL: Record<string, string> = { youtube: "YouTube", instagram: "Instagram", facebook: "Facebook" };

function EpisodeThumb({ ep }: { ep: Episode }) {
  const [failed, setFailed] = useState(false);
  const src = ep.thumbnailDataUrl || extractVideoThumbnail(ep.externalUrl || "", ep.platform);
  return (
    <span className="relative flex h-[42px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[5px] border border-(--surface-border) bg-gradient-to-br from-(--cover-from) to-(--cover-to)">
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote episode thumbnails of any host
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <Play className="h-4 w-4 fill-white/90 text-white/90" />
      )}
      <span className="absolute bottom-0.5 left-0.5 rounded-[3px] bg-black/75 px-1 text-[9.5px] font-bold leading-[14px] text-white tabular-nums">
        EP {ep.episodeNumber}
      </span>
    </span>
  );
}

export interface PremiumSeriesCardProps {
  series: Series;
  /** Public series page for this series (all episodes, in order). */
  seriesHref: string;
  /** How many episodes to list under the poster. */
  episodeLimit?: number;
  /** Feature the first card with a taller poster. */
  featured?: boolean;
  onOpenSeries?: (e: React.MouseEvent, series: Series) => void;
  onEpisodeClick?: (e: React.MouseEvent, series: Series, ep: Episode) => void;
}

/**
 * Premium profile series card: the poster (unchanged look) with the first
 * episodes listed underneath as direct, numbered links, so fans can jump
 * straight to Part 1 (or any part) from the profile.
 */
export function PremiumSeriesCard({
  series,
  seriesHref,
  episodeLimit = 3,
  featured = false,
  onOpenSeries,
  onEpisodeClick,
}: PremiumSeriesCardProps) {
  const [posterFailed, setPosterFailed] = useState(false);
  const episodes = [...getSeriesEpisodes(series)].sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
  const shown = episodes.slice(0, episodeLimit);
  const cover = getSeriesCoverUrl(series);
  const hasPoster = Boolean(cover) && !posterFailed;
  const focal = (series as { focalPoint?: string; posterPosition?: string }).focalPoint
    || (series as { posterPosition?: string }).posterPosition
    || "center";

  const pKey = platformKey(series.platform) || platformKey(episodes[0]?.platform);
  const platformLabel = pKey ? PLATFORM_LABEL[pKey] : series.platform || "";
  const genres = (series.genre || "").split(",").map((g) => g.trim()).filter(Boolean);
  const meta = [`${episodes.length} ${episodes.length === 1 ? "episode" : "episodes"}`, series.language?.trim()].filter(Boolean).join(" · ");
  const first = episodes[0];

  return (
    <article className="overflow-hidden rounded-[8px] border border-(--surface-border) bg-(--card-bg) shadow-xs">
      {/* Poster: same artwork + scrim as the classic poster card */}
      <Link
        href={seriesHref}
        onClick={(e) => onOpenSeries?.(e, series)}
        aria-label={`${series.title}, ${meta}`}
        className={`group relative block w-full overflow-hidden bg-(--accent) ${featured ? "aspect-[16/8]" : "aspect-[16/7] sm:aspect-[3/1]"}`}
      >
        {hasPoster ? (
          <Image
            src={cover!}
            alt=""
            fill
            sizes="(max-width: 600px) 100vw, 540px"
            quality={80}
            loading={featured ? "eager" : "lazy"}
            placeholder="blur"
            blurDataURL={BLUR}
            onError={() => setPosterFailed(true)}
            style={{ objectPosition: focal }}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
        ) : (
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-(--cover-from) to-(--cover-to)">
            <SeriesCoverLogo />
          </div>
        )}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/90 via-black/55 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-3 p-3 sm:p-3.5">
          <div className="min-w-0" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
            <h3 className={`line-clamp-2 font-semibold leading-snug tracking-tight text-white ${featured ? "text-base sm:text-lg" : "text-sm sm:text-base"}`}>
              {series.title}
            </h3>
            <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-white/85 sm:text-xs">
              <span className="shrink-0">{meta}</span>
              {platformLabel && (
                <>
                  <span aria-hidden>·</span>
                  <PlatformGlyph platform={pKey} className="h-3 w-3 shrink-0" />
                  <span className="shrink-0">{platformLabel}</span>
                </>
              )}
              {genres[0] && <span className="hidden truncate min-[401px]:inline">· {genres[0]}</span>}
            </p>
          </div>
          {first && (
            <span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-semibold text-black shadow-sm">
              <Play className="h-3 w-3 fill-current" />
              Ep 1
            </span>
          )}
        </div>
      </Link>

      {/* Episodes, in order, each a direct link to the original post */}
      {shown.length > 0 && (
        <ol className="divide-y divide-(--surface-border)" aria-label={`${series.title} episodes`}>
          {shown.map((ep, i) => (
            <li key={ep.id || i}>
              <a
                href={ep.externalUrl || seriesHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => onEpisodeClick?.(e, series, ep)}
                className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_5%,transparent)] sm:px-3.5"
              >
                <EpisodeThumb ep={ep} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-(--accent-text)">
                      Ep {ep.episodeNumber || i + 1}
                    </span>
                    {i === 0 && (
                      <span
                        style={{ color: "var(--accent-text)", backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)" }}
                        className="rounded-[3px] px-1.5 text-[9.5px] font-bold uppercase leading-4 tracking-wider"
                      >
                        Start here
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 line-clamp-2 text-[13px] font-medium leading-[17px] text-(--text)">{episodeTitle(ep)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-(--text-muted)">
                  <PlatformGlyph platform={ep.platform} />
                  <ArrowUpRight className="h-4 w-4 transition-colors group-hover:text-(--text)" />
                </span>
              </a>
            </li>
          ))}
        </ol>
      )}

      <Link
        href={seriesHref}
        onClick={(e) => onOpenSeries?.(e, series)}
        className="flex h-10 items-center justify-center gap-1.5 border-t border-(--surface-border) text-[12.5px] font-semibold text-(--accent-text) transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]"
      >
        {episodes.length > shown.length ? `All ${episodes.length} episodes, in order` : "Open series"}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </article>
  );
}
