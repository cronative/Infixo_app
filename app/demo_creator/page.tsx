"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  EXPERT_DEMO_PRODUCTS,
  EXPERT_DEMO_SETUP_ITEMS,
} from "@/data/expertDemoCreator";

function DemoCreatorContent() {
  const searchParams = useSearchParams();
  const rawTab = searchParams?.get("tab");
  const initialTab =
    rawTab === "series" || rawTab === "watch" ? "watch" :
    rawTab === "links" || rawTab === "explore" ? "links" :
    rawTab === "shop" || rawTab === "products" ? "shop" :
    rawTab === "setup" || rawTab === "about" || rawTab === "fanbase" ? "about" :
    rawTab === "reviews" || rawTab === "work" ? "work" :
    undefined;
  const rawTheme = searchParams?.get("theme") as any;
  const theme = rawTheme || EXPERT_DEMO_THEME;
  const { showToast } = useToast();
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
    <CreatorPublicShell themeKey={theme} fixedViewport={true}>
        {/* Main Theme Profile Card with Navigation Tabs layout for Series, My Links, My Shop, Reviews, Work */}
        <ThemeCard
          themeKey={theme}
          profile={EXPERT_DEMO_PROFILE}
          socials={EXPERT_DEMO_SOCIALS}
          series={EXPERT_DEMO_SERIES}
          products={EXPERT_DEMO_PRODUCTS}
          setupItems={EXPERT_DEMO_SETUP_ITEMS}
          customLinks={EXPERT_DEMO_CUSTOM_LINKS}
          mediaKitPackages={EXPERT_DEMO_GIGS}
          mediaKitSettings={{
            whatsappNumber: "+91 98765 43210",
            sponsorEmail: "devom@inflixo.com",
            acceptingSponsors: true,
          }}
          reviews={EXPERT_DEMO_REVIEWS}
          totalAudience={totalAudience}
          variant="full"
          containedScroll={false}
          layoutMode="tabs"
          initialTab={initialTab}
          seriesOpenMode="page"
          seriesPreviewLimit={5}
          allSeriesHref="/demo_creator/series"
          productsPreviewLimit={9}
          allProductsHref="/demo_creator/products"
        />
    </CreatorPublicShell>
  );
}

export default function DemoCreatorPage() {
  return (
    <Suspense fallback={null}>
      <DemoCreatorContent />
    </Suspense>
  );
}
