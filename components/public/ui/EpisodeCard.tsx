"use client";

import { Play } from "lucide-react";
import { cleanEpisodeTitle } from "./EpisodeRow";

export interface EpisodeCardProps {
  number: number;
  title?: string;
  href?: string;
  /** Platform name shown under the title ("Instagram", "YouTube"…). */
  platform?: string;
  /** First episode: pink number tile + solid Watch button. */
  isFirst?: boolean;
  onClick?: () => void;
}

/** Episode as its own card: big "01" tile · title + platform · play button (opens the original video). */
export function EpisodeCard({ number, title, href, platform, isFirst = false, onClick }: EpisodeCardProps) {
  const clean = cleanEpisodeTitle(title, number);
  return (
    <a
      href={href || "#"}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      aria-label={`Episode ${number}: ${clean}. Watch${platform ? ` on ${platform}` : ""}`}
      className="tap-scale group flex items-center gap-3 rounded-[12px] border border-(--surface-border) bg-[var(--header-bg,var(--card-bg))] p-2.5 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--surface-border))]"
    >
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] text-[17px] font-extrabold tabular-nums"
        style={{
          backgroundColor: isFirst ? "var(--accent-soft)" : "color-mix(in srgb, var(--text) 5%, var(--surface))",
          color: isFirst ? "var(--accent-text)" : "var(--text)",
        }}
      >
        {String(number).padStart(2, "0")}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-[14px] font-semibold leading-5 text-(--text)">{clean}</span>
        {platform && <span className="block text-[12px] leading-4 text-(--text-muted)">{platform}</span>}
      </span>
      <span
        aria-hidden
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border transition-colors ${
          isFirst
            ? "border-(--accent) bg-(--accent) text-(--on-accent)"
            : "border-[color-mix(in_srgb,var(--accent)_45%,transparent)] text-(--accent-text) group-hover:bg-(--accent-soft)"
        }`}
      >
        <Play className="h-4 w-4 fill-current" />
      </span>
    </a>
  );
}
