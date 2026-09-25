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
  EXPERT_DEMO_PRODUCTS,
  EXPERT_DEMO_THEME,
} from "@/data/expertDemoCreator";

export default function DemoCreatorProductsPage() {
  const { showToast } = useToast();
  const theme = EXPERT_DEMO_THEME;
  const totalAudience = SocialService.calculateTotalAudience(EXPERT_DEMO_SOCIALS);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = `${EXPERT_DEMO_PROFILE.displayName} (@${EXPERT_DEMO_PROFILE.username}) — Recommended Products & Shop | Inflixo`;
    }
  }, []);

  async function handleShare() {
    const fullUrl =
      typeof window !== "undefined"
        ? window.location.href
        : "https://inflixo.com/demo_creator/products";

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${EXPERT_DEMO_PROFILE.displayName}'s Recommended Products on Inflixo`,
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
      showToast("Product listing link copied! ✨");
    } else {
      showToast("Couldn't copy link", "error");
    }
  }

  return (
    <CreatorPublicShell themeKey={theme}>
      <ThemeCard
        themeKey={theme}
        profile={EXPERT_DEMO_PROFILE}
        socials={EXPERT_DEMO_SOCIALS}
        series={[]}
        products={EXPERT_DEMO_PRODUCTS}
        customLinks={[]}
        mediaKitPackages={[]}
        reviews={[]}
        totalAudience={totalAudience}
        variant="full"
        containedScroll={true}
        productsOnlyMode={true}
        pageHeader={{ pageLabel: "Shop", backHref: "/demo_creator", backLabel: "Back to profile" }}
        onShare={handleShare}
      />
    </CreatorPublicShell>
  );
}
