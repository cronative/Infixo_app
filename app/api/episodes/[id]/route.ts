import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireCreator } from "@/lib/creatorAuth";
import { validateVideoUrl } from "@/lib/videoUrl";
import { apiSuccess, apiError } from "@/lib/apiResponse";

// PATCH /api/episodes/:id (Update episode title, url)
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const { id: episodeId } = await context.params;
    if (!episodeId) {
      return apiError("Episode ID is required", 400);
    }

    // Verify ownership via series
    const [epRows]: any = await db.query(
      `SELECT e.id, e.series_id, e.title, e.external_url, e.platform, s.platform AS series_platform
       FROM episodes e
       INNER JOIN series s ON s.id = e.series_id
       WHERE e.id = ? AND s.creator_id = ?`,
      [episodeId, auth.creator.id]
    );

    if (!epRows || epRows.length === 0) {
      return apiError("Episode not found or not owned by you", 404);
    }

    const current = epRows[0];
    const body = await req.json();
    const { title, url, externalUrl } = body;

    const updates: string[] = [];
    const params: any[] = [];

    if (title !== undefined) {
      const cleanTitle = String(title).trim();
      if (!cleanTitle) {
        return apiError("Episode title cannot be empty", 400);
      }
      updates.push("title = ?");
      params.push(cleanTitle);
    }

    const rawUrl = url !== undefined ? url : externalUrl;
    if (rawUrl !== undefined) {
      const { validateUrlForSeriesPlatform } = await import("@/lib/videoUrl");
      const validation = validateUrlForSeriesPlatform(String(rawUrl).trim(), current.series_platform || "YouTube");
      if (!validation.allowed) {
        return apiError(
          validation.reason || "Please enter a valid video link for this platform.",
          400,
          { code: "INVALID_PLATFORM_URL" }
        );
      }
      updates.push("external_url = ?");
      params.push(validation.normalizedUrl);

      updates.push("platform = ?");
      params.push(validation.detectedPlatform);
    }

    if (updates.length === 0) {
      return apiSuccess({ episodeId }, "No changes provided");
    }

    params.push(episodeId);
    await db.query(`UPDATE episodes SET ${updates.join(", ")} WHERE id = ?`, params);

    return apiSuccess({ episodeId }, "Episode updated successfully");
  } catch (err: any) {
    console.error("PATCH /api/episodes/:id error:", err);
    return apiError(err.message || "Failed to update episode", 500);
  }
}

// DELETE /api/episodes/:id (Delete episode)
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const { id: episodeId } = await context.params;
    if (!episodeId) {
      return apiError("Episode ID is required", 400);
    }

    // Verify ownership and get series_id to renumber
    const [epRows]: any = await db.query(
      `SELECT e.id, e.series_id
       FROM episodes e
       INNER JOIN series s ON s.id = e.series_id
       WHERE e.id = ? AND s.creator_id = ?`,
      [episodeId, auth.creator.id]
    );

    if (!epRows || epRows.length === 0) {
      return apiError("Episode not found or not owned by you", 404);
    }

    const seriesId = epRows[0].series_id;

    // Delete episode
    await db.query("DELETE FROM episodes WHERE id = ?", [episodeId]);

    // Renumber remaining episodes in order
    const [remaining]: any = await db.query(
      "SELECT id FROM episodes WHERE series_id = ? ORDER BY episode_number ASC, created_at ASC",
      [seriesId]
    );

    for (let i = 0; i < remaining.length; i++) {
      await db.query("UPDATE episodes SET episode_number = ? WHERE id = ?", [i + 1, remaining[i].id]);
    }

    return apiSuccess({ episodeId, seriesId }, "Episode deleted successfully");
  } catch (err: any) {
    console.error("DELETE /api/episodes/:id error:", err);
    return apiError(err.message || "Failed to delete episode", 500);
  }
}
