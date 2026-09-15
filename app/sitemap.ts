import { MetadataRoute } from "next";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";

interface ProfileSitemapRow extends RowDataPacket {
  username: string;
  updated_at: string | Date | null;
  visibility_settings: string | null;
  settings_visibility: string | null;
  series_count: number | string;
  review_count: number | string;
  active_gig_count: number | string;
}

interface SeriesSitemapRow extends RowDataPacket {
  username: string;
  series_id: string;
  updated_at: string | Date | null;
  visibility_settings: string | null;
  settings_visibility: string | null;
}

function parseVisibility(value?: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value) as {
      showSeries?: boolean;
      showReviews?: boolean;
      showCollabGigs?: boolean;
      showInSearchEngines?: boolean;
    };
  } catch {
    return null;
  }
}

function canIndex(row: { visibility_settings?: string | null; settings_visibility?: string | null }) {
  const visibility = parseVisibility(row.settings_visibility || row.visibility_settings);
  return visibility?.showInSearchEngines !== false;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://inflixo.com";

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Dynamic public creator profile routes from database
  let dynamicProfiles: MetadataRoute.Sitemap = [];
  let dynamicSeriesIndexes: MetadataRoute.Sitemap = [];
  let dynamicReviewIndexes: MetadataRoute.Sitemap = [];
  let dynamicMediaKits: MetadataRoute.Sitemap = [];
  let dynamicSeries: MetadataRoute.Sitemap = [];
  try {
    const [rows] = await db.query<ProfileSitemapRow[]>(
      `SELECT
         c.username,
         c.updated_at,
         c.visibility_settings,
         cs.visibility_settings AS settings_visibility,
         (SELECT COUNT(*) FROM series sx WHERE sx.creator_id = c.id) AS series_count,
         (SELECT COUNT(*) FROM creator_reviews rx WHERE rx.creator_id = c.id AND rx.status = 'approved') AS review_count,
         (SELECT COUNT(*) FROM mediakit_gigs mx WHERE mx.creator_id = c.id AND mx.is_active = 1) AS active_gig_count
       FROM creators c
       LEFT JOIN creator_settings cs ON c.id = cs.creator_id
       LEFT JOIN subscriptions s ON c.id = s.creator_id
       WHERE c.username IS NOT NULL
         AND c.username != ''
         AND (
           s.plan_key IS NULL
           OR s.plan_key != 'early_access'
           OR COALESCE(s.trial_ends_at, DATE_ADD(s.activated_at, INTERVAL 7 DAY)) > NOW()
         )`
    );

    const indexableRows = (rows || []).filter(canIndex);

    if (indexableRows.length > 0) {
      dynamicProfiles = indexableRows.map((c) => ({
        url: `${baseUrl}/${c.username}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      }));

      dynamicSeriesIndexes = indexableRows
        .filter((c) => {
          const visibility = parseVisibility(c.settings_visibility || c.visibility_settings);
          return visibility?.showSeries !== false && Number(c.series_count || 0) > 0;
        })
        .map((c) => ({
        url: `${baseUrl}/${c.username}/series`,
        lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }));

      dynamicReviewIndexes = indexableRows
        .filter((c) => {
          const visibility = parseVisibility(c.settings_visibility || c.visibility_settings);
          return visibility?.showReviews !== false && Number(c.review_count || 0) > 0;
        })
        .map((c) => ({
        url: `${baseUrl}/${c.username}/reviews`,
        lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      }));

      dynamicMediaKits = indexableRows
        .filter((c) => {
          const visibility = parseVisibility(c.settings_visibility || c.visibility_settings);
          return visibility?.showCollabGigs !== false && Number(c.active_gig_count || 0) > 0;
        })
        .map((c) => ({
          url: `${baseUrl}/${c.username}/media-kit`,
          lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        }));
    }

    const [seriesRows] = await db.query<SeriesSitemapRow[]>(
      `SELECT
         c.username,
         s.id AS series_id,
         s.updated_at,
         c.visibility_settings,
         cs.visibility_settings AS settings_visibility
       FROM series s
       JOIN creators c ON c.id = s.creator_id
       LEFT JOIN creator_settings cs ON c.id = cs.creator_id
       LEFT JOIN subscriptions sub ON c.id = sub.creator_id
       WHERE c.username IS NOT NULL
         AND c.username != ''
         AND (
           sub.plan_key IS NULL
           OR sub.plan_key != 'early_access'
           OR COALESCE(sub.trial_ends_at, DATE_ADD(sub.activated_at, INTERVAL 7 DAY)) > NOW()
         )`
    );

    dynamicSeries = (seriesRows || [])
      .filter((row) => {
        const visibility = parseVisibility(row.settings_visibility || row.visibility_settings);
        return canIndex(row) && visibility?.showSeries !== false;
      })
      .map((row) => ({
        url: `${baseUrl}/${row.username}/series/${row.series_id}`,
        lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.75,
      }));
  } catch (err) {
    console.warn("Sitemap DB fetch fallback:", err);
  }

  return [
    ...staticRoutes,
    ...dynamicProfiles,
    ...dynamicSeriesIndexes,
    ...dynamicReviewIndexes,
    ...dynamicMediaKits,
    ...dynamicSeries,
  ];
}
