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
    "px-2 sm:px-2.5 py-1 rounded-[5px] text-[11px] sm:text-xs font-normal text-(--text-muted, #71717a) hover:text-(--text, #18181b) hover:bg-(--surface-border, #e4e4e7)/20 active:bg-(--surface-border, #e4e4e7)/30 transition-all cursor-pointer select-none inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-(--accent, #7A2253)";

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
          className="inline-flex items-center gap-1 font-semibold text-(--text, #18181b) hover:text-(--accent, #7A2253) transition-colors cursor-pointer"
          aria-label="Inflixo Homepage"
        >
          <InflixoWordmark className="h-3.5 sm:h-4" />
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
        className="w-full px-3 py-2.5 sm:py-3 flex flex-wrap items-center justify-center gap-1 sm:gap-1.5"
      >
        <Link
          href="/terms"
          target="_blank"
          onClick={(e) => {
            if (disabled) e.preventDefault();
          }}
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
          className={linkBtnClasses}
        >
          Report Profile
        </button>

        <a
          href="mailto:support@inflixo.com?subject=Inflixo%20Support"
          onClick={(e) => {
            if (disabled) e.preventDefault();
          }}
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
