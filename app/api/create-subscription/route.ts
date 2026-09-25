import crypto from "crypto";
import Razorpay from "razorpay";
import { db } from "@/lib/db";
import { getPaidPlan } from "@/lib/billing";
import { requireCreator } from "@/lib/creatorAuth";
import { getOrCreateRazorpayPlan } from "@/lib/razorpayPlans";
import { apiSuccess, apiError } from "@/lib/apiResponse";

export async function POST(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return apiError("Payments are not configured", 503);

    const body = await req.json();
    const plan = getPaidPlan(body.planKey, body.billingCycle);
    if (!plan) return apiError("Invalid paid plan or billing cycle", 400);

    const intentId = `pi_${crypto.randomUUID()}`;
    await db.query(
      `INSERT INTO payment_checkout_intents
       (id, creator_id, provider_type, plan_key, billing_cycle, amount, currency, status)
       VALUES (?, ?, 'subscription', ?, ?, ?, ?, 'creating')`,
      [intentId, auth.creator.id, plan.planKey, plan.billingCycle, plan.amount, plan.currency]
    );

    try {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const planId = await getOrCreateRazorpayPlan(razorpay, plan.planKey, plan.billingCycle);
      const subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        total_count: plan.billingCycle === "yearly" ? 10 : 60,
        quantity: 1,
        customer_notify: 1,
        notes: {
          checkoutIntentId: intentId,
          creatorId: auth.creator.id,
          planKey: plan.planKey,
          billingCycle: plan.billingCycle,
        },
      });

      await db.query("UPDATE payment_checkout_intents SET provider_id = ?, status = 'pending' WHERE id = ?", [subscription.id, intentId]);
      return apiSuccess({ subscription_id: subscription.id, plan_id: subscription.plan_id, status: subscription.status }, "Subscription created successfully");
    } catch (error) {
      await db.query("UPDATE payment_checkout_intents SET status = 'failed' WHERE id = ?", [intentId]);
      throw error;
    }
  } catch (error: any) {
    console.error("Razorpay create-subscription error:", error);
    return apiError(error?.error?.description || error?.message || "Failed to create subscription", 500);
  }
}
