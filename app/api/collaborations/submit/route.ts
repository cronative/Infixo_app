import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureRequestsTable } from "@/lib/requestsDb";
import { ensureAnalyticsTable } from "@/lib/analyticsDb";

// Simple in-memory IP rate limiter: max 5 submissions per 10 minutes per IP
const ipSubmissions = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const timestamps = (ipSubmissions.get(ip) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= 5) {
    return true;
  }
  timestamps.push(now);
  ipSubmissions.set(ip, timestamps);
  return false;
}

// POST /api/collaborations/submit (Public "Work With Me" Submission)
export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many inquiries submitted. Please wait a few minutes before trying again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { username, creatorId: passedCreatorId, senderName, companyName, email, campaignType, approxBudget, message } = body;

    if (!senderName || !senderName.trim()) {
      return NextResponse.json({ error: "Your name is required" }, { status: 400 });
    }
    if (!email || !email.trim() || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }
    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Please write a brief message / requirement" }, { status: 400 });
    }

    await ensureRequestsTable();
    await ensureAnalyticsTable();

    // Resolve target creator
    let targetCreatorId = passedCreatorId;
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

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await db.query(
      `INSERT INTO collaboration_requests (id, creator_id, sender_name, company_name, email, campaign_type, approx_budget, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'NEW')`,
      [
        requestId,
        targetCreatorId,
        senderName.trim(),
        (companyName || "").trim() || null,
        email.trim().toLowerCase(),
        (campaignType || "").trim() || null,
        (approxBudget || "").trim() || null,
        message.trim(),
      ]
    );

    // Track analytics event
    try {
      await db.query(
        `INSERT INTO analytics_events (creator_id, event_type, event_target, ip_address, user_agent)
         VALUES (?, 'collaboration_submit', ?, ?, ?)`,
        [targetCreatorId, senderName.trim(), ip, req.headers.get("user-agent") || null]
      );
    } catch {}

    return NextResponse.json({
      success: true,
      requestId,
      message: "Your collaboration inquiry has been sent to the creator! 🎉",
    });
  } catch (err: any) {
    console.error("POST collaboration submit error:", err);
    return NextResponse.json({ error: "Failed to submit collaboration request. Please try again." }, { status: 500 });
  }
}
