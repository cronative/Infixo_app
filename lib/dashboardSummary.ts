import type { SocialAccounts } from "@/types";

export interface DashboardSummary {
  socials: { accounts: SocialAccounts; total: number } | null;
  series: { count: number; episodes: number } | null;
  products: number | null;
  links: number | null;
  mediakit: number | null;
  reviews: number | null;
  analytics: { views: number; clicks: number } | null;
  setup: number | null;
  team: number | null;
}
