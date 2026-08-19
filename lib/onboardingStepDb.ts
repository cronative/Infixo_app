import { db } from "@/lib/db";

let isSchemaEnsured = false;

export async function ensureSingleOnboardingStepSchema() {
  if (isSchemaEnsured) return;
  try {
    // 1. Deduplicate existing rows in creator_onboarding_steps: keep only max id per email
    await db.query(`
      DELETE t1 FROM creator_onboarding_steps t1
      INNER JOIN creator_onboarding_steps t2
      ON t1.email = t2.email AND t1.id < t2.id
    `);

    // 2. Drop old non-unique indexes if present
    try {
      await db.query(`ALTER TABLE creator_onboarding_steps DROP INDEX idx_email_step`);
    } catch {}
    try {
      await db.query(`ALTER TABLE creator_onboarding_steps DROP INDEX unique_email_step`);
    } catch {}

    // 3. Add UNIQUE KEY on email if not exists
    try {
      await db.query(`ALTER TABLE creator_onboarding_steps ADD UNIQUE KEY unique_email (email)`);
    } catch {}

    isSchemaEnsured = true;
  } catch (err: any) {
    console.warn("⚠️ Schema ensure creator_onboarding_steps warning:", err.message);
  }
}

export async function recordOnboardingStep(
  email: string,
  stepName: string,
  creatorId: string | null = null
) {
  if (!email) return;
  const cleanEmail = email.trim().toLowerCase();

  try {
    await ensureSingleOnboardingStepSchema();

    // Use ON DUPLICATE KEY UPDATE on unique_email index for atomic update/insert
    await db.query(
      `INSERT INTO creator_onboarding_steps (email, creator_id, step_name, is_completed, completed_at)
       VALUES (?, ?, ?, TRUE, NOW())
       ON DUPLICATE KEY UPDATE
         creator_id = COALESCE(VALUES(creator_id), creator_id),
         step_name = VALUES(step_name),
         is_completed = TRUE,
         completed_at = NOW()`,
      [cleanEmail, creatorId || null, stepName]
    );
  } catch (err: any) {
    console.error("❌ Failed to record onboarding step:", err.message);
  }
}
