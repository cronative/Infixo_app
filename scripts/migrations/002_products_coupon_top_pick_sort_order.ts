import "dotenv/config";
import mysql from "mysql2/promise";
import { db } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function up(targetDb: mysql.Pool | mysql.Connection = db, dbName: string = "default") {
  console.log(`\n🚀 Running 002_products_coupon_top_pick_sort_order migration on [${dbName}]...`);

  const [cols] = await targetDb.query<(RowDataPacket & { Field: string })[]>(
    "SHOW COLUMNS FROM creator_products"
  );
  const existing = new Set(cols.map((col) => col.Field));

  if (!existing.has("coupon_code")) {
    await targetDb.query("ALTER TABLE creator_products ADD COLUMN coupon_code VARCHAR(20) NULL");
    console.log("✓ Added column coupon_code VARCHAR(20) NULL to creator_products");
  }
  if (!existing.has("discount_text")) {
    await targetDb.query("ALTER TABLE creator_products ADD COLUMN discount_text VARCHAR(30) NULL");
    console.log("✓ Added column discount_text VARCHAR(30) NULL to creator_products");
  }
  if (!existing.has("is_top_pick")) {
    await targetDb.query("ALTER TABLE creator_products ADD COLUMN is_top_pick TINYINT(1) NOT NULL DEFAULT 0");
    console.log("✓ Added column is_top_pick TINYINT(1) NOT NULL DEFAULT 0 to creator_products");
  }
  if (!existing.has("sort_order")) {
    await targetDb.query("ALTER TABLE creator_products ADD COLUMN sort_order INT NOT NULL DEFAULT 0");
    console.log("✓ Added column sort_order INT NOT NULL DEFAULT 0 to creator_products");
  }

  // Backfill sort_order per creator, oldest first
  try {
    await targetDb.query(`
      UPDATE creator_products p JOIN (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY creator_id ORDER BY created_at) rn FROM creator_products
      ) x ON x.id = p.id SET p.sort_order = x.rn
    `);
    console.log("✓ Backfilled sort_order per creator using ROW_NUMBER()");
  } catch (err: any) {
    console.warn("ROW_NUMBER() backfill failed (e.g. MySQL < 8), falling back to JS loop:", err.message);
    try {
      const [creators] = await targetDb.query<any[]>(
        "SELECT DISTINCT creator_id FROM creator_products"
      );
      for (const { creator_id } of creators) {
        const [prods] = await targetDb.query<any[]>(
          "SELECT id FROM creator_products WHERE creator_id = ? ORDER BY created_at ASC",
          [creator_id]
        );
        for (let i = 0; i < prods.length; i++) {
          await targetDb.query(
            "UPDATE creator_products SET sort_order = ? WHERE id = ?",
            [i + 1, prods[i].id]
          );
        }
      }
      console.log(`✓ Backfilled sort_order per creator in JS for ${creators.length} creators`);
    } catch (fallbackErr: any) {
      console.warn("JS fallback backfill warning:", fallbackErr.message);
    }
  }

  // Create index if it does not already exist
  try {
    const [indexes] = await targetDb.query<any[]>(
      "SHOW INDEX FROM creator_products WHERE Key_name = 'idx_products_creator_order'"
    );
    if (!indexes || indexes.length === 0) {
      await targetDb.query(
        "CREATE INDEX idx_products_creator_order ON creator_products(creator_id, is_top_pick, sort_order)"
      );
      console.log("✓ Created index idx_products_creator_order ON creator_products(creator_id, is_top_pick, sort_order)");
    }
  } catch (err: any) {
    console.warn("Index note:", err.message);
  }

  // Ensure 'products' view points to 'creator_products' so queries/DESCRIBE on either work
  try {
    await targetDb.query("CREATE OR REPLACE VIEW products AS SELECT * FROM creator_products");
    console.log("✓ Ensured 'products' view aliases 'creator_products'");
  } catch (err: any) {
    console.warn("View creation note:", err.message);
  }

  // Verify columns with DESCRIBE products
  const [desc] = await targetDb.query<any[]>("DESCRIBE products");
  console.log(`✓ Verified DESCRIBE products on [${dbName}]: ${desc.map((c: any) => c.Field).join(", ")}`);
}

export async function down(targetDb: mysql.Pool | mysql.Connection = db, dbName: string = "default") {
  console.log(`\n⏪ Rolling back 002_products_coupon_top_pick_sort_order migration on [${dbName}]...`);

  try {
    const [indexes] = await targetDb.query<any[]>(
      "SHOW INDEX FROM creator_products WHERE Key_name = 'idx_products_creator_order'"
    );
    if (indexes && indexes.length > 0) {
      await targetDb.query("DROP INDEX idx_products_creator_order ON creator_products");
      console.log("✓ Dropped index idx_products_creator_order from creator_products");
    }
  } catch (err: any) {
    console.warn("Drop index note:", err.message);
  }

  const [cols] = await targetDb.query<(RowDataPacket & { Field: string })[]>(
    "SHOW COLUMNS FROM creator_products"
  );
  const existing = new Set(cols.map((col) => col.Field));

  if (existing.has("coupon_code")) {
    await targetDb.query("ALTER TABLE creator_products DROP COLUMN coupon_code");
    console.log("✓ Dropped column coupon_code from creator_products");
  }
  if (existing.has("discount_text")) {
    await targetDb.query("ALTER TABLE creator_products DROP COLUMN discount_text");
    console.log("✓ Dropped column discount_text from creator_products");
  }
  if (existing.has("is_top_pick")) {
    await targetDb.query("ALTER TABLE creator_products DROP COLUMN is_top_pick");
    console.log("✓ Dropped column is_top_pick from creator_products");
  }
  if (existing.has("sort_order")) {
    await targetDb.query("ALTER TABLE creator_products DROP COLUMN sort_order");
    console.log("✓ Dropped column sort_order from creator_products");
  }
}

async function run() {
  const isDown = process.argv.includes("--down");
  const isProd = process.argv.includes("--prod");
  const isAll = process.argv.includes("--all");

  const runProd = isProd || isAll;
  const runDev = !isProd || isAll;

  if (runDev) {
    try {
      if (isDown) {
        await down(db, process.env.MYSQL_DATABASE || "inflixo_db");
      } else {
        await up(db, process.env.MYSQL_DATABASE || "inflixo_db");
      }
    } catch (err) {
      console.error(`Dev migration error:`, err);
      if (!runProd) process.exit(1);
    }
  }

  if (runProd && process.env.PROD_MYSQL_HOST && process.env.PROD_MYSQL_DATABASE) {
    const prodPool = mysql.createPool({
      host: process.env.PROD_MYSQL_HOST,
      port: Number(process.env.PROD_MYSQL_PORT) || 3306,
      user: process.env.PROD_MYSQL_USER,
      password: process.env.PROD_MYSQL_PASSWORD,
      database: process.env.PROD_MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 5,
    });

    try {
      if (isDown) {
        await down(prodPool, process.env.PROD_MYSQL_DATABASE);
      } else {
        await up(prodPool, process.env.PROD_MYSQL_DATABASE);
      }
    } catch (err) {
      console.error(`Prod migration error:`, err);
      process.exit(1);
    } finally {
      await prodPool.end();
    }
  }

  process.exit(0);
}

if (process.argv[1]?.endsWith("002_products_coupon_top_pick_sort_order.ts")) {
  run().catch((err) => {
    console.error("Migration execution failed:", err);
    process.exit(1);
  });
}
