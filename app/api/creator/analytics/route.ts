import { db } from "@/lib/db";
import { ensureAnalyticsTable } from "@/lib/analyticsDb";
import { ensureRequestsTable } from "@/lib/requestsDb";
import { requireCreator } from "@/lib/creatorAuth";
import { apiSuccess, apiError } from "@/lib/apiResponse";

// GET /api/creator/analytics?period=...
export async function GET(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30d"; // 7d or 30d

    await ensureAnalyticsTable();
    await ensureRequestsTable();

    const targetId = auth.creator.id;
    const days = period === "7d" ? 7 : 30;

    // 1. Total event counts by type
    const [eventCounts]: any = await db.query(
      `SELECT event_type, COUNT(*) as total_count, COUNT(DISTINCT COALESCE(visitor_id, ip_address)) as unique_count
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

    const metrics = {
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
    };

    return apiSuccess({
      period,
      days,
      metrics,
      dailyTrend: dailyTrend || [],
      topTargets: topTargets || [],
    }, "Analytics retrieved successfully");
  } catch (err: any) {
    console.error("GET analytics error:", err);
    return apiError(err.message || "Failed to fetch analytics", 500);
  }
}
