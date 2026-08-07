import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { razorpayRequest } from "@/lib/razorpay";

// POST /api/razorpay/cancel-subscription
// Cancels the creator's live Razorpay mandate (if any) so they stop being
// billed, then marks the local subscription row cancelled. Free Basic has no
// Razorpay subscription attached, so this just no-ops down to a local cancel.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body as { email: string };

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const [creators]: any = await db.query("SELECT id FROM creators WHERE email = ?", [email]);
    if (!creators || creators.length === 0) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }
    const creatorId = creators[0].id;

    const [rows]: any = await db.query("SELECT razorpay_subscription_id FROM subscriptions WHERE creator_id = ?", [
      creatorId,
    ]);
    const razorpaySubscriptionId = rows?.[0]?.razorpay_subscription_id;

    if (razorpaySubscriptionId) {
      try {
        // cancel_at_cycle_end: 0 → cancel immediately rather than at the end
        // of the current billing period.
        await razorpayRequest(`/subscriptions/${razorpaySubscriptionId}/cancel`, {
          method: "POST",
          body: { cancel_at_cycle_end: 0 },
        });
      } catch (e: any) {
        console.warn("⚠️ Razorpay cancel call failed (marking cancelled locally anyway):", e.message);
      }
    }

    await db.query(
      `UPDATE subscriptions SET status = 'cancelled', razorpay_status = 'cancelled' WHERE creator_id = ?`,
      [creatorId]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST Cancel Razorpay Subscription Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
