import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRazorpayKeys, razorpayRequest } from "@/lib/razorpay";
import { SubscriptionService } from "@/services/SubscriptionService";
import { BillingCycle, PlanKey, PlanMeta } from "@/types";

// POST /api/razorpay/create-subscription
// Creates (or reuses) a Razorpay Plan for the requested (planKey, billingCycle),
// then creates a Razorpay Subscription for the creator and returns the
// subscription_id for the client to open Razorpay Checkout with.
//
// Free Basic never hits this route — it activates instantly via /api/subscription.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, planKey, billingCycle } = body as {
      email: string;
      planKey: PlanKey;
      billingCycle: BillingCycle;
    };

    if (!email || !planKey || !billingCycle) {
      return NextResponse.json({ error: "email, planKey and billingCycle are required" }, { status: 400 });
    }

    if (planKey === "free") {
      return NextResponse.json(
        { error: "Free Basic doesn't need a payment gate — activate it via /api/subscription instead." },
        { status: 400 }
      );
    }

    const plan = SubscriptionService.getPlan(planKey);
    if (plan.key !== planKey) {
      return NextResponse.json({ error: "Unknown plan key" }, { status: 400 });
    }

    const [creators]: any = await db.query("SELECT id FROM creators WHERE email = ?", [email]);
    if (!creators || creators.length === 0) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }
    const creatorId = creators[0].id;

    // Ensure all Razorpay tables & columns exist in existing MySQL DB
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS razorpay_plans (
          id INT AUTO_INCREMENT PRIMARY KEY,
          plan_key VARCHAR(64) NOT NULL,
          billing_cycle VARCHAR(32) NOT NULL,
          razorpay_plan_id VARCHAR(128) NOT NULL,
          amount_paise INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY plan_cycle_idx (plan_key, billing_cycle)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    } catch (e: any) {}

    try {
      await db.query(`ALTER TABLE subscriptions ADD COLUMN razorpay_subscription_id VARCHAR(128) NULL`);
    } catch (e: any) {}
    try {
      await db.query(`ALTER TABLE subscriptions ADD COLUMN razorpay_plan_id VARCHAR(128) NULL`);
    } catch (e: any) {}
    try {
      await db.query(`ALTER TABLE subscriptions ADD COLUMN razorpay_status VARCHAR(64) NULL`);
    } catch (e: any) {}
    try {
      await db.query(`ALTER TABLE subscriptions ADD COLUMN trial_ends_at TIMESTAMP NULL DEFAULT NULL`);
    } catch (e: any) {}

    const totalAmount = billingCycle === "yearly" ? plan.yearlyPrice * 12 : plan.monthlyPrice;
    const amountPaise = Math.round(totalAmount * 100);
    const { keyId, keySecret } = getRazorpayKeys();

    let subscriptionId = `sub_test_${Date.now()}`;
    let razorpayPlanId = "plan_test";
    let razorpayStatus = "created";

    // Attempt to create real Razorpay Plan & Subscription if Secret is configured
    if (keySecret && !keySecret.startsWith("your_razorpay_")) {
      try {
        const [existingRows]: any = await db.query(
          "SELECT razorpay_subscription_id, status FROM subscriptions WHERE creator_id = ?",
          [creatorId]
        );
        const existing = existingRows?.[0];
        if (existing?.razorpay_subscription_id && (existing.status === "trial" || existing.status === "active") && !existing.razorpay_subscription_id.startsWith("sub_test_")) {
          try {
            await razorpayRequest(`/subscriptions/${existing.razorpay_subscription_id}/cancel`, {
              method: "POST",
              body: { cancel_at_cycle_end: 0 },
            });
          } catch (e: any) {
            console.warn("⚠️ Could not cancel previous Razorpay subscription (continuing anyway):", e.message);
          }
        }
        razorpayPlanId = await getOrCreateRazorpayPlan(planKey, billingCycle, plan);
        const trialDays = 7;
        const startAt = Math.floor(Date.now() / 1000) + trialDays * 24 * 60 * 60;
        const totalCount = billingCycle === "monthly" ? 120 : 10;

        const razorpaySub = await razorpayRequest<any>("/subscriptions", {
          method: "POST",
          body: {
            plan_id: razorpayPlanId,
            total_count: totalCount,
            customer_notify: 1,
            start_at: startAt,
            notes: { email, planKey, billingCycle },
          },
        });

        if (razorpaySub?.id) {
          subscriptionId = razorpaySub.id;
          razorpayStatus = razorpaySub.status || "created";
        }
      } catch (e: any) {
        console.warn("⚠️ Razorpay API call fallback (opening checkout with Key ID):", e.message);
      }
    }

    await db.query(
      `INSERT INTO subscriptions (creator_id, plan_key, plan_name, billing_cycle, status, razorpay_subscription_id, razorpay_plan_id, razorpay_status, trial_ends_at)
       VALUES (?, ?, ?, ?, 'trial', ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         plan_key = VALUES(plan_key),
         plan_name = VALUES(plan_name),
         billing_cycle = VALUES(billing_cycle),
         status = 'trial',
         razorpay_subscription_id = VALUES(razorpay_subscription_id),
         razorpay_plan_id = VALUES(razorpay_plan_id),
         razorpay_status = VALUES(razorpay_status)`,
      [
        creatorId,
        planKey,
        `${plan.name} Plan`,
        billingCycle,
        subscriptionId,
        razorpayPlanId,
        razorpayStatus,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ]
    );

    return NextResponse.json({
      success: true,
      subscriptionId,
      amountPaise,
      keyId: keyId || "rzp_test_SQis9g0UgsSikN",
      planName: plan.name,
      trialDays: plan.freeTrialDays || 7,
    });
  } catch (err: any) {
    console.error("POST Create Razorpay Subscription Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function getOrCreateRazorpayPlan(planKey: PlanKey, billingCycle: BillingCycle, plan: PlanMeta): Promise<string> {
  const [rows]: any = await db.query(
    "SELECT razorpay_plan_id FROM razorpay_plans WHERE plan_key = ? AND billing_cycle = ?",
    [planKey, billingCycle]
  );
  if (rows && rows.length > 0) {
    return rows[0].razorpay_plan_id;
  }

  const totalAmount = billingCycle === "yearly" ? plan.yearlyPrice * 12 : plan.monthlyPrice;
  const amountPaise = Math.round(totalAmount * 100);
  const period = billingCycle === "yearly" ? "yearly" : "monthly";

  const created = await razorpayRequest<any>("/plans", {
    method: "POST",
    body: {
      period,
      interval: 1,
      item: {
        name: `Inflixo ${plan.name} (${billingCycle})`,
        amount: amountPaise,
        currency: "INR",
        description: plan.description,
      },
    },
  });

  await db.query(
    `INSERT INTO razorpay_plans (plan_key, billing_cycle, razorpay_plan_id, amount_paise) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE razorpay_plan_id = VALUES(razorpay_plan_id), amount_paise = VALUES(amount_paise)`,
    [planKey, billingCycle, created.id, amountPaise]
  );

  return created.id;
}
