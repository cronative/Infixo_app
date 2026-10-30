"use client";

import { getPublicTheme } from "@/components/public/publicTheme";
import { DEFAULT_THEME_KEY } from "@/lib/themeKeys";
import { GlobalFooter } from "@/components/shared/GlobalFooter";

interface PublicMadeWithInflixoProps {
  themeKey?: string;
  className?: string;
}

/**
 * Clean, subtle center-aligned footer at the end of the public page.
 * Minimal and classy: ⚡ Powered by Inflixo in muted grey text.
 */
export function PublicMadeWithInflixoFooter({
  className = "",
}: PublicMadeWithInflixoProps) {
  return <GlobalFooter className={className} />;
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
