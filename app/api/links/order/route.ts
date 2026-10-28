import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { requireCreator } from "@/lib/creatorAuth";
import { withTransaction } from "@/lib/linksDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** Sets `position` (sort_order) for every top-level link. `ids` must list each of them exactly once. */
export async function PUT(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const body = await req.json().catch(() => null);
    const ids: unknown = body?.ids;
    if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string")) {
      return errorResponse("INVALID_ORDER", "ids must be an array of link IDs.", 400);
    }

    const [rows] = await db.query<(RowDataPacket & { id: string })[]>(
      "SELECT id FROM creator_custom_links WHERE creator_id = ? AND parent_id IS NULL",
      [auth.creator.id],
    );
    const current = new Set(rows.map((row) => row.id));
    if (ids.length !== current.size || new Set(ids).size !== ids.length || !ids.every((id) => current.has(id))) {
      return errorResponse("INVALID_ORDER", "The list changed. Refresh and try again.", 409);
    }

    await withTransaction(async (connection) => {
      for (const [index, id] of (ids as string[]).entries()) {
        await connection.query("UPDATE creator_custom_links SET sort_order = ? WHERE id = ? AND creator_id = ?", [index, id, auth.creator.id]);
      }
    });
    return NextResponse.json({ ids });
  } catch (error) {
    console.error("PUT /api/links/order failed:", error);
    return errorResponse("SERVER_ERROR", "Could not save the new order.", 500);
  }
}
