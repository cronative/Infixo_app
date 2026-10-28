import type {
  SocialAccounts,
  Series,
  MediaKitPackage,
  CustomLink,
  CreatorReview,
  CreatorSetupItem,
  CreatorProduct,
} from "@/types";
import {
  EXPERT_DEMO_SERIES,
  EXPERT_DEMO_GIGS,
} from "@/data/expertDemoCreator";

/**
 * Landing page "live preview" demo content (creator: Devom Shah).
 * Kept separate from the shared expert demo so /demo_creator is unaffected.
 * All brand names below are fictional sample brands.
 */

export const LANDING_DEMO_SOCIALS: SocialAccounts = {
  instagram: {
    username: "@devomshah",
    name: "Devom Shah | Food & Vlogs",
    followers: 820000,
    posts: 142,
    url: "https://instagram.com",
  },
  youtube: {
    username: "@devomshahvlogs",
    channelTitle: "Devom Shah Vlogs",
    subscribers: 410000,
    videos: 68,
    totalViews: 48000000,
    url: "https://youtube.com",
  },
  facebook: {
    username: "devomshahvlogs",
    name: "Devom Shah Official",
    followers: 70000,
    posts: 95,
    url: "https://facebook.com",
  },
  updatedAt: "2026-10-01T00:00:00.000Z",
};

/** Same series as the shared demo, with a clear platform tag on "Street Food Secrets". */
export const LANDING_DEMO_SERIES: Series[] = EXPERT_DEMO_SERIES.map((s) => {
  if (s.id !== "ser_mixed_platform") return s;
  return {
    ...s,
    platform: "Instagram",
    seasons: s.seasons.map((season) => ({
      ...season,
      episodes: season.episodes.map((ep) => ({
        ...ep,
        platform: "Instagram",
        externalUrl:
          ep.episodeNumber === 1
            ? "https://www.instagram.com/reels/abc123/"
            : ep.externalUrl,
      })),
    })),
  };
});

export const LANDING_DEMO_LINKS: CustomLink[] = [
  {
    id: "lp_link_fest",
    title: "🎟️ Mumbai Food Fest, Live Show Tickets (Dec 14)",
    url: "https://inflixo.com/demo_creator",
    isEnabled: true,
    isPinned: true,
  },
  {
    id: "lp_link_tour",
    title: "🗓️ My 2026 Food Tour Schedule",
    url: "https://inflixo.com/demo_creator",
    isEnabled: true,
  },
  {
    id: "lp_link_second",
    title: "📸 Second account: @devom.eats",
    url: "https://instagram.com",
    isEnabled: true,
  },
  {
    id: "lp_link_yt",
    title: "▶️ YouTube channel",
    url: "https://youtube.com",
    isEnabled: true,
  },
  {
    id: "lp_link_wa",
    title: "💬 WhatsApp Channel",
    url: "https://whatsapp.com",
    isEnabled: true,
  },
];

export const LANDING_DEMO_SETUP: CreatorSetupItem[] = [
  {
    id: "lp_setup_camera",
    creatorId: "cr_expert_demo_creator",
    category: "Camera",
    name: "Sony ZV-E10",
    brand: "Sony",
    usedFor: "Main camera for food reels and vlogs",
    linkUrl: "https://amazon.in",
    sortOrder: 0,
    isActive: true,
  },
  {
    id: "lp_setup_mic",
    creatorId: "cr_expert_demo_creator",
    category: "Mic",
    name: "Rode Wireless GO II",
    brand: "Rode",
    usedFor: "Clean audio even in busy street markets",
    linkUrl: "https://amazon.in",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "lp_setup_edit",
    creatorId: "cr_expert_demo_creator",
    category: "Editing",
    name: "CapCut Pro / Premiere Pro",
    brand: "Software",
    usedFor: "Quick reel cuts and long-form vlog edits",
    linkUrl: "https://apple.com",
    sortOrder: 2,
    isActive: true,
  },
];

export const LANDING_DEMO_PRODUCTS: CreatorProduct[] = [
  {
    id: "lp_prod_map",
    name: "Street Food Map of Mumbai (PDF)",
    imageUrl: "/images/demo/product-3.webp",
    pricePaise: 14900,
    productUrl: "https://inflixo.com/demo_creator",
  },
  {
    id: "lp_prod_presets",
    name: "Street Food & Travel Mobile Presets (10 DNG Pack)",
    imageUrl: "/images/demo/product-1.webp",
    pricePaise: 19900,
    productUrl: "https://inflixo.com/demo_creator",
  },
];

export const LANDING_DEMO_REVIEWS: CreatorReview[] = [
  {
    id: "lp_rev_snack",
    creatorId: "cr_expert_demo_creator",
    token: "tok_lp_snack",
    clientName: "Masala Munch Snacks",
    clientEmail: "sample@example.com",
    projectTitle: "Brand Manager · Sample snack brand",
    contentUrl: "https://instagram.com/reels/",
    rating: 5,
    comment:
      "Devom's reel got our new snack in front of the exact audience we wanted. Smooth to work with.",
    isVerified: true,
    status: "approved",
    createdAt: "2026-10-01T00:00:00.000Z",
  },
  {
    id: "lp_rev_cafe",
    creatorId: "cr_expert_demo_creator",
    token: "tok_lp_cafe",
    clientName: "Chai Tapri Co.",
    clientEmail: "sample@example.com",
    projectTitle: "Marketing Lead · Sample cafe brand",
    contentUrl: "https://instagram.com/reels/",
    rating: 5,
    comment:
      "Clear brief, on-time delivery and honest content. Our launch reel felt natural to his audience.",
    isVerified: true,
    status: "approved",
    createdAt: "2026-10-01T00:00:00.000Z",
  },
];

/** Two sample collab packages (reuses the shared demo packages). */
export const LANDING_DEMO_GIGS: MediaKitPackage[] = EXPERT_DEMO_GIGS.slice(0, 2);
