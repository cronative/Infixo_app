import { CreatorProfile, SocialAccounts, Series, CustomLink, CreatorReview, MediaKitPackage, MediaKitSettings } from "@/types";

export interface ThemeCardProps {
  profile: CreatorProfile;
  socials: SocialAccounts;
  series: Series[];
  customLinks?: CustomLink[];
  mediaKitPackages?: MediaKitPackage[];
  mediaKitSettings?: MediaKitSettings;
  reviews?: CreatorReview[];
  totalAudience: number;
  /** Compact renders a smaller preview card; full renders the public-profile-scale layout. */
  variant?: "compact" | "full";
  onShare?: () => void;
}
