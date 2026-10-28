/**
 * One-off: fetch & store favicons for existing links and group children that have none
 * (or were saved under the old "uploads/uploads/" path). Same logic as on save.
 *   npx tsx scripts/backfill-link-icons.ts
 */
import "dotenv/config";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { backfillLinkIcons, ensureLinkColumns } from "@/lib/linksDb";

async function main() {
  await ensureLinkColumns();
  const [rows] = await db.query<(RowDataPacket & { id: string; url: string; iconUrl: string | null })[]>(
    `SELECT id, url, icon_url AS iconUrl FROM creator_custom_links
     WHERE url IS NOT NULL AND url <> '' AND (icon_url IS NULL OR icon_url LIKE '%uploads/uploads/%')`,
  );
  console.log(`Links needing an icon: ${rows.length}`);
  let updated = 0;
  // Small batches keep the number of parallel outbound fetches bounded.
  for (let i = 0; i < rows.length; i += 10) {
    updated += await backfillLinkIcons(rows.slice(i, i + 10).map((row) => ({ id: row.id, url: row.url, iconUrl: row.iconUrl })));
  }
  console.log(`Icons saved: ${updated} (the rest are known platforms or sites without a usable icon).`);
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => db.end());
