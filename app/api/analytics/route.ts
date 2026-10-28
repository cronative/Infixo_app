import { NextResponse } from "next/server";
import { requireCreator } from "@/lib/creatorAuth";
import { getAnalyticsSummary, parseAnalyticsPeriod } from "@/lib/analyticsSummary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/analytics?period=7d|30d — signed-in creator's own counts.
export async function GET(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const period = parseAnalyticsPeriod(new URL(req.url).searchParams.get("period"));
    const summary = await getAnalyticsSummary(auth.creator.id, period);
    return NextResponse.json(summary, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("GET /api/analytics failed:", error);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Could not load analytics." } }, { status: 500 });
  }
}
