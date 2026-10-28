import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { requireCreator } from "@/lib/creatorAuth";
import { checkPersistentRateLimit } from "@/lib/persistentRateLimit";
import {
  LinkValidationError,
  ensureLinkColumns,
  insertChildren,
  listLinks,
  newLinkId,
  resolveLinkIcons,
  validateLinkId,
  validateLinkInput,
  withTransaction,
} from "@/lib/linksDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };
type ExistingRow = RowDataPacket & { id: string; parentId: string | null; url: string | null; iconUrl: string | null };

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const rate = await checkPersistentRateLimit(`links:${auth.creator.id}`, 60, 600);
    if (!rate.success) return errorResponse("RATE_LIMITED", "Too many requests. Please try again shortly.", 429);

    const id = validateLinkId((await params).id);
    const input = validateLinkInput(await req.json().catch(() => null));
    await ensureLinkColumns();

    // The link itself plus its current children (to keep icons for unchanged URLs).
    const [rows] = await db.query<ExistingRow[]>(
      "SELECT id, parent_id AS parentId, url, icon_url AS iconUrl FROM creator_custom_links WHERE creator_id = ? AND (id = ? OR parent_id = ?)",
      [auth.creator.id, id, id],
    );
    const existing = rows.find((row) => row.id === id && !row.parentId);
    if (!existing) return errorResponse("NOT_FOUND", "Link not found.", 404);
    const knownIcons = new Map(rows.filter((row) => row.iconUrl).map((row) => [row.url || "", row.iconUrl]));

    const urls = input.kind === "link" ? [input.url] : input.children.map((child) => child.url);
    const missing = urls.filter((url) => !knownIcons.has(url));
    const fetched = await resolveLinkIcons(missing);
    missing.forEach((url, index) => knownIcons.set(url, fetched[index]));
    const iconFor = (url: string) => knownIcons.get(url) ?? null;

    await withTransaction(async (connection) => {
      if (input.pinned) {
        await connection.query("UPDATE creator_custom_links SET is_pinned = 0 WHERE creator_id = ? AND id <> ?", [auth.creator.id, id]);
      }
      await connection.query(
        "UPDATE creator_custom_links SET link_type = ?, title = ?, url = ?, icon_url = ?, is_pinned = ? WHERE id = ? AND creator_id = ?",
        [input.kind === "group" ? "collection" : "link", input.title, input.url, input.kind === "link" ? iconFor(input.url) : null, input.pinned ? 1 : 0, id, auth.creator.id],
      );
      await connection.query("DELETE FROM creator_custom_links WHERE creator_id = ? AND parent_id = ?", [auth.creator.id, id]);
      if (input.kind === "group") {
        const ownChildIds = new Set(rows.filter((row) => row.parentId === id).map((row) => row.id));
        await insertChildren(connection, auth.creator, id, input.children.map((child) => ({
          id: child.id && ownChildIds.has(child.id) ? child.id : newLinkId(),
          title: child.title,
          url: child.url,
          iconUrl: iconFor(child.url),
        })));
      }
    });

    const updated = (await listLinks(auth.creator.id)).find((item) => item.id === id);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof LinkValidationError) return errorResponse(error.code, error.message, error.status);
    console.error("PATCH /api/links/:id failed:", error);
    return errorResponse("SERVER_ERROR", "Could not update link. Please try again.", 500);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const id = validateLinkId((await params).id);
    const [result] = await db.query<ResultSetHeader>(
      "DELETE FROM creator_custom_links WHERE creator_id = ? AND (id = ? OR parent_id = ?)",
      [auth.creator.id, id, id],
    );
    if (!result.affectedRows) return errorResponse("NOT_FOUND", "Link not found.", 404);
    return NextResponse.json({ id });
  } catch (error) {
    if (error instanceof LinkValidationError) return errorResponse(error.code, error.message, error.status);
    console.error("DELETE /api/links/:id failed:", error);
    return errorResponse("SERVER_ERROR", "Could not delete link.", 500);
  }
}
