import crypto from "crypto";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { db } from "@/lib/db";
import { addBillingPeriod, toMysqlDate, type BillingCycle } from "@/lib/billing";
import { requireCreator } from "@/lib/creatorAuth";

function safeCompare(a: string, b: string) {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export async function POST(req: Request) {
  const auth = await requireCreator(req);
  if (auth.error) return auth.error;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });

  try {
    const body = await req.json();
    const paymentId = body.razorpay_payment_id;
    const signature = body.razorpay_signature;
    const providerId = body.razorpay_subscription_id || body.razorpay_order_id;
    const isRecurring = Boolean(body.razorpay_subscription_id);
    if (!paymentId || !signature || !providerId) {
      return NextResponse.json({ success: false, error: "Missing payment verification fields" }, { status: 400 });
    }

    const signedPayload = isRecurring
      ? `${paymentId}|${body.razorpay_subscription_id}`
      : `${body.razorpay_order_id}|${paymentId}`;
    const expected = crypto.createHmac("sha256", keySecret).update(signedPayload).digest("hex");
    if (!safeCompare(expected, signature)) {
      return NextResponse.json({ success: false, error: "Invalid payment signature" }, { status: 400 });
    }

    const [intentRows]: any = await db.query(
      `SELECT * FROM payment_checkout_intents
       WHERE provider_id = ? AND creator_id = ? LIMIT 1`,
      [providerId, auth.creator.id]
    );
    const intent = intentRows?.[0];
    if (!intent) return NextResponse.json({ success: false, error: "Checkout intent not found" }, { status: 404 });
    if (intent.provider_type !== (isRecurring ? "subscription" : "order")) {
      return NextResponse.json({ success: false, error: "Checkout type mismatch" }, { status: 400 });
    }

    if (intent.status === "completed") {
      if (intent.payment_id !== paymentId) {
        return NextResponse.json({ success: false, error: "Checkout intent was already consumed" }, { status: 409 });
      }
      return NextResponse.json({ success: true, duplicate: true, is_recurring: isRecurring, subscription_id: body.razorpay_subscription_id || null, order_id: body.razorpay_order_id || null, payment_id: paymentId });
    }
    if (intent.status !== "pending") {
      return NextResponse.json({ success: false, error: "Checkout intent is not payable" }, { status: 409 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const payment: any = await razorpay.payments.fetch(paymentId);
    if (payment.status !== "captured") {
      return NextResponse.json({ success: false, error: "Payment has not been captured" }, { status: 409 });
    }
    if (Number(payment.amount) !== Number(intent.amount) || String(payment.currency).toUpperCase() !== String(intent.currency).toUpperCase()) {
      return NextResponse.json({ success: false, error: "Payment amount does not match checkout" }, { status: 400 });
    }
    if (!isRecurring && payment.order_id !== providerId) {
      return NextResponse.json({ success: false, error: "Payment does not belong to this order" }, { status: 400 });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [lockedRows]: any = await connection.query(
        "SELECT status, payment_id FROM payment_checkout_intents WHERE id = ? FOR UPDATE",
        [intent.id]
      );
      const locked = lockedRows?.[0];
      if (!locked || (locked.status === "completed" && locked.payment_id !== paymentId)) {
        throw new Error("Checkout intent was already consumed");
      }

      if (locked.status !== "completed") {
        const now = new Date();
        const periodEnd = addBillingPeriod(now, intent.billing_cycle as BillingCycle);
        const planName = intent.plan_key === "starter" ? "Starter Plan" : intent.plan_key === "pro" ? "Creator Pro" : "Creator VIP";
        await connection.query(
          `INSERT INTO subscriptions (
             creator_id, plan_key, plan_name, billing_cycle, status, activated_at,
             current_period_started_at, current_period_ends_at, ends_at, renews_at,
             payment_mode, auto_renew, razorpay_subscription_id
           ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             plan_key = VALUES(plan_key), plan_name = VALUES(plan_name), billing_cycle = VALUES(billing_cycle),
             status = 'active', activated_at = VALUES(activated_at),
             current_period_started_at = VALUES(current_period_started_at),
             current_period_ends_at = VALUES(current_period_ends_at), ends_at = VALUES(ends_at),
             renews_at = VALUES(renews_at), cancelled_at = NULL, cancel_at_period_end = 0,
             payment_mode = VALUES(payment_mode), auto_renew = VALUES(auto_renew),
             razorpay_subscription_id = VALUES(razorpay_subscription_id)`,
          [
            auth.creator.id, intent.plan_key, planName, intent.billing_cycle,
            toMysqlDate(now), toMysqlDate(now), toMysqlDate(periodEnd), toMysqlDate(periodEnd), toMysqlDate(periodEnd),
            isRecurring ? "recurring" : "razorpay", isRecurring ? 1 : 0,
            body.razorpay_subscription_id || null,
          ]
        );
        await connection.query(
          "UPDATE payment_checkout_intents SET status = 'completed', payment_id = ?, completed_at = NOW() WHERE id = ?",
          [paymentId, intent.id]
        );
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return NextResponse.json({ success: true, is_recurring: isRecurring, subscription_id: body.razorpay_subscription_id || null, order_id: body.razorpay_order_id || null, payment_id: paymentId });
  } catch (error: any) {
    console.error("Razorpay verify-payment error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Payment verification failed" }, { status: 500 });
  }
}
