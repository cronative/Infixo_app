import { db } from "@/lib/db";

let isEnsured = false;

export async function ensureCreatorSetupTable() {
  if (isEnsured) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS creator_setup_items (
        id VARCHAR(64) PRIMARY KEY,
        creator_id VARCHAR(64) NOT NULL,
        category VARCHAR(80) NOT NULL,
        item_name VARCHAR(180) NOT NULL,
        brand VARCHAR(120) DEFAULT NULL,
        model_or_plan VARCHAR(160) DEFAULT NULL,
        using_since VARCHAR(100) DEFAULT NULL,
        used_for VARCHAR(255) DEFAULT NULL,
        note TEXT DEFAULT NULL,
        why_love_it VARCHAR(255) DEFAULT NULL,
        budget_alt VARCHAR(255) DEFAULT NULL,
        is_affiliate TINYINT(1) NOT NULL DEFAULT 0,
        link_url VARCHAR(1000) DEFAULT NULL,
        image_url TEXT DEFAULT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_creator_setup (creator_id, is_active, sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Alter table to add new fields if creator_setup_items already existed
    const [cols]: any = await db.query("SHOW COLUMNS FROM creator_setup_items");
    const colNames = (cols || []).map((c: any) => c.Field);
    if (!colNames.includes("why_love_it")) {
      await db.query("ALTER TABLE creator_setup_items ADD COLUMN why_love_it VARCHAR(255) DEFAULT NULL AFTER note");
    }
    if (!colNames.includes("budget_alt")) {
      await db.query("ALTER TABLE creator_setup_items ADD COLUMN budget_alt VARCHAR(255) DEFAULT NULL AFTER why_love_it");
    }
    if (!colNames.includes("is_affiliate")) {
      await db.query("ALTER TABLE creator_setup_items ADD COLUMN is_affiliate TINYINT(1) NOT NULL DEFAULT 0 AFTER budget_alt");
    }
    if (!colNames.includes("using_since")) {
      await db.query("ALTER TABLE creator_setup_items ADD COLUMN using_since VARCHAR(100) DEFAULT NULL AFTER model_or_plan");
    }

    // Settings table for "Where I started" intro
    await db.query(`
      CREATE TABLE IF NOT EXISTS creator_setup_settings (
        creator_id VARCHAR(64) PRIMARY KEY,
        where_i_started VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    isEnsured = true;
  } catch (err) {
    console.warn("ensureCreatorSetupTable error:", err instanceof Error ? err.message : err);
  }
}
