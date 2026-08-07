const db = require("../config/db");
const { sendOtpEmail } = require("../services/emailService");

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }

    // 1. Check if creator exists in MySQL database
    let [rows] = await db.query("SELECT * FROM creators WHERE email = ?", [email]);
    let creator = rows[0];

    // 2. If creator does not exist, auto-register new creator row with EMPTY profile
    if (!creator) {
      const creatorId = `cr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      await db.query(
        `INSERT INTO creators (id, email, display_name, username, onboarding_step) 
         VALUES (?, ?, '', '', 'profile')`,
        [creatorId, email]
      );

      // Create default subscription row (Pro Plan 7-Day Free Trial)
      await db.query(
        `INSERT INTO subscriptions (creator_id, plan_key, plan_name, billing_cycle, status, trial_ends_at) 
         VALUES (?, 'pro', 'Pro Plan', 'yearly', 'trial', DATE_ADD(NOW(), INTERVAL 7 DAY))
         ON DUPLICATE KEY UPDATE status = VALUES(status)`,
        [creatorId]
      );

      const [newRows] = await db.query("SELECT * FROM creators WHERE id = ?", [creatorId]);
      creator = newRows[0];
    }

    // 3. Generate dynamic random 4-digit OTP code (e.g. 5924)
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Invalidate previous unused OTPs for this email
    await db.query("UPDATE otps SET is_used = TRUE WHERE email = ? AND is_used = FALSE", [email]);

    // Insert new OTP with 5-minute expiration
    await db.query(
      "INSERT INTO otps (email, otp_code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))",
      [email, otpCode]
    );

    // 4. Send real OTP Email via Gmail SMTP
    await sendOtpEmail(creator.email, otpCode);

    return res.json({
      success: true,
      message: `OTP sent successfully to ${creator.email} (valid for 5 minutes)`,
      email: creator.email,
      username: creator.username,
    });
  } catch (error) {
    console.error("Auth Controller Login Error:", error);
    return res.status(500).json({ error: error.message || "Login failed" });
  }
};

// POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const otp = (req.body.otp || "").trim();

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    // 1. Verify OTP code against MySQL otps table (Must be matching, un-used, and not expired)
    const [otpRows] = await db.query(
      `SELECT * FROM otps 
       WHERE email = ? AND otp_code = ? AND is_used = FALSE AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [email, otp]
    );

    if (otpRows.length > 0) {
      // Mark OTP as used
      await db.query("UPDATE otps SET is_used = TRUE WHERE id = ?", [otpRows[0].id]);
    } else {
      // Fallback for demo code 1234
      if (otp === "1234" || otp === "0000") {
        // demo bypass allowed
      } else {
        // Check if expired
        const [expiredRows] = await db.query(
          "SELECT * FROM otps WHERE email = ? AND otp_code = ? ORDER BY id DESC LIMIT 1",
          [email, otp]
        );

        if (expiredRows.length > 0) {
          return res.status(400).json({ error: "OTP code has expired (valid for 5 mins). Please click Resend Code." });
        }

        return res.status(400).json({ error: "Invalid OTP verification code. Please check your email." });
      }
    }

    // Fetch creator details + subscription from MySQL
    const [rows] = await db.query(
      `SELECT c.*, 
              s.plan_key, s.plan_name, s.billing_cycle, s.status AS sub_status, s.trial_ends_at
       FROM creators c
       LEFT JOIN subscriptions s ON c.id = s.creator_id
       WHERE c.email = ?`,
      [email]
    );

    const creator = rows[0];

    if (!creator) {
      return res.status(404).json({ error: "Creator account not found" });
    }

    // Fetch social accounts multi-row list
    const [socials] = await db.query(
      `SELECT platform, account_name, username, follower_count, media_count, audience_count, is_verified, last_synced_at 
       FROM social_accounts WHERE creator_id = ?`,
      [creator.id]
    );

    return res.json({
      success: true,
      message: "OTP verified successfully",
      creator: {
        id: creator.id,
        email: creator.email,
        displayName: creator.display_name,
        username: creator.username,
        photoUrl: creator.photo_url,
        category: creator.category,
        bio: creator.bio,
        themeKey: creator.theme_key,
        onboardingStep: creator.onboarding_step,
        isVerified: Boolean(creator.is_verified),
        subscription: {
          planKey: creator.plan_key || "pro",
          planName: creator.plan_name || "Pro Plan",
          billingCycle: creator.billing_cycle || "yearly",
          status: creator.sub_status || "trial",
          trialEndsAt: creator.trial_ends_at,
        },
        socials: socials,
      },
    });
  } catch (error) {
    console.error("Auth Controller Verify OTP Error:", error);
    return res.status(500).json({ error: error.message || "OTP verification failed" });
  }
};
