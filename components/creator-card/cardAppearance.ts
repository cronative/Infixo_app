"use client";

import { useEffect, useState } from "react";
import type { ThemeMeta } from "@/types";

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
}

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
