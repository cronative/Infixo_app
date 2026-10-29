import { requireCreator } from "@/lib/creatorAuth";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { clearEraCelebration } from "@/lib/creatorEraDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    await clearEraCelebration(auth.creator.id);
    return apiSuccess({ cleared: true }, "Era celebration marked as seen");
  } catch (err: any) {
    console.error("POST /api/creator/era/celebrate failed:", err);
    return apiError(err.message || "Failed to clear celebration flag", 500);
  }
}
