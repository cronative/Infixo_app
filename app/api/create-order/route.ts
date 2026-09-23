import crypto from "crypto";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { db } from "@/lib/db";
import { getPaidPlan } from "@/lib/billing";
import { requireCreator } from "@/lib/creatorAuth";

export async function POST(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });

    const body = await req.json();
    const plan = getPaidPlan(body.planKey, body.billingCycle);
    if (!plan) return NextResponse.json({ error: "Invalid paid plan or billing cycle" }, { status: 400 });

    const intentId = `pi_${crypto.randomUUID()}`;
    await db.query(
      `INSERT INTO payment_checkout_intents
       (id, creator_id, provider_type, plan_key, billing_cycle, amount, currency, status)
       VALUES (?, ?, 'order', ?, ?, ?, ?, 'creating')`,
      [intentId, auth.creator.id, plan.planKey, plan.billingCycle, plan.amount, plan.currency]
    );

    try {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const order = await razorpay.orders.create({
        amount: plan.amount,
        currency: plan.currency,
        receipt: intentId.slice(0, 40),
        notes: { checkoutIntentId: intentId, creatorId: auth.creator.id },
      });
      await db.query("UPDATE payment_checkout_intents SET provider_id = ?, status = 'pending' WHERE id = ?", [order.id, intentId]);
      return NextResponse.json({ order_id: order.id, amount: order.amount, currency: order.currency });
    } catch (error) {
      await db.query("UPDATE payment_checkout_intents SET status = 'failed' WHERE id = ?", [intentId]);
      throw error;
    }
  } catch (error: any) {
    console.error("Razorpay create-order error:", error);
    return NextResponse.json({ error: error?.error?.description || error?.message || "Failed to create order" }, { status: 500 });
  }
}
