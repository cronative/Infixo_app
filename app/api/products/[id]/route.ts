import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { db } from "@/lib/db";
import { requireCreator } from "@/lib/creatorAuth";
import { checkPersistentRateLimit } from "@/lib/persistentRateLimit";
import { saveProductImage } from "@/lib/productImage";
import { ProductValidationError, readProductBody, validateProductFields, validateProductId } from "@/lib/productValidation";
import { getCreatorProduct, toShopProduct } from "@/lib/productsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const rate = await checkPersistentRateLimit(`products:${auth.creator.id}`, 30, 600);
    if (!rate.success) return errorResponse("RATE_LIMITED", "Too many requests. Please try again shortly.", 429);

    const id = validateProductId((await params).id);
    const existing = await getCreatorProduct(auth.creator.id, id);
    if (!existing) return errorResponse("NOT_FOUND", "Product not found.", 404);

    const fields = validateProductFields(await readProductBody(req));
    const imageUrl = await saveProductImage(fields.image, existing.imageUrl);

    const [result] = await db.query<ResultSetHeader>(
      "UPDATE creator_products SET name = ?, image_url = ?, price_paise = ?, product_url = ?, note = ?, is_affiliate = ? WHERE id = ? AND creator_id = ? AND deleted_at IS NULL",
      [fields.name, imageUrl, fields.pricePaise, fields.url, fields.note, fields.isAffiliate ? 1 : 0, id, auth.creator.id],
    );
    if (!result.affectedRows) return errorResponse("NOT_FOUND", "Product not found.", 404);

    return NextResponse.json(
      toShopProduct({ id, name: fields.name, imageUrl, pricePaise: fields.pricePaise, productUrl: fields.url, note: fields.note, isAffiliate: fields.isAffiliate }),
    );
  } catch (error) {
    if (error instanceof ProductValidationError) return errorResponse(error.code, error.message, error.status);
    console.error("PATCH /api/products/:id failed:", error);
    return errorResponse("SERVER_ERROR", "Could not update product. Please try again.", 500);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const id = validateProductId((await params).id);
    // Soft delete so the Undo toast can restore it.
    const [result] = await db.query<ResultSetHeader>(
      "UPDATE creator_products SET deleted_at = NOW() WHERE id = ? AND creator_id = ? AND deleted_at IS NULL",
      [id, auth.creator.id],
    );
    if (!result.affectedRows) return errorResponse("NOT_FOUND", "Product not found.", 404);

    return NextResponse.json({ id });
  } catch (error) {
    if (error instanceof ProductValidationError) return errorResponse(error.code, error.message, error.status);
    console.error("DELETE /api/products/:id failed:", error);
    return errorResponse("SERVER_ERROR", "Could not delete product.", 500);
  }
}
