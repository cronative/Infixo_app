import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { ensureCreatorSetupTable } from "@/lib/creatorSetupDb";
import { saveBase64ImageToStorage } from "@/lib/imageStorage";
import { requireCreator } from "@/lib/creatorAuth";
import { authorizeCreatorRead } from "@/lib/creatorReadAccess";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { sanitizeUrl } from "@/lib/urlSanitizer";
import { getCreatorPlanKey, limitReachedError } from "@/lib/planServer";
import { getPlanLimit } from "@/config/plans";

interface CreatorIdRow extends RowDataPacket {
  id: string;
}

interface CreatorSetupRow extends RowDataPacket {
  id: string;
  creatorId: string;
  category: string;
  name: string;
  brand: string | null;
  modelOrPlan: string | null;
  usingSince: string | null;
  usedFor: string | null;
  note: string | null;
  whyLoveIt: string | null;
  budgetAlt: string | null;
  isAffiliate: number | boolean | null;
  linkUrl: string | null;
  imageUrl: string | null;
  sortOrder: number | null;
  isActive: number | boolean | null;
  createdAt: string;
  updatedAt: string;
}

interface SetupItemPayload {
  id?: string;
  category?: string;
  name?: string;
  brand?: string;
  modelOrPlan?: string;
  usingSince?: string;
  usedFor?: string;
  note?: string;
  whyLoveIt?: string;
  budgetAlt?: string;
  isAffiliate?: boolean;
  linkUrl?: string;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

interface SetupPostBody extends SetupItemPayload {
  email?: string;
  creatorId?: string;
  action?: string;
  item?: SetupItemPayload;
  items?: Array<{ id?: string }>;
  whereIStarted?: string;
}

function getErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Unexpected server error";
}

async function resolveCreatorId(lookupVal: string): Promise<string | null> {
  if (!lookupVal) return null;
  try {
    const clean = lookupVal.trim().replace(/^@/, "").toLowerCase();
    const [rows] = await db.query<CreatorIdRow[]>(
      "SELECT id FROM creators WHERE id = ? OR LOWER(email) = LOWER(?) OR username = ? OR LOWER(username) = ? OR LOWER(username) = ? LIMIT 1",
      [lookupVal, lookupVal, lookupVal, clean, `@${clean}`]
    );
    return rows?.[0]?.id || null;
  } catch {
    return null;
  }
}

// GET /api/creator/setup?creatorId=... or ?email=... or ?username=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lookupVal = searchParams.get("creatorId") || searchParams.get("email") || searchParams.get("username");

    if (!lookupVal) {
      return apiSuccess({ items: [] }, "No creator lookup provided");
    }

    await ensureCreatorSetupTable();

    const creatorId = await resolveCreatorId(lookupVal);
    const targetId = creatorId || lookupVal;
    const accessError = await authorizeCreatorRead(req, targetId, Boolean(searchParams.get("username")));
    if (accessError) return accessError;

    const cleanLookup = lookupVal.trim().replace(/^@/, "");
    const possibleIds = Array.from(
      new Set([targetId, creatorId, lookupVal, cleanLookup, `@${cleanLookup}`].filter(Boolean) as string[])
    );

    const [rows] = await db.query<CreatorSetupRow[]>(
      `SELECT id, creator_id AS creatorId, category, item_name AS name, brand,
              model_or_plan AS modelOrPlan, using_since AS usingSince, used_for AS usedFor,
              note, why_love_it AS whyLoveIt, budget_alt AS budgetAlt, is_affiliate AS isAffiliate,
              link_url AS linkUrl, image_url AS imageUrl, sort_order AS sortOrder,
              is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt
       FROM creator_setup_items
       WHERE creator_id IN (?)
       ORDER BY sort_order ASC, created_at ASC`,
      [possibleIds]
    );

    let whereIStarted: string | null = null;
    try {
      const [settingsRows]: any = await db.query(
        "SELECT where_i_started FROM creator_setup_settings WHERE creator_id IN (?) LIMIT 1",
        [possibleIds]
      );
      if (settingsRows && settingsRows[0]) {
        whereIStarted = settingsRows[0].where_i_started || null;
      }
    } catch {}

    const items = rows.map((item) => ({
      ...item,
      brand: item.brand || "",
      modelOrPlan: item.modelOrPlan || item.usingSince || "",
      usingSince: item.usingSince || item.modelOrPlan || "",
      usedFor: item.usedFor || "",
      note: item.note || "",
      whyLoveIt: item.whyLoveIt || item.note || item.usedFor || "",
      budgetAlt: item.budgetAlt || "",
      isAffiliate: Boolean(item.isAffiliate),
      linkUrl: sanitizeUrl(item.linkUrl, { allowEmpty: true }) || "",
      imageUrl: item.imageUrl || null,
      sortOrder: Number(item.sortOrder || 0),
      isActive: Boolean(item.isActive),
    }));

    // Public profile: gear items beyond the plan limit are hidden (kept in the dashboard).
    if (searchParams.get("username")) {
      items.splice(getPlanLimit(await getCreatorPlanKey(targetId), "gearItems"));
    }

    return apiSuccess({ items, settings: { whereIStarted } }, "Setup items retrieved successfully");
  } catch (err: unknown) {
    console.error("GET creator setup error:", err);
    return apiError(getErrorMessage(err), 500);
  }
}

// POST /api/creator/setup (Add/Update/Reorder setup items, save intro)
export async function POST(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const body = (await req.json()) as SetupPostBody;
    const { action, item, items, whereIStarted } = body;

    await ensureCreatorSetupTable();

    const targetId = auth.creator.id;

    if (action === "save_intro" || (whereIStarted !== undefined && action === undefined && !item && !body.name)) {
      const cleanIntro = (whereIStarted || "").trim().slice(0, 150);
      await db.query(
        `INSERT INTO creator_setup_settings (creator_id, where_i_started)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE where_i_started = VALUES(where_i_started), updated_at = NOW()`,
        [targetId, cleanIntro || null]
      );
      return apiSuccess({ whereIStarted: cleanIntro }, "Setup intro saved");
    }

    if (action === "toggle_active" && body.id) {
      await db.query(
        "UPDATE creator_setup_items SET is_active = NOT is_active WHERE id = ? AND creator_id = ?",
        [body.id, targetId]
      );
      return apiSuccess({}, "Setup item visibility toggled");
    }

    if (action === "delete" && body.id) {
      await db.query("DELETE FROM creator_setup_items WHERE id = ? AND creator_id = ?", [body.id, targetId]);
      return apiSuccess({}, "Setup item deleted");
    }

    if (action === "reorder" && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        if (items[i]?.id) {
          await db.query(
            "UPDATE creator_setup_items SET sort_order = ? WHERE id = ? AND creator_id = ?",
            [i, items[i].id, targetId]
          );
        }
      }
      return apiSuccess({}, "Setup items reordered");
    }

    const setupItem = item || body;
    if (!setupItem.category?.trim()) {
      return apiError("Category is required", 400);
    }
    if (!setupItem.name?.trim()) {
      return apiError("Name is required", 400);
    }

    const finalImageUrl = await saveBase64ImageToStorage(setupItem.imageUrl, "team", "setup")
      || (typeof setupItem.imageUrl === "string" && !setupItem.imageUrl.startsWith("data:") ? setupItem.imageUrl : null);
    const itemId = setupItem.id || `setup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const [existingRows]: any = await db.query("SELECT id FROM creator_setup_items WHERE creator_id = ?", [targetId]);
    const isNew = !existingRows.some((row: { id: string }) => row.id === itemId);
    if (isNew) {
      const planKey = await getCreatorPlanKey(targetId);
      if (existingRows.length >= getPlanLimit(planKey, "gearItems")) return limitReachedError("gearItems", planKey);
    }

    const cleanWhyLoveIt = (setupItem.whyLoveIt || setupItem.note || setupItem.usedFor || "").trim().slice(0, 120);
    const cleanBudgetAlt = (setupItem.budgetAlt || "").trim().slice(0, 80);
    const cleanUsingSince = (setupItem.usingSince || setupItem.modelOrPlan || "").trim();

    await db.query(
      `INSERT INTO creator_setup_items
       (id, creator_id, category, item_name, brand, model_or_plan, using_since, used_for, note, why_love_it, budget_alt, is_affiliate, link_url, image_url, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         category = VALUES(category),
         item_name = VALUES(item_name),
         brand = VALUES(brand),
         model_or_plan = VALUES(model_or_plan),
         using_since = VALUES(using_since),
         used_for = VALUES(used_for),
         note = VALUES(note),
         why_love_it = VALUES(why_love_it),
         budget_alt = VALUES(budget_alt),
         is_affiliate = VALUES(is_affiliate),
         link_url = VALUES(link_url),
         image_url = VALUES(image_url),
         sort_order = VALUES(sort_order),
         is_active = VALUES(is_active),
         updated_at = NOW()`,
      [
        itemId,
        targetId,
        setupItem.category.trim(),
        setupItem.name.trim(),
        (setupItem.brand || "").trim() || null,
        cleanUsingSince || null,
        cleanUsingSince || null,
        cleanWhyLoveIt || null,
        cleanWhyLoveIt || null,
        cleanWhyLoveIt || null,
        cleanBudgetAlt || null,
        setupItem.isAffiliate ? 1 : 0,
        sanitizeUrl(setupItem.linkUrl) || null,
        finalImageUrl || null,
        Number(setupItem.sortOrder || 0),
        setupItem.isActive !== false ? 1 : 0,
      ]
    );

    return apiSuccess({ itemId }, "Setup item saved");
  } catch (err: unknown) {
    console.error("POST creator setup error:", err);
    return apiError(getErrorMessage(err), 500);
  }
}

// DELETE /api/creator/setup?id=...&creatorId=...
export async function DELETE(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return apiError("ID required", 400);
    }

    await ensureCreatorSetupTable();

    const targetId = auth.creator.id;

    await db.query("DELETE FROM creator_setup_items WHERE id = ? AND creator_id = ?", [id, targetId]);

    return apiSuccess({}, "Setup item removed");
  } catch (err: unknown) {
    console.error("DELETE creator setup error:", err);
    return apiError(getErrorMessage(err), 500);
  }
}
