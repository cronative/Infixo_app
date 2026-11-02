import "dotenv/config";
import { db } from "../../lib/db";
import { ALL_SERIES_GENRES } from "../../components/ui/GenreMultiSelect";

export async function up() {
  console.log("Starting migration 003: cleanup series genres...");

  const validGenresMap = new Map<string, string>();
  for (const g of ALL_SERIES_GENRES) {
    validGenresMap.set(g.toLowerCase().trim(), g);
  }

  const [seriesRows]: any = await db.query("SELECT id, title, genres FROM series");

  let updatedCount = 0;
  for (const row of seriesRows) {
    const rawGenres = row.genres ? String(row.genres) : "";
    const split = rawGenres
      .split(",")
      .map((g: string) => g.trim())
      .filter(Boolean);

    // Filter to only genres that exist in the ALL_SERIES_GENRES master list
    const cleaned: string[] = [];
    for (const item of split) {
      const canonical = validGenresMap.get(item.toLowerCase());
      if (canonical && !cleaned.includes(canonical)) {
        cleaned.push(canonical);
      }
    }

    // Limit to max 3 genres
    const finalGenres = cleaned.slice(0, 3).join(", ");
    if (finalGenres !== rawGenres) {
      console.log(`Series ${row.id} ("${row.title}") genres: "${rawGenres}" -> "${finalGenres}"`);
      await db.query("UPDATE series SET genres = ? WHERE id = ?", [finalGenres || null, row.id]);
      updatedCount++;
    }
  }

  console.log(`Migration 003 complete. Updated ${updatedCount} of ${seriesRows.length} series rows.`);
}

export async function down() {
  console.log("Migration 003 down: No-op as original invalid category data is not retained.");
}

if (process.argv[1]?.endsWith("003_cleanup_series_genres.ts")) {
  (async () => {
    try {
      await up();
      process.exit(0);
    } catch (err) {
      console.error("Migration 003 failed:", err);
      process.exit(1);
    }
  })();
}

