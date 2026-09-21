import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface CreatorIdRow extends RowDataPacket {
  id: number | string;
}

function safeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const {
      razorpay_order_id,
      razorpay_subscription_id,
      razorpay_payment_id,
      razorpay_signature,
      email,
      planKey,
      billingCycle,
    } = body;

    // Validate required fields: payment_id & signature, plus either order_id or subscription_id
    if (!razorpay_payment_id || !razorpay_signature || (!razorpay_order_id && !razorpay_subscription_id)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: razorpay_payment_id, razorpay_signature, and either razorpay_order_id or razorpay_subscription_id are required.",
        },
        { status: 400 }
      );
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      console.error("Razorpay Error: RAZORPAY_KEY_SECRET is not configured");
      return NextResponse.json(
        { success: false, error: "Razorpay credentials are not configured on the server" },
        { status: 500 }
      );
    }

    // Signature verification:
    // For Subscriptions: HMAC-SHA256(payment_id + "|" + subscription_id, KEY_SECRET)
    // For Orders: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    let payload: string;
    const isRecurring = Boolean(razorpay_subscription_id);

    if (isRecurring) {
      payload = `${razorpay_payment_id}|${razorpay_subscription_id}`;
    } else {
      payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    }

    const generated_signature = crypto
      .createHmac("sha256", key_secret)
      .update(payload)
      .digest("hex");

    const isMatch = safeCompare(generated_signature, razorpay_signature);

    if (!isMatch) {
      console.warn(
        "Razorpay signature verification failed for identifier:",
        razorpay_subscription_id || razorpay_order_id
      );
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payment signature. Verification failed.",
        },
        { status: 400 }
      );
    }

    // If user / subscription info is provided, activate subscription in DB
    if (email && planKey) {
      try {
        const [creators] = await db.query<CreatorIdRow[]>(
          "SELECT id FROM creators WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))",
          [email.trim()]
        );
        if (creators && creators.length > 0) {
          const creatorId = String(creators[0].id);
          const now = new Date();
          const periodMonths = billingCycle === "yearly" ? 12 : 1;
          const endsAt = new Date(now.getTime() + periodMonths * 30 * 24 * 60 * 60 * 1000);

          const dateNowStr = now.toISOString().slice(0, 19).replace("T", " ");
          const endsAtStr = endsAt.toISOString().slice(0, 19).replace("T", " ");
          const paymentMode = isRecurring ? "recurring" : "razorpay";
          const normalizedPlanName =
            planKey === "starter"
              ? "Starter Plan"
              : planKey === "creator_pro" || planKey === "pro"
              ? "Creator Pro"
              : planKey === "creator_VIP" || planKey === "vip"
              ? "Creator VIP"
              : `${planKey.toUpperCase()} Plan`;

          await db.query(
            `INSERT INTO subscriptions (
               creator_id, plan_key, plan_name, billing_cycle, status, activated_at,
               current_period_started_at, current_period_ends_at, ends_at, renews_at,
               payment_mode, auto_renew, razorpay_subscription_id
             )
             VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, 1, ?)
             ON DUPLICATE KEY UPDATE
               plan_key = VALUES(plan_key),
               plan_name = VALUES(plan_name),
               billing_cycle = VALUES(billing_cycle),
               status = 'active',
               activated_at = VALUES(activated_at),
               current_period_started_at = VALUES(current_period_started_at),
               current_period_ends_at = VALUES(current_period_ends_at),
               ends_at = VALUES(ends_at),
               renews_at = VALUES(renews_at),
               payment_mode = VALUES(payment_mode),
               auto_renew = 1,
               razorpay_subscription_id = COALESCE(VALUES(razorpay_subscription_id), razorpay_subscription_id)`,
            [
              creatorId,
              planKey,
              normalizedPlanName,
              billingCycle || "monthly",
              dateNowStr,
              dateNowStr,
              endsAtStr,
              endsAtStr,
              endsAtStr,
              paymentMode,
              razorpay_subscription_id || null,
            ]
          );
        }
      } catch (dbErr) {
        console.error("Warning: Failed to update subscription in DB after payment verification:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      is_recurring: isRecurring,
      subscription_id: razorpay_subscription_id || null,
      order_id: razorpay_order_id || null,
      payment_id: razorpay_payment_id,
    });
  } catch (error: any) {
    console.error("Razorpay verify-payment error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error verifying payment",
      },
      { status: 500 }
    );
  }
}
