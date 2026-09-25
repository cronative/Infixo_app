import { getR2Object } from "@/lib/r2Storage";
import { apiError } from "@/lib/apiResponse";

type AssetRouteContext = {
  params: Promise<{
    key?: string[];
  }>;
};

export async function GET(_req: Request, context: AssetRouteContext) {
  const { key = [] } = await context.params;
  const objectKey = key.join("/");

  if (!objectKey || objectKey.includes("..")) {
    return apiError("Invalid asset path", 400);
  }

  try {
    const objectResponse = await getR2Object(objectKey);
    if (!objectResponse) {
      return apiError("Asset not found", 404);
    }

    const contentType = objectResponse.headers.get("content-type") || "application/octet-stream";
    const cacheControl = objectResponse.headers.get("cache-control") || "public, max-age=31536000, immutable";

    return new Response(objectResponse.body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": cacheControl,
      },
    });
  } catch (err) {
    console.error("R2 asset proxy error:", err);
    return apiError("Unable to load asset", 500);
  }
}
