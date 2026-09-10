import { db } from "@/lib/db";

let isSchemaEnsured = false;

export async function ensureSingleOnboardingStepSchema() {
  if (isSchemaEnsured) return;
  try {
    // 1. Create table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS creator_onboarding_steps (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        creator_id VARCHAR(64) DEFAULT NULL,
        step_name VARCHAR(50) NOT NULL,
        is_completed BOOLEAN NOT NULL DEFAULT TRUE,
        completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure unique_email key exists if table was created previously without it
    try {
      await db.query(`ALTER TABLE creator_onboarding_steps ADD UNIQUE KEY unique_email (email)`);
    } catch (e) {
      // Key already exists, ignore
    }

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
    // CRITICAL USER FLOW:
    // "onboarding me agar creator table me data nai hai to onboarding steps k table me koi entry nai hogi"
    let actualCreatorId = creatorId;
    if (!actualCreatorId) {
      const [creatorRows]: any = await db.query(
        "SELECT id FROM creators WHERE LOWER(email) = LOWER(?) LIMIT 1",
        [cleanEmail]
      );
      if (!creatorRows || creatorRows.length === 0) {
        console.log(`ℹ️ [ONBOARDING_STEP] No creator record in 'creators' table for ${cleanEmail} -> No entry added to creator_onboarding_steps`);
        return;
      }
      actualCreatorId = creatorRows[0].id;
    }

    await ensureSingleOnboardingStepSchema();

    // Atomic upsert with ON DUPLICATE KEY UPDATE to guarantee 1 row per email without race conditions
    await db.query(
      `INSERT INTO creator_onboarding_steps (email, creator_id, step_name, is_completed, completed_at)
       VALUES (?, ?, ?, TRUE, NOW())
       ON DUPLICATE KEY UPDATE
         creator_id = COALESCE(VALUES(creator_id), creator_id),
         step_name = VALUES(step_name),
         is_completed = TRUE,
         completed_at = NOW()`,
      [cleanEmail, actualCreatorId, stepName]
    );

    console.log(`✅ Onboarding step updated in DB for ${cleanEmail}: ${stepName}`);
  } catch (err: any) {
    console.error("❌ Failed to record onboarding step:", err.message);
  }
}


