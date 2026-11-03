import { db } from "@/lib/db";

let isEnsured = false;

export async function ensureReviewsTable() {
  if (isEnsured) return;
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
        invitation_status VARCHAR(32) NOT NULL DEFAULT 'pending',
        is_visible TINYINT(1) NOT NULL DEFAULT 1,
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
      "ALTER TABLE creator_reviews ADD COLUMN invitation_status VARCHAR(32) NOT NULL DEFAULT 'pending'",
      "ALTER TABLE creator_reviews ADD COLUMN is_visible TINYINT(1) NOT NULL DEFAULT 1",
      // Existing reviews count as already seen; new rows default to unseen (dashboard Brand Inbox).
      "ALTER TABLE creator_reviews ADD COLUMN creator_seen TINYINT(1) NOT NULL DEFAULT 1",
      "ALTER TABLE creator_reviews ALTER COLUMN creator_seen SET DEFAULT 0",
    ];
    for (const q of alterQueries) {
      try {
        await db.query(q);
      } catch (_colErr) {
        // Column already exists, ignore
      }
    }

    try {
      // Auto-publish any previously pending_approval reviews since submitted reviews are visible immediately by default
      await db.query(`
        UPDATE creator_reviews
        SET status = 'approved',
            is_visible = 1,
            invitation_status = 'submitted'
        WHERE status = 'pending_approval'
      `);
      await db.query(`
        UPDATE creator_reviews
        SET invitation_status = 'submitted'
        WHERE status IN ('approved', 'rejected')
          AND (invitation_status IS NULL OR invitation_status = '' OR invitation_status = 'pending')
      `);
      await db.query(`
        UPDATE creator_reviews
        SET is_visible = 0
        WHERE status = 'rejected' AND is_visible = 1
      `);
    } catch {}
    isEnsured = true;
  } catch (_e) {
    // Ignore error if table exists
  }
}

/** Submitted brand reviews the creator hasn't opened the Reviews page for yet. */
export async function countUnseenReviews(creatorId: string): Promise<number> {
  await ensureReviewsTable();
  const [rows]: any = await db.query(
    "SELECT COUNT(*) AS n FROM creator_reviews WHERE creator_id = ? AND status IN ('approved', 'rejected', 'pending_approval') AND creator_seen = 0",
    [creatorId],
  );
  return Number(rows?.[0]?.n || 0);
}

export async function markReviewsSeen(creatorId: string): Promise<void> {
  await ensureReviewsTable();
  await db.query("UPDATE creator_reviews SET creator_seen = 1 WHERE creator_id = ? AND creator_seen = 0", [creatorId]);
}
