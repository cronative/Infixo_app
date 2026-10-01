"use client";

import { getPublicTheme } from "@/components/public/publicTheme";

interface PublicMadeWithInflixoProps {
  themeKey?: string;
  className?: string;
}

/**
 * Clean, subtle center-aligned footer at the end of the public page.
 * Minimal and classy: ⚡ Powered by Inflixo in muted grey text.
 */
export function PublicMadeWithInflixoFooter({
  themeKey = "minimal-white",
  className = "",
}: PublicMadeWithInflixoProps) {
  const theme = getPublicTheme(themeKey);
  const { colors: c, isDark } = theme;

  const textColor = isDark
    ? "rgba(255, 255, 255, 0.45)"
    : (c.mutedText || "#94a3b8");

  return (
    <footer className={`w-full py-6 mt-3 mb-6 flex items-center justify-center text-center select-none ${className}`}>
      <a
        href="https://inflixo.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: textColor }}
        className="group inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-slate-900 dark:hover:text-white"
        aria-label="Powered by Inflixo"
      >
        <span className="text-[11px] opacity-80 group-hover:scale-110 transition-transform select-none">⚡</span>
        <span className="tracking-normal">
          Powered by <strong className="font-semibold text-current">Inflixo</strong>
        </span>
      </a>
    </footer>
  );
}

/**
 * Mobile Version: uses the unified PublicMadeWithInflixoFooter
 */
export function PublicMadeWithInflixoMobile(props: PublicMadeWithInflixoProps) {
  return <PublicMadeWithInflixoFooter {...props} />;
}

/**
 * Web / Desktop Version: null to eliminate floating corner pill
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
