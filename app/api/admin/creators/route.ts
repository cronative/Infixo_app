import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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

export async function GET() {
  try {
    let creators: any[] = [];
    let stats = {
      totalCreators: 0,
      totalSeries: 0,
      totalEpisodes: 0,
      totalActiveGigs: 0,
      vipSubscribers: 0,
    };

    await ensureMediaKitTables();

    try {
      // Ensure status column exists on creators table
      try {
        await db.query("ALTER TABLE creators ADD COLUMN status VARCHAR(20) DEFAULT 'active'");
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
          c.is_verified AS isVerified,
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
          (SELECT MAX(price) FROM mediakit_gigs WHERE (creator_id = c.id OR email = c.email) AND is_active = 1) AS maxGigPrice
        FROM creators c
        LEFT JOIN subscriptions s ON c.id = s.creator_id
        ORDER BY c.id DESC
      `);

      creators = rows || [];

      // Calculate summary metrics
      stats.totalCreators = creators.length;
      stats.vipSubscribers = creators.filter(
        (c) => c.planKey === "creator_VIP" || (c.planName && c.planName.toLowerCase().includes("vip"))
      ).length;
      stats.totalActiveGigs = creators.reduce((acc, c) => acc + Number(c.gigsCount || 0), 0);
      stats.totalSeries = creators.reduce((acc, c) => acc + Number(c.seriesCount || 0), 0);

      try {
        const [epRows]: any = await db.query("SELECT COUNT(*) AS total FROM episodes");
        stats.totalEpisodes = epRows?.[0]?.total || 0;
      } catch {
        stats.totalEpisodes = 0;
      }
    } catch (dbErr) {
      console.warn("Admin creators DB fetch fallback:", dbErr);
    }

    return NextResponse.json({
      success: true,
      creators,
      stats,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, creatorId, email } = body;

    if (!creatorId && !email) {
      return NextResponse.json({ error: "creatorId or email required" }, { status: 400 });
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
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    if (action === "grant_vip") {
      await db.query(
        `INSERT INTO subscriptions (creator_id, plan_key, plan_name, billing_cycle, status, activated_at)
         VALUES (?, 'creator_VIP', 'Creator VIP', 'yearly', 'active', NOW())
         ON DUPLICATE KEY UPDATE plan_key = 'creator_VIP', plan_name = 'Creator VIP', status = 'active', activated_at = NOW()`,
        [targetCreatorId]
      );
      return NextResponse.json({ success: true, message: "VIP Plan granted successfully!" });
    }

    if (action === "toggle_status") {
      const [current]: any = await db.query("SELECT status FROM creators WHERE id = ?", [targetCreatorId]);
      const currentStatus = current?.[0]?.status || "active";
      const newStatus = currentStatus === "active" ? "suspended" : "active";

      await db.query("UPDATE creators SET status = ? WHERE id = ?", [newStatus, targetCreatorId]);
      return NextResponse.json({
        success: true,
        newStatus,
        message: `Account status updated to ${newStatus}`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Admin POST Action Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
