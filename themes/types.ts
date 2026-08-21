import { CreatorProfile, SocialAccounts, Series, CustomLink } from "@/types";

export interface ThemeCardProps {
  profile: CreatorProfile;
  socials: SocialAccounts;
  series: Series[];
  customLinks?: CustomLink[];
  totalAudience: number;
  /** Compact renders a smaller preview card; full renders the public-profile-scale layout. */
  variant?: "compact" | "full";
  onShare?: () => void;
}
