import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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

  const apiKey = process.env.RAPIDAPI_KEY || "02af3277a0msh6d2023026fe26cap12bd27jsn3e7de18972b7";
  const response = await fetch("https://instagram120.p.rapidapi.com/api/instagram/userInfo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-host": "instagram120.p.rapidapi.com",
      "x-rapidapi-key": apiKey,
    },
    body: JSON.stringify({ username: handle }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const user = data?.result?.[0]?.user || data?.user;
  if (!user) return null;

  return {
    followerCount: user.follower_count || 0,
    mediaCount: user.media_count || 0,
    avatarUrl: user.hd_profile_pic_url_info?.url || user.profile_pic_url || "",
    isVerified: Boolean(user.is_verified),
    name: user.full_name || handle,
  };
}

async function fetchYouTubeStats(channelNameStr: string) {
  const handle = extractHandle(channelNameStr);
  if (!handle) return null;

  const apiKey = process.env.RAPIDAPI_KEY || "02af3277a0msh6d2023026fe26cap12bd27jsn3e7de18972b7";
  const headers = {
    "Content-Type": "application/json",
    "x-rapidapi-host": "youtube-v2.p.rapidapi.com",
    "x-rapidapi-key": apiKey,
  };

  const idUrl = `https://youtube-v2.p.rapidapi.com/channel/id?channel_name=${encodeURIComponent(handle)}`;
  const idRes = await fetch(idUrl, { headers });
  if (!idRes.ok) return null;

  const idData = await idRes.json();
  const channelId = idData.channel_id;
  if (!channelId) return null;

  const detailsUrl = `https://youtube-v2.p.rapidapi.com/channel/details?channel_id=${channelId}`;
  const detailsRes = await fetch(detailsUrl, { headers });
  if (!detailsRes.ok) return null;

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

async function fetchFacebookStats(usernameStr: string) {
  const handle = extractHandle(usernameStr);
  if (!handle) return null;

  const fbUrl = handle.startsWith("http") ? handle : `https://www.facebook.com/${handle}`;
  const apiKey = process.env.RAPIDAPI_KEY || "02af3277a0msh6d2023026fe26cap12bd27jsn3e7de18972b7";

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

  if (!response.ok) return null;
  const data = await response.json();
  const res = data.results || data;
  if (!res || !res.name) return null;

  return {
    followerCount: res.followers || res.likes || 0,
    mediaCount: 0,
    avatarUrl: res.image || "",
    isVerified: Boolean(res.verified),
    name: res.name || handle,
  };
}

export async function GET(req: Request) {
  return handleCronSync(req);
}

export async function POST(req: Request) {
  return handleCronSync(req);
}

async function handleCronSync(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") || searchParams.get("key");
    const cronSecret = process.env.CRON_SECRET || "inflixo_cron_secret_1111";

    // Verify token if provided in query params
    if (token && token !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized cron token" }, { status: 401 });
    }

    // Step 1: Query all creators from MySQL DB
    const [creators]: any = await db.query(
      `SELECT id, email, username, display_name, profile_image_url FROM creators`
    );

    const results: any[] = [];

    for (const creator of creators) {
      const [socials]: any = await db.query(
        `SELECT id, platform, account_name, username, follower_count, media_count, is_verified
         FROM social_accounts
         WHERE creator_id = ?`,
        [creator.id]
      );

      const creatorSummary = {
        creatorId: creator.id,
        email: creator.email,
        username: creator.username,
        platformsUpdated: 0,
        details: [] as any[],
      };

      for (const social of socials) {
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
          });

          // Update creator avatar if missing
          if (!creator.profile_image_url && stats.avatarUrl) {
            await db.query(
              `UPDATE creators SET profile_image_url = ? WHERE id = ?`,
              [stats.avatarUrl, creator.id]
            );
          }
        } else {
          creatorSummary.details.push({
            platform: social.platform,
            username: social.username,
            status: "skipped_or_error",
          });
        }
      }

      results.push(creatorSummary);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      cronSchedule: "Every 12 hours at 11:11 AM & 11:11 PM IST",
      cronExpression: "11 11,23 * * *",
      creatorsProcessed: creators.length,
      results,
    });
  } catch (error: any) {
    console.error("Cron Social Sync Error:", error);
    return NextResponse.json({ error: error.message || "Cron social sync failed" }, { status: 500 });
  }
}
