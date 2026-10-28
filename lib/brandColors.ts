/**
 * Platform brand colours (logos/badges). These are the platforms' own identity colours,
 * not theme colours, so they live here instead of inside profile widgets.
 * Full class strings so Tailwind generates them.
 */
export const BRAND_BG = {
  instagram: "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
  youtube: "bg-[#FF0000]",
  facebook: "bg-[#1877F2]",
  linkedin: "bg-[#0A66C2]",
  snapchat: "bg-[#FFFC00]",
  spotify: "bg-[#1DB954]",
  twitch: "bg-[#9146FF]",
  pinterest: "bg-[#E60023]",
} as const;

export const BRAND_TEXT = {
  instagram: "text-[#E4405F]",
  youtube: "text-[#FF0000]",
  facebook: "text-[#1877F2]",
} as const;

/** Instagram story ring / gradient avatar border. */
export const BRAND_INSTAGRAM_RING = "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]";
/** Verified tick fill (Meta-style blue). */
export const BRAND_VERIFIED_FILL = "fill-[#1877F2]";
