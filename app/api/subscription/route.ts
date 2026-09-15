import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { recordOnboardingStep } from "@/lib/onboardingStepDb";

interface SubscriptionRow extends RowDataPacket {
  plan_key?: string;
  plan_name?: string;
  billing_cycle?: string;
  status?: string;
  activated_at?: string | Date | null;
  created_at?: string | Date | null;
  trial_started_at?: string | Date | null;
  trial_ends_at?: string | Date | null;
  current_period_started_at?: string | Date | null;
  current_period_ends_at?: string | Date | null;
  renews_at?: string | Date | null;
  ends_at?: string | Date | null;
  cancelled_at?: string | Date | null;
  cancel_at_period_end?: boolean | number;
  payment_mode?: string;
  first_month_offer?: boolean | number;
  first_month_amount?: number | null;
  first_month_currency?: string | null;
  auto_renew?: boolean | number;
}

interface CreatorIdRow extends RowDataPacket {
  id: number | string;
}

function toMysqlDate(value?: string | Date | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function toIsoOrNull(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected subscription error";
}

async function ensureSubscriptionLifecycleColumns() {
  const statements = [
    `ALTER TABLE subscriptions MODIFY COLUMN plan_key VARCHAR(32) NOT NULL DEFAULT 'early_access'`,
    `ALTER TABLE subscriptions ADD COLUMN trial_started_at DATETIME NULL`,
    `ALTER TABLE subscriptions ADD COLUMN trial_ends_at DATETIME NULL`,
    `ALTER TABLE subscriptions ADD COLUMN current_period_started_at DATETIME NULL`,
    `ALTER TABLE subscriptions ADD COLUMN current_period_ends_at DATETIME NULL`,
    `ALTER TABLE subscriptions ADD COLUMN renews_at DATETIME NULL`,
    `ALTER TABLE subscriptions ADD COLUMN ends_at DATETIME NULL`,
    `ALTER TABLE subscriptions ADD COLUMN cancelled_at DATETIME NULL`,
    `ALTER TABLE subscriptions ADD COLUMN cancel_at_period_end TINYINT(1) NOT NULL DEFAULT 0`,
    `ALTER TABLE subscriptions ADD COLUMN payment_mode VARCHAR(32) NOT NULL DEFAULT 'free_trial'`,
    `ALTER TABLE subscriptions ADD COLUMN first_month_offer TINYINT(1) NOT NULL DEFAULT 0`,
    `ALTER TABLE subscriptions ADD COLUMN first_month_amount INT NULL`,
    `ALTER TABLE subscriptions ADD COLUMN first_month_currency VARCHAR(8) NULL`,
    `ALTER TABLE subscriptions ADD COLUMN auto_renew TINYINT(1) NOT NULL DEFAULT 0`,
  ];

  for (const statement of statements) {
    try {
      await db.query(statement);
    } catch {
      // Existing columns or already-compatible schema can continue safely.
    }
  }
}

function getTrialFallbackSubscription() {
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  return {
    planKey: "early_access",
    planName: "Free Trial",
    billingCycle: "yearly",
    status: "trial",
    activatedAt: now.toISOString(),
    trialStartedAt: now.toISOString(),
    trialEndsAt,
    currentPeriodStartedAt: now.toISOString(),
    currentPeriodEndsAt: trialEndsAt,
    renewsAt: null,
    endsAt: trialEndsAt,
    cancelledAt: null,
    cancelAtPeriodEnd: false,
    paymentMode: "free_trial",
    firstMonthOffer: true,
    firstMonthAmount: 99,
    firstMonthCurrency: "INR",
    autoRenew: false,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({
        subscription: getTrialFallbackSubscription(),
      });
    }

    const [rows] = await db.query<SubscriptionRow[]>(
      `SELECT s.* FROM subscriptions s
       JOIN creators c ON c.id = s.creator_id
       WHERE c.email = ?`,
      [email]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({
        subscription: getTrialFallbackSubscription(),
      });
    }

    const s = rows[0];
    return NextResponse.json({
      success: true,
      subscription: {
        planKey: s.plan_key || "early_access",
        planName: s.plan_name || "Free Trial",
        billingCycle: s.billing_cycle || "yearly",
        status: s.status || "trial",
        activatedAt: toIsoOrNull(s.activated_at) || toIsoOrNull(s.created_at),
        trialStartedAt: toIsoOrNull(s.trial_started_at),
        trialEndsAt: toIsoOrNull(s.trial_ends_at),
        currentPeriodStartedAt: toIsoOrNull(s.current_period_started_at),
        currentPeriodEndsAt: toIsoOrNull(s.current_period_ends_at),
        renewsAt: toIsoOrNull(s.renews_at),
        endsAt: toIsoOrNull(s.ends_at),
        cancelledAt: toIsoOrNull(s.cancelled_at),
        cancelAtPeriodEnd: Boolean(s.cancel_at_period_end),
        paymentMode: s.payment_mode || "free_trial",
        firstMonthOffer: Boolean(s.first_month_offer),
        firstMonthAmount: s.first_month_amount ?? 99,
        firstMonthCurrency: s.first_month_currency || "INR",
        autoRenew: Boolean(s.auto_renew),
      },
    });
  } catch (err) {
    console.error("GET Subscription Error:", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, planKey, planName, billingCycle, status } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const [creators] = await db.query<CreatorIdRow[]>("SELECT id FROM creators WHERE email = ?", [email]);
    if (!creators || creators.length === 0) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const creatorId = String(creators[0].id);
    await ensureSubscriptionLifecycleColumns();

    if (status === "cancelled") {
      await db.query(
        `UPDATE subscriptions
         SET status = 'cancelled', cancelled_at = ?, auto_renew = 0, renews_at = NULL
         WHERE creator_id = ?`,
        [toMysqlDate(body.cancelledAt) || toMysqlDate(new Date().toISOString()), creatorId]
      );
      return NextResponse.json({ success: true, message: "Subscription cancelled successfully" });
    }

    if (!planKey) {
      return NextResponse.json({ error: "planKey required" }, { status: 400 });
    }

    // Store every date Cashfree or the dashboard needs to explain access clearly.
    await db.query(
      `INSERT INTO subscriptions (
         creator_id, plan_key, plan_name, billing_cycle, status, activated_at,
         trial_started_at, trial_ends_at, current_period_started_at, current_period_ends_at,
         renews_at, ends_at, cancelled_at, cancel_at_period_end, payment_mode,
         first_month_offer, first_month_amount, first_month_currency, auto_renew
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         plan_key = VALUES(plan_key),
         plan_name = VALUES(plan_name),
         billing_cycle = VALUES(billing_cycle),
         status = VALUES(status),
         activated_at = VALUES(activated_at),
         trial_started_at = VALUES(trial_started_at),
         trial_ends_at = VALUES(trial_ends_at),
         current_period_started_at = VALUES(current_period_started_at),
         current_period_ends_at = VALUES(current_period_ends_at),
         renews_at = VALUES(renews_at),
         ends_at = VALUES(ends_at),
         cancelled_at = VALUES(cancelled_at),
         cancel_at_period_end = VALUES(cancel_at_period_end),
         payment_mode = VALUES(payment_mode),
         first_month_offer = VALUES(first_month_offer),
         first_month_amount = VALUES(first_month_amount),
         first_month_currency = VALUES(first_month_currency),
         auto_renew = VALUES(auto_renew)`,
      [
        creatorId,
        planKey,
        planName || `${planKey.toUpperCase()} Plan`,
        billingCycle || "yearly",
        status || (planKey === "early_access" ? "trial" : "active"),
        toMysqlDate(body.activatedAt) || toMysqlDate(new Date().toISOString()),
        toMysqlDate(body.trialStartedAt),
        toMysqlDate(body.trialEndsAt),
        toMysqlDate(body.currentPeriodStartedAt),
        toMysqlDate(body.currentPeriodEndsAt),
        toMysqlDate(body.renewsAt),
        toMysqlDate(body.endsAt),
        toMysqlDate(body.cancelledAt),
        body.cancelAtPeriodEnd ? 1 : 0,
        body.paymentMode || (planKey === "early_access" ? "free_trial" : "one_time_first_month"),
        body.firstMonthOffer ? 1 : 0,
        body.firstMonthAmount ?? 99,
        body.firstMonthCurrency || "INR",
        body.autoRenew ? 1 : 0,
      ]
    );

    // Record / Update current step in creator_onboarding_steps table (1 row per email)
    await recordOnboardingStep(email, "finish", creatorId);

    return NextResponse.json({ success: true, message: "Subscription activated in MySQL" });
  } catch (err) {
    console.error("POST Subscription Error:", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
