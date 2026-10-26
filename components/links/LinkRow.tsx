"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";
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

  // Thumbnail fallback
  const thumbnail = (link as { thumbnail?: string }).thumbnail;

  if (compact) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${title} – opens ${ariaDestination}`}
        onClick={onClick}
        className={`group relative flex items-center justify-between gap-2.5 min-h-[42px] px-3.5 py-2 bg-transparent hover:bg-slate-50/80 dark:hover:bg-white/[0.04] text-left transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A2253] focus-visible:ring-offset-1 cursor-pointer select-none ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* 24×24 Icon Tile */}
          <div
            className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center overflow-hidden ${
              thumbnail ? "bg-slate-100 dark:bg-zinc-800" : platform.bgClass
            }`}
          >
            {thumbnail ? (
              <img
                src={thumbnail}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              platform.renderIcon(true)
            )}
          </div>

          {/* Text Content */}
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <span className="link-row-title text-xs font-semibold text-slate-900 dark:text-white group-hover:text-[#7A2253] dark:group-hover:text-pink-400 transition-colors leading-tight">
              {title}
            </span>
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-normal truncate leading-tight mt-0.5">
              {destinationText}
            </span>
          </div>
        </div>

        {/* Small ↗ Icon */}
        <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
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
      className={`group relative flex items-center justify-between gap-3 min-h-[52px] h-auto min-[400px]:h-[52px] px-3.5 ${
        isPinned ? "py-2" : "py-2"
      } rounded-xl border ${
        isPinned
          ? "border-slate-200/80 border-l-[3px] border-l-[#7A2253] bg-[#7A2253]/[0.05] dark:bg-[#7A2253]/10 dark:border-white/10 dark:border-l-[#7A2253]"
          : "border-slate-200/80 dark:border-white/10 bg-white dark:bg-zinc-900"
      } text-left transition-all duration-150 ease-out hover:border-[#7A2253]/30 hover:bg-[#7A2253]/[0.03] dark:hover:border-[#7A2253]/40 dark:hover:bg-[#7A2253]/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A2253] focus-visible:ring-offset-1 cursor-pointer select-none ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* 32×32 Icon Tile */}
        <div
          className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center overflow-hidden shadow-xs ${
            thumbnail ? "bg-slate-100 dark:bg-zinc-800" : platform.bgClass
          }`}
        >
          {thumbnail ? (
            <img
              src={thumbnail}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            platform.renderIcon(false)
          )}
        </div>

        {/* Text Content */}
        <div className="min-w-0 flex-1 flex flex-col justify-center py-0.5">
          {isPinned && (
            <span className="text-[11px] font-semibold text-[#7A2253] dark:text-pink-400 flex items-center gap-1 leading-none mb-0.5">
              <span>📌</span> Pinned
            </span>
          )}
          <span className="link-row-title text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-white group-hover:text-[#7A2253] dark:group-hover:text-pink-400 transition-colors leading-tight">
            {title}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-normal truncate leading-tight mt-0.5">
            {destinationText}
          </span>
        </div>
      </div>

      {/* Small ↗ Icon */}
      <ArrowUpRight className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
    </a>
  );
}
