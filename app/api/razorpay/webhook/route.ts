import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";

// POST /api/razorpay/webhook
// Server-to-server events from Razorpay (renewals, cancellations, failed
// charges) so subscription status stays correct even when the creator isn't
// in the browser to trigger /verify-subscription. Configure this URL under
// Razorpay Dashboard → Settings → Webhooks, and set RAZORPAY_WEBHOOK_SECRET
// to the secret shown there (distinct from the API Key Secret).
//
// IMPORTANT: signature verification needs the raw, unparsed request body —
// do not swap req.text() for req.json() above the verify call.

const STATUS_MAP: Record<string, "active" | "cancelled" | "expired"> = {
  "subscription.activated": "active",
  "subscription.charged": "active",
  "subscription.cancelled": "cancelled",
  "subscription.completed": "cancelled",
  "subscription.paused": "expired",
  "subscription.halted": "expired",
  "payment.failed": "expired",
};

export async function POST(req: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  if (!webhookSecret || webhookSecret.startsWith("your_razorpay_")) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not configured — rejecting webhook.");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  if (!signature || !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    console.warn("⚠️ Rejected Razorpay webhook with invalid signature");
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventId: string | null = req.headers.get("x-razorpay-event-id") || event.id || null;
  const eventType: string = event.event;
  const subscriptionEntity = event.payload?.subscription?.entity;
  const razorpaySubscriptionId: string | undefined =
    subscriptionEntity?.id || event.payload?.payment?.entity?.subscription_id;

  // Idempotency guard: razorpay_webhook_events.event_id is UNIQUE, so a
  // duplicate delivery (Razorpay retries on non-2xx) just no-ops here.
  if (eventId) {
    try {
      await db.query(
        `INSERT INTO razorpay_webhook_events (event_id, event_type, razorpay_subscription_id, payload) VALUES (?, ?, ?, ?)`,
        [eventId, eventType, razorpaySubscriptionId || null, JSON.stringify(event)]
      );
    } catch (e: any) {
      if (e.code === "ER_DUP_ENTRY") {
        return NextResponse.json({ success: true, duplicate: true });
      }
      console.warn("⚠️ Could not log Razorpay webhook event:", e.message);
    }
  }

  const mappedStatus = STATUS_MAP[eventType];
  if (mappedStatus && razorpaySubscriptionId) {
    await db.query(`UPDATE subscriptions SET status = ?, razorpay_status = ? WHERE razorpay_subscription_id = ?`, [
      mappedStatus,
      subscriptionEntity?.status || eventType,
      razorpaySubscriptionId,
    ]);
  }

  return NextResponse.json({ success: true });
}
