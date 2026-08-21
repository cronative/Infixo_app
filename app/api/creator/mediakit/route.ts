import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Auto-create dedicated MySQL tables for Media Kit
async function ensureMediaKitTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS mediakit_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        whatsapp_number VARCHAR(50) DEFAULT NULL,
        sponsor_email VARCHAR(255) DEFAULT NULL,
        min_budget VARCHAR(50) DEFAULT NULL,
        bio_highlight TEXT DEFAULT NULL,
        accepting_sponsors TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS mediakit_gigs (
        id VARCHAR(100) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
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
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (e) {
    console.error("ensureMediaKitTables Error:", e);
  }
}

// GET /api/creator/mediakit?email=... or ?username=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get("email");
    const usernameParam = searchParams.get("username");

    if (!emailParam && !usernameParam) {
      return NextResponse.json({ error: "Email or username query param required" }, { status: 400 });
    }

    await ensureMediaKitTables();

    let targetEmail = emailParam;

    // If username supplied, resolve target email from creators table
    if (!targetEmail && usernameParam) {
      const [userRows]: any = await db.query(`SELECT email FROM creators WHERE username = ?`, [usernameParam]);
      if (userRows && userRows.length > 0) {
        targetEmail = userRows[0].email;
      } else {
        targetEmail = usernameParam; // fallback
      }
    }

    if (!targetEmail) {
      return NextResponse.json({ error: "Target email could not be resolved" }, { status: 404 });
    }

    // 1. Fetch Contact & Lead Routing Settings from `mediakit_settings` table
    const [settingsRows]: any = await db.query(
      `SELECT whatsapp_number, sponsor_email, min_budget, bio_highlight, accepting_sponsors 
       FROM mediakit_settings WHERE email = ?`,
      [targetEmail]
    );

    const s = settingsRows[0] || {};
    const settings = {
      whatsappNumber: s.whatsapp_number || "",
      sponsorEmail: s.sponsor_email || "",
      minBudget: (s.min_budget === "₹0" || !s.min_budget) ? "" : s.min_budget,
      bioHighlight: s.bio_highlight || "",
      acceptingSponsors: s.accepting_sponsors === 1 || s.accepting_sponsors === true,
    };

    // 2. Fetch Gigs / Rate Cards from `mediakit_gigs` table
    const [gigsRows]: any = await db.query(
      `SELECT id, title, platform, price, min_price AS minPrice, max_price AS maxPrice, 
              package_name AS packageName, turnaround_days AS turnaroundDays, 
              deliverables, badge, is_popular AS isPopular, is_active AS isActive 
       FROM mediakit_gigs WHERE email = ? ORDER BY created_at ASC`,
      [targetEmail]
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
    const { email, settings, packages } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await ensureMediaKitTables();

    // 1. Save Settings to `mediakit_settings` table
    const whatsapp = settings?.whatsappNumber || null;
    const sponsorEmail = settings?.sponsorEmail || null;
    const minBudget = settings?.minBudget || null;
    const bioHighlight = settings?.bioHighlight || null;
    const accepting = settings?.acceptingSponsors !== false ? 1 : 0;

    await db.query(
      `INSERT INTO mediakit_settings (email, whatsapp_number, sponsor_email, min_budget, bio_highlight, accepting_sponsors)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         whatsapp_number = VALUES(whatsapp_number),
         sponsor_email = VALUES(sponsor_email),
         min_budget = VALUES(min_budget),
         bio_highlight = VALUES(bio_highlight),
         accepting_sponsors = VALUES(accepting_sponsors)`,
      [email, whatsapp, sponsorEmail, minBudget, bioHighlight, accepting]
    );

    // 2. Synchronize Gigs to `mediakit_gigs` table
    const incomingPackages: any[] = packages || [];
    const incomingIds = incomingPackages.map((p) => p.id);

    // Delete removed gigs for this email
    if (incomingIds.length > 0) {
      const placeholders = incomingIds.map(() => "?").join(",");
      await db.query(`DELETE FROM mediakit_gigs WHERE email = ? AND id NOT IN (${placeholders})`, [email, ...incomingIds]);
    } else {
      await db.query(`DELETE FROM mediakit_gigs WHERE email = ?`, [email]);
    }

    // Insert or Update each gig row
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
           (id, email, title, platform, price, min_price, max_price, package_name, turnaround_days, deliverables, badge, is_popular, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
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
          email,
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
      message: "Media Kit settings & gigs saved to dedicated MySQL tables successfully!",
    });
  } catch (err: any) {
    console.error("POST Media Kit Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
