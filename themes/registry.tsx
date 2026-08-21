import { ThemeKey } from "@/types";
import { ThemeCardProps } from "@/themes/types";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";

export function ThemeCard(props: ThemeCardProps & { themeKey: ThemeKey }) {
  const { themeKey, profile, socials, series, customLinks, totalAudience, variant, onShare } = props;
  return (
    <LivePreviewCard
      profile={profile}
      socials={socials}
      series={series}
      customLinks={customLinks}
      totalAudience={totalAudience}
      compact={variant === "compact"}
      themeKey={themeKey}
      onShare={onShare}
    />
  );
}

