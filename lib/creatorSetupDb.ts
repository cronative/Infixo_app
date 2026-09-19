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
        used_for VARCHAR(255) DEFAULT NULL,
        note TEXT DEFAULT NULL,
        link_url VARCHAR(1000) DEFAULT NULL,
        image_url TEXT DEFAULT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_creator_setup (creator_id, is_active, sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    isEnsured = true;
  } catch (err) {
    console.warn("ensureCreatorSetupTable error:", err instanceof Error ? err.message : err);
  }
}
