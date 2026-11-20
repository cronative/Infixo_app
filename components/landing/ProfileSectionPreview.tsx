"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { themeTokenStyle } from "@/themes/config";
import { FullBleedSectionsProvider, PlainSectionsProvider } from "@/components/public/ui";
import { WhatBrandsSay, WorkWithMe } from "@/components/public/collab/CollabSections";
import { CrewSection, SetupSection } from "@/components/public/premium/PremiumBlocks";
import { FanbaseByPlatform } from "@/components/public/about/AboutSections";
import { SocialService } from "@/services/SocialService";
import {
  EXPERT_DEMO_BRANDS,
  EXPERT_DEMO_CUSTOM_LINKS,
  EXPERT_DEMO_GIGS,
  EXPERT_DEMO_MEDIA_KIT_SETTINGS,
  EXPERT_DEMO_PRODUCTS,
  EXPERT_DEMO_PROFILE,
  EXPERT_DEMO_REVIEWS,
  EXPERT_DEMO_SERIES,
  EXPERT_DEMO_SETUP_ITEMS,
  EXPERT_DEMO_SOCIALS,
  EXPERT_DEMO_TEAM,
  EXPERT_DEMO_THEME,
} from "@/data/expertDemoCreator";

// The real public profile renderer (series / links / shop pages), loaded on demand.
const LivePreviewCard = dynamic(
  () => import("@/components/onboarding/LivePreviewCard").then((m) => m.LivePreviewCard),
  { ssr: false, loading: () => <div className="h-[420px] animate-pulse rounded-[5px] bg-(--card-bg)" /> }
);

export type ProfileSectionKind = "series" | "links" | "shop" | "packages" | "fans" | "reviews" | "setup" | "crew";

const DEMO = "/demo_creator";
const COLORS = { primary: "var(--text)", secondary: "var(--text-muted)", muted: "var(--text-muted)" };
const totalFans = SocialService.calculateTotalAudience(EXPERT_DEMO_SOCIALS);

/**
 * One section of the demo creator's real public profile, for the landing page.
 * Uses the same components, theme (Gulab) and section wrappers as /demo_creator,
 * so the landing previews always match the live profile.
 */
export function ProfileSectionPreview({ kind, maxHeight = 460 }: { kind: ProfileSectionKind; maxHeight?: number }) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[440px]">
      <div
        aria-label={`Demo profile preview: ${kind}`}
        className="relative overflow-hidden rounded-[5px] border text-left"
        style={{ ...themeTokenStyle(EXPERT_DEMO_THEME), background: "var(--header-bg, var(--card-bg))", borderColor: "var(--surface-border)", maxHeight }}
      >
        {kind === "series" || kind === "links" || kind === "shop" ? <PageSection kind={kind} /> : <Block kind={kind} />}
        {/* Soft fade where the preview is clipped. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
          style={{ background: "linear-gradient(to bottom, transparent, var(--header-bg, var(--card-bg)))" }}
        />
      </div>
      <Link
        href={kind === "packages" ? `${DEMO}/mediakit` : DEMO}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#C21B5C] hover:underline"
      >
        See it on the demo profile <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

/** Series / Links / Shop: the real section page of the demo profile, without its header and footer. */
function PageSection({ kind }: { kind: "series" | "links" | "shop" }) {
  return (
    <LivePreviewCard
      profile={EXPERT_DEMO_PROFILE}
      socials={EXPERT_DEMO_SOCIALS}
      series={EXPERT_DEMO_SERIES}
      products={EXPERT_DEMO_PRODUCTS}
      customLinks={EXPERT_DEMO_CUSTOM_LINKS}
      totalAudience={totalFans}
      themeKey={EXPERT_DEMO_THEME}
      variant="full"
      layoutMode="premium"
      seriesOnlyMode={kind === "series"}
      productsOnlyMode={kind === "shop"}
      linksOnlyMode={kind === "links"}
      hideProfileHeader
      hideFooter
      isInformational
    />
  );
}

/** Profile blocks rendered inside the same wrappers the profile uses (floating section blocks). */
function Block({ kind }: { kind: Exclude<ProfileSectionKind, "series" | "links" | "shop"> }) {
  let content: ReactNode = null;
  if (kind === "packages") {
    content = (
      <WorkWithMe
        packages={EXPERT_DEMO_GIGS.filter((g) => g.isActive !== false)}
        colors={COLORS}
        pricesPlusGst={EXPERT_DEMO_MEDIA_KIT_SETTINGS.commercialTerms?.pricesPlusGst}
        onEnquire={() => {}}
        preview
        previewLimit={1}
        allHref={`${DEMO}/mediakit`}
      />
    );
  } else if (kind === "fans") {
    const s = EXPERT_DEMO_SOCIALS;
    const items = [
      { platform: "instagram", label: "Instagram", handle: s.instagram?.username, count: s.instagram?.followers ?? 0, unit: "followers" },
      { platform: "youtube", label: "YouTube", handle: s.youtube?.username, count: s.youtube?.subscribers ?? 0, unit: "subscribers" },
      { platform: "facebook", label: "Facebook", handle: s.facebook?.username, count: s.facebook?.followers ?? 0, unit: "followers" },
    ].filter((i) => i.count > 0);
    content = <FanbaseByPlatform items={items} total={totalFans} colors={COLORS} />;
  } else if (kind === "reviews") {
    const brands = [
      ...EXPERT_DEMO_BRANDS.filter((b) => b.isActive !== false).map((b) => b.brandName || ""),
      ...(EXPERT_DEMO_MEDIA_KIT_SETTINGS.pastBrands || []).map((b) => b.name || ""),
    ].filter(Boolean);
    content = <WhatBrandsSay reviews={EXPERT_DEMO_REVIEWS} brands={brands} colors={COLORS} limit={2} allHref={`${DEMO}/reviews`} title="Brand Love" />;
  } else if (kind === "setup") {
    content = (
      <SetupSection
        items={EXPERT_DEMO_SETUP_ITEMS.filter((it) => it.isActive !== false && it.name?.trim())}
        colors={COLORS}
        limit={3}
        allHref={`${DEMO}/setup`}
      />
    );
  } else if (kind === "crew") {
    content = (
      <CrewSection
        title={EXPERT_DEMO_TEAM.teamName}
        subtitle={EXPERT_DEMO_TEAM.teamDescription}
        members={(EXPERT_DEMO_TEAM.members || []).filter((m) => m.isActive !== false && m.name?.trim())}
        colors={COLORS}
        limit={3}
        allHref={`${DEMO}/team`}
      />
    );
  }
  return (
    <FullBleedSectionsProvider enabled>
      <PlainSectionsProvider enabled>
        <div className="contents" data-soft-buttons data-listing-plain data-sections-float>
          <div className="p-2 [&_.plain-section]:mt-0">{content}</div>
        </div>
      </PlainSectionsProvider>
    </FullBleedSectionsProvider>
  );
}
