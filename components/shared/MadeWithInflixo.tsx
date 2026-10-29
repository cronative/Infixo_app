"use client";

import { useState } from "react";
import Link from "next/link";
import { InflixoWordmark } from "@/components/brand/InflixoLogo";
import { openCookiePreferences } from "@/lib/cookieConsent";
import { ReportProfileModal } from "@/components/public/ReportProfileModal";

interface MadeWithInflixoProps {
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  className?: string;
  disabled?: boolean;
  compact?: boolean;
  /** Footer at the bottom of the public profile card. */
  variant?: "default" | "card-footer";
  creatorUsername?: string;
  creatorDisplayName?: string;
}

export function MadeWithInflixo({
  color,
  className = "",
  disabled = false,
  variant = "default",
  creatorUsername,
  creatorDisplayName,
}: MadeWithInflixoProps) {
  const [isReportOpen, setIsReportOpen] = useState(false);

  if (variant === "card-footer") {
    return (
      <div className={`w-full flex flex-col sm:flex-row items-center justify-between gap-x-3 gap-y-1.5 px-3 sm:px-4 text-center sm:text-left select-none ${className}`}>
        {/* Left: Powered by Inflixo */}
        <a
          href="https://inflixo.com"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => {
            if (disabled) event.preventDefault();
          }}
          className="inline-flex items-center justify-center gap-1.5 text-[11.5px] sm:text-[12px] font-medium text-(--text-muted) hover:text-(--text) transition-colors cursor-pointer shrink-0"
          aria-label="Powered by Inflixo"
        >
          <span className="tracking-normal">Powered by</span>
          <InflixoWordmark className="h-3.5 sm:h-4" />
        </a>

        {/* Right: Linktree-style utility footer links (Cookie Preferences • Report • Privacy • Explore • More from Inflixo) */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-2 gap-y-0.5 text-[10.5px] sm:text-[11px] font-medium text-(--text-muted) opacity-80">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (!disabled) openCookiePreferences();
            }}
            className="hover:underline hover:text-(--text) transition-colors cursor-pointer"
          >
            Cookie Preferences
          </button>
          <span aria-hidden="true" className="opacity-40 select-none">•</span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (!disabled) setIsReportOpen(true);
            }}
            className="hover:underline hover:text-(--text) transition-colors cursor-pointer"
          >
            Report
          </button>
          <span aria-hidden="true" className="opacity-40 select-none">•</span>
          <Link
            href="/privacy"
            target="_blank"
            onClick={(e) => {
              if (disabled) e.preventDefault();
            }}
            className="hover:underline hover:text-(--text) transition-colors"
          >
            Privacy
          </Link>
          <span aria-hidden="true" className="opacity-40 select-none">•</span>
          <Link
            href="/"
            target="_blank"
            onClick={(e) => {
              if (disabled) e.preventDefault();
            }}
            className="hover:underline hover:text-(--text) transition-colors"
          >
            Explore
          </Link>
          <span aria-hidden="true" className="opacity-40 select-none">•</span>
          <a
            href="https://inflixo.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (disabled) e.preventDefault();
            }}
            className="hover:underline hover:text-(--text) transition-colors"
          >
            More from Inflixo
          </a>
        </div>

        {/* Report Modal */}
        {isReportOpen && (
          <ReportProfileModal
            isOpen={isReportOpen}
            onClose={() => setIsReportOpen(false)}
            creatorUsername={creatorUsername}
            creatorDisplayName={creatorDisplayName}
          />
        )}
      </div>
    );
  }

  return (
    <a
      href="https://inflixo.com"
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => {
        if (disabled) event.preventDefault();
      }}
      style={{ color: color || "var(--text-muted)" }}
      className={`group inline-flex items-center justify-center gap-2 text-xs font-medium transition-colors hover:opacity-100 opacity-75 ${className}`}
      aria-label="Powered by Inflixo"
    >
      <img
        src="/images/inflixo-logo-3d.png"
        alt="Inflixo"
        className="h-4.5 w-4.5 rounded-[5px] object-cover inline-block shrink-0 shadow-2xs group-hover:scale-110 transition-transform select-none"
      />
      <span className="tracking-normal">
        Powered by <strong className="font-semibold text-current">Inflixo</strong>
      </span>
    </a>
  );
}

export { PublicMadeWithInflixo } from "@/components/public/PublicMadeWithInflixo";
