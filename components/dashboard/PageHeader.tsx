"use client";

import { ReactNode } from "react";

export interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Muted count/usage line in the subtitle area (e.g. "3 of 5 · Starter"). */
  meta?: ReactNode;
  /** Legacy help bullets (ignored to keep header clean and minimal) */
  help?: string[];
  /** Action buttons on the right */
  actions?: ReactNode;
  className?: string;
}

/**
 * Shared Sticky PageHeader with Full-Width Divider for all /dashboard pages.
 * - Sticky at top (sticky top-0 z-30 bg-white)
 * - Full-width divider line underneath (border-b border-[#ECECF0])
 * - Clean layout: Title + Subtitle on the left, action buttons on the right
 * - Content scrolls cleanly underneath the divider
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  meta,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-30 bg-white border-b border-[#ECECF0] -mx-4 sm:-mx-6 lg:-mx-8 -mt-6 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 transition-colors ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        {/* Left: 2 lines — Title on line 1, Subtitle on line 2 */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {eyebrow && (
              <span className="text-[12px] font-normal text-[#71717A] shrink-0">
                {eyebrow}
              </span>
            )}
            <h1 className="text-[17px] sm:text-[19px] font-bold text-[#18181B] tracking-tight leading-snug">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="mt-0.5 text-[12px] sm:text-[12.5px] text-[#6B6B76] leading-normal font-normal">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right: Meta (e.g. 2 of 3 series) before Action buttons */}
        {(meta || actions) && (
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            {meta && (
              <div className="text-[12px] text-[#6B6B76] whitespace-nowrap flex items-center gap-1 font-medium">
                {meta}
              </div>
            )}
            {actions && (
              <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                {actions}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

