import { PAGE_ANIMATIONS, isPageAnimation } from "@/lib/themeAnimations";

/**
 * WCAG 2.x contrast checks for theme tokens. Every registered theme must pass validateTheme().
 */

export const MIN_CONTRAST = 4.5;

type Rgb = [number, number, number];

/** Parses #rgb, #rrggbb, #rrggbbaa (alpha ignored), rgb()/rgba() and "white"/"black". */
export function parseColor(value: string): Rgb | null {
  const v = value.trim().toLowerCase();
  if (v === "white") return [255, 255, 255];
  if (v === "black") return [0, 0, 0];
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split("").map((c) => c + c).join("") : hex[1].slice(0, 6);
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
  }
  const rgb = v.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null;
}

/** Every colour mentioned in a CSS value (e.g. the stops of a gradient). */
export function colorsIn(value: string): Rgb[] {
  const matches = value.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|\b(?:white|black)\b/gi) || [];
  return matches.map(parseColor).filter((c): c is Rgb => Boolean(c));
}

function luminance([r, g, b]: Rgb) {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Like parseColor, but keeps alpha (0..1). Also understands color-mix(in srgb, A p%, B). */
export function parseRgba(value: string): { rgb: Rgb; a: number } | null {
  const v = value.trim().toLowerCase();
  const mix = v.match(/^color-mix\(\s*in srgb\s*,\s*(.+?)\s+([\d.]+)%\s*,\s*(.+?)\s*\)$/);
  if (mix) {
    const a = parseRgba(mix[1]);
    const b = parseRgba(mix[3]);
    if (!a || !b) return null;
    const p = parseFloat(mix[2]) / 100;
    return {
      rgb: a.rgb.map((c, i) => Math.round(c * p + b.rgb[i] * (1 - p))) as Rgb,
      a: a.a * p + b.a * (1 - p),
    };
  }
  const rgb = parseColor(v);
  if (!rgb) return null;
  const hex8 = v.match(/^#[0-9a-f]{6}([0-9a-f]{2})$/);
  if (hex8) return { rgb, a: parseInt(hex8[1], 16) / 255 };
  const fn = v.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+%?)\s*\)$/);
  if (fn) return { rgb, a: fn[1].endsWith("%") ? parseFloat(fn[1]) / 100 : parseFloat(fn[1]) };
  return { rgb, a: 1 };
}

/** `top` (with alpha) composited over the opaque `under`. */
export function blend(top: { rgb: Rgb; a: number }, under: Rgb): Rgb {
  return top.rgb.map((c, i) => Math.round(c * top.a + under[i] * (1 - top.a))) as Rgb;
}

const WHITE: Rgb = [255, 255, 255];

/** Resolves var(--token) references (one level, e.g. --accent-text: var(--accent)). */
function resolve(value: string, tokens: Record<string, unknown>): string {
  const m = value.trim().match(/^var\((--[\w-]+)\)$/);
  return m && typeof tokens[m[1]] === "string" ? (tokens[m[1]] as string) : value;
}

/**
 * The card colour text is actually read on, in the worst case. A translucent ("glass") card is
 * composited over white; on photo themes over white under the page overlay's lightest stop.
 */
export function worstCardBackground(tokens: Record<string, string>): Rgb | null {
  const card = parseRgba(resolve(tokens["--card-bg"], tokens));
  if (!card) return null;
  if (card.a >= 1) return card.rgb;
  let under = WHITE;
  const overlay = (tokens["--page-overlay"] || "").trim();
  if (overlay && overlay !== "none") {
    const stops = (overlay.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi) || [])
      .map(parseRgba)
      .filter((c): c is { rgb: Rgb; a: number } => Boolean(c));
    const lightest = stops.sort((x, y) => x.a - y.a)[0];
    if (lightest) under = blend(lightest, under);
  }
  return blend(card, under);
}

export function contrastRatio(a: Rgb, b: Rgb) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export interface ContrastTokens {
  "--page-bg": string;
  "--page-overlay": string;
  "--on-page-text": string;
  "--card-bg": string;
  "--surface": string;
  "--text": string;
  "--text-muted": string;
  "--accent": string;
  "--on-accent": string;
  "--accent-soft": string;
}

export class ThemeContrastError extends Error {}

/** Every token a theme must define (non-empty). */
export const REQUIRED_TOKENS = [
  "--page-bg", "--page-overlay", "--on-page-text",
  "--card-bg", "--card-border", "--card-shadow", "--card-radius",
  "--surface", "--surface-border", "--text", "--text-muted",
  "--accent", "--accent-hover", "--on-accent", "--accent-soft", "--divider",
  "--tab-active", "--tab-inactive", "--tab-indicator",
  "--font-heading", "--font-body", "--logo-variant",
  "--logo-bg", "--logo-fg", "--wordmark", "--icon", "--icon-active",
  "--avatar-bg", "--avatar-text", "--avatar-ring",
  "--nav-shadow", "--nav-shadow-scrolled", "--cover-from", "--cover-to", "--page-anim",
  "--card-blur", "--accent-text",
] as const;

/**
 * Checks every required token is present, then the required text/background pairs (translucent "glass" cards are
 * judged on their worst case: composited over white, or over white under the page overlay). For the page background the
 * darkest gradient stop (or the overlay) is used; an image background must declare a --page-overlay.
 * Throws ThemeContrastError listing every failing pair.
 */
export function validateTheme(id: string, tokens: ContrastTokens): void {
  const failures: string[] = [];
  const all = tokens as unknown as Record<string, unknown>;
  for (const name of REQUIRED_TOKENS) {
    if (typeof all[name] !== "string" || !(all[name] as string).trim()) failures.push(`${name} is required`);
  }
  if (all["--page-anim"] && !isPageAnimation(all["--page-anim"])) {
    failures.push(`--page-anim must be one of ${PAGE_ANIMATIONS.join(", ")} (got "${all["--page-anim"]}")`);
  }
  if (all["--logo-variant"] && !["light", "dark"].includes(all["--logo-variant"] as string)) {
    failures.push(`--logo-variant must be "light" or "dark" (got "${all["--logo-variant"]}")`);
  }
  // Backgrounds as actually seen: translucent card/surface/chip colours are composited (worst case).
  const t = all as Record<string, string>;
  const card = worstCardBackground(t);
  const layer = (name: string) => {
    const c = parseRgba(resolve(t[name] || "", t));
    return c && card ? (c.a >= 1 ? c.rgb : blend(c, card)) : null;
  };
  const backgrounds: Record<string, Rgb | null> = {
    "--card-bg": card,
    "--surface": layer("--surface"),
    "--accent-soft": layer("--accent-soft"),
    "--accent": parseRgba(resolve(t["--accent"] || "", t))?.rgb ?? null,
  };
  const pair = (fgName: string, bgName: string) => {
    const fg = parseRgba(resolve(t[fgName] || "", t))?.rgb ?? null;
    const bg = backgrounds[bgName];
    if (!fg || !bg) {
      failures.push(`${fgName} on ${bgName}: colours must be hex or rgb() (got "${t[fgName]}" / "${t[bgName]}")`);
      return;
    }
    const ratio = contrastRatio(fg, bg);
    if (ratio < MIN_CONTRAST) failures.push(`${fgName} on ${bgName}: ${ratio.toFixed(2)}:1 (needs ${MIN_CONTRAST}:1)`);
  };

  pair("--text", "--card-bg");
  pair("--text", "--surface");
  pair("--text-muted", "--card-bg");
  pair("--text-muted", "--surface");
  pair("--accent-text", "--card-bg");
  pair("--accent-text", "--surface");
  pair("--on-accent", "--accent");
  pair("--accent-text", "--accent-soft");

  // Text placed directly on the page background.
  const onPage = parseColor(tokens["--on-page-text"]);
  const overlay = tokens["--page-overlay"].trim();
  const backdrop = overlay && overlay !== "none" ? colorsIn(overlay) : colorsIn(tokens["--page-bg"]);
  if (!onPage) {
    failures.push(`--on-page-text must be hex or rgb() (got "${tokens["--on-page-text"]}")`);
  } else if (!backdrop.length) {
    failures.push("--on-page-text on --page-bg: no colour found; image backgrounds need a solid --page-overlay");
  } else {
    // Spec: compare against the darkest gradient stop (or the overlay).
    const darkest = backdrop.reduce((a, b) => (luminance(a) <= luminance(b) ? a : b));
    const ratio = contrastRatio(onPage, darkest);
    if (ratio < MIN_CONTRAST) failures.push(`--on-page-text on --page-bg: ${ratio.toFixed(2)}:1 at its darkest stop (needs ${MIN_CONTRAST}:1)`);
  }

  if (failures.length) {
    throw new ThemeContrastError(`Theme "${id}" fails WCAG contrast:\n  - ${failures.join("\n  - ")}`);
  }
}
