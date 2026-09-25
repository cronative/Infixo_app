import type { CreatorProduct } from "@/types";
import {
  CreatorProfile,
  SocialAccounts,
  Series,
  CustomLink,
  CreatorReview,
  MediaKitPackage,
  MediaKitSettings,
  CreatorTeam,
  TeamMember,
  CreatorBrand,
  CreatorCollaboration,
  OtherSocialAccount,
  CreatorProfileSection,
  CreatorSetupItem,
} from "@/types";

export interface ThemeCardProps {
  profile: CreatorProfile;
  socials: SocialAccounts;
  series: Series[];
  products?: CreatorProduct[];
  customLinks?: CustomLink[];
  mediaKitPackages?: MediaKitPackage[];
  mediaKitSettings?: MediaKitSettings;
  reviews?: CreatorReview[];
  team?: { team?: CreatorTeam | null; members: TeamMember[] };
  brands?: CreatorBrand[];
  collaborations?: CreatorCollaboration[];
  setupItems?: CreatorSetupItem[];
  otherSocials?: OtherSocialAccount[];
  sections?: CreatorProfileSection[];
  totalAudience: number;
  /** Compact renders a smaller preview card; full renders the public-profile-scale layout. */
  variant?: "compact" | "full";
  containedScroll?: boolean;
  seriesOpenMode?: "internal" | "page";
  seriesPreviewLimit?: number;
  allSeriesHref?: string;
  seriesOnlyMode?: boolean;
  productsPreviewLimit?: number;
  allProductsHref?: string;
  productsOnlyMode?: boolean;
  reviewsPreviewLimit?: number;
  allReviewsHref?: string;
  reviewsOnlyMode?: boolean;
  pageHeader?: { pageLabel: string; backHref: string; backLabel: string };
  onShare?: () => void;
}
