// ---------------------------------------------------------------------------
// Inflixo — Core Domain Types
// These types define the shape of data used across the app. They are the
// contract between UI components, local services (localStorage-backed today)
// and the future Node.js/MySQL API layer.
// ---------------------------------------------------------------------------

export type CreatorCategory = string;

export const CREATOR_CATEGORIES: string[] = [
  "Entertainment",
  "Filmmaking & Web Series",
  "Technology & AI",
  "Education & Career",
  "Business & Finance",
  "Lifestyle",
  "Gaming & Esports",
  "Health & Fitness",
  "Real Estate & Home",
  "Travel & Adventure",
  "Food & Cooking",
  "Fashion & Beauty",
  "Music & Performing Arts",
  "Sports & Athletics",
  "Photography & Video",
  "DIY & Crafts",
  "News & Media",
  "Podcast & Talk Shows",
  "Art & Design",
  "Motivation & Self Growth",
  "Automobile & EV",
  "Pets & Animals",
  "Parenting & Family",
  "Spirituality & Astrology",
  "Other",
];

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthSession {
  email: string;
  isLoggedIn: boolean;
  loggedInAt: string; // ISO date
  provider: "email" | "google" | "apple";
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export interface CreatorProfile {
  id?: string;
  email?: string;
  photoDataUrl: string | null; // local object URL / base64 preview or uploaded server URL
  displayName: string;
  username: string;
  category: CreatorCategory | null;
  customCategory?: string | null;
  profession?: string | null;
  bio: string;
  city?: string;
  state?: string;
  country?: string;
  isVerified?: boolean;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Social Accounts
// ---------------------------------------------------------------------------

export interface InstagramStats {
  url: string;
  followers: number;
  posts: number;
  username?: string;
  name?: string;
  isVerified?: boolean;
  avatarUrl?: string;
  biography?: string;
  lastSyncedAt?: string;
}

export interface YoutubeStats {
  url: string;
  subscribers: number;
  videos: number;
  totalViews: number;
  username?: string;
  channelTitle?: string;
  isVerified?: boolean;
  avatarUrl?: string;
  description?: string;
  lastSyncedAt?: string;
}

export interface FacebookPageStats {
  url: string;
  followers: number;
  posts: number;
  username?: string;
  name?: string;
  isVerified?: boolean;
  avatarUrl?: string;
  intro?: string;
  lastSyncedAt?: string;
}

export interface SocialAccounts {
  instagram: InstagramStats;
  youtube: YoutubeStats;
  facebook: FacebookPageStats;
  updatedAt: string;
}

export const EMPTY_SOCIAL_ACCOUNTS: SocialAccounts = {
  instagram: { url: "", followers: 0, posts: 0 },
  youtube: { url: "", subscribers: 0, videos: 0, totalViews: 0 },
  facebook: { url: "", followers: 0, posts: 0 },
  updatedAt: new Date().toISOString(),
};

export interface CustomLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  isEnabled?: boolean;
}

export const DEFAULT_CUSTOM_LINKS: CustomLink[] = [
  {
    id: "link_1",
    title: "🎬 Watch Latest Episode",
    url: "https://youtube.com",
    icon: "link",
    isEnabled: true,
  },
  {
    id: "link_2",
    title: "📅 Book 1-on-1 Consultation",
    url: "https://cal.com",
    icon: "calendar",
    isEnabled: true,
  },
];

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

export type ThemeGroup = "light" | "shimmer" | "dark";

export type ThemeKey =
  | "minimal-white"
  | "signature-purple"
  | "pastel-dream"
  | "matcha-cream"
  | "cloud-fluff"
  | "boba-milk"
  | "sakura-pink"
  | "nordic-frost"
  | "sand-linen"
  | "golden-hour"
  | "modern-purple"
  | "midnight"
  | "ocean-blue"
  | "sunset"
  | "forest"
  | "rose-gold"
  | "mono"
  | "neon-pulse"
  | "cyberpunk"
  | "emerald-luxe"
  | "crimson-velvet"
  | "solar-flare"
  | "lavender-haze"
  | "cosmic-galaxy"
  | "tokyo-drift"
  | "retro-synth"
  | "shimmer-gold"
  | "holographic-wave"
  | "aurora-borealis"
  | "electric-cyber"
  | "luminous-pearl"
  | "cosmic-pulse"
  | "sakura-blossom"
  | "sand-dune";

export interface ThemeMeta {
  key: ThemeKey;
  name: string;
  description: string;
  swatch: string[]; // preview colors
  group: ThemeGroup;
  isShimmer?: boolean;
}

// ---------------------------------------------------------------------------
// Series / Seasons / Episodes
// ---------------------------------------------------------------------------

export type EpisodePlatform = "YouTube" | "Instagram" | "Facebook";

export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  thumbnailDataUrl: string | null;
  platform: EpisodePlatform;
  externalUrl: string;
  description: string;
}

export interface Season {
  id: string;
  title: string;
  seasonNumber: number;
  episodes: Episode[];
}

export interface Series {
  id: string;
  title: string;
  posterDataUrl: string | null;
  description: string;
  genre: string;
  language: string;
  seasons: Season[];
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Media Kit & Collaboration Packages
// ---------------------------------------------------------------------------

export interface MediaKitPackage {
  id: string;
  title: string;
  platform: "YouTube" | "Instagram" | "Instagram Bundle" | "Monthly Retainer" | "Facebook" | "Multi-Platform" | string;
  deliverables: string[];
  price: string;
  minPrice?: string;
  maxPrice?: string;
  packageName?: string;
  turnaroundDays: number;
  badge?: string;
  isPopular?: boolean;
  isActive: boolean;
}

export interface MediaKitSettings {
  sponsorEmail?: string;
  whatsappNumber?: string;
  bioHighlight?: string;
  acceptingSponsors: boolean;
  minBudget?: string;
  preferredCategories?: string[];
}

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

export type PlanKey =
  | "early_access"
  | "creator_pro"
  | "creator_VIP"
  | "creator"
  | "pro"
  | "vip"
  | "free"
  | "starter"
  | "unlimited";
export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "trial" | "active" | "expired" | "cancelled";

export interface PlanMeta {
  key: PlanKey;
  name: string;
  badge?: string;
  isPopular?: boolean;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlySavings: number;
  freeTrialDays: number;
  publicProfile: boolean;
  instagram: boolean;
  youtube: boolean;
  facebook: boolean;
  ottSeriesLimit: string; // "5" | "10" | "20" | "Unlimited"
  autoDataRefresh: string; // "Every 24 Hours" | "Every 18 Hours" | "Every 12 Hours" | "Every 3 Hours"
  removeBranding: boolean;
  support: "Standard" | "Priority" | "VIP Dedicated" | string;
}

export interface Subscription {
  planKey: PlanKey;
  planName: string;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  activatedAt: string | null;
}

// ---------------------------------------------------------------------------
// Onboarding progress
// ---------------------------------------------------------------------------

export type OnboardingStep =
  | "profile"
  | "socials"
  | "theme"
  | "series"
  | "subscription"
  | "finish";

export const ONBOARDING_STEPS: { key: OnboardingStep; label: string; path: string }[] = [
  { key: "profile", label: "Profile", path: "/onboarding/profile" },
  { key: "socials", label: "Socials", path: "/onboarding/socials" },
  { key: "theme", label: "Theme", path: "/onboarding/themes" },
  { key: "series", label: "Series", path: "/onboarding/series" },
  { key: "subscription", label: "Subscription", path: "/onboarding/subscription" },
  { key: "finish", label: "Finish", path: "/onboarding/finish" },
];

// ---------------------------------------------------------------------------
// Aggregate creator record (what the public profile page renders)
// ---------------------------------------------------------------------------

export interface CreatorRecord {
  profile: CreatorProfile;
  socials: SocialAccounts;
  theme: ThemeKey;
  series: Series[];
  subscription: Subscription;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}
