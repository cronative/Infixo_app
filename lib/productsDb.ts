import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import type { CreatorProduct } from "@/types";

export const PRODUCT_COLUMNS = "id, name, image_url AS imageUrl, price_paise AS pricePaise, product_url AS productUrl";

export async function getCreatorProducts(creatorId: string): Promise<CreatorProduct[]> {
  const [rows] = await db.query<(RowDataPacket & CreatorProduct)[]>(
    `SELECT ${PRODUCT_COLUMNS} FROM creator_products WHERE creator_id = ? ORDER BY created_at ASC, id ASC`,
    [creatorId],
  );
  return rows.map((row) => ({ id: row.id, name: row.name, imageUrl: row.imageUrl, pricePaise: row.pricePaise === null ? null : Number(row.pricePaise), productUrl: row.productUrl }));
}
