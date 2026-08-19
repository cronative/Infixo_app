import categoriesData from "./categories.json";

export interface CategoryItem {
  category: string;
  emoji: string;
  subtypes: string[];
}

export const CREATOR_TAXONOMY: CategoryItem[] = categoriesData as CategoryItem[];

export const BROAD_CATEGORIES: string[] = CREATOR_TAXONOMY.map((item) => item.category);

export const CATEGORY_EMOJIS: Record<string, string> = CREATOR_TAXONOMY.reduce((acc, curr) => {
  acc[curr.category] = curr.emoji;
  return acc;
}, {} as Record<string, string>);

export function getCategoryEmoji(catName?: string | null): string {
  if (!catName) return "✨";
  // Handle comma-separated multiple categories (e.g. "Food & Cooking, Travel")
  const firstCat = catName.split(",")[0].trim();
  return CATEGORY_EMOJIS[firstCat] || "✨";
}

export function getSubtypesForCategories(selectedCategories: string[] | string | null | undefined): string[] {
  if (!selectedCategories) return [];
  const catArray = Array.isArray(selectedCategories)
    ? selectedCategories
    : selectedCategories.split(",").map((c) => c.trim()).filter(Boolean);

  const subtypesSet = new Set<string>();
  catArray.forEach((catName) => {
    const found = CREATOR_TAXONOMY.find((item) => item.category.toLowerCase() === catName.toLowerCase());
    if (found && found.subtypes) {
      found.subtypes.forEach((st) => subtypesSet.add(st));
    }
  });

  return Array.from(subtypesSet);
}

export const getProfessionsForCategory = getSubtypesForCategories;

/**
 * Format category display string for public profiles & preview cards.
 * Never displays "Other"! Replaces "Other" with user's customCategory input text.
 */
export function formatProfileCategoryDisplay(
  categoryStr?: string | null,
  customCategoryStr?: string | null
): string {
  if (!categoryStr) return customCategoryStr?.trim() || "";

  const cats = categoryStr.split(",").map((c) => c.trim()).filter(Boolean);
  const formatted = cats.map((c) => {
    if (c.toLowerCase() === "other") {
      return customCategoryStr?.trim() || "";
    }
    return c;
  }).filter(Boolean);

  return formatted.join(" · ");
}
