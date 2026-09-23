import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { ensureAnalyticsTable } from "@/lib/analyticsDb";
import { isCreatorPublic } from "@/lib/creatorReadAccess";

interface CreatorIdRow extends RowDataPacket {
  id: string;
}

const ALLOWED_PUBLIC_EVENTS = new Set(["profile_view", "episode_click"]);
const ALLOWED_PUBLIC_SOURCES = new Set(["public_profile", "public_series"]);

// POST /api/analytics/track (Public Event Tracker)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Accept both camelCase and snake_case field names
    const creatorId = body.creatorId || body.creator_id;
    const username = body.username || body.creator_username;
    const eventType = body.eventType || body.event_type;
    const eventTarget = body.eventTarget || body.event_target;
    const eventId = body.eventId || body.event_id;
    const visitorId = body.visitorId || body.visitor_id;
    const source = body.source || "public_profile";
    const metadata = body.metadata;

    if (!eventType) {
      return NextResponse.json({ error: "eventType required" }, { status: 400 });
    }
    if (!ALLOWED_PUBLIC_EVENTS.has(eventType)) {
      return NextResponse.json({ error: "Unsupported public analytics event" }, { status: 400 });
    }
    if (!ALLOWED_PUBLIC_SOURCES.has(source)) {
      return NextResponse.json({ error: "Unsupported analytics source" }, { status: 400 });
    }
    if (!eventId) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 });
    }

    await ensureAnalyticsTable();

    let targetCreatorId = creatorId;
    if (!targetCreatorId && username) {
      const [creators] = await db.query<CreatorIdRow[]>(
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
    if (!(await isCreatorPublic(targetCreatorId))) {
      return NextResponse.json({ error: "Creator profile is private" }, { status: 404 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const userAgent = req.headers.get("user-agent") || null;
    const metaJson = metadata ? JSON.stringify(metadata) : null;

    await db.query(
      `INSERT IGNORE INTO analytics_events
        (event_id, creator_id, event_type, event_target, visitor_id, source, ip_address, user_agent, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [eventId, targetCreatorId, eventType, eventTarget || null, visitorId || null, source, ip, userAgent, metaJson]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Analytics track error:", err);
    return NextResponse.json({ error: "Tracking error" }, { status: 500 });
  }
}
