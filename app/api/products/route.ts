import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCreator } from "@/lib/creatorAuth";
import { checkPersistentRateLimit } from "@/lib/persistentRateLimit";
import { saveProductImage } from "@/lib/productImage";
import { ProductValidationError, readProductBody, validateProductFields } from "@/lib/productValidation";
import { getCreatorProducts, getProductQuota, limitReachedBody, toShopProduct } from "@/lib/productsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const [products, quota] = await Promise.all([getCreatorProducts(auth.creator.id), getProductQuota(auth.creator.id)]);
    return NextResponse.json(
      {
        items: products.map(toShopProduct),
        used: quota.used,
        // Unlimited plans serialise as null (JSON has no Infinity).
        limit: Number.isFinite(quota.limit) ? quota.limit : null,
        plan: quota.plan,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("GET /api/products failed:", error);
    return errorResponse("SERVER_ERROR", "Could not load products.", 500);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const rate = await checkPersistentRateLimit(`products:${auth.creator.id}`, 30, 600);
    if (!rate.success) return errorResponse("RATE_LIMITED", "Too many requests. Please try again shortly.", 429);

    const quota = await getProductQuota(auth.creator.id);
    if (quota.used >= quota.limit) {
      return NextResponse.json(limitReachedBody(quota.used, quota.limit, quota.planName), { status: 403 });
    }

    const fields = validateProductFields(await readProductBody(req));
    const imageUrl = await saveProductImage(fields.image);

    const id = `prod_${randomUUID()}`;
    await db.query(
      "INSERT INTO creator_products (id, creator_id, name, image_url, price_paise, product_url, note, is_affiliate, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)",
      [id, auth.creator.id, fields.name, imageUrl, fields.pricePaise, fields.url, fields.note, fields.isAffiliate ? 1 : 0],
    );

    return NextResponse.json(
      toShopProduct({ id, name: fields.name, imageUrl, pricePaise: fields.pricePaise, productUrl: fields.url, note: fields.note, isAffiliate: fields.isAffiliate }),
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ProductValidationError) return errorResponse(error.code, error.message, error.status);
    console.error("POST /api/products failed:", error);
    return errorResponse("SERVER_ERROR", "Could not create product. Please try again.", 500);
  }
}
