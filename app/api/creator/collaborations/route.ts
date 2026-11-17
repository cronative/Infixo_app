import { db } from "@/lib/db";
import { ensureCollaborationsTable } from "@/lib/collaborationsDb";
import { saveBase64ImageToStorage } from "@/lib/imageStorage";
import { requireCreator } from "@/lib/creatorAuth";
import { authorizeCreatorRead } from "@/lib/creatorReadAccess";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { sanitizeUrl } from "@/lib/urlSanitizer";
import { invalidateMediaKitPdfs } from "@/lib/mediakitPdfCache";

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

// GET /api/creator/collaborations?creatorId=... or ?email=... or ?username=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lookupVal = searchParams.get("creatorId") || searchParams.get("email") || searchParams.get("username");

    if (!lookupVal) {
      return apiSuccess({ collaborations: [] }, "Collaborations retrieved successfully");
    }

    await ensureCollaborationsTable();

    const creator = await resolveCreatorId(lookupVal);
    const targetId = creator ? creator.id : lookupVal;
    const accessError = await authorizeCreatorRead(req, targetId, Boolean(searchParams.get("username")));
    if (accessError) return accessError;

    const [rows]: any = await db.query(
      `SELECT id, creator_id AS creatorId, brand_name AS brandName, brand_logo_url AS brandLogoUrl, campaign_title AS campaignTitle, campaign_url AS campaignUrl, description, thumbnail_url AS thumbnailUrl, duration, platform, sort_order AS sortOrder, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt
       FROM creator_collaborations
       WHERE creator_id = ?
       ORDER BY sort_order ASC, created_at ASC`,
      [targetId]
    );

    const collaborations = (rows || []).map((c: any) => ({
      id: c.id,
      creatorId: c.creatorId,
      brandName: c.brandName,
      brandLogoUrl: c.brandLogoUrl || null,
      campaignTitle: c.campaignTitle || "",
      campaignUrl: sanitizeUrl(c.campaignUrl, { allowEmpty: true }) || "",
      description: c.description || "",
      thumbnailUrl: c.thumbnailUrl || null,
      duration: c.duration || "",
      platform: c.platform || undefined,
      sortOrder: Number(c.sortOrder || 0),
      isActive: Boolean(c.isActive),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return apiSuccess({ collaborations }, "Collaborations retrieved successfully");
  } catch (err: any) {
    console.error("GET collaborations error:", err);
    return apiError(err.message || "Failed to fetch collaborations", 500);
  }
}

// POST /api/creator/collaborations (Add/Update or Reorder Collaboration)
export async function POST(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const body = await req.json();
    const { action, collaboration, collaborations } = body;

    await ensureCollaborationsTable();

    const targetId = auth.creator.id;

    if (action === "reorder" && Array.isArray(collaborations)) {
      for (let i = 0; i < collaborations.length; i++) {
        const item = collaborations[i];
        if (item.id) {
          await db.query(
            "UPDATE creator_collaborations SET sort_order = ? WHERE id = ? AND creator_id = ?",
            [i, item.id, targetId]
          );
        }
      }
      return apiSuccess({ collaborations }, "Collaborations reordered successfully");
    }

    const c = collaboration || body;
    if (!c.brandName || !c.brandName.trim()) {
      return apiError("Brand name is required", 400);
    }

    const finalLogoUrl = await saveBase64ImageToStorage(c.brandLogoUrl, "collaborations", "collab_logo") || (c.brandLogoUrl && !c.brandLogoUrl.startsWith("data:") ? c.brandLogoUrl : null);
    const finalThumbUrl = await saveBase64ImageToStorage(c.thumbnailUrl, "collaborations", "collab_thumb") || (c.thumbnailUrl && !c.thumbnailUrl.startsWith("data:") ? c.thumbnailUrl : null);
    const duration = /^\d{1,2}:\d{2}(:\d{2})?$/.test(String(c.duration || "").trim()) ? String(c.duration).trim() : null;
    const platform = ["instagram", "youtube", "facebook", "other"].includes(c.platform) ? c.platform : null;
    const collabId = c.id || `collab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    // An id that belongs to another creator must not be overwritten.
    if (c.id) {
      const [owner]: any = await db.query("SELECT creator_id FROM creator_collaborations WHERE id = ? LIMIT 1", [c.id]);
      if (owner?.[0] && owner[0].creator_id !== targetId) return apiError("Not allowed", 403);
    }
    await db.query(
      `INSERT INTO creator_collaborations (id, creator_id, brand_name, brand_logo_url, campaign_title, campaign_url, description, thumbnail_url, duration, platform, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         brand_name = VALUES(brand_name),
         brand_logo_url = VALUES(brand_logo_url),
         campaign_title = VALUES(campaign_title),
         campaign_url = VALUES(campaign_url),
         description = VALUES(description),
         thumbnail_url = VALUES(thumbnail_url),
         duration = VALUES(duration),
         platform = VALUES(platform),
         sort_order = VALUES(sort_order),
         is_active = VALUES(is_active),
         updated_at = NOW()`,
      [
        collabId,
        targetId,
        c.brandName.trim().slice(0, 150),
        finalLogoUrl || null,
        (c.campaignTitle || "").trim().slice(0, 255) || null,
        sanitizeUrl(c.campaignUrl) || null,
        (c.description || "").trim().slice(0, 1000) || null,
        finalThumbUrl || null,
        duration,
        platform,
        Number(c.sortOrder || 0),
        c.isActive !== false ? 1 : 0,
      ]
    );

    invalidateMediaKitPdfs();
    return apiSuccess({ collabId }, "Collaboration saved successfully");
  } catch (err: any) {
    console.error("POST collaboration error:", err);
    return apiError(err.message || "Failed to save collaboration", 500);
  }
}

// DELETE /api/creator/collaborations?id=...&creatorId=...
export async function DELETE(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return apiError("ID required", 400);
    }

    await ensureCollaborationsTable();

    const targetId = auth.creator.id;

    await db.query("DELETE FROM creator_collaborations WHERE id = ? AND creator_id = ?", [id, targetId]);

    invalidateMediaKitPdfs();
    return apiSuccess({}, "Collaboration removed successfully");
  } catch (err: any) {
    console.error("DELETE collaboration error:", err);
    return apiError(err.message || "Failed to remove collaboration", 500);
  }
}
