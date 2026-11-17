/**
 * Shared class strings and colour tokens for the public creator pages.
 * Theme tokens only (no hard-coded colours), 5px radius, no shadows.
 */

/** Optional per-theme colour overrides passed down from the profile card. */
export interface SectionColors {
  primary?: string;
  secondary?: string;
  muted?: string;
  headingFont?: string;
}

/** Bordered 5px card on the theme card surface; clips its rows. */
export const SECTION_CARD = "overflow-hidden rounded-[5px] border border-(--surface-border) bg-(--card-bg) text-left";
/** A body row: 12px 16px padding, ≥44px tap height. */
export const SECTION_ROW = "min-h-11 px-4 py-3";
/** Row hover: accent @ 4%. */
export const SECTION_ROW_HOVER = "transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_4%,transparent)]";

/** Section header: soft accent tint + accent text (the "Work with me" pill look, readable in every theme). */
export const SECTION_BG = "var(--accent-soft)";
export const SECTION_FG = "var(--accent-text)";
/** Header divider, count pill border and section frame. */
export const SECTION_LINE = "color-mix(in srgb, var(--accent-text) 30%, transparent)";

/** Section footer "View all" bar: a lighter tint of the header. */
export const SECTION_FOOTER_CTA =
  "flex h-11 w-full items-center justify-center gap-1.5 rounded-t-none! rounded-b-[5px]! border-t border-[color-mix(in_srgb,var(--accent-text)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent-soft)_40%,var(--card-bg))] text-xs sm:text-[13px] font-semibold text-(--accent-text) transition-colors hover:bg-(--accent-soft) cursor-pointer";
/** Boxed "View all" button inside the section padding (My Series). */
export const BOXED_FOOTER_CTA =
  "flex h-11 w-full items-center justify-center gap-2 rounded-[5px] border border-[color-mix(in_srgb,var(--accent-text)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent-soft)_40%,var(--card-bg))] text-[14px] font-semibold text-(--accent-text) transition-colors hover:bg-(--accent-soft) cursor-pointer";
/** Tabs layout footer: plain accent text bar (no tint). */
export const PLAIN_FOOTER_CTA =
  "flex h-11 w-full items-center justify-center gap-1.5 text-xs sm:text-[13px] font-semibold text-(--accent-text) hover:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)] transition-colors cursor-pointer";

/** One content item as its own white card (white on light themes, card colour on dark ones). */
export const CARD_ITEM = "rounded-[5px] border border-(--surface-border) bg-[var(--header-bg,var(--card-bg))]";
/** Hover for a linked CARD_ITEM. */
export const CARD_ITEM_HOVER =
  "transition-colors hover:border-[color-mix(in_srgb,var(--accent-text)_35%,var(--surface-border))] hover:bg-[color-mix(in_srgb,var(--accent)_3%,var(--header-bg,var(--card-bg)))]";
/** Body of a section whose items are separate cards. */
export const CARD_LIST = "space-y-2 p-2.5";

/** Popover frame colour (arrow + panel border). */
export const POPOVER_LINE = "border-[color-mix(in_srgb,var(--accent-text)_45%,transparent)]";
