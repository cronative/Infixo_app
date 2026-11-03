"use client";

import React, { useState } from "react";
import { ArrowUpRight, Globe } from "lucide-react";
import { CustomLink, CustomLinkItem } from "@/types";
import { getPlatformFromUrl, extractBareDomain } from "@/lib/linkIcons";

export interface LinkRowProps {
  link: CustomLink | CustomLinkItem;
  isPinned?: boolean;
  compact?: boolean;
  /** Divided-row style inside a Section container: no own border/radius, Featured is just a chip. */
  flat?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function LinkRow({
  link,
  isPinned = false,
  compact = false,
  flat = false,
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
  const isFeatured = Boolean(isPinned || (link as any).isPinned);
  const subtitleText = link.description || destinationText;

  // Thumbnail fallback; otherwise the favicon saved on the server (known platforms keep their brand icon).
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

  if (compact) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${title} – opens ${ariaDestination}`}
        onClick={onClick}
        className={`group relative flex items-center justify-between gap-2.5 min-h-[42px] px-3.5 py-2 bg-transparent hover:bg-(--surface)/50 text-left transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-1 cursor-pointer select-none ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* 24×24 Icon Tile */}
          <div
            className={`w-6 h-6 rounded-[4px] shrink-0 flex items-center justify-center overflow-hidden ${iconBg}`}
          >
            {thumbnail ? (
              <img
                src={thumbnail}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : favicon ? (
              <img src={favicon} alt="" className="w-4 h-4 object-contain" loading="lazy" onError={() => setFaviconFailed(true)} />
            ) : showGlobe ? (
              <Globe className="h-3.5 w-3.5 text-(--accent-text)" />
            ) : (
              platform.renderIcon(true)
            )}
          </div>

          {/* Text Content */}
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="link-row-title text-[13px] font-medium text-(--text) group-hover:text-(--accent-text) transition-colors leading-[18px] truncate">
                {title}
              </span>
              {isFeatured && (
                <span
                  style={{
                    color: "var(--accent-text)",
                    backgroundColor: "color-mix(in srgb, var(--accent) 12%, var(--surface))",
                    borderColor: "var(--surface-border)",
                  }}
                  className="inline-flex items-center text-[9.5px] font-bold px-1.5 py-0.2 rounded-[3px] border leading-tight shrink-0 select-none"
                >
                  ⭐ Featured
                </span>
              )}
            </div>
            <span className="text-[11px] text-(--text-muted) font-normal truncate leading-[16px] mt-0.5">
              {subtitleText}
            </span>
          </div>
        </div>

        {/* Small ↗ Icon */}
        <ArrowUpRight className="h-3.5 w-3.5 text-(--icon) shrink-0 group-hover:text-(--icon-active) group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      </a>
    );
  }

  // Regular Row
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${title} – opens ${ariaDestination}`}
      onClick={onClick}
      className={`group relative flex items-center justify-between gap-3 min-h-[48px] h-auto min-[400px]:h-[48px] px-3.5 py-2 ${
        flat
          ? "rounded-none hover:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]!"
          : `rounded-[5px] border ${isFeatured ? "border-(--accent) shadow-2xs" : "border-(--surface-border)"}`
      } bg-transparent text-left transition-all duration-150 ease-out hover:bg-(--surface)/40 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-1 cursor-pointer select-none ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* 32×32 Icon Tile */}
        <div
          className={`w-8 h-8 rounded-[4px] shrink-0 flex items-center justify-center overflow-hidden shadow-none ${iconBg}`}
        >
          {thumbnail ? (
            <img
              src={thumbnail}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : favicon ? (
            <img src={favicon} alt="" className="w-5 h-5 object-contain" loading="lazy" onError={() => setFaviconFailed(true)} />
          ) : showGlobe ? (
            <Globe className="h-4 w-4 text-(--accent-text)" />
          ) : (
            platform.renderIcon(false)
          )}
        </div>

        {/* Text Content */}
        <div className="min-w-0 flex-1 flex flex-col justify-center py-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="link-row-title text-[13px] font-medium text-(--text) group-hover:text-(--accent-text) transition-colors leading-[18px] truncate">
              {title}
            </span>
            {isFeatured && (
              <span
                style={{
                  color: "var(--accent-text)",
                  backgroundColor: "color-mix(in srgb, var(--accent) 12%, var(--surface))",
                  borderColor: "var(--surface-border)",
                }}
                className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 rounded-[3px] border leading-tight shrink-0 select-none"
              >
                ⭐ Featured
              </span>
            )}
          </div>
          <span className="text-xs text-(--text-muted) font-normal truncate leading-[17px] mt-0.5">
            {subtitleText}
          </span>
        </div>
      </div>

      {/* Small ↗ Icon */}
      <ArrowUpRight className="h-4 w-4 text-(--icon) shrink-0 group-hover:text-(--icon-active) group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
    </a>
  );
}
