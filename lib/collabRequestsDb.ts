import { db } from "@/lib/db";
import { CollabRequest } from "@/types";

let isCollabTableEnsured = false;

export async function ensureCollabRequestsTable(): Promise<void> {
  if (isCollabTableEnsured) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS collab_requests (
        id VARCHAR(64) PRIMARY KEY,
        creator_id VARCHAR(64) NOT NULL,
        package_id VARCHAR(100) DEFAULT NULL,
        package_name VARCHAR(255) DEFAULT NULL,
        brand_name VARCHAR(150) NOT NULL,
        contact_name VARCHAR(150) NOT NULL,
        work_email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) DEFAULT NULL,
        budget VARCHAR(50) DEFAULT NULL,
        message TEXT NOT NULL,
        website_or_social VARCHAR(255) DEFAULT NULL,
        status ENUM('new', 'replied', 'closed') NOT NULL DEFAULT 'new',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_collab_creator_status (creator_id, status),
        INDEX idx_collab_creator_created (creator_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure columns in case table was created with an earlier variation
    try { await db.query("ALTER TABLE collab_requests ADD COLUMN package_name VARCHAR(255) DEFAULT NULL"); } catch {}
    try { await db.query("ALTER TABLE collab_requests ADD COLUMN website_or_social VARCHAR(255) DEFAULT NULL"); } catch {}

    isCollabTableEnsured = true;
  } catch (err: any) {
    console.warn("ensureCollabRequestsTable warning:", err?.message || err);
  }
}

export async function insertCollabRequest(req: {
  creatorId: string;
  packageId?: string | null;
  packageName?: string | null;
  brandName: string;
  contactName: string;
  workEmail: string;
  phone?: string | null;
  budget?: string | null;
  message: string;
  websiteOrSocial?: string | null;
}): Promise<CollabRequest> {
  await ensureCollabRequestsTable();

  const id = `collab_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const status = "new";
  const now = new Date().toISOString();

  await db.query(
    `INSERT INTO collab_requests 
      (id, creator_id, package_id, package_name, brand_name, contact_name, work_email, phone, budget, message, website_or_social, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      req.creatorId,
      req.packageId || null,
      req.packageName || null,
      req.brandName,
      req.contactName,
      req.workEmail,
      req.phone || null,
      req.budget || null,
      req.message,
      req.websiteOrSocial || null,
      status,
    ]
  );

  return {
    id,
    creatorId: req.creatorId,
    packageId: req.packageId || null,
    packageName: req.packageName || null,
    brandName: req.brandName,
    contactName: req.contactName,
    workEmail: req.workEmail,
    phone: req.phone || null,
    budget: req.budget || null,
    message: req.message,
    websiteOrSocial: req.websiteOrSocial || null,
    status,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getCollabRequestsByCreator(creatorId: string): Promise<CollabRequest[]> {
  await ensureCollabRequestsTable();

  const [rows]: any = await db.query(
    `SELECT id, creator_id AS creatorId, package_id AS packageId, package_name AS packageName,
            brand_name AS brandName, contact_name AS contactName, work_email AS workEmail,
            phone, budget, message, website_or_social AS websiteOrSocial, status,
            created_at AS createdAt, updated_at AS updatedAt
     FROM collab_requests
     WHERE creator_id = ?
     ORDER BY created_at DESC`,
    [creatorId]
  );

  return (rows || []).map((row: any) => ({
    id: row.id,
    creatorId: row.creatorId,
    packageId: row.packageId || null,
    packageName: row.packageName || null,
    brandName: row.brandName,
    contactName: row.contactName,
    workEmail: row.workEmail,
    phone: row.phone || null,
    budget: row.budget || null,
    message: row.message,
    websiteOrSocial: row.websiteOrSocial || null,
    status: row.status,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : undefined,
  }));
}

export async function updateCollabRequestStatus(
  id: string,
  creatorId: string,
  status: "new" | "replied" | "closed"
): Promise<boolean> {
  await ensureCollabRequestsTable();

  const [result]: any = await db.query(
    `UPDATE collab_requests SET status = ? WHERE id = ? AND creator_id = ?`,
    [status, id, creatorId]
  );

  return result.affectedRows > 0;
}
