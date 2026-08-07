import { CreatorProfile, SocialAccounts, Series } from "@/types";

export interface ThemeCardProps {
  profile: CreatorProfile;
  socials: SocialAccounts;
  series: Series[];
  totalAudience: number;
  /** Compact renders a smaller preview card; full renders the public-profile-scale layout. */
  variant?: "compact" | "full";
}
