import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordOnboardingStep } from "@/lib/onboardingStepDb";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logDeviceLogin } from "@/lib/loginLogger";
import { debugLog, debugError } from "@/lib/debugLogger";

export async function POST(req: Request) {
  try {
    // 0. Rate Limiting Protection (Max 10 verify attempts per 5 minutes per IP)
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`verify_${clientIp}`, 10, 5 * 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: `Too many attempts. Please wait ${rateCheck.retryAfterSec} seconds.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    const otp = (body.otp || "").trim();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    // 1. Strict Verification of OTP code against MySQL otps table
    const [otpRows]: any = await db.query(
      `SELECT * FROM otps 
       WHERE email = ? AND otp_code = ? AND is_used = FALSE AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [email, otp]
    );

    if (!otpRows || otpRows.length === 0) {
      // Check if an expired OTP exists for this email & code
      const [expiredRows]: any = await db.query(
        `SELECT * FROM otps WHERE email = ? AND otp_code = ? ORDER BY id DESC LIMIT 1`,
        [email, otp]
      );

      if (expiredRows && expiredRows.length > 0) {
        return NextResponse.json(
          { error: "OTP code has expired (valid for 5 mins). Please click Resend Code." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Invalid OTP code. Please check your email and try again." },
        { status: 400 }
      );
    }

    // 2. Mark OTP as used in database on successful verification (keep row in otps table)
    await db.query("UPDATE otps SET is_used = TRUE WHERE email = ? AND otp_code = ?", [email, otp]);

    // 3. Fetch Creator details from MySQL database
    const [rows]: any = await db.query(
      `SELECT c.*, 
              s.plan_key, s.plan_name, s.billing_cycle, s.status AS sub_status
       FROM creators c
       LEFT JOIN subscriptions s ON c.id = s.creator_id
       WHERE c.email = ?`,
      [email]
    );

    const creator = rows[0] || null;
    let socialRows: any[] = [];

    // Log successful login & device info
    const userAgent = req.headers.get("user-agent");
    await logDeviceLogin({
      email,
      creatorId: creator?.id || null,
      ipAddress: clientIp,
      userAgent,
      status: "success",
    });

    if (creator) {
      // Ensure Early Access subscription is active in MySQL
      try {
        await db.query(
          `INSERT INTO subscriptions (creator_id, plan_key, plan_name, billing_cycle, status, activated_at)
           VALUES (?, 'early_access', 'Early Access', 'yearly', 'active', NOW())
           ON DUPLICATE KEY UPDATE plan_key = 'early_access', plan_name = 'Early Access', status = 'active'`,
          [creator.id]
        );
      } catch (e: any) {
        console.warn("⚠️ Subscription upsert error in verify-otp:", e.message);
      }

      const [sRows]: any = await db.query(
        `SELECT * FROM social_accounts WHERE creator_id = ?`,
        [creator.id]
      );
      socialRows = sRows || [];
    }

    // 4. Check creators table for existing completed record
    let currentStep = "username";
    let isExistingProfile = false;

    if (creator) {
      // CASE A: Creator table HAS data for this email
      debugLog("VERIFY_OTP", `Creator record found in DB for ${email}:`, { id: creator.id, username: creator.username });

      try {
        const [stepRows]: any = await db.query(
          "SELECT step_name FROM creator_onboarding_steps WHERE email = ? ORDER BY id DESC LIMIT 1",
          [email]
        );
        const dbStep = (stepRows?.[0]?.step_name || "").trim().toLowerCase();
        debugLog("VERIFY_OTP", `Onboarding step in DB for ${email}:`, dbStep);

        const hasCompletedProfile = Boolean(
          creator.display_name && creator.display_name.trim() !== "" &&
          creator.username && creator.username.trim() !== ""
        );

        // If creator has already completed profile or finished onboarding, route to dashboard
        if (dbStep === "finish" || hasCompletedProfile) {
          currentStep = "finish";
          isExistingProfile = true;
          await recordOnboardingStep(email, "finish", creator.id);
          debugLog("VERIFY_OTP", `Creator has profile -> Routing to /dashboard`);
        } else if (dbStep && dbStep !== "profile") {
          currentStep = dbStep;
          isExistingProfile = false;
          debugLog("VERIFY_OTP", `Creator in-progress step '${dbStep}' -> Routing to step`);
        } else if (creator.username && creator.username.trim() !== "") {
          currentStep = "profile";
          isExistingProfile = false;
          debugLog("VERIFY_OTP", `Creator has username, continuing to personal profile`);
        } else {
          currentStep = "username";
          isExistingProfile = false;
        }
      } catch (e: any) {
        debugError("VERIFY_OTP", "Could not query creator_onboarding_steps:", e.message);
        if (creator.display_name && creator.username) {
          currentStep = "finish";
          isExistingProfile = true;
        } else {
          currentStep = "username";
          isExistingProfile = false;
        }
      }
    } else {
      // CASE B: Creator table DOES NOT have data for this email -> Brand new user -> Start at username claim
      debugLog("VERIFY_OTP", `No creator record in DB for ${email} -> Brand new user -> Routing to /onboarding/username`);
      currentStep = "username";
      isExistingProfile = false;
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      isExistingProfile,
      onboardingStep: currentStep,
      creator: creator

        ? {
            id: creator.id,
            email: creator.email,
            displayName: creator.display_name,
            username: creator.username,
            photoUrl: creator.photo_url,
            category: creator.category,
            bio: creator.bio,
            themeKey: (!creator.theme_key || creator.theme_key === "modern-purple") ? "minimal-white" : creator.theme_key,
            onboardingStep: currentStep,
            isVerified: Boolean(creator.is_verified),
            subscription: {
              planKey: creator.plan_key || "early_access",
              planName: creator.plan_name || "Early Access",
              billingCycle: creator.billing_cycle || "yearly",
              status: creator.sub_status || "active",
            },
            socials: socialRows,
          }
        : {
            onboardingStep: currentStep,
          },
    });
  } catch (error: any) {
    console.error("Auth Verify OTP MySQL Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
