import crypto from "crypto";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";

export async function checkPersistentRateLimit(key: string, limit: number, windowSeconds: number) {
  const keyHash = crypto.createHash("sha256").update(key).digest("hex");
  let connection: any = null;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [rows]: any = await connection.query(
      "SELECT attempts, window_started_at FROM api_rate_limits WHERE key_hash = ? FOR UPDATE",
      [keyHash]
    );
    const row = rows?.[0];
    const now = new Date();
    const startedAt = row ? new Date(row.window_started_at) : now;
    const elapsedSeconds = (now.getTime() - startedAt.getTime()) / 1000;
    let attempts = row?.attempts || 0;
    let windowStartedAt = startedAt;
    let blocked = false;

    if (!row || elapsedSeconds >= windowSeconds) {
      attempts = 1;
      windowStartedAt = now;
      await connection.query(
        `INSERT INTO api_rate_limits (key_hash, window_started_at, attempts)
         VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE window_started_at = VALUES(window_started_at), attempts = 1`,
        [keyHash, now]
      );
    } else if (attempts >= limit) {
      blocked = true;
    } else {
      attempts += 1;
      await connection.query("UPDATE api_rate_limits SET attempts = ? WHERE key_hash = ?", [attempts, keyHash]);
    }

    await connection.commit();
    const retryAfterSec = Math.max(0, Math.ceil(windowSeconds - (now.getTime() - windowStartedAt.getTime()) / 1000));
    return { success: !blocked, remaining: Math.max(0, limit - attempts), retryAfterSec };
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {}
    }
    console.warn("Persistent rate limit warning, falling back to memory:", error instanceof Error ? error.message : error);
    return checkRateLimit(key, limit, windowSeconds * 1000);
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch {}
    }
  }
}
