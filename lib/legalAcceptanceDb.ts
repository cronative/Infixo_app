import { db } from "@/lib/db";
import { LEGAL_DOCUMENTS, REGISTRATION_LEGAL_DOCUMENTS } from "@/lib/legalVersions";

let isEnsured = false;

/** Creates the acceptance table on first use (mirrors db/migrations/011). */
export async function ensureLegalAcceptancesTable() {
  if (isEnsured) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS creator_legal_acceptances (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      creator_id VARCHAR(64) NOT NULL,
      document_key VARCHAR(32) NOT NULL,
      document_version VARCHAR(32) NOT NULL,
      source VARCHAR(32) NOT NULL DEFAULT 'registration',
      accepted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_creator_document_version (creator_id, document_key, document_version),
      INDEX idx_creator_legal (creator_id, document_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  isEnsured = true;
}

/** True only for an explicit boolean `true` sent by the registration form. */
export function isLegalAcceptanceGiven(body: unknown): boolean {
  return Boolean(body && typeof body === "object" && (body as Record<string, unknown>).acceptedLegalTerms === true);
}

/**
 * Records acceptance of the current Terms of Service, Creator Terms and Privacy Policy.
 * Versions always come from the server (lib/legalVersions.ts), never from the client.
 */
export async function recordRegistrationLegalAcceptance(creatorId: string, source = "registration") {
  await ensureLegalAcceptancesTable();
  const rows = REGISTRATION_LEGAL_DOCUMENTS.map((id) => [
    creatorId,
    LEGAL_DOCUMENTS[id].key,
    LEGAL_DOCUMENTS[id].version,
    source,
  ]);
  await db.query(
    `INSERT IGNORE INTO creator_legal_acceptances (creator_id, document_key, document_version, source)
     VALUES ?`,
    [rows]
  );
}

/**
 * Whether a creator has accepted the current version of every registration document.
 * Not enforced for existing creators yet; available for a future re-acceptance prompt.
 */
export async function hasAcceptedCurrentLegalTerms(creatorId: string): Promise<boolean> {
  await ensureLegalAcceptancesTable();
  const [rows]: any = await db.query(
    `SELECT document_key, document_version FROM creator_legal_acceptances WHERE creator_id = ?`,
    [creatorId]
  );
  const accepted = new Set((rows || []).map((r: any) => `${r.document_key}@${r.document_version}`));
  return REGISTRATION_LEGAL_DOCUMENTS.every((id) =>
    accepted.has(`${LEGAL_DOCUMENTS[id].key}@${LEGAL_DOCUMENTS[id].version}`)
  );
}
