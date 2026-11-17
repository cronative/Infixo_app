"use client";

import { useEffect, useState } from "react";
import { resolveThemeKey } from "@/lib/themeKeys";
import type { ThemeKey } from "@/types";
import { ThemeCard } from "@/themes/registry";
import { SocialService } from "@/services/SocialService";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { CreatorPublicShell } from "@/components/public/CreatorPublicShell";
import {
  EXPERT_DEMO_PROFILE,
  EXPERT_DEMO_SOCIALS,
  EXPERT_DEMO_SERIES,
  EXPERT_DEMO_THEME,
} from "@/data/expertDemoCreator";

export default function DemoCreatorSeriesPage() {
  const { showToast } = useToast();
  // ?theme=<id> previews the demo in another theme (same as /demo_creator); unknown ids fall back to the default.
  const [theme, setTheme] = useState<ThemeKey>(EXPERT_DEMO_THEME);
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("theme");
    if (t) setTheme(resolveThemeKey(t));
  }, []);
  const totalAudience = SocialService.calculateTotalAudience(EXPERT_DEMO_SOCIALS);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = `${EXPERT_DEMO_PROFILE.displayName} (@${EXPERT_DEMO_PROFILE.username}) — Featured Series & Shows | Inflixo`;
    }
  }, []);

  async function handleShare() {
    const fullUrl =
      typeof window !== "undefined"
        ? window.location.href
        : "https://inflixo.com/demo_creator/series";

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${EXPERT_DEMO_PROFILE.displayName}'s Original Series & Shows on Inflixo`,
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
      showToast("Series listing link copied! ✨");
    } else {
      showToast("Couldn't copy link", "error");
    }
  }

  return (
    <CreatorPublicShell themeKey={theme} fixedViewport={true}>
      <ThemeCard
        themeKey={theme}
        profile={EXPERT_DEMO_PROFILE}
        socials={EXPERT_DEMO_SOCIALS}
        series={EXPERT_DEMO_SERIES}
        products={[]}
        customLinks={[]}
        mediaKitPackages={[]}
        reviews={[]}
        totalAudience={totalAudience}
        variant="full"
        containedScroll={false}
        seriesOnlyMode={true}
        seriesOpenMode="page"
        pageHeader={{ pageLabel: "Series", backHref: "/demo_creator", backLabel: "Back to profile" }}
        onShare={handleShare}
      />
    </CreatorPublicShell>
  );
}
