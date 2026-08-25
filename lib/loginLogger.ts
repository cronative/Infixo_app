import { db } from "./db";
import { parseUserAgent } from "./deviceDetector";

let tableEnsured = false;

async function ensureTableExists() {
  if (tableEnsured) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS creator_login_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        creator_id VARCHAR(64) DEFAULT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        user_agent TEXT DEFAULT NULL,
        device_type VARCHAR(50) DEFAULT 'desktop',
        browser VARCHAR(100) DEFAULT NULL,
        os VARCHAR(100) DEFAULT NULL,
        login_status ENUM('otp_sent', 'success', 'failed') DEFAULT 'otp_sent',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_creator (creator_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure last_login_at column exists
    try {
      await db.query(`ALTER TABLE creator_login_logs ADD COLUMN last_login_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
    } catch {}

    tableEnsured = true;
  } catch (e: any) {
    console.warn("Could not auto-create creator_login_logs table:", e.message);
  }
}

export async function logDeviceLogin({
  email,
  creatorId,
  ipAddress,
  userAgent,
  status = "otp_sent",
}: {
  email: string;
  creatorId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  status?: "otp_sent" | "success" | "failed";
}) {
  try {
    await ensureTableExists();
    const cleanEmail = email.trim().toLowerCase();
    const { deviceType, browser, os } = parseUserAgent(userAgent);

    // Check if entry already exists for this exact same device/browser/os
    const [existingRows]: any = await db.query(
      `SELECT id FROM creator_login_logs 
       WHERE email = ? AND device_type = ? AND browser = ? AND os = ? 
       ORDER BY id DESC LIMIT 1`,
      [cleanEmail, deviceType, browser, os]
    );

    if (existingRows && existingRows.length > 0) {
      // Same device: Update existing record timestamp & status (No duplicate row)
      await db.query(
        `UPDATE creator_login_logs 
         SET ip_address = ?, user_agent = ?, login_status = ?, 
             creator_id = COALESCE(?, creator_id), last_login_at = NOW()
         WHERE id = ?`,
        [ipAddress || null, userAgent || null, status, creatorId || null, existingRows[0].id]
      );
    } else {
      // New / Different Device: Insert new record
      await db.query(
        `INSERT INTO creator_login_logs (email, creator_id, ip_address, user_agent, device_type, browser, os, login_status, created_at, last_login_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          cleanEmail,
          creatorId || null,
          ipAddress || null,
          userAgent || null,
          deviceType,
          browser,
          os,
          status,
        ]
      );
    }
  } catch (err: any) {
    console.warn("⚠️ Failed to record creator login log:", err.message);
  }
}
