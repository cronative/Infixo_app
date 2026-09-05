import { db } from "@/lib/db";

export async function ensureBrandsTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS creator_brands (
        id VARCHAR(64) PRIMARY KEY,
        creator_id VARCHAR(64) NOT NULL,
        brand_name VARCHAR(150) NOT NULL,
        brand_logo_url TEXT DEFAULT NULL,
        instagram_url VARCHAR(1000) DEFAULT NULL,
        youtube_url VARCHAR(1000) DEFAULT NULL,
        facebook_url VARCHAR(1000) DEFAULT NULL,
        website_url VARCHAR(1000) DEFAULT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_creator_id (creator_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (err: any) {
    console.warn("ensureBrandsTable error:", err.message);
  }
}
