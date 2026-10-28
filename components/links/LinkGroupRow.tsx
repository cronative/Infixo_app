"use client";

import React, { useState } from "react";
import { Folder, ChevronDown } from "lucide-react";
import { CustomLink, CustomLinkItem } from "@/types";
import { extractBareDomain, getPlatformFromUrl } from "@/lib/linkIcons";
import { LinkRow } from "./LinkRow";

/** Same letter fallback as the dashboard: maroon first letter of the title on a pink tile. */
function letterIcon(title: string, url: string) {
  const letter = (title.trim()[0] || extractBareDomain(url)[0] || "L").toUpperCase();
  return <span className="text-[9px] font-bold uppercase text-(--accent-text)">{letter}</span>;
}

export interface LinkGroupRowProps {
  group: CustomLink;
  index?: number;
  initiallyOpen?: boolean;
  onLinkClick?: (link: CustomLinkItem) => void;
  className?: string;
}

export function LinkGroupRow({
  group,
  index = 0,
  initiallyOpen = false,
  onLinkClick,
  className = "",
}: LinkGroupRowProps) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);

  const items = (group.items || []).filter(
    (item) => item.isEnabled !== false && item.title && item.url
  );

  if (items.length === 0) return null;

  // Alternating theme tints for group header row:
  // Group header tint comes from the theme accent tokens.
  const isEven = index % 2 === 1;

  const themeConfig = isEven
    ? {
        container:
          "border-(--accent)/25  bg-(--card-bg) ",
        headerBg:
          "bg-(--accent)/[0.08] hover:bg-(--accent-hover)/[0.12]  ",
        focusRing: "focus-visible:ring-(--accent)",
        folderIcon:
          "bg-(--accent)/15 text-(--accent-text)  ",
        divider:
          "border-t border-(--divider) divide-y divide-(--divider) bg-(--card-bg)",
      }
    : {
        container:
          "border-(--accent)/25  bg-(--card-bg) ",
        headerBg:
          "bg-(--accent)/[0.08] hover:bg-(--accent-hover)/[0.12]  ",
        focusRing: "focus-visible:ring-(--accent)",
        folderIcon:
          "bg-(--accent)/15 text-(--accent-text)  ",
        divider:
          "border-t border-(--divider) divide-y divide-(--divider) bg-(--card-bg)",
      };

  // Map items to platforms
  const itemPlatforms = items.map((item) => {
    const platform = getPlatformFromUrl(item.url);
    // Saved favicon stands in for unknown domains, like a thumbnail.
    const image = item.thumbnail || (!platform.isKnownApp ? item.iconUrl : undefined);
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
      className={`rounded-xl border overflow-hidden transition-all duration-200 shadow-none ${themeConfig.container} ${className}`}
    >
      {/* Group Trigger Button (~52px height) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className={`w-full min-h-[52px] h-[52px] px-3.5 py-2 flex items-center justify-between gap-3 text-left cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 ${themeConfig.focusRing} focus-visible:ring-offset-1 select-none ${themeConfig.headerBg}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* 32×32 Folder Icon Tile - Alternating Theme Tint */}
          <div
            className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center shadow-xs transition-colors ${themeConfig.folderIcon}`}
          >
            <Folder className="h-4 w-4" />
          </div>

          {/* Group Title + Subtitle */}
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <span className="text-xs sm:text-[13px] font-semibold text-(--text) truncate leading-tight">
              {group.title}
            </span>
            <span className="text-xs text-(--text-muted) font-normal truncate leading-tight mt-0.5">
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
                className={`w-5 h-5 rounded-full ring-2 ring-(--card-bg) shrink-0 flex items-center justify-center overflow-hidden shadow-xs ${
 entry.bgClass
                }`}
                style={{ zIndex: 10 - idx }}
              >
                {entry.thumbnail ? (
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

          <ChevronDown
            className={`h-4 w-4 text-(--text-muted) shrink-0 transition-transform duration-200 ease-out ${
 isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Expanded inner links (light & compact with thin dividers, no nested boxes) */}
      {isOpen && (
        <div className={`${themeConfig.divider} animate-in fade-in duration-200`}>
          {items.map((item) => (
            <LinkRow
              key={item.id}
              link={item}
              compact
              onClick={() => onLinkClick?.(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
