/**
 * One-time script: check-invalid-episodes.js
 * Scans the database episodes table and lists any episodes with invalid URLs
 * (e.g. homepage links, profile links, broken links, or tracking parameters).
 * 
 * Run with: node --env-file=.env scripts/check-invalid-episodes.js
 */

const mysql = require("mysql2/promise");

function normalizeVideoUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  let trimmed = rawUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const url = new URL(trimmed);
    const trackingParams = [
      "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
      "si", "feature", "igsh", "fbclid", "ref", "ref_src", "ref_url",
      "share_id", "locale", "mibextid", "rdid",
    ];
    trackingParams.forEach((param) => url.searchParams.delete(param));
    Array.from(url.searchParams.keys()).forEach((key) => {
      if (key.startsWith("utm_")) url.searchParams.delete(key);
    });

    const host = url.hostname.toLowerCase();
    if (host === "m.youtube.com" || host === "youtube.com") {
      url.hostname = "www.youtube.com";
    } else if (host === "m.facebook.com") {
      url.hostname = "www.facebook.com";
    } else if (host === "m.instagram.com") {
      url.hostname = "www.instagram.com";
    }
    url.hash = "";
    return url.href;
  } catch {
    return trimmed;
  }
}

function validateVideoUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.trim()) {
    return { isValid: false, reason: "Empty or missing URL" };
  }
  const normalized = normalizeVideoUrl(rawUrl);

  try {
    const url = new URL(normalized);
    const host = url.hostname.toLowerCase();
    const pathname = url.pathname;

    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      if (host.includes("youtu.be")) {
        const id = pathname.replace(/^\/+/, "").split("/")[0]?.split("?")[0];
        if (id && id.length >= 5) return { isValid: true, normalizedUrl: normalized };
      }
      const v = url.searchParams.get("v");
      if (v && v.trim().length >= 5) return { isValid: true, normalizedUrl: normalized };
      if (/\/shorts\/[a-zA-Z0-9_-]+/.test(pathname)) return { isValid: true, normalizedUrl: normalized };
      if (/\/live\/[a-zA-Z0-9_-]+/.test(pathname)) return { isValid: true, normalizedUrl: normalized };
      return { isValid: false, reason: "YouTube link is not a video/short/live (likely homepage or channel)" };
    }

    if (host.includes("instagram.com")) {
      if (/\/reels?\/[a-zA-Z0-9_-]+/.test(pathname)) return { isValid: true, normalizedUrl: normalized };
      if (/\/p\/[a-zA-Z0-9_-]+/.test(pathname)) return { isValid: true, normalizedUrl: normalized };
      return { isValid: false, reason: "Instagram link is not a reel or post" };
    }

    if (host.includes("facebook.com") || host.includes("fb.watch")) {
      if (host.includes("fb.watch")) return { isValid: true, normalizedUrl: normalized };
      if (/\/reels?\/[a-zA-Z0-9_.-]+/.test(pathname)) return { isValid: true, normalizedUrl: normalized };
      if (/\/videos\/[a-zA-Z0-9_.-]+/.test(pathname)) return { isValid: true, normalizedUrl: normalized };
      if (url.searchParams.get("v")) return { isValid: true, normalizedUrl: normalized };
      return { isValid: false, reason: "Facebook link is not a video or reel" };
    }

    return { isValid: true, normalizedUrl: normalized };
  } catch (err) {
    return { isValid: false, reason: `Malformed URL: ${err.message}` };
  }
}

async function main() {
  console.log("🔍 Checking episodes in database for invalid video URLs...");

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: parseInt(process.env.MYSQL_PORT || "3306", 10),
  });

  const [rows] = await connection.execute(
    `SELECT e.id, e.series_id, s.title AS series_title, e.episode_number, e.title, e.external_url, e.platform
     FROM episodes e
     LEFT JOIN series s ON s.id = e.series_id
     ORDER BY s.id, e.episode_number`
  );

  console.log(`Found total ${rows.length} episode(s).`);

  const invalidEpisodes = [];

  for (const ep of rows) {
    const res = validateVideoUrl(ep.external_url);
    if (!res.isValid) {
      invalidEpisodes.push({
        id: ep.id,
        series: ep.series_title || ep.series_id,
        episode_number: ep.episode_number,
        title: ep.title,
        url: ep.external_url,
        reason: res.reason,
      });
    }
  }

  if (invalidEpisodes.length === 0) {
    console.log("✅ All episodes have valid video URLs!");
  } else {
    console.log(`\n⚠️  Found ${invalidEpisodes.length} episode(s) with INVALID URLs:`);
    console.table(invalidEpisodes);
  }

  await connection.end();
}

main().catch((err) => {
  console.error("❌ Error running script:", err);
  process.exit(1);
});
