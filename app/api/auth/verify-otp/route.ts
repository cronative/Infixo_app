import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordOnboardingStep } from "@/lib/onboardingStepDb";

export async function POST(req: Request) {
  try {
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

    // 2. Mark OTP as used in database
    await db.query("UPDATE otps SET is_used = TRUE WHERE id = ?", [otpRows[0].id]);

    // Record / Update current step in creator_onboarding_steps table (1 row per email)
    await recordOnboardingStep(email, "otp_verified");

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

    // 4. Fetch current onboarding step from single email row in creator_onboarding_steps table
    let currentStep = "profile";
    try {
      const [stepRows]: any = await db.query(
        "SELECT step_name FROM creator_onboarding_steps WHERE email = ?",
        [email]
      );
      if (stepRows && stepRows.length > 0) {
        const lastStep = stepRows[0].step_name;
        if (lastStep === "finish") {
          currentStep = "finish";
        } else if (lastStep === "subscription") {
          currentStep = "subscription";
        } else if (lastStep === "series") {
          currentStep = "series";
        } else if (lastStep === "theme" || lastStep === "themes") {
          currentStep = "theme";
        } else if (lastStep === "socials") {
          currentStep = "socials";
        } else if (lastStep === "profile") {
          currentStep = "profile";
        } else {
          currentStep = "profile";
        }
      }
    } catch (e: any) {
      console.warn("⚠️ Could not read completed step:", e.message);
    }

    // Determine if creator has already finished onboarding
    const isExistingProfile = Boolean(currentStep === "finish");

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      isExistingProfile,
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
