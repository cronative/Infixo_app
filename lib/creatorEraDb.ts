import { db } from "@/lib/db";
import { getCreatorEra } from "@/lib/creatorEra";

let columnsChecked = false;

export async function ensureCreatorEraColumns(): Promise<void> {
  if (columnsChecked) return;
  try {
    await db.query(`
      ALTER TABLE creators
      ADD COLUMN IF NOT EXISTS peak_fanbase INT UNSIGNED NULL DEFAULT NULL
    `);
  } catch (err: any) {
    // MySQL older versions fallback if IF NOT EXISTS not supported
    try {
      await db.query(`ALTER TABLE creators ADD COLUMN peak_fanbase INT UNSIGNED NULL DEFAULT NULL`);
    } catch {}
  }

  try {
    await db.query(`
      ALTER TABLE creators
      ADD COLUMN IF NOT EXISTS era_unlocked_pending TINYINT(1) NOT NULL DEFAULT 0
    `);
  } catch (err: any) {
    try {
      await db.query(`ALTER TABLE creators ADD COLUMN era_unlocked_pending TINYINT(1) NOT NULL DEFAULT 0`);
    } catch {}
  }

  columnsChecked = true;
}

/**
 * On every fanbase sync, peak = max(peak, current).
 * Badge uses peak (never downgrades).
 * If peak crosses into a new sub-level on sync, set era_unlocked_pending = true.
 */
export async function syncCreatorPeakFanbase(
  creatorId: string,
  currentFanbase: number | null
): Promise<{ peakFanbase: number | null; isUnlock: boolean }> {
  await ensureCreatorEraColumns();
  if (currentFanbase === null || isNaN(currentFanbase)) {
    return { peakFanbase: null, isUnlock: false };
  }

  const [rows]: any = await db.query(
    "SELECT peak_fanbase FROM creators WHERE id = ?",
    [creatorId]
  );

  const rawOldPeak = rows[0]?.peak_fanbase;
  const oldPeak = rawOldPeak !== null && rawOldPeak !== undefined ? Number(rawOldPeak) : null;
  const newPeak = oldPeak === null ? currentFanbase : Math.max(oldPeak, currentFanbase);

  const oldEra = getCreatorEra(oldPeak);
  const newEra = getCreatorEra(newPeak);

  // Crossed into a higher sub-level milestone
  const isUnlock = Boolean(
    newEra &&
    oldEra &&
    newEra.badge !== oldEra.badge &&
    newEra.min > oldEra.min
  );

  await db.query(
    `UPDATE creators 
     SET peak_fanbase = ?,
         era_unlocked_pending = CASE WHEN ? = 1 THEN 1 ELSE era_unlocked_pending END
     WHERE id = ?`,
    [newPeak, isUnlock ? 1 : 0, creatorId]
  );

  return { peakFanbase: newPeak, isUnlock };
}

/**
 * Clear the pending era unlock celebration flag for creator
 */
export async function clearEraCelebration(creatorId: string): Promise<void> {
  await ensureCreatorEraColumns();
  await db.query("UPDATE creators SET era_unlocked_pending = 0 WHERE id = ?", [creatorId]);
}
