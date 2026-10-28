import { themeRepository, authRepository } from "@/repositories/localRepository";
import { ThemeKey, ThemeMeta } from "@/types";
import { resolveThemeKey } from "@/lib/themeKeys";
import { listThemes, type ThemeDefinition } from "@/themes/config";

export { DEFAULT_THEME_KEY, isThemeKey, resolveThemeKey } from "@/lib/themeKeys";

/**
 * Legacy theme shape used across the app, derived from each token theme in themes/config.ts.
 * Every colour/font is a var(--token) so widgets reading it render the active theme's tokens;
 * only the id, name and preview swatch differ per theme.
 */
function toThemeMeta(theme: ThemeDefinition): ThemeMeta {
  return {
    key: theme.id,
    id: theme.id,
    name: theme.name,
    // A light (white) logo means a dark card: drives the existing white-logo / dark-controls switch.
    mode: theme.tokens["--logo-variant"] === "light" ? "dark" : "light",
    description: `${theme.name} theme`,
    swatch: [theme.tokens["--accent"], theme.tokens["--card-bg"], theme.tokens["--text"]],
    group: "light",
    isAnimated: false,
    tag: theme.name,
    typography: {
      fontFamily: "var(--font-body)",
      headingFontFamily: "var(--font-heading)",
      headingWeight: "700",
      letterSpacing: "0",
    },
    colors: {
      pageBackground: "var(--page-bg)",
      profileBackground: "var(--card-bg)",
      cardBackground: "var(--surface)",
      elevatedBackground: "var(--surface)",
      primaryText: "var(--text)",
      secondaryText: "var(--text-muted)",
      mutedText: "var(--text-muted)",
      accent: "var(--accent)",
      accentText: "var(--accent-text)",
      accentSoft: "var(--accent-soft)",
      accentBorder: "var(--surface-border)",
      border: "var(--card-border)",
      divider: "var(--divider)",
    },
    effects: {
      radius: "var(--card-radius)",
      cardShadow: "none",
      shadow: "var(--card-shadow)",
    },
    animation: { type: "none" },
    profileSurface: {
      background: "var(--card-bg)",
      border: "var(--card-border)",
      shadow: "var(--card-shadow)",
    },
    outerBgClass: "bg-(image:--page-bg) text-(--on-page-text)",
    profileBgClass: "bg-(--card-bg) text-(--text)",
    cardBgClass: "bg-(--surface)",
    cardBorderClass: "border-(--surface-border)",
    primaryTextClass: "text-(--text)",
    secondaryTextClass: "text-(--text-muted)",
    accentColor: "var(--accent)",
    accentSoftClass: "bg-(--accent-soft)",
    accentBorderClass: "border-(--surface-border)",
    animationType: "none",
  };
}

export const THEME_LIST: ThemeMeta[] = listThemes().map(toThemeMeta);

export const THEME_PAGE_BACKGROUNDS: Record<string, string> = THEME_LIST.reduce((acc, t) => {
  acc[t.key] = t.outerBgClass || "bg-slate-100/90 text-slate-900";
  return acc;
}, {} as Record<string, string>);

/**
 * Generate CSS Custom Properties (CSS variables) object for a given ThemeMeta
 */
type ThemeCssVariables = React.CSSProperties & Record<`--${string}`, string>;

export function getThemeCssVariables(theme: ThemeMeta): ThemeCssVariables {
  const c = theme.colors;
  const e = theme.effects;
  const typ = theme.typography;

  return {
    "--theme-page-bg": c.pageBackground,
    "--theme-profile-bg": c.profileBackground,
    "--theme-card-bg": c.cardBackground,
    "--theme-elevated-bg": c.elevatedBackground,
    "--theme-primary-text": c.primaryText,
    "--theme-secondary-text": c.secondaryText,
    "--theme-muted-text": c.mutedText,
    "--theme-accent": c.accent,
    "--theme-accent-text": c.accentText,
    "--theme-accent-soft": c.accentSoft,
    "--theme-accent-border": c.accentBorder,
    "--theme-border": c.border,
    "--theme-divider": c.divider,
    "--theme-radius": e.radius || "24px",
    "--theme-shadow": e.shadow || "none",
    "--theme-card-shadow": e.cardShadow || "none",
    "--theme-font-family": typ.fontFamily || "inherit",
    "--theme-heading-font": typ.headingFontFamily || "inherit",
    "--theme-heading-weight": typ.headingWeight || "700",
    "--theme-letter-spacing": typ.letterSpacing || "normal",
  };
}

export const ThemeService = {
  getSelectedTheme(): ThemeKey {
    return resolveThemeKey(themeRepository.get());
  },

  /** Caches a theme already loaded from the server, without writing it back. */
  cacheSelectedTheme(themeKey: ThemeKey): void {
    themeRepository.save(resolveThemeKey(themeKey));
  },

  setSelectedTheme(requestedKey: ThemeKey, isDashboardChange = false): void {
    const themeKey = resolveThemeKey(requestedKey);
    themeRepository.save(themeKey);
    const email = authRepository.getPendingEmail();
    if (email) {
      fetch("/api/creator/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          themeKey,
          incrementThemeCount: isDashboardChange,
        }),
      })
        .then((httpResponse) => httpResponse.json())
        .then((apiResponse) => {
          if (apiResponse.status === 1 && typeof apiResponse.data?.profile?.themeChangesCount === "number") {
            this.syncThemeChangesCount(apiResponse.data.profile.themeChangesCount);
          }
        })
        .catch((e) => console.error("Failed to save themeKey to MySQL DB:", e));
    }
  },

  syncThemeChangesCount(count: number): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("inflixo_theme_changes_count", count.toString());
    }
  },

  getThemeChangesCount(): number {
    if (typeof window === "undefined") return 0;
    const val = localStorage.getItem("inflixo_theme_changes_count");
    return val ? parseInt(val, 10) || 0 : 0;
  },

  incrementThemeChangesCount(): number {
    if (typeof window === "undefined") return 0;
    const current = this.getThemeChangesCount();
    const updated = current + 1;
    localStorage.setItem("inflixo_theme_changes_count", updated.toString());
    return updated;
  },

  checkThemeChangeLimit(): { allowed: boolean; isPro: boolean; remaining: number; count: number } {
    return { allowed: true, isPro: true, remaining: Infinity, count: 0 };
  },

  getThemeMeta(themeKey?: string): ThemeMeta {
    const key = resolveThemeKey(themeKey);
    return THEME_LIST.find((t) => t.key === key) ?? THEME_LIST[0];
  },

  list(): ThemeMeta[] {
    return THEME_LIST;
  },
};
