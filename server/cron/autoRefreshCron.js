const cron = require("node-cron");
const db = require("../config/db");

// Function to perform auto-refresh on social account stats
async function runAutoDataRefresh() {
  console.log("⏱️  [Cron Job] Checking social account data auto-refreshes...");

  try {
    // 1. Fetch creators with active plans and their refresh intervals
    const [creators] = await db.query(
      `SELECT c.id, c.username, s.plan_key, s.status
       FROM creators c
       INNER JOIN subscriptions s ON c.id = s.creator_id
       WHERE s.status IN ('trial', 'active')`
    );

    for (let creator of creators) {
      // Determine interval in hours based on plan
      let refreshHours = 24;
      if (creator.plan_key === "growth") refreshHours = 18;
      if (creator.plan_key === "pro") refreshHours = 12;
      if (creator.plan_key === "unlimited") refreshHours = 3;

      // Find social accounts needing sync
      const [accounts] = await db.query(
        `SELECT * FROM social_accounts 
         WHERE creator_id = ? 
         AND (last_synced_at IS NULL OR last_synced_at < DATE_SUB(NOW(), INTERVAL ? HOUR))`,
        [creator.id, refreshHours]
      );

      if (accounts.length > 0) {
        console.log(`🔄 Auto-refreshing ${accounts.length} social accounts for creator @${creator.username} (${creator.plan_key.toUpperCase()} Plan - ${refreshHours}h cycle)...`);
        
        // Update sync timestamp
        await db.query(
          `UPDATE social_accounts SET last_synced_at = NOW() WHERE creator_id = ?`,
          [creator.id]
        );
      }
    }
    console.log("✅ [Cron Job] Auto-refresh check completed.");
  } catch (error) {
    console.error("❌ [Cron Job Error]:", error.message);
  }
}

// Schedule cron job to run every hour at minute 0
function initCronJobs() {
  console.log("📅 Scheduling Inflixo Auto-Data Refresh Cron Job (Runs hourly check)...");
  cron.schedule("0 * * * *", () => {
    runAutoDataRefresh();
  });
}

module.exports = { initCronJobs, runAutoDataRefresh };
