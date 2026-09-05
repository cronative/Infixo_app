import { db } from "@/lib/db";

export async function ensureRequestsTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS collaboration_requests (
        id VARCHAR(64) PRIMARY KEY,
        creator_id VARCHAR(64) NOT NULL,
        sender_name VARCHAR(150) NOT NULL,
        company_name VARCHAR(150) DEFAULT NULL,
        email VARCHAR(255) NOT NULL,
        campaign_type VARCHAR(100) DEFAULT NULL,
        approx_budget VARCHAR(100) DEFAULT NULL,
        message TEXT NOT NULL,
        status ENUM('NEW', 'VIEWED', 'REPLIED', 'CLOSED') NOT NULL DEFAULT 'NEW',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_creator_status (creator_id, status),
        INDEX idx_creator_created (creator_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (err: any) {
    console.warn("ensureRequestsTable error:", err.message);
  }
}
