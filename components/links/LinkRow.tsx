"use client";

import React from "react";
import { ArrowUpRight, Pin } from "lucide-react";
import { CustomLink, CustomLinkItem } from "@/types";
import { getPlatformFromUrl, extractBareDomain } from "@/lib/linkIcons";

export interface LinkRowProps {
  link: CustomLink | CustomLinkItem;
  isPinned?: boolean;
  compact?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function LinkRow({
  link,
  isPinned = false,
  compact = false,
  className = "",
  onClick,
}: LinkRowProps) {
  const url = link.url || "#";
  const platform = getPlatformFromUrl(url);
  const bareDomain = extractBareDomain(url);

  // Trust signal destination:
  // Known app: "Opens in WhatsApp", "Opens on Amazon", etc.
  // Otherwise bare domain: "inflixo.com" (without www. or https://)
  const destinationText = platform.isKnownApp ? platform.destinationLabel : bareDomain || "link";
  const ariaDestination = platform.isKnownApp ? platform.name : destinationText;

  // Title: preserve emojis exactly as typed
  const title = link.title || "";

  // Thumbnail fallback; otherwise the favicon saved on the server (known platforms keep their brand icon).
  const thumbnail = (link as { thumbnail?: string }).thumbnail;
  const favicon = !thumbnail && !platform.isKnownApp ? link.iconUrl : undefined;
  const letter = !thumbnail && !favicon && !platform.isKnownApp
    ? (title.trim()[0] || bareDomain[0] || "L").toUpperCase()
    : null;
  const iconBg = thumbnail
    ? "bg-(--surface) "
    : favicon
      ? "bg-(--card-bg) border border-(--surface-border)/80 "
      : letter
        ? "bg-(--accent-soft) border border-(--surface-border)"
        : platform.bgClass;

  if (compact) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${title} – opens ${ariaDestination}`}
        onClick={onClick}
        className={`group relative flex items-center justify-between gap-2.5 min-h-[42px] px-3.5 py-2 bg-transparent hover:bg-(--surface)/80 text-left transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-1 cursor-pointer select-none ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* 24×24 Icon Tile */}
          <div
            className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center overflow-hidden ${iconBg}`}
          >
            {thumbnail ? (
              <img
                src={thumbnail}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : favicon ? (
              <img src={favicon} alt="" className="w-4 h-4 object-contain" loading="lazy" />
            ) : letter ? (
              <span className="text-[11px] font-bold uppercase text-(--accent-text)">{letter}</span>
            ) : (
              platform.renderIcon(true)
            )}
          </div>

          {/* Text Content */}
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <span className="link-row-title text-xs font-semibold text-(--text) group-hover:text-(--accent-text) transition-colors leading-tight">
              {title}
            </span>
            <span className="text-[10.5px] text-(--text-muted) font-normal truncate leading-tight mt-0.5">
              {destinationText}
            </span>
          </div>
        </div>

        {/* Small ↗ Icon */}
        <ArrowUpRight className="h-3.5 w-3.5 text-(--icon) shrink-0 group-hover:text-(--icon-active) group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      </a>
    );
  }

  // Regular Row (~52px height on desktop, flexible on <400px mobile for 2-line title)
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${title} – opens ${ariaDestination}`}
      onClick={onClick}
      className={`group relative flex items-center justify-between gap-3 min-h-[52px] h-auto min-[400px]:h-[52px] px-3.5 py-2 rounded-xl border border-(--surface-border)/80 bg-(--card-bg) text-left transition-all duration-150 ease-out hover:border-(--accent)/30 hover:bg-(--accent-hover)/[0.03]   active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-1 cursor-pointer select-none ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* 32×32 Icon Tile */}
        <div
          className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center overflow-hidden shadow-xs ${iconBg}`}
        >
          {thumbnail ? (
            <img
              src={thumbnail}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : favicon ? (
            <img src={favicon} alt="" className="w-5 h-5 object-contain" loading="lazy" />
          ) : letter ? (
            <span className="text-xs font-bold uppercase text-(--accent-text)">{letter}</span>
          ) : (
            platform.renderIcon(false)
          )}
        </div>

        {/* Text Content */}
        <div className="min-w-0 flex-1 flex flex-col justify-center py-0.5">
          <span className="link-row-title text-xs sm:text-[13px] font-semibold text-(--text) group-hover:text-(--accent-text) transition-colors leading-tight">
            {title}
          </span>
          <span className="text-xs text-(--text-muted) font-normal truncate leading-tight mt-0.5">
            {destinationText}
          </span>
        </div>
      </div>

      {/* Pin marker sits just left of the ↗ icon */}
      {isPinned && <Pin aria-label="Pinned" className="h-3.5 w-3.5 text-(--icon) shrink-0 -mr-1.5" />}

      {/* Small ↗ Icon */}
      <ArrowUpRight className="h-4 w-4 text-(--icon) shrink-0 group-hover:text-(--icon-active) group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
    </a>
  );
}
