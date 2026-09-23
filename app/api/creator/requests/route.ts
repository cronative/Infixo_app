import { db } from "@/lib/db";
import { ensureRequestsTable } from "@/lib/requestsDb";
import { requireCreator } from "@/lib/creatorAuth";
import { apiSuccess, apiError } from "@/lib/apiResponse";

// GET /api/creator/requests?status=...
export async function GET(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    await ensureRequestsTable();

    const targetId = auth.creator.id;

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

    return apiSuccess({ requests, unreadCount }, "Requests retrieved successfully");
  } catch (err: any) {
    console.error("GET collaboration requests error:", err);
    return apiError(err.message || "Failed to fetch collaboration requests", 500);
  }
}

// PATCH /api/creator/requests (Update Status: NEW, VIEWED, REPLIED, CLOSED)
export async function PATCH(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return apiError("ID and status required", 400);
    }

    const cleanStatus = status.toUpperCase();
    if (!["NEW", "VIEWED", "REPLIED", "CLOSED"].includes(cleanStatus)) {
      return apiError("Invalid status value", 400);
    }

    await ensureRequestsTable();

    const targetId = auth.creator.id;

    await db.query(
      "UPDATE collaboration_requests SET status = ?, updated_at = NOW() WHERE id = ? AND creator_id = ?",
      [cleanStatus, id, targetId]
    );

    return apiSuccess({}, `Request status updated to ${cleanStatus}`);
  } catch (err: any) {
    console.error("PATCH request status error:", err);
    return apiError(err.message || "Failed to update request status", 500);
  }
}

// DELETE /api/creator/requests?id=...
export async function DELETE(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return apiError("ID required", 400);
    }

    await ensureRequestsTable();

    const targetId = auth.creator.id;

    await db.query("DELETE FROM collaboration_requests WHERE id = ? AND creator_id = ?", [id, targetId]);

    return apiSuccess({}, "Collaboration request deleted");
  } catch (err: any) {
    console.error("DELETE collaboration request error:", err);
    return apiError(err.message || "Failed to delete collaboration request", 500);
  }
}
