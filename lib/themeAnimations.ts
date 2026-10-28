/** Background animation names a theme can set in --page-anim (rendered by <ThemeBackgroundAnim>). */
export const PAGE_ANIMATIONS = [
  "none", "diyas", "gulal", "rain", "kites", "stars", "waves", "aurora", "confetti", "fireflies", "rangoli",
] as const;

export type PageAnimation = (typeof PAGE_ANIMATIONS)[number];

export function isPageAnimation(value: unknown): value is PageAnimation {
  return typeof value === "string" && (PAGE_ANIMATIONS as readonly string[]).includes(value);
}
