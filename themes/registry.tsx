import { ThemeKey } from "@/types";
import { ThemeCardProps } from "@/themes/types";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";

export function ThemeCard(props: ThemeCardProps & { themeKey: ThemeKey }) {
  const {
    themeKey,
    profile,
    socials,
    series,
    customLinks,
    mediaKitPackages,
    mediaKitSettings,
    reviews,
    team,
    brands,
    collaborations,
    otherSocials,
    sections,
    totalAudience,
    variant,
    containedScroll,
    seriesOpenMode,
    onShare,
  } = props;
  return (
    <LivePreviewCard
      profile={profile}
      socials={socials}
      series={series}
      customLinks={customLinks}
      mediaKitPackages={mediaKitPackages}
      mediaKitSettings={mediaKitSettings}
      reviews={reviews}
      team={team}
      brands={brands}
      collaborations={collaborations}
      otherSocials={otherSocials}
      sections={sections}
      totalAudience={totalAudience}
      compact={variant === "compact"}
      themeKey={themeKey}
      containedScroll={containedScroll}
      seriesOpenMode={seriesOpenMode}
      onShare={onShare}
    />
  );
}
