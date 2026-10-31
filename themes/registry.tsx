import { ThemeKey } from "@/types";
import { ThemeCardProps } from "@/themes/types";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { PremiumProfileLayout } from "@/components/public/PremiumProfileLayout";

export function ThemeCard(props: ThemeCardProps & { themeKey: ThemeKey }) {
  if (props.layoutMode === "premium") {
    return <PremiumProfileLayout {...props} />;
  }

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
    allSocialAccounts,
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
    linksOnlyMode,
    pageHeader,
    onShare,
    layoutMode,
    initialTab,
    hideFooter,
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
      allSocialAccounts={allSocialAccounts}
      totalAudience={totalAudience}
      compact={variant === "compact"}
      variant={variant}
      hideFooter={hideFooter ?? false}
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
      linksOnlyMode={linksOnlyMode}
      pageHeader={pageHeader}
      onShare={onShare}
      layoutMode={layoutMode}
      initialTab={initialTab}
    />
  );
}
