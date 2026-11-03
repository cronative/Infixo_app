import { cache } from "react";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";

/**
 * true/false when the DB answered, null when it couldn't (never 404 a real creator because MySQL blipped).
 * Cached per request, so the layout and page share one query.
 */
export const creatorExists = cache(async (rawUsername: string): Promise<boolean | null> => {
  const username = decodeURIComponent(rawUsername || "").trim().replace(/^@/, "").toLowerCase();
  if (!username) return false;
  if (username === "demo_creator") return true;
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT 1 FROM creators WHERE LOWER(username) = ? OR LOWER(username) = ? LIMIT 1",
      [username, `@${username}`]
    );
    return rows.length > 0;
  } catch (err) {
    console.error("[creatorExists] lookup failed:", err);
    return null;
  }
});
