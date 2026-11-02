import "dotenv/config";
import mysql from "mysql2/promise";
import { db } from "@/lib/db";
import { normalizeSeriesGenres } from "@/lib/seriesGenres";
import type { RowDataPacket } from "mysql2";

interface SeriesRow extends RowDataPacket {
  id: string;
  title: string;
  genres: string | null;
}

export async function up(targetDb: mysql.Pool | mysql.Connection = db, dbName: string = "default") {
  console.log(`\n🚀 Running 004_update_series_genres_grouped migration on [${dbName}]...`);

  const [rows] = await targetDb.query<SeriesRow[]>(
    "SELECT id, title, genres FROM series"
  );

  let updatedCount = 0;

  for (const row of rows) {
    const originalGenres = row.genres || "";
    const cleanedGenres = normalizeSeriesGenres(originalGenres);

    if (originalGenres !== cleanedGenres) {
      await targetDb.query(
        "UPDATE series SET genres = ? WHERE id = ?",
        [cleanedGenres || null, row.id]
      );
      console.log(
        `✓ Updated series "${row.title}" (${row.id}): "${originalGenres}" → "${cleanedGenres || "<none>"}"`
      );
      updatedCount++;
    }
  }

  console.log(
    `✓ Finished 004_update_series_genres_grouped on [${dbName}]: ${updatedCount} rows updated out of ${rows.length} total series.`
  );
}

export async function down(targetDb: mysql.Pool | mysql.Connection = db, dbName: string = "default") {
  console.log(`\nℹ️ 004_update_series_genres_grouped down: Genre normalization is a forward canonicalization; no down migration needed on [${dbName}].`);
}

async function run() {
  const isProd = process.argv.includes("--prod");
  const isAll = process.argv.includes("--all");

  const runProd = isProd || isAll;
  const runDev = !isProd || isAll;

  if (runDev) {
    try {
      await up(db, process.env.MYSQL_DATABASE || "inflixo_db");
    } catch (err) {
      console.error("Dev migration error:", err);
      if (!runProd) process.exit(1);
    }
  }

  if (runProd && process.env.PROD_MYSQL_HOST && process.env.PROD_MYSQL_DATABASE) {
    const prodPool = mysql.createPool({
      host: process.env.PROD_MYSQL_HOST,
      port: Number(process.env.PROD_MYSQL_PORT) || 3306,
      user: process.env.PROD_MYSQL_USER,
      password: process.env.PROD_MYSQL_PASSWORD,
      database: process.env.PROD_MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 5,
    });

    try {
      await up(prodPool, process.env.PROD_MYSQL_DATABASE);
    } catch (err) {
      console.error("Prod migration error:", err);
      process.exit(1);
    } finally {
      await prodPool.end();
    }
  }

  process.exit(0);
}

if (process.argv[1]?.endsWith("004_update_series_genres_grouped.ts")) {
  run().catch((err) => {
    console.error("Migration execution failed:", err);
    process.exit(1);
  });
}

