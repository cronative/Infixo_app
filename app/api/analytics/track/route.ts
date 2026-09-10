import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureAnalyticsTable } from "@/lib/analyticsDb";

// POST /api/analytics/track (Public Event Tracker)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Accept both camelCase and snake_case field names
    const creatorId = body.creatorId || body.creator_id;
    const username = body.username || body.creator_username;
    const eventType = body.eventType || body.event_type;
    const eventTarget = body.eventTarget || body.event_target;
    const metadata = body.metadata;

    if (!eventType) {
      return NextResponse.json({ error: "eventType required" }, { status: 400 });
    }

    await ensureAnalyticsTable();

    let targetCreatorId = creatorId;
    if (!targetCreatorId && username) {
      const [creators]: any = await db.query(
        "SELECT id FROM creators WHERE username = ? OR email = ? LIMIT 1",
        [username, username]
      );
      if (creators && creators.length > 0) {
        targetCreatorId = creators[0].id;
      }
    }

    if (!targetCreatorId) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const userAgent = req.headers.get("user-agent") || null;
    const metaJson = metadata ? JSON.stringify(metadata) : null;

    await db.query(
      `INSERT INTO analytics_events (creator_id, event_type, event_target, ip_address, user_agent, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [targetCreatorId, eventType, eventTarget || null, ip, userAgent, metaJson]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Analytics track error:", err);
    return NextResponse.json({ error: "Tracking error" }, { status: 500 });
  }
}
