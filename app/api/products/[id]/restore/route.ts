import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { db } from "@/lib/db";
import { requireCreator } from "@/lib/creatorAuth";
import { ProductValidationError, validateProductId } from "@/lib/productValidation";
import { getCreatorProduct, getProductQuota, limitReachedBody, toShopProduct } from "@/lib/productsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Undo for DELETE /api/products/:id. Still counts against the plan limit. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const id = validateProductId((await params).id);
    const product = await getCreatorProduct(auth.creator.id, id, { deleted: true });
    if (!product) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Product not found." } }, { status: 404 });

    const quota = await getProductQuota(auth.creator.id);
    if (quota.used >= quota.limit) {
      return NextResponse.json(limitReachedBody(quota.used, quota.limit, quota.planName), { status: 403 });
    }

    const [result] = await db.query<ResultSetHeader>(
      "UPDATE creator_products SET deleted_at = NULL WHERE id = ? AND creator_id = ? AND deleted_at IS NOT NULL",
      [id, auth.creator.id],
    );
    if (!result.affectedRows) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Product not found." } }, { status: 404 });

    return NextResponse.json(toShopProduct(product));
  } catch (error) {
    if (error instanceof ProductValidationError) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: error.message } }, { status: 422 });
    }
    console.error("POST /api/products/:id/restore failed:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Could not restore product." } }, { status: 500 });
  }
}
