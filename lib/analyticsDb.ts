import { db } from "@/lib/db";

export async function ensureAnalyticsTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        creator_id VARCHAR(64) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        event_target VARCHAR(255) DEFAULT NULL,
        user_agent TEXT DEFAULT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        metadata JSON DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_creator_analytics (creator_id, event_type, created_at),
        INDEX idx_creator_created (creator_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure event_type column is VARCHAR(50) to support all event types flexibly
    try {
      await db.query("ALTER TABLE analytics_events MODIFY COLUMN event_type VARCHAR(50) NOT NULL");
    } catch {}
    try {
      await db.query("ALTER TABLE analytics_events ADD COLUMN metadata JSON DEFAULT NULL");
    } catch {}
  } catch (err: any) {
    console.warn("ensureAnalyticsTable error:", err.message);
  }
}
