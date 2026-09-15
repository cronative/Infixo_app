import { db } from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { Series, VisibilitySettings } from "@/types";

export interface PublicCreatorInfo {
  displayName: string;
  username: string;
  photoDataUrl: string | null;
  bio?: string | null;
  category?: string | null;
  themeKey?: string;
  totalFanbase?: number;
}

export interface PublicSeriesData {
  series: Series | null;
  creator: PublicCreatorInfo | null;
}

interface PublicSeriesRow extends RowDataPacket {
  id: string;
  creator_id: string;
  title: string;
  poster_url?: string | null;
  description?: string | null;
  genres?: string | null;
  language?: string | null;
  created_at?: string | Date | null;
}

interface PublicEpisodeRow extends RowDataPacket {
  id: string;
  episode_number: number;
  title: string;
  platform?: string | null;
  external_url?: string | null;
}

interface PublicCreatorRow extends RowDataPacket {
  id: string;
  username?: string | null;
  display_name?: string | null;
  photo_url?: string | null;
  bio?: string | null;
  category?: string | null;
  theme_key?: string | null;
  visibility_settings?: string | null;
  settings_visibility?: string | null;
  plan_key?: string | null;
  sub_status?: string | null;
  sub_activated_at?: string | Date | null;
  sub_trial_ends_at?: string | Date | null;
}

interface TotalFanbaseRow extends RowDataPacket {
  total?: number | string | null;
}

function parseVisibilitySettings(value: unknown): VisibilitySettings | null {
  if (!value) return null;
  if (typeof value === "object") return value as VisibilitySettings;
  if (typeof value !== "string") return null;

  try {
    return JSON.parse(value) as VisibilitySettings;
  } catch {
    return null;
  }
}

function toDateMs(value?: string | Date | null) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function isTrialPrivate(creator?: PublicCreatorRow | null) {
  if (!creator || creator.plan_key !== "early_access") return false;
  if (creator.sub_status && !["active", "trial"].includes(creator.sub_status)) return true;

  const explicitEndMs = toDateMs(creator.sub_trial_ends_at);
  if (explicitEndMs) return Date.now() > explicitEndMs;

  const activatedMs = toDateMs(creator.sub_activated_at);
  return activatedMs ? Date.now() - activatedMs > 7 * 24 * 60 * 60 * 1000 : false;
}

export async function getPublicSeriesData(
  usernameParam: string,
  seriesIdParam: string
): Promise<PublicSeriesData> {
  const rawUsername = decodeURIComponent(usernameParam || "").trim();
  const cleanUsername = rawUsername.replace(/^@/, "").toLowerCase();
  const cleanSeriesId = decodeURIComponent(seriesIdParam || "").trim();

  if (!cleanSeriesId) {
    return { series: null, creator: null };
  }

  // Check demo creator mock data
  if (cleanUsername === "demo_creator") {
    try {
      const { EXPERT_DEMO_SERIES, EXPERT_DEMO_PROFILE } = await import("@/data/expertDemoCreator");
      const found = EXPERT_DEMO_SERIES.find((s) => s.id === cleanSeriesId);
      if (found) {
        return {
          series: found,
          creator: {
            displayName: EXPERT_DEMO_PROFILE.displayName,
            username: EXPERT_DEMO_PROFILE.username,
            photoDataUrl: EXPERT_DEMO_PROFILE.photoDataUrl,
            bio: EXPERT_DEMO_PROFILE.bio,
            category: EXPERT_DEMO_PROFILE.category,
            themeKey: "minimal-white",
            totalFanbase: 1345000,
          },
        };
      }
    } catch (err) {
      console.warn("Error loading demo series data:", err);
    }
  }

  // Query MySQL DB
  try {
    const [seriesRows] = await db.query<PublicSeriesRow[]>(
      "SELECT * FROM series WHERE id = ?",
      [cleanSeriesId]
    );

    if (!seriesRows || seriesRows.length === 0) {
      return { series: null, creator: null };
    }

    const s = seriesRows[0];

    const [epRows] = await db.query<PublicEpisodeRow[]>(
      "SELECT * FROM episodes WHERE series_id = ? ORDER BY episode_number ASC",
      [s.id]
    );

    const [creatorRows] = await db.query<PublicCreatorRow[]>(
      `SELECT c.*, cs.visibility_settings AS settings_visibility,
              sub.plan_key, sub.status AS sub_status,
              sub.activated_at AS sub_activated_at,
              sub.trial_ends_at AS sub_trial_ends_at
       FROM creators c
       LEFT JOIN creator_settings cs ON c.id = cs.creator_id
       LEFT JOIN subscriptions sub ON c.id = sub.creator_id
       WHERE LOWER(c.username) = ? OR c.username = ? OR LOWER(c.username) = ?
       LIMIT 1`,
      [cleanUsername, rawUsername, `@${cleanUsername}`]
    );

    const creator = creatorRows[0] || null;

    // Verify creator exists and owns this series
    if (!creator || String(creator.id) !== String(s.creator_id)) {
      return { series: null, creator: null };
    }

    const visibilitySettings = parseVisibilitySettings(creator.settings_visibility || creator.visibility_settings);
    if (visibilitySettings?.showSeries === false || visibilitySettings?.showInSearchEngines === false || isTrialPrivate(creator)) {
      return { series: null, creator: null };
    }

    let totalFanbase = 0;
    if (creator) {
      const [socRows] = await db.query<TotalFanbaseRow[]>(
        "SELECT SUM(follower_count) as total FROM social_accounts WHERE creator_id = ?",
        [creator.id]
      );
      totalFanbase = Number(socRows[0]?.total || 0);
    }

    const formattedSeries: Series = {
      id: s.id,
      title: s.title,
      posterDataUrl: s.poster_url || null,
      description: s.description || "",
      genre: s.genres || "",
      language: s.language || "Hindi",
      createdAt: s.created_at ? new Date(s.created_at).toISOString() : new Date().toISOString(),
      seasons: [
        {
          id: `sn_1_${s.id}`,
          title: "Season 1",
          seasonNumber: 1,
          episodes: (epRows || []).map((ep) => ({
            id: ep.id,
            episodeNumber: ep.episode_number,
            title: ep.title,
            thumbnailDataUrl: null,
            platform: ep.platform || "YouTube",
            externalUrl: ep.external_url || "",
            description: "",
          })),
        },
      ],
    };

    const formattedCreator: PublicCreatorInfo | null = creator
      ? {
          displayName: creator.display_name || cleanUsername,
          username: creator.username || cleanUsername,
          photoDataUrl: creator.photo_url || null,
          bio: creator.bio || null,
          category: creator.category || null,
          themeKey: creator.theme_key || "minimal-white",
          totalFanbase,
        }
      : null;

    return {
      series: formattedSeries,
      creator: formattedCreator,
    };
  } catch (err) {
    console.error("Failed to query series from database:", err);
    return { series: null, creator: null };
  }
}
