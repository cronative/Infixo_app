import "dotenv/config";
import { db } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function up() {
  const [cols] = await db.query<(RowDataPacket & { Field: string })[]>(
    "SHOW COLUMNS FROM creator_products"
  );
  const existing = new Set(cols.map((col) => col.Field));

  if (!existing.has("coupon_code")) {
    await db.query("ALTER TABLE creator_products ADD COLUMN coupon_code VARCHAR(20) NULL");
    console.log("✓ Added column coupon_code VARCHAR(20) NULL to creator_products");
  }
  if (!existing.has("discount_text")) {
    await db.query("ALTER TABLE creator_products ADD COLUMN discount_text VARCHAR(30) NULL");
    console.log("✓ Added column discount_text VARCHAR(30) NULL to creator_products");
  }
  if (!existing.has("is_top_pick")) {
    await db.query("ALTER TABLE creator_products ADD COLUMN is_top_pick TINYINT(1) NOT NULL DEFAULT 0");
    console.log("✓ Added column is_top_pick TINYINT(1) NOT NULL DEFAULT 0 to creator_products");
  }
  if (!existing.has("sort_order")) {
    await db.query("ALTER TABLE creator_products ADD COLUMN sort_order INT NOT NULL DEFAULT 0");
    console.log("✓ Added column sort_order INT NOT NULL DEFAULT 0 to creator_products");
  }

  // Backfill sort_order per creator, oldest first
  try {
    await db.query(`
      UPDATE creator_products p JOIN (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY creator_id ORDER BY created_at) rn FROM creator_products
      ) x ON x.id = p.id SET p.sort_order = x.rn
    `);
    console.log("✓ Backfilled sort_order per creator");
  } catch (err: any) {
    console.warn("Backfill note:", err.message);
  }

  // Create index if it does not already exist
  try {
    const [indexes] = await db.query<any[]>("SHOW INDEX FROM creator_products WHERE Key_name = 'idx_products_creator_order'");
    if (!indexes || indexes.length === 0) {
      await db.query("CREATE INDEX idx_products_creator_order ON creator_products(creator_id, is_top_pick, sort_order)");
      console.log("✓ Created index idx_products_creator_order ON creator_products(creator_id, is_top_pick, sort_order)");
    }
  } catch (err: any) {
    console.warn("Index note:", err.message);
  }
}

export async function down() {
  try {
    const [indexes] = await db.query<any[]>("SHOW INDEX FROM creator_products WHERE Key_name = 'idx_products_creator_order'");
    if (indexes && indexes.length > 0) {
      await db.query("DROP INDEX idx_products_creator_order ON creator_products");
      console.log("✓ Dropped index idx_products_creator_order from creator_products");
    }
  } catch (err: any) {
    console.warn("Drop index note:", err.message);
  }

  const [cols] = await db.query<(RowDataPacket & { Field: string })[]>(
    "SHOW COLUMNS FROM creator_products"
  );
  const existing = new Set(cols.map((col) => col.Field));

  if (existing.has("coupon_code")) {
    await db.query("ALTER TABLE creator_products DROP COLUMN coupon_code");
    console.log("✓ Dropped column coupon_code from creator_products");
  }
  if (existing.has("discount_text")) {
    await db.query("ALTER TABLE creator_products DROP COLUMN discount_text");
    console.log("✓ Dropped column discount_text from creator_products");
  }
  if (existing.has("is_top_pick")) {
    await db.query("ALTER TABLE creator_products DROP COLUMN is_top_pick");
    console.log("✓ Dropped column is_top_pick from creator_products");
  }
  if (existing.has("sort_order")) {
    await db.query("ALTER TABLE creator_products DROP COLUMN sort_order");
    console.log("✓ Dropped column sort_order from creator_products");
  }
}

if (process.argv[1]?.endsWith("002_products_coupon_top_pick_sort_order.ts")) {
  const isDown = process.argv.includes("--down");
  (async () => {
    try {
      if (isDown) {
        await down();
      } else {
        await up();
      }
      process.exit(0);
    } catch (err) {
      console.error("Migration error:", err);
      process.exit(1);
    }
  })();
}
