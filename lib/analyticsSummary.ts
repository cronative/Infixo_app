import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { ensureAnalyticsTable } from "@/lib/analyticsDb";

export type AnalyticsPeriod = "7d" | "30d";

export interface AnalyticsTotals {
  profileViews: number;
  seriesOpens: number;
  episodeClicks: number;
  linkClicks: number;
  productClicks: number;
  setupClicks: number;
  mediaKitViews: number;
  collabPackageViews: number;
  collabRequests: number;
}

export interface AnalyticsSummary {
  period: AnalyticsPeriod;
  totals: AnalyticsTotals;
  items: {
    series: { id: string; title: string; opens: number; episodeClicks: number; episodes: { id: string; title: string; clicks: number }[] }[];
    links: { id: string; title: string; clicks: number }[];
    products: { id: string; name: string; clicks: number }[];
    setup: { id: string; name: string; clicks: number }[];
    packages: { id: string; title: string; views: number; requests: number }[];
  };
}

const TOTAL_KEYS: Record<string, keyof AnalyticsTotals> = {
  profile_view: "profileViews",
  series_open: "seriesOpens",
  episode_click: "episodeClicks",
  link_click: "linkClicks",
  product_click: "productClicks",
  setup_click: "setupClicks",
  media_kit_view: "mediaKitViews",
  collab_package_view: "collabPackageViews",
  collab_request_submit: "collabRequests",
};

interface CountRow extends RowDataPacket {
  event_type: string;
  event_target: string | null;
  n: number;
}

const byCountDesc = <T,>(count: (item: T) => number) => (a: T, b: T) => count(b) - count(a);

export function parseAnalyticsPeriod(value: string | null): AnalyticsPeriod {
  return value === "30d" ? "30d" : "7d";
}

export async function getAnalyticsSummary(creatorId: string, period: AnalyticsPeriod): Promise<AnalyticsSummary> {
  await ensureAnalyticsTable();
  const days = period === "30d" ? 30 : 7;

  const [[counts], [series], [episodes], [links], [products], [setup], [packages]] = await Promise.all([
    db.query<CountRow[]>(
      `SELECT event_type, event_target, COUNT(*) AS n
       FROM analytics_events
       WHERE creator_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND event_type IN (?)
       GROUP BY event_type, event_target`,
      [creatorId, days, Object.keys(TOTAL_KEYS)],
    ),
    db.query<RowDataPacket[]>("SELECT id, title FROM series WHERE creator_id = ?", [creatorId]),
    db.query<RowDataPacket[]>(
      `SELECT e.id, e.series_id AS seriesId, e.title, e.episode_number AS episodeNumber
       FROM episodes e INNER JOIN series s ON s.id = e.series_id
       WHERE s.creator_id = ? ORDER BY e.episode_number ASC`,
      [creatorId],
    ),
    db.query<RowDataPacket[]>(
      `SELECT id, parent_id AS parentId, link_type AS linkType, title
       FROM creator_custom_links WHERE creator_id = ?
       ORDER BY sort_order ASC, created_at ASC, id ASC`,
      [creatorId],
    ),
    db.query<RowDataPacket[]>("SELECT id, name FROM creator_products WHERE creator_id = ? AND deleted_at IS NULL", [creatorId]),
    db.query<RowDataPacket[]>("SELECT id, item_name AS name, brand FROM creator_setup_items WHERE creator_id = ?", [creatorId]),
    db.query<RowDataPacket[]>("SELECT id, title FROM mediakit_gigs WHERE creator_id = ? AND is_active = 1", [creatorId]),
  ]);

  const totals = Object.fromEntries(Object.values(TOTAL_KEYS).map((k) => [k, 0])) as unknown as AnalyticsTotals;
  // event_type → event_target → count
  const target = new Map<string, Map<string, number>>();
  for (const row of counts) {
    const n = Number(row.n) || 0;
    totals[TOTAL_KEYS[row.event_type]] += n;
    if (!row.event_target) continue;
    const forType = target.get(row.event_type) ?? new Map<string, number>();
    forType.set(row.event_target, (forType.get(row.event_target) ?? 0) + n);
    target.set(row.event_type, forType);
  }
  const countOf = (type: string, key: string) => target.get(type)?.get(key) ?? 0;

  const episodesBySeries = new Map<string, RowDataPacket[]>();
  for (const ep of episodes) {
    const list = episodesBySeries.get(String(ep.seriesId)) ?? [];
    list.push(ep);
    episodesBySeries.set(String(ep.seriesId), list);
  }

  const seriesItems = series.map((s) => {
    const id = String(s.id);
    const eps = (episodesBySeries.get(id) ?? []).map((ep) => ({
      id: String(ep.id),
      title: ep.title || `Episode ${ep.episodeNumber}`,
      clicks: countOf("episode_click", `${id}:${ep.id}`),
    }));
    return {
      id,
      title: s.title || "Untitled series",
      opens: countOf("series_open", id),
      episodeClicks: eps.reduce((sum, ep) => sum + ep.clicks, 0),
      episodes: eps.sort(byCountDesc((ep) => ep.clicks)),
    };
  }).sort(byCountDesc((s) => s.opens + s.episodeClicks));

  // Single links count by id; a group's children count as "groupId:childIndex".
  const childrenByGroup = new Map<string, RowDataPacket[]>();
  for (const link of links) {
    if (!link.parentId) continue;
    const list = childrenByGroup.get(String(link.parentId)) ?? [];
    list.push(link);
    childrenByGroup.set(String(link.parentId), list);
  }
  const linkItems = links
    .filter((link) => !link.parentId)
    .flatMap((link) => {
      const id = String(link.id);
      if (link.linkType !== "collection") return [{ id, title: link.title || "Link", clicks: countOf("link_click", id) }];
      return (childrenByGroup.get(id) ?? []).map((child, index) => ({
        id: `${id}:${index}`,
        title: `${link.title || "Group"} › ${child.title || "Link"}`,
        clicks: countOf("link_click", `${id}:${index}`),
      }));
    })
    .sort(byCountDesc((l) => l.clicks));

  return {
    period,
    totals,
    items: {
      series: seriesItems,
      links: linkItems,
      products: products
        .map((p) => ({ id: String(p.id), name: p.name || "Product", clicks: countOf("product_click", String(p.id)) }))
        .sort(byCountDesc((p) => p.clicks)),
      setup: setup
        .map((g) => ({
          id: String(g.id),
          name: [g.brand, g.name].filter(Boolean).join(" ") || "Gear item",
          clicks: countOf("setup_click", String(g.id)),
        }))
        .sort(byCountDesc((g) => g.clicks)),
      packages: packages
        .map((p) => ({
          id: String(p.id),
          title: p.title || "Package",
          views: countOf("collab_package_view", String(p.id)),
          requests: countOf("collab_request_submit", String(p.id)),
        }))
        .sort(byCountDesc((p) => p.views + p.requests)),
    },
  };
}
