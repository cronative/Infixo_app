import { NextResponse } from "next/server";
import { db } from "@/lib/db";

async function ensureCustomLinksTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS creator_custom_links (
        id VARCHAR(100) PRIMARY KEY,
        creator_id VARCHAR(100) NOT NULL,
        email VARCHAR(255) DEFAULT NULL,
        title VARCHAR(255) NOT NULL,
        url VARCHAR(1000) NOT NULL,
        icon VARCHAR(50) DEFAULT 'link',
        is_enabled TINYINT(1) DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_creator_id (creator_id),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (e) {
    console.warn("ensureCustomLinksTable error:", e);
  }
}

// GET /api/creator/custom-links?email=...&username=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const username = searchParams.get("username");
    const creatorId = searchParams.get("creatorId");

    const lookupVal = email || username || creatorId;
    if (!lookupVal) {
      return NextResponse.json({ links: [] });
    }

    await ensureCustomLinksTable();

    // Resolve creator ID & email from creators table
    let targetCreatorId = creatorId || lookupVal;
    let targetEmail = email || lookupVal;

    try {
      const [creators]: any = await db.query(
        "SELECT id, email FROM creators WHERE id = ? OR email = ? OR username = ? LIMIT 1",
        [lookupVal, lookupVal, lookupVal]
      );
      if (creators && creators.length > 0) {
        targetCreatorId = creators[0].id;
        targetEmail = creators[0].email;
      }
    } catch {}

    const [rows]: any = await db.query(
      `SELECT id, title, url, icon, is_enabled AS isEnabled, sort_order AS sortOrder
       FROM creator_custom_links 
       WHERE creator_id = ? OR email = ?
       ORDER BY sort_order ASC, created_at ASC`,
      [targetCreatorId, targetEmail]
    );

    const links = (rows || []).map((r: any) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      icon: r.icon || "link",
      isEnabled: Boolean(r.isEnabled),
    }));

    return NextResponse.json({
      success: true,
      links,
    });
  } catch (err: any) {
    console.error("GET Custom Links Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/creator/custom-links (Save custom links array to MySQL database table creator_custom_links)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, links } = body;

    if (!email || !Array.isArray(links)) {
      return NextResponse.json({ error: "Email and links array required" }, { status: 400 });
    }

    await ensureCustomLinksTable();

    let creatorId = email;
    try {
      const [creators]: any = await db.query("SELECT id FROM creators WHERE email = ?", [email]);
      if (creators && creators.length > 0) {
        creatorId = creators[0].id;
      }
    } catch {}

    // Delete existing links for this creator in creator_custom_links table and insert updated list
    await db.query("DELETE FROM creator_custom_links WHERE creator_id = ? OR email = ?", [creatorId, email]);

    let savedCount = 0;
    for (let idx = 0; idx < links.length; idx++) {
      const item = links[idx];
      // Save link row if title or URL provided
      if (item.title || item.url) {
        const linkId = item.id || `link_${Date.now()}_${idx}`;
        await db.query(
          `INSERT INTO creator_custom_links (id, creator_id, email, title, url, icon, is_enabled, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            linkId,
            creatorId,
            email,
            (item.title || "").trim(),
            (item.url || "").trim(),
            item.icon || "link",
            item.isEnabled !== false ? 1 : 0,
            idx,
          ]
        );
        savedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      savedCount,
      message: `Saved ${savedCount} custom link(s) to MySQL table creator_custom_links`,
    });
  } catch (err: any) {
    console.error("POST Custom Links Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
