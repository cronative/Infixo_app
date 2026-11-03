import { requireCreator } from "@/lib/creatorAuth";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { buildDashboardSummary } from "@/lib/dashboardSummary";

// GET /api/dashboard/summary — everything the dashboard home needs in one call (7-day window).
export async function GET(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const summary = await buildDashboardSummary(auth.creator.id);
    return apiSuccess(summary, "Dashboard summary loaded", { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Dashboard summary unavailable", error);
    return apiError("Could not load dashboard", 500);
  }
}
