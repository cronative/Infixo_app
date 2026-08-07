import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = (body.username || "").trim().replace(/^@/, "");

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const response = await fetch("https://instagram120.p.rapidapi.com/api/instagram/userInfo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "instagram120.p.rapidapi.com",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY || "02af3277a0msh6d2023026fe26cap12bd27jsn3e7de18972b7",
      },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      throw new Error(`RapidAPI Error: ${response.statusText}`);
    }

    const data = await response.json();

    // Parse RapidAPI response format: data.result[0].user
    const user = data?.result?.[0]?.user || data?.user;

    if (!user) {
      return NextResponse.json({ error: "Instagram account not found" }, { status: 404 });
    }

    const extracted = {
      username: user.username,
      full_name: user.full_name,
      follower_count: user.follower_count || 0,
      media_count: user.media_count || 0,
      following_count: user.following_count || 0,
      biography: user.biography || "",
      profile_pic_url: user.hd_profile_pic_url_info?.url || user.profile_pic_url || "",
      is_verified: Boolean(user.is_verified),
    };

    return NextResponse.json({ success: true, user: extracted });
  } catch (error: any) {
    console.error("Instagram API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch Instagram profile" },
      { status: 500 }
    );
  }
}
