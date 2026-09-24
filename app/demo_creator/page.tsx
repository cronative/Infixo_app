"use client";

import { useEffect } from "react";
import { ThemeCard } from "@/themes/registry";
import { SocialService } from "@/services/SocialService";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { CreatorPublicShell } from "@/components/public/CreatorPublicShell";
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
    <CreatorPublicShell themeKey={theme}>
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
    </CreatorPublicShell>
  );
}
