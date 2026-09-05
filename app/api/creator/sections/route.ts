import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSectionsTable } from "@/lib/sectionsDb";
import { DEFAULT_PROFILE_SECTIONS, ProfileSectionKey } from "@/types";

async function resolveCreatorId(lookupVal: string): Promise<{ id: string; email: string } | null> {
  if (!lookupVal) return null;
  try {
    const [rows]: any = await db.query(
      "SELECT id, email FROM creators WHERE id = ? OR email = ? OR username = ? LIMIT 1",
      [lookupVal, lookupVal, lookupVal]
    );
    if (rows && rows.length > 0) {
      return { id: rows[0].id, email: rows[0].email };
    }
  } catch {}
  return null;
}

// GET /api/creator/sections?creatorId=... or ?email=... or ?username=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lookupVal = searchParams.get("creatorId") || searchParams.get("email") || searchParams.get("username");

    if (!lookupVal) {
      return NextResponse.json({ success: true, sections: DEFAULT_PROFILE_SECTIONS });
    }

    await ensureSectionsTable();

    const creator = await resolveCreatorId(lookupVal);
    const targetId = creator ? creator.id : lookupVal;

    const [rows]: any = await db.query(
      `SELECT id, creator_id AS creatorId, section_key AS sectionKey, sort_order AS sortOrder, is_visible AS isVisible
       FROM creator_profile_sections
       WHERE creator_id = ?
       ORDER BY sort_order ASC`,
      [targetId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, sections: DEFAULT_PROFILE_SECTIONS, isDefault: true });
    }

    const map = new Map<string, { sortOrder: number; isVisible: boolean }>();
    rows.forEach((r: any) => {
      map.set(r.sectionKey, { sortOrder: Number(r.sortOrder), isVisible: Boolean(r.isVisible) });
    });

    // Merge with defaults so any newly added sections are never missed
    const combined = DEFAULT_PROFILE_SECTIONS.map((def, idx) => {
      const saved = map.get(def.sectionKey);
      if (saved) {
        return {
          sectionKey: def.sectionKey,
          label: def.label,
          sortOrder: saved.sortOrder,
          isVisible: saved.isVisible,
        };
      }
      return {
        ...def,
        sortOrder: 100 + idx,
      };
    }).sort((a, b) => a.sortOrder - b.sortOrder);

    return NextResponse.json({ success: true, sections: combined, isDefault: false });
  } catch (err: any) {
    console.error("GET sections error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/creator/sections (Save Section Ordering & Visibility)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, creatorId: passedCreatorId, sections } = body;

    const lookupVal = passedCreatorId || email;
    if (!lookupVal || !Array.isArray(sections)) {
      return NextResponse.json({ error: "Creator identifier and sections array required" }, { status: 400 });
    }

    await ensureSectionsTable();

    const creator = await resolveCreatorId(lookupVal);
    const targetId = creator ? creator.id : lookupVal;

    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      if (s.sectionKey) {
        const id = `sec_${targetId}_${s.sectionKey}`;
        await db.query(
          `INSERT INTO creator_profile_sections (id, creator_id, section_key, sort_order, is_visible)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             sort_order = VALUES(sort_order),
             is_visible = VALUES(is_visible),
             updated_at = NOW()`,
          [id, targetId, s.sectionKey, i, s.isVisible !== false ? 1 : 0]
        );
      }
    }

    return NextResponse.json({ success: true, message: "Profile section layout saved" });
  } catch (err: any) {
    console.error("POST sections error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
