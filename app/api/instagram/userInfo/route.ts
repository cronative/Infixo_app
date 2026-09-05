import { NextResponse } from "next/server";
import { ApifySocialService } from "@/services/ApifySocialService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = (body.username || "").trim().replace(/^@/, "");

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // 1. Primary: Try Apify Instagram Profile Scraper
    try {
      const apifyUser = await ApifySocialService.fetchInstagramProfile(username);
      if (apifyUser) {
        return NextResponse.json({ success: true, user: apifyUser, provider: "apify" });
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
          "x-rapidapi-key": process.env.RAPIDAPI_KEY || "02af3277a0msh6d2023026fe26cap12bd27jsn3e7de18972b7",
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

          return NextResponse.json({ success: true, user: extracted, provider: "rapidapi" });
        }
      }
    } catch (err) {
      console.warn("[Instagram API] RapidAPI fallback error:", err);
    }

    return NextResponse.json(
      { error: `Instagram account @${username} not found. Please check the handle or enter details manually.` },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Instagram API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch Instagram profile" },
      { status: 500 }
    );
  }
}
