// ---------------------------------------------------------------------------
// Inflixo — Core Domain Types
// These types define the shape of data used across the app. They are the
// contract between UI components, local services (localStorage-backed today)
// and the future Node.js/MySQL API layer.
// ---------------------------------------------------------------------------

export type CreatorCategory = string;

export const CREATOR_CATEGORIES: string[] = [
  "Acting & Performance",
  "Animation",
  "Architecture",
  "Art & Creativity",
  "Astrology",
  "Auto & Vehicles",
  "Beauty",
  "Books & Literature",
  "Business",
  "Career & Jobs",
  "Coding & Development",
  "Comedy",
  "Commentary",
  "Crafts",
  "Dance",
  "Design",
  "Digital Marketing",
  "DIY",
  "Documentary",
  "Education",
  "Entertainment",
  "Entrepreneurship",
  "Environment & Sustainability",
  "Events",
  "Family & Parenting",
  "Fashion",
  "Film & Filmmaking",
  "Finance & Investing",
  "Fitness",
  "Food & Cooking",
  "Gaming",
  "Gardening",
  "Health & Wellness",
  "History",
  "Home & Living",
  "Interviews",
  "Kids Content",
  "Languages",
  "Legal",
  "Lifestyle",
  "Live Streaming",
  "Luxury",
  "Marketing & Social Media",
  "Memes",
  "Motivation",
  "Movies & TV",
  "Music",
  "News",
  "Parenting",
  "Personal Development",
  "Pets & Animals",
  "Photography",
  "Podcasts",
  "Politics",
  "Product Reviews",
  "Productivity",
  "Relationships",
  "Reviews & Reactions",
  "Science",
  "Self Growth",
  "Shopping",
  "Short Films",
  "Shorts & Reels",
  "Singing",
  "Skincare",
  "Social Awareness",
  "Spirituality & Devotional",
  "Sports",
  "Stand-up Comedy",
  "Storytelling",
  "Technology & AI",
  "Theatre",
  "Travel",
  "Tutorials & How-to",
  "Vlogs",
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

export interface VisibilitySettings {
  showFanbase: boolean;
  showInstagram: boolean;
  showFacebook: boolean;
  showYoutube: boolean;
  showTwitter?: boolean;
  showLinkedin?: boolean;
  showThreads?: boolean;
  showSnapchat?: boolean;
  showPinterest?: boolean;
  showTwitch?: boolean;
  showSpotify?: boolean;
  showContentCategory: boolean;
  showSeries: boolean;
  showCollabGigs: boolean;
  showReviews: boolean;
  showCustomLinks: boolean;
  showInSearchEngines?: boolean;
}

export const DEFAULT_VISIBILITY_SETTINGS: VisibilitySettings = {
  showFanbase: true,
  showInstagram: true,
  showFacebook: true,
  showYoutube: true,
  showTwitter: true,
  showLinkedin: true,
  showThreads: true,
  showSnapchat: true,
  showPinterest: true,
  showTwitch: true,
  showSpotify: true,
  showContentCategory: true,
  showSeries: true,
  showCollabGigs: true,
  showReviews: true,
  showCustomLinks: true,
  showInSearchEngines: true,
};

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
  themeKey?: ThemeKey;
  theme_key?: string;
  visibilitySettings?: VisibilitySettings;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Social Accounts
// ---------------------------------------------------------------------------

export interface GenericSocialStats {
  url: string;
  followers: number;
  username?: string;
  name?: string;
  isVerified?: boolean;
  avatarUrl?: string;
  enabled?: boolean;
  lastSyncedAt?: string;
}

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
  followers?: number;
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
  twitter?: GenericSocialStats;
  linkedin?: GenericSocialStats;
  threads?: GenericSocialStats;
  snapchat?: GenericSocialStats;
  pinterest?: GenericSocialStats;
  twitch?: GenericSocialStats;
  spotify?: GenericSocialStats;
  updatedAt: string;
}

export const EMPTY_SOCIAL_ACCOUNTS: SocialAccounts = {
  instagram: { url: "", followers: 0, posts: 0 },
  youtube: { url: "", subscribers: 0, videos: 0, totalViews: 0 },
  facebook: { url: "", followers: 0, posts: 0 },
  twitter: { url: "", followers: 0 },
  linkedin: { url: "", followers: 0 },
  threads: { url: "", followers: 0 },
  snapchat: { url: "", followers: 0 },
  pinterest: { url: "", followers: 0 },
  twitch: { url: "", followers: 0 },
  spotify: { url: "", followers: 0 },
  updatedAt: new Date().toISOString(),
};

export interface CustomLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  isEnabled?: boolean;
}

export const DEFAULT_CUSTOM_LINKS: CustomLink[] = [];

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

export type ThemeGroup = "light" | "dark" | "animated";

export type ThemeAnimationType =
  | "none"
  | "floating-particles"
  | "neon-grid"
  | "liquid-aurora"
  | "floating-shapes"
  | "spotlight-stage"
  | "paper-confetti"
  | "sparkles"
  | "round-orbs"
  | "galaxy"
  | "firecrackers";

export type ThemeKey =
  | "minimal-white"
  | "signature-purple"
  | "midnight"
  | "neon-grid"
  | "liquid-aurora"
  | "floating-studio"
  | "spotlight-stage"
  | "creative-paper"
  | "cosmic-purple"
  | "aurora-night"
  | "rose-glow"
  | "ocean-motion"
  | "sunset-studio"
  | "minimal-spark";

export interface ThemeTypography {
  fontFamily?: string;
  headingFontFamily?: string;
  headingWeight?: string;
  letterSpacing?: string;
}

export interface ThemeColors {
  pageBackground: string;
  profileBackground: string;
  cardBackground: string;
  elevatedBackground: string;
  primaryText: string;
  secondaryText: string;
  mutedText: string;
  accent: string;
  accentText: string;
  accentSoft: string;
  accentBorder: string;
  border: string;
  divider: string;
}

export interface ThemeEffects {
  shadow?: string;
  cardShadow?: string;
  glow?: string;
  blur?: string;
  radius?: string;
}

export interface ThemeAnimation {
  type: ThemeAnimationType;
  colors?: string[];
  opacity?: number;
  density?: number;
  speed?: "slow" | "normal";
  enabledOnMobile?: boolean;
}

export interface ThemeFocusOverlay {
  color: string;
  centerOpacity: number;
  edgeOpacity: number;
}

export interface ThemeProfileSurface {
  background?: string;
  border?: string;
  shadow?: string;
  accentGlow?: string;
}

export interface ThemeMeta {
  key: ThemeKey;
  id?: string;
  name: string;
  mode?: "light" | "dark";
  description: string;
  swatch: string[]; // preview colors [bg, accent, text]
  group: ThemeGroup;
  isAnimated?: boolean;
  tag?: string;
  typography: ThemeTypography;
  colors: ThemeColors;
  effects: ThemeEffects;
  animation?: ThemeAnimation;
  focusOverlay?: ThemeFocusOverlay;
  profileSurface?: ThemeProfileSurface;
  // Legacy / Tailwind utility fallback fields
  outerBgClass?: string;
  profileBgClass?: string;
  cardBgClass?: string;
  cardBorderClass?: string;
  primaryTextClass?: string;
  secondaryTextClass?: string;
  accentColor?: string;
  accentSoftClass?: string;
  accentBorderClass?: string;
  animationType?: ThemeAnimationType;
  particleColors?: string[];
}

// ---------------------------------------------------------------------------
// Series / Seasons / Episodes
// ---------------------------------------------------------------------------

export type EpisodePlatform = "YouTube" | "Instagram" | "Facebook" | "Other" | "Web Video" | "X" | "Spotify" | string;

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
  platform?: EpisodePlatform | string;
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
  | "username"
  | "profile"
  | "socials"
  | "theme"
  | "series"
  | "subscription"
  | "finish";

export const ONBOARDING_STEPS: { key: OnboardingStep; label: string; path: string }[] = [
  { key: "username", label: "Username", path: "/onboarding/username" },
  { key: "profile", label: "Profile", path: "/onboarding/profile" },
  { key: "socials", label: "Socials", path: "/onboarding/socials" },
  { key: "subscription", label: "Public Profile", path: "/onboarding/subscription" },
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

// ---------------------------------------------------------------------------
// Creator Reviews & Testimonials
// ---------------------------------------------------------------------------

export type ReviewStatus = "pending_invite" | "pending_approval" | "approved" | "rejected";

export interface CreatorReview {
  id: string;
  creatorId: string;
  token: string;
  clientName: string;
  clientEmail: string;
  clientDesignation?: string;
  projectTitle: string;
  contentUrl?: string;
  rating: number; // 1 to 5 Overall Experience
  ratingContentQuality?: number; // 1 to 5 Content Quality
  ratingProfessionalism?: number; // 1 to 5 Professionalism
  ratingTimelyDelivery?: number; // 1 to 5 Timely Delivery
  comment: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Other / Secondary Social Accounts (Does NOT affect Total Fanbase)
// ---------------------------------------------------------------------------

export interface OtherSocialAccount {
  id: string;
  creatorId: string;
  platform: "instagram" | "youtube" | "facebook" | "twitter" | "linkedin" | "threads" | "snapchat" | "pinterest" | "twitch" | "spotify" | "other";
  username: string;
  url: string;
  label?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Creator Team & Team Members
// ---------------------------------------------------------------------------

export interface TeamMember {
  id: string;
  teamId: string;
  creatorId: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  instagramUrl?: string;
  youtubeUrl?: string;
  facebookUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatorTeam {
  id: string;
  creatorId: string;
  teamName: string;
  teamLogoUrl?: string | null;
  members: TeamMember[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Creator Brands & Ventures
// ---------------------------------------------------------------------------

export interface CreatorBrand {
  id: string;
  creatorId: string;
  brandName: string;
  brandLogoUrl?: string | null;
  instagramUrl?: string;
  youtubeUrl?: string;
  facebookUrl?: string;
  websiteUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Selected Collaborations (Past Brand Deals / Campaigns)
// ---------------------------------------------------------------------------

export interface CreatorCollaboration {
  id: string;
  creatorId: string;
  brandName: string;
  brandLogoUrl?: string | null;
  campaignTitle?: string;
  campaignUrl?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Collaboration Inquiries ("Work With Me")
// ---------------------------------------------------------------------------

export type CollaborationStatus = "NEW" | "VIEWED" | "REPLIED" | "CLOSED";

export interface CollaborationRequest {
  id: string;
  creatorId: string;
  senderName: string;
  companyName?: string;
  email: string;
  campaignType?: string;
  approxBudget?: string;
  message: string;
  status: CollaborationStatus;
  createdAt: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Profile Section Ordering & Visibility
// ---------------------------------------------------------------------------

export type ProfileSectionKey =
  | "ABOUT"
  | "TOTAL_FANBASE"
  | "SOCIALS"
  | "OTHER_SOCIALS"
  | "SERIES"
  | "SERVICES"
  | "COLLABORATIONS"
  | "REVIEWS"
  | "BRANDS"
  | "TEAM"
  | "LINKS"
  | "WORK_WITH_ME";

export interface CreatorProfileSection {
  id?: string;
  creatorId?: string;
  sectionKey: ProfileSectionKey;
  label?: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_PROFILE_SECTIONS: { sectionKey: ProfileSectionKey; label: string; sortOrder: number; isVisible: boolean }[] = [
  { sectionKey: "ABOUT", label: "About Creator", sortOrder: 0, isVisible: true },
  { sectionKey: "TOTAL_FANBASE", label: "Total Fanbase", sortOrder: 1, isVisible: true },
  { sectionKey: "SOCIALS", label: "Primary Social Accounts", sortOrder: 2, isVisible: true },
  { sectionKey: "OTHER_SOCIALS", label: "Other Social Accounts", sortOrder: 3, isVisible: true },
  { sectionKey: "LINKS", label: "Custom Links", sortOrder: 4, isVisible: true },
  { sectionKey: "SERIES", label: "OTT Series & Shows", sortOrder: 5, isVisible: true },
  { sectionKey: "SERVICES", label: "Services & Rate Card", sortOrder: 6, isVisible: true },
  { sectionKey: "COLLABORATIONS", label: "Selected Collaborations", sortOrder: 7, isVisible: true },
  { sectionKey: "BRANDS", label: "My Brands & Projects", sortOrder: 8, isVisible: true },
  { sectionKey: "TEAM", label: "Creator Team", sortOrder: 9, isVisible: true },
  { sectionKey: "REVIEWS", label: "Client Reviews", sortOrder: 10, isVisible: true },
  { sectionKey: "WORK_WITH_ME", label: "Work With Me (Collaboration CTA)", sortOrder: 11, isVisible: true },
];

// ---------------------------------------------------------------------------
// Analytics Events
// ---------------------------------------------------------------------------

export type AnalyticsEventType =
  | "profile_view"
  | "social_click"
  | "series_view"
  | "episode_click"
  | "service_view"
  | "service_click"
  | "work_with_me_click"
  | "collaboration_submit"
  | "media_kit_view"
  | "brand_click"
  | "team_social_click"
  | "collaboration_click";


