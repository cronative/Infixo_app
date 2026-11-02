import fs from "fs";
import path from "path";
import { getR2Object } from "@/lib/r2Storage";
import { apiError } from "@/lib/apiResponse";

const MIME_BY_EXT: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".avif": "image/avif",
};

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
    // 1. Check local public/uploads directory first (supports runtime uploads in `next start`)
    const relativeUploadKey = objectKey.startsWith("uploads/") ? objectKey : `uploads/${objectKey}`;
    const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
    const localFilePath = path.resolve(process.cwd(), "public", relativeUploadKey);

    if (
      (localFilePath === uploadsRoot || localFilePath.startsWith(uploadsRoot + path.sep)) &&
      fs.existsSync(localFilePath)
    ) {
      const stat = await fs.promises.stat(localFilePath);
      if (stat.isFile()) {
        const fileBuffer = await fs.promises.readFile(localFilePath);
        const ext = path.extname(localFilePath).toLowerCase();
        const contentType = MIME_BY_EXT[ext] || "application/octet-stream";
        return new Response(new Uint8Array(fileBuffer), {
          status: 200,
          headers: {
            "content-type": contentType,
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    // 2. Fallback to R2 object storage if configured
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
    console.error("Asset proxy error:", err);
    return apiError("Unable to load asset", 500);
  }
}
