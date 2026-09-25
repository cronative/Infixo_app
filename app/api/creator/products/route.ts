import { randomUUID } from "crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { requireCreator } from "@/lib/creatorAuth";
import { apiError, apiSuccess } from "@/lib/apiResponse";
import { checkPersistentRateLimit } from "@/lib/persistentRateLimit";
import { getCreatorProducts, PRODUCT_COLUMNS } from "@/lib/productsDb";
import { saveProductImage } from "@/lib/productImage";
import { ProductValidationError, readProductBody, validateProductFields, validateProductId } from "@/lib/productValidation";
import { getPlanQuota } from "@/services/subscriptionLimits";
import type { CreatorProduct } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function failure(error: unknown) {
  if (error instanceof ProductValidationError) return apiError(error.message, 422);
  console.error("Products operation failed:", error);
  const message = error instanceof Error && error.message ? error.message : "Could not complete the product request. Please try again.";
  return apiError(message, 500);
}

export async function GET(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    return apiSuccess({ products: await getCreatorProducts(auth.creator.id) }, "Products loaded.", { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}

async function save(req: Request, updating: boolean) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const limit = await checkPersistentRateLimit(`products:${auth.creator.id}`, 30, 600);
    if (!limit.success) return apiError("Too many requests. Please try again shortly.", 429);
    const id = updating ? validateProductId(new URL(req.url).searchParams.get("id")) : `prod_${randomUUID()}`;
    let existing: CreatorProduct | undefined;
    if (updating) {
      const [rows] = await db.query<(RowDataPacket & CreatorProduct)[]>(`SELECT ${PRODUCT_COLUMNS} FROM creator_products WHERE id = ? AND creator_id = ?`, [id, auth.creator.id]);
      existing = rows[0];
      if (!existing) return apiError("Product not found.", 404);
    } else {
      const [subRows]: any = await db.query(
        "SELECT plan_key FROM subscriptions WHERE creator_id = ? AND status = 'active' ORDER BY updated_at DESC LIMIT 1",
        [auth.creator.id]
      );
      const activePlanKey = subRows[0]?.plan_key || "early_access";
      const quota = getPlanQuota(activePlanKey);

      const [totalProductRows]: any = await db.query(
        "SELECT COUNT(*) as count FROM creator_products WHERE creator_id = ?",
        [auth.creator.id]
      );
      const currentProductsCount = Number(totalProductRows[0]?.count || 0);
      if (currentProductsCount >= quota.maxProducts) {
        return apiError(
          `Product limit reached (${quota.maxProducts} max) for ${quota.name} plan. Upgrade your plan to add more products.`,
          403,
          { isLimitReached: true, type: "product" }
        );
      }
    }
    const fields = validateProductFields(await readProductBody(req));
    const imageUrl = await saveProductImage(fields.image, existing?.imageUrl);
    if (updating) {
      const [result] = await db.query<ResultSetHeader>("UPDATE creator_products SET name = ?, image_url = ?, price_paise = ?, product_url = ? WHERE id = ? AND creator_id = ?", [fields.name, imageUrl, fields.pricePaise, fields.productUrl, id, auth.creator.id]);
      if (!result.affectedRows) return apiError("Product not found.", 404);
    } else {
      await db.query("INSERT INTO creator_products (id, creator_id, name, image_url, price_paise, product_url) VALUES (?, ?, ?, ?, ?, ?)", [id, auth.creator.id, fields.name, imageUrl, fields.pricePaise, fields.productUrl]);
    }
    return apiSuccess({ product: { id, name: fields.name, imageUrl, pricePaise: fields.pricePaise, productUrl: fields.productUrl } }, updating ? "Product updated." : "Product added.", { status: updating ? 200 : 201 });
  } catch (error) { return failure(error); }
}

export async function POST(req: Request) { return save(req, false); }
export async function PATCH(req: Request) { return save(req, true); }

export async function DELETE(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const id = validateProductId(new URL(req.url).searchParams.get("id"));
    const [result] = await db.query<ResultSetHeader>("DELETE FROM creator_products WHERE id = ? AND creator_id = ?", [id, auth.creator.id]);
    if (!result.affectedRows) return apiError("Product not found.", 404);
    return apiSuccess({}, "Product deleted.");
  } catch (error) { return failure(error); }
}
