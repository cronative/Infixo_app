"use client";

import { useEffect } from "react";
import { ThemeCard } from "@/themes/registry";
import { ThemeService, THEME_PAGE_BACKGROUNDS } from "@/services/ThemeService";
import { SocialService } from "@/services/SocialService";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { AmbientAnimation } from "@/components/theme/AmbientAnimation";
import { FocusOverlay } from "@/components/theme/FocusOverlay";
import {
  EXPERT_DEMO_PROFILE,
  EXPERT_DEMO_SOCIALS,
  EXPERT_DEMO_SERIES,
  EXPERT_DEMO_GIGS,
  EXPERT_DEMO_CUSTOM_LINKS,
  EXPERT_DEMO_REVIEWS,
  EXPERT_DEMO_THEME,
} from "@/data/expertDemoCreator";

export default function DemoCreatorPage() {
  const { showToast } = useToast();
  const theme = EXPERT_DEMO_THEME;
  const themeMeta = ThemeService.getThemeMeta(theme);
  const pageBgStyle =
    themeMeta.outerBgClass ||
    THEME_PAGE_BACKGROUNDS[theme] ||
    THEME_PAGE_BACKGROUNDS["minimal-white"];
  const totalAudience = SocialService.calculateTotalAudience(EXPERT_DEMO_SOCIALS);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = `${EXPERT_DEMO_PROFILE.displayName} (@${EXPERT_DEMO_PROFILE.username}) — Official Inflixo Creator Profile`;
    }
  }, []);

  async function handleShare() {
    const fullUrl =
      typeof window !== "undefined"
        ? window.location.href
        : "https://inflixo.com/demo_creator";

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${EXPERT_DEMO_PROFILE.displayName} on Inflixo`,
          url: fullUrl,
        });
      } catch {
        handleCopy(fullUrl);
      }
    } else {
      handleCopy(fullUrl);
    }
  }

  async function handleCopy(url: string) {
    const success = await copyToClipboard(url);
    if (success) {
      showToast("Profile link copied to clipboard! ✨");
    } else {
      showToast("Couldn't copy link", "error");
    }
  }

  return (
    <div
      style={{ backgroundColor: themeMeta.colors.pageBackground }}
      className="relative min-h-dvh flex flex-col transition-colors duration-500"
    >
      {/* 1. Full-screen outer background covering complete viewport */}
      <div
        className={`fixed inset-0 pointer-events-none transition-colors duration-500 z-0 ${pageBgStyle}`}
        style={{ backgroundColor: themeMeta.colors.pageBackground }}
        aria-hidden="true"
      >
        {/* Soft ambient radial lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[650px] bg-gradient-radial from-white/[0.06] to-transparent blur-3xl pointer-events-none" />
      </div>

      {/* 2. Ambient animation if theme is animated */}
      {themeMeta.animation?.type !== "none" && (
        <AmbientAnimation
          type={themeMeta.animation?.type || themeMeta.animationType}
          colors={themeMeta.animation?.colors || themeMeta.particleColors}
          themeKey={themeMeta.key}
        />
      )}

      {/* 3. Theme-aware Focus Overlay Layer */}
      <FocusOverlay overlay={themeMeta.focusOverlay} />

      {/* 4. Centred Creator Profile Surface matching Public Profile layout */}
      <main className="relative z-10 h-dvh min-h-0 flex flex-col mx-auto w-full max-w-[580px] px-4 py-4 overflow-hidden animate-fade-in-up">
        {/* Main Theme Profile Card (seriesOpenMode="internal" keeps series details in popup drawer) */}
        <ThemeCard
          themeKey={theme}
          profile={EXPERT_DEMO_PROFILE}
          socials={EXPERT_DEMO_SOCIALS}
          series={EXPERT_DEMO_SERIES}
          customLinks={EXPERT_DEMO_CUSTOM_LINKS}
          mediaKitPackages={EXPERT_DEMO_GIGS}
          reviews={EXPERT_DEMO_REVIEWS}
          totalAudience={totalAudience}
          variant="full"
          containedScroll={true}
          seriesOpenMode="internal"
          onShare={handleShare}
        />
      </main>
    </div>
  );
}
