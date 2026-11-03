import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { sendCollabReviewEmail } from "@/lib/email";
import { getAppBaseUrl } from "@/lib/emailTemplates";
import { ensureReviewsTable } from "@/lib/reviewsDb";
import { requireCreator } from "@/lib/creatorAuth";
import crypto from "crypto";
import { authorizeCreatorRead } from "@/lib/creatorReadAccess";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { getCreatorPlanKey, limitReachedError } from "@/lib/planServer";
import { getPlanLimit } from "@/config/plans";

interface CreatorIdRow extends RowDataPacket {
  id: string;
  email?: string | null;
  display_name?: string | null;
}

interface CreatorReviewRow extends RowDataPacket {
  id: string;
  creator_id: string;
  token: string;
  client_name: string;
  client_email: string;
  client_designation?: string | null;
  project_title: string;
  content_url?: string | null;
  rating?: number | null;
  rating_content_quality?: number | null;
  rating_professionalism?: number | null;
  rating_timely_delivery?: number | null;
  comment?: string | null;
  status: string;
  invitation_status?: string | null;
  is_visible?: number | boolean | null;
  created_at: string | Date;
  updated_at: string | Date;
}

interface ReviewRequestBody {
  email?: string;
  creatorId?: string;
  clientName?: string;
  clientEmail?: string;
  clientDesignation?: string;
  projectTitle?: string;
  contentUrl?: string;
}

interface ReviewStatusBody {
  id?: string;
  status?: string;
  isVisible?: boolean;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error";
}

// GET /api/creator/reviews (dashboard session, or public ?username=...)
const toUtcIso = (v: string | Date | null | undefined) => {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  // Never return a future instant (clock skew / bad rows).
  return new Date(Math.min(d.getTime(), Date.now())).toISOString();
};

export async function GET(req: Request) {
  try {
    await ensureReviewsTable();

    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get("email");
    const username = searchParams.get("username");
    const status = searchParams.get("status");
    // Only treat as public request when username is passed without email and status='approved' (or unauthenticated public view)
    const isPublicRequest = Boolean(username && !emailParam);

    let creatorId: string | null = null;
    let creatorEmail: string | null = null;

    if (isPublicRequest && username) {
      const cleanUsername = username.trim().replace(/^@/, "").toLowerCase();
      const [rows] = await db.query<CreatorIdRow[]>(
        "SELECT id, email FROM creators WHERE LOWER(username) = ? OR username = ? OR LOWER(username) = ? LIMIT 1",
        [cleanUsername, username.trim(), `@${cleanUsername}`]
      );
      if (rows && rows.length > 0) {
        creatorId = rows[0].id;
        creatorEmail = rows[0].email || null;
      }
      if (!creatorId) {
        return apiSuccess({ reviews: [] }, "Reviews retrieved successfully");
      }
      const accessError = await authorizeCreatorRead(req, creatorId, true);
      if (accessError) return accessError;
    } else {
      const auth = await requireCreator(req);
      if (auth.error) return auth.error;
      creatorId = auth.creator.id;
      creatorEmail = auth.creator.email || emailParam || null;
    }

    if (!creatorId) {
      return apiSuccess({ reviews: [] }, "Reviews retrieved successfully");
    }

    let sql = "SELECT * FROM creator_reviews WHERE (creator_id = ? OR creator_id = ?)";
    const queryParams: string[] = [creatorId, creatorEmail || creatorId];

    if (isPublicRequest) {
      sql += " AND status IN ('approved', 'pending_approval') AND (is_visible = 1 OR is_visible IS NULL)";
    } else if (status) {
      sql += " AND status = ?";
      queryParams.push(status);
    }

    sql += " ORDER BY created_at DESC";

    const [rows] = await db.query<CreatorReviewRow[]>(sql, queryParams);

    const reviews = (rows || []).map((r) => {
      const invitationStatus =
        r.invitation_status ||
        (r.status === "pending_invite" ? "pending" : "submitted");
      const isVisible =
        r.is_visible !== undefined && r.is_visible !== null
          ? Boolean(r.is_visible) && r.status !== "rejected"
          : r.status !== "rejected";
      return {
        id: r.id,
        creatorId: r.creator_id,
        ...(isPublicRequest ? {} : { token: r.token }),
        clientName: r.client_name,
        ...(isPublicRequest ? {} : { clientEmail: r.client_email }),
        clientDesignation: r.client_designation || "",
        projectTitle: r.project_title,
        contentUrl: r.content_url || "",
        rating: Number(r.rating || 5),
        ratingContentQuality: Number(r.rating_content_quality || 5),
        ratingProfessionalism: Number(r.rating_professionalism || 5),
        ratingTimelyDelivery: Number(r.rating_timely_delivery || 5),
        comment: r.comment || "",
        status: r.status,
        invitationStatus,
        isVisible,
        isVerified: true,
        createdAt: toUtcIso(r.created_at),
        updatedAt: toUtcIso(r.updated_at),
      };
    });

    // Public profile: reviews beyond the plan limit are hidden (kept in the dashboard).
    if (isPublicRequest) reviews.splice(getPlanLimit(await getCreatorPlanKey(creatorId), "reviews"));

    return apiSuccess({ reviews }, "Reviews retrieved successfully");
  } catch (error: unknown) {
    console.error("GET /api/creator/reviews error:", error);
    return apiError(getErrorMessage(error), 500);
  }
}

// POST /api/creator/reviews — Generate review request & send email to client/brand
export async function POST(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    await ensureReviewsTable();

    const body = (await req.json()) as ReviewRequestBody;
    const { clientName, clientEmail, clientDesignation, projectTitle, contentUrl } = body;

    if (!clientName || !clientName.trim()) {
      return apiError("Client or brand name is required", 400);
    }

    if (!clientEmail || !clientEmail.trim()) {
      return apiError("Client email is required", 400);
    }

    let resolvedCreatorId = auth.creator.id;
    let creatorDisplayName = "Creator";

    if (resolvedCreatorId) {
      const [rows] = await db.query<CreatorIdRow[]>(
        "SELECT id, display_name FROM creators WHERE email = ? OR id = ?",
        [auth.creator.email, resolvedCreatorId]
      );
      if (rows && rows.length > 0) {
        resolvedCreatorId = rows[0].id;
        creatorDisplayName = rows[0].display_name || "Creator";
      } else {
        resolvedCreatorId = auth.creator.id;
      }
    }

    if (!resolvedCreatorId) {
      return apiError("Creator email or ID is required", 400);
    }

    // Brand reviews (incl. pending invites) count against the plan limit.
    const planKey = await getCreatorPlanKey(resolvedCreatorId);
    const [reviewCountRows] = await db.query<(RowDataPacket & { count: number })[]>(
      "SELECT COUNT(*) AS count FROM creator_reviews WHERE creator_id = ?",
      [resolvedCreatorId]
    );
    if (Number(reviewCountRows[0]?.count || 0) >= getPlanLimit(planKey, "reviews")) {
      return limitReachedError("reviews", planKey);
    }

    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const token = crypto.randomBytes(32).toString("base64url");

    const cleanClientName = clientName.trim();
    const cleanClientEmail = clientEmail?.trim() || "";
    const cleanProjectTitle = projectTitle?.trim() || "Brand Collaboration";
    const cleanContentUrl = contentUrl?.trim() || "";
    const cleanDesignation = clientDesignation?.trim() || "";

    await db.query(
      `INSERT INTO creator_reviews 
       (id, creator_id, token, client_name, client_email, client_designation, project_title, content_url, rating, comment, status, invitation_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 5, '', 'pending_invite', 'pending')`,
      [
        reviewId,
        resolvedCreatorId,
        token,
        cleanClientName,
        cleanClientEmail,
        cleanDesignation,
        cleanProjectTitle,
        cleanContentUrl,
      ]
    );

    console.log("[POST /api/creator/reviews] Created review invitation:", {
      reviewId,
      creatorId: resolvedCreatorId,
      clientName: cleanClientName,
      status: "pending_invite",
      invitationStatus: "pending",
    });

    // Build absolute review submission URL using APP_BASE_URL (https://inflixo.com)
    const baseUrl = getAppBaseUrl();
    const reviewUrl = `${baseUrl}/review/${token}`;

    let emailSent = false;
    let emailError: string | undefined = undefined;

    if (cleanClientEmail && cleanClientEmail.includes("@")) {
      try {
        const emailResult = await sendCollabReviewEmail(cleanClientEmail, {
          creatorName: creatorDisplayName,
          clientName: cleanClientName,
          clientEmail: cleanClientEmail,
          projectTitle: cleanProjectTitle,
          contentUrl: cleanContentUrl,
          reviewUrl,
        });
        emailSent = emailResult.success;
        emailError = emailResult.error;
      } catch (e: unknown) {
        console.error("Failed to send review request email:", e);
        emailError = getErrorMessage(e) || "Email dispatch failed";
      }
    }

    const reviewObj = {
      id: reviewId,
      creatorId: resolvedCreatorId,
      token,
      clientName: cleanClientName,
      clientEmail: cleanClientEmail,
      clientDesignation: cleanDesignation,
      projectTitle: cleanProjectTitle,
      contentUrl: cleanContentUrl,
      rating: 5,
      comment: "",
      status: "pending_invite",
      createdAt: new Date().toISOString(),
    };

    const message = emailSent
      ? `Review request email successfully sent to ${cleanClientEmail}!`
      : `Review request created. (Note: Email attempt error: ${emailError || "check SMTP setup"})`;

    return apiSuccess({ emailSent, review: reviewObj, reviewUrl }, message);
  } catch (error: unknown) {
    console.error("POST /api/creator/reviews error:", error);
    return apiError(getErrorMessage(error), 500);
  }
}

// PATCH /api/creator/reviews — Toggle visibility (Visible on profile / Hidden)
export async function PATCH(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    await ensureReviewsTable();

    const body = (await req.json()) as ReviewStatusBody;
    const { id, status, isVisible } = body;

    if (!id) {
      return apiError("id is required", 400);
    }

    let nextStatus = status;
    let nextVisible = 1;

    if (typeof isVisible === "boolean") {
      nextVisible = isVisible ? 1 : 0;
      nextStatus = isVisible ? "approved" : "rejected";
    } else if (status) {
      if (!["approved", "rejected", "pending_approval", "pending_invite"].includes(status)) {
        return apiError("Invalid status value", 400);
      }
      nextVisible = status === "rejected" ? 0 : 1;
    } else {
      return apiError("status or isVisible is required", 400);
    }

    await db.query(
      "UPDATE creator_reviews SET status = ?, is_visible = ? WHERE id = ? AND (creator_id = ? OR creator_id = ?)",
      [nextStatus, nextVisible, id, auth.creator.id, auth.creator.email || auth.creator.id]
    );

    return apiSuccess({ id, status: nextStatus, isVisible: Boolean(nextVisible) }, `Review visibility updated`);
  } catch (error: unknown) {
    console.error("PATCH /api/creator/reviews error:", error);
    return apiError(getErrorMessage(error), 500);
  }
}

// DELETE /api/creator/reviews — Delete review request
export async function DELETE(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    await ensureReviewsTable();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return apiError("id is required", 400);
    }

    await db.query("DELETE FROM creator_reviews WHERE id = ? AND creator_id = ?", [id, auth.creator.id]);

    return apiSuccess({}, "Review deleted successfully");
  } catch (error: unknown) {
    console.error("DELETE /api/creator/reviews error:", error);
    return apiError(getErrorMessage(error), 500);
  }
}
