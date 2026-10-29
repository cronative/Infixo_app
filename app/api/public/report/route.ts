import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

const VALID_REASONS = new Set([
  "spam",
  "inappropriate",
  "impersonation",
  "harassment",
  "copyright",
  "illegal",
  "other",
]);

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    // Limit to 5 reports per IP per hour to prevent griefing
    const rate = checkRateLimit(`report_${ip}`, 5, 60 * 60 * 1000);
    if (!rate.success) {
      return apiError(
        `Too many reports submitted. Please try again in ${Math.ceil(rate.retryAfterSec / 60)} minutes.`,
        429
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return apiError("Invalid request body", 400);
    }

    const rawUsername = String(body.creatorUsername || "").trim().replace(/^@/, "");
    const reason = String(body.reason || "").trim();
    const details = body.details ? String(body.details).trim().slice(0, 1000) : null;
    const reporterEmail = body.reporterEmail ? String(body.reporterEmail).trim().slice(0, 255) : null;

    if (!rawUsername) {
      return apiError("Creator username is required", 400);
    }

    if (!reason || !VALID_REASONS.has(reason)) {
      return apiError("Please select a valid reason for reporting", 400);
    }

    if (reporterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail)) {
      return apiError("Please enter a valid email address", 400);
    }

    // Try finding the creator_id if creator exists in the database
    let creatorId: string | null = null;
    try {
      const [creators] = await db.query(
        "SELECT id FROM creators WHERE LOWER(username) = LOWER(?) LIMIT 1",
        [rawUsername]
      ) as any;
      if (Array.isArray(creators) && creators.length > 0) {
        creatorId = creators[0].id;
      }
    } catch {
      // Ignore if database offline or creators table issue
    }

    // Ensure profile_reports table exists
    try {
      await db.query(`CREATE TABLE IF NOT EXISTS profile_reports (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        creator_username VARCHAR(100) NOT NULL,
        creator_id VARCHAR(64) NULL,
        reason VARCHAR(100) NOT NULL,
        details TEXT NULL,
        reporter_email VARCHAR(255) NULL,
        ip_address VARCHAR(45) NULL,
        status ENUM('pending', 'reviewed', 'dismissed') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_reports_creator (creator_username, status),
        INDEX idx_reports_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

      await db.query(
        `INSERT INTO profile_reports (creator_username, creator_id, reason, details, reporter_email, ip_address)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [rawUsername, creatorId, reason, details, reporterEmail, ip]
      );
    } catch (dbErr) {
      console.warn("Could not persist profile report to database:", dbErr);
    }

    return apiSuccess({ success: true }, "Report submitted successfully. Thank you for keeping Inflixo safe.");
  } catch (err: any) {
    console.error("Profile report handler error:", err);
    return apiError("Could not process report at this time. Please try again later.", 500);
  }
}
