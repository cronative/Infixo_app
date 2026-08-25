"use client";

import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import {
  EXPERT_DEMO_PROFILE,
  EXPERT_DEMO_SOCIALS,
  EXPERT_DEMO_SERIES,
  EXPERT_DEMO_GIGS,
  EXPERT_DEMO_CUSTOM_LINKS,
  EXPERT_DEMO_THEME,
} from "@/data/expertDemoCreator";
import { THEME_PAGE_BACKGROUNDS } from "@/services/ThemeService";

export default function DemoCreatorPage() {
  const pageBgStyle = THEME_PAGE_BACKGROUNDS[EXPERT_DEMO_THEME] || "bg-[#FAF8FA]";

  return (
    <div className={`min-h-dvh transition-colors duration-300 ${pageBgStyle}`}>
      <main className="mx-auto max-w-2xl px-2.5 sm:px-8 py-4 sm:py-10 space-y-5 animate-fade-in-up">
        {/* Main Public Creator Card (Exact Match with Public Profile) */}
        <LivePreviewCard
          profile={EXPERT_DEMO_PROFILE}
          socials={EXPERT_DEMO_SOCIALS}
          series={EXPERT_DEMO_SERIES}
          customLinks={EXPERT_DEMO_CUSTOM_LINKS}
          mediaKitPackages={EXPERT_DEMO_GIGS}
          totalAudience={1345000}
          themeKey={EXPERT_DEMO_THEME}
          variant="full"
        />
      </main>
    </div>
  );
}
