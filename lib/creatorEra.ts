import { SocialAccounts } from "@/types";

export type EraName =
  | "Rising"
  | "Blooming"
  | "Shining"
  | "Glowing"
  | "Growing"
  | "Thriving"
  | "Flourishing"
  | "Inspiring"
  | "Leading"
  | "Legendary";

export type EraStage = "Bronze" | "Silver" | "Gold";

export interface CreatorEraTier {
  era: EraName;
  stage: EraStage;
  badge: string; // e.g. "Shining Gold"
  min: number;
  max: number;
  nextMilestone: number | null;
}

export interface CreatorEra {
  era: EraName;
  stage: EraStage;
  badge: string;
  min: number;
  max: number;
  nextMilestone: number | null;
}

export interface MainEraSummary {
  name: EraName;
  range: string;
  min: number;
  max: number;
  subLevels: { stage: EraStage; badge: string; range: string }[];
}

/**
 * Format fan counts for Creator Eras:
 * 0–999 as is; 1,000+ → "1K", "2.5K", "49.9K"; 100,000+ → "100K", "249.9K";
 * 1M+ → "1M", "2.9M", "9.9M"; 10M+. Max 1 decimal, drop ".0".
 */
export function formatFans(count: number | null | undefined): string {
  if (count === null || count === undefined) return "0";
  const n = Number(count);
  if (isNaN(n) || n <= 0) return "0";
  if (n < 1000) {
    return String(Math.floor(n));
  }
  if (n < 1_000_000) {
    const val = Math.floor((n / 1000) * 10) / 10;
    const str = val.toFixed(1).replace(/\.0$/, "");
    return `${str}K`;
  }
  const val = Math.floor((n / 1_000_000) * 10) / 10;
  const str = val.toFixed(1).replace(/\.0$/, "");
  return `${str}M`;
}

/**
 * Returns gradient CSS string for the metal medal dot:
 * - Bronze: #CD7F32 → #8C5A2B
 * - Silver: #E5E7EB → #9CA3AF
 * - Gold: #FCD34D → #B8860B
 */
export function getMedalGradient(stage?: EraStage | string | null): string {
  switch (stage) {
    case "Bronze":
      return "linear-gradient(135deg, #CD7F32 0%, #8C5A2B 100%)";
    case "Silver":
      return "linear-gradient(135deg, #E5E7EB 0%, #9CA3AF 100%)";
    case "Gold":
    default:
      return "linear-gradient(135deg, #FCD34D 0%, #B8860B 100%)";
  }
}

export const MAIN_ERAS: readonly MainEraSummary[] = [
  {
    name: "Rising",
    range: "0 – 999",
    min: 0,
    max: 999,
    subLevels: [
      { stage: "Bronze", badge: "Rising Bronze Creator", range: "0 – 99" },
      { stage: "Silver", badge: "Rising Silver Creator", range: "100 – 499" },
      { stage: "Gold", badge: "Rising Gold Creator", range: "500 – 999" },
    ],
  },
  {
    name: "Blooming",
    range: "1K – 9.9K",
    min: 1000,
    max: 9999,
    subLevels: [
      { stage: "Bronze", badge: "Blooming Bronze Creator", range: "1K – 2.4K" },
      { stage: "Silver", badge: "Blooming Silver Creator", range: "2.5K – 4.9K" },
      { stage: "Gold", badge: "Blooming Gold Creator", range: "5K – 9.9K" },
    ],
  },
  {
    name: "Shining",
    range: "10K – 49.9K",
    min: 10000,
    max: 49999,
    subLevels: [
      { stage: "Bronze", badge: "Shining Bronze Creator", range: "10K – 24.9K" },
      { stage: "Silver", badge: "Shining Silver Creator", range: "25K – 39.9K" },
      { stage: "Gold", badge: "Shining Gold Creator", range: "40K – 49.9K" },
    ],
  },
  {
    name: "Glowing",
    range: "50K – 99.9K",
    min: 50000,
    max: 99999,
    subLevels: [
      { stage: "Bronze", badge: "Glowing Bronze Creator", range: "50K – 74.9K" },
      { stage: "Silver", badge: "Glowing Silver Creator", range: "75K – 89.9K" },
      { stage: "Gold", badge: "Glowing Gold Creator", range: "90K – 99.9K" },
    ],
  },
  {
    name: "Growing",
    range: "100K – 249.9K",
    min: 100000,
    max: 249999,
    subLevels: [
      { stage: "Bronze", badge: "Growing Bronze Creator", range: "100K – 124.9K" },
      { stage: "Silver", badge: "Growing Silver Creator", range: "125K – 174.9K" },
      { stage: "Gold", badge: "Growing Gold Creator", range: "175K – 249.9K" },
    ],
  },
  {
    name: "Thriving",
    range: "250K – 499.9K",
    min: 250000,
    max: 499999,
    subLevels: [
      { stage: "Bronze", badge: "Thriving Bronze Creator", range: "250K – 299.9K" },
      { stage: "Silver", badge: "Thriving Silver Creator", range: "300K – 399.9K" },
      { stage: "Gold", badge: "Thriving Gold Creator", range: "400K – 499.9K" },
    ],
  },
  {
    name: "Flourishing",
    range: "500K – 999.9K",
    min: 500000,
    max: 999999,
    subLevels: [
      { stage: "Bronze", badge: "Flourishing Bronze Creator", range: "500K – 749.9K" },
      { stage: "Silver", badge: "Flourishing Silver Creator", range: "750K – 899.9K" },
      { stage: "Gold", badge: "Flourishing Gold Creator", range: "900K – 999.9K" },
    ],
  },
  {
    name: "Inspiring",
    range: "1M – 2.9M",
    min: 1000000,
    max: 2999999,
    subLevels: [
      { stage: "Bronze", badge: "Inspiring Bronze Creator", range: "1M – 1.4M" },
      { stage: "Silver", badge: "Inspiring Silver Creator", range: "1.5M – 1.9M" },
      { stage: "Gold", badge: "Inspiring Gold Creator", range: "2M – 2.9M" },
    ],
  },
  {
    name: "Leading",
    range: "3M – 9.9M",
    min: 3000000,
    max: 9999999,
    subLevels: [
      { stage: "Bronze", badge: "Leading Bronze Creator", range: "3M – 4.9M" },
      { stage: "Silver", badge: "Leading Silver Creator", range: "5M – 7.4M" },
      { stage: "Gold", badge: "Leading Gold Creator", range: "7.5M – 9.9M" },
    ],
  },
  {
    name: "Legendary",
    range: "10M+",
    min: 10000000,
    max: Infinity,
    subLevels: [
      { stage: "Bronze", badge: "Legendary Bronze Creator", range: "10M – 19.9M" },
      { stage: "Silver", badge: "Legendary Silver Creator", range: "20M – 49.9M" },
      { stage: "Gold", badge: "Legendary Gold Creator", range: "50M+" },
    ],
  },
];

export const CREATOR_ERA_TIERS: readonly CreatorEraTier[] = [
  // 1. Rising (0–999)
  { era: "Rising", stage: "Bronze", badge: "Rising Bronze Creator", min: 0, max: 99, nextMilestone: 100 },
  { era: "Rising", stage: "Silver", badge: "Rising Silver Creator", min: 100, max: 499, nextMilestone: 500 },
  { era: "Rising", stage: "Gold", badge: "Rising Gold Creator", min: 500, max: 999, nextMilestone: 1000 },

  // 2. Blooming (1K–9,999)
  { era: "Blooming", stage: "Bronze", badge: "Blooming Bronze Creator", min: 1000, max: 2499, nextMilestone: 2500 },
  { era: "Blooming", stage: "Silver", badge: "Blooming Silver Creator", min: 2500, max: 4999, nextMilestone: 5000 },
  { era: "Blooming", stage: "Gold", badge: "Blooming Gold Creator", min: 5000, max: 9999, nextMilestone: 10000 },

  // 3. Shining (10K–49,999)
  { era: "Shining", stage: "Bronze", badge: "Shining Bronze Creator", min: 10000, max: 24999, nextMilestone: 25000 },
  { era: "Shining", stage: "Silver", badge: "Shining Silver Creator", min: 25000, max: 39999, nextMilestone: 40000 },
  { era: "Shining", stage: "Gold", badge: "Shining Gold Creator", min: 40000, max: 49999, nextMilestone: 50000 },

  // 4. Glowing (50K–99,999)
  { era: "Glowing", stage: "Bronze", badge: "Glowing Bronze Creator", min: 50000, max: 74999, nextMilestone: 75000 },
  { era: "Glowing", stage: "Silver", badge: "Glowing Silver Creator", min: 75000, max: 89999, nextMilestone: 90000 },
  { era: "Glowing", stage: "Gold", badge: "Glowing Gold Creator", min: 90000, max: 99999, nextMilestone: 100000 },

  // 5. Growing (100K–249,999)
  { era: "Growing", stage: "Bronze", badge: "Growing Bronze Creator", min: 100000, max: 124999, nextMilestone: 125000 },
  { era: "Growing", stage: "Silver", badge: "Growing Silver Creator", min: 125000, max: 174999, nextMilestone: 175000 },
  { era: "Growing", stage: "Gold", badge: "Growing Gold Creator", min: 175000, max: 249999, nextMilestone: 250000 },

  // 6. Thriving (250K–499,999)
  { era: "Thriving", stage: "Bronze", badge: "Thriving Bronze Creator", min: 250000, max: 299999, nextMilestone: 300000 },
  { era: "Thriving", stage: "Silver", badge: "Thriving Silver Creator", min: 300000, max: 399999, nextMilestone: 400000 },
  { era: "Thriving", stage: "Gold", badge: "Thriving Gold Creator", min: 400000, max: 499999, nextMilestone: 500000 },

  // 7. Flourishing (500K–999,999)
  { era: "Flourishing", stage: "Bronze", badge: "Flourishing Bronze Creator", min: 500000, max: 749999, nextMilestone: 750000 },
  { era: "Flourishing", stage: "Silver", badge: "Flourishing Silver Creator", min: 750000, max: 899999, nextMilestone: 900000 },
  { era: "Flourishing", stage: "Gold", badge: "Flourishing Gold Creator", min: 900000, max: 999999, nextMilestone: 1000000 },

  // 8. Inspiring (1M–2,999,999)
  { era: "Inspiring", stage: "Bronze", badge: "Inspiring Bronze Creator", min: 1000000, max: 1499999, nextMilestone: 1500000 },
  { era: "Inspiring", stage: "Silver", badge: "Inspiring Silver Creator", min: 1500000, max: 1999999, nextMilestone: 2000000 },
  { era: "Inspiring", stage: "Gold", badge: "Inspiring Gold Creator", min: 2000000, max: 2999999, nextMilestone: 3000000 },

  // 9. Leading (3M–9,999,999)
  { era: "Leading", stage: "Bronze", badge: "Leading Bronze Creator", min: 3000000, max: 4999999, nextMilestone: 5000000 },
  { era: "Leading", stage: "Silver", badge: "Leading Silver Creator", min: 5000000, max: 7499999, nextMilestone: 7500000 },
  { era: "Leading", stage: "Gold", badge: "Leading Gold Creator", min: 7500000, max: 9999999, nextMilestone: 10000000 },

  // 10. Legendary (10M+)
  { era: "Legendary", stage: "Bronze", badge: "Legendary Bronze Creator", min: 10000000, max: 19999999, nextMilestone: 20000000 },
  { era: "Legendary", stage: "Silver", badge: "Legendary Silver Creator", min: 20000000, max: 49999999, nextMilestone: 50000000 },
  { era: "Legendary", stage: "Gold", badge: "Legendary Gold Creator", min: 50000000, max: Infinity, nextMilestone: null },
];

/**
 * Returns the creator era milestone information based on total fanbase count.
 * Returns null if count is null, undefined, NaN, or negative.
 */
export function getCreatorEra(totalFanbase: number | null | undefined): CreatorEra | null {
  if (totalFanbase === null || totalFanbase === undefined) return null;
  const count = Number(totalFanbase);
  if (isNaN(count) || count < 0) return null;

  const tier = CREATOR_ERA_TIERS.find((t) => count >= t.min && count <= t.max);
  if (!tier) return null;

  return {
    era: tier.era,
    stage: tier.stage,
    badge: tier.badge,
    min: tier.min,
    max: tier.max,
    nextMilestone: tier.nextMilestone,
  };
}

/**
 * Calculates progress metrics to the next Creator Era sub-level.
 */
export function getEraProgress(fanbase: number | null | undefined) {
  const currentCount = Math.max(0, Number(fanbase) || 0);
  const era = getCreatorEra(currentCount);

  if (!era) {
    return {
      current: currentCount,
      nextMilestone: 100,
      fansNeeded: 100,
      progressPercent: 0,
      nextBadge: "Rising Silver Creator",
    };
  }

  if (era.nextMilestone === null) {
    return {
      current: currentCount,
      nextMilestone: null,
      fansNeeded: 0,
      progressPercent: 100,
      nextBadge: null,
    };
  }

  const fansNeeded = Math.max(0, era.nextMilestone - currentCount);
  const tierSpan = era.nextMilestone - era.min;
  const progressPercent = tierSpan > 0
    ? Math.min(100, Math.max(0, Math.round(((currentCount - era.min) / tierSpan) * 100)))
    : 100;

  const nextTier = CREATOR_ERA_TIERS.find((t) => t.min === era.nextMilestone);

  return {
    current: currentCount,
    nextMilestone: era.nextMilestone,
    fansNeeded,
    progressPercent,
    nextBadge: nextTier?.badge || null,
  };
}

/**
 * Calculates the total fanbase across connected Instagram, YouTube, and Facebook accounts.
 * - Supports 1, 2, or 3 connected platforms.
 * - Total fans & Creator Era = sum of PRIMARY accounts only. Extra accounts are NOT added.
 * - Returns sum of all available valid platform counts.
 * - If no connected platform has a valid count, returns null.
 * - A valid count of zero from a connected platform returns 0 (eligible for Rising Bronze Creator).
 */
export function calculateTotalFanbase(
  socials?: SocialAccounts | any[] | Record<string, any> | null
): number | null {
  if (!socials) return null;

  let validCountFound = false;
  let total = 0;

  if (Array.isArray(socials)) {
    const trackedPlatforms = ["instagram", "youtube", "facebook"];
    for (const record of socials) {
      if (!record || typeof record !== "object") continue;
      const platform = (record.platform || "").toLowerCase().trim();
      if (!trackedPlatforms.includes(platform)) continue;

      // Only PRIMARY accounts count towards total fans and Creator Era!
      const isPrimary =
        record.is_primary !== undefined
          ? Boolean(record.is_primary)
          : record.isPrimary !== undefined
          ? Boolean(record.isPrimary)
          : true;
      if (!isPrimary) continue;

      const rawCount =
        record.follower_count ??
        record.followerCount ??
        record.followers ??
        record.subscribers ??
        record.audience_count ??
        record.audienceCount;

      const handle =
        record.username ||
        record.account_name ||
        record.accountName ||
        record.handle;

      const num = Number(rawCount);
      const isNumValid =
        rawCount !== undefined &&
        rawCount !== null &&
        rawCount !== "" &&
        !isNaN(num) &&
        num >= 0;

      if (handle || record.url || isNumValid) {
        if (isNumValid) {
          total += Math.max(0, Math.floor(num));
          validCountFound = true;
        } else if (handle || record.url) {
          validCountFound = true;
        }
      }
    }
  } else if (typeof socials === "object") {
    // 1. Instagram
    const ig = socials.instagram;
    const isIgConnected = Boolean(
      ig && (
        (ig.username && ig.username.trim() !== "") ||
        (ig.url && ig.url.trim() !== "" && ig.url.trim() !== "#") ||
        (ig.name && ig.name.trim() !== "") ||
        (typeof ig.followers === "number" && ig.followers > 0)
      )
    );
    if (isIgConnected && ig) {
      const raw = ig.followers;
      const num = Number(raw);
      if (raw !== undefined && raw !== null && raw !== "" && !isNaN(num) && num >= 0) {
        total += Math.max(0, Math.floor(num));
        validCountFound = true;
      }
    }

    // 2. YouTube
    const yt = socials.youtube;
    const isYtConnected = Boolean(
      yt && (
        (yt.username && yt.username.trim() !== "") ||
        (yt.url && yt.url.trim() !== "" && yt.url.trim() !== "#") ||
        (yt.channelTitle && yt.channelTitle.trim() !== "") ||
        (typeof yt.subscribers === "number" && yt.subscribers > 0) ||
        (typeof yt.followers === "number" && yt.followers > 0)
      )
    );
    if (isYtConnected && yt) {
      const raw = yt.subscribers ?? yt.followers;
      const num = Number(raw);
      if (raw !== undefined && raw !== null && raw !== "" && !isNaN(num) && num >= 0) {
        total += Math.max(0, Math.floor(num));
        validCountFound = true;
      }
    }

    // 3. Facebook
    const fb = socials.facebook;
    const isFbConnected = Boolean(
      fb && (
        (fb.username && fb.username.trim() !== "") ||
        (fb.url && fb.url.trim() !== "" && fb.url.trim() !== "#") ||
        (fb.name && fb.name.trim() !== "") ||
        (typeof fb.followers === "number" && fb.followers > 0)
      )
    );
    if (isFbConnected && fb) {
      const raw = fb.followers;
      const num = Number(raw);
      if (raw !== undefined && raw !== null && raw !== "" && !isNaN(num) && num >= 0) {
        total += Math.max(0, Math.floor(num));
        validCountFound = true;
      }
    }
  }

  return validCountFound ? total : null;
}
