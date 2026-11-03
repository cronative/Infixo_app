import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { ensureAnalyticsTable } from "@/lib/analyticsDb";
import { getAnalyticsSummary } from "@/lib/analyticsSummary";
import { ensureCollabRequestsTable } from "@/lib/collabRequestsDb";
import { countUnseenReviews } from "@/lib/reviewsDb";
import { getLinkQuota } from "@/lib/linksDb";
import { getProductQuota } from "@/lib/productsDb";
import { getPlanQuota } from "@/services/subscriptionLimits";

/**
 * Dashboard metric → stored analytics event.
 * profile_open = profile_view, link_click = link_click,
 * series_play = episode_click (a viewer opened an episode), shop_click = product_click.
 */
export const DASHBOARD_METRICS = {
  profileOpens: "profile_view",
  linkClicks: "link_click",
  seriesPlays: "episode_click",
  shopClicks: "product_click",
} as const;
export type DashboardMetricKey = keyof typeof DASHBOARD_METRICS;

export type TrafficSource = "Instagram" | "YouTube" | "WhatsApp" | "Shared link" | "Direct" | "Other";

export interface DashboardMetric {
  /** Last 7 days incl. today. */
  current: number;
  /** The 7 days before that. */
  previous: number;
  /** Oldest → newest, 7 entries. */
  daily: number[];
}

export interface DashboardLimitAlert {
  resource: "series" | "episodes" | "links" | "products";
  label: string;
  used: number;
  limit: number;
  href: string;
}

export interface DashboardSummary {
  inbox: {
    newRequests: number;
    unreadReviews: number;
    mediaKitViews7d: number;
    /** New collab requests waiting more than 48h. */
    stalePending: number;
  };
  metrics: Record<DashboardMetricKey, DashboardMetric>;
  top: {
    link: { title: string; clicks: number } | null;
    series: { title: string; plays: number; episode: { title: string; plays: number } | null } | null;
    product: { name: string; clicks: number } | null;
  };
  sources: { source: TrafficSource; count: number }[];
  /** 7-day counts per dashboard list row id. */
  rows: { series: Record<string, number>; links: Record<string, number>; products: Record<string, number> };
  limits: DashboardLimitAlert[];
}

interface DayRow extends RowDataPacket {
  event_type: string;
  ago: number;
  n: number;
}
interface RefRow extends RowDataPacket {
  ref: string | null;
  via: string | null;
  ig: number;
  n: number;
}

export function classifyReferrer(ref: string | null | undefined, instagramInApp = false): TrafficSource {
  if (instagramInApp) return "Instagram";
  if (!ref) return "Direct";
  let host = "";
  try {
    host = new URL(ref).hostname.toLowerCase();
  } catch {
    return "Other";
  }
  if (/(^|\.)instagram\.com$/.test(host)) return "Instagram";
  if (/(^|\.)(youtube\.com|youtu\.be)$/.test(host)) return "YouTube";
  if (/(^|\.)(whatsapp\.com|wa\.me)$/.test(host)) return "WhatsApp";
  if (/(^|\.)inflixo\.com$/.test(host) || host === "localhost") return "Direct";
  return "Other";
}

const pick = <T,>(list: T[], score: (item: T) => number) => {
  const best = list.reduce<T | null>((top, item) => (!top || score(item) > score(top) ? item : top), null);
  return best && score(best) > 0 ? best : null;
};

export async function buildDashboardSummary(creatorId: string): Promise<DashboardSummary> {
  await Promise.all([ensureAnalyticsTable(), ensureCollabRequestsTable()]);
  const types = [...Object.values(DASHBOARD_METRICS), "media_kit_view"];

  const [[days], [refs], [requests], unreadReviews, analytics, linkQuota, productQuota, [seriesRows]] = await Promise.all([
    db.query<DayRow[]>(
      `SELECT event_type, DATEDIFF(CURDATE(), DATE(created_at)) AS ago, COUNT(*) AS n
       FROM analytics_events
       WHERE creator_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY) AND event_type IN (?)
       GROUP BY event_type, ago`,
      [creatorId, types],
    ),
    db.query<RefRow[]>(
      `SELECT JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.referrer')) AS ref,
              JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.via')) AS via,
              (user_agent LIKE '%Instagram%') AS ig, COUNT(*) AS n
       FROM analytics_events
       WHERE creator_id = ? AND event_type = 'profile_view' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY ref, via, ig`,
      [creatorId],
    ),
    db.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total, COALESCE(SUM(created_at < DATE_SUB(NOW(), INTERVAL 48 HOUR)), 0) AS stale
       FROM collab_requests WHERE creator_id = ? AND status = 'new'`,
      [creatorId],
    ),
    countUnseenReviews(creatorId).catch(() => 0),
    getAnalyticsSummary(creatorId, "7d"),
    getLinkQuota(creatorId),
    getProductQuota(creatorId),
    db.query<RowDataPacket[]>(
      `SELECT s.id, s.title, COUNT(e.id) AS episodes
       FROM series s LEFT JOIN episodes e ON e.series_id = s.id
       WHERE s.creator_id = ? GROUP BY s.id, s.title`,
      [creatorId],
    ),
  ]);

  // Daily buckets: ago 0..6 = current window, 7..13 = previous.
  const metrics = {} as Record<DashboardMetricKey, DashboardMetric>;
  let mediaKitViews7d = 0;
  for (const [key, type] of Object.entries(DASHBOARD_METRICS) as [DashboardMetricKey, string][]) {
    const daily = Array<number>(7).fill(0);
    let previous = 0;
    for (const row of days) {
      if (row.event_type !== type) continue;
      const ago = Number(row.ago);
      const n = Number(row.n) || 0;
      if (ago >= 0 && ago <= 6) daily[6 - ago] += n;
      else if (ago >= 7 && ago <= 13) previous += n;
    }
    metrics[key] = { current: daily.reduce((a, b) => a + b, 0), previous, daily };
  }
  for (const row of days) {
    if (row.event_type === "media_kit_view" && Number(row.ago) <= 6) mediaKitViews7d += Number(row.n) || 0;
  }

  const sourceCounts = new Map<TrafficSource, number>();
  for (const row of refs) {
    // Known referrers (Instagram, WhatsApp…) win; otherwise a ?ref=share visit counts as "Shared link".
    let source = classifyReferrer(row.ref, Number(row.ig) === 1);
    if (row.via === "share" && (source === "Direct" || source === "Other")) source = "Shared link";
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + (Number(row.n) || 0));
  }
  const sources = [...sourceCounts.entries()]
    .map(([source, count]) => ({ source, count }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const { series, links, products } = analytics.items;
  const topSeries = pick(series, (s) => s.episodeClicks);
  const topEpisode = topSeries ? pick(topSeries.episodes, (e) => e.clicks) : null;
  const topLink = pick(links, (l) => l.clicks);
  const topProduct = pick(products, (p) => p.clicks);

  // Group children are tracked as "groupId:index"; roll them up to the top-level row.
  const linkRows: Record<string, number> = {};
  for (const l of links) {
    const id = l.id.split(":")[0];
    linkRows[id] = (linkRows[id] ?? 0) + l.clicks;
  }

  const quota = getPlanQuota(linkQuota.plan);
  const limits: DashboardLimitAlert[] = [];
  if (Number.isFinite(quota.maxSeries) && seriesRows.length >= quota.maxSeries) {
    limits.push({ resource: "series", label: "Series", used: seriesRows.length, limit: quota.maxSeries, href: "/dashboard/subscription#plans" });
  }
  if (Number.isFinite(quota.maxEpisodesPerSeries)) {
    for (const s of seriesRows) {
      const used = Number(s.episodes) || 0;
      if (used >= quota.maxEpisodesPerSeries) {
        limits.push({ resource: "episodes", label: `Episodes in “${s.title || "Untitled series"}”`, used, limit: quota.maxEpisodesPerSeries, href: "/dashboard/subscription#plans" });
      }
    }
  }
  if (Number.isFinite(linkQuota.limit) && linkQuota.used >= linkQuota.limit) {
    limits.push({ resource: "links", label: "Links", used: linkQuota.used, limit: linkQuota.limit, href: "/dashboard/subscription#plans" });
  }
  if (Number.isFinite(productQuota.limit) && productQuota.used >= productQuota.limit) {
    limits.push({ resource: "products", label: "Shop products", used: productQuota.used, limit: productQuota.limit, href: "/dashboard/subscription#plans" });
  }

  return {
    inbox: {
      newRequests: Number(requests[0]?.total || 0),
      unreadReviews,
      mediaKitViews7d,
      stalePending: Number(requests[0]?.stale || 0),
    },
    metrics,
    top: {
      link: topLink ? { title: topLink.title, clicks: topLink.clicks } : null,
      series: topSeries
        ? { title: topSeries.title, plays: topSeries.episodeClicks, episode: topEpisode ? { title: topEpisode.title, plays: topEpisode.clicks } : null }
        : null,
      product: topProduct ? { name: topProduct.name, clicks: topProduct.clicks } : null,
    },
    sources,
    rows: {
      series: Object.fromEntries(series.map((s) => [s.id, s.episodeClicks])),
      links: linkRows,
      products: Object.fromEntries(products.map((p) => [p.id, p.clicks])),
    },
    limits,
  };
}
