"use client";

import { useState } from "react";
import Link from "next/link";
import { InflixoWordmark } from "@/components/brand/InflixoLogo";
import { openCookiePreferences } from "@/lib/cookieConsent";
import { ReportProfileModal } from "@/components/public/ReportProfileModal";

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

  const linkBtnClasses =
    "px-2.5 py-1 rounded-[5px] text-[11px] sm:text-xs font-normal text-(--accent, #7A2253) underline underline-offset-[3px] decoration-(--accent, #7A2253) hover:bg-(--accent, #7A2253)/[0.12] active:bg-(--accent, #7A2253)/[0.18] transition-colors cursor-pointer select-none inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-(--accent, #7A2253)";

  const linkBtnStyle = {
    backgroundColor: "color-mix(in srgb, var(--accent, #7A2253) 6%, transparent)",
    color: "var(--accent, #7A2253)",
    textDecorationColor: "var(--accent, #7A2253)",
  };

  return (
    <footer
      style={{
        borderColor: "var(--surface-border)",
      }}
      className={`w-full overflow-hidden rounded-[5px] border border-(--surface-border) text-center select-none ${className}`}
    >
      {/* Row 1 — Branding */}
      <div className="w-full px-3 py-2.5 sm:py-3 flex items-center justify-center gap-1.5 text-xs text-(--text-muted, #71717a)">
        <span className="font-normal select-none">Powered by</span>
        <Link
          href="/"
          target="_blank"
          onClick={(e) => {
            if (disabled) e.preventDefault();
          }}
          style={{
            color: "var(--accent, #7A2253)",
            textDecorationColor: "var(--accent, #7A2253)",
          }}
          className="inline-flex items-center gap-1 font-semibold text-(--accent, #7A2253) hover:opacity-85 transition-opacity cursor-pointer underline underline-offset-[3px] decoration-(--accent, #7A2253)"
          aria-label="Inflixo Homepage"
        >
          <span>inflixo</span>
          <span className="text-[10px] sm:text-[11px] no-underline inline-block translate-y-[-0.5px]">↗</span>
        </Link>
      </div>

      {/* Full-width Divider 1 */}
      <div
        style={{ backgroundColor: "var(--surface-border)" }}
        className="h-px w-full bg-(--surface-border, #e4e4e7) shrink-0"
        aria-hidden="true"
      />

      {/* Row 2 — Footer Links */}
      <nav
        aria-label="Footer"
        className="w-full px-3 py-2.5 sm:py-3 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2"
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
      <div
        style={{ backgroundColor: "var(--surface-border)" }}
        className="h-px w-full bg-(--surface-border, #e4e4e7) shrink-0"
        aria-hidden="true"
      />

      {/* Row 3 — Copyright */}
      <div className="w-full px-3 py-2 sm:py-2.5">
        <p className="text-[10.5px] sm:text-[11px] text-(--text-muted, #71717a) opacity-80 font-normal text-center select-none">
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
