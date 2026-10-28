import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { getPlanQuota } from "@/services/subscriptionLimits";
import type { CreatorProduct, ShopProduct } from "@/types";

export const PRODUCT_COLUMNS = "id, name, image_url AS imageUrl, price_paise AS pricePaise, product_url AS productUrl, note, is_affiliate AS isAffiliate";

type ProductRow = RowDataPacket & {
  id: string;
  name: string;
  imageUrl: string;
  pricePaise: number | string | null;
  productUrl: string;
  note: string | null;
  isAffiliate: number | boolean | null;
};

function mapRow(row: ProductRow): CreatorProduct {
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.imageUrl,
    pricePaise: row.pricePaise === null ? null : Number(row.pricePaise),
    productUrl: row.productUrl,
    note: row.note || null,
    isAffiliate: row.isAffiliate === null || row.isAffiliate === undefined ? true : Boolean(row.isAffiliate),
  };
}

/** Shape returned by /api/products: whole rupees, `{ url, name, image, price, note, isAffiliate }`. */
export function toShopProduct(product: CreatorProduct): ShopProduct {
  return {
    id: product.id,
    url: product.productUrl,
    name: product.name,
    image: product.imageUrl,
    price: product.pricePaise === null ? null : Math.round(product.pricePaise / 100),
    note: product.note || "",
    isAffiliate: product.isAffiliate !== false,
  };
}

export async function getCreatorProducts(creatorId: string): Promise<CreatorProduct[]> {
  const [rows] = await db.query<ProductRow[]>(
    `SELECT ${PRODUCT_COLUMNS} FROM creator_products WHERE creator_id = ? AND deleted_at IS NULL ORDER BY created_at ASC, id ASC`,
    [creatorId],
  );
  return rows.map(mapRow);
}

export async function getCreatorProduct(creatorId: string, id: string, { deleted = false } = {}): Promise<CreatorProduct | null> {
  const [rows] = await db.query<ProductRow[]>(
    `SELECT ${PRODUCT_COLUMNS} FROM creator_products WHERE id = ? AND creator_id = ? AND deleted_at IS ${deleted ? "NOT NULL" : "NULL"} LIMIT 1`,
    [id, creatorId],
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function getProductQuota(creatorId: string) {
  const [subRows] = await db.query<(RowDataPacket & { plan_key: string })[]>(
    "SELECT plan_key FROM subscriptions WHERE creator_id = ? AND status = 'active' ORDER BY updated_at DESC LIMIT 1",
    [creatorId],
  );
  const plan = subRows[0]?.plan_key || "starter";
  const [countRows] = await db.query<(RowDataPacket & { count: number })[]>(
    "SELECT COUNT(*) AS count FROM creator_products WHERE creator_id = ? AND deleted_at IS NULL",
    [creatorId],
  );
  const quota = getPlanQuota(plan);
  return { plan, planName: quota.name, used: Number(countRows[0]?.count || 0), limit: quota.maxProducts };
}

export function limitReachedBody(used: number, limit: number, planName: string) {
  return { error: { code: "LIMIT_REACHED", message: `You've used ${used} of ${limit} ${limit === 1 ? "product" : "products"} on ${planName}.` } };
}
