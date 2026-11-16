/* eslint-disable @typescript-eslint/no-explicit-any -- section payloads are the endpoints' own JSON */
// ── Limited preview (plan / free trial ended) ────────────────────────────

/** Items each section shows on a limited profile; one blurred placeholder hints at the rest. */
export const PREVIEW_ITEMS = 2;

type Json = Record<string, any>;

/** The section's payload object (endpoints answer either { data: {...} } or the fields at the top level). */
function payload(section: unknown): Json | null {
  if (!section || typeof section !== "object") return null;
  const s = section as Json;
  return s.data && typeof s.data === "object" ? s.data : s;
}

/** Keeps the first PREVIEW_ITEMS of `obj[key]` (after `keep`), returns how many were hidden. */
function trimList(obj: Json | null, key: string, keep: (item: any) => boolean = () => true): number {
  if (!obj || !Array.isArray(obj[key])) return 0;
  const visible = (obj[key] as any[]).filter(keep);
  obj[key] = visible.slice(0, PREVIEW_ITEMS);
  return Math.max(0, visible.length - PREVIEW_ITEMS);
}

/**
 * Cuts every list down to a 2-item preview on the server, so the hidden items never reach the
 * browser (not in the HTML, not in this JSON). The client shows one blurred placeholder per
 * section using the `access.locked` counts. Episode details are removed too: series detail pages
 * don't open on a limited profile.
 */
export function trimToPreview(body: Record<string, unknown>) {
  const locked: Record<string, number> = {};

  const series = payload(body.series);
  locked.series = trimList(series, "series");
  for (const s of (series?.series as any[]) || []) {
    for (const season of s.seasons || []) {
      season.episodes = (season.episodes || []).map((ep: any) => ({
        id: ep.id,
        episodeNumber: ep.episodeNumber,
        title: "",
        platform: ep.platform,
        externalUrl: "",
        thumbnailDataUrl: null,
        description: "",
      }));
    }
  }

  const links = payload(body.links);
  locked.links = trimList(links, "links", (l) => l?.isEnabled !== false);
  for (const l of (links?.links as any[]) || []) {
    if (Array.isArray(l.items)) l.items = l.items.filter((it: any) => it?.isEnabled !== false).slice(0, PREVIEW_ITEMS);
  }

  locked.products = trimList(payload(body.products), "products");

  const mediakit = payload(body.mediakit);
  locked.packages = trimList(mediakit, "packages", (p) => p?.isActive !== false);
  if (mediakit?.settings && Array.isArray(mediakit.settings.pastBrands)) {
    mediakit.settings.pastBrands = mediakit.settings.pastBrands.slice(0, PREVIEW_ITEMS);
  }

  locked.reviews = trimList(payload(body.reviews), "reviews");
  locked.team = trimList(payload(body.team), "members", (m) => m?.isActive !== false);
  locked.setup = trimList(payload(body.setup), "items", (i) => i?.isActive !== false);
  locked.brands = trimList(payload(body.brands), "brands", (b) => b?.isActive !== false);
  locked.collaborations = trimList(payload(body.collaborations), "collaborations");

  // "More of Me": extra (non-primary) accounts + other platforms share one preview.
  const socials = payload(body.socials);
  let hiddenMore = 0;
  if (socials && Array.isArray(socials.socials)) {
    const primary = socials.socials.filter((a: any) => a?.isPrimary || a?.is_primary);
    const extra = socials.socials.filter((a: any) => !(a?.isPrimary || a?.is_primary));
    socials.socials = [...primary, ...extra.slice(0, PREVIEW_ITEMS)];
    hiddenMore += Math.max(0, extra.length - PREVIEW_ITEMS);
  }
  const others = payload(body.otherSocials);
  if (others && Array.isArray(others.otherSocials)) {
    const active = others.otherSocials.filter((o: any) => o?.isActive !== false);
    const room = Math.max(0, PREVIEW_ITEMS - Math.min(PREVIEW_ITEMS, ((socials?.socials as any[]) || []).filter((a: any) => !(a?.isPrimary || a?.is_primary)).length));
    others.otherSocials = active.slice(0, room);
    hiddenMore += Math.max(0, active.length - room);
  }
  locked.moreOfMe = hiddenMore;

  body.access = { level: "limited", previewItems: PREVIEW_ITEMS, locked };
}
