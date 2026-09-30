"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { InflixoLogoIcon } from "@/components/shared/Logo";
import { getPublicTheme } from "@/components/public/publicTheme";

interface PublicMadeWithInflixoProps {
  themeKey?: string;
  className?: string;
}

/**
 * Clean, subtle center-aligned footer at the end of the public page.
 * Merged seamlessly at the end of the page (below episodes/cards), replacing the floating pill.
 */
export function PublicMadeWithInflixoFooter({
  themeKey = "minimal-white",
  className = "",
}: PublicMadeWithInflixoProps) {
  const theme = getPublicTheme(themeKey);
  const { colors: c, isDark } = theme;

  const textColor = isDark ? "rgba(255, 255, 255, 0.65)" : c.mutedText || "rgba(100, 116, 139, 0.85)";

  return (
    <footer className={`w-full py-5 mt-2 mb-4 flex items-center justify-center text-center select-none ${className}`}>
      <a
        href="https://inflixo.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: textColor }}
        className="group inline-flex items-center gap-1.5 text-xs font-medium transition-all hover:opacity-100 opacity-75"
        aria-label="Made with Inflixo — Made in India"
      >
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-current/10 transition-transform duration-200 group-hover:scale-110">
          <InflixoLogoIcon color="current" className="h-2.5 w-2.5" />
        </span>
        <span className="tracking-tight">
          Made with <strong className="font-semibold text-current">Inflixo</strong>
        </span>
        <span className="opacity-40 select-none">·</span>
        <span className="inline-flex items-center gap-1">
          <span>Made in India</span>
          <span className="text-[12px]">🇮🇳</span>
        </span>
      </a>
    </footer>
  );
}

/**
 * Mobile Version: now uses the unified PublicMadeWithInflixoFooter
 */
export function PublicMadeWithInflixoMobile(props: PublicMadeWithInflixoProps) {
  return <PublicMadeWithInflixoFooter {...props} />;
}

/**
 * Web / Desktop Version: null to eliminate distracting floating corner pill
 */
export function PublicMadeWithInflixoWeb(_props: PublicMadeWithInflixoProps) {
  return null;
}

/**
 * Combined default export for convenience.
 */
export function PublicMadeWithInflixo(props: PublicMadeWithInflixoProps) {
  return <PublicMadeWithInflixoFooter {...props} />;
}

