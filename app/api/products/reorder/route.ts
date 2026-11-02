import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCreator } from "@/lib/creatorAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.ids)) {
      return NextResponse.json({ error: { code: "INVALID_BODY", message: "Expected ids array." } }, { status: 400 });
    }

    const validIds: string[] = [];
    for (const id of body.ids) {
      if (typeof id === "string" && /^prod_[a-f0-9-]{36}$/.test(id)) {
        validIds.push(id);
      }
    }

    if (validIds.length === 0) {
      return NextResponse.json({ success: true });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      for (let index = 0; index < validIds.length; index++) {
        await conn.query(
          "UPDATE creator_products SET sort_order = ? WHERE id = ? AND creator_id = ? AND deleted_at IS NULL",
          [index, validIds[index], auth.creator.id]
        );
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/products/reorder failed:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Could not reorder products." } }, { status: 500 });
  }
}
