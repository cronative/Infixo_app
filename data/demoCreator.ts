import {
  CreatorProfile,
  SocialAccounts,
  Series,
  Subscription,
  ThemeKey,
} from "@/types";
import { generateId } from "@/utils/format";

export const DEMO_PROFILE: CreatorProfile = {
  photoDataUrl: null,
  displayName: "Tony Stark",
  username: "tonystark",
  category: "Technology",
  bio: "Genius, billionaire, playboy, philanthropist & tech innovator.",
  updatedAt: new Date().toISOString(),
};

export const DEMO_SOCIALS: SocialAccounts = {
  instagram: {
    url: "https://instagram.com/tonystark",
    followers: 48700,
    posts: 612,
  },
  youtube: {
    url: "https://youtube.com/@tonystark",
    subscribers: 62300,
    videos: 214,
    totalViews: 8_400_000,
  },
  facebook: {
    url: "https://facebook.com/tonystark",
    followers: 15000,
    posts: 340,
  },
  updatedAt: new Date().toISOString(),
};

export const DEMO_THEME: ThemeKey = "modern-purple";

export const DEMO_SERIES: Series[] = [
  {
    id: generateId("series"),
    title: "Village Life",
    posterDataUrl: null,
    description: "Slow mornings, home-cooked meals and everyday village stories.",
    genre: "Lifestyle",
    language: "Hindi",
    createdAt: new Date().toISOString(),
    seasons: [
      {
        id: generateId("season"),
        title: "Season 1",
        seasonNumber: 1,
        episodes: Array.from({ length: 8 }).map((_, i) => ({
          id: generateId("ep"),
          episodeNumber: i + 1,
          title: `Village Life — Episode ${i + 1}`,
          thumbnailDataUrl: null,
          platform: "YouTube" as const,
          externalUrl: "https://youtube.com/@heenarathod",
          description: "A day in the life, told simply.",
        })),
      },
    ],
  },
  {
    id: generateId("series"),
    title: "Kashmir Diaries",
    posterDataUrl: null,
    description: "A travel journal through the valleys of Kashmir.",
    genre: "Travel",
    language: "Hindi",
    createdAt: new Date().toISOString(),
    seasons: [
      {
        id: generateId("season"),
        title: "Season 1",
        seasonNumber: 1,
        episodes: Array.from({ length: 5 }).map((_, i) => ({
          id: generateId("ep"),
          episodeNumber: i + 1,
          title: `Kashmir Diaries — Episode ${i + 1}`,
          thumbnailDataUrl: null,
          platform: "Instagram" as const,
          externalUrl: "https://instagram.com/heenarathod",
          description: "Chasing snow, chai and mountain roads.",
        })),
      },
    ],
  },
  {
    id: generateId("series"),
    title: "Food Explorer",
    posterDataUrl: null,
    description: "Street food and hidden gems across Indian cities.",
    genre: "Food",
    language: "Hindi",
    createdAt: new Date().toISOString(),
    seasons: [
      {
        id: generateId("season"),
        title: "Season 2",
        seasonNumber: 2,
        episodes: Array.from({ length: 6 }).map((_, i) => ({
          id: generateId("ep"),
          episodeNumber: i + 1,
          title: `Food Explorer — Episode ${i + 1}`,
          thumbnailDataUrl: null,
          platform: "YouTube" as const,
          externalUrl: "https://youtube.com/@heenarathod",
          description: "The best bite in every city, found and reviewed.",
        })),
      },
    ],
  },
];

export const DEMO_SUBSCRIPTION: Subscription = {
  planKey: "early_access",
  planName: "Early Access",
  billingCycle: "yearly",
  status: "active",
  activatedAt: new Date().toISOString(),
};
