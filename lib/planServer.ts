import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { apiError } from "@/lib/apiResponse";
import { formatLimit, getPlan, type PlanLimits } from "@/config/plans";

/** The creator's active plan key as stored (legacy keys are normalised by config/plans.ts). */
export async function getCreatorPlanKey(creatorId: string): Promise<string> {
  const [rows] = await db.query<(RowDataPacket & { plan_key: string })[]>(
    "SELECT plan_key FROM subscriptions WHERE creator_id = ? AND status = 'active' ORDER BY updated_at DESC LIMIT 1",
    [creatorId],
  );
  return rows[0]?.plan_key || "trial";
}

const LABELS: Record<keyof PlanLimits, string> = {
  series: "series",
  episodesPerSeries: "episodes per series",
  products: "shop products",
  links: "links",
  collabPackages: "collab packages",
  reviews: "brand reviews",
  gearItems: "gear items",
  teamSeats: "team seats",
  socialAccountsPerPlatform: "social accounts per platform",
};

/** Standard 403 when a create would go past the plan limit from config/plans.ts. */
export function limitReachedError(resource: keyof PlanLimits, planKey: string) {
  const plan = getPlan(planKey);
  const limit = plan.limits[resource];
  return apiError(
    `You've used ${formatLimit(limit)} of ${formatLimit(limit)} ${LABELS[resource]} on ${plan.name}. Upgrade your plan to add more.`,
    403,
    { code: "LIMIT_REACHED", isLimitReached: true, type: resource, limit },
  );
}
