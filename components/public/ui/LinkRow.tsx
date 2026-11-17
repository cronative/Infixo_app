"use client";

import React, { useState } from "react";
import { ArrowUpRight, Globe } from "lucide-react";
import { CustomLink, CustomLinkItem } from "@/types";
import { getPlatformFromUrl, extractBareDomain } from "@/lib/linkIcons";

export interface LinkRowProps {
  link: CustomLink | CustomLinkItem;
  isPinned?: boolean;
  /** Smaller row for the links inside an open folder (LinkGroupRow). */
  compact?: boolean;
  /** Separate bordered card (premium profile / links page), like the series rows. */
  card?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

const SIZES = {
  regular: {
    row: "gap-3 min-h-[48px] h-auto px-3.5 py-2 rounded-none hover:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]! bg-transparent text-left transition-all duration-150 ease-out hover:bg-(--surface)/40 active:scale-[0.99]",
    inner: "gap-3",
    tile: "w-8 h-8 shadow-none",
    favicon: "w-5 h-5",
    globe: "h-4 w-4",
    text: "py-0.5",
    subtitle: "text-xs leading-[17px]",
    arrow: "h-4 w-4",
  },
  compact: {
    row: "gap-2.5 min-h-[42px] px-3.5 py-2 bg-transparent hover:bg-(--surface)/50 text-left transition-colors duration-150 ease-out",
    inner: "gap-2.5",
    tile: "w-6 h-6",
    favicon: "w-4 h-4",
    globe: "h-3.5 w-3.5",
    text: "",
    subtitle: "text-[11px] leading-[16px]",
    arrow: "h-3.5 w-3.5",
  },
};

/**
 * Divided link row inside a Section: icon tile (thumbnail, favicon, brand icon
 * or globe), 2-line title, ⭐ Featured chip + destination, ↗.
 */
export function LinkRow({ link, isPinned = false, compact = false, card = false, className = "", onClick }: LinkRowProps) {
  const url = link.url || "#";
  const platform = getPlatformFromUrl(url);
  const bareDomain = extractBareDomain(url);

  // Trust signal destination: known app → "Opens in WhatsApp"; otherwise the bare domain ("inflixo.com").
  const destinationText = platform.isKnownApp ? platform.destinationLabel : bareDomain || "link";
  const ariaDestination = platform.isKnownApp ? platform.name : destinationText;

  // Title: preserve emojis exactly as typed
  const title = link.title || "";
  const isFeatured = Boolean(isPinned || (link as { isPinned?: boolean }).isPinned);
  const subtitleText = link.description || destinationText;

  // Thumbnail first; otherwise the favicon saved on the server (known platforms keep their brand icon).
  const [faviconFailed, setFaviconFailed] = useState(false);
  const rawThumb = (link as { thumbnail?: string }).thumbnail;
  const thumbnail = rawThumb?.startsWith("/uploads/") ? `/api/assets${rawThumb}` : rawThumb;
  const rawIcon = link.iconUrl?.startsWith("/uploads/") ? `/api/assets${link.iconUrl}` : link.iconUrl;
  const favicon = !thumbnail && !platform.isKnownApp && !faviconFailed ? rawIcon : undefined;
  const showGlobe = !thumbnail && !favicon && !platform.isKnownApp;
  const iconBg = thumbnail
    ? "bg-(--surface) "
    : favicon
      ? "bg-transparent border border-(--surface-border) "
      : showGlobe
        ? "bg-(--accent-soft) border border-(--surface-border)"
        : platform.bgClass;
  const s = compact ? SIZES.compact : SIZES.regular;
  const rowCls = card
    ? `gap-3 min-h-[56px] px-3 py-2.5 rounded-[5px] border ${
        isFeatured ? "border-[color-mix(in_srgb,var(--accent-text)_40%,var(--surface-border))]" : "border-(--surface-border)"
      } bg-(--card-bg) text-left transition-colors hover:border-[color-mix(in_srgb,var(--accent-text)_35%,var(--surface-border))] hover:bg-[color-mix(in_srgb,var(--accent)_3%,var(--card-bg))] active:scale-[0.99]`
    : s.row;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${title} – opens ${ariaDestination}`}
      onClick={onClick}
      className={`group relative flex items-center justify-between ${rowCls} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-1 cursor-pointer select-none ${className}`}
    >
      <div className={`flex items-center ${s.inner} min-w-0 flex-1`}>
        <div className={`${s.tile} rounded-[5px] shrink-0 flex items-center justify-center overflow-hidden ${iconBg}`}>
          {thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element -- link thumbnails of any host
            <img src={thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : favicon ? (
            // eslint-disable-next-line @next/next/no-img-element -- saved favicons of any host
            <img src={favicon} alt="" className={`${s.favicon} object-contain`} loading="lazy" onError={() => setFaviconFailed(true)} />
          ) : showGlobe ? (
            <Globe className={`${s.globe} text-(--accent-text)`} />
          ) : (
            platform.renderIcon(compact)
          )}
        </div>

        <div className={`min-w-0 flex-1 flex flex-col justify-center ${s.text}`}>
          <span title={title} className="link-row-title min-w-0 text-[13px] font-medium text-(--text) group-hover:text-(--accent-text) transition-colors leading-[18px] break-words">
            {title}
          </span>
          <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
            {isFeatured && (
              <span
                style={{ color: "var(--accent-text)", backgroundColor: "var(--accent-soft)", borderColor: "var(--surface-border)" }}
                className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 rounded-[5px] border leading-tight shrink-0 select-none"
              >
                ⭐ Featured
              </span>
            )}
            <span className={`min-w-0 ${s.subtitle} text-(--text-muted) font-normal break-all`}>{subtitleText}</span>
          </div>
        </div>
      </div>

      {card ? (
        <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] bg-(--accent-soft) text-(--accent-text) transition-colors group-hover:bg-[color-mix(in_srgb,var(--accent-text)_18%,var(--accent-soft))]">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      ) : (
        <ArrowUpRight className={`${s.arrow} text-(--icon) shrink-0 group-hover:text-(--icon-active) group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all`} />
      )}
    </a>
  );
}
