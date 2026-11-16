"use client";

import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { ListRow } from "./ListRow";

/** Strips a leading "Part 3:", "Episode 03 -", "Ep. 3 –" so the number isn't shown twice. */
export function cleanEpisodeTitle(title: string | undefined, number: number) {
  const raw = title?.trim() || `Episode ${number}`;
  return raw.replace(/^(?:Part|Episode|Ep)\.?\s*0?\d+\s*[:.\-–—]?\s*/i, "").trim() || raw;
}

export interface EpisodeRowProps {
  number: number;
  title?: string;
  href?: string;
  /** First episode: solid accent number tile + "Start here". */
  isFirst?: boolean;
  /** Small platform glyph before the ↗ arrow. */
  platformIcon?: ReactNode;
  titleColor?: string;
  onClick?: () => void;
}

/** Episode row: "Ep N" tile · 2-line title · platform + ↗ (opens the episode on its platform). */
export function EpisodeRow({ number, title, href, isFirst = false, platformIcon, titleColor, onClick }: EpisodeRowProps) {
  const clean = cleanEpisodeTitle(title, number);
  return (
    <ListRow
      href={href || "#"}
      external
      onClick={onClick}
      aria-label={`Ep ${number} · ${clean}`}
      className="min-h-12 gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)] sm:px-3.5"
      leading={
        <span
          style={{
            backgroundColor: isFirst ? "var(--accent)" : "var(--accent-soft)",
            color: isFirst ? "var(--on-accent)" : "var(--accent-text)",
          }}
          className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-[5px] leading-none"
        >
          <span className="text-[9px] font-semibold uppercase tracking-wider opacity-80">Ep</span>
          <span className="text-[13px] font-bold tabular-nums">{number}</span>
        </span>
      }
      title={clean}
      titleStyle={titleColor ? { color: titleColor } : undefined}
      subtitle={isFirst ? <span className="mt-0.5 block text-[11px] font-semibold text-(--accent-text)">Start here</span> : undefined}
      meta={
        <span className="flex shrink-0 items-center gap-1.5">
          {platformIcon}
          <ArrowUpRight className="h-4 w-4 text-(--text-muted) transition-colors group-hover:text-(--accent-text)" />
        </span>
      }
    />
  );
}
