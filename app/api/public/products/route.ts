import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { isCreatorPublic } from "@/lib/creatorReadAccess";
import { apiError, apiSuccess } from "@/lib/apiResponse";
import { getCreatorProducts } from "@/lib/productsDb";
import { getPlanQuota } from "@/services/subscriptionLimits";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const username = new URL(req.url).searchParams.get("username")?.trim().replace(/^@/, "").toLowerCase();
    if (!username || username.length > 50) return apiError("A valid creator username is required.", 400);
    const [rows] = await db.query<(RowDataPacket & { id: string })[]>("SELECT id FROM creators WHERE LOWER(username) IN (?, ?) LIMIT 1", [username, `@${username}`]);
    if (!rows[0] || !(await isCreatorPublic(rows[0].id))) return apiError("Creator profile not found.", 404);

    const creatorId = rows[0].id;

    // Fetch creator's active subscription to apply plan product quotas
    const [subRows]: any = await db.query(
      "SELECT plan_key, status FROM subscriptions WHERE creator_id = ? ORDER BY updated_at DESC LIMIT 1",
      [creatorId]
    );
    const planKey = subRows?.[0]?.plan_key || "early_access";
    const quota = getPlanQuota(planKey);

    const allProducts = await getCreatorProducts(creatorId);

    // Enforce plan quota: Starter / Free Trial = 1 (first product shown, others hidden), Pro = 20, VIP = Unlimited
    const products = quota.maxProducts === Infinity
      ? allProducts
      : allProducts.slice(0, quota.maxProducts);

    return apiSuccess({ products }, "Shop loaded.", { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiError("Could not load this Shop. Please try again.", 500);
  }
}
