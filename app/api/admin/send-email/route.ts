import { sendBroadcastEmail } from "@/lib/email";
import { isAuthorizedAdmin } from "@/lib/adminAuth";
import { apiSuccess, apiError } from "@/lib/apiResponse";

export async function POST(req: Request) {
  try {
    if (!(await isAuthorizedAdmin(req))) {
      return apiError("Unauthorized admin access", 401);
    }

    const { recipients, subject, bodyHtml } = await req.json();

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return apiError("At least one recipient email ID is required", 400);
    }

    if (!subject || !subject.trim()) {
      return apiError("Email subject is required", 400);
    }

    if (!bodyHtml || !bodyHtml.trim()) {
      return apiError("Email message body is required", 400);
    }

    // Clean emails list
    const validEmails = recipients
      .map((e: string) => e.trim().toLowerCase())
      .filter((e: string) => e && e.includes("@"));

    if (validEmails.length === 0) {
      return apiError("No valid recipient email addresses provided", 400);
    }

    let successCount = 0;
    const failedEmails: { email: string; error?: string }[] = [];
    let lastError: string | undefined = undefined;

    // Send emails in sequence
    for (const email of validEmails) {
      const res = await sendBroadcastEmail(email, subject.trim(), bodyHtml.trim());
      if (res.success) {
        successCount++;
      } else {
        lastError = res.error;
        failedEmails.push({ email, error: res.error });
      }
    }

    if (successCount === 0 && failedEmails.length > 0) {
      return apiError(lastError || "Failed to send broadcast emails", 500, {
        sentCount: 0,
        failedCount: failedEmails.length,
        failedEmails,
      });
    }

    return apiSuccess({
      sentCount: successCount,
      failedCount: failedEmails.length,
      failedEmails,
    }, "Broadcast emails processed successfully");
  } catch (err: any) {
    console.error("Admin Email Send Error:", err);
    return apiError(err.message || "Failed to send broadcast emails", 500);
  }
}
