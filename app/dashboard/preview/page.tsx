"use client";

import { useCreator } from "@/contexts/CreatorContext";
import { ThemeCard } from "@/themes/registry";
import { THEME_PAGE_BACKGROUNDS } from "@/services/ThemeService";

export default function DashboardPreviewPage() {
  const { profile, socials, series, totalAudience, theme } = useCreator();

  const pageBgStyle = THEME_PAGE_BACKGROUNDS[theme] || THEME_PAGE_BACKGROUNDS["minimal-white"];

  return (
    <div className="w-full px-3 sm:px-8 py-4 sm:py-8">
      {/* Clean Full-Width Theme Ambient Profile Preview Wrapper */}
      <div className={`w-full rounded-3xl p-4 sm:p-8 transition-colors duration-300 shadow-sm ${pageBgStyle}`}>
        <div className="w-full max-w-4xl mx-auto">
          <ThemeCard
            themeKey={theme}
            profile={profile}
            socials={socials}
            series={series}
            totalAudience={totalAudience}
            variant="full"
          />
        </div>
      </div>
    </div>
  );
}
