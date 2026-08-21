import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Auto-create & migrate dedicated MySQL tables for Media Kit with creator_id
async function ensureMediaKitTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS mediakit_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        creator_id VARCHAR(100) DEFAULT NULL,
        email VARCHAR(255) DEFAULT NULL,
        whatsapp_number VARCHAR(50) DEFAULT NULL,
        sponsor_email VARCHAR(255) DEFAULT NULL,
        min_budget VARCHAR(50) DEFAULT NULL,
        bio_highlight TEXT DEFAULT NULL,
        accepting_sponsors TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_creator (creator_id),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS mediakit_gigs (
        id VARCHAR(100) PRIMARY KEY,
        creator_id VARCHAR(100) DEFAULT NULL,
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

    // Ensure columns exist on existing tables if created previously
    try { await db.query("ALTER TABLE mediakit_settings ADD COLUMN creator_id VARCHAR(100) DEFAULT NULL"); } catch {}
    try { await db.query("ALTER TABLE mediakit_gigs ADD COLUMN creator_id VARCHAR(100) DEFAULT NULL"); } catch {}
  } catch (e) {
    console.error("ensureMediaKitTables Error:", e);
  }
}

// Helper: Resolve Creator Record from creators table by ID, Email, or Username
async function resolveCreatorRecord(queryVal: string) {
  if (!queryVal) return null;
  try {
    const [rows]: any = await db.query(
      `SELECT id, email, username FROM creators WHERE id = ? OR email = ? OR username = ? LIMIT 1`,
      [queryVal, queryVal, queryVal]
    );
    if (rows && rows.length > 0) {
      return {
        creatorId: rows[0].id,
        email: rows[0].email,
        username: rows[0].username,
      };
    }
  } catch (e) {
    console.warn("Error resolving creator record:", e);
  }
  return null;
}

// GET /api/creator/mediakit?creatorId=...&email=...&username=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const creatorIdParam = searchParams.get("creatorId");
    const emailParam = searchParams.get("email");
    const usernameParam = searchParams.get("username");

    const lookupVal = creatorIdParam || emailParam || usernameParam;
    if (!lookupVal) {
      return NextResponse.json({ error: "creatorId, email, or username query param required" }, { status: 400 });
    }

    await ensureMediaKitTables();

    const creatorRecord = await resolveCreatorRecord(lookupVal);
    const resolvedCreatorId = creatorRecord?.creatorId || creatorIdParam || lookupVal;
    const resolvedEmail = creatorRecord?.email || emailParam || lookupVal;

    // 1. Fetch Settings by creator_id OR email
    const [settingsRows]: any = await db.query(
      `SELECT whatsapp_number, sponsor_email, min_budget, bio_highlight, accepting_sponsors 
       FROM mediakit_settings WHERE creator_id = ? OR email = ? OR email = ? LIMIT 1`,
      [resolvedCreatorId, resolvedEmail, lookupVal]
    );

    const s = settingsRows[0] || {};
    const settings = {
      whatsappNumber: s.whatsapp_number || "",
      sponsorEmail: s.sponsor_email || "",
      minBudget: (s.min_budget === "₹0" || !s.min_budget) ? "" : s.min_budget,
      bioHighlight: s.bio_highlight || "",
      acceptingSponsors: s.accepting_sponsors === 1 || s.accepting_sponsors === true,
    };

    // 2. Fetch Gigs by creator_id OR email
    const [gigsRows]: any = await db.query(
      `SELECT id, creator_id AS creatorId, email, title, platform, price, min_price AS minPrice, max_price AS maxPrice, 
              package_name AS packageName, turnaround_days AS turnaroundDays, 
              deliverables, badge, is_popular AS isPopular, is_active AS isActive 
       FROM mediakit_gigs WHERE creator_id = ? OR email = ? OR email = ? ORDER BY created_at ASC`,
      [resolvedCreatorId, resolvedEmail, lookupVal]
    );

    const packages = (gigsRows || []).map((row: any) => {
      let deliverables = [];
      try {
        deliverables = typeof row.deliverables === "string" ? JSON.parse(row.deliverables) : (row.deliverables || []);
      } catch {
        deliverables = [];
      }
      return {
        id: row.id,
        creatorId: row.creatorId || resolvedCreatorId,
        title: row.title,
        platform: row.platform,
        price: row.price,
        minPrice: row.minPrice || undefined,
        maxPrice: row.maxPrice || undefined,
        packageName: row.packageName || undefined,
        turnaroundDays: row.turnaroundDays || 2,
        deliverables: deliverables,
        badge: row.badge || undefined,
        isPopular: Boolean(row.isPopular),
        isActive: Boolean(row.isActive),
      };
    });

    return NextResponse.json({
      success: true,
      creatorId: resolvedCreatorId,
      settings,
      packages,
    });
  } catch (err: any) {
    console.error("GET Media Kit Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/creator/mediakit
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { creatorId: inputCreatorId, email: inputEmail, settings, packages } = body;

    const lookupVal = inputCreatorId || inputEmail;
    if (!lookupVal) {
      return NextResponse.json({ error: "creatorId or email is required" }, { status: 400 });
    }

    await ensureMediaKitTables();

    const creatorRecord = await resolveCreatorRecord(lookupVal);
    const resolvedCreatorId = creatorRecord?.creatorId || inputCreatorId || lookupVal;
    const resolvedEmail = creatorRecord?.email || inputEmail || lookupVal;

    // 1. Save Settings tied to creator_id & email
    const whatsapp = settings?.whatsappNumber || null;
    const sponsorEmail = settings?.sponsorEmail || null;
    const minBudget = settings?.minBudget || null;
    const bioHighlight = settings?.bioHighlight || null;
    const accepting = settings?.acceptingSponsors !== false ? 1 : 0;

    await db.query(
      `INSERT INTO mediakit_settings (creator_id, email, whatsapp_number, sponsor_email, min_budget, bio_highlight, accepting_sponsors)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         email = VALUES(email),
         whatsapp_number = VALUES(whatsapp_number),
         sponsor_email = VALUES(sponsor_email),
         min_budget = VALUES(min_budget),
         bio_highlight = VALUES(bio_highlight),
         accepting_sponsors = VALUES(accepting_sponsors)`,
      [resolvedCreatorId, resolvedEmail, whatsapp, sponsorEmail, minBudget, bioHighlight, accepting]
    );

    // 2. Synchronize Gigs tied to creator_id & email
    const incomingPackages: any[] = packages || [];
    const incomingIds = incomingPackages.map((p) => p.id);

    // Delete removed gigs for this creator_id/email
    if (incomingIds.length > 0) {
      const placeholders = incomingIds.map(() => "?").join(",");
      await db.query(
        `DELETE FROM mediakit_gigs WHERE (creator_id = ? OR email = ?) AND id NOT IN (${placeholders})`,
        [resolvedCreatorId, resolvedEmail, ...incomingIds]
      );
    } else {
      await db.query(`DELETE FROM mediakit_gigs WHERE creator_id = ? OR email = ?`, [resolvedCreatorId, resolvedEmail]);
    }

    // Insert or Update each gig row with creator_id
    for (const pkg of incomingPackages) {
      const deliverablesJson = JSON.stringify(pkg.deliverables || []);
      const minPrice = pkg.minPrice || null;
      const maxPrice = pkg.maxPrice || null;
      const packageName = pkg.packageName || null;
      const badge = pkg.badge || null;
      const isPopular = pkg.isPopular ? 1 : 0;
      const isActive = pkg.isActive !== false ? 1 : 0;
      const turnaround = Number(pkg.turnaroundDays) || 2;

      await db.query(
        `INSERT INTO mediakit_gigs 
           (id, creator_id, email, title, platform, price, min_price, max_price, package_name, turnaround_days, deliverables, badge, is_popular, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           creator_id = VALUES(creator_id),
           email = VALUES(email),
           title = VALUES(title),
           platform = VALUES(platform),
           price = VALUES(price),
           min_price = VALUES(min_price),
           max_price = VALUES(max_price),
           package_name = VALUES(package_name),
           turnaround_days = VALUES(turnaround_days),
           deliverables = VALUES(deliverables),
           badge = VALUES(badge),
           is_popular = VALUES(is_popular),
           is_active = VALUES(is_active)`,
        [
          pkg.id,
          resolvedCreatorId,
          resolvedEmail,
          pkg.title,
          pkg.platform,
          pkg.price,
          minPrice,
          maxPrice,
          packageName,
          turnaround,
          deliverablesJson,
          badge,
          isPopular,
          isActive,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      creatorId: resolvedCreatorId,
      message: "Media Kit settings & gigs saved to MySQL DB by creator_id successfully!",
    });
  } catch (err: any) {
    console.error("POST Media Kit Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
