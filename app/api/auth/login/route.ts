import { db } from "@/lib/db";
import { sendOtpEmail } from "@/lib/email";
import { getClientIp } from "@/lib/rateLimit";
import { checkPersistentRateLimit } from "@/lib/persistentRateLimit";
import crypto from "crypto";
import { logDeviceLogin } from "@/lib/loginLogger";
import { apiSuccess, apiError } from "@/lib/apiResponse";

export async function POST(req: Request) {
  try {
    // 0. Rate Limiting Protection (Max 5 requests per 5 minutes per IP)
    const clientIp = getClientIp(req);
    const rateCheck = await checkPersistentRateLimit(`login:${clientIp}`, 5, 5 * 60);
    if (!rateCheck.success) {
      return apiError(
        `Too many login attempts. Please wait ${rateCheck.retryAfterSec} seconds before trying again.`,
        429
      );
    }

    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return apiError("Please enter a valid email address", 400);
    }

    let creator: any = null;

    try {
      // 1. Check if creator exists in MySQL database (for existing creators)
      const [rows]: any = await db.query("SELECT * FROM creators WHERE email = ?", [email]);
      creator = rows[0] || null;
    } catch (dbErr: any) {
      console.warn("⚠️ MySQL query warning in auth login:", dbErr.code || dbErr.message);
      creator = null;
    }

    // 3. Generate dynamic random 4-digit OTP code (e.g. 4819)
    const otpCode = crypto.randomInt(1000, 10000).toString();

    try {
      // 1. Invalidate any previous unused OTP entries for this email
      await db.query("UPDATE otps SET is_used = TRUE WHERE email = ? AND is_used = FALSE", [email]);

      // 2. Insert new fresh OTP with 5-minute expiration
      await db.query(
        "INSERT INTO otps (email, otp_code, expires_at, is_used) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE), FALSE)",
        [email, otpCode]
      );

      // 3. Log login attempt & device metadata in creator_login_logs table
      const userAgent = req.headers.get("user-agent");
      await logDeviceLogin({
        email,
        creatorId: creator?.id || null,
        ipAddress: clientIp,
        userAgent,
        status: "otp_sent",
      });
    } catch (dbErr: any) {
      console.error("Failed to persist OTP:", dbErr.message);
      return apiError("Unable to create a login code", 503);
    }

    // 4. Send real OTP Email via Gmail SMTP (Awaited for guaranteed delivery)
    const emailSent = await sendOtpEmail(email, otpCode);
    if (!emailSent) {
      await db.query("UPDATE otps SET is_used = TRUE WHERE email = ? AND otp_code = ?", [email, otpCode]);
      return apiError("Unable to deliver the login code", 503);
    }

    return apiSuccess(
      {
        email,
        username: creator?.username || "",
      },
      `OTP sent to ${email} (valid for 5 minutes)`
    );
  } catch (error: any) {
    console.error("Auth Login Error:", error);
    return apiError(error.message || "Failed to process login request", 500);
  }
}
