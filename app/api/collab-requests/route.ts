import { db } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { insertCollabRequest } from "@/lib/collabRequestsDb";
import { sendCollabRequestReceivedEmail } from "@/lib/email";
import { collabEnquirySchema } from "@/lib/collabSchema";
import { recordServerEvent } from "@/lib/analyticsDb";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    // 5 requests per IP per hour
    const rate = checkRateLimit(`collab_${ip}`, 5, 60 * 60 * 1000);
    if (!rate.success) {
      return apiError(`Too many requests. Please try again in ${Math.ceil(rate.retryAfterSec / 60)} minutes.`, 429);
    }

    const body = await req.json();

    // Spam honeypot trap: bots fill out hidden fields
    if (body.hp && String(body.hp).trim().length > 0) {
      // Fake success silently
      return apiSuccess({ id: "req_synthetic", status: "new" }, "Collab request sent successfully");
    }

    const parseResult = collabEnquirySchema.safeParse(body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return apiError(issue?.message || "Invalid input data", 400);
    }

    const data = parseResult.data;

    // Save to collab_requests table
    const record = await insertCollabRequest({
      creatorId: data.creatorId,
      packageId: data.packageId,
      packageName: data.packageName,
      brandName: data.brandName,
      contactName: data.contactName,
      workEmail: data.workEmail,
      phone: data.phone,
      budget: data.budget,
      message: data.message,
      websiteOrSocial: data.websiteOrSocial,
    });

    // Attempt to notify creator via email (fail-safe)
    try {
      const [creatorRows]: any = await db.query(
        `SELECT id, email, display_name FROM creators WHERE id = ? OR username = ? OR email = ? LIMIT 1`,
        [data.creatorId, data.creatorId, data.creatorId]
      );

      const creator = creatorRows?.[0];
      if (creator?.id) await recordServerEvent(req, creator.id, "collab_request_submit", data.packageId || null);
      const targetEmail = creator?.email || (data.creatorId.includes("@") ? data.creatorId : null);

      if (targetEmail) {
        await sendCollabRequestReceivedEmail(targetEmail, {
          creatorName: creator?.display_name || "Creator",
          senderName: data.contactName,
          companyName: data.brandName,
          senderEmail: data.workEmail,
          campaignType: data.packageName || "Collaboration Request",
          approxBudget: data.budget || undefined,
          message: `${data.message}${data.phone ? `\n\nPhone/WhatsApp: ${data.phone}` : ""}${data.websiteOrSocial ? `\nWebsite/Social: ${data.websiteOrSocial}` : ""}`,
        });
      }
    } catch (err: any) {
      console.warn("Collab request notification email error (non-fatal):", err?.message || err);
    }

    return apiSuccess(record, "Collab request sent successfully");
  } catch (err: any) {
    console.error("Collab request API error:", err);
    return apiError(err.message || "Failed to submit collab request", 500);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const creatorId = searchParams.get("creatorId");
    if (!creatorId) {
      return apiError("creatorId is required", 400);
    }
    const { getCollabRequestsByCreator } = await import("@/lib/collabRequestsDb");
    const requests = await getCollabRequestsByCreator(creatorId);
    return apiSuccess({ requests }, "Collab requests retrieved");
  } catch (err: any) {
    console.error("GET Collab requests error:", err);
    return apiError(err.message || "Failed to fetch collab requests", 500);
  }
}
