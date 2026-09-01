import { db } from "@/lib/db";
import { Series } from "@/types";

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

export async function getPublicSeriesData(
  usernameParam: string,
  seriesIdParam: string
): Promise<PublicSeriesData> {
  const cleanUsername = decodeURIComponent(usernameParam || "").trim().toLowerCase();
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
    const [seriesRows]: any = await db.query(
      "SELECT * FROM series WHERE id = ?",
      [cleanSeriesId]
    );

    if (!seriesRows || seriesRows.length === 0) {
      return { series: null, creator: null };
    }

    const s = seriesRows[0];

    const [epRows]: any = await db.query(
      "SELECT * FROM episodes WHERE series_id = ? ORDER BY episode_number ASC",
      [s.id]
    );

    const [creatorRows]: any = await db.query(
      "SELECT * FROM creators WHERE id = ? OR username = ?",
      [s.creator_id, cleanUsername]
    );

    const creator = creatorRows[0] || null;

    let totalFanbase = 0;
    if (creator) {
      const [socRows]: any = await db.query(
        "SELECT SUM(follower_count) as total FROM social_accounts WHERE creator_id = ?",
        [creator.id]
      );
      totalFanbase = Number(socRows[0]?.total || 0);
    }

    const formattedSeries: Series = {
      id: s.id,
      title: s.title,
      posterDataUrl: s.poster_url,
      description: s.description || "",
      genre: s.genres || "",
      language: s.language || "Hindi",
      createdAt: s.created_at ? new Date(s.created_at).toISOString() : new Date().toISOString(),
      seasons: [
        {
          id: `sn_1_${s.id}`,
          title: "Season 1",
          seasonNumber: 1,
          episodes: (epRows || []).map((ep: any) => ({
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
