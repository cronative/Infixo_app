import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureAnalyticsTable } from "@/lib/analyticsDb";
import { ensureRequestsTable } from "@/lib/requestsDb";

async function resolveCreatorId(lookupVal: string): Promise<{ id: string; email: string } | null> {
  if (!lookupVal) return null;
  try {
    const [rows]: any = await db.query(
      "SELECT id, email FROM creators WHERE id = ? OR email = ? OR username = ? LIMIT 1",
      [lookupVal, lookupVal, lookupVal]
    );
    if (rows && rows.length > 0) {
      return { id: rows[0].id, email: rows[0].email };
    }
  } catch {}
  return null;
}

// GET /api/creator/analytics?creatorId=... or ?email=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lookupVal = searchParams.get("creatorId") || searchParams.get("email") || searchParams.get("username");
    const period = searchParams.get("period") || "30d"; // 7d or 30d

    if (!lookupVal) {
      return NextResponse.json({ error: "Creator identifier required" }, { status: 400 });
    }

    await ensureAnalyticsTable();
    await ensureRequestsTable();

    const creator = await resolveCreatorId(lookupVal);
    const targetId = creator ? creator.id : lookupVal;

    const days = period === "7d" ? 7 : 30;

    // 1. Total event counts by type
    const [eventCounts]: any = await db.query(
      `SELECT event_type, COUNT(*) as total_count, COUNT(DISTINCT ip_address) as unique_count
       FROM analytics_events
       WHERE creator_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY event_type`,
      [targetId, days]
    );

    const counts: Record<string, { total: number; unique: number }> = {};
    (eventCounts || []).forEach((r: any) => {
      counts[r.event_type] = {
        total: Number(r.total_count || 0),
        unique: Number(r.unique_count || 0),
      };
    });

    // 2. Collaboration inquiries count
    const [reqCounts]: any = await db.query(
      `SELECT COUNT(*) as total_inquiries,
              SUM(CASE WHEN status = 'NEW' THEN 1 ELSE 0 END) as new_inquiries
       FROM collaboration_requests
       WHERE creator_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [targetId, days]
    );

    // 3. Daily trend data for chart
    const [dailyTrend]: any = await db.query(
      `SELECT DATE(created_at) as date,
              COUNT(CASE WHEN event_type = 'profile_view' THEN 1 END) as views,
              COUNT(CASE WHEN event_type != 'profile_view' THEN 1 END) as clicks
       FROM analytics_events
       WHERE creator_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [targetId, days]
    );

    // 4. Top targets (links, series, social clicks)
    const [topTargets]: any = await db.query(
      `SELECT event_type, event_target, COUNT(*) as clicks
       FROM analytics_events
       WHERE creator_id = ? AND event_target IS NOT NULL AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY event_type, event_target
       ORDER BY clicks DESC
       LIMIT 8`,
      [targetId, days]
    );

    return NextResponse.json({
      success: true,
      period,
      days,
      metrics: {
        profileViews: counts["profile_view"]?.total || 0,
        uniqueVisitors: counts["profile_view"]?.unique || 0,
        socialClicks: counts["social_click"]?.total || 0,
        seriesViews: counts["series_view"]?.total || 0,
        episodeClicks: counts["episode_click"]?.total || 0,
        serviceViews: counts["service_view"]?.total || 0,
        serviceClicks: counts["service_click"]?.total || 0,
        workWithMeClicks: counts["work_with_me_click"]?.total || 0,
        collaborationSubmissions: counts["collaboration_submit"]?.total || Number(reqCounts[0]?.total_inquiries || 0),
        newCollaborationInquiries: Number(reqCounts[0]?.new_inquiries || 0),
        mediaKitViews: counts["media_kit_view"]?.total || 0,
        brandClicks: counts["brand_click"]?.total || 0,
        teamSocialClicks: counts["team_social_click"]?.total || 0,
        collaborationClicks: counts["collaboration_click"]?.total || 0,
      },
      dailyTrend: dailyTrend || [],
      topTargets: topTargets || [],
    });
  } catch (err: any) {
    console.error("GET analytics error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
