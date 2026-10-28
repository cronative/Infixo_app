import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCreator } from "@/lib/creatorAuth";
import { apiSuccess, apiError } from "@/lib/apiResponse";

// PUT /api/series/order (Reorder series)
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return apiError("Array of series IDs is required", 400);
    }

    const creatorId = auth.creator.id;

    // Execute order updates in a transaction
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      for (let index = 0; index < ids.length; index++) {
        await connection.query(
          "UPDATE series SET display_order = ? WHERE id = ? AND creator_id = ?",
          [index + 1, ids[index], creatorId]
        );
      }

      await connection.commit();
    } catch (txErr) {
      await connection.rollback();
      throw txErr;
    } finally {
      connection.release();
    }

    return apiSuccess({ count: ids.length }, "Series order updated successfully");
  } catch (err: any) {
    console.error("PUT /api/series/order error:", err);
    return apiError(err.message || "Failed to update series order", 500);
  }
}
