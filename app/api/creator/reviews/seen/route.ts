import { requireCreator } from "@/lib/creatorAuth";
import { apiError, apiSuccess } from "@/lib/apiResponse";
import { markReviewsSeen } from "@/lib/reviewsDb";

// POST /api/creator/reviews/seen — clears the dashboard "unread brand reviews" count.
export async function POST(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    await markReviewsSeen(auth.creator.id);
    return apiSuccess({}, "Reviews marked as seen");
  } catch (err) {
    console.error("POST /api/creator/reviews/seen failed:", err);
    return apiError("Could not update reviews", 500);
  }
}
