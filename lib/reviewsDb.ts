import { db } from "@/lib/db";

export async function ensureReviewsTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS creator_reviews (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        creator_id VARCHAR(64) NOT NULL,
        token VARCHAR(128) NOT NULL UNIQUE,
        client_name VARCHAR(150) NOT NULL,
        client_email VARCHAR(255) NOT NULL,
        client_designation VARCHAR(150) DEFAULT NULL,
        project_title VARCHAR(255) NOT NULL,
        content_url TEXT NOT NULL,
        rating INT NOT NULL DEFAULT 5,
        rating_content_quality INT NOT NULL DEFAULT 5,
        rating_professionalism INT NOT NULL DEFAULT 5,
        rating_timely_delivery INT NOT NULL DEFAULT 5,
        comment TEXT DEFAULT NULL,
        status ENUM('pending_invite', 'pending_approval', 'approved', 'rejected') NOT NULL DEFAULT 'pending_invite',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_creator_reviews (creator_id, status),
        INDEX idx_review_token (token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Auto-migrate missing columns for pre-existing tables
    const alterQueries = [
      "ALTER TABLE creator_reviews ADD COLUMN rating_content_quality INT NOT NULL DEFAULT 5",
      "ALTER TABLE creator_reviews ADD COLUMN rating_professionalism INT NOT NULL DEFAULT 5",
      "ALTER TABLE creator_reviews ADD COLUMN rating_timely_delivery INT NOT NULL DEFAULT 5",
    ];
    for (const q of alterQueries) {
      try {
        await db.query(q);
      } catch (colErr) {
        // Column already exists, ignore
      }
    }
  } catch (e) {
    // Ignore error if table exists
  }
}
