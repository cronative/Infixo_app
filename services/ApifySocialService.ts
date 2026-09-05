/**
 * Apify Social Scraper Service
 * Provides robust fallback scrapers for Instagram, Facebook, and YouTube
 * using Apify cloud actors when primary RapidAPI calls encounter rate limits or missing profiles.
 */

export interface ApifyInstagramResult {
  username: string;
  full_name: string;
  follower_count: number;
  following_count: number;
  media_count: number;
  biography: string;
  profile_pic_url: string;
  is_verified: boolean;
}

export interface ApifyFacebookResult {
  name: string;
  username: string;
  page_id?: string;
  url: string;
  image: string;
  cover_image?: string;
  followers: number;
  likes: number;
  verified: boolean;
  categories: string[];
  intro: string;
}

export interface ApifyYouTubeResult {
  channel_id: string;
  channel_name: string;
  title: string;
  description: string;
  subscriber_count_text: string;
  subscribers: number;
  avatar_url: string;
  verified: boolean;
}

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

// 1 hour in-memory cache TTL to avoid unnecessary repeated Apify calls
const CACHE_TTL_MS = 60 * 60 * 1000;

export class ApifySocialService {
  private static instagramCache = new Map<string, CacheEntry<ApifyInstagramResult>>();
  private static facebookCache = new Map<string, CacheEntry<ApifyFacebookResult>>();
  private static youtubeCache = new Map<string, CacheEntry<ApifyYouTubeResult>>();

  private static getToken(): string | null {
    return process.env.APIFY_API_TOKEN || process.env.APIFY_TOKEN || "apify_api_jze2DRxvgdmg6vUFKNGeg4Rmu8ut5z2890A8";
  }

  /**
   * Fetch Instagram Profile via Apify Actor `apify~instagram-profile-scraper` (with cache)
   */
  static async fetchInstagramProfile(username: string, skipCache = false): Promise<ApifyInstagramResult | null> {
    const cleanUsername = username.replace(/^@/, "").trim();
    if (!cleanUsername) return null;

    const cacheKey = cleanUsername.toLowerCase();
    if (!skipCache) {
      const cached = this.instagramCache.get(cacheKey);
      if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
        console.log(`[Apify Cache Hit] Using cached Instagram profile for @${cleanUsername}`);
        return cached.data;
      }
    }

    const token = this.getToken();
    if (!token) return null;

    try {
      const endpoint = `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=30`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: [cleanUsername],
        }),
      });

      if (!res.ok) {
        console.warn(`[Apify] Instagram scrape failed (${res.status}): ${res.statusText}`);
        return null;
      }

      const items = await res.json();
      if (!Array.isArray(items) || items.length === 0) return null;

      const profile = items[0];
      if (!profile || profile.error) return null;

      const result: ApifyInstagramResult = {
        username: profile.username || cleanUsername,
        full_name: profile.fullName || profile.username || cleanUsername,
        follower_count: Number(profile.followersCount || profile.follower_count || 0),
        following_count: Number(profile.followsCount || profile.following_count || 0),
        media_count: Number(profile.postsCount || profile.media_count || 0),
        biography: profile.biography || "",
        profile_pic_url: profile.profilePicUrlHD || profile.profilePicUrl || "",
        is_verified: Boolean(profile.verified || profile.is_verified),
      };

      this.instagramCache.set(cacheKey, { data: result, cachedAt: Date.now() });
      return result;
    } catch (err) {
      console.warn("[Apify] Instagram scrape error:", err);
      return null;
    }
  }

  /**
   * Fetch Facebook Page via Apify Actor `apify~facebook-pages-scraper` (with cache)
   */
  static async fetchFacebookPage(pageNameOrUrl: string, skipCache = false): Promise<ApifyFacebookResult | null> {
    const clean = pageNameOrUrl.replace(/^@/, "").trim();
    if (!clean) return null;

    const cacheKey = clean.toLowerCase();
    if (!skipCache) {
      const cached = this.facebookCache.get(cacheKey);
      if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
        console.log(`[Apify Cache Hit] Using cached Facebook page for "${clean}"`);
        return cached.data;
      }
    }

    const token = this.getToken();
    if (!token) return null;

    const targetUrl = clean.startsWith("http")
      ? clean
      : `https://www.facebook.com/${clean}`;

    try {
      const endpoint = `https://api.apify.com/v2/acts/apify~facebook-pages-scraper/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=30`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startUrls: [{ url: targetUrl }],
        }),
      });

      if (!res.ok) {
        console.warn(`[Apify] Facebook scrape failed (${res.status}): ${res.statusText}`);
        return null;
      }

      const items = await res.json();
      if (!Array.isArray(items) || items.length === 0) return null;

      const page = items[0];
      if (!page || page.error) return null;

      const result: ApifyFacebookResult = {
        name: page.name || clean,
        username: clean,
        page_id: page.id || page.pageId || "",
        url: targetUrl,
        image: page.profilePicture || page.avatarUrl || page.image || "",
        cover_image: page.coverPhoto || page.coverImage || "",
        followers: Number(page.followers || page.followersCount || 0),
        likes: Number(page.likes || page.likesCount || 0),
        verified: Boolean(page.isVerified || page.verified),
        categories: Array.isArray(page.categories) ? page.categories : page.category ? [page.category] : [],
        intro: page.intro || page.about || page.description || "",
      };

      this.facebookCache.set(cacheKey, { data: result, cachedAt: Date.now() });
      return result;
    } catch (err) {
      console.warn("[Apify] Facebook scrape error:", err);
      return null;
    }
  }

  /**
   * Fetch YouTube Channel via Apify Actor `streamers~youtube-channel-scraper` (with cache)
   */
  static async fetchYouTubeChannel(channelNameOrHandle: string, skipCache = false): Promise<ApifyYouTubeResult | null> {
    const clean = channelNameOrHandle.replace(/^@/, "").trim();
    if (!clean) return null;

    const cacheKey = clean.toLowerCase();
    if (!skipCache) {
      const cached = this.youtubeCache.get(cacheKey);
      if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
        console.log(`[Apify Cache Hit] Using cached YouTube channel for @${clean}`);
        return cached.data;
      }
    }

    const token = this.getToken();
    if (!token) return null;

    const targetUrl = clean.startsWith("http")
      ? clean
      : `https://www.youtube.com/@${clean}`;

    try {
      const endpoint = `https://api.apify.com/v2/acts/streamers~youtube-channel-scraper/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=30`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startUrls: [{ url: targetUrl }],
          maxResults: 1,
        }),
      });

      if (!res.ok) {
        console.warn(`[Apify] YouTube scrape failed (${res.status}): ${res.statusText}`);
        return null;
      }

      const items = await res.json();
      if (!Array.isArray(items) || items.length === 0) return null;

      const channel = items[0];
      if (!channel || channel.error) return null;

      const result: ApifyYouTubeResult = {
        channel_id: channel.id || channel.channelId || clean,
        channel_name: clean,
        title: channel.title || channel.name || clean,
        description: channel.description || "",
        subscriber_count_text: channel.subscriberCountText || `${channel.subscribers || 0} subscribers`,
        subscribers: Number(channel.subscribers || channel.numberOfSubscribers || 0),
        avatar_url: channel.avatarUrl || channel.thumbnail || "",
        verified: Boolean(channel.verified || channel.isVerified),
      };

      this.youtubeCache.set(cacheKey, { data: result, cachedAt: Date.now() });
      return result;
    } catch (err) {
      console.warn("[Apify] YouTube scrape error:", err);
      return null;
    }
  }

  /**
   * Clear in-memory cache
   */
  static clearCache(): void {
    this.instagramCache.clear();
    this.facebookCache.clear();
    this.youtubeCache.clear();
  }
}
