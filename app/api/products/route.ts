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
    const conn = await db.getConnection();
    let sortOrder = fields.sortOrder;
    try {
      await conn.beginTransaction();
      if (fields.isTopPick) {
        try {
          await conn.query("UPDATE creator_products SET is_top_pick = 0 WHERE creator_id = ?", [auth.creator.id]);
        } catch (e: any) {
          if (e?.code !== "ER_BAD_FIELD_ERROR" && !e?.message?.includes("Unknown column")) throw e;
        }
      }
      try {
        const [maxRows] = await conn.query<any[]>(
          "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM creator_products WHERE creator_id = ?",
          [auth.creator.id]
        );
        if (!sortOrder) {
          sortOrder = maxRows[0]?.next_order ?? 0;
        }
      } catch (e: any) {
        if (e?.code !== "ER_BAD_FIELD_ERROR" && !e?.message?.includes("Unknown column")) throw e;
        if (!sortOrder) sortOrder = 0;
      }
      try {
        await conn.query(
          "INSERT INTO creator_products (id, creator_id, name, image_url, price_paise, product_url, note, coupon_code, discount_text, is_top_pick, sort_order, is_affiliate, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)",
          [
            id,
            auth.creator.id,
            fields.name,
            imageUrl,
            fields.pricePaise,
            fields.url,
            fields.note,
            fields.couponCode,
            fields.discountText,
            fields.isTopPick ? 1 : 0,
            sortOrder,
            fields.isAffiliate ? 1 : 0,
          ],
        );
      } catch (insertErr: any) {
        if (insertErr?.code === "ER_BAD_FIELD_ERROR" || insertErr?.message?.includes("Unknown column")) {
          console.warn("[POST /api/products] New columns missing in creator_products, falling back to legacy insert:", insertErr.message);
          await conn.query(
            "INSERT INTO creator_products (id, creator_id, name, image_url, price_paise, product_url, note, is_affiliate, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)",
            [
              id,
              auth.creator.id,
              fields.name,
              imageUrl,
              fields.pricePaise,
              fields.url,
              fields.note,
              fields.isAffiliate ? 1 : 0,
            ],
          );
        } else {
          throw insertErr;
        }
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    return NextResponse.json(
      toShopProduct({
        id,
        name: fields.name,
        imageUrl,
        pricePaise: fields.pricePaise,
        productUrl: fields.url,
        note: fields.note,
        couponCode: fields.couponCode,
        discountText: fields.discountText,
        isTopPick: fields.isTopPick,
        sortOrder,
        isAffiliate: fields.isAffiliate,
      }),
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ProductValidationError) return errorResponse(error.code, error.message, error.status);
    console.error("POST /api/products failed:", error);
    return errorResponse("SERVER_ERROR", "Could not create product. Please try again.", 500);
  }
}
