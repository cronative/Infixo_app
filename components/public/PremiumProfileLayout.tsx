"use client";

import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { EMPTY_SOCIAL_ACCOUNTS } from "@/types";
import { DEFAULT_THEME_KEY } from "@/lib/themeKeys";
import type {
  CreatorProfile,
  SocialAccounts,
  Series,
  ThemeKey,
  CreatorReview,
  MediaKitPackage,
  MediaKitSettings,
  CreatorSetupItem,
  CreatorProduct,
} from "@/types";

export interface PremiumProfileLayoutProps {
  profile: CreatorProfile;
  themeKey?: ThemeKey;
  socials?: SocialAccounts;
  series?: Series[];
  products?: CreatorProduct[];
  customLinks?: any[];
  mediaKitPackages?: MediaKitPackage[];
  mediaKitSettings?: MediaKitSettings;
  reviews?: CreatorReview[];
  team?: { team?: any; members: any[] };
  brands?: any[];
  collaborations?: any[];
  setupItems?: CreatorSetupItem[];
  otherSocials?: any[];
  allSocialAccounts?: any[];
  totalAudience?: number;
  onShare?: () => void;
  containedScroll?: boolean;
  hideFooter?: boolean;
  allSeriesHref?: string;
  allProductsHref?: string;
  allReviewsHref?: string;
  allLinksHref?: string;
}

/**
 * PremiumProfileLayout
 * 
 * Reuses the exact Tabular Layout components (via LivePreviewCard)
 * arranged in a single vertical page without tabs, as required by
 * the Inflixo design specification.
 */
export function PremiumProfileLayout({
  profile,
  themeKey = DEFAULT_THEME_KEY,
  socials = EMPTY_SOCIAL_ACCOUNTS,
  series = [],
  products = [],
  customLinks = [],
  mediaKitPackages = [],
  mediaKitSettings,
  reviews = [],
  team = { members: [] },
  brands = [],
  collaborations = [],
  setupItems = [],
  otherSocials = [],
  allSocialAccounts = [],
  totalAudience = 0,
  onShare,
  containedScroll = false,
  hideFooter = false,
  allSeriesHref,
  allProductsHref,
  allReviewsHref,
  allLinksHref,
}: PremiumProfileLayoutProps) {
  const cleanHandle = (profile.username || "creator").replace(/^@/, "").toLowerCase();

  return (
    <LivePreviewCard
      profile={profile}
      socials={socials}
      series={series}
      products={products}
      customLinks={customLinks}
      mediaKitPackages={mediaKitPackages}
      mediaKitSettings={mediaKitSettings}
      reviews={reviews}
      team={team}
      brands={brands}
      collaborations={collaborations}
      setupItems={setupItems}
      otherSocials={otherSocials}
      allSocialAccounts={allSocialAccounts}
      totalAudience={totalAudience}
      themeKey={themeKey}
      variant="full"
      containedScroll={containedScroll}
      hideFooter={hideFooter}
      layoutMode="premium"
      seriesOpenMode="page"
      seriesPreviewLimit={3}
      allSeriesHref={allSeriesHref || `/${cleanHandle}/series`}
      productsPreviewLimit={3}
      allProductsHref={allProductsHref || `/${cleanHandle}/products`}
      reviewsPreviewLimit={3}
      allReviewsHref={allReviewsHref || `/${cleanHandle}/reviews`}
      allLinksHref={allLinksHref || `/${cleanHandle}/links`}
      onShare={onShare}
    />
  );
}
