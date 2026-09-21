import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface CreatorIdRow extends RowDataPacket {
  id: number | string;
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    // Verify webhook signature if secret & header are available
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      const bufA = Buffer.from(signature, "utf-8");
      const bufB = Buffer.from(expectedSignature, "utf-8");

      if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
        console.warn("Razorpay Webhook signature verification failed");
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 400 }
        );
      }
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const eventName = event?.event;
    console.log(`Razorpay Webhook received event: ${eventName}`);

    // Handle recurring auto-debit charged event (Auto-Renewal)
    if (eventName === "subscription.charged" || eventName === "subscription.activated") {
      const subscriptionEntity = event?.payload?.subscription?.entity;
      const paymentEntity = event?.payload?.payment?.entity;

      const email = (subscriptionEntity?.notes?.email || paymentEntity?.email || "").trim();
      const planKey = subscriptionEntity?.notes?.planKey || "starter";
      const billingCycle = subscriptionEntity?.notes?.billingCycle || "monthly";

      if (email) {
        const [creators] = await db.query<CreatorIdRow[]>(
          "SELECT id FROM creators WHERE LOWER(email) = LOWER(?)",
          [email]
        );

        if (creators && creators.length > 0) {
          const creatorId = String(creators[0].id);
          const now = new Date();
          const periodMonths = billingCycle === "yearly" ? 12 : 1;
          const endsAt = new Date(now.getTime() + periodMonths * 30 * 24 * 60 * 60 * 1000);

          const dateNowStr = now.toISOString().slice(0, 19).replace("T", " ");
          const endsAtStr = endsAt.toISOString().slice(0, 19).replace("T", " ");

          await db.query(
            `INSERT INTO subscriptions (
               creator_id, plan_key, plan_name, billing_cycle, status, activated_at,
               current_period_started_at, current_period_ends_at, ends_at, renews_at, payment_mode, auto_renew
             )
             VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, 'recurring', 1)
             ON DUPLICATE KEY UPDATE
               plan_key = VALUES(plan_key),
               plan_name = VALUES(plan_name),
               billing_cycle = VALUES(billing_cycle),
               status = 'active',
               current_period_started_at = VALUES(current_period_started_at),
               current_period_ends_at = VALUES(current_period_ends_at),
               ends_at = VALUES(ends_at),
               renews_at = VALUES(renews_at),
               payment_mode = 'recurring',
               auto_renew = 1`,
            [
              creatorId,
              planKey,
              `${planKey.toUpperCase()} Plan`,
              billingCycle,
              dateNowStr,
              dateNowStr,
              endsAtStr,
              endsAtStr,
              endsAtStr,
            ]
          );

          console.log(`✅ Successfully updated subscription for creator ${creatorId} (${planKey}) via webhook [${eventName}]`);
        }
      }
    } else if (eventName === "subscription.halted" || eventName === "subscription.cancelled") {
      const subscriptionEntity = event?.payload?.subscription?.entity;
      const email = (subscriptionEntity?.notes?.email || "").trim();

      if (email) {
        await db.query(
          `UPDATE subscriptions s
           JOIN creators c ON s.creator_id = c.id
           SET s.status = ?, s.auto_renew = 0, s.renews_at = NULL
           WHERE LOWER(c.email) = LOWER(?)`,
          [eventName === "subscription.cancelled" ? "cancelled" : "halted", email]
        );
        console.log(`⚠️ Subscription marked as ${eventName} for ${email}`);
      }
    } else if (eventName === "payment.captured") {
      // Standard one-time order payment captured
      const paymentEntity = event?.payload?.payment?.entity;
      const email = (paymentEntity?.email || paymentEntity?.notes?.email || "").trim();
      const planKey = paymentEntity?.notes?.planKey;
      const billingCycle = paymentEntity?.notes?.billingCycle || "monthly";

      if (email && planKey && planKey !== "standard") {
        const [creators] = await db.query<CreatorIdRow[]>(
          "SELECT id FROM creators WHERE LOWER(email) = LOWER(?)",
          [email]
        );
        if (creators && creators.length > 0) {
          const creatorId = String(creators[0].id);
          const now = new Date();
          const periodMonths = billingCycle === "yearly" ? 12 : 1;
          const endsAt = new Date(now.getTime() + periodMonths * 30 * 24 * 60 * 60 * 1000);

          const dateNowStr = now.toISOString().slice(0, 19).replace("T", " ");
          const endsAtStr = endsAt.toISOString().slice(0, 19).replace("T", " ");

          await db.query(
            `UPDATE subscriptions
             SET status = 'active',
                 plan_key = ?,
                 plan_name = ?,
                 billing_cycle = ?,
                 current_period_started_at = ?,
                 current_period_ends_at = ?,
                 ends_at = ?,
                 renews_at = ?,
                 payment_mode = 'razorpay',
                 auto_renew = 1
             WHERE creator_id = ?`,
            [planKey, `${planKey.toUpperCase()} Plan`, billingCycle, dateNowStr, endsAtStr, endsAtStr, endsAtStr, creatorId]
          );
        }
      }
    }

    return NextResponse.json({ status: "ok", received: true });
  } catch (error: any) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json(
      { error: error?.message || "Webhook processing error" },
      { status: 500 }
    );
  }
}
