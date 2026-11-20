"use client";

import { useState } from "react";
import Link from "next/link";
import { InflixoWordmark } from "@/components/brand/InflixoLogo";
import { openCookiePreferences } from "@/lib/cookieConsent";
import { ReportProfileModal } from "@/components/public/ReportProfileModal";
import { TAGLINE } from "@/lib/brand";

export interface GlobalFooterProps {
  className?: string;
  creatorUsername?: string;
  creatorDisplayName?: string;
  disabled?: boolean;
}

export function GlobalFooter({
  className = "",
  creatorUsername,
  creatorDisplayName,
  disabled = false,
}: GlobalFooterProps) {
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Always a white footer (every theme), so the colours are fixed for white, not taken from the theme.
  const linkBtnClasses =
    "tap-44 px-2 py-1 rounded-[5px] text-[12px] font-medium text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors cursor-pointer select-none inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[#C21B5C]";

  const linkBtnStyle = {};

  return (
    <footer
      className={`w-full overflow-hidden border-t border-solid border-[#ECECF0] border-b-0 border-x-0 bg-white rounded-none rounded-b-[5px] text-center select-none ${className}`}
    >
      {/* Row 1 — Branding */}
      <div className="w-full px-3 py-2.5 sm:py-3 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-xs text-[#6B6B76]">
        <span className="font-normal select-none">Powered by</span>
        <Link
          href="/"
          target="_blank"
          onClick={(e) => {
            if (disabled) e.preventDefault();
          }}
          className="inline-flex items-center gap-1 font-semibold text-[#C21B5C] hover:opacity-85 transition-opacity cursor-pointer"
          aria-label="Inflixo Homepage"
        >
          <span>Inflixo</span>
          <span className="text-[10px] sm:text-[11px] no-underline inline-block translate-y-[-0.5px]">↗</span>
        </Link>
        <span className="font-normal select-none" aria-hidden>·</span>
        <span className="font-normal select-none">{TAGLINE}</span>
      </div>

      {/* Full-width Divider 1 */}
      <div className="h-px w-full bg-[#ECECF0] shrink-0" aria-hidden="true" />

      {/* Row 2 — Footer Links */}
      <nav
        aria-label="Footer"
        className="w-full px-3 py-2 sm:py-2.5 flex flex-wrap items-center justify-center gap-1 sm:gap-1.5"
      >
        <Link
          href="/terms"
          target="_blank"
          onClick={(e) => {
            if (disabled) e.preventDefault();
          }}
          style={linkBtnStyle}
          className={linkBtnClasses}
        >
          Terms
        </Link>

        <Link
          href="/privacy"
          target="_blank"
          onClick={(e) => {
            if (disabled) e.preventDefault();
          }}
          style={linkBtnStyle}
          className={linkBtnClasses}
        >
          Privacy
        </Link>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (!disabled) openCookiePreferences();
          }}
          style={linkBtnStyle}
          className={linkBtnClasses}
        >
          Cookies
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (!disabled) setIsReportOpen(true);
          }}
          style={linkBtnStyle}
          className={linkBtnClasses}
        >
          Report Profile
        </button>

        <a
          href="mailto:support@inflixo.com?subject=Inflixo%20Support"
          onClick={(e) => {
            if (disabled) e.preventDefault();
          }}
          style={linkBtnStyle}
          className={linkBtnClasses}
        >
          Support
        </a>
      </nav>

      {/* Full-width Divider 2 */}
      <div className="h-px w-full bg-[#ECECF0] shrink-0" aria-hidden="true" />

      {/* Row 3 — Copyright */}
      <div className="w-full px-3 py-2 sm:py-2.5">
        <p className="text-[11px] text-[#A1A1AA] font-normal text-center select-none">
          &copy; 2026 Inflixo. All rights reserved.
        </p>
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
    </footer>
  );
}
