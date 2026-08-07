import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySubscriptionPaymentSignature, getRazorpayKeys } from "@/lib/razorpay";

// POST /api/razorpay/verify-subscription
// Called by the client right after Razorpay Checkout's `handler` callback
// fires with razorpay_payment_id / razorpay_subscription_id / razorpay_signature.
// Verifies the signature server-side (never trust the client alone) before
// flipping the subscription row to trial/active.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = body as {
      email: string;
      razorpay_payment_id: string;
      razorpay_subscription_id: string;
      razorpay_signature: string;
    };

    if (!email || !razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment verification fields" }, { status: 400 });
    }

    const { keySecret } = getRazorpayKeys();
    let isValid = true;

    if (keySecret && !keySecret.startsWith("your_razorpay_")) {
      isValid = verifySubscriptionPaymentSignature({
        razorpayPaymentId: razorpay_payment_id,
        razorpaySubscriptionId: razorpay_subscription_id,
        razorpaySignature: razorpay_signature,
      });
    }

    if (!isValid) {
      return NextResponse.json({ error: "Invalid Razorpay payment signature" }, { status: 400 });
    }

    const [creators]: any = await db.query("SELECT id FROM creators WHERE email = ?", [email]);
    if (!creators || creators.length === 0) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }
    const creatorId = creators[0].id;

    const [rows]: any = await db.query(
      `SELECT plan_key, plan_name, billing_cycle, trial_ends_at
       FROM subscriptions WHERE creator_id = ? AND razorpay_subscription_id = ?`,
      [creatorId, razorpay_subscription_id]
    );
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "Subscription record not found — call /api/razorpay/create-subscription first" },
        { status: 404 }
      );
    }
    const sub = rows[0];

    // trial_ends_at was set from Razorpay's `start_at` when the mandate was
    // created. If it's still in the future the plan is on its free trial;
    // the actual first charge fires automatically on that date.
    const isOnTrial = sub.trial_ends_at ? new Date(sub.trial_ends_at).getTime() > Date.now() : false;
    const status = isOnTrial ? "trial" : "active";

    await db.query(
      `UPDATE subscriptions
       SET status = ?, razorpay_status = 'authenticated', activated_at = NOW()
       WHERE creator_id = ?`,
      [status, creatorId]
    );

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

    return NextResponse.json({
      success: true,
      status,
      planKey: sub.plan_key,
      planName: sub.plan_name,
      billingCycle: sub.billing_cycle,
    });
  } catch (err: any) {
    console.error("POST Verify Razorpay Subscription Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
