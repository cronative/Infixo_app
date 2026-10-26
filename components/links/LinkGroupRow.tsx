"use client";

import React, { useState } from "react";
import { Folder, ChevronDown } from "lucide-react";
import { CustomLink, CustomLinkItem } from "@/types";
import { getPlatformFromUrl } from "@/lib/linkIcons";
import { LinkRow } from "./LinkRow";

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
  // Odd groups (index 0, 2, ...): Infixo Signature Maroon / Wine (#7A2253)
  // Even groups (index 1, 3, ...): Infixo Royal Plum / Violet Wine (#581C87)
  const isEven = index % 2 === 1;

  const themeConfig = isEven
    ? {
        container:
          "border-[#581C87]/25 dark:border-[#581C87]/35 bg-white dark:bg-zinc-900",
        headerBg:
          "bg-[#581C87]/[0.08] hover:bg-[#581C87]/[0.12] dark:bg-[#581C87]/20 dark:hover:bg-[#581C87]/30",
        focusRing: "focus-visible:ring-[#581C87]",
        folderIcon:
          "bg-[#581C87]/15 text-[#581C87] dark:bg-[#581C87]/30 dark:text-purple-300",
        divider:
          "border-t border-[#581C87]/15 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-zinc-900",
      }
    : {
        container:
          "border-[#7A2253]/25 dark:border-[#7A2253]/35 bg-white dark:bg-zinc-900",
        headerBg:
          "bg-[#7A2253]/[0.08] hover:bg-[#7A2253]/[0.12] dark:bg-[#7A2253]/20 dark:hover:bg-[#7A2253]/30",
        focusRing: "focus-visible:ring-[#7A2253]",
        folderIcon:
          "bg-[#7A2253]/15 text-[#7A2253] dark:bg-[#7A2253]/30 dark:text-pink-300",
        divider:
          "border-t border-[#7A2253]/15 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-zinc-900",
      };

  // Map items to platforms
  const itemPlatforms = items.map((item) => ({
    item,
    platform: getPlatformFromUrl(item.url),
  }));

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
        bgClass: first.platform.bgClass,
        thumbnail: first.item.thumbnail,
        renderIcon: () => first.platform.renderIcon(true),
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
            ? "bg-slate-100 dark:bg-zinc-800"
            : ip.platform.bgClass,
          thumbnail: ip.item.thumbnail,
          renderIcon: () => ip.platform.renderIcon(true),
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
            <span className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-white truncate leading-tight">
              {group.title}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-normal truncate leading-tight mt-0.5">
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
                className={`w-5 h-5 rounded-full ring-2 ring-white dark:ring-zinc-900 shrink-0 flex items-center justify-center overflow-hidden shadow-xs ${
                  entry.bgClass
                }`}
                style={{ zIndex: 10 - idx }}
              >
                {entry.thumbnail ? (
                  <img
                    src={entry.thumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  entry.renderIcon()
                )}
              </div>
            ))}
          </div>

          <ChevronDown
            className={`h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200 ease-out ${
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
