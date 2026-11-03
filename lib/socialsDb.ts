import { db } from "@/lib/db";

let socialsColumnsChecked = false;

export async function ensureSocialAccountsColumns(): Promise<void> {
  if (socialsColumnsChecked) return;
  try {
    await db.query(`
      ALTER TABLE social_accounts
      ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE
    `);
  } catch {
    try {
      await db.query(`ALTER TABLE social_accounts ADD COLUMN is_primary BOOLEAN NOT NULL DEFAULT FALSE`);
    } catch {}
  }

  try {
    await db.query(`
      ALTER TABLE social_accounts
      ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE
    `);
  } catch {
    try {
      await db.query(`ALTER TABLE social_accounts ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT FALSE`);
    } catch {}
  }

  try {
    // Backfill: platforms with NO primary get their oldest account as primary.
    // (Never touches platforms that already have one — creators can choose a different primary.)
    await db.query(`
      UPDATE social_accounts sa
      JOIN (
        SELECT creator_id, platform, MIN(id) AS min_id
        FROM social_accounts
        GROUP BY creator_id, platform
        HAVING SUM(COALESCE(is_primary, 0)) = 0
      ) first_acc ON sa.id = first_acc.min_id
      SET sa.is_primary = TRUE
    `);
  } catch {}

  try {
    // Manual order for secondary accounts (primary always shows first).
    await db.query(`ALTER TABLE social_accounts ADD COLUMN sort_order INT NOT NULL DEFAULT 0`);
  } catch {}

  try {
    await db.query(`ALTER TABLE social_accounts DROP INDEX unique_creator_platform`);
  } catch {}

  try {
    await db.query(`ALTER TABLE social_accounts ADD UNIQUE KEY unique_creator_platform_username (creator_id, platform, username)`);
  } catch {}

  socialsColumnsChecked = true;
}
