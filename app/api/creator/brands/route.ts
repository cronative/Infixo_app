import { db } from "@/lib/db";
import { ensureBrandsTable } from "@/lib/brandsDb";
import { saveBase64ImageToStorage } from "@/lib/imageStorage";
import { requireCreator } from "@/lib/creatorAuth";
import { authorizeCreatorRead } from "@/lib/creatorReadAccess";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { sanitizeUrl } from "@/lib/urlSanitizer";

async function resolveCreatorId(lookupVal: string): Promise<{ id: string; email: string } | null> {
  if (!lookupVal) return null;
  try {
    const [rows]: any = await db.query(
      "SELECT id, email FROM creators WHERE id = ? OR email = ? OR username = ? LIMIT 1",
      [lookupVal, lookupVal, lookupVal]
    );
    if (rows && rows.length > 0) {
      return { id: rows[0].id, email: rows[0].email };
    }
  } catch {}
  return null;
}

// GET /api/creator/brands?creatorId=... or ?email=... or ?username=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lookupVal = searchParams.get("creatorId") || searchParams.get("email") || searchParams.get("username");

    if (!lookupVal) {
      return apiSuccess({ brands: [] }, "No creator lookup provided");
    }

    await ensureBrandsTable();

    const creator = await resolveCreatorId(lookupVal);
    const targetId = creator ? creator.id : lookupVal;
    const accessError = await authorizeCreatorRead(req, targetId, Boolean(searchParams.get("username")));
    if (accessError) return accessError;

    const [rows]: any = await db.query(
      `SELECT id, creator_id AS creatorId, brand_name AS brandName, brand_logo_url AS brandLogoUrl, instagram_url AS instagramUrl, youtube_url AS youtubeUrl, facebook_url AS facebookUrl, website_url AS websiteUrl, sort_order AS sortOrder, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt
       FROM creator_brands
       WHERE creator_id = ?
       ORDER BY sort_order ASC, created_at ASC`,
      [targetId]
    );

    const brands = (rows || []).map((b: any) => ({
      id: b.id,
      creatorId: b.creatorId,
      brandName: b.brandName,
      brandLogoUrl: b.brandLogoUrl || null,
      instagramUrl: sanitizeUrl(b.instagramUrl, { allowEmpty: true }) || "",
      youtubeUrl: sanitizeUrl(b.youtubeUrl, { allowEmpty: true }) || "",
      facebookUrl: sanitizeUrl(b.facebookUrl, { allowEmpty: true }) || "",
      websiteUrl: sanitizeUrl(b.websiteUrl, { allowEmpty: true }) || "",
      sortOrder: Number(b.sortOrder || 0),
      isActive: Boolean(b.isActive),
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));

    return apiSuccess({ brands }, "Brands retrieved successfully");
  } catch (err: any) {
    console.error("GET brands error:", err);
    return apiError(err.message || "Failed to retrieve brands", 500);
  }
}

// POST /api/creator/brands (Add/Update or Reorder Brand)
export async function POST(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const body = await req.json();
    const { action, brand, brands } = body;

    await ensureBrandsTable();

    const targetId = auth.creator.id;

    if (action === "reorder" && Array.isArray(brands)) {
      for (let i = 0; i < brands.length; i++) {
        const item = brands[i];
        if (item.id) {
          await db.query(
            "UPDATE creator_brands SET sort_order = ? WHERE id = ? AND creator_id = ?",
            [i, item.id, targetId]
          );
        }
      }
      return apiSuccess({}, "Brands reordered");
    }

    const b = brand || body;
    if (!b.brandName || !b.brandName.trim()) {
      return apiError("Brand name is required", 400);
    }

    const finalLogoUrl = await saveBase64ImageToStorage(b.brandLogoUrl, "brands", "brand") || (b.brandLogoUrl && !b.brandLogoUrl.startsWith("data:") ? b.brandLogoUrl : null);
    const brandId = b.id || `br_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.query(
      `INSERT INTO creator_brands (id, creator_id, brand_name, brand_logo_url, instagram_url, youtube_url, facebook_url, website_url, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         brand_name = VALUES(brand_name),
         brand_logo_url = VALUES(brand_logo_url),
         instagram_url = VALUES(instagram_url),
         youtube_url = VALUES(youtube_url),
         facebook_url = VALUES(facebook_url),
         website_url = VALUES(website_url),
         sort_order = VALUES(sort_order),
         is_active = VALUES(is_active),
         updated_at = NOW()`,
      [
        brandId,
        targetId,
        b.brandName.trim(),
        finalLogoUrl || null,
        sanitizeUrl(b.instagramUrl) || null,
        sanitizeUrl(b.youtubeUrl) || null,
        sanitizeUrl(b.facebookUrl) || null,
        sanitizeUrl(b.websiteUrl) || null,
        Number(b.sortOrder || 0),
        b.isActive !== false ? 1 : 0,
      ]
    );

    return apiSuccess({ brandId }, "Brand saved successfully");
  } catch (err: any) {
    console.error("POST brand error:", err);
    return apiError(err.message || "Failed to save brand", 500);
  }
}

// DELETE /api/creator/brands?id=...&creatorId=...
export async function DELETE(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return apiError("ID required", 400);
    }

    await ensureBrandsTable();

    const targetId = auth.creator.id;

    await db.query("DELETE FROM creator_brands WHERE id = ? AND creator_id = ?", [id, targetId]);

    return apiSuccess({}, "Brand removed");
  } catch (err: any) {
    console.error("DELETE brand error:", err);
    return apiError(err.message || "Failed to delete brand", 500);
  }
}
