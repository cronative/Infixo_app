import type { CSSProperties } from "react";
import type { ThemeKey } from "@/types";
import { blend, contrastRatio, parseColor, parseRgba, validateTheme, worstCardBackground } from "@/lib/themeContrast";
import type { PageAnimation } from "@/lib/themeAnimations";

/**
 * Token-based themes. A theme is ONE object of these CSS variables; every public profile widget
 * styles itself only through them (see the --token utilities in app/globals.css).
 */
export interface ThemeTokens {
  /** Colour / gradient / image behind the card. */
  "--page-bg": string;
  /** Optional tint over image backgrounds ("none" when unused). */
  "--page-overlay": string;
  /** Text placed directly on the page background. */
  "--on-page-text": string;
  "--card-bg": string;
  "--card-border": string;
  "--card-shadow": string;
  "--card-radius": string;
  /** Inner rows/cards inside the main card. */
  "--surface": string;
  "--surface-border": string;
  "--text": string;
  "--text-muted": string;
  "--accent": string;
  "--accent-hover": string;
  "--on-accent": string;
  "--accent-soft": string;
  /** Thin separators inside the card (tab bar, list rows, footer). */
  "--divider": string;
  "--tab-active": string;
  "--tab-inactive": string;
  "--tab-indicator": string;
  "--font-heading": string;
  "--font-body": string;
  /** Inflixo logo variant on the card: "light" (white logo, for dark cards) or "dark". */
  "--logo-variant": "light" | "dark";
  /** Inflixo logo mark tile background. */
  "--logo-bg": string;
  /** Inflixo logo mark glyph. */
  "--logo-fg": string;
  /** "Inflixo" wordmark in the nav bar and footer. */
  "--wordmark": string;
  /** UI icons: share, tab icons, chevrons. */
  "--icon": string;
  /** Icon of the active tab. */
  "--icon-active": string;
  "--avatar-bg": string;
  "--avatar-text": string;
  /** Ring around the profile photo (colour or gradient). */
  "--avatar-ring": string;
  /** Nav bar shadow at rest / once content scrolls. */
  "--nav-shadow": string;
  "--nav-shadow-scrolled": string;
  /** Series cover fallback gradient (no poster). */
  "--cover-from": string;
  "--cover-to": string;
  /** Background animation behind the card (lib/themeAnimations.ts), "none" for static themes. */
  "--page-anim": PageAnimation;
  /** Backdrop blur behind the card ("0px" = solid card; glass themes use a translucent --card-bg). */
  "--card-blur": string;
  /** Coloured text/icons/active tab; --accent stays for filled buttons/chips. */
  "--accent-text": string;
}

export type ThemeGroup = "basics" | "rainbow" | "places" | "animated";

/** How a theme appears on the Themes page (not used by the profile itself). */
export interface ThemeListing {
  group: ThemeGroup;
  subtitle: string;
  swatches: [string, string, string];
  /** CSS background for the card thumbnail (gradient or colour). */
  thumbnail: string;
  /** Photo themes: the background image; the theme is hidden from the listing until it loads. */
  image?: string;
}

export interface ThemeDefinition {
  id: ThemeKey;
  name: string;
  tokens: ThemeTokens;
  listing: ThemeListing;
}

export const THEME_GROUPS: { id: ThemeGroup; title: string; subtitle: string }[] = [
  { id: "basics", title: "Basics", subtitle: "Clean everyday looks" },
  { id: "rainbow", title: "Rainbow", subtitle: "One colour, full vibe" },
  { id: "places", title: "India Places", subtitle: "Your favourite place behind your profile" },
  { id: "animated", title: "Animated", subtitle: "Backgrounds that move" },
];

/** Tokens a theme may omit; registerTheme() fills them with these defaults. */
export const DEFAULT_TOKENS: Pick<ThemeTokens, "--divider" | "--nav-shadow" | "--nav-shadow-scrolled" | "--cover-from" | "--cover-to" | "--page-anim" | "--card-blur" | "--accent-text"> = {
  "--card-blur": "0px",
  "--accent-text": "var(--accent)",
  "--page-anim": "none",
  "--divider": "color-mix(in srgb, var(--accent) 16%, transparent)",
  "--nav-shadow": "0 2px 8px rgba(0,0,0,.06)",
  "--nav-shadow-scrolled": "0 4px 12px rgba(0,0,0,.10)",
  "--cover-from": "var(--accent)",
  "--cover-to": "color-mix(in srgb, var(--accent) 52%, black)",
};

export type ThemeInput = Omit<ThemeDefinition, "tokens"> & {
  tokens: Omit<ThemeTokens, keyof typeof DEFAULT_TOKENS> & Partial<typeof DEFAULT_TOKENS>;
};

/** Same family as the dashboard; --font-indic keeps Indian scripts rendering. */
const DASHBOARD_FONT = "var(--font-poppins), 'Poppins', var(--font-indic), system-ui, sans-serif";

export const INFLIXO_MAROON: ThemeDefinition = {
  id: "inflixo-maroon",
  name: "Jamun",
  tokens: {
    "--page-bg": "linear-gradient(160deg, #7A2253 0%, #4A1232 100%)",
    "--page-overlay": "none",
    "--on-page-text": "#FFFFFF",
    // Card tinted with the accent (5% / 9% / 16% / 18%); no pure white in the card.
    "--card-bg": "color-mix(in srgb, #7A2253 5%, #FFFFFF)",
    "--card-border": "color-mix(in srgb, #7A2253 18%, #FFFFFF)",
    "--card-shadow": "0 20px 60px rgba(40,8,26,.35)",
    "--card-radius": "24px",
    "--surface": "color-mix(in srgb, #7A2253 9%, #FFFFFF)",
    "--surface-border": "color-mix(in srgb, #7A2253 16%, #FFFFFF)",
    "--text": "#1A1218",
    "--text-muted": "#6B5A64",
    "--accent": "#7A2253",
    "--accent-hover": "#63193F",
    "--on-accent": "#FFFFFF",
    "--accent-soft": "#F5E9EF",
    "--divider": "rgba(122,34,83,.16)",
    "--tab-active": "#7A2253",
    "--tab-inactive": "#6B5A64",
    "--tab-indicator": "#7A2253",
    "--font-heading": DASHBOARD_FONT,
    "--font-body": DASHBOARD_FONT,
    "--logo-variant": "dark",
    "--logo-bg": "#7A2253",
    "--logo-fg": "#FFFFFF",
    "--wordmark": "#7A2253",
    "--icon": "#6B5A64",
    "--icon-active": "#7A2253",
    "--avatar-bg": "#7A2253",
    "--avatar-text": "#FFFFFF",
    "--avatar-ring": "linear-gradient(135deg,#F5B8D4,#7A2253)",
    "--nav-shadow": "0 2px 8px rgba(0,0,0,.06)",
    "--nav-shadow-scrolled": "0 4px 12px rgba(0,0,0,.10)",
    "--cover-from": "#7A2253",
    "--cover-to": "#3F0E2A",
    "--page-anim": "none",
    "--card-blur": "0px",
    "--accent-text": "var(--accent)",
  },
  listing: {
    group: "basics",
    subtitle: "Rich & bold",
    swatches: ["#7A2253", "#FFFFFF", "#F5E9EF"],
    thumbnail: "linear-gradient(160deg, #7A2253 0%, #4A1232 100%)",
  },
};

export const KAPAS: ThemeDefinition = {
  id: "kapas",
  name: "Kapas",
  tokens: {
    "--page-bg": "#E9E9EC",
    "--page-overlay": "none",
    "--on-page-text": "#111113",
    "--card-bg": "#FFFFFF",
    "--card-border": "#DDDDE1",
    "--card-shadow": "0 12px 40px rgba(17,17,19,.08)",
    "--card-radius": "24px",
    "--surface": "#F7F7F8",
    "--surface-border": "#ECECEE",
    "--text": "#111113",
    "--text-muted": "#5F5F66",
    "--accent": "#111113",
    "--accent-hover": "#2A2A2E",
    "--on-accent": "#FFFFFF",
    "--accent-soft": "#F1F1F3",
    "--divider": "rgba(17,17,19,.10)",
    "--tab-active": "#111113",
    "--tab-inactive": "#5F5F66",
    "--tab-indicator": "#111113",
    "--font-heading": DASHBOARD_FONT,
    "--font-body": DASHBOARD_FONT,
    "--logo-variant": "dark",
    "--logo-bg": "#111113",
    "--logo-fg": "#FFFFFF",
    "--wordmark": "#111113",
    "--icon": "#5F5F66",
    "--icon-active": "#111113",
    "--avatar-bg": "#111113",
    "--avatar-text": "#FFFFFF",
    "--avatar-ring": "#D4D4D8",
    "--nav-shadow": "0 2px 8px rgba(0,0,0,.06)",
    "--nav-shadow-scrolled": "0 4px 12px rgba(0,0,0,.10)",
    "--cover-from": "#2A2A2E",
    "--cover-to": "#111113",
    "--page-anim": "none",
    "--card-blur": "0px",
    "--accent-text": "var(--accent)",
  },
  listing: {
    group: "basics",
    subtitle: "Soft & clean",
    swatches: ["#F2F2F4", "#FFFFFF", "#111113"],
    thumbnail: "#E9E9EC",
  },
};

export const KAJAL: ThemeDefinition = {
  id: "kajal",
  name: "Kajal",
  tokens: {
    "--page-bg": "radial-gradient(120% 80% at 50% 0%, #2A1E26 0%, #0B0B0F 60%)",
    "--page-overlay": "none",
    "--on-page-text": "#F4F4F6",
    "--card-bg": "#17171C",
    "--card-border": "#2A2A33",
    "--card-shadow": "0 20px 60px rgba(0,0,0,.5)",
    "--card-radius": "24px",
    "--surface": "#202027",
    "--surface-border": "#2E2E37",
    "--text": "#F4F4F6",
    "--text-muted": "#A1A1AA",
    "--accent": "#F5B8D4",
    "--accent-hover": "#F9CDE1",
    "--on-accent": "#17171C",
    "--accent-soft": "#2A1E26",
    "--divider": "rgba(255,255,255,.10)",
    "--tab-active": "#F5B8D4",
    "--tab-inactive": "#A1A1AA",
    "--tab-indicator": "#F5B8D4",
    "--font-heading": DASHBOARD_FONT,
    "--font-body": DASHBOARD_FONT,
    "--logo-variant": "light",
    "--logo-bg": "#F5B8D4",
    "--logo-fg": "#17171C",
    "--wordmark": "#F4F4F6",
    "--icon": "#A1A1AA",
    "--icon-active": "#F5B8D4",
    "--avatar-bg": "#2A1E26",
    "--avatar-text": "#F5B8D4",
    "--avatar-ring": "linear-gradient(135deg,#F5B8D4,#7A2253)",
    "--nav-shadow": "0 2px 8px rgba(0,0,0,.4)",
    "--nav-shadow-scrolled": "0 4px 12px rgba(0,0,0,.5)",
    "--cover-from": "#2A1E26",
    "--cover-to": "#0B0B0F",
    "--page-anim": "none",
    "--card-blur": "0px",
    "--accent-text": "var(--accent)",
  },
  listing: {
    group: "basics",
    subtitle: "Dark & bold",
    swatches: ["#0B0B0F", "#17171C", "#F5B8D4"],
    thumbnail: "radial-gradient(120% 80% at 50% 0%, #2A1E26 0%, #0B0B0F 60%)",
  },
};

/* ------------------------------------------------------------------ */
/* Rainbow & India Places: shared templates                            */
/* ------------------------------------------------------------------ */

/** #RRGGBB darkened by `amount` (0.1 = 10% darker). */
function darken(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) * (1 - amount)).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`.toUpperCase();
}

/** #RRGGBB → rgba(r,g,b,alpha). */
function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** White card, neutral text, one accent colour (shared by Rainbow and India Places). */
function accentTemplate(accent: string, soft: string, ringFrom: string, coverTo: string) {
  return {
    "--on-page-text": "#FFFFFF",
    "--card-bg": "#FFFFFF",
    "--card-border": "rgba(0,0,0,.06)",
    "--card-shadow": "0 16px 48px rgba(0,0,0,.12)",
    "--card-radius": "24px",
    "--surface": "#F7F7F9",
    "--surface-border": "#ECECF0",
    "--text": "#1A1A1F",
    "--text-muted": "#5C5C66",
    "--accent": accent,
    "--accent-hover": darken(accent, 0.1),
    "--on-accent": "#FFFFFF",
    "--accent-soft": soft,
    "--divider": alpha(accent, 0.14),
    "--tab-active": accent,
    "--tab-inactive": "#5C5C66",
    "--tab-indicator": accent,
    "--font-heading": DASHBOARD_FONT,
    "--font-body": DASHBOARD_FONT,
    "--logo-variant": "dark",
    "--logo-bg": accent,
    "--logo-fg": "#FFFFFF",
    "--wordmark": accent,
    "--icon": "#5C5C66",
    "--icon-active": accent,
    "--avatar-bg": accent,
    "--avatar-text": "#FFFFFF",
    "--avatar-ring": `linear-gradient(135deg, ${ringFrom}, ${accent})`,
    "--cover-from": accent,
    "--cover-to": coverTo,
  } as const;
}

/** Card faintly tinted with the accent (no pure white anywhere in the card). */
function tintedCard(accent: string) {
  return {
    "--card-bg": `color-mix(in srgb, ${accent} 5%, #FFFFFF)`,
    "--surface": `color-mix(in srgb, ${accent} 9%, #FFFFFF)`,
    "--surface-border": `color-mix(in srgb, ${accent} 16%, #FFFFFF)`,
    "--card-border": `color-mix(in srgb, ${accent} 18%, #FFFFFF)`,
  };
}

function rainbowTheme(
  id: ThemeKey, name: string, subtitle: string, bg1: string, bg2: string, accent: string, soft: string,
  overrides: Partial<ThemeTokens> = {},
): ThemeInput {
  const pageBg = `linear-gradient(160deg, ${bg1} 0%, ${bg2} 100%)`;
  return {
    id,
    name,
    tokens: { ...accentTemplate(accent, soft, bg1, bg2), ...tintedCard(accent), "--page-bg": pageBg, "--page-overlay": "none", ...overrides },
    listing: { group: "rainbow", subtitle, swatches: [bg1, bg2, accent], thumbnail: pageBg },
  };
}

const PLACE_OVERLAY = "linear-gradient(180deg, rgba(0,0,0,.25) 0%, rgba(0,0,0,.55) 100%)";

/* ------------------------------------------------------------------ */
/* Dark glass card (India Places & Animated)                           */
/* ------------------------------------------------------------------ */

const GLASS_CARD_BG = "rgba(16,16,20,.70)";

/**
 * Dark translucent card over the page. Coloured text uses a light tint of the accent (--accent-text),
 * lightened until it reaches 4.5:1 on the worst case (glass over white, or white under the page overlay).
 */
function glassTokens(accent: string, overlay: string) {
  const card = worstCardBackground({ "--card-bg": GLASS_CARD_BG, "--page-overlay": overlay })!;
  const surface = blend(parseRgba("rgba(255,255,255,.08)")!, card);
  // Tint for chips; very light accents (e.g. Jugnu yellow) get a fainter tint so the text still reads.
  let accentSoft = alpha(accent, 0.22);
  let accentText = lighten(accent, 0.55);
  search: for (const softAlpha of [0.22, 0.18, 0.14, 0.1]) {
    accentSoft = alpha(accent, softAlpha);
    const soft = blend(parseRgba(accentSoft)!, card);
    for (let t = 0.55; t <= 1.0001; t += 0.05) {
      accentText = lighten(accent, Math.min(t, 1));
      const c = parseColor(accentText)!;
      if (contrastRatio(c, card) >= 4.5 && contrastRatio(c, surface) >= 4.5 && contrastRatio(c, soft) >= 4.5) break search;
    }
  }
  const onAccent = contrastRatio([255, 255, 255], parseColor(accent)!) >= 4.5 ? "#FFFFFF" : "#17171C";
  // Muted text must also read on the glass surface (worst case); lighten #D4D4DC only as far as needed.
  let textMuted = "#D4D4DC";
  for (let t = 0; t <= 1; t += 0.05) {
    textMuted = lighten("#D4D4DC", Math.min(t, 1));
    const c = parseColor(textMuted)!;
    if (contrastRatio(c, card) >= 4.5 && contrastRatio(c, surface) >= 4.5) break;
  }
  return {
    "--card-bg": GLASS_CARD_BG,
    "--card-blur": "8px",
    "--card-border": "rgba(255,255,255,.14)",
    "--card-shadow": "0 16px 48px rgba(0,0,0,.35)",
    "--surface": "rgba(255,255,255,.08)",
    "--surface-border": "rgba(255,255,255,.12)",
    "--text": "#FFFFFF",
    "--text-muted": textMuted,
    "--divider": "rgba(255,255,255,.14)",
    "--tab-inactive": textMuted,
    "--icon": textMuted,
    "--wordmark": "#FFFFFF",
    "--accent-text": accentText,
    "--tab-active": accentText,
    "--tab-indicator": accentText,
    "--icon-active": accentText,
    "--accent-soft": accentSoft,
    "--on-accent": onAccent,
    "--logo-variant": "light" as const,
    "--nav-shadow": "0 2px 8px rgba(0,0,0,.25)",
    "--nav-shadow-scrolled": "0 4px 12px rgba(0,0,0,.35)",
  };
}

function placeTheme(id: ThemeKey, name: string, subtitle: string, accent: string, soft: string): ThemeInput {
  const image = `/images/themes/places/${id}.webp`;
  return {
    id,
    name,
    tokens: {
      // Ring/cover use the soft tint + deep accent since there is no gradient pair for photo themes.
      ...accentTemplate(accent, soft, soft, darken(accent, 0.45)),
      ...glassTokens(accent, PLACE_OVERLAY),
      "--page-bg": `url(${image}) center / cover no-repeat fixed ${accent}`,
      "--page-overlay": PLACE_OVERLAY,
    },
    listing: { group: "places", subtitle, swatches: [accent, soft, "#FFFFFF"], thumbnail: `${PLACE_OVERLAY}, url(${image}) center / cover no-repeat ${accent}`, image },
  };
}

export const RAINBOW_THEMES: ThemeInput[] = [
  rainbowTheme("kurinji", "Kurinji", "Violet bloom", "#A78BFA", "#5B21B6", "#6D28D9", "#F3EEFF"),
  rainbowTheme("neel", "Neel", "Deep indigo", "#818CF8", "#312E81", "#3730A3", "#EEF0FF"),
  rainbowTheme("samundar", "Samundar", "Ocean blue", "#7DD3FC", "#075985", "#0369A1", "#E8F4FC"),
  // Accent darkened 4% (#15803D → #147B3B) so it keeps 4.5:1 on the tinted surface.
  rainbowTheme("neem", "Neem", "Fresh green", "#86EFAC", "#166534", darken("#15803D", 0.04), "#EAF7EE"),
  // White on Haldi's darkest stop (#CA8A04) is 2.9:1, so text on the page uses the dark text colour (≈6:1).
  rainbowTheme("haldi", "Haldi", "Sunny yellow", "#FDE68A", "#CA8A04", "#8A5A00", "#FFF6D6", { "--on-page-text": "#1A1A1F" }),
  rainbowTheme("kesar", "Kesar", "Saffron glow", "#FDBA74", "#C2410C", "#B4480B", "#FFF0E5"),
  rainbowTheme("gulmohar", "Gulmohar", "Flame red", "#FCA5A5", "#991B1B", "#B91C1C", "#FDECEC"),
];

export const PLACE_THEMES: ThemeInput[] = [
  placeTheme("taj-mahal", "Taj Mahal", "Agra · Eternal love", "#9F1239", "#FDECF1"),
  placeTheme("india-gate", "India Gate", "Delhi · Proud & bold", "#92400E", "#FDF2E3"),
  placeTheme("gateway-of-india", "Gateway of India", "Mumbai · Dreams by the sea", "#1E40AF", "#EAF0FD"),
  placeTheme("marine-drive", "Marine Drive", "Mumbai · Queen's necklace", "#0E7490", "#E6F6F9"),
  placeTheme("goa-beach", "Goa Beach", "Goa · Sun, sand & vibes", "#0F766E", "#E6F6F4"),
  placeTheme("ladakh", "Ladakh", "Pangong · Mountain calm", "#1D4ED8", "#EAF0FE"),
  placeTheme("kerala-backwaters", "Kerala Backwaters", "God's own country", "#047857", "#E7F6F0"),
  placeTheme("hawa-mahal", "Hawa Mahal", "Jaipur · Pink city", "#BE123C", "#FDEDF1"),
  placeTheme("varanasi-ghats", "Varanasi Ghats", "Banaras · Ganga aarti", "#C2410C", "#FFF0E6"),
  placeTheme("rann-of-kutch", "Rann of Kutch", "Gujarat · White desert", "#4338CA", "#EEF0FF"),
  placeTheme("cricket-stadium", "Cricket Stadium", "Floodlights & cheers", "#166534", "#E9F6EE"),
  placeTheme("gully-cricket", "Gully Cricket", "Street game, big dreams", "#B45309", "#FEF3E2"),
  placeTheme("somnath", "Somnath", "Gujarat · Temple by the sea", "#7C2D12", "#FCEEE6"),
  placeTheme("dwarka", "Dwarka", "Gujarat · Devbhoomi", "#A21CAF", "#FBEAFC"),
  placeTheme("burj-khalifa", "Burj Khalifa", "Dubai · Sky high", "#1E3A8A", "#EAF0FD"),
];

/* ------------------------------------------------------------------ */
/* Animated: light-card and dark-card templates                        */
/* ------------------------------------------------------------------ */

/** #RRGGBB mixed toward white by `amount` (0.2 = 20% lighter). */
function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => {
    const c = (n >> shift) & 255;
    return Math.round(c + (255 - c) * amount).toString(16).padStart(2, "0");
  };
  return `#${ch(16)}${ch(8)}${ch(0)}`.toUpperCase();
}

interface AnimatedSpec {
  id: ThemeKey;
  name: string;
  subtitle: string;
  card: "light" | "dark";
  pageBg: string;
  anim: PageAnimation;
  accent: string;
  soft: string;
  /** Text placed directly on the page background (default white). */
  onPageText?: string;
}

function animatedTheme({ id, name, subtitle, card, pageBg, anim, accent, soft, onPageText = "#FFFFFF" }: AnimatedSpec): ThemeInput {
  const accentTokens = {
    "--accent": accent,
    "--accent-soft": soft,
    "--tab-active": accent,
    "--tab-indicator": accent,
    "--icon-active": accent,
    "--wordmark": accent,
    "--logo-bg": accent,
    "--avatar-bg": accent,
  };
  const cardTokens = card === "light"
    ? {
        "--card-bg": "#FFFFFF",
        "--card-border": "rgba(0,0,0,.06)",
        "--card-shadow": "0 16px 48px rgba(0,0,0,.18)",
        "--surface": "#F7F7F9",
        "--surface-border": "#ECECF0",
        "--text": "#1A1A1F",
        "--text-muted": "#5C5C66",
        "--on-accent": "#FFFFFF",
        "--accent-hover": darken(accent, 0.1),
        "--tab-inactive": "#5C5C66",
        "--icon": "#5C5C66",
        "--logo-fg": "#FFFFFF",
        "--avatar-text": "#FFFFFF",
        "--divider": alpha(accent, 0.14),
        "--logo-variant": "dark" as const,
        "--avatar-ring": `linear-gradient(135deg, ${soft}, ${accent})`,
        "--cover-from": accent,
        "--cover-to": darken(accent, 0.45),
      }
    : {
        "--card-bg": "#17171C",
        "--card-border": "#2A2A33",
        "--card-shadow": "0 20px 60px rgba(0,0,0,.5)",
        "--surface": "#202027",
        "--surface-border": "#2E2E37",
        "--text": "#F4F4F6",
        "--text-muted": "#A1A1AA",
        "--on-accent": "#17171C",
        "--accent-hover": lighten(accent, 0.2),
        "--tab-inactive": "#A1A1AA",
        "--icon": "#A1A1AA",
        "--logo-fg": "#17171C",
        "--avatar-text": "#17171C",
        "--divider": "rgba(255,255,255,.10)",
        "--logo-variant": "light" as const,
        "--avatar-ring": `linear-gradient(135deg, ${accent}, ${soft})`,
        "--nav-shadow": "0 2px 8px rgba(0,0,0,.4)",
        "--nav-shadow-scrolled": "0 4px 12px rgba(0,0,0,.5)",
        "--cover-from": soft,
        "--cover-to": "#0B0B0F",
      };
  return {
    id,
    name,
    tokens: {
      ...cardTokens,
      ...accentTokens,
      // Animated backgrounds use the dark glass card.
      ...glassTokens(accent, "none"),
      "--page-bg": pageBg,
      "--page-overlay": "none",
      "--on-page-text": onPageText,
      "--card-radius": "24px",
      "--font-heading": DASHBOARD_FONT,
      "--font-body": DASHBOARD_FONT,
      "--page-anim": anim,
    },
    listing: { group: "animated", subtitle, swatches: [accent, soft, card === "light" ? "#FFFFFF" : "#17171C"], thumbnail: pageBg },
  };
}

// Light page backgrounds can't carry white text (Holi, Patang, Jashn, Rangoli), so their on-page text
// is the dark text colour instead of #FFFFFF; darkening text, never lightening it.
const ON_LIGHT_PAGE = "#1A1A1F";

export const ANIMATED_THEMES: ThemeInput[] = [
  animatedTheme({ id: "diwali", name: "Diwali", subtitle: "Diyas & sparkles", card: "light", pageBg: "radial-gradient(#3B1A08, #120804)", anim: "diyas", accent: "#B45309", soft: "#FEF3E2" }),
  animatedTheme({ id: "holi", name: "Holi", subtitle: "Colours in the air", card: "light", pageBg: "#FFF7FB", anim: "gulal", accent: "#A21CAF", soft: "#FBEAFC", onPageText: ON_LIGHT_PAGE }),
  animatedTheme({ id: "baarish", name: "Baarish", subtitle: "Monsoon mood", card: "light", pageBg: "linear-gradient(180deg, #334155, #0F172A)", anim: "rain", accent: "#0369A1", soft: "#E8F4FC" }),
  animatedTheme({ id: "patang", name: "Patang", subtitle: "Kites in the sky", card: "light", pageBg: "linear-gradient(180deg, #7DD3FC, #E0F2FE)", anim: "kites", accent: "#9A3412", soft: "#FCEEE6", onPageText: ON_LIGHT_PAGE }),
  animatedTheme({ id: "taare", name: "Taare", subtitle: "Starry night", card: "dark", pageBg: "radial-gradient(120% 80% at 50% 0%, #1E2240, #05060F)", anim: "stars", accent: "#A5B4FC", soft: "#1E2240" }),
  animatedTheme({ id: "lehrein", name: "Lehrein", subtitle: "Waves of the sea", card: "light", pageBg: "linear-gradient(180deg, #CFFAFE, #0E7490)", anim: "waves", accent: "#0E7490", soft: "#E6F6F9" }),
  animatedTheme({ id: "dhanak", name: "Dhanak", subtitle: "Flowing rainbow", card: "light", pageBg: "#0B0B12", anim: "aurora", accent: "#6D28D9", soft: "#F3EEFF" }),
  animatedTheme({ id: "jashn", name: "Jashn", subtitle: "Party mode", card: "light", pageBg: "linear-gradient(160deg, #FDF2F8, #FCE7F3)", anim: "confetti", accent: "#BE185D", soft: "#FCE7F1", onPageText: ON_LIGHT_PAGE }),
  animatedTheme({ id: "jugnu", name: "Jugnu", subtitle: "Fireflies at night", card: "dark", pageBg: "radial-gradient(#14200F, #050805)", anim: "fireflies", accent: "#FDE68A", soft: "#2A2614" }),
  animatedTheme({ id: "rangoli", name: "Rangoli", subtitle: "Festive patterns", card: "light", pageBg: "linear-gradient(160deg, #FFEDD5, #FED7AA)", anim: "rangoli", accent: "#C2410C", soft: "#FFF0E6", onPageText: ON_LIGHT_PAGE }),
];

const REGISTRY = new Map<ThemeKey, ThemeDefinition>();

/** Adds a theme after checking WCAG contrast; throws (failing the build/test) if any pair is below 4.5:1. */
export function registerTheme(input: ThemeInput): ThemeDefinition {
  const theme: ThemeDefinition = { ...input, tokens: { ...DEFAULT_TOKENS, ...input.tokens } };
  validateTheme(theme.id, theme.tokens);
  REGISTRY.set(theme.id, theme);
  return theme;
}

registerTheme(INFLIXO_MAROON);
registerTheme(KAPAS);
registerTheme(KAJAL);
RAINBOW_THEMES.forEach(registerTheme);
PLACE_THEMES.forEach(registerTheme);
ANIMATED_THEMES.forEach(registerTheme);

/** Jamun (inflixo-maroon) stays the default. */
export const DEFAULT_THEME = INFLIXO_MAROON;

export function getThemeDefinition(id: string | null | undefined): ThemeDefinition {
  return REGISTRY.get(id as ThemeKey) || DEFAULT_THEME;
}

export function listThemes(): ThemeDefinition[] {
  return [...REGISTRY.values()];
}

/** The theme's CSS variables, for the public profile root (and any preview of it). */
export function themeTokenStyle(id: string | null | undefined): CSSProperties {
  return getThemeDefinition(id).tokens as unknown as CSSProperties;
}

/**
 * Default theme tokens for shared widgets rendered outside a profile root (e.g. avatars in the dashboard).
 * `:where(:root)` has zero specificity, so where a name is also part of the dashboard design system
 * (--surface, --text-muted, --page-bg, --card-shadow in globals.css) the dashboard value still wins
 * outside the profile. Profile roots set every token inline, which overrides both.
 * Values are config constants, not user input.
 */
export function themeTokensCss(id?: string): string {
  const tokens = getThemeDefinition(id).tokens as unknown as Record<string, string>;
  return `:where(:root){${Object.entries(tokens).map(([name, value]) => `${name}:${value}`).join(";")}}`;
}
