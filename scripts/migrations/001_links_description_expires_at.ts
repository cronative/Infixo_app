import { db } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function up() {
  const [cols] = await db.query<(RowDataPacket & { Field: string })[]>(
    "SHOW COLUMNS FROM creator_custom_links"
  );
  const existing = new Set(cols.map((col) => col.Field));

  if (!existing.has("description")) {
    await db.query("ALTER TABLE creator_custom_links ADD COLUMN description VARCHAR(60) NULL");
    console.log("✓ Added column description VARCHAR(60) NULL to creator_custom_links");
  }
  if (!existing.has("expires_at")) {
    await db.query("ALTER TABLE creator_custom_links ADD COLUMN expires_at DATETIME NULL");
    console.log("✓ Added column expires_at DATETIME NULL to creator_custom_links");
  }
}

export async function down() {
  const [cols] = await db.query<(RowDataPacket & { Field: string })[]>(
    "SHOW COLUMNS FROM creator_custom_links"
  );
  const existing = new Set(cols.map((col) => col.Field));

  if (existing.has("description")) {
    await db.query("ALTER TABLE creator_custom_links DROP COLUMN description");
    console.log("✓ Dropped column description from creator_custom_links");
  }
  if (existing.has("expires_at")) {
    await db.query("ALTER TABLE creator_custom_links DROP COLUMN expires_at");
    console.log("✓ Dropped column expires_at from creator_custom_links");
  }
}

// CLI direct run
if (process.argv[1]?.endsWith("001_links_description_expires_at.ts")) {
  const isDown = process.argv.includes("--down");
  (async () => {
    try {
      if (isDown) {
        await down();
      } else {
        await up();
      }
      process.exit(0);
    } catch (err) {
      console.error("Migration error:", err);
      process.exit(1);
    }
  })();
}

