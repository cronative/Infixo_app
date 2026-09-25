import crypto from "crypto";
import { db } from "@/lib/db";
import { addBillingPeriod, toMysqlDate, type BillingCycle } from "@/lib/billing";
import { apiSuccess, apiError } from "@/lib/apiResponse";

function validSignature(rawBody: string, signature: string, secret: string) {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const left = Buffer.from(signature, "utf8");
  const right = Buffer.from(expected, "utf8");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return apiError("Webhook is not configured", 503);
  if (!signature || !validSignature(rawBody, signature, secret)) {
    return apiError("Invalid webhook signature", 401);
  }

  const eventId = req.headers.get("x-razorpay-event-id") || crypto.createHash("sha256").update(rawBody).digest("hex");
  try {
    const event = JSON.parse(rawBody);
    const eventName = String(event?.event || "unknown");
    const payloadHash = crypto.createHash("sha256").update(rawBody).digest("hex");

    const [existingRows]: any = await db.query(
      "SELECT status, payload_hash, created_at FROM payment_webhook_events WHERE event_id = ?",
      [eventId]
    );
    const existing = existingRows?.[0];
    if (existing && existing.payload_hash !== payloadHash) {
      return apiError("Webhook event ID conflict", 409);
    }
    const processingAgeMs = existing?.created_at ? Date.now() - new Date(existing.created_at).getTime() : 0;
    if (existing?.status === "processed" || (existing?.status === "processing" && processingAgeMs < 5 * 60 * 1000)) {
      return apiSuccess({ status: "ok", duplicate: true }, "Webhook duplicate event ignored");
    }
    await db.query(
      `INSERT INTO payment_webhook_events (event_id, event_type, payload_hash, status)
       VALUES (?, ?, ?, 'processing')
       ON DUPLICATE KEY UPDATE event_type = VALUES(event_type), payload_hash = VALUES(payload_hash), status = 'processing', error_message = NULL`,
      [eventId, eventName, payloadHash]
    );

    const subscription = event?.payload?.subscription?.entity;
    const payment = event?.payload?.payment?.entity;
    const providerId = subscription?.id || payment?.order_id;

    if (["subscription.charged", "subscription.activated", "payment.captured"].includes(eventName) && providerId) {
      const [intentRows]: any = await db.query("SELECT * FROM payment_checkout_intents WHERE provider_id = ? LIMIT 1", [providerId]);
      const intent = intentRows?.[0];
      if (intent && (intent.status === "pending" || intent.status === "completed")) {
        const start = subscription?.current_start ? new Date(subscription.current_start * 1000) : new Date();
        const end = subscription?.current_end
          ? new Date(subscription.current_end * 1000)
          : addBillingPeriod(start, intent.billing_cycle as BillingCycle);
        const planName = intent.plan_key === "starter" ? "Starter Plan" : intent.plan_key === "pro" ? "Creator Pro" : "Creator VIP";

        await db.query(
          `INSERT INTO subscriptions (
             creator_id, plan_key, plan_name, billing_cycle, status, activated_at,
             current_period_started_at, current_period_ends_at, ends_at, renews_at,
             payment_mode, auto_renew, razorpay_subscription_id
           ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             plan_key = VALUES(plan_key), plan_name = VALUES(plan_name), billing_cycle = VALUES(billing_cycle),
             status = 'active', current_period_started_at = VALUES(current_period_started_at),
             current_period_ends_at = VALUES(current_period_ends_at), ends_at = VALUES(ends_at),
             renews_at = VALUES(renews_at), cancelled_at = NULL, cancel_at_period_end = 0,
             payment_mode = VALUES(payment_mode), auto_renew = VALUES(auto_renew),
             razorpay_subscription_id = COALESCE(VALUES(razorpay_subscription_id), razorpay_subscription_id)`,
          [
            intent.creator_id, intent.plan_key, planName, intent.billing_cycle,
            toMysqlDate(start), toMysqlDate(start), toMysqlDate(end), toMysqlDate(end), toMysqlDate(end),
            intent.provider_type === "subscription" ? "recurring" : "razorpay",
            intent.provider_type === "subscription" ? 1 : 0,
            intent.provider_type === "subscription" ? providerId : null,
          ]
        );

        if (payment?.id && intent.status !== "completed") {
          await db.query(
            "UPDATE payment_checkout_intents SET status = 'completed', payment_id = ?, completed_at = NOW() WHERE id = ? AND status = 'pending'",
            [payment.id, intent.id]
          );
        }
      }
    } else if (["subscription.halted", "subscription.cancelled"].includes(eventName) && subscription?.id) {
      await db.query(
        `UPDATE subscriptions
         SET status = ?, auto_renew = 0, renews_at = NULL, cancelled_at = COALESCE(cancelled_at, NOW())
         WHERE razorpay_subscription_id = ?`,
        ["cancelled", subscription.id]
      );
    }

    await db.query("UPDATE payment_webhook_events SET status = 'processed', processed_at = NOW() WHERE event_id = ?", [eventId]);
    return apiSuccess({ status: "ok", received: true }, "Webhook processed successfully");
  } catch (error: any) {
    console.error("Razorpay webhook error:", error);
    try {
      await db.query(
        "UPDATE payment_webhook_events SET status = 'failed', error_message = ? WHERE event_id = ?",
        [String(error?.message || "Webhook processing error").slice(0, 500), eventId]
      );
    } catch {}
    return apiError("Webhook processing error", 500);
  }
}
