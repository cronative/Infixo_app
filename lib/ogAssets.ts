import { readFile } from "fs/promises";
import path from "path";

let wordmarkWhite: string | null = null;

/** White Inflixo wordmark as a data URL for next/og images (read once per server). */
export async function getWordmarkWhiteDataUrl(): Promise<string | null> {
  if (wordmarkWhite) return wordmarkWhite;
  try {
    const buf = await readFile(path.join(process.cwd(), "public/images/inflixo-wordmark-title-white.png"));
    wordmarkWhite = `data:image/png;base64,${buf.toString("base64")}`;
    return wordmarkWhite;
  } catch {
    return null;
  }
}

/** Fetches a remote/relative image as a data URL (2.5s budget) so a broken avatar never breaks the OG render. */
export async function fetchImageDataUrl(src: string | null | undefined, siteUrl: string): Promise<string | null> {
  if (!src) return null;
  if (src.startsWith("data:")) return src;
  const url = src.startsWith("http") ? src : `${siteUrl}${src.startsWith("/") ? "" : "/"}${src}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "image/jpeg";
    if (!/^image\/(png|jpe?g|gif|webp)/.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
