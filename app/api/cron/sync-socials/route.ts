import { db } from "@/lib/db";
import { ApifySocialService } from "@/services/ApifySocialService";
import { apiSuccess, apiError } from "@/lib/apiResponse";

export const maxDuration = 300; // 5 minutes max execution duration

function parseSubscribers(subStr: string): number {
  if (!subStr) return 0;
  const match = subStr.match(/([\d.]+)\s*([KMBkmb])?/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const mult = (match[2] || "").toUpperCase();
  if (mult === "K") return Math.round(num * 1000);
  if (mult === "M") return Math.round(num * 1000000);
  if (mult === "B") return Math.round(num * 1000000000);
  return Math.round(num);
}

function extractHandle(str?: string): string {
  if (!str) return "";
  let s = str.trim();
  if (s.includes("/")) {
    s = s.split("?")[0].split("#")[0];
    const parts = s.split("/").filter(Boolean);
    s = parts[parts.length - 1] || "";
  }
  return s.replace(/^@/, "").trim();
}

async function fetchInstagramStats(usernameStr: string) {
  const handle = extractHandle(usernameStr);
  if (!handle) return null;

  // 1. Primary: Try Apify
  try {
    const apify = await ApifySocialService.fetchInstagramProfile(handle);
    if (apify) {
      return {
        followerCount: apify.follower_count,
        mediaCount: apify.media_count,
        avatarUrl: apify.profile_pic_url,
        isVerified: apify.is_verified,
        name: apify.full_name || handle,
      };
    }
  } catch (e) {}

  // 2. Fallback: Try RapidAPI
  try {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) return null;
    const response = await fetch("https://instagram120.p.rapidapi.com/api/instagram/userInfo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "instagram120.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
      body: JSON.stringify({ username: handle }),
    });

    if (response.ok) {
      const data = await response.json();
      const user = data?.result?.[0]?.user || data?.user;
      if (user) {
        return {
          followerCount: Number(user.follower_count || 0),
          mediaCount: Number(user.media_count || 0),
          avatarUrl: user.hd_profile_pic_url_info?.url || user.profile_pic_url || "",
          isVerified: Boolean(user.is_verified),
          name: user.full_name || handle,
        };
      }
    }
  } catch (e) {}

  return null;
}

async function fetchYouTubeStats(channelNameStr: string) {
  const handle = extractHandle(channelNameStr);
  if (!handle) return null;

  // 1. Primary: Try Apify
  try {
    const apify = await ApifySocialService.fetchYouTubeChannel(handle);
    if (apify) {
      return {
        followerCount: apify.subscribers,
        mediaCount: 0,
        avatarUrl: apify.avatar_url,
        isVerified: apify.verified,
        name: apify.title || handle,
      };
    }
  } catch (e) {}

  // 2. Fallback: Try RapidAPI
  try {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) return null;
    const headers = {
      "Content-Type": "application/json",
      "x-rapidapi-host": "youtube-v2.p.rapidapi.com",
      "x-rapidapi-key": apiKey,
    };

    const idUrl = `https://youtube-v2.p.rapidapi.com/channel/id?channel_name=${encodeURIComponent(handle)}`;
    const idRes = await fetch(idUrl, { headers });
    if (idRes.ok) {
      const idData = await idRes.json();
      const channelId = idData.channel_id;
      if (channelId) {
        const detailsUrl = `https://youtube-v2.p.rapidapi.com/channel/details?channel_id=${channelId}`;
        const detailsRes = await fetch(detailsUrl, { headers });
        if (detailsRes.ok) {
          const details = await detailsRes.json();
          const avatars = details.avatar || [];
          const avatarUrl = avatars.length > 0 ? avatars[avatars.length - 1].url : "";
          const subCount = parseSubscribers(details.subscriber_count || "0");
          const videoCount = parseInt(details.video_count || "0", 10) || 0;

          return {
            followerCount: subCount,
            mediaCount: videoCount,
            avatarUrl,
            isVerified: Boolean(details.is_verified),
            name: details.title || handle,
          };
        }
      }
    }
  } catch (e) {}

  return null;
}

async function fetchFacebookStats(usernameStr: string) {
  const handle = extractHandle(usernameStr);
  if (!handle) return null;

  // 1. Primary: Try Apify
  try {
    const apify = await ApifySocialService.fetchFacebookPage(handle);
    if (apify) {
      return {
        followerCount: apify.followers,
        mediaCount: 0,
        avatarUrl: apify.image,
        isVerified: apify.verified,
        name: apify.name || handle,
      };
    }
  } catch (e) {}

  // 2. Fallback: Try RapidAPI
  const fbUrl = handle.startsWith("http") ? handle : `https://www.facebook.com/${handle}`;
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://facebook-scraper3.p.rapidapi.com/page/details?url=${encodeURIComponent(fbUrl)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "facebook-scraper3.p.rapidapi.com",
          "x-rapidapi-key": apiKey,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const res = data.results || data;

      if (res && res.name) {
        return {
          followerCount: Number(res.followers || 0),
          mediaCount: 0,
          avatarUrl: res.image || "",
          isVerified: Boolean(res.verified),
          name: res.name || handle,
        };
      }
    }
  } catch (e) {}

  return null;
}

function getSyncIntervalHours(planKey?: string, status?: string): number {
  if (status === "expired" || status === "cancelled") {
    return 48; // Expired / cancelled creators sync less frequently
  }
  const key = (planKey || "").toLowerCase();
  if (key === "creator_vip" || key === "vip" || key === "unlimited") {
    return 3; // VIP Plan: 3-Hour Fast Sync
  }
  if (key === "creator_pro" || key === "pro") {
    return 12; // Pro Plan: 12-Hour Sync
  }
  if (key === "growth") {
    return 18;
  }
  // Starter ('starter'), Free Trial ('early_access'), Free Basic ('free'), or default
  return 24; // 24-Hour Daily Sync
}

export async function GET(req: Request) {
  return handleCronSync(req);
}

export async function POST(req: Request) {
  return handleCronSync(req);
}

async function handleCronSync(req: Request) {
  try {
    const url = new URL(req.url);
    const cronSecret = process.env.CRON_SECRET;
    const isDev = process.env.NODE_ENV === "development";
    const authHeader = req.headers.get("authorization");
    const querySecret = url.searchParams.get("secret");

    const isAuthorized =
      (cronSecret && (authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret)) ||
      isDev;

    if (!isAuthorized) {
      return apiError("Unauthorized - Valid Bearer CRON_SECRET or secret param required", 401);
    }

    const forceSync = url.searchParams.get("force") === "true";
    const targetUsername = url.searchParams.get("username")?.trim();
    const targetCreatorId = url.searchParams.get("creatorId")?.trim();

    // Step 1: Query creators from MySQL DB along with their subscription plan
    let query = `
      SELECT 
        c.id, 
        c.email, 
        c.username, 
        c.display_name, 
        c.photo_url,
        s.plan_key,
        s.status AS subscription_status
      FROM creators c
      LEFT JOIN subscriptions s ON c.id = s.creator_id
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (targetUsername) {
      conditions.push("c.username = ?");
      params.push(targetUsername);
    } else if (targetCreatorId) {
      conditions.push("c.id = ?");
      params.push(targetCreatorId);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
    }

    const [creators]: any = await db.query(query, params);

    const results: any[] = [];

    for (const creator of creators) {
      const refreshHours = getSyncIntervalHours(creator.plan_key, creator.subscription_status);

      const [socials]: any = await db.query(
        `SELECT id, platform, account_name, username, follower_count, media_count, is_verified, last_synced_at
         FROM social_accounts
         WHERE creator_id = ?`,
        [creator.id]
      );

      const creatorSummary = {
        creatorId: creator.id,
        username: creator.username,
        planKey: creator.plan_key || "free",
        syncIntervalHours: refreshHours,
        platformsUpdated: 0,
        platformsSkippedFresh: 0,
        details: [] as any[],
      };

      for (const social of socials) {
        const lastSynced = social.last_synced_at ? new Date(social.last_synced_at).getTime() : 0;
        const hoursSinceLastSync = lastSynced ? (Date.now() - lastSynced) / (1000 * 60 * 60) : 999999;
        const isDue = forceSync || !social.last_synced_at || hoursSinceLastSync >= refreshHours;

        if (!isDue) {
          creatorSummary.platformsSkippedFresh += 1;
          creatorSummary.details.push({
            platform: social.platform,
            username: social.username,
            status: "skipped_fresh",
            lastSyncedAt: social.last_synced_at,
            syncIntervalHours: refreshHours,
            hoursUntilNextSync: Math.max(0, +(refreshHours - hoursSinceLastSync).toFixed(1)),
          });
          continue;
        }

        let stats: any = null;

        if (social.platform === "instagram") {
          stats = await fetchInstagramStats(social.username);
        } else if (social.platform === "youtube") {
          stats = await fetchYouTubeStats(social.username);
        } else if (social.platform === "facebook") {
          stats = await fetchFacebookStats(social.username);
        }

        if (stats && stats.followerCount !== undefined) {
          await db.query(
            `UPDATE social_accounts
             SET follower_count = ?, media_count = ?, is_verified = ?, last_synced_at = NOW()
             WHERE id = ?`,
            [stats.followerCount, stats.mediaCount, stats.isVerified ? 1 : 0, social.id]
          );

          creatorSummary.platformsUpdated += 1;
          creatorSummary.details.push({
            platform: social.platform,
            username: social.username,
            followerCount: stats.followerCount,
            mediaCount: stats.mediaCount,
            status: "success",
            syncIntervalHours: refreshHours,
          });

          // Update creator avatar if missing
          if (!creator.photo_url && stats.avatarUrl) {
            await db.query(
              `UPDATE creators SET photo_url = ? WHERE id = ?`,
              [stats.avatarUrl, creator.id]
            );
          }
        } else {
          creatorSummary.details.push({
            platform: social.platform,
            username: social.username,
            status: "skipped_or_error",
            syncIntervalHours: refreshHours,
          });
        }
      }

      results.push(creatorSummary);
    }

    return apiSuccess({
      timestamp: new Date().toISOString(),
      syncSchedulePolicy: {
        vipTier: "Every 3 hours",
        proTier: "Every 12 hours",
        starterTier: "Every 24 hours",
        freeTier: "Every 24 hours",
      },
      forceSync,
      creatorsProcessed: creators.length,
      results,
    }, "Social accounts sync evaluated and updated successfully");
  } catch (error: any) {
    console.error("Cron Social Sync Error:", error);
    return apiError(error.message || "Cron social sync failed", 500);
  }
}
