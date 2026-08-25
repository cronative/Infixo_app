import nodemailer from "nodemailer";
import { renderEmailTemplate, EmailTemplateOptions, EmailTemplateType } from "./emailTemplates";

// Persistent Transporter Singleton with Warm Connection Pool
const smtpPort = Number(process.env.SMTP_PORT) || 465;
const isSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : smtpPort === 465;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: smtpPort,
  secure: isSecure,
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5,
  auth: {
    user: process.env.SMTP_USER || "inflixoapp@gmail.com",
    pass: process.env.SMTP_PASS || "ftiddrjlspvjiodl",
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 8000,
});

export async function sendOtpEmail(toEmail: string, otpCode: string): Promise<boolean> {
  const from = process.env.EMAIL_FROM || '"Inflixo App" <inflixoapp@gmail.com>';
  const html = renderEmailTemplate("otp", { toEmail, otpCode });

  try {
    await transporter.sendMail({
      from,
      to: toEmail,
      subject: `${otpCode} is your Inflixo verification code`,
      html,
    });
    console.log(`✉️ OTP Email sent via Inflixo email engine to ${toEmail}`);
    return true;
  } catch (err: any) {
    console.error("❌ Failed to send OTP email:", err.message || err);
    return false;
  }
}

export async function sendBroadcastEmail(
  toEmail: string,
  subject: string,
  messageBodyHtml: string
): Promise<{ success: boolean; error?: string }> {
  const from = process.env.EMAIL_FROM || '"Inflixo App" <inflixoapp@gmail.com>';
  const html = renderEmailTemplate("broadcast", { subject, messageBodyHtml });

  // First Attempt: Primary Transporter (Port 465 SSL)
  try {
    await transporter.sendMail({
      from,
      to: toEmail,
      subject,
      html,
    });
    console.log(`✉️ Broadcast Email sent from inflixoapp@gmail.com to ${toEmail}`);
    return { success: true };
  } catch (err1: any) {
    const errorMsg1 = err1?.message || String(err1);
    console.warn(`⚠️ Primary transport failed for ${toEmail}: ${errorMsg1}. Attempting port 587 fallback...`);

    // Fallback Attempt: Port 587 STARTTLS
    try {
      const fallbackTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: 587,
        secure: false, // STARTTLS
        auth: {
          user: process.env.SMTP_USER || "inflixoapp@gmail.com",
          pass: process.env.SMTP_PASS || "ftiddrjlspvjiodl",
        },
        tls: { rejectUnauthorized: false },
      });

      await fallbackTransporter.sendMail({
        from,
        to: toEmail,
        subject,
        html,
      });

      console.log(`✉️ Fallback Broadcast Email sent to ${toEmail} via Port 587`);
      return { success: true };
    } catch (err2: any) {
      const finalError = err2?.message || errorMsg1;
      console.error(`❌ Failed to send broadcast email to ${toEmail}:`, finalError);
      return { success: false, error: finalError };
    }
  }
}

export async function sendCollabReviewEmail(
  toEmail: string,
  options: EmailTemplateOptions
): Promise<{ success: boolean; error?: string }> {
  const from = process.env.EMAIL_FROM || '"Inflixo App" <inflixoapp@gmail.com>';
  const html = renderEmailTemplate("collab_review_request", { ...options, clientEmail: toEmail });
  const subject = `How was your collaboration with ${options.creatorName || "Creator"}?`;

  try {
    await transporter.sendMail({
      from,
      to: toEmail,
      subject,
      html,
    });
    console.log(`✉️ Collab Review Email sent to ${toEmail}`);
    return { success: true };
  } catch (err: any) {
    console.error("❌ Failed to send collab review email:", err.message || err);
    return { success: false, error: err.message || String(err) };
  }
}

export async function sendReviewReceivedEmail(
  creatorEmail: string,
  options: {
    creatorName?: string;
    clientName: string;
    projectTitle: string;
    rating: number;
    comment: string;
    dashboardUrl: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const from = process.env.EMAIL_FROM || '"Inflixo App" <inflixoapp@gmail.com>';
  const html = renderEmailTemplate("review_received", {
    creatorName: options.creatorName || "Creator",
    clientName: options.clientName,
    projectTitle: options.projectTitle,
    ctaUrl: options.dashboardUrl,
    comment: options.comment,
    customItems: [
      { label: "Brand Client", value: options.clientName },
      { label: "Project Title", value: options.projectTitle },
      { label: "Rating", value: `${options.rating} / 5 Stars ⭐` },
      { label: "Testimonial", value: `“${options.comment}”` },
      { label: "Status", value: "Pending Your Approval" },
    ],
  });
  const subject = `New Review Received from ${options.clientName} for "${options.projectTitle}" ⭐`;

  try {
    await transporter.sendMail({
      from,
      to: creatorEmail,
      subject,
      html,
    });
    console.log(`✉️ Review received notification sent to creator (${creatorEmail})`);
    return { success: true };
  } catch (err: any) {
    console.error("❌ Failed to send review received email to creator:", err.message || err);
    return { success: false, error: err.message || String(err) };
  }
}

export { renderEmailTemplate };
