import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureCollaborationsTable } from "@/lib/collaborationsDb";
import { saveBase64Image } from "@/lib/imageStorage";

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

// GET /api/creator/collaborations?creatorId=... or ?email=... or ?username=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lookupVal = searchParams.get("creatorId") || searchParams.get("email") || searchParams.get("username");

    if (!lookupVal) {
      return NextResponse.json({ success: true, collaborations: [] });
    }

    await ensureCollaborationsTable();

    const creator = await resolveCreatorId(lookupVal);
    const targetId = creator ? creator.id : lookupVal;

    const [rows]: any = await db.query(
      `SELECT id, creator_id AS creatorId, brand_name AS brandName, brand_logo_url AS brandLogoUrl, campaign_title AS campaignTitle, campaign_url AS campaignUrl, description, sort_order AS sortOrder, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt
       FROM creator_collaborations
       WHERE creator_id = ?
       ORDER BY sort_order ASC, created_at ASC`,
      [targetId]
    );

    const collaborations = (rows || []).map((c: any) => ({
      id: c.id,
      creatorId: c.creatorId,
      brandName: c.brandName,
      brandLogoUrl: c.brandLogoUrl || null,
      campaignTitle: c.campaignTitle || "",
      campaignUrl: c.campaignUrl || "",
      description: c.description || "",
      sortOrder: Number(c.sortOrder || 0),
      isActive: Boolean(c.isActive),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return NextResponse.json({ success: true, collaborations });
  } catch (err: any) {
    console.error("GET collaborations error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/creator/collaborations (Add/Update or Reorder Collaboration)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, creatorId: passedCreatorId, action, collaboration, collaborations } = body;

    const lookupVal = passedCreatorId || email;
    if (!lookupVal) {
      return NextResponse.json({ error: "Creator identifier required" }, { status: 400 });
    }

    await ensureCollaborationsTable();

    const creator = await resolveCreatorId(lookupVal);
    const targetId = creator ? creator.id : lookupVal;

    if (action === "reorder" && Array.isArray(collaborations)) {
      for (let i = 0; i < collaborations.length; i++) {
        const item = collaborations[i];
        if (item.id) {
          await db.query(
            "UPDATE creator_collaborations SET sort_order = ? WHERE id = ? AND creator_id = ?",
            [i, item.id, targetId]
          );
        }
      }
      return NextResponse.json({ success: true, message: "Collaborations reordered" });
    }

    const c = collaboration || body;
    if (!c.brandName || !c.brandName.trim()) {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
    }

    const finalLogoUrl = saveBase64Image(c.brandLogoUrl, "collaborations", "collab_logo") || (c.brandLogoUrl && !c.brandLogoUrl.startsWith("data:") ? c.brandLogoUrl : null);
    const collabId = c.id || `collab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.query(
      `INSERT INTO creator_collaborations (id, creator_id, brand_name, brand_logo_url, campaign_title, campaign_url, description, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         brand_name = VALUES(brand_name),
         brand_logo_url = VALUES(brand_logo_url),
         campaign_title = VALUES(campaign_title),
         campaign_url = VALUES(campaign_url),
         description = VALUES(description),
         sort_order = VALUES(sort_order),
         is_active = VALUES(is_active),
         updated_at = NOW()`,
      [
        collabId,
        targetId,
        c.brandName.trim(),
        finalLogoUrl || null,
        (c.campaignTitle || "").trim() || null,
        (c.campaignUrl || "").trim() || null,
        (c.description || "").trim() || null,
        Number(c.sortOrder || 0),
        c.isActive !== false ? 1 : 0,
      ]
    );

    return NextResponse.json({ success: true, collabId, message: "Collaboration saved successfully" });
  } catch (err: any) {
    console.error("POST collaboration error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/creator/collaborations?id=...&creatorId=...
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const lookupVal = searchParams.get("creatorId") || searchParams.get("email");

    if (!id || !lookupVal) {
      return NextResponse.json({ error: "ID and creator identifier required" }, { status: 400 });
    }

    await ensureCollaborationsTable();

    const creator = await resolveCreatorId(lookupVal);
    const targetId = creator ? creator.id : lookupVal;

    await db.query("DELETE FROM creator_collaborations WHERE id = ? AND creator_id = ?", [id, targetId]);

    return NextResponse.json({ success: true, message: "Collaboration removed" });
  } catch (err: any) {
    console.error("DELETE collaboration error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
