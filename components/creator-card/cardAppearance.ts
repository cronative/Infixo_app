"use client";

import { useEffect, useState } from "react";
import type { ThemeMeta } from "@/types";

export type CardLayoutType = "classic" | "minimal" | "badge" | "cyber" | "editorial";

export interface CardLayoutMeta {
  id: CardLayoutType;
  name: string;
  description: string;
  tag: string;
}

export const CARD_LAYOUTS: CardLayoutMeta[] = [
  { id: "classic", name: "Classic Story", description: "Top banner with overlapping avatar & fanbase count", tag: "Popular" },
  { id: "minimal", name: "Minimal Spotlight", description: "Clean centered portrait with verified creator badge", tag: "Modern" },
  { id: "badge", name: "VIP Pass", description: "Festival lanyard pass with ticket notch & barcode", tag: "Exclusive" },
  { id: "cyber", name: "Cyber Neon", description: "Futuristic dark neon aura with frosted glass HUD", tag: "Futuristic" },
  { id: "editorial", name: "Editorial Luxe", description: "High-fashion magazine spotlight with serif headers", tag: "Luxury" },
];

export interface CardAppearance {
  /** CSS `background` for the card body. */
  bodyBackground: string;
  /** CSS `background` for the top cover band. */
  coverBackground: string;
  primaryText: string;
  secondaryText: string;
  mutedText: string;
  accent: string;
  border: string;
  chipBackground: string;
  headingFont: string;
  bodyFont: string;
  headingWeight: string;
  radius: number;
  isDark: boolean;
  accentGlow?: string;
}

export interface CardThemePreset {
  id: string;
  name: string;
  tag: string;
  swatch: [string, string, string]; // [primary, accent, background]
  appearance: CardAppearance;
}

export const CARD_THEME_PRESETS: CardThemePreset[] = [
  {
    id: "royal",
    name: "Inflixo Royal",
    tag: "Signature",
    swatch: ["#043084", "#1D4ED8", "#FFFFFF"],
    appearance: {
      bodyBackground: "#FFFFFF",
      coverBackground: "linear-gradient(135deg, #043084 0%, #1E40AF 100%)",
      primaryText: "#0F172A",
      secondaryText: "#334155",
      mutedText: "#64748B",
      accent: "#043084",
      border: "#E2E8F0",
      chipBackground: "#F1F5F9",
      headingFont: "var(--font-sora), sans-serif",
      bodyFont: "var(--font-inter), sans-serif",
      headingWeight: "700",
      radius: 24,
      isDark: false,
      accentGlow: "rgba(4, 48, 132, 0.25)",
    },
  },
  {
    id: "obsidian",
    name: "Midnight Obsidian",
    tag: "Dark",
    swatch: ["#090D16", "#38BDF8", "#0F172A"],
    appearance: {
      bodyBackground: "#090D16",
      coverBackground: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
      primaryText: "#F8FAFC",
      secondaryText: "#94A3B8",
      mutedText: "#64748B",
      accent: "#38BDF8",
      border: "rgba(255, 255, 255, 0.12)",
      chipBackground: "rgba(255, 255, 255, 0.08)",
      headingFont: "var(--font-plus-jakarta), sans-serif",
      bodyFont: "var(--font-inter), sans-serif",
      headingWeight: "700",
      radius: 24,
      isDark: true,
      accentGlow: "rgba(56, 189, 248, 0.35)",
    },
  },
  {
    id: "emerald",
    name: "Emerald Gold",
    tag: "Prestige",
    swatch: ["#03281E", "#F59E0B", "#064E3B"],
    appearance: {
      bodyBackground: "#03281E",
      coverBackground: "linear-gradient(135deg, #064E3B 0%, #047857 100%)",
      primaryText: "#F0FDF4",
      secondaryText: "#A7F3D0",
      mutedText: "#6EE7B7",
      accent: "#F59E0B",
      border: "rgba(245, 158, 11, 0.2)",
      chipBackground: "rgba(245, 158, 11, 0.12)",
      headingFont: "var(--font-sora), sans-serif",
      bodyFont: "var(--font-inter), sans-serif",
      headingWeight: "700",
      radius: 24,
      isDark: true,
      accentGlow: "rgba(245, 158, 11, 0.3)",
    },
  },
  {
    id: "sunset",
    name: "Sunset Crimson",
    tag: "Vibrant",
    swatch: ["#881337", "#FB923C", "#FFF1F2"],
    appearance: {
      bodyBackground: "#FFFFFF",
      coverBackground: "linear-gradient(135deg, #881337 0%, #E11D48 60%, #FB923C 100%)",
      primaryText: "#1E1B4B",
      secondaryText: "#475569",
      mutedText: "#94A3B8",
      accent: "#E11D48",
      border: "#FEE2E2",
      chipBackground: "#FFF1F2",
      headingFont: "var(--font-outfit), sans-serif",
      bodyFont: "var(--font-inter), sans-serif",
      headingWeight: "700",
      radius: 24,
      isDark: false,
      accentGlow: "rgba(225, 29, 72, 0.3)",
    },
  },
  {
    id: "cyber",
    name: "Electric Violet",
    tag: "Neon",
    swatch: ["#0D091F", "#06B6D4", "#7C3AED"],
    appearance: {
      bodyBackground: "#0D091F",
      coverBackground: "linear-gradient(135deg, #1E1035 0%, #7C3AED 50%, #EC4899 100%)",
      primaryText: "#FAF5FF",
      secondaryText: "#C4B5FD",
      mutedText: "#8B5CF6",
      accent: "#06B6D4",
      border: "rgba(139, 92, 246, 0.3)",
      chipBackground: "rgba(139, 92, 246, 0.15)",
      headingFont: "var(--font-sora), sans-serif",
      bodyFont: "var(--font-inter), sans-serif",
      headingWeight: "700",
      radius: 24,
      isDark: true,
      accentGlow: "rgba(6, 182, 212, 0.4)",
    },
  },
  {
    id: "ivory",
    name: "Minimal Ivory",
    tag: "Editorial",
    swatch: ["#FAF6F0", "#C2410C", "#EFE8DC"],
    appearance: {
      bodyBackground: "#FAF6F0",
      coverBackground: "linear-gradient(135deg, #EFE8DC 0%, #E5DAC7 100%)",
      primaryText: "#1C1917",
      secondaryText: "#57534E",
      mutedText: "#8C857B",
      accent: "#C2410C",
      border: "#E7DEC8",
      chipBackground: "#EDE3D2",
      headingFont: "ui-serif, Georgia, Cambria, serif",
      bodyFont: "var(--font-inter), sans-serif",
      headingWeight: "700",
      radius: 20,
      isDark: false,
      accentGlow: "rgba(194, 65, 12, 0.2)",
    },
  },
  {
    id: "monochrome",
    name: "Pure Noir",
    tag: "Minimal",
    swatch: ["#000000", "#FFFFFF", "#18181B"],
    appearance: {
      bodyBackground: "#000000",
      coverBackground: "linear-gradient(135deg, #18181B 0%, #27272A 100%)",
      primaryText: "#FFFFFF",
      secondaryText: "#A1A1AA",
      mutedText: "#71717A",
      accent: "#FFFFFF",
      border: "rgba(255, 255, 255, 0.18)",
      chipBackground: "rgba(255, 255, 255, 0.1)",
      headingFont: "var(--font-plus-jakarta), sans-serif",
      bodyFont: "var(--font-inter), sans-serif",
      headingWeight: "700",
      radius: 24,
      isDark: true,
      accentGlow: "rgba(255, 255, 255, 0.25)",
    },
  },
];

const asLayer = (value: string) =>
  /gradient\(/.test(value) ? value : `linear-gradient(${value}, ${value})`;

/**
 * Derives the Creator Card look from the creator's existing theme tokens.
 * Photo themes use their colour tokens rather than the photo: the photos are
 * hot-linked without CORS, so they can't be exported, and text/QR never sit on
 * a busy image. The QR code has its own fixed white tile regardless of theme.
 */
export function deriveCardAppearance(theme: ThemeMeta): CardAppearance {
  const c = theme.colors;
  const isDark = theme.mode === "dark";
  const page = c.pageBackground;

  return {
    bodyBackground: `${asLayer(c.profileBackground)}, ${page}`,
    coverBackground: `${asLayer(c.accentSoft)}, ${page}`,
    primaryText: c.primaryText,
    secondaryText: c.secondaryText,
    mutedText: c.mutedText,
    accent: c.accent,
    border: c.border,
    chipBackground: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.05)",
    headingFont: theme.typography.headingFontFamily || theme.typography.fontFamily || "var(--font-display)",
    bodyFont: theme.typography.fontFamily || "var(--font-sans)",
    headingWeight: theme.typography.headingWeight || "700",
    radius: Math.min(28, Math.max(16, parseInt(theme.effects.radius || "20", 10) || 20)),
    isDark,
  };
}

export function resolveCardAppearance(presetId: string, currentTheme: ThemeMeta): CardAppearance {
  if (!presetId || presetId === "profile") {
    return deriveCardAppearance(currentTheme);
  }
  const preset = CARD_THEME_PRESETS.find((p) => p.id === presetId);
  return preset ? preset.appearance : deriveCardAppearance(currentTheme);
}

type ImageState = { src: string | null; ready: boolean };

/**
 * Converts an image URL into a same-origin data URL so the card can be exported
 * (the CSP blocks html-to-image from fetching cross-origin images). Resolves to
 * `null` when the image is missing or can't be read, so callers fall back cleanly.
 */
export function useExportableImage(url: string | null | undefined, maxSize: number): ImageState {
  const [state, setState] = useState<ImageState & { for: string | null }>({ for: null, src: null, ready: !url });

  useEffect(() => {
    if (!url) return;
    if (url.startsWith("data:")) {
      setState({ for: url, src: url, ready: true });
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      if (cancelled) return;
      try {
        const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setState({ for: url, src: canvas.toDataURL("image/jpeg", 0.92), ready: true });
      } catch {
        // Tainted canvas: the host doesn't allow CORS reads.
        setState({ for: url, src: null, ready: true });
      }
    };
    img.onerror = () => {
      if (!cancelled) setState({ for: url, src: null, ready: true });
    };
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [url, maxSize]);

  if (!url) return { src: null, ready: true };
  if (state.for !== url) return { src: null, ready: false };
  return { src: state.src, ready: state.ready };
}
