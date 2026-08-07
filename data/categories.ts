import categoriesData from "./categories.json";

export interface TaxonomyGroup {
  category: string;
  professions: string[];
}

export const CREATOR_TAXONOMY: TaxonomyGroup[] = categoriesData as TaxonomyGroup[];

export const BROAD_CATEGORIES: string[] = CREATOR_TAXONOMY.map((group) => group.category);

export function getProfessionsForCategory(category: string | null | undefined): string[] {
  if (!category) return [];
  const found = CREATOR_TAXONOMY.find((group) => group.category.toLowerCase() === category.toLowerCase());
  return found ? found.professions : [];
}
