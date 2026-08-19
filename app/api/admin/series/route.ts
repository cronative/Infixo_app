import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    let seriesList: any[] = [];
    try {
      const [seriesRows]: any = await db.query(`
        SELECT 
          s.*,
          c.email AS creatorEmail,
          c.display_name AS creatorName,
          c.username AS creatorUsername
        FROM series s
        LEFT JOIN creators c ON s.creator_id = c.id
        ORDER BY s.id DESC
      `);

      if (Array.isArray(seriesRows) && seriesRows.length > 0) {
        const seriesIds = seriesRows.map((s) => s.id);
        const [episodesRows]: any = await db.query(
          `SELECT * FROM episodes WHERE series_id IN (?) ORDER BY episode_number ASC`,
          [seriesIds]
        );

        const episodesMap: Record<string, any[]> = {};
        if (Array.isArray(episodesRows)) {
          episodesRows.forEach((ep) => {
            if (!episodesMap[ep.series_id]) {
              episodesMap[ep.series_id] = [];
            }
            episodesMap[ep.series_id].push({
              id: String(ep.id),
              episodeNumber: ep.episode_number,
              title: ep.title,
              thumbnailDataUrl: ep.thumbnail_url,
              platform: ep.platform || "YouTube",
              externalUrl: ep.external_url || "",
              description: ep.description || "",
            });
          });
        }

        seriesList = seriesRows.map((s) => {
          const eps = episodesMap[s.id] || [];
          return {
            id: s.id,
            creatorId: s.creator_id,
            creatorEmail: s.creatorEmail || "",
            creatorName: s.creatorName || "",
            creatorUsername: s.creatorUsername || "",
            title: s.title,
            posterDataUrl: s.poster_url,
            description: s.description || "",
            genre: s.genres || s.genre || "General",
            language: s.language || "English",
            createdAt: s.created_at,
            seasons: [
              {
                id: `s1_${s.id}`,
                seasonNumber: 1,
                title: "Season 1",
                episodes: eps,
              },
            ],
          };
        });
      }
    } catch (dbErr) {
      console.warn("Admin series DB fetch fallback:", dbErr);
    }

    return NextResponse.json({
      success: true,
      series: seriesList,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
