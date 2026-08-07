import { NextResponse } from "next/server";

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
  try {
    const body = await req.json();
    const channelName = (body.channelName || body.username || "").trim().replace(/^@/, "");

    if (!channelName) {
      return NextResponse.json({ error: "YouTube channel name / handle is required" }, { status: 400 });
    }

    const apiKey = process.env.RAPIDAPI_KEY || "02af3277a0msh6d2023026fe26cap12bd27jsn3e7de18972b7";
    const headers = {
      "Content-Type": "application/json",
      "x-rapidapi-host": "youtube-v2.p.rapidapi.com",
      "x-rapidapi-key": apiKey,
    };

    // Step 1: Get Channel ID from channel name
    const idUrl = `https://youtube-v2.p.rapidapi.com/channel/id?channel_name=${encodeURIComponent(channelName)}`;
    const idRes = await fetch(idUrl, { headers });

    if (!idRes.ok) {
      throw new Error(`Failed to find channel ID for @${channelName}`);
    }

    const idData = await idRes.json();
    const channelId = idData.channel_id;

    if (!channelId) {
      return NextResponse.json({ error: `YouTube channel "@${channelName}" not found` }, { status: 404 });
    }

    // Step 2: Get Channel Details from Channel ID
    const detailsUrl = `https://youtube-v2.p.rapidapi.com/channel/details?channel_id=${channelId}`;
    const detailsRes = await fetch(detailsUrl, { headers });

    if (!detailsRes.ok) {
      throw new Error("Failed to fetch YouTube channel details");
    }

    const details = await detailsRes.json();

    // Pick highest resolution avatar
    const avatars = details.avatar || [];
    const avatarUrl = avatars.length > 0 ? avatars[avatars.length - 1].url : "";

    const subscribersText = details.subscriber_count || "0 subscribers";
    const subscribersNumeric = parseSubscribers(subscribersText);

    const extracted = {
      channel_id: details.channel_id,
      channel_name: channelName,
      title: details.title || channelName,
      description: details.description || "",
      subscriber_count_text: subscribersText,
      subscribers: subscribersNumeric,
      avatar_url: avatarUrl,
      verified: Boolean(details.verified),
    };

    return NextResponse.json({ success: true, channel: extracted });
  } catch (error: any) {
    console.error("YouTube API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch YouTube channel info" },
      { status: 500 }
    );
  }
}
