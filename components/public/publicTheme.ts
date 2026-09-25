import type { CSSProperties } from "react";
import {
  ThemeService,
  THEME_PAGE_BACKGROUNDS,
  getThemeCssVariables,
} from "@/services/ThemeService";

/**
 * Shared design tokens for every public creator page
 * (profile, series, series detail, reviews, media kit).
 *
 * Colors always come from the creator's theme (ThemeService.themeMeta).
 * This file only standardises *how* those colors are applied, plus the
 * typography, radius and control sizes that must match across pages.
 */

const DARK_THEME_KEYS = new Set([
  "midnight",
  "cosmic-purple",
  "aurora-night",
  "rose-glow",
  "ocean-motion",
  "sunset-studio",
  "marine-drive",
  "burj-khalifa",
  "neon-reels",
  "podcast-lounge",
  "gamer-stream",
  "cafe-mocha",
  "aurora-gradient",
  "royal-glow",
]);

export function isDarkTheme(themeKey: string = "minimal-white"): boolean {
  return DARK_THEME_KEYS.has(themeKey);
}

/* ------------------------------------------------------------------ */
/* Typography scale (Tailwind classes). Colors/fonts applied via style */
/* ------------------------------------------------------------------ */
export const PUBLIC_TYPE = {
  /** Creator name on the main profile */
  creatorName: "text-[22px] sm:text-2xl font-bold tracking-tight leading-tight",
  /** Title of a secondary page (Series, Reviews, Media kit, series title) */
  pageTitle: "text-lg sm:text-xl font-bold tracking-tight leading-snug",
  /** Section heading inside the card */
  sectionTitle: "text-[15px] sm:text-base font-bold tracking-tight",
  /** Title of an item card (series, package, review author) */
  cardTitle: "text-sm sm:text-[15px] font-semibold leading-snug",
  /** Body copy / descriptions */
  body: "text-[13px] sm:text-sm leading-relaxed font-normal",
  /** Secondary line: handle, counts, platform */
  meta: "text-xs sm:text-[13px] font-medium",
  /** Same size as meta, regular weight (descriptions, list items) */
  metaRegular: "text-xs sm:text-[13px] font-normal",
  /** Smallest allowed text: eyebrows, badges (never below 11px) */
  label: "text-[11px] sm:text-xs font-semibold",
  /** Uppercase eyebrow */
  eyebrow: "text-[11px] font-semibold uppercase tracking-[0.12em]",
  /** Big stat numbers (fanbase) */
  stat: "text-3xl sm:text-[34px] font-extrabold tracking-tight leading-none",
  /** Prices */
  price: "text-sm sm:text-[15px] font-bold tabular-nums",
} as const;

/* ------------------------------------------------------------------ */
/* Radius + layout                                                     */
/* ------------------------------------------------------------------ */
export const PUBLIC_RADIUS = {
  card: "rounded-[22px]", // the centered main card
  item: "rounded-[14px]", // cards inside the main card
  control: "rounded-[12px]", // icon buttons, inputs
  button: "rounded-[14px]", // primary / secondary CTA
  chip: "rounded-full",
} as const;

/** Centered card: sleek mobile-first width on web (up to 580px). */
export const PUBLIC_MAIN_CLASS =
  "relative z-10 h-dvh min-h-0 flex flex-col mx-auto w-full max-w-[580px] px-2 py-2 sm:px-3 sm:py-3 overflow-hidden animate-fade-in-up";

/** Inner padding of the centered card, shared by all pages. */
export const PUBLIC_CARD_PADDING = "px-3.5 sm:px-5";

/** 36-38px square icon control (header buttons). */
export const PUBLIC_ICON_BUTTON =
  "tap-scale flex h-9 w-9 sm:h-9.5 sm:w-9.5 shrink-0 items-center justify-center rounded-[11px] border shadow-2xs transition-all hover:scale-105 cursor-pointer select-none";

/** Text control (e.g. "View all", "Media kit"). */
export const PUBLIC_TEXT_BUTTON =
  "tap-scale inline-flex h-9 sm:h-9.5 items-center justify-center gap-1.5 rounded-[11px] border px-3 text-xs sm:text-[13px] font-semibold shadow-2xs transition-all hover:opacity-90 cursor-pointer";

/** Full-width CTA button. */
export const PUBLIC_CTA_BUTTON =
  "tap-scale inline-flex h-11 sm:h-11.5 w-full items-center justify-center gap-2 rounded-[12px] border px-4 text-xs sm:text-sm font-bold transition-all hover:brightness-95 cursor-pointer";

/* ------------------------------------------------------------------ */
/* Theme-derived styles                                                */
/* ------------------------------------------------------------------ */
export function getPublicTheme(themeKey: string = "minimal-white") {
  const meta = ThemeService.getThemeMeta(themeKey);
  const c = meta.colors;
  const eff = meta.effects;
  const typ = meta.typography;
  const isDark = isDarkTheme(themeKey) || meta.mode === "dark";
  const pageBgClass =
    meta.outerBgClass || THEME_PAGE_BACKGROUNDS[themeKey] || THEME_PAGE_BACKGROUNDS["minimal-white"];
  const hasPhotoBackdrop = Boolean(meta.outerBgClass?.includes("theme-bg-"));

  /** The centered main card surface. Same on every page. */
  const surfaceStyle: CSSProperties = {
    ...(getThemeCssVariables(meta) as CSSProperties),
    backgroundColor: meta.profileSurface?.background || c.profileBackground,
    borderColor: meta.profileSurface?.border || c.border,
    // No drop shadow around the centered card (clean look on every public page)
    boxShadow: "none",
    color: c.primaryText,
    fontFamily: typ.fontFamily,
    letterSpacing: typ.letterSpacing,
  };

  /** Header icon/text controls. */
  const controlStyle: CSSProperties = {
    backgroundColor: isDark ? "rgba(255, 255, 255, 0.12)" : c.cardBackground,
    borderColor: isDark ? "rgba(255, 255, 255, 0.22)" : c.border,
    color: isDark ? "#FFFFFF" : c.primaryText,
  };

  /** Cards inside the main card (series item, package, review...). */
  const itemStyle: CSSProperties = {
    backgroundColor: c.cardBackground,
    borderColor: c.border,
    color: c.primaryText,
    boxShadow: eff.cardShadow,
  };

  /** Slightly raised surface (stat tiles, empty states). */
  const elevatedStyle: CSSProperties = {
    backgroundColor: c.elevatedBackground || c.cardBackground,
    borderColor: c.border,
    color: c.primaryText,
  };

  const headingStyle: CSSProperties = {
    color: c.primaryText,
    fontFamily: typ.headingFontFamily,
  };

  return {
    meta,
    colors: c,
    effects: eff,
    typography: typ,
    isDark,
    pageBgClass,
    hasPhotoBackdrop,
    surfaceStyle,
    controlStyle,
    itemStyle,
    elevatedStyle,
    headingStyle,
  };
}

export type PublicTheme = ReturnType<typeof getPublicTheme>;
