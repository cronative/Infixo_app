import { db } from "@/lib/db";
import { isAuthorizedAdmin } from "@/lib/adminAuth";
import { apiSuccess, apiError } from "@/lib/apiResponse";

async function ensureMediaKitTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS mediakit_gigs (
        id VARCHAR(100) PRIMARY KEY,
        creator_id VARCHAR(100) NOT NULL,
        email VARCHAR(255) DEFAULT NULL,
        title VARCHAR(255) NOT NULL,
        platform VARCHAR(100) NOT NULL,
        price VARCHAR(100) NOT NULL,
        min_price VARCHAR(100) DEFAULT NULL,
        max_price VARCHAR(100) DEFAULT NULL,
        package_name VARCHAR(100) DEFAULT NULL,
        turnaround_days INT DEFAULT 2,
        deliverables JSON NOT NULL,
        badge VARCHAR(100) DEFAULT NULL,
        is_popular TINYINT(1) DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_creator_id (creator_id),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (e) {
    console.warn("ensureMediaKitTables warn:", e);
  }
}

export async function GET(req: Request) {
  try {
    if (!(await isAuthorizedAdmin(req))) {
      return apiError("Unauthorized admin access", 401);
    }

    let creators: any[] = [];
    const stats = {
      totalCreators: 0,
      activeCreators: 0,
      suspendedCreators: 0,
      newThisWeek: 0,
      totalSeries: 0,
      totalEpisodes: 0,
      totalActiveGigs: 0,
      totalProfileViews: 0,
      totalEpisodeClicks: 0,
      totalReviews: 0,
      vipSubscribers: 0,
      proSubscribers: 0,
      starterSubscribers: 0,
      freeTrialSubscribers: 0,
      estimatedMRR: 0,
    };

    await ensureMediaKitTables();

    try {
      // Ensure status and is_verified columns exist on creators table
      try {
        await db.query("ALTER TABLE creators ADD COLUMN status VARCHAR(20) DEFAULT 'active'");
      } catch {}
      try {
        await db.query("ALTER TABLE creators ADD COLUMN is_verified TINYINT(1) DEFAULT 0");
      } catch {}

      const [rows]: any = await db.query(`
        SELECT 
          c.id,
          c.email,
          c.display_name AS displayName,
          c.username,
          c.photo_url AS photoDataUrl,
          c.category,
          c.custom_category AS customCategory,
          c.profession,
          c.bio,
          c.city,
          c.state,
          c.country,
          c.theme_key AS themeKey,
          c.theme_changes_count AS themeChangesCount,
          COALESCE(c.is_verified, 0) AS isVerified,
          COALESCE(c.status, 'active') AS accountStatus,
          c.created_at AS createdAt,
          c.updated_at AS updatedAt,
          s.plan_key AS planKey,
          s.plan_name AS planName,
          s.billing_cycle AS billingCycle,
          s.status AS planStatus,
          (SELECT COUNT(*) FROM series WHERE creator_id = c.id) AS seriesCount,
          (SELECT COUNT(*) FROM mediakit_gigs WHERE (creator_id = c.id OR email = c.email) AND is_active = 1) AS gigsCount,
          (SELECT MIN(price) FROM mediakit_gigs WHERE (creator_id = c.id OR email = c.email) AND is_active = 1) AS minGigPrice,
          (SELECT MAX(price) FROM mediakit_gigs WHERE (creator_id = c.id OR email = c.email) AND is_active = 1) AS maxGigPrice,
          (SELECT COUNT(*) FROM analytics_events WHERE creator_id = c.id AND event_type = 'profile_view') AS profileViews,
          (SELECT COUNT(*) FROM analytics_events WHERE creator_id = c.id AND event_type = 'episode_click') AS episodeClicks,
          (SELECT COUNT(*) FROM creator_reviews WHERE creator_id = c.id OR email = c.email) AS reviewsCount
        FROM creators c
        LEFT JOIN subscriptions s ON c.id = s.creator_id
        ORDER BY c.id DESC
      `);

      creators = rows || [];

      // Calculate founder summary metrics
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      stats.totalCreators = creators.length;
      stats.activeCreators = creators.filter((c) => c.accountStatus !== "suspended").length;
      stats.suspendedCreators = creators.filter((c) => c.accountStatus === "suspended").length;
      stats.newThisWeek = creators.filter((c) => c.createdAt && new Date(c.createdAt) >= oneWeekAgo).length;

      stats.vipSubscribers = creators.filter(
        (c) => c.planKey === "creator_VIP" || (c.planName && c.planName.toLowerCase().includes("vip"))
      ).length;
      stats.proSubscribers = creators.filter(
        (c) => c.planKey === "pro" || (c.planName && c.planName.toLowerCase().includes("pro"))
      ).length;
      stats.starterSubscribers = creators.filter(
        (c) => c.planKey === "starter" || (c.planName && c.planName.toLowerCase().includes("starter"))
      ).length;
      stats.freeTrialSubscribers = stats.totalCreators - (stats.vipSubscribers + stats.proSubscribers + stats.starterSubscribers);

      // Estimated MRR: Starter = ₹199/mo, Pro = ₹599/mo, VIP = ₹1499/mo
      stats.estimatedMRR = (stats.starterSubscribers * 199) + (stats.proSubscribers * 599) + (stats.vipSubscribers * 1499);

      stats.totalActiveGigs = creators.reduce((acc, c) => acc + Number(c.gigsCount || 0), 0);
      stats.totalSeries = creators.reduce((acc, c) => acc + Number(c.seriesCount || 0), 0);
      stats.totalProfileViews = creators.reduce((acc, c) => acc + Number(c.profileViews || 0), 0);
      stats.totalEpisodeClicks = creators.reduce((acc, c) => acc + Number(c.episodeClicks || 0), 0);
      stats.totalReviews = creators.reduce((acc, c) => acc + Number(c.reviewsCount || 0), 0);

      try {
        const [epRows]: any = await db.query("SELECT COUNT(*) AS total FROM episodes");
        stats.totalEpisodes = epRows?.[0]?.total || 0;
      } catch {
        stats.totalEpisodes = 0;
      }
    } catch (dbErr) {
      console.warn("Admin creators DB fetch fallback:", dbErr);
    }

    return apiSuccess({
      creators,
      stats,
    }, "Creators retrieved successfully");
  } catch (err: any) {
    return apiError(err.message || "Failed to fetch creators", 500);
  }
}

export async function POST(req: Request) {
  try {
    if (!(await isAuthorizedAdmin(req))) {
      return apiError("Unauthorized admin access", 401);
    }

    const body = await req.json();
    const { action, creatorId, email, planKey, planName } = body;

    if (!creatorId && !email) {
      return apiError("creatorId or email required", 400);
    }

    // Find creator ID
    let targetCreatorId = creatorId;
    if (!targetCreatorId && email) {
      const [rows]: any = await db.query("SELECT id FROM creators WHERE email = ?", [email]);
      if (rows && rows.length > 0) {
        targetCreatorId = rows[0].id;
      }
    }

    if (!targetCreatorId) {
      return apiError("Creator not found", 404);
    }

    if (action === "grant_vip" || action === "set_plan") {
      const targetPlanKey = planKey || (action === "grant_vip" ? "creator_VIP" : "starter");
      const targetPlanName = planName || (targetPlanKey === "creator_VIP" ? "VIP" : targetPlanKey === "pro" ? "Pro" : "Starter");

      await db.query(
        `INSERT INTO subscriptions (creator_id, plan_key, plan_name, billing_cycle, status, activated_at)
         VALUES (?, ?, ?, 'monthly', 'active', NOW())
         ON DUPLICATE KEY UPDATE plan_key = VALUES(plan_key), plan_name = VALUES(plan_name), status = 'active', activated_at = NOW()`,
        [targetCreatorId, targetPlanKey, targetPlanName]
      );
      return apiSuccess({}, `${targetPlanName} Plan assigned successfully!`);
    }

    if (action === "toggle_status") {
      const [current]: any = await db.query("SELECT status FROM creators WHERE id = ?", [targetCreatorId]);
      const currentStatus = current?.[0]?.status || "active";
      const newStatus = currentStatus === "active" ? "suspended" : "active";

      await db.query("UPDATE creators SET status = ? WHERE id = ?", [newStatus, targetCreatorId]);
      return apiSuccess({
        newStatus,
      }, `Account status updated to ${newStatus}`);
    }

    if (action === "toggle_verified") {
      const [current]: any = await db.query("SELECT is_verified FROM creators WHERE id = ?", [targetCreatorId]);
      const currentVal = Boolean(current?.[0]?.is_verified);
      const newVal = currentVal ? 0 : 1;

      await db.query("UPDATE creators SET is_verified = ? WHERE id = ?", [newVal, targetCreatorId]);
      return apiSuccess({
        isVerified: Boolean(newVal),
      }, newVal ? "Creator verified badge granted!" : "Creator verified badge removed");
    }

    return apiError("Invalid action", 400);
  } catch (err: any) {
    console.error("Admin POST Action Error:", err);
    return apiError(err.message || "Failed to execute admin action", 500);
  }
}
