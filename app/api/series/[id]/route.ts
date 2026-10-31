import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCreator } from "@/lib/creatorAuth";
import { saveBase64ImageToStorage } from "@/lib/imageStorage";
import { apiSuccess, apiError } from "@/lib/apiResponse";

// GET /api/series/:id (Get single series details)
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: seriesId } = await context.params;
    if (!seriesId) {
      return apiError("Series ID is required", 400);
    }

    const [rows]: any = await db.query(
      `SELECT s.*, 
        COALESCE(
          (SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', e.id,
              'episodeNumber', e.episode_number,
              'title', e.title,
              'externalUrl', e.external_url,
              'platform', e.platform
            )
          ) FROM episodes e WHERE e.series_id = s.id ORDER BY e.episode_number ASC),
          JSON_ARRAY()
        ) as episodes
       FROM series s WHERE s.id = ?`,
      [seriesId]
    );

    if (!rows || rows.length === 0) {
      return apiError("Series not found", 404);
    }

    const series = rows[0];
    if (typeof series.episodes === "string") {
      try { series.episodes = JSON.parse(series.episodes); } catch {}
    }

    return apiSuccess({ series }, "Series details retrieved successfully");
  } catch (err: any) {
    console.error("GET /api/series/:id error:", err);
    return apiError(err.message || "Failed to fetch series", 500);
  }
}

// PATCH /api/series/:id (Update series title, description, cover, genres, language, platform)
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const { id: seriesId } = await context.params;
    if (!seriesId) {
      return apiError("Series ID is required", 400);
    }

    const body = await req.json();
    const { title, description, posterDataUrl, genre, genres, language, platform } = body;

    const [existing]: any = await db.query(
      "SELECT id FROM series WHERE id = ? AND creator_id = ?",
      [seriesId, auth.creator.id]
    );

    if (!existing || existing.length === 0) {
      return apiError("Series not found or not owned by you", 404);
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (title !== undefined) {
      const cleanTitle = String(title).trim();
      if (!cleanTitle) {
        return apiError("Title cannot be empty", 400);
      }
      updates.push("title = ?");
      params.push(cleanTitle);
    }

    if (description !== undefined) {
      updates.push("description = ?");
      params.push(String(description).trim());
    }

    if (posterDataUrl !== undefined) {
      const finalPosterUrl =
        (await saveBase64ImageToStorage(posterDataUrl, "posters", "poster")) ||
        (posterDataUrl && !posterDataUrl.startsWith("data:") ? posterDataUrl : null);
      updates.push("poster_url = ?");
      params.push(finalPosterUrl);
    }

    const genreVal = genre !== undefined ? genre : genres;
    if (genreVal !== undefined) {
      updates.push("genres = ?");
      params.push(String(genreVal).trim());
    }

    if (language !== undefined) {
      updates.push("language = ?");
      params.push(String(language).trim());
    }

    if (platform !== undefined) {
      const newPlatform = String(platform).trim() || "YouTube";
      const validPlatforms = ["YouTube", "Instagram", "Facebook", "Mix"];
      if (!validPlatforms.includes(newPlatform)) {
        return apiError("Platform must be YouTube, Instagram, Facebook, or Mix", 400);
      }

      // Check current episodes
      const [currentEpisodes]: any = await db.query(
        "SELECT external_url, platform FROM episodes WHERE series_id = ?",
        [seriesId]
      );

      const { canSwitchSeriesPlatform } = await import("@/lib/videoUrl");
      const switchCheck = canSwitchSeriesPlatform(currentEpisodes || [], newPlatform);
      if (!switchCheck.canSwitch) {
        return apiError(
          switchCheck.reason || `Remove non-${newPlatform} episodes first`,
          400,
          { code: "CANNOT_SWITCH_PLATFORM" }
        );
      }

      updates.push("platform = ?");
      params.push(newPlatform);
    }

    if (updates.length > 0) {
      params.push(seriesId, auth.creator.id);
      await db.query(
        `UPDATE series SET ${updates.join(", ")} WHERE id = ? AND creator_id = ?`,
        params
      );
    }

    if (Array.isArray(body.episodes)) {
      const { validateUrlForSeriesPlatform } = await import("@/lib/videoUrl");
      const [seriesRow]: any = await db.query("SELECT platform FROM series WHERE id = ?", [seriesId]);
      const finalPlatform = platform || seriesRow?.[0]?.platform || "YouTube";

      await db.query("DELETE FROM episodes WHERE series_id = ?", [seriesId]);

      for (let i = 0; i < body.episodes.length; i++) {
        const ep = body.episodes[i];
        const rawUrl = ep.externalUrl || ep.url || "";
        const validation = validateUrlForSeriesPlatform(rawUrl, finalPlatform);
        const epPlatform = validation.detectedPlatform || "YouTube";
        const epId =
          ep.id && !ep.id.startsWith("row_") && !ep.id.startsWith("ep_preview_")
            ? ep.id
            : `ep_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
        const epNum = ep.number || ep.episodeNumber || i + 1;
        const epTitle = (ep.title || `Episode ${epNum}`).trim();

        await db.query(
          `INSERT INTO episodes (id, series_id, episode_number, title, external_url, platform)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [epId, seriesId, epNum, epTitle, validation.normalizedUrl || rawUrl, epPlatform]
        );
      }
    }

    return apiSuccess({ seriesId }, "Series updated successfully");
  } catch (err: any) {
    console.error("PATCH /api/series/:id error:", err);
    return apiError(err.message || "Failed to update series", 500);
  }
}

// DELETE /api/series/:id (Delete series and all episodes)
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const { id: seriesId } = await context.params;
    if (!seriesId) {
      return apiError("Series ID is required", 400);
    }

    const [existing]: any = await db.query(
      "SELECT id FROM series WHERE id = ? AND creator_id = ?",
      [seriesId, auth.creator.id]
    );

    if (!existing || existing.length === 0) {
      return apiError("Series not found or not owned by you", 404);
    }

    // Delete episodes first
    await db.query("DELETE FROM episodes WHERE series_id = ?", [seriesId]);
    // Delete series
    await db.query("DELETE FROM series WHERE id = ? AND creator_id = ?", [
      seriesId,
      auth.creator.id,
    ]);

    return apiSuccess({ seriesId }, "Series deleted successfully");
  } catch (err: any) {
    console.error("DELETE /api/series/:id error:", err);
    return apiError(err.message || "Failed to delete series", 500);
  }
}
