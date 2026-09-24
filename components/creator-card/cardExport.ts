"use client";

import { CARD_EXPORT_PIXEL_RATIO, CARD_HEIGHT, CARD_WIDTH } from "@/components/creator-card/CreatorCard";

const isWebKit = () =>
  typeof navigator !== "undefined" && /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);

/** Renders the card DOM node to a 1080 × 1920 PNG blob. */
export async function renderCardPng(node: HTMLElement): Promise<Blob> {
  // Loaded on demand so the export library isn't part of the page's initial bundle.
  const { getFontEmbedCSS, toBlob } = await import("html-to-image");
  await document.fonts?.ready;
  const fontEmbedCSS = await getFontEmbedCSS(node);
  const options = {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    pixelRatio: CARD_EXPORT_PIXEL_RATIO,
    fontEmbedCSS,
    // The preview is scaled by its parent; make sure the clone never inherits that.
    style: { transform: "none", margin: "0" },
  };
  // WebKit sometimes paints embedded images/fonts only on the second pass.
  if (isWebKit()) await toBlob(node, options);
  const blob = await toBlob(node, options);
  if (!blob) throw new Error("Card render returned no image");
  return blob;
}

export function cardFileName(username: string) {
  return `inflixo-creator-card-${username || "creator"}.png`;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export type ShareResult = "shared" | "cancelled" | "unsupported";

/** Shares the card image through the native share sheet when the platform supports files. */
export async function shareCardFile(blob: Blob, fileName: string, text: string): Promise<ShareResult> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return "unsupported";
  const file = new File([blob], fileName, { type: "image/png" });
  if (!navigator.canShare?.({ files: [file] })) return "unsupported";
  try {
    // The URL goes in `text`: many share targets drop `url` when files are attached.
    await navigator.share({ files: [file], text });
    return "shared";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
    return "unsupported";
  }
}
