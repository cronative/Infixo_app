import { ApifySocialService } from "@/services/ApifySocialService";
import { requireSession } from "@/lib/session";
import { apiSuccess, apiError } from "@/lib/apiResponse";

export async function POST(req: Request) {
  const auth = requireSession(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const username = (body.username || "").trim().replace(/^@/, "");

    if (!username) {
      return apiError("Username is required", 400);
    }

    // 1. Primary: Try Apify Instagram Profile Scraper
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (rapidApiKey) try {
      const apifyUser = await ApifySocialService.fetchInstagramProfile(username);
      if (apifyUser) {
        return apiSuccess({ user: apifyUser, provider: "apify" }, "Instagram profile fetched via Apify");
      }
    } catch (err) {
      console.warn("[Instagram API] Apify error, falling back to RapidAPI:", err);
    }

    // 2. Fallback: Try RapidAPI
    try {
      const response = await fetch("https://instagram120.p.rapidapi.com/api/instagram/userInfo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "instagram120.p.rapidapi.com",
          "x-rapidapi-key": rapidApiKey!,
        },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        const data = await response.json();
        const user = data?.result?.[0]?.user || data?.user;

        if (user && (user.username || user.full_name)) {
          const extracted = {
            username: user.username || username,
            full_name: user.full_name || username,
            follower_count: Number(user.follower_count || 0),
            media_count: Number(user.media_count || 0),
            following_count: Number(user.following_count || 0),
            biography: user.biography || "",
            profile_pic_url: user.hd_profile_pic_url_info?.url || user.profile_pic_url || "",
            is_verified: Boolean(user.is_verified),
          };

          return apiSuccess({ user: extracted, provider: "rapidapi" }, "Instagram profile fetched via RapidAPI");
        }
      }
    } catch (err) {
      console.warn("[Instagram API] RapidAPI fallback error:", err);
    }

    return apiError(
      `Instagram account @${username} not found. Please check the handle or enter details manually.`,
      404
    );
  } catch (error: any) {
    console.error("Instagram API Error:", error);
    return apiError(error.message || "Failed to fetch Instagram profile", 500);
  }
}
