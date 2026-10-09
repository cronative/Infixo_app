import { NextRequest } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { ensureAnalyticsTable } from "@/lib/analyticsDb";

interface CountRow extends RowDataPacket {
  cnt: number;
}

interface FanbaseRow extends RowDataPacket {
  totalFanbase: number | null;
}

interface TargetClickRow extends RowDataPacket {
  event_type: string;
  event_target: string | null;
  clicks: number;
}

interface TrafficRow extends RowDataPacket {
  source_name: string | null;
  count: number;
}

function calculateDelta(current: number, prior: number): number {
  if (prior === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - prior) / prior) * 100);
}

export async function GET(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth.error) return auth.error;
    const creatorId = auth.session.creatorId;

    if (!creatorId) {
      return apiError("Unauthorized", 401);
    }

    await ensureAnalyticsTable();

    // 1. Fanbase
    let fanbase = 0;
    try {
      const [fanRows] = await db.query<FanbaseRow[]>(
        "SELECT SUM(COALESCE(audience_count, follower_count, 0)) AS totalFanbase FROM social_accounts WHERE creator_id = ?",
        [creatorId]
      );
      if (fanRows && fanRows.length > 0 && fanRows[0].totalFanbase) {
        fanbase = Number(fanRows[0].totalFanbase);
      }
    } catch {}

    // 2. Metrics (Current 30d vs Previous 30d)
    // Unique Visitors
    let uniqueVisitorsCurr = 0;
    let uniqueVisitorsPrior = 0;
    try {
      const [currRows] = await db.query<CountRow[]>(
        `SELECT COUNT(DISTINCT COALESCE(visitor_id, ip_address)) AS cnt 
         FROM analytics_events 
         WHERE creator_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
        [creatorId]
      );
      uniqueVisitorsCurr = Number(currRows?.[0]?.cnt || 0);

      const [priorRows] = await db.query<CountRow[]>(
        `SELECT COUNT(DISTINCT COALESCE(visitor_id, ip_address)) AS cnt 
         FROM analytics_events 
         WHERE creator_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`,
        [creatorId]
      );
      uniqueVisitorsPrior = Number(priorRows?.[0]?.cnt || 0);
    } catch {}

    // Link Clicks
    let linkClicksCurr = 0;
    let linkClicksPrior = 0;
    try {
      const [currRows] = await db.query<CountRow[]>(
        `SELECT COUNT(*) AS cnt 
         FROM analytics_events 
         WHERE creator_id = ? AND event_type = 'link_click' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
        [creatorId]
      );
      linkClicksCurr = Number(currRows?.[0]?.cnt || 0);

      const [priorRows] = await db.query<CountRow[]>(
        `SELECT COUNT(*) AS cnt 
         FROM analytics_events 
         WHERE creator_id = ? AND event_type = 'link_click' AND created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`,
        [creatorId]
      );
      linkClicksPrior = Number(priorRows?.[0]?.cnt || 0);
    } catch {}

    // Product Clicks
    let productClicksCurr = 0;
    let productClicksPrior = 0;
    try {
      const [currRows] = await db.query<CountRow[]>(
        `SELECT COUNT(*) AS cnt 
         FROM analytics_events 
         WHERE creator_id = ? AND event_type = 'product_click' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
        [creatorId]
      );
      productClicksCurr = Number(currRows?.[0]?.cnt || 0);

      const [priorRows] = await db.query<CountRow[]>(
        `SELECT COUNT(*) AS cnt 
         FROM analytics_events 
         WHERE creator_id = ? AND event_type = 'product_click' AND created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`,
        [creatorId]
      );
      productClicksPrior = Number(priorRows?.[0]?.cnt || 0);
    } catch {}

    // 3. Top 5 Ranked Working Items
    const topItems: {
      id: string;
      rank: number;
      title: string;
      category: "episode" | "link" | "product";
      categoryLabel: string;
      clicks: number;
      editUrl: string;
      subtitle?: string;
    }[] = [];

    try {
      const [targetRows] = await db.query<TargetClickRow[]>(
        `SELECT event_type, event_target, COUNT(*) as clicks
         FROM analytics_events
         WHERE creator_id = ?
           AND event_type IN ('episode_click', 'link_click', 'product_click')
           AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY event_type, event_target
         ORDER BY clicks DESC
         LIMIT 15`,
        [creatorId]
      );

      // Pre-fetch creator resources for name resolution
      const [customLinks]: any = await db.query(
        "SELECT id, title, url FROM creator_custom_links WHERE creator_id = ?",
        [creatorId]
      ).catch(() => [[]]);

      const [products]: any = await db.query(
        "SELECT id, name, product_url FROM creator_products WHERE creator_id = ?",
        [creatorId]
      ).catch(() => [[]]);

      const [episodes]: any = await db.query(
        `SELECT e.id, e.title, e.series_id, s.title AS series_title 
         FROM episodes e 
         LEFT JOIN series s ON e.series_id = s.id 
         WHERE s.creator_id = ?`,
        [creatorId]
      ).catch(() => [[]]);

      const linkMap = new Map<string, any>();
      (customLinks || []).forEach((l: any) => {
        linkMap.set(String(l.id), l);
        if (l.url) linkMap.set(String(l.url), l);
      });

      const prodMap = new Map<string, any>();
      (products || []).forEach((p: any) => {
        prodMap.set(String(p.id), p);
        if (p.product_url) prodMap.set(String(p.product_url), p);
        if (p.name) prodMap.set(String(p.name).toLowerCase(), p);
      });

      const epMap = new Map<string, any>();
      (episodes || []).forEach((e: any) => {
        epMap.set(String(e.id), e);
        if (e.series_id) epMap.set(`${e.series_id}:${e.id}`, e);
      });

      let rank = 1;
      for (const row of targetRows || []) {
        if (!row.event_target || row.clicks <= 0) continue;
        const targetStr = String(row.event_target);

        if (row.event_type === "episode_click") {
          const ep = epMap.get(targetStr) || epMap.get(targetStr.split(":").pop() || "");
          const title = ep?.title || (targetStr.includes(":") ? `Episode #${targetStr.split(":")[1]}` : targetStr);
          topItems.push({
            id: `ep_${targetStr}`,
            rank: rank++,
            title,
            category: "episode",
            categoryLabel: "Episode",
            clicks: Number(row.clicks),
            editUrl: "/dashboard/series",
            subtitle: ep?.series_title ? `Series: ${ep.series_title}` : undefined,
          });
        } else if (row.event_type === "link_click") {
          const link = linkMap.get(targetStr);
          const title = link?.title || (targetStr.startsWith("http") ? new URL(targetStr).hostname : targetStr);
          topItems.push({
            id: `link_${targetStr}`,
            rank: rank++,
            title,
            category: "link",
            categoryLabel: "Link",
            clicks: Number(row.clicks),
            editUrl: "/dashboard/links",
            subtitle: link?.url || undefined,
          });
        } else if (row.event_type === "product_click") {
          const prod = prodMap.get(targetStr) || prodMap.get(targetStr.toLowerCase());
          const title = prod?.name || targetStr;
          topItems.push({
            id: `prod_${targetStr}`,
            rank: rank++,
            title,
            category: "product",
            categoryLabel: "Product",
            clicks: Number(row.clicks),
            editUrl: "/dashboard/products",
            subtitle: prod?.product_url || undefined,
          });
        }

        if (topItems.length >= 5) break;
      }
    } catch (err) {
      console.error("Error computing top items:", err);
    }

    // 4. Traffic Sources Breakdown (Last 30 days)
    const trafficBreakdown: Record<string, number> = {
      instagram: 0,
      youtube: 0,
      whatsapp: 0,
      direct: 0,
      other: 0,
    };
    let totalTrafficEvents = 0;

    try {
      const [trafficRows] = await db.query<TrafficRow[]>(
        `SELECT COALESCE(traffic_source, 'direct') AS source_name, COUNT(*) AS count
         FROM analytics_events
         WHERE creator_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY source_name`,
        [creatorId]
      );

      for (const row of trafficRows || []) {
        const raw = (row.source_name || "direct").toLowerCase().trim();
        const cnt = Number(row.count || 0);
        totalTrafficEvents += cnt;

        if (raw.includes("instagram") || raw.includes("ig")) {
          trafficBreakdown.instagram += cnt;
        } else if (raw.includes("youtube") || raw.includes("yt")) {
          trafficBreakdown.youtube += cnt;
        } else if (raw.includes("whatsapp") || raw.includes("wa")) {
          trafficBreakdown.whatsapp += cnt;
        } else if (raw === "direct") {
          trafficBreakdown.direct += cnt;
        } else {
          trafficBreakdown.other += cnt;
        }
      }
    } catch {}

    const trafficSources = Object.entries(trafficBreakdown).map(([source, count]) => ({
      source,
      label: source.charAt(0).toUpperCase() + source.slice(1),
      count,
      percentage: totalTrafficEvents > 0 ? Math.round((count / totalTrafficEvents) * 100) : 0,
    }));

    // 5. Today Highlights
    // Fetch counts of inventory to provide intelligent highlights
    const [seriesCountRows]: any = await db.query(
      "SELECT COUNT(*) as cnt FROM series WHERE creator_id = ?",
      [creatorId]
    ).catch(() => [[{ cnt: 0 }]]);
    const seriesCount = Number(seriesCountRows?.[0]?.cnt || 0);

    const [prodCountRows]: any = await db.query(
      "SELECT COUNT(*) as cnt FROM creator_products WHERE creator_id = ?",
      [creatorId]
    ).catch(() => [[{ cnt: 0 }]]);
    const productCount = Number(prodCountRows?.[0]?.cnt || 0);

    const [gigCountRows]: any = await db.query(
      "SELECT COUNT(*) as cnt FROM mediakit_gigs WHERE creator_id = ?",
      [creatorId]
    ).catch(() => [[{ cnt: 0 }]]);
    const gigCount = Number(gigCountRows?.[0]?.cnt || 0);

    const [linkCountRows]: any = await db.query(
      "SELECT COUNT(*) as cnt FROM creator_custom_links WHERE creator_id = ?",
      [creatorId]
    ).catch(() => [[{ cnt: 0 }]]);
    const linkCount = Number(linkCountRows?.[0]?.cnt || 0);

    const todayHighlights: {
      id: string;
      title: string;
      description: string;
      actionLabel?: string;
      actionUrl?: string;
    }[] = [];

    // Highlight 1: Growth / Performance
    const visitorDelta = calculateDelta(uniqueVisitorsCurr, uniqueVisitorsPrior);
    if (uniqueVisitorsCurr > 0 && visitorDelta > 0) {
      todayHighlights.push({
        id: "growth_traffic",
        title: `Audience traffic is up ${visitorDelta}% this month`,
        description: `${uniqueVisitorsCurr} unique creators and fans visited your profile over the last 30 days.`,
        actionLabel: "View Details",
        actionUrl: "/dashboard/analytics",
      });
    } else if (topItems.length > 0) {
      const top = topItems[0];
      todayHighlights.push({
        id: "top_performer",
        title: `Top Performer: ${top.title}`,
        description: `Your ${top.categoryLabel.toLowerCase()} generated ${top.clicks} clicks in the last 30 days.`,
        actionLabel: `Edit ${top.categoryLabel}`,
        actionUrl: top.editUrl,
      });
    }

    // Highlight 2: Setup / Optimization opportunities
    if (productCount === 0) {
      todayHighlights.push({
        id: "add_product",
        title: "Monetize your bio traffic",
        description: "Add a digital product, consultation, or affiliate link to start earning from your fanbase.",
        actionLabel: "Add Product",
        actionUrl: "/dashboard/products",
      });
    } else if (gigCount === 0) {
      todayHighlights.push({
        id: "setup_mediakit",
        title: "Set brand collaboration packages",
        description: "Define your sponsored reels and stories pricing so brands can book you directly.",
        actionLabel: "Set Collab Rates",
        actionUrl: "/dashboard/mediakit",
      });
    } else if (seriesCount === 0) {
      todayHighlights.push({
        id: "create_series",
        title: "Organize your video series",
        description: "Turn your Instagram reels and YouTube shorts into bingeable episodic playlists.",
        actionLabel: "New Series",
        actionUrl: "/dashboard/series",
      });
    }

    // Fallback if empty
    if (todayHighlights.length === 0) {
      todayHighlights.push({
        id: "share_profile",
        title: "Share your profile to drive results",
        description: "Add your Inflixo link to your Instagram and YouTube bio to begin converting visitors.",
        actionLabel: "Share Profile",
        actionUrl: "#share",
      });
    }

    return apiSuccess({
      fanbase,
      resultsStrip: {
        fanbase: {
          value: fanbase,
          label: "Fanbase",
        },
        uniqueVisitors: {
          value: uniqueVisitorsCurr,
          prior: uniqueVisitorsPrior,
          deltaPercentage: calculateDelta(uniqueVisitorsCurr, uniqueVisitorsPrior),
          label: "30d Unique Visitors",
        },
        linkClicks: {
          value: linkClicksCurr,
          prior: linkClicksPrior,
          deltaPercentage: calculateDelta(linkClicksCurr, linkClicksPrior),
          label: "30d Link Clicks",
        },
        productClicks: {
          value: productClicksCurr,
          prior: productClicksPrior,
          deltaPercentage: calculateDelta(productClicksCurr, productClicksPrior),
          label: "30d Product Clicks",
        },
      },
      topWorkingItems: topItems,
      trafficSources: {
        totalEvents: totalTrafficEvents,
        isCollectingData: totalTrafficEvents === 0,
        sources: trafficSources,
      },
      todayHighlights: todayHighlights.slice(0, 3),
      inventoryCounts: {
        series: seriesCount,
        products: productCount,
        collabPackages: gigCount,
        customLinks: linkCount,
      },
    }, "Dashboard summary loaded");
  } catch (err) {
    console.error("Dashboard summary API error:", err);
    return apiError("Failed to load dashboard summary", 500);
  }
}
