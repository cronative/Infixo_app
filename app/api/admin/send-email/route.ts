import { NextResponse } from "next/server";
import { sendBroadcastEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { recipients, subject, bodyHtml } = await req.json();

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: "At least one recipient email ID is required" }, { status: 400 });
    }

    if (!subject || !subject.trim()) {
      return NextResponse.json({ error: "Email subject is required" }, { status: 400 });
    }

    if (!bodyHtml || !bodyHtml.trim()) {
      return NextResponse.json({ error: "Email message body is required" }, { status: 400 });
    }

    // Clean emails list
    const validEmails = recipients
      .map((e: string) => e.trim().toLowerCase())
      .filter((e: string) => e && e.includes("@"));

    if (validEmails.length === 0) {
      return NextResponse.json({ error: "No valid recipient email addresses provided" }, { status: 400 });
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

    return NextResponse.json({
      success: successCount > 0,
      sentCount: successCount,
      failedCount: failedEmails.length,
      failedEmails,
      error: lastError,
    });
  } catch (err: any) {
    console.error("Admin Email Send Error:", err);
    return NextResponse.json({ error: err.message || "Failed to send broadcast emails" }, { status: 500 });
  }
}
