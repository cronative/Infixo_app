import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordOnboardingStep } from "@/lib/onboardingStepDb";

// GET /api/subscription?email=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({
        subscription: {
          planKey: "early_access",
          planName: "Early Access",
          billingCycle: "yearly",
          status: "active",
          activatedAt: new Date().toISOString(),
        },
      });
    }

    const [rows]: any = await db.query(
      `SELECT s.* FROM subscriptions s
       JOIN creators c ON c.id = s.creator_id
       WHERE c.email = ?`,
      [email]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({
        subscription: {
          planKey: "early_access",
          planName: "Early Access",
          billingCycle: "yearly",
          status: "active",
          activatedAt: new Date().toISOString(),
        },
      });
    }

    const s = rows[0];
    return NextResponse.json({
      success: true,
      subscription: {
        planKey: s.plan_key || "early_access",
        planName: s.plan_name || "Early Access",
        billingCycle: s.billing_cycle || "yearly",
        status: s.status || "active",
        activatedAt: s.activated_at || s.created_at,
      },
    });
  } catch (err: any) {
    console.error("GET Subscription Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/subscription (Activate Plan in MySQL)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, planKey, planName, billingCycle } = body;

    if (!email || !planKey) {
      return NextResponse.json({ error: "Email and planKey required" }, { status: 400 });
    }

    const [creators]: any = await db.query("SELECT id FROM creators WHERE email = ?", [email]);
    if (!creators || creators.length === 0) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const creatorId = creators[0].id;

    // Ensure plan_key column in MySQL DB accepts 'free', 'starter', 'pro', 'unlimited' without truncation
    try {
      await db.query(`ALTER TABLE subscriptions MODIFY COLUMN plan_key VARCHAR(32) NOT NULL DEFAULT 'free'`);
    } catch (e: any) {
      // Silently continue if already modified
    }

    await db.query(
      `INSERT INTO subscriptions (creator_id, plan_key, plan_name, billing_cycle, status, activated_at)
       VALUES (?, ?, ?, ?, 'active', NOW())
       ON DUPLICATE KEY UPDATE
         plan_key = VALUES(plan_key),
         plan_name = VALUES(plan_name),
         billing_cycle = VALUES(billing_cycle),
         status = 'active',
         activated_at = NOW()`,
      [creatorId, planKey, planName || `${planKey.toUpperCase()} Plan`, billingCycle || "yearly"]
    );

    // Record / Update current step in creator_onboarding_steps table (1 row per email)
    await recordOnboardingStep(email, "finish", creatorId);

    return NextResponse.json({ success: true, message: "Subscription activated in MySQL" });
  } catch (err: any) {
    console.error("POST Subscription Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
