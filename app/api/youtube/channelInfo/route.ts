import { ApifySocialService } from "@/services/ApifySocialService";
import { requireSession } from "@/lib/session";
import { apiSuccess, apiError } from "@/lib/apiResponse";

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

export async function POST(req: Request) {
  const auth = requireSession(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const channelName = (body.channelName || body.username || "").trim().replace(/^@/, "");

    if (!channelName) {
      return apiError("YouTube channel name / handle is required", 400);
    }

    const apiKey = process.env.RAPIDAPI_KEY;
    const headers = {
      "Content-Type": "application/json",
      "x-rapidapi-host": "youtube-v2.p.rapidapi.com",
      "x-rapidapi-key": apiKey!,
    };

    // 1. Primary: Try Apify YouTube Channel Scraper
    if (apiKey) try {
      const apifyChannel = await ApifySocialService.fetchYouTubeChannel(channelName);
      if (apifyChannel) {
        return apiSuccess({ channel: apifyChannel, provider: "apify" }, "YouTube channel fetched via Apify");
      }
    } catch (err) {
      console.warn("[YouTube API] Apify error, falling back to RapidAPI:", err);
    }

    // 2. Fallback: Try RapidAPI YouTube Scraper
    try {
      // Step 1: Get Channel ID from channel name
      const idUrl = `https://youtube-v2.p.rapidapi.com/channel/id?channel_name=${encodeURIComponent(channelName)}`;
      const idRes = await fetch(idUrl, { headers });

      if (idRes.ok) {
        const idData = await idRes.json();
        const channelId = idData.channel_id;

        if (channelId) {
          // Step 2: Get Channel Details from Channel ID
          const detailsUrl = `https://youtube-v2.p.rapidapi.com/channel/details?channel_id=${channelId}`;
          const detailsRes = await fetch(detailsUrl, { headers });

          if (detailsRes.ok) {
            const details = await detailsRes.json();

            // Pick highest resolution avatar
            const avatars = details.avatar || [];
            const avatarUrl = avatars.length > 0 ? avatars[avatars.length - 1].url : "";

            const subscribersText = details.subscriber_count || "0 subscribers";
            const subscribersNumeric = parseSubscribers(subscribersText);

            const extracted = {
              channel_id: details.channel_id || channelId,
              channel_name: channelName,
              title: details.title || channelName,
              description: details.description || "",
              subscriber_count_text: subscribersText,
              subscribers: subscribersNumeric,
              avatar_url: avatarUrl,
              verified: Boolean(details.verified),
            };

            return apiSuccess({ channel: extracted, provider: "rapidapi" }, "YouTube channel fetched via RapidAPI");
          }
        }
      }
    } catch (e) {
      console.warn("[YouTube API] RapidAPI fallback error:", e);
    }

    return apiError(
      `YouTube channel "@${channelName}" not found. Please verify the handle and try again.`,
      404
    );
  } catch (error: any) {
    console.error("YouTube API Error:", error);
    return apiError(error.message || "Failed to fetch YouTube channel info", 500);
  }
}
