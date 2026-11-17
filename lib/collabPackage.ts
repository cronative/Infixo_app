/**
 * Collaboration package model shared by the dashboard form, the API (validation)
 * and the public media kit / profile (display). No React here.
 */

export type CollabType = "paid" | "barter" | "hybrid";
export type PackagePlatform = "instagram" | "youtube" | "facebook";

export interface PackageDeliverableItem {
  id: string;
  platform: PackagePlatform;
  /** e.g. "Reel", "Story", "Dedicated Video". */
  type: string;
  qty: number;
  /** e.g. "30–60 sec" (video types only). */
  duration?: string;
  tagging?: boolean;
  collabPost?: boolean;
  link?: boolean;
  notes?: string;
}

export interface PackageRequirements {
  productProvided?: boolean;
  briefRequired?: boolean;
  visitRequired?: boolean;
  shipping?: string;
  location?: string;
  conditions?: string;
}

export interface PackageDetails {
  collabType: CollabType;
  items: PackageDeliverableItem[];
  inclusions: string[];
  priceVisibility: "show" | "quote";
  barterDetails?: string;
  gst?: "included" | "extra" | "na";
  travel?: "included" | "extra" | "not_required";
  extraCharges?: string;
  /** "0" | "1" | "2" | "3" or a custom text. */
  revisions?: string;
  languages?: string[];
  usageRights?: "organic" | "paid_ads" | "custom";
  usageDuration?: string;
  /** Empty = no exclusivity; otherwise the duration, e.g. "30 days". */
  exclusivity?: string;
  postRetention?: string;
  requirements?: PackageRequirements;
}

export const COLLAB_TYPES: { value: CollabType; label: string; short: string }[] = [
  { value: "paid", label: "Paid collaboration", short: "Paid" },
  { value: "barter", label: "Barter / product exchange", short: "Barter" },
  { value: "hybrid", label: "Hybrid (paid + barter)", short: "Paid + barter" },
];

export const PACKAGE_PLATFORMS: { value: PackagePlatform; label: string; types: string[] }[] = [
  { value: "instagram", label: "Instagram", types: ["Reel", "Story", "Static Post", "Carousel", "Live Session"] },
  { value: "youtube", label: "YouTube", types: ["Dedicated Video", "Video Integration", "YouTube Short", "Community Post", "Live Stream"] },
  { value: "facebook", label: "Facebook", types: ["Reel", "Feed Post", "Story", "Video", "Live Session"] },
];

/** Deliverable types that have a video length. */
export const VIDEO_TYPES = new Set(["Reel", "Live Session", "Dedicated Video", "Video Integration", "YouTube Short", "Live Stream", "Video"]);
/** Where each per-deliverable option makes sense. */
export const supportsCollabPost = (p: PackagePlatform, type: string) =>
  p === "instagram" && ["Reel", "Static Post", "Carousel"].includes(type);
export const supportsLink = (p: PackagePlatform, type: string) =>
  ["Story", "Dedicated Video", "Video Integration", "Community Post", "Feed Post", "Video"].includes(type) && !(p === "youtube" && type === "YouTube Short");

export const PACKAGE_INCLUSIONS = [
  "Brand Mention",
  "Brand Account Tagging",
  "Collaboration Post",
  "Product Demonstration",
  "Product Review",
  "Story Link Sticker",
  "Script Writing",
  "Voiceover",
  "Video Editing",
  "Captions/Subtitles",
  "On-location Visit",
  "Raw Footage",
  "Performance Report",
];

export const CONTENT_LANGUAGES = ["Hindi", "English", "Hinglish", "Gujarati", "Marathi", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Punjabi"];
export const USAGE_RIGHTS: { value: NonNullable<PackageDetails["usageRights"]>; label: string }[] = [
  { value: "organic", label: "Organic reposting" },
  { value: "paid_ads", label: "Paid advertising" },
  { value: "custom", label: "Custom agreement" },
];
export const USAGE_DURATIONS = ["30 days", "90 days", "1 year", "Unlimited"];
export const GST_OPTIONS: { value: NonNullable<PackageDetails["gst"]>; label: string }[] = [
  { value: "included", label: "Included" },
  { value: "extra", label: "Extra" },
  { value: "na", label: "Not applicable" },
];
export const TRAVEL_OPTIONS: { value: NonNullable<PackageDetails["travel"]>; label: string }[] = [
  { value: "included", label: "Included" },
  { value: "extra", label: "Extra" },
  { value: "not_required", label: "Not required" },
];

export const platformLabel = (p: PackagePlatform) => PACKAGE_PLATFORMS.find((x) => x.value === p)?.label || p;
export const collabTypeShort = (t?: CollabType) => COLLAB_TYPES.find((x) => x.value === t)?.short || "Paid";

/** "1× Instagram Reel (30–60 sec)" for each deliverable. */
export function describeItem(item: PackageDeliverableItem): string {
  const label = item.type.toLowerCase().startsWith(platformLabel(item.platform).toLowerCase())
    ? item.type
    : `${platformLabel(item.platform)} ${item.type}`;
  const plural =
    item.qty <= 1 || /s$/i.test(label) ? label : /[^aeiou]y$/i.test(label) ? `${label.slice(0, -1)}ies` : `${label}s`;
  return `${item.qty}× ${plural}${item.duration ? ` (${item.duration})` : ""}`;
}

/** Platforms used by the deliverables, in a fixed order. */
export function packagePlatforms(items: PackageDeliverableItem[]): PackagePlatform[] {
  return PACKAGE_PLATFORMS.map((p) => p.value).filter((p) => items.some((i) => i.platform === p));
}

/** "Instagram + Facebook" (stored in the legacy `platform` column). */
export function platformsSummary(items: PackageDeliverableItem[]): string {
  const ps = packagePlatforms(items);
  return ps.length === 0 ? "Multi-Platform" : ps.map(platformLabel).join(" + ");
}

export const revisionsLabel = (r?: string) =>
  !r ? "" : /^\d+$/.test(r) ? `${r} ${r === "1" ? "revision" : "revisions"}` : r;

// ── Validation (server + client) ───────────────────────────────

const clip = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[]): T | undefined =>
  allowed.includes(v as T) ? (v as T) : undefined;

/** Trims, clips and drops unknown values; returns null when nothing usable is set. */
export function sanitizePackageDetails(raw: unknown): PackageDetails | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, any>;
  const platforms = PACKAGE_PLATFORMS.map((p) => p.value);
  const items: PackageDeliverableItem[] = Array.isArray(r.items)
    ? r.items
        .map((it: any, i: number): PackageDeliverableItem | null => {
          const platform = oneOf(it?.platform, platforms);
          const type = clip(it?.type, 40);
          if (!platform || !type) return null;
          return {
            id: clip(it?.id, 40) || `d${i}`,
            platform,
            type,
            qty: Math.min(50, Math.max(1, Math.round(Number(it?.qty) || 1))),
            duration: clip(it?.duration, 30) || undefined,
            tagging: it?.tagging === true || undefined,
            collabPost: it?.collabPost === true || undefined,
            link: it?.link === true || undefined,
            notes: clip(it?.notes, 160) || undefined,
          };
        })
        .filter(Boolean)
        .slice(0, 15) as PackageDeliverableItem[]
    : [];
  const req = r.requirements && typeof r.requirements === "object" ? r.requirements : {};
  const requirements: PackageRequirements = {
    productProvided: req.productProvided === true || undefined,
    briefRequired: req.briefRequired === true || undefined,
    visitRequired: req.visitRequired === true || undefined,
    shipping: clip(req.shipping, 200) || undefined,
    location: clip(req.location, 200) || undefined,
    conditions: clip(req.conditions, 300) || undefined,
  };
  const hasReq = Object.values(requirements).some(Boolean);
  return {
    collabType: oneOf(r.collabType, ["paid", "barter", "hybrid"] as const) || "paid",
    items,
    inclusions: Array.isArray(r.inclusions)
      ? Array.from(new Set(r.inclusions.map((x: unknown) => clip(x, 40)).filter(Boolean))).slice(0, 20) as string[]
      : [],
    priceVisibility: r.priceVisibility === "quote" ? "quote" : "show",
    barterDetails: clip(r.barterDetails, 300) || undefined,
    gst: oneOf(r.gst, ["included", "extra", "na"] as const),
    travel: oneOf(r.travel, ["included", "extra", "not_required"] as const),
    extraCharges: clip(r.extraCharges, 200) || undefined,
    revisions: clip(r.revisions, 40) || undefined,
    languages: Array.isArray(r.languages)
      ? Array.from(new Set(r.languages.map((x: unknown) => clip(x, 30)).filter(Boolean))).slice(0, 10) as string[]
      : undefined,
    usageRights: oneOf(r.usageRights, ["organic", "paid_ads", "custom"] as const),
    usageDuration: clip(r.usageDuration, 40) || undefined,
    exclusivity: clip(r.exclusivity, 40) || undefined,
    postRetention: clip(r.postRetention, 40) || undefined,
    requirements: hasReq ? requirements : undefined,
  };
}

/**
 * Short list line for a package row: "1 Reel + 2 Stories + 1 Facebook Reel".
 * The first platform's items drop the platform name; the others keep it.
 */
export function shortItemsSummary(items: PackageDeliverableItem[]): string {
  if (!items.length) return "";
  const primary = items[0].platform;
  return items
    .map((it) => {
      const plural = it.qty > 1 && !/s$/i.test(it.type) ? (/[^aeiou]y$/i.test(it.type) ? `${it.type.slice(0, -1)}ies` : `${it.type}s`) : it.type;
      const name = it.platform === primary || it.type.toLowerCase().startsWith(platformLabel(it.platform).toLowerCase()) ? plural : `${platformLabel(it.platform)} ${plural}`;
      return `${it.qty} ${name}`;
    })
    .join(" + ");
}
