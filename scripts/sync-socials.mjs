import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.DEV_APP_ORIGIN || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET || "";

const args = process.argv.slice(2);
const isForce = args.includes("--force");
const usernameArg = args.find((a) => a.startsWith("--username="))?.split("=")[1];

async function runCronSync() {
  console.log("==================================================");
  console.log("🚀 Inflixo Automated Social Data Sync Runner");
  console.log("==================================================");
  console.log(`Endpoint: ${BASE_URL}/api/cron/sync-socials`);
  console.log(`Force Refresh: ${isForce ? "YES" : "NO (respects 24h/12h/3h tier policies)"}`);
  if (usernameArg) console.log(`Target Username: @${usernameArg}`);
  console.log("--------------------------------------------------");

  const queryParams = new URLSearchParams();
  if (isForce) queryParams.set("force", "true");
  if (usernameArg) queryParams.set("username", usernameArg);
  if (CRON_SECRET) queryParams.set("secret", CRON_SECRET);

  const url = `${BASE_URL}/api/cron/sync-socials?${queryParams.toString()}`;

  const headers = {};
  if (CRON_SECRET) {
    headers["Authorization"] = `Bearer ${CRON_SECRET}`;
  }

  const startTime = Date.now();
  try {
    const res = await fetch(url, { method: "POST", headers });
    const json = await res.json();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!res.ok || !json.status) {
      console.error(`❌ Sync Failed (${res.status}):`, json.message || json);
      process.exit(1);
    }

    console.log(`✅ Sync Completed in ${duration}s!`);
    console.log(`Processed Creators: ${json.data?.creatorsProcessed || 0}`);
    console.log("");
    console.log("Summary by Creator:");
    for (const item of json.data?.results || []) {
      console.log(` • @${item.username} [${(item.planKey || "FREE").toUpperCase()} - ${item.syncIntervalHours}h interval]`);
      console.log(`   Updated: ${item.platformsUpdated}, Skipped Fresh: ${item.platformsSkippedFresh || 0}`);
      for (const d of item.details) {
        if (d.status === "success") {
          console.log(`     - [${d.platform.toUpperCase()}] @${d.username}: ${d.followerCount.toLocaleString()} followers ✅`);
        } else if (d.status === "skipped_fresh") {
          console.log(`     - [${d.platform.toUpperCase()}] @${d.username}: Skipped (Fresh, next in ${d.hoursUntilNextSync}h) ⏳`);
        } else {
          console.log(`     - [${d.platform.toUpperCase()}] @${d.username}: ${d.status} ⚠️`);
        }
      }
    }
    console.log("==================================================");
  } catch (error) {
    console.error("❌ Network / Execution Error:", error.message);
    process.exit(1);
  }
}

runCronSync();
