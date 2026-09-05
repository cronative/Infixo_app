import { db } from "@/lib/db";

export async function ensureOtherSocialsTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS creator_other_socials (
        id VARCHAR(64) PRIMARY KEY,
        creator_id VARCHAR(64) NOT NULL,
        platform VARCHAR(50) NOT NULL,
        username VARCHAR(150) NOT NULL,
        url VARCHAR(1000) NOT NULL,
        label VARCHAR(100) DEFAULT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_creator_id (creator_id),
        INDEX idx_platform (platform)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (err: any) {
    console.warn("ensureOtherSocialsTable error:", err.message);
  }
}
