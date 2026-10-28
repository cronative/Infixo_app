import { requireCreator } from "@/lib/creatorAuth";
import { apiError, apiSuccess } from "@/lib/apiResponse";
import { getCreatorProducts } from "@/lib/productsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Read-only list used by the dashboard summary and preview. Writes live in /api/products.
export async function GET(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    return apiSuccess({ products: await getCreatorProducts(auth.creator.id) }, "Products loaded.", { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("GET /api/creator/products failed:", error);
    return apiError("Could not load products. Please try again.", 500);
  }
}
