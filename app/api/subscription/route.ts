import Razorpay from "razorpay";
import { db } from "@/lib/db";
import { requireCreator } from "@/lib/creatorAuth";
import { toMysqlDate } from "@/lib/billing";
import { apiSuccess, apiError } from "@/lib/apiResponse";

function toIso(value: unknown) {
  if (!value) return null;
  const date = new Date(value as string | Date);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function GET(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const [rows]: any = await db.query(
      "SELECT * FROM subscriptions WHERE creator_id = ? ORDER BY updated_at DESC LIMIT 1",
      [auth.creator.id]
    );
    const s = rows?.[0];
    if (!s) return apiSuccess({ subscription: null }, "No subscription found");

    return apiSuccess({
      subscription: {
        planKey: s.plan_key || "early_access",
        planName: s.plan_name || "Free Trial",
        billingCycle: s.billing_cycle || "yearly",
        status: s.status || "trial",
        activatedAt: toIso(s.activated_at) || toIso(s.created_at),
        trialStartedAt: toIso(s.trial_started_at),
        trialEndsAt: toIso(s.trial_ends_at),
        currentPeriodStartedAt: toIso(s.current_period_started_at),
        currentPeriodEndsAt: toIso(s.current_period_ends_at),
        renewsAt: toIso(s.renews_at),
        endsAt: toIso(s.ends_at),
        cancelledAt: toIso(s.cancelled_at),
        cancelAtPeriodEnd: Boolean(s.cancel_at_period_end),
        paymentMode: s.payment_mode || "free_trial",
        autoRenew: Boolean(s.auto_renew),
        hasUsedTrial: Boolean(s.trial_started_at),
      },
    }, "Subscription loaded successfully");
  } catch (error: any) {
    console.error("GET Subscription Error:", error);
    return apiError(error?.message || "Failed to load subscription", 500);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const body = await req.json();

    if (body.action === "start_trial") {
      const [rows]: any = await db.query("SELECT * FROM subscriptions WHERE creator_id = ? LIMIT 1", [auth.creator.id]);
      const existing = rows?.[0];
      if (existing?.trial_started_at || (existing && existing.plan_key !== "early_access")) {
        return apiError("Free trial has already been used", 409);
      }

      const now = new Date();
      const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      await db.query(
        `INSERT INTO subscriptions (
           creator_id, plan_key, plan_name, billing_cycle, status, activated_at,
           trial_started_at, trial_ends_at, current_period_started_at,
           current_period_ends_at, ends_at, payment_mode, auto_renew
         ) VALUES (?, 'early_access', 'Free Trial', 'monthly', 'trial', ?, ?, ?, ?, ?, ?, 'free_trial', 0)
         ON DUPLICATE KEY UPDATE
           plan_key = 'early_access', plan_name = 'Free Trial', status = 'trial',
           activated_at = VALUES(activated_at), trial_started_at = VALUES(trial_started_at),
           trial_ends_at = VALUES(trial_ends_at), current_period_started_at = VALUES(current_period_started_at),
           current_period_ends_at = VALUES(current_period_ends_at), ends_at = VALUES(ends_at),
           payment_mode = 'free_trial', auto_renew = 0`,
        [auth.creator.id, toMysqlDate(now), toMysqlDate(now), toMysqlDate(trialEnd), toMysqlDate(now), toMysqlDate(trialEnd), toMysqlDate(trialEnd)]
      );
      return apiSuccess({}, "Free trial started");
    }

    if (body.action === "cancel") {
      const [rows]: any = await db.query(
        "SELECT razorpay_subscription_id, plan_key FROM subscriptions WHERE creator_id = ? LIMIT 1",
        [auth.creator.id]
      );
      const current = rows?.[0];
      if (!current) return apiError("Subscription not found", 404);

      if (current.razorpay_subscription_id) {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret) return apiError("Payments are not configured", 503);
        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        await razorpay.subscriptions.cancel(current.razorpay_subscription_id, true);
        await db.query(
          "UPDATE subscriptions SET cancel_at_period_end = 1, auto_renew = 0, cancelled_at = NOW() WHERE creator_id = ?",
          [auth.creator.id]
        );
      } else {
        await db.query(
          "UPDATE subscriptions SET status = 'cancelled', auto_renew = 0, cancelled_at = NOW() WHERE creator_id = ?",
          [auth.creator.id]
        );
      }
      return apiSuccess({}, "Subscription cancellation scheduled");
    }

    return apiError("Unsupported subscription action", 400);
  } catch (error: any) {
    console.error("POST Subscription Error:", error);
    return apiError(error?.message || "Subscription update failed", 500);
  }
}
