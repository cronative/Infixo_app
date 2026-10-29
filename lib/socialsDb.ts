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
    // Set is_primary = TRUE for the oldest account of each platform per creator
    await db.query(`
      UPDATE social_accounts sa
      JOIN (
        SELECT creator_id, platform, MIN(id) AS min_id
        FROM social_accounts
        GROUP BY creator_id, platform
      ) first_acc ON sa.id = first_acc.min_id
      SET sa.is_primary = TRUE
      WHERE sa.is_primary = FALSE OR sa.is_primary IS NULL
    `);
  } catch {}

  try {
    await db.query(`ALTER TABLE social_accounts DROP INDEX unique_creator_platform`);
  } catch {}

  try {
    await db.query(`ALTER TABLE social_accounts ADD UNIQUE KEY unique_creator_platform_username (creator_id, platform, username)`);
  } catch {}

  socialsColumnsChecked = true;
}
