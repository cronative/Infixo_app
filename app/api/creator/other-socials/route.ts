import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureOtherSocialsTable } from "@/lib/otherSocialsDb";

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

// GET /api/creator/other-socials?creatorId=... or ?email=... or ?username=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lookupVal = searchParams.get("creatorId") || searchParams.get("email") || searchParams.get("username");

    if (!lookupVal) {
      return NextResponse.json({ success: true, socials: [] });
    }

    await ensureOtherSocialsTable();

    const creator = await resolveCreatorId(lookupVal);
    const targetId = creator ? creator.id : lookupVal;

    const [rows]: any = await db.query(
      `SELECT id, creator_id AS creatorId, platform, username, url, label, sort_order AS sortOrder, is_active AS isActive, created_at AS createdAt
       FROM creator_other_socials
       WHERE creator_id = ?
       ORDER BY sort_order ASC, created_at ASC`,
      [targetId]
    );

    const socials = (rows || []).map((r: any) => ({
      id: r.id,
      creatorId: r.creatorId,
      platform: r.platform,
      username: r.username,
      url: r.url,
      label: r.label || "",
      sortOrder: Number(r.sortOrder || 0),
      isActive: Boolean(r.isActive),
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ success: true, socials });
  } catch (err: any) {
    console.error("GET other socials error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/creator/other-socials
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, creatorId: passedCreatorId, socials } = body;

    const lookupVal = passedCreatorId || email;
    if (!lookupVal || !Array.isArray(socials)) {
      return NextResponse.json({ error: "Creator identifier and socials array are required" }, { status: 400 });
    }

    await ensureOtherSocialsTable();

    const creator = await resolveCreatorId(lookupVal);
    const targetId = creator ? creator.id : lookupVal;

    // Delete existing and insert updated list (atomic replace)
    await db.query("DELETE FROM creator_other_socials WHERE creator_id = ?", [targetId]);

    for (let i = 0; i < socials.length; i++) {
      const s = socials[i];
      if (s.username || s.url) {
        const id = s.id || `soc_other_${Date.now()}_${i}`;
        await db.query(
          `INSERT INTO creator_other_socials (id, creator_id, platform, username, url, label, sort_order, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            targetId,
            s.platform || "other",
            (s.username || "").trim(),
            (s.url || "").trim(),
            (s.label || "").trim() || null,
            i,
            s.isActive !== false ? 1 : 0,
          ]
        );
      }
    }

    return NextResponse.json({ success: true, message: "Other social accounts saved successfully" });
  } catch (err: any) {
    console.error("POST other socials error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/creator/other-socials?id=...&creatorId=...
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const lookupVal = searchParams.get("creatorId") || searchParams.get("email");

    if (!id || !lookupVal) {
      return NextResponse.json({ error: "ID and creator identifier required" }, { status: 400 });
    }

    await ensureOtherSocialsTable();

    const creator = await resolveCreatorId(lookupVal);
    const targetId = creator ? creator.id : lookupVal;

    await db.query("DELETE FROM creator_other_socials WHERE id = ? AND creator_id = ?", [id, targetId]);

    return NextResponse.json({ success: true, message: "Social account deleted" });
  } catch (err: any) {
    console.error("DELETE other socials error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
