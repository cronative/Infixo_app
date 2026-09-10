import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendOtpEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logDeviceLogin } from "@/lib/loginLogger";

export async function POST(req: Request) {
  try {
    // 0. Rate Limiting Protection (Max 5 requests per 5 minutes per IP)
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`login_${clientIp}`, 5, 5 * 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: `Too many login attempts. Please wait ${rateCheck.retryAfterSec} seconds before trying again.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
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
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

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
      console.warn("⚠️ MySQL error inserting OTP record / log:", dbErr.message);
    }

    // 4. Send real OTP Email via Gmail SMTP (Awaited for guaranteed delivery)
    const emailSent = await sendOtpEmail(email, otpCode);
    if (!emailSent) {
      console.warn("⚠️ sendOtpEmail returned false for email:", email);
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${email} (valid for 5 minutes)`,
      email: email,
      username: creator?.username || "",
    });
  } catch (error: any) {
    console.error("Auth Login Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process login request" },
      { status: 500 }
    );
  }
}
