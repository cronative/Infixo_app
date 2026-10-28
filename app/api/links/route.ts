import { NextResponse, after } from "next/server";
import type { RowDataPacket } from "mysql2";
import { requireCreator } from "@/lib/creatorAuth";
import { checkPersistentRateLimit } from "@/lib/persistentRateLimit";
import {
  LinkValidationError,
  ensureLinkColumns,
  backfillLinkIcons,
  getLinkQuota,
  insertChildren,
  linkIconRows,
  listLinks,
  newLinkId,
  resolveLinkIcons,
  validateLinkInput,
  withTransaction,
} from "@/lib/linksDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const [items, quota] = await Promise.all([listLinks(auth.creator.id), getLinkQuota(auth.creator.id)]);
    // Links saved before favicons existed: fetch theirs after responding; the next load shows them.
    const backfill = () => backfillLinkIcons(linkIconRows(items)).catch((error) => console.warn("Link icon backfill failed:", error));
    try {
      after(backfill);
    } catch {
      void backfill(); // outside a request scope (scripts/tests)
    }
    return NextResponse.json(
      { items, used: quota.used, limit: Number.isFinite(quota.limit) ? quota.limit : null, plan: quota.plan },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("GET /api/links failed:", error);
    return errorResponse("SERVER_ERROR", "Could not load links.", 500);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const rate = await checkPersistentRateLimit(`links:${auth.creator.id}`, 60, 600);
    if (!rate.success) return errorResponse("RATE_LIMITED", "Too many requests. Please try again shortly.", 429);

    const input = validateLinkInput(await req.json().catch(() => null));
    await ensureLinkColumns();

    const quota = await getLinkQuota(auth.creator.id);
    if (quota.used >= quota.limit) {
      return errorResponse("LIMIT_REACHED", `You've used ${quota.used} of ${quota.limit} ${quota.limit === 1 ? "link" : "links"} on ${quota.planName}.`, 403);
    }

    const urls = input.kind === "link" ? [input.url] : input.children.map((child) => child.url);
    const icons = await resolveLinkIcons(urls);
    const id = newLinkId();

    await withTransaction(async (connection) => {
      const [maxRows] = await connection.query<(RowDataPacket & { maxOrder: number | null })[]>(
        "SELECT MAX(sort_order) AS maxOrder FROM creator_custom_links WHERE creator_id = ? AND parent_id IS NULL",
        [auth.creator.id],
      );
      const position = maxRows[0]?.maxOrder === null || maxRows[0]?.maxOrder === undefined ? 0 : Number(maxRows[0].maxOrder) + 1;
      if (input.pinned) {
        await connection.query("UPDATE creator_custom_links SET is_pinned = 0 WHERE creator_id = ?", [auth.creator.id]);
      }
      await connection.query(
        `INSERT INTO creator_custom_links (id, creator_id, email, parent_id, link_type, title, url, icon, icon_url, is_enabled, is_pinned, sort_order)
         VALUES (?, ?, ?, NULL, ?, ?, ?, 'link', ?, 1, ?, ?)`,
        [id, auth.creator.id, auth.creator.email, input.kind === "group" ? "collection" : "link", input.title, input.url, input.kind === "link" ? icons[0] : null, input.pinned ? 1 : 0, position],
      );
      if (input.kind === "group") {
        await insertChildren(connection, auth.creator, id, input.children.map((child, index) => ({ id: newLinkId(), title: child.title, url: child.url, iconUrl: icons[index] })));
      }
    });

    const created = (await listLinks(auth.creator.id)).find((item) => item.id === id);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof LinkValidationError) return errorResponse(error.code, error.message, error.status);
    console.error("POST /api/links failed:", error);
    return errorResponse("SERVER_ERROR", "Could not add link. Please try again.", 500);
  }
}
