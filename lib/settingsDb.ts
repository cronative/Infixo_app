import { db } from "@/lib/db";

let isEnsured = false;

// Helper to auto-create dedicated creator_settings table (cached in-memory)
export async function ensureCreatorSettingsTable() {
  if (isEnsured) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS creator_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        creator_id VARCHAR(64) NOT NULL UNIQUE COMMENT 'FK to creators table ID',
        visibility_settings TEXT DEFAULT NULL COMMENT 'JSON settings for page controls',
        theme_key VARCHAR(50) DEFAULT 'minimal-white',
        public_profile_layout VARCHAR(32) NOT NULL DEFAULT 'default',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_creator_settings (creator_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    try {
      await db.query(`ALTER TABLE creator_settings ADD COLUMN IF NOT EXISTS public_profile_layout VARCHAR(32) NOT NULL DEFAULT 'default'`);
      await db.query(`ALTER TABLE creators ADD COLUMN IF NOT EXISTS public_profile_layout VARCHAR(32) NOT NULL DEFAULT 'default'`);
    } catch {}
    isEnsured = true;
  } catch (e) {
    console.warn("Could not ensure creator_settings table:", e);
  }
}
