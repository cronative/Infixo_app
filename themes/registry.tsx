import { ThemeKey } from "@/types";
import { ThemeCardProps } from "@/themes/types";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";

export function ThemeCard(props: ThemeCardProps & { themeKey: ThemeKey }) {
  const {
    themeKey,
    profile,
    socials,
    series,
    products,
    customLinks,
    mediaKitPackages,
    mediaKitSettings,
    reviews,
    team,
    brands,
    collaborations,
    setupItems,
    otherSocials,
    sections,
    totalAudience,
    variant,
    containedScroll,
    seriesOpenMode,
    seriesPreviewLimit,
    allSeriesHref,
    seriesOnlyMode,
    productsPreviewLimit,
    allProductsHref,
    productsOnlyMode,
    reviewsPreviewLimit,
    allReviewsHref,
    reviewsOnlyMode,
    pageHeader,
    onShare,
  } = props;
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
      sections={sections}
      totalAudience={totalAudience}
      compact={variant === "compact"}
      themeKey={themeKey}
      containedScroll={containedScroll}
      seriesOpenMode={seriesOpenMode}
      seriesPreviewLimit={seriesPreviewLimit}
      allSeriesHref={allSeriesHref}
      seriesOnlyMode={seriesOnlyMode}
      productsPreviewLimit={productsPreviewLimit}
      allProductsHref={allProductsHref}
      productsOnlyMode={productsOnlyMode}
      reviewsPreviewLimit={reviewsPreviewLimit}
      allReviewsHref={allReviewsHref}
      reviewsOnlyMode={reviewsOnlyMode}
      pageHeader={pageHeader}
      onShare={onShare}
    />
  );
}
