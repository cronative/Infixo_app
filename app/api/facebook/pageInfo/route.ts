import { NextResponse } from "next/server";
import { ApifySocialService } from "@/services/ApifySocialService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = (body.username || body.pageName || "").trim().replace(/^@/, "");

    if (!username) {
      return NextResponse.json({ error: "Facebook Page username is required" }, { status: 400 });
    }

    // Construct full Facebook URL
    const fbUrl = username.startsWith("http")
      ? username
      : `https://www.facebook.com/${username}`;

    const apiKey = process.env.RAPIDAPI_KEY || "02af3277a0msh6d2023026fe26cap12bd27jsn3e7de18972b7";

    // 1. Primary: Try Apify Facebook Page Scraper
    try {
      const apifyPage = await ApifySocialService.fetchFacebookPage(username);
      if (apifyPage) {
        return NextResponse.json({ success: true, page: apifyPage, provider: "apify" });
      }
    } catch (err) {
      console.warn("[Facebook API] Apify error, falling back to RapidAPI:", err);
    }

    // 2. Fallback: Try RapidAPI Facebook Scraper
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
          const extracted = {
            name: res.name,
            username: username,
            page_id: res.page_id || "",
            url: res.url || fbUrl,
            image: res.image || "",
            cover_image: res.cover_image || "",
            followers: Number(res.followers || 0),
            likes: Number(res.likes || 0),
            verified: Boolean(res.verified),
            categories: res.categories || [],
            intro: res.intro || "",
          };

          return NextResponse.json({ success: true, page: extracted, provider: "rapidapi" });
        }
      }
    } catch (e) {
      console.warn("[Facebook API] RapidAPI fallback error:", e);
    }

    return NextResponse.json(
      { error: `Facebook Page "${username}" not found. Please verify the page name or URL.` },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Facebook API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch Facebook Page info" },
      { status: 500 }
    );
  }
}
