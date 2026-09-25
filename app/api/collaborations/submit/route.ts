import { db } from "@/lib/db";
import { ensureRequestsTable } from "@/lib/requestsDb";
import { ensureAnalyticsTable } from "@/lib/analyticsDb";
import { isCreatorPublic } from "@/lib/creatorReadAccess";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { sendCollabRequestReceivedEmail } from "@/lib/email";
import { getClientIp } from "@/lib/rateLimit";
import { checkPersistentRateLimit } from "@/lib/persistentRateLimit";

// POST /api/collaborations/submit (Public "Work With Me" Submission)
export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = await checkPersistentRateLimit(`collab-submit:${clientIp}`, 5, 10 * 60);
    if (!rateCheck.success) {
      return apiError(
        `Too many inquiries submitted. Please wait ${rateCheck.retryAfterSec} seconds before trying again.`,
        429
      );
    }

    const body = await req.json();
    const username = body.username || body.creator_username;
    const passedCreatorId = body.creatorId || body.creator_id;
    const senderName = body.senderName || body.contact_name;
    const companyName = body.companyName || body.brand_name;
    const email = body.email || body.contact_email;
    const campaignType = body.campaignType || (Array.isArray(body.deliverables) ? body.deliverables.join(", ") : body.deliverables);
    const approxBudget = body.approxBudget || body.budget_range;
    const message = body.message || (body.timeline ? `Timeline: ${body.timeline}` : "");

    if (!senderName || !senderName.trim()) {
      return apiError("Your name is required", 400);
    }
    if (!email || !email.trim() || !email.includes("@")) {
      return apiError("A valid email address is required", 400);
    }
    if (!message || !message.trim()) {
      return apiError("Please write a brief message / requirement", 400);
    }

    await ensureRequestsTable();
    await ensureAnalyticsTable();

    // Resolve target creator
    let targetCreator: { id: string; email: string; displayName: string } | null = null;
    if (passedCreatorId || username) {
      const [creators]: any = await db.query(
        "SELECT id, email, display_name AS displayName FROM creators WHERE id = ? OR username = ? OR email = ? LIMIT 1",
        [passedCreatorId || "", username || "", username || ""]
      );
      if (creators && creators.length > 0) {
        targetCreator = {
          id: creators[0].id,
          email: creators[0].email,
          displayName: creators[0].displayName || "Creator",
        };
      }
    }

    if (!targetCreator) {
      return apiError("Creator not found", 404);
    }
    if (!(await isCreatorPublic(targetCreator.id))) {
      return apiError("Creator profile is private", 404);
    }

    const targetCreatorId = targetCreator.id;

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await db.query(
      `INSERT INTO collaboration_requests (id, creator_id, sender_name, company_name, email, campaign_type, approx_budget, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'NEW')`,
      [
        requestId,
        targetCreatorId,
        senderName.trim(),
        (companyName || "").trim() || null,
        email.trim().toLowerCase(),
        (campaignType || "").trim() || null,
        (approxBudget || "").trim() || null,
        message.trim(),
      ]
    );

    // Track analytics event
    try {
      await db.query(
        `INSERT INTO analytics_events (creator_id, event_type, event_target, ip_address, user_agent)
         VALUES (?, 'collaboration_submit', ?, ?, ?)`,
        [targetCreatorId, senderName.trim(), clientIp, req.headers.get("user-agent") || null]
      );
    } catch {}

    // Asynchronously notify creator via email (fire-and-forget so user submission is instant)
    if (targetCreator.email) {
      sendCollabRequestReceivedEmail(targetCreator.email, {
        creatorName: targetCreator.displayName,
        senderName: senderName.trim(),
        companyName: (companyName || "").trim() || undefined,
        senderEmail: email.trim().toLowerCase(),
        campaignType: (campaignType || "").trim() || undefined,
        approxBudget: (approxBudget || "").trim() || undefined,
        message: message.trim(),
        dashboardUrl: "https://inflixo.com/dashboard/requests",
      }).catch((emailErr) => {
        console.warn("⚠️ Could not send collab inquiry notification email to creator:", emailErr);
      });
    }

    return apiSuccess(
      { requestId },
      "Your collaboration inquiry has been sent to the creator! 🎉"
    );
  } catch (err: any) {
    console.error("POST collaboration submit error:", err);
    return apiError("Failed to submit collaboration request. Please try again.", 500);
  }
}
