/**
 * Short-lived cache of generated media kit PDFs (per username).
 * Cleared whenever media kit data is saved, so a download after an edit is always fresh.
 */
interface CachedPdf {
  buffer: Uint8Array;
  expiresAt: number;
}

const TTL_MS = 5 * 60 * 1000;
const g = globalThis as typeof globalThis & { __inflixoPdfCache?: Map<string, CachedPdf> };
const cache = (g.__inflixoPdfCache ??= new Map<string, CachedPdf>());

// Development: always render fresh, so code changes show up in the very next download.
const CACHE_ENABLED = process.env.NODE_ENV === "production";

export function getCachedMediaKitPdf(username: string): Uint8Array | null {
  if (!CACHE_ENABLED) return null;
  const hit = cache.get(username);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(username);
    return null;
  }
  return hit.buffer;
}

export function setCachedMediaKitPdf(username: string, buffer: Uint8Array) {
  if (!CACHE_ENABLED) return;
  cache.set(username, { buffer, expiresAt: Date.now() + TTL_MS });
}

/** Call after any media kit save (settings, packages, collaborations). */
export function invalidateMediaKitPdfs() {
  cache.clear();
}
