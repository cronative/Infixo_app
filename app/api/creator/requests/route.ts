import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureRequestsTable } from "@/lib/requestsDb";

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

// GET /api/creator/requests?creatorId=... or ?email=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lookupVal = searchParams.get("creatorId") || searchParams.get("email") || searchParams.get("username");
    const statusFilter = searchParams.get("status");

    if (!lookupVal) {
      return NextResponse.json({ success: true, requests: [], unreadCount: 0 });
    }

    await ensureRequestsTable();

    const creator = await resolveCreatorId(lookupVal);
    const targetId = creator ? creator.id : lookupVal;

    let query = `
      SELECT id, creator_id AS creatorId, sender_name AS senderName, company_name AS companyName,
             email, campaign_type AS campaignType, approx_budget AS approxBudget, message,
             status, created_at AS createdAt, updated_at AS updatedAt
      FROM collaboration_requests
      WHERE creator_id = ?
    `;
    const params: any[] = [targetId];

    if (statusFilter && ["NEW", "VIEWED", "REPLIED", "CLOSED"].includes(statusFilter.toUpperCase())) {
      query += " AND status = ?";
      params.push(statusFilter.toUpperCase());
    }

    query += " ORDER BY created_at DESC";

    const [rows]: any = await db.query(query, params);

    const [countRows]: any = await db.query(
      "SELECT COUNT(*) as unreadCount FROM collaboration_requests WHERE creator_id = ? AND status = 'NEW'",
      [targetId]
    );
    const unreadCount = Number(countRows[0]?.unreadCount || 0);

    const requests = (rows || []).map((r: any) => ({
      id: r.id,
      creatorId: r.creatorId,
      senderName: r.senderName,
      companyName: r.companyName || "",
      email: r.email,
      campaignType: r.campaignType || "",
      approxBudget: r.approxBudget || "",
      message: r.message,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return NextResponse.json({ success: true, requests, unreadCount });
  } catch (err: any) {
    console.error("GET collaboration requests error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/creator/requests (Update Status: NEW, VIEWED, REPLIED, CLOSED)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, creatorId: passedCreatorId, email } = body;

    const lookupVal = passedCreatorId || email;
    if (!id || !status || !lookupVal) {
      return NextResponse.json({ error: "ID, status and creator identifier required" }, { status: 400 });
    }

    const cleanStatus = status.toUpperCase();
    if (!["NEW", "VIEWED", "REPLIED", "CLOSED"].includes(cleanStatus)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    await ensureRequestsTable();

    const creator = await resolveCreatorId(lookupVal);
    const targetId = creator ? creator.id : lookupVal;

    await db.query(
      "UPDATE collaboration_requests SET status = ?, updated_at = NOW() WHERE id = ? AND creator_id = ?",
      [cleanStatus, id, targetId]
    );

    return NextResponse.json({ success: true, message: `Request status updated to ${cleanStatus}` });
  } catch (err: any) {
    console.error("PATCH request status error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/creator/requests?id=...&creatorId=...
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const lookupVal = searchParams.get("creatorId") || searchParams.get("email");

    if (!id || !lookupVal) {
      return NextResponse.json({ error: "ID and creator identifier required" }, { status: 400 });
    }

    await ensureRequestsTable();

    const creator = await resolveCreatorId(lookupVal);
    const targetId = creator ? creator.id : lookupVal;

    await db.query("DELETE FROM collaboration_requests WHERE id = ? AND creator_id = ?", [id, targetId]);

    return NextResponse.json({ success: true, message: "Collaboration request deleted" });
  } catch (err: any) {
    console.error("DELETE collaboration request error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
