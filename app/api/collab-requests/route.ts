import { db } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { insertCollabRequest, getCollabRequestsByCreator, updateCollabRequestStatus } from "@/lib/collabRequestsDb";
import { sendCollabRequestReceivedEmail, sendCollabRequestBrandConfirmationEmail } from "@/lib/email";
import { insertNotification } from "@/lib/notificationsDb";
import { collabEnquirySchema } from "@/lib/collabSchema";
import { recordServerEvent } from "@/lib/analyticsDb";
import { getAppBaseUrl } from "@/lib/emailTemplates";

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

    // 1. Resolve canonical creator profile (lookup by ID, username, or email)
    let canonicalCreatorId = data.creatorId;
    let creatorDisplayName = "Creator";
    let creatorEmail: string | null = null;
    let creatorRecord: any = null;

    try {
      const [creatorRows]: any = await db.query(
        `SELECT id, email, display_name, username FROM creators WHERE id = ? OR username = ? OR email = ? LIMIT 1`,
        [data.creatorId, data.creatorId, data.creatorId]
      );
      if (creatorRows && creatorRows.length > 0) {
        creatorRecord = creatorRows[0];
        canonicalCreatorId = String(creatorRecord.id);
        creatorDisplayName = creatorRecord.display_name?.trim() || creatorRecord.username || "Creator";
        creatorEmail = creatorRecord.email || null;
      }
    } catch (lookupErr: any) {
      console.warn("Creator lookup in collab request warning:", lookupErr?.message || lookupErr);
    }

    // 2. Save to collab_requests table with canonical creator ID
    const record = await insertCollabRequest({
      creatorId: canonicalCreatorId,
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

    // 3. Analytics tracking
    if (creatorRecord?.id) {
      try {
        await recordServerEvent(req, creatorRecord.id, "collab_request_submit", data.packageId || null);
      } catch {}
    }

    // 4. In-app notification for the creator (bell icon)
    try {
      await insertNotification({
        creatorId: canonicalCreatorId,
        type: "collab_inquiry",
        title: `New collab request from ${data.brandName}`,
        message: `${data.contactName} (${data.brandName}) sent a collaboration request for ${data.packageName || "a package"}.`,
        linkUrl: "/dashboard/mediakit",
        metadata: {
          requestId: record.id,
          brandName: data.brandName,
          contactName: data.contactName,
          workEmail: data.workEmail,
          packageName: data.packageName,
          budget: data.budget,
        },
      });
    } catch (notifErr: any) {
      console.warn("Collab request in-app notification error (non-fatal):", notifErr?.message || notifErr);
    }

    // 5. Email notification to creator
    const targetCreatorEmail = creatorEmail || (data.creatorId.includes("@") ? data.creatorId : null);
    if (targetCreatorEmail) {
      try {
        await sendCollabRequestReceivedEmail(targetCreatorEmail, {
          creatorName: creatorDisplayName,
          senderName: data.contactName,
          companyName: data.brandName,
          senderEmail: data.workEmail,
          campaignType: data.packageName || "Collaboration Request",
          approxBudget: data.budget || undefined,
          message: `${data.message}${data.phone ? `\n\nPhone/WhatsApp: ${data.phone}` : ""}${data.websiteOrSocial ? `\nWebsite/Social: ${data.websiteOrSocial}` : ""}`,
          dashboardUrl: `${getAppBaseUrl()}/dashboard/mediakit`,
        });
      } catch (err: any) {
        console.warn("Collab request notification email error (non-fatal):", err?.message || err);
      }
    }

    // 6. Auto confirmation email to the brand
    if (data.workEmail) {
      try {
        await sendCollabRequestBrandConfirmationEmail(data.workEmail, {
          creatorDisplayName,
          contactName: data.contactName,
          brandName: data.brandName,
          packageName: data.packageName || "Collaboration",
          budget: data.budget || undefined,
          message: data.message,
        });
      } catch (brandEmailErr: any) {
        console.warn("Collab confirmation email to brand error (non-fatal):", brandEmailErr?.message || brandEmailErr);
      }
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

    // Resolve creator to include all matching identifiers (ID, username, email)
    let searchIds = [creatorId];
    try {
      const [creatorRows]: any = await db.query(
        `SELECT id, email, display_name, username FROM creators WHERE id = ? OR username = ? OR email = ? LIMIT 1`,
        [creatorId, creatorId, creatorId]
      );
      if (creatorRows && creatorRows.length > 0) {
        const c = creatorRows[0];
        searchIds = Array.from(new Set([String(c.id), String(c.username), String(c.email)].filter(Boolean)));
      }
    } catch (e: any) {
      console.warn("Creator resolution in GET collab requests warning:", e?.message || e);
    }

    const requests = await getCollabRequestsByCreator(searchIds);
    const newCount = requests.filter((r) => r.status === "new").length;

    return apiSuccess({ requests, newCount, total: requests.length }, "Collab requests retrieved");
  } catch (err: any) {
    console.error("GET Collab requests error:", err);
    return apiError(err.message || "Failed to fetch collab requests", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, creatorId } = body;
    if (!id || !status) {
      return apiError("id and status are required", 400);
    }
    if (!["new", "replied", "closed"].includes(status)) {
      return apiError("status must be 'new', 'replied', or 'closed'", 400);
    }

    const updated = await updateCollabRequestStatus(id, status, creatorId);
    if (!updated) {
      return apiError("Collab request not found or update failed", 404);
    }

    return apiSuccess({ id, status }, "Status updated successfully");
  } catch (err: any) {
    console.error("PATCH Collab request error:", err);
    return apiError(err.message || "Failed to update status", 500);
  }
}
