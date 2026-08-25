import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendReviewReceivedEmail } from "@/lib/email";
import { ensureReviewsTable } from "@/lib/reviewsDb";

// GET /api/review?token=... — Fetch review invitation for public brand page
export async function GET(req: Request) {
  try {
    await ensureReviewsTable();

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 });
    }

    const [rows]: any = await db.query("SELECT * FROM creator_reviews WHERE token = ?", [token]);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid or expired review link" }, { status: 404 });
    }

    const r = rows[0];

    // Check if link is already used / submitted
    const isAlreadySubmitted = ["pending_approval", "approved", "rejected"].includes(r.status);

    // Fetch creator details for header display
    const [creatorRows]: any = await db.query(
      "SELECT id, display_name, username, photo_url, category, profession, is_verified FROM creators WHERE id = ? OR email = ?",
      [r.creator_id, r.creator_id]
    );
    const creator = creatorRows && creatorRows.length > 0 ? creatorRows[0] : null;

    return NextResponse.json({
      success: true,
      isAlreadySubmitted,
      review: {
        id: r.id,
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
      },
      creator: creator
        ? {
            displayName: creator.display_name,
            username: creator.username,
            photoDataUrl: creator.photo_url,
            category: creator.category,
            profession: creator.profession,
            isVerified: Boolean(creator.is_verified),
          }
        : null,
    });
  } catch (error: any) {
    console.error("GET /api/review error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/review — Public submission of 4 rating criteria & written review
export async function POST(req: Request) {
  try {
    await ensureReviewsTable();

    const body = await req.json();
    const {
      token,
      rating,
      ratingContentQuality,
      ratingProfessionalism,
      ratingTimelyDelivery,
      comment,
      clientName,
      clientDesignation,
    } = body;

    if (!token) {
      return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 });
    }

    const [rows]: any = await db.query("SELECT * FROM creator_reviews WHERE token = ?", [token]);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: "Review invitation not found" }, { status: 404 });
    }

    const review = rows[0];

    // Single-use link check: Block re-submission if already processed
    if (["pending_approval", "approved", "rejected"].includes(review.status)) {
      return NextResponse.json(
        {
          success: false,
          isAlreadySubmitted: true,
          error: "This review link has already been used / submitted. Re-submission is disabled.",
        },
        { status: 400 }
      );
    }

    const finalClientName = clientName?.trim() || review.client_name || "Valued Brand Client";
    const finalDesignation = clientDesignation?.trim() || review.client_designation || "";
    const finalComment = comment ? comment.trim().slice(0, 250) : "";

    const rOverall = Number(rating || 5);
    const rCQ = Number(ratingContentQuality || rOverall);
    const rProf = Number(ratingProfessionalism || rOverall);
    const rTD = Number(ratingTimelyDelivery || rOverall);

    // Update MySQL table status to pending_approval with fallback
    try {
      await db.query(
        `UPDATE creator_reviews 
         SET rating = ?, 
             rating_content_quality = ?, 
             rating_professionalism = ?, 
             rating_timely_delivery = ?, 
             comment = ?, 
             client_name = ?, 
             client_designation = ?, 
             status = 'pending_approval' 
         WHERE token = ?`,
        [rOverall, rCQ, rProf, rTD, finalComment, finalClientName, finalDesignation, token]
      );
    } catch (dbUpdateErr) {
      console.warn("Full 4-column UPDATE failed, falling back to base columns:", dbUpdateErr);
      await db.query(
        `UPDATE creator_reviews 
         SET rating = ?, 
             comment = ?, 
             client_name = ?, 
             client_designation = ?, 
             status = 'pending_approval' 
         WHERE token = ?`,
        [rOverall, finalComment, finalClientName, finalDesignation, token]
      );
    }

    // Resolve creator email & send notification email to creator
    try {
      const [creatorRows]: any = await db.query(
        "SELECT email, display_name FROM creators WHERE id = ? OR email = ?",
        [review.creator_id, review.creator_id]
      );

      let creatorEmail = review.creator_id.includes("@") ? review.creator_id : null;
      let creatorDisplayName = "Creator";

      if (creatorRows && creatorRows.length > 0) {
        if (creatorRows[0].email) creatorEmail = creatorRows[0].email;
        if (creatorRows[0].display_name) creatorDisplayName = creatorRows[0].display_name;
      }

      if (creatorEmail) {
        const host = req.headers.get("host") || "inflixo.com";
        const isDevHost =
          host.includes("localhost") ||
          host.includes("127.0.0.1") ||
          host.includes("192.168.") ||
          host.includes("10.") ||
          host.includes(":3000") ||
          host.includes(":3001");
        const protocol = isDevHost ? "http" : "https";
        const dashboardUrl = `${protocol}://${host}/dashboard/reviews`;

        await sendReviewReceivedEmail(creatorEmail, {
          creatorName: creatorDisplayName,
          clientName: finalClientName,
          projectTitle: review.project_title,
          rating: rOverall,
          comment: finalComment,
          dashboardUrl,
        });
      }
    } catch (emailErr) {
      console.warn("Could not dispatch creator review notification email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Thank you! Your review has been submitted to the creator for approval.",
    });
  } catch (error: any) {
    console.error("POST /api/review error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
