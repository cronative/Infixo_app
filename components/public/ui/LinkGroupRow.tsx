"use client";

import React, { useState } from "react";
import { Folder, ChevronDown, Globe } from "lucide-react";
import { CustomLink, CustomLinkItem } from "@/types";
import { getPlatformFromUrl } from "@/lib/linkIcons";
import { LinkRow } from "./LinkRow";

/** Website globe fallback when a link is not a known app and has no custom favicon. */
function letterIcon(_title: string, _url: string) {
  return <Globe className="h-3 w-3 text-(--accent-text)" />;
}

export interface LinkGroupRowProps {
  group: CustomLink;
  initiallyOpen?: boolean;
  onLinkClick?: (link: CustomLinkItem) => void;
  /** One bordered card holding the folder header and, when open, its links. */
  card?: boolean;
  /** When open, list the links as separate link cards (like single links) instead of indented rows. */
  separateItems?: boolean;
  className?: string;
}

/** Link folder row: folder tile, 2-line title, stacked platform icons; opens to indented LinkRows. */
export function LinkGroupRow({
  group,
  initiallyOpen = false,
  onLinkClick,
  card = false,
  separateItems = false,
  className = "",
}: LinkGroupRowProps) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);

  const items = (group.items || []).filter(
    (item) => item.isEnabled !== false && item.title && item.url
  );

  if (items.length === 0) return null;

  // Map items to platforms
  const itemPlatforms = items.map((item) => {
    const platform = getPlatformFromUrl(item.url);
    // Saved favicon stands in for unknown domains, like a thumbnail.
    const rawImage = item.thumbnail || (!platform.isKnownApp ? item.iconUrl : undefined);
    const image = rawImage?.startsWith("/uploads/") ? `/api/assets${rawImage}` : rawImage;
    return { item: { ...item, thumbnail: image }, platform };
  });

  // Check if all items belong to the same platform (and don't have custom thumbnails)
  const firstPlatformId = itemPlatforms[0]?.platform.id;
  const allSamePlatform =
    itemPlatforms.length > 0 &&
    itemPlatforms.every(
      (ip) => ip.platform.id === firstPlatformId && !ip.item.thumbnail
    );

  // If all links are from the same platform, show only ONE icon.
  // Otherwise, show distinct platforms stacked up to 3.
  let previewList: Array<{
    id: string;
    title: string;
    bgClass: string;
    thumbnail?: string;
    renderIcon: () => React.ReactNode;
  }> = [];

  if (allSamePlatform && itemPlatforms[0]) {
    const first = itemPlatforms[0];
    previewList = [
      {
        id: first.item.id,
        title: first.platform.name,
        bgClass: first.item.thumbnail || first.platform.isKnownApp ? first.platform.bgClass : "bg-(--accent-soft) border border-(--surface-border)",
        thumbnail: first.item.thumbnail,
        renderIcon: () => first.platform.isKnownApp ? first.platform.renderIcon(true) : letterIcon(first.item.title, first.item.url),
      },
    ];
  } else {
    const seen = new Set<string>();
    for (const ip of itemPlatforms) {
      const key = ip.item.thumbnail ? `thumb-${ip.item.id}` : ip.platform.id;
      if (!seen.has(key)) {
        seen.add(key);
        previewList.push({
          id: ip.item.id || key,
          title: ip.platform.name,
          bgClass: ip.item.thumbnail
            ? "bg-(--surface) "
            : ip.platform.isKnownApp
              ? ip.platform.bgClass
              : "bg-(--accent-soft) border border-(--surface-border)",
          thumbnail: ip.item.thumbnail,
          renderIcon: () => ip.platform.isKnownApp ? ip.platform.renderIcon(true) : letterIcon(ip.item.title, ip.item.url),
        });
        if (previewList.length === 3) break;
      }
    }
  }

  const countText = `${items.length} ${items.length === 1 ? "link" : "links"}`;

  return (
    <div
      className={`${
        card
          ? `card-item rounded-[5px] border bg-[var(--header-bg,var(--card-bg))] ${isOpen ? "border-[color-mix(in_srgb,var(--accent-text)_40%,var(--surface-border))]" : "border-(--surface-border)"}`
          : isOpen
            ? "border-l-[3px] border-l-[color-mix(in_srgb,var(--accent)_55%,transparent)]"
            : ""
      } overflow-hidden transition-all duration-200 shadow-none bg-transparent ${className}`}
    >
      {/* Group Trigger Button (~48px height) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className={`w-full min-h-[48px] h-[48px] px-3.5 py-2 flex items-center justify-between gap-3 text-left cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-1 select-none ${
          card
            ? `min-h-[56px]! h-auto! px-3! ${isOpen ? "bg-[color-mix(in_srgb,var(--accent)_7%,transparent)]" : "bg-transparent"} hover:bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]`
            : "bg-[color-mix(in_srgb,var(--accent)_7%,transparent)] hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Folder Icon Tile */}
          <div
            className="w-8 h-8 rounded-[5px] shrink-0 flex items-center justify-center shadow-none transition-colors bg-(--accent)/15 text-(--accent-text)"
          >
            <Folder className="h-4 w-4" />
          </div>

          {/* Group Title + Subtitle */}
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <span title={group.title} className="line-clamp-2 break-words text-[13px] font-medium text-(--text) leading-[18px]">
              {group.title}
            </span>
            <span className="text-xs text-(--text-muted) font-normal truncate leading-[17px] mt-0.5">
              {group.subtitle || countText}
            </span>
          </div>
        </div>

        {/* Right side: Preview of mini icons (single icon if all same platform, or stack of up to 3 distinct platforms) + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`flex items-center ${
 previewList.length > 1 ? "-space-x-1.5 overflow-hidden py-0.5 pl-1" : "py-0.5"
            }`}
          >
            {previewList.map((entry, idx) => (
              <div
                key={entry.id || idx}
                title={entry.title}
                className={`w-5 h-5 rounded-full ring-2 ring-(--card-bg) shrink-0 flex items-center justify-center overflow-hidden  ${
 entry.bgClass
                }`}
                style={{ zIndex: 10 - idx }}
              >
                {entry.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element -- link thumbnails of any host
                  <img
                    src={entry.thumbnail}
                    alt=""
                    className="w-full h-full object-contain bg-(--card-bg)"
                  />
                ) : (
                  entry.renderIcon()
                )}
              </div>
            ))}
          </div>

          {card ? (
            <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] bg-(--accent-soft) text-(--accent-text)">
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ease-out ${isOpen ? "rotate-180" : ""}`} />
            </span>
          ) : (
            <ChevronDown
              className={`h-4 w-4 text-(--text-muted) shrink-0 transition-transform duration-200 ease-out ${isOpen ? "rotate-180" : ""}`}
            />
          )}
        </div>
      </button>

      {/* Expanded inner links (light & compact with thin dividers, no nested boxes) */}
      {/* Open folder: plain indented rows, icons line up with the folder title */}
      {isOpen && separateItems && (
        <div className="space-y-2 border-t border-(--surface-border) p-2 animate-in fade-in duration-200">
          {items.map((item) => (
            <LinkRow key={item.id} link={item} card onClick={() => onLinkClick?.(item)} />
          ))}
        </div>
      )}
      {isOpen && !separateItems && (
        <div className="border-t border-(--surface-border) divide-y divide-(--surface-border) animate-in fade-in duration-200">
          {items.map((item) => (
            <LinkRow
              key={item.id}
              link={item}
              compact
              className={card ? "pl-[56px]" : "pl-[52px]"}
              onClick={() => onLinkClick?.(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
