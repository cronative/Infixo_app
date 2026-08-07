import { ThemeKey } from "@/types";
import { ThemeCardProps } from "@/themes/types";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";

export function ThemeCard(props: ThemeCardProps & { themeKey: ThemeKey }) {
  const { themeKey, profile, socials, series, totalAudience, variant } = props;
  return (
    <LivePreviewCard
      profile={profile}
      socials={socials}
      series={series}
      totalAudience={totalAudience}
      compact={variant === "compact"}
      themeKey={themeKey}
    />
  );
}

