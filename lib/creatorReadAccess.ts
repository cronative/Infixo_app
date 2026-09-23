import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCreator } from "@/lib/creatorAuth";
import { isAuthorizedAdmin } from "@/lib/adminAuth";

function asTime(value: unknown) {
  if (!value) return null;
  const time = new Date(value as string | Date).getTime();
  return Number.isNaN(time) ? null : time;
}

export async function isCreatorPublic(creatorId: string) {
  const [rows]: any = await db.query(
    `SELECT plan_key, status, activated_at, trial_ends_at, current_period_ends_at, ends_at
     FROM subscriptions WHERE creator_id = ? LIMIT 1`,
    [creatorId]
  );
  const subscription = rows?.[0];
  if (!subscription) return false;
  if (!["active", "trial"].includes(subscription.status)) return false;

  const end = asTime(subscription.trial_ends_at)
    || asTime(subscription.current_period_ends_at)
    || asTime(subscription.ends_at);
  if (end) return Date.now() <= end;

  if (subscription.plan_key === "early_access") {
    const activated = asTime(subscription.activated_at);
    return Boolean(activated && Date.now() <= activated + 7 * 24 * 60 * 60 * 1000);
  }
  return true;
}

export async function authorizeCreatorRead(req: Request, creatorId: string, isPublicLookup: boolean) {
  if (isPublicLookup) {
    return (await isCreatorPublic(creatorId))
      ? null
      : NextResponse.json({ error: "Creator profile is private" }, { status: 404 });
  }

  if (await isAuthorizedAdmin(req)) {
    return null;
  }

  const auth = await requireCreator(req);
  if (auth.error) return auth.error;
  const target = (creatorId || "").toLowerCase();
  return (auth.creator.id.toLowerCase() === target || auth.creator.email.toLowerCase() === target)
    ? null
    : NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
