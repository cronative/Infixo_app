import type { ThemeKey } from "@/types";
import { DEFAULT_THEME, listThemes } from "@/themes/config";

/** The default theme (Jamun). Every unknown, removed or missing theme id resolves to it. */
export const DEFAULT_THEME_KEY: ThemeKey = DEFAULT_THEME.id;

/** Every registered theme id (themes/config.ts). */
export const THEME_KEYS: readonly ThemeKey[] = listThemes().map((theme) => theme.id);

export function isThemeKey(value: unknown): value is ThemeKey {
  return typeof value === "string" && (THEME_KEYS as readonly string[]).includes(value);
}

/** Stored/requested theme id → a theme that exists (never a removed theme's styles). */
export function resolveThemeKey(value: unknown): ThemeKey {
  return isThemeKey(value) ? value : DEFAULT_THEME_KEY;
}
