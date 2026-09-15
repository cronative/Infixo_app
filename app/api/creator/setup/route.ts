import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { ensureCreatorSetupTable } from "@/lib/creatorSetupDb";
import { saveBase64ImageToStorage } from "@/lib/imageStorage";

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
  usedFor: string | null;
  note: string | null;
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
  usedFor?: string;
  note?: string;
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
      return NextResponse.json({ success: true, items: [] });
    }

    await ensureCreatorSetupTable();

    const creatorId = await resolveCreatorId(lookupVal);
    const targetId = creatorId || lookupVal;

    const [rows] = await db.query<CreatorSetupRow[]>(
      `SELECT id, creator_id AS creatorId, category, item_name AS name, brand,
              model_or_plan AS modelOrPlan, used_for AS usedFor, note, link_url AS linkUrl,
              image_url AS imageUrl, sort_order AS sortOrder, is_active AS isActive,
              created_at AS createdAt, updated_at AS updatedAt
       FROM creator_setup_items
       WHERE creator_id = ?
       ORDER BY sort_order ASC, created_at ASC`,
      [targetId]
    );

    const items = rows.map((item) => ({
      ...item,
      brand: item.brand || "",
      modelOrPlan: item.modelOrPlan || "",
      usedFor: item.usedFor || "",
      note: item.note || "",
      linkUrl: item.linkUrl || "",
      imageUrl: item.imageUrl || null,
      sortOrder: Number(item.sortOrder || 0),
      isActive: Boolean(item.isActive),
    }));

    return NextResponse.json({ success: true, items });
  } catch (err: unknown) {
    console.error("GET creator setup error:", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

// POST /api/creator/setup (Add/Update/Reorder setup items)
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SetupPostBody;
    const { email, creatorId: passedCreatorId, action, item, items } = body;

    const lookupVal = passedCreatorId || email;
    if (!lookupVal) {
      return NextResponse.json({ error: "Creator identifier required" }, { status: 400 });
    }

    await ensureCreatorSetupTable();

    const creatorId = await resolveCreatorId(lookupVal);
    const targetId = creatorId || lookupVal;

    if (action === "reorder" && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        if (items[i]?.id) {
          await db.query(
            "UPDATE creator_setup_items SET sort_order = ? WHERE id = ? AND creator_id = ?",
            [i, items[i].id, targetId]
          );
        }
      }
      return NextResponse.json({ success: true, message: "Setup items reordered" });
    }

    const setupItem = item || body;
    if (!setupItem.category?.trim()) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }
    if (!setupItem.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const finalImageUrl = await saveBase64ImageToStorage(setupItem.imageUrl, "team", "setup")
      || (typeof setupItem.imageUrl === "string" && !setupItem.imageUrl.startsWith("data:") ? setupItem.imageUrl : null);
    const itemId = setupItem.id || `setup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await db.query(
      `INSERT INTO creator_setup_items
       (id, creator_id, category, item_name, brand, model_or_plan, used_for, note, link_url, image_url, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         category = VALUES(category),
         item_name = VALUES(item_name),
         brand = VALUES(brand),
         model_or_plan = VALUES(model_or_plan),
         used_for = VALUES(used_for),
         note = VALUES(note),
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
        (setupItem.modelOrPlan || "").trim() || null,
        (setupItem.usedFor || "").trim() || null,
        (setupItem.note || "").trim() || null,
        (setupItem.linkUrl || "").trim() || null,
        finalImageUrl || null,
        Number(setupItem.sortOrder || 0),
        setupItem.isActive !== false ? 1 : 0,
      ]
    );

    return NextResponse.json({ success: true, itemId, message: "Setup item saved" });
  } catch (err: unknown) {
    console.error("POST creator setup error:", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

// DELETE /api/creator/setup?id=...&creatorId=...
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const lookupVal = searchParams.get("creatorId") || searchParams.get("email");

    if (!id || !lookupVal) {
      return NextResponse.json({ error: "ID and creator identifier required" }, { status: 400 });
    }

    await ensureCreatorSetupTable();

    const creatorId = await resolveCreatorId(lookupVal);
    const targetId = creatorId || lookupVal;

    await db.query("DELETE FROM creator_setup_items WHERE id = ? AND creator_id = ?", [id, targetId]);

    return NextResponse.json({ success: true, message: "Setup item removed" });
  } catch (err: unknown) {
    console.error("DELETE creator setup error:", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
