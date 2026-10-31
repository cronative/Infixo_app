import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireCreator } from "@/lib/creatorAuth";
import { apiSuccess, apiError } from "@/lib/apiResponse";

// PUT /api/series/:id/episodes/order (Reorder episodes in a series)
export async function PUT(
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

    const creatorId = auth.creator.id;

    // Verify ownership of the series
    const [seriesRows]: any = await db.query(
      "SELECT id FROM series WHERE id = ? AND creator_id = ?",
      [seriesId, creatorId]
    );

    if (!seriesRows || seriesRows.length === 0) {
      return apiError("Series not found or not owned by you", 404);
    }

    const body = await req.json();
    const ids = body.ids || body.episodeIds;

    if (!Array.isArray(ids) || ids.length === 0) {
      return apiError("Array of episode IDs is required", 400);
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      for (let i = 0; i < ids.length; i++) {
        await connection.query(
          "UPDATE episodes SET episode_number = ? WHERE id = ? AND series_id = ?",
          [i + 1, ids[i], seriesId]
        );
      }

      await connection.commit();
    } catch (txErr) {
      await connection.rollback();
      throw txErr;
    } finally {
      connection.release();
    }

    return apiSuccess({ count: ids.length }, "Episode order updated successfully");
  } catch (err: any) {
    console.error("PUT /api/series/:id/episodes/order error:", err);
    return apiError(err.message || "Failed to update episode order", 500);
  }
}

export const POST = PUT;
