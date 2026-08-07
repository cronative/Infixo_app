import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/subscription?email=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({
        subscription: {
          planKey: "pro",
          planName: "Pro Plan",
          billingCycle: "yearly",
          status: "trial",
          activatedAt: null,
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
          planKey: "pro",
          planName: "Pro Plan",
          billingCycle: "yearly",
          status: "trial",
          activatedAt: null,
        },
      });
    }

    const s = rows[0];
    return NextResponse.json({
      success: true,
      subscription: {
        planKey: s.plan_key || "pro",
        planName: s.plan_name || "Pro Plan",
        billingCycle: s.billing_cycle || "yearly",
        status: s.status || "trial",
        activatedAt: s.activated_at,
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
    try {
      await db.query(
        `INSERT INTO creator_onboarding_steps (email, creator_id, step_name, is_completed, completed_at)
         VALUES (?, ?, 'finish', TRUE, NOW())
         ON DUPLICATE KEY UPDATE creator_id = VALUES(creator_id), step_name = 'finish', is_completed = TRUE, completed_at = NOW()`,
        [email, creatorId]
      );
    } catch (e: any) {
      console.warn("⚠️ Could not record subscription finish step:", e.message);
    }

    return NextResponse.json({ success: true, message: "Subscription activated in MySQL" });
  } catch (err: any) {
    console.error("POST Subscription Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
