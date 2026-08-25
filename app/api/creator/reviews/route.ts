import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendBroadcastEmail, sendCollabReviewEmail } from "@/lib/email";
import { ensureReviewsTable } from "@/lib/reviewsDb";

// GET /api/creator/reviews?email=... or ?username=...
export async function GET(req: Request) {
  try {
    await ensureReviewsTable();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const username = searchParams.get("username");
    const status = searchParams.get("status");

    let creatorId: string | null = null;

    if (username) {
      const [rows]: any = await db.query("SELECT id FROM creators WHERE username = ?", [username]);
      if (rows && rows.length > 0) creatorId = rows[0].id;
    } else if (email) {
      const [rows]: any = await db.query("SELECT id FROM creators WHERE email = ?", [email]);
      if (rows && rows.length > 0) creatorId = rows[0].id;
    }

    if (!creatorId) {
      if (email) creatorId = email;
    }

    if (!creatorId) {
      return NextResponse.json({ success: true, reviews: [] });
    }

    let sql = "SELECT * FROM creator_reviews WHERE creator_id = ?";
    const queryParams: any[] = [creatorId];

    if (status) {
      sql += " AND status = ?";
      queryParams.push(status);
    }

    sql += " ORDER BY created_at DESC";

    const [rows]: any = await db.query(sql, queryParams);

    const reviews = (rows || []).map((r: any) => ({
      id: r.id,
      creatorId: r.creator_id,
      token: r.token,
      clientName: r.client_name,
      clientEmail: r.client_email,
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
  } catch (error: any) {
    console.error("GET /api/creator/reviews error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/creator/reviews — Generate review request & send email to client/brand
export async function POST(req: Request) {
  try {
    await ensureReviewsTable();

    const body = await req.json();
    const { email, creatorId, clientName, clientEmail, clientDesignation, projectTitle, contentUrl } = body;

    if (!clientName || !clientEmail || !projectTitle || !contentUrl) {
      return NextResponse.json(
        { success: false, error: "clientName, clientEmail, projectTitle, and contentUrl are mandatory" },
        { status: 400 }
      );
    }

    let resolvedCreatorId = creatorId;
    let creatorDisplayName = "Creator";

    if (email || resolvedCreatorId) {
      const [rows]: any = await db.query(
        "SELECT id, display_name FROM creators WHERE email = ? OR id = ?",
        [email || "", resolvedCreatorId || ""]
      );
      if (rows && rows.length > 0) {
        resolvedCreatorId = rows[0].id;
        creatorDisplayName = rows[0].display_name || "Creator";
      } else {
        if (!resolvedCreatorId) resolvedCreatorId = email;
      }
    }

    if (!resolvedCreatorId) {
      return NextResponse.json({ success: false, error: "Creator email or ID is required" }, { status: 400 });
    }

    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    await db.query(
      `INSERT INTO creator_reviews 
       (id, creator_id, token, client_name, client_email, client_designation, project_title, content_url, rating, comment, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 5, '', 'pending_invite')`,
      [
        reviewId,
        resolvedCreatorId,
        token,
        clientName.trim(),
        clientEmail.trim(),
        clientDesignation?.trim() || "",
        projectTitle.trim(),
        contentUrl.trim(),
      ]
    );

    // Build absolute review submission URL
    const host = req.headers.get("host") || "inflixo.com";
    const isDevHost =
      host.includes("localhost") ||
      host.includes("127.0.0.1") ||
      host.includes("192.168.") ||
      host.includes("10.") ||
      host.includes(":3000") ||
      host.includes(":3001");
    const protocol = isDevHost ? "http" : "https";
    const reviewUrl = `${protocol}://${host}/review/${token}`;

    let emailSent = false;
    let emailError: string | undefined = undefined;

    try {
      const emailResult = await sendCollabReviewEmail(clientEmail.trim(), {
        creatorName: creatorDisplayName,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        projectTitle: projectTitle.trim(),
        contentUrl: contentUrl.trim(),
        reviewUrl,
      });
      emailSent = emailResult.success;
      emailError = emailResult.error;
    } catch (e: any) {
      console.error("Failed to send review request email:", e);
      emailError = e?.message || "Email dispatch failed";
    }

    const reviewObj = {
      id: reviewId,
      creatorId: resolvedCreatorId,
      token,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      clientDesignation: clientDesignation?.trim() || "",
      projectTitle: projectTitle.trim(),
      contentUrl: contentUrl.trim(),
      rating: 5,
      comment: "",
      status: "pending_invite",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: emailSent
        ? `Review request email successfully sent to ${clientEmail.trim()}!`
        : `Review request created. (Note: Email attempt error: ${emailError || "check SMTP setup"})`,
      emailSent,
      review: reviewObj,
      reviewUrl,
    });
  } catch (error: any) {
    console.error("POST /api/creator/reviews error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/creator/reviews — Approve or reject review
export async function PATCH(req: Request) {
  try {
    await ensureReviewsTable();

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "id and status are required" }, { status: 400 });
    }

    if (!["approved", "rejected", "pending_approval", "pending_invite"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status value" }, { status: 400 });
    }

    await db.query("UPDATE creator_reviews SET status = ? WHERE id = ?", [status, id]);

    return NextResponse.json({ success: true, message: `Review status updated to ${status}` });
  } catch (error: any) {
    console.error("PATCH /api/creator/reviews error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/creator/reviews — Delete review request
export async function DELETE(req: Request) {
  try {
    await ensureReviewsTable();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    await db.query("DELETE FROM creator_reviews WHERE id = ?", [id]);

    return NextResponse.json({ success: true, message: "Review deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/creator/reviews error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
