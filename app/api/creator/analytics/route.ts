import { db } from "@/lib/db";
import { ensureAnalyticsTable } from "@/lib/analyticsDb";
import { ensureRequestsTable } from "@/lib/requestsDb";
import { requireCreator } from "@/lib/creatorAuth";
import { apiSuccess, apiError } from "@/lib/apiResponse";

// GET /api/creator/analytics?period=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30d"; // 7d or 30d

    const auth = await requireCreator(req);
    let targetId = auth.creator?.id;

    if (!targetId) {
      const email = searchParams.get("email");
      const username = searchParams.get("username");
      const creatorId = searchParams.get("creatorId");

      if (creatorId) {
        targetId = creatorId;
      } else if (username || email) {
        const [rows]: any = await db.query(
          "SELECT id FROM creators WHERE username = ? OR email = ? LIMIT 1",
          [username || "", email || ""]
        );
        targetId = rows?.[0]?.id;
      }
    }

    if (!targetId) {
      if (auth.error) return auth.error;
      return apiError("Creator not found", 404);
    }

    await ensureAnalyticsTable();
    await ensureRequestsTable();

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
       LIMIT 10`,
      [targetId, days]
    );

    // Fetch series and episodes for this creator to enrich targets
    const [seriesList]: any = await db.query(
      `SELECT id, title FROM series WHERE creator_id = ?`,
      [targetId]
    );
    const [episodesList]: any = await db.query(
      `SELECT e.id, e.series_id, e.episode_number, e.title, s.title as series_title
       FROM episodes e
       INNER JOIN series s ON e.series_id = s.id
       WHERE s.creator_id = ?`,
      [targetId]
    );

    const seriesMap = new Map<string, string>();
    (seriesList || []).forEach((s: any) => {
      seriesMap.set(String(s.id), s.title);
    });

    const episodeMap = new Map<string, { id: string; seriesId: string; episodeNumber: number; title: string; seriesTitle: string }>();
    (episodesList || []).forEach((e: any) => {
      episodeMap.set(String(e.id), {
        id: e.id,
        seriesId: e.series_id,
        episodeNumber: Number(e.episode_number || 1),
        title: e.title,
        seriesTitle: e.series_title || seriesMap.get(String(e.series_id)) || "Series",
      });
    });

    const enrichedTargets = (topTargets || []).map((target: any) => {
      const rawTarget = String(target.event_target || "").trim();
      let seriesTitle: string | null = null;
      let episodeTitle: string | null = null;
      let episodeNumber: number | null = null;
      let displayTitle = rawTarget;
      let displaySubtitle: string | null = null;

      if (target.event_type === "episode_click" || rawTarget.includes("series_") || rawTarget.includes("ep_")) {
        let sId = "";
        let epId = "";
        if (rawTarget.includes(":")) {
          const parts = rawTarget.split(":");
          sId = parts[0] || "";
          epId = parts[1] || "";
        } else if (rawTarget.startsWith("series_")) {
          sId = rawTarget;
        } else if (rawTarget.startsWith("ep_")) {
          epId = rawTarget;
        }

        const epInfo = epId ? episodeMap.get(epId) : null;
        if (epInfo) {
          seriesTitle = epInfo.seriesTitle;
          episodeTitle = epInfo.title;
          episodeNumber = epInfo.episodeNumber;
        } else if (sId && seriesMap.has(sId)) {
          seriesTitle = seriesMap.get(sId) || null;
        }

        if (seriesTitle && episodeTitle) {
          displayTitle = seriesTitle;
          displaySubtitle = `Episode ${episodeNumber || 1}: ${episodeTitle}`;
        } else if (seriesTitle) {
          displayTitle = seriesTitle;
          displaySubtitle = "Series link";
        } else if (episodeTitle) {
          displayTitle = episodeTitle;
          displaySubtitle = `Episode ${episodeNumber || 1}`;
        }
      } else if (target.event_type === "social_click") {
        displaySubtitle = "Social profile link";
        if (rawTarget.includes("instagram.com")) displayTitle = "Instagram";
        else if (rawTarget.includes("youtube.com")) displayTitle = "YouTube";
        else if (rawTarget.includes("twitter.com") || rawTarget.includes("x.com")) displayTitle = "X (Twitter)";
        else if (rawTarget.includes("facebook.com")) displayTitle = "Facebook";
      } else if (target.event_type === "link_click") {
        displaySubtitle = "Custom bio link";
      }

      return {
        ...target,
        series_title: seriesTitle,
        episode_title: episodeTitle,
        episode_number: episodeNumber,
        display_title: displayTitle,
        display_subtitle: displaySubtitle,
      };
    });

    const metrics = {
      profileViews: counts["profile_view"]?.total || 0,
      uniqueVisitors: counts["profile_view"]?.unique || 0,
      socialClicks: counts["social_click"]?.total || 0,
      linkClicks: counts["link_click"]?.total || 0,
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
      topTargets: enrichedTargets || topTargets || [],
    }, "Analytics retrieved successfully");
  } catch (err: any) {
    console.error("GET analytics error:", err);
    return apiError(err.message || "Failed to fetch analytics", 500);
  }
}
