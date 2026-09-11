import { NextResponse } from "next/server";
import { db } from "@/lib/db";

async function ensureCustomLinksTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS creator_custom_links (
        id VARCHAR(100) PRIMARY KEY,
        creator_id VARCHAR(100) NOT NULL,
        email VARCHAR(255) DEFAULT NULL,
        parent_id VARCHAR(100) DEFAULT NULL,
        link_type VARCHAR(30) DEFAULT 'link',
        title VARCHAR(255) NOT NULL,
        url VARCHAR(1000) DEFAULT NULL,
        icon VARCHAR(50) DEFAULT 'link',
        is_enabled TINYINT(1) DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_creator_id (creator_id),
        INDEX idx_email (email),
        INDEX idx_parent_id (parent_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await db.query("ALTER TABLE creator_custom_links ADD COLUMN parent_id VARCHAR(100) DEFAULT NULL").catch(() => {});
    await db.query("ALTER TABLE creator_custom_links ADD COLUMN link_type VARCHAR(30) DEFAULT 'link'").catch(() => {});
    await db.query("ALTER TABLE creator_custom_links MODIFY COLUMN url VARCHAR(1000) DEFAULT NULL").catch(() => {});
    await db.query("ALTER TABLE creator_custom_links ADD INDEX idx_parent_id (parent_id)").catch(() => {});
  } catch (e) {
    console.warn("ensureCustomLinksTable error:", e);
  }
}

function normalizeCustomLinks(rows: any[]) {
  const parents: any[] = [];
  const childrenByParent = new Map<string, any[]>();

  for (const r of rows || []) {
    const row = {
      id: r.id,
      title: r.title,
      url: r.url || "",
      icon: r.icon || "link",
      isEnabled: Boolean(r.isEnabled),
      kind: r.linkType === "collection" ? "collection" : "link",
      parentId: r.parentId || null,
    };

    if (row.parentId) {
      const childList = childrenByParent.get(row.parentId) || [];
      childList.push({
        id: row.id,
        title: row.title,
        url: row.url,
        icon: row.icon,
        isEnabled: row.isEnabled,
      });
      childrenByParent.set(row.parentId, childList);
    } else {
      parents.push(row);
    }
  }

  return parents.map((link) => {
    if (link.kind !== "collection") {
      const { parentId, ...rest } = link;
      return rest;
    }
    const { parentId, ...rest } = link;
    return {
      ...rest,
      url: rest.url || "",
      items: childrenByParent.get(link.id) || [],
    };
  });
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
      `SELECT id, parent_id AS parentId, link_type AS linkType, title, url, icon, is_enabled AS isEnabled, sort_order AS sortOrder
       FROM creator_custom_links 
       WHERE creator_id = ? OR email = ?
       ORDER BY COALESCE(parent_id, id) ASC, parent_id IS NOT NULL ASC, sort_order ASC, created_at ASC`,
      [targetCreatorId, targetEmail]
    );

    const links = normalizeCustomLinks(rows || []);

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
      if (item.title || item.url || (item.kind === "collection" && Array.isArray(item.items))) {
        const linkId = item.id || `link_${Date.now()}_${idx}`;
        await db.query(
          `INSERT INTO creator_custom_links (id, creator_id, email, parent_id, link_type, title, url, icon, is_enabled, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            linkId,
            creatorId,
            email,
            null,
            item.kind === "collection" ? "collection" : "link",
            (item.title || "").trim(),
            (item.url || "").trim(),
            item.icon || "link",
            item.isEnabled !== false ? 1 : 0,
            idx,
          ]
        );
        savedCount++;

        if (item.kind === "collection" && Array.isArray(item.items)) {
          for (let childIdx = 0; childIdx < item.items.length; childIdx++) {
            const child = item.items[childIdx];
            if (!child.title && !child.url) continue;
            await db.query(
              `INSERT INTO creator_custom_links (id, creator_id, email, parent_id, link_type, title, url, icon, is_enabled, sort_order)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                child.id || `${linkId}_item_${Date.now()}_${childIdx}`,
                creatorId,
                email,
                linkId,
                "collection_item",
                (child.title || "").trim(),
                (child.url || "").trim(),
                child.icon || "link",
                child.isEnabled !== false ? 1 : 0,
                childIdx,
              ]
            );
          }
        }
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
