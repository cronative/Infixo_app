import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { sendCollabReviewEmail } from "@/lib/email";
import { ensureReviewsTable } from "@/lib/reviewsDb";
import { requireCreator } from "@/lib/creatorAuth";
import { requireSession, ownsResource } from "@/lib/session";
import crypto from "crypto";
import { authorizeCreatorRead } from "@/lib/creatorReadAccess";

interface CreatorIdRow extends RowDataPacket {
  id: string;
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
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error";
}

// GET /api/creator/reviews?email=... or ?username=...
export async function GET(req: Request) {
  try {
    await ensureReviewsTable();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const username = searchParams.get("username");
    const status = searchParams.get("status");
    const isPublicRequest = Boolean(username);

    if (email) {
      const auth = requireSession(req);
      if (auth.error) return auth.error;
      if (!ownsResource(auth.session, email)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    let creatorId: string | null = null;

    if (username) {
      const cleanUsername = username.trim().replace(/^@/, "").toLowerCase();
      const [rows] = await db.query<CreatorIdRow[]>(
        "SELECT id FROM creators WHERE LOWER(username) = ? OR username = ? OR LOWER(username) = ? LIMIT 1",
        [cleanUsername, username.trim(), `@${cleanUsername}`]
      );
      if (rows && rows.length > 0) creatorId = rows[0].id;
    } else if (email) {
      const [rows] = await db.query<CreatorIdRow[]>("SELECT id FROM creators WHERE email = ?", [email]);
      if (rows && rows.length > 0) creatorId = rows[0].id;
    }

    if (!creatorId) {
      if (email) creatorId = email;
    }

    if (!creatorId) {
      return NextResponse.json({ success: true, reviews: [] });
    }

    const accessError = await authorizeCreatorRead(req, creatorId, isPublicRequest);
    if (accessError) return accessError;

    let sql = "SELECT * FROM creator_reviews WHERE creator_id = ?";
    const queryParams: string[] = [creatorId];

    if (isPublicRequest) {
      sql += " AND status = 'approved'";
    } else if (status) {
      sql += " AND status = ?";
      queryParams.push(status);
    }

    sql += " ORDER BY created_at DESC";

    const [rows] = await db.query<CreatorReviewRow[]>(sql, queryParams);

    const reviews = (rows || []).map((r) => ({
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
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json({ success: true, reviews });
  } catch (error: unknown) {
    console.error("GET /api/creator/reviews error:", error);
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
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
      return NextResponse.json(
        { success: false, error: "Client or brand name is required" },
        { status: 400 }
      );
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
      return NextResponse.json({ success: false, error: "Creator email or ID is required" }, { status: 400 });
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
       (id, creator_id, token, client_name, client_email, client_designation, project_title, content_url, rating, comment, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 5, '', 'pending_invite')`,
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

    // Build absolute review submission URL
    const configuredOrigin = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
    const origin = configuredOrigin || new URL(req.url).origin;
    const reviewUrl = `${origin.replace(/\/$/, "")}/review/${token}`;

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

    return NextResponse.json({
      success: true,
      message: emailSent
        ? `Review request email successfully sent to ${cleanClientEmail}!`
        : `Review request created. (Note: Email attempt error: ${emailError || "check SMTP setup"})`,
      emailSent,
      review: reviewObj,
      reviewUrl,
    });
  } catch (error: unknown) {
    console.error("POST /api/creator/reviews error:", error);
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

// PATCH /api/creator/reviews — Approve or reject review
export async function PATCH(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    await ensureReviewsTable();

    const body = (await req.json()) as ReviewStatusBody;
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "id and status are required" }, { status: 400 });
    }

    if (!["approved", "rejected", "pending_approval", "pending_invite"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status value" }, { status: 400 });
    }

    await db.query("UPDATE creator_reviews SET status = ? WHERE id = ? AND creator_id = ?", [status, id, auth.creator.id]);

    return NextResponse.json({ success: true, message: `Review status updated to ${status}` });
  } catch (error: unknown) {
    console.error("PATCH /api/creator/reviews error:", error);
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
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
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    await db.query("DELETE FROM creator_reviews WHERE id = ? AND creator_id = ?", [id, auth.creator.id]);

    return NextResponse.json({ success: true, message: "Review deleted successfully" });
  } catch (error: unknown) {
    console.error("DELETE /api/creator/reviews error:", error);
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
