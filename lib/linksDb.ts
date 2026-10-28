import { randomUUID } from "crypto";
import sharp from "sharp";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { saveImageBufferToStorage } from "@/lib/imageStorage";
import { getPlatformFromUrl } from "@/lib/linkIcons";
import { readLimitedBody, safeFetch } from "@/lib/safeFetch";
import { getPlanQuota } from "@/services/subscriptionLimits";

export const MAX_LINK_TITLE = 60;
export const MAX_GROUP_CHILDREN = 10;

export interface LinkChild { id: string; title: string; url: string; iconUrl: string | null }
export interface LinkItem {
  id: string;
  kind: "link" | "group";
  title: string;
  url: string;
  pinned: boolean;
  iconUrl: string | null;
  position: number;
  children: LinkChild[];
}

export class LinkValidationError extends Error {
  constructor(message: string, public code = "VALIDATION_ERROR", public status = 400) { super(message); }
}

type LinkRow = RowDataPacket & {
  id: string;
  parentId: string | null;
  linkType: string | null;
  title: string;
  url: string | null;
  iconUrl: string | null;
  isPinned: number | null;
  sortOrder: number | null;
};

let columnsEnsured = false;

/** Adds the columns this feature needs to older databases (same pattern as the legacy custom-links route). */
export async function ensureLinkColumns() {
  if (columnsEnsured) return;
  const [cols] = await db.query<(RowDataPacket & { Field: string })[]>("SHOW COLUMNS FROM creator_custom_links");
  const existing = new Set(cols.map((col) => col.Field));
  if (!existing.has("is_pinned")) await db.query("ALTER TABLE creator_custom_links ADD COLUMN is_pinned TINYINT(1) NOT NULL DEFAULT 0");
  if (!existing.has("icon_url")) await db.query("ALTER TABLE creator_custom_links ADD COLUMN icon_url VARCHAR(1000) DEFAULT NULL");
  columnsEnsured = true;
}

const LINK_COLUMNS = "id, parent_id AS parentId, link_type AS linkType, title, url, icon_url AS iconUrl, is_pinned AS isPinned, sort_order AS sortOrder";

/** Top-level links in `position` order (sort_order), groups with their children. Shared by dashboard and public profile. */
export async function listLinks(creatorId: string): Promise<LinkItem[]> {
  await ensureLinkColumns();
  const [rows] = await db.query<LinkRow[]>(
    `SELECT ${LINK_COLUMNS} FROM creator_custom_links WHERE creator_id = ? ORDER BY sort_order ASC, created_at ASC, id ASC`,
    [creatorId],
  );
  const children = new Map<string, LinkChild[]>();
  for (const row of rows) {
    if (!row.parentId) continue;
    const list = children.get(row.parentId) || [];
    list.push({ id: row.id, title: row.title, url: row.url || "", iconUrl: row.iconUrl || null });
    children.set(row.parentId, list);
  }
  return rows
    .filter((row) => !row.parentId)
    .map((row, index) => {
      const isGroup = row.linkType === "collection";
      return {
        id: row.id,
        kind: isGroup ? "group" : "link",
        title: row.title,
        url: isGroup ? "" : row.url || "",
        pinned: !isGroup && Boolean(row.isPinned),
        iconUrl: row.iconUrl || null,
        position: index,
        children: isGroup ? children.get(row.id) || [] : [],
      };
    });
}

export async function getLinkQuota(creatorId: string) {
  const [subRows] = await db.query<(RowDataPacket & { plan_key: string })[]>(
    "SELECT plan_key FROM subscriptions WHERE creator_id = ? AND status = 'active' ORDER BY updated_at DESC LIMIT 1",
    [creatorId],
  );
  const plan = subRows[0]?.plan_key || "starter";
  const [countRows] = await db.query<(RowDataPacket & { count: number })[]>(
    "SELECT COUNT(*) AS count FROM creator_custom_links WHERE creator_id = ? AND parent_id IS NULL",
    [creatorId],
  );
  const quota = getPlanQuota(plan);
  return { plan, planName: quota.name, used: Number(countRows[0]?.count || 0), limit: quota.maxCustomLinks };
}

export function validateLinkId(value: unknown): string {
  if (typeof value !== "string" || !/^[\w-]{1,100}$/.test(value)) throw new LinkValidationError("Invalid link ID.", "INVALID_ID");
  return value;
}

function validateTitle(value: unknown, label = "Title"): string {
  const title = typeof value === "string" ? value.trim() : "";
  if (!title) throw new LinkValidationError(`${label} is required.`, "INVALID_TITLE");
  if (title.length > MAX_LINK_TITLE) throw new LinkValidationError(`${label} must be ${MAX_LINK_TITLE} characters or fewer.`, "INVALID_TITLE");
  return title;
}

function validateUrl(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) throw new LinkValidationError("URL is required.", "INVALID_URL");
  if (/^(javascript|data|vbscript|file):/i.test(raw.replace(/\s+/g, ""))) {
    throw new LinkValidationError("This kind of link isn't allowed.", "INVALID_URL");
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new LinkValidationError("Enter a valid https link.", "INVALID_URL");
  }
  if (url.protocol !== "https:" || !url.hostname.includes(".") || raw.length > 1000) {
    throw new LinkValidationError("Links must start with https://", "INVALID_URL");
  }
  return raw;
}

export interface LinkInput {
  kind: "link" | "group";
  title: string;
  url: string;
  pinned: boolean;
  children: { id?: string; title: string; url: string }[];
}

export function validateLinkInput(value: unknown): LinkInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new LinkValidationError("Invalid link details.");
  const body = value as Record<string, unknown>;
  const kind = body.kind === "group" ? "group" : body.kind === "link" ? "link" : null;
  if (!kind) throw new LinkValidationError("kind must be \"link\" or \"group\".", "INVALID_KIND");

  if (kind === "link") {
    return { kind, title: validateTitle(body.title), url: validateUrl(body.url), pinned: body.pinned === true, children: [] };
  }

  const rawChildren = Array.isArray(body.children) ? body.children : [];
  if (rawChildren.length < 1 || rawChildren.length > MAX_GROUP_CHILDREN) {
    throw new LinkValidationError(`A group needs 1 to ${MAX_GROUP_CHILDREN} links.`, "INVALID_CHILDREN");
  }
  const children = rawChildren.map((child, index) => {
    const item = (child && typeof child === "object" ? child : {}) as Record<string, unknown>;
    return {
      id: typeof item.id === "string" && /^[\w-]{1,100}$/.test(item.id) ? item.id : undefined,
      title: validateTitle(item.title, `Link ${index + 1} title`),
      url: validateUrl(item.url),
    };
  });
  return { kind, title: validateTitle(body.title, "Group title"), url: "", pinned: false, children };
}

export const newLinkId = () => `link_${randomUUID()}`;

/**
 * Favicon for a link as a 64px PNG: <link rel=icon>, then /favicon.ico, then Google's s2 service.
 * Known platforms return null (the UI shows their brand icon), as does a site with no usable icon.
 */
export async function findLinkIconPng(rawUrl: string): Promise<Buffer | null> {
  if (getPlatformFromUrl(rawUrl).isKnownApp) return null;
  let page: URL;
  try {
    page = new URL(rawUrl);
  } catch {
    return null;
  }

  const candidates: string[] = [];
  try {
    const res = await safeFetch(page.toString(), { headers: { "User-Agent": "Mozilla/5.0 (compatible; InflixoBot/1.0)", Accept: "text/html" }, timeoutMs: 5000 });
    if (res.ok && (res.headers.get("content-type") || "").includes("html")) {
      const html = (await readLimitedBody(res, 512 * 1024, { truncate: true })).toString("utf8");
      for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
        const rel = tag.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase() || "";
        const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
        if (href && /(^|\s)(icon|apple-touch-icon)(\s|$)/.test(rel)) {
          try { candidates.push(new URL(href, res.url || page).toString()); } catch {}
        }
      }
    }
  } catch {}
  candidates.push(`${page.origin}/favicon.ico`);
  candidates.push(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(page.hostname)}&sz=64`);

  for (const candidate of candidates) {
    try {
      const res = await safeFetch(candidate.replace(/^http:/, "https:"), { headers: { Accept: "image/*" }, timeoutMs: 5000 });
      if (!res.ok) continue;
      return await sharp(await readLimitedBody(res, 1024 * 1024))
        .resize(64, 64, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    } catch {
      // .ico files sharp can't decode and broken images fall through to the next candidate.
    }
  }
  return null;
}

/** Finds a link's favicon and stores it in our storage; returns its URL or null. */
export async function resolveLinkIcon(rawUrl: string): Promise<string | null> {
  const png = await findLinkIconPng(rawUrl);
  if (!png) return null;
  return saveImageBufferToStorage(png, "links", "favicon", "png", "image/png").catch(() => null);
}

/** Resolves icons for several URLs, fetching each hostname only once. */
export async function resolveLinkIcons(urls: string[]): Promise<(string | null)[]> {
  const byHost = new Map<string, Promise<string | null>>();
  return Promise.all(urls.map((url) => {
    let host = url;
    try { host = new URL(url).hostname; } catch {}
    if (!byHost.has(host)) byHost.set(host, resolveLinkIcon(url));
    return byHost.get(host)!;
  }));
}

type Connection = Awaited<ReturnType<typeof db.getConnection>>;

export async function withTransaction<T>(fn: (connection: Connection) => Promise<T>): Promise<T> {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const result = await fn(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
}

/** Inserts a group's children (positions 0..n) with their icons. */
export async function insertChildren(
  connection: Connection,
  creator: { id: string; email: string },
  parentId: string,
  children: { id: string; title: string; url: string; iconUrl: string | null }[],
) {
  for (const [index, child] of children.entries()) {
    await connection.query(
      `INSERT INTO creator_custom_links (id, creator_id, email, parent_id, link_type, title, url, icon, icon_url, is_enabled, is_pinned, sort_order)
       VALUES (?, ?, ?, ?, 'collection_item', ?, ?, 'link', ?, 1, 0, ?)`,
      [child.id, creator.id, creator.email, parentId, child.title, child.url, child.iconUrl, index],
    );
  }
}

/** Rows that need a favicon: missing, or saved under the old duplicated "uploads/uploads/" path. */
const needsIcon = (iconUrl: string | null) => !iconUrl || iconUrl.includes("uploads/uploads/");
const ICON_RETRY_MS = 24 * 60 * 60 * 1000;
const iconAttempts = new Map<string, number>();

/**
 * Fetches and stores favicons for the given link rows (same logic as on save) and saves icon_url.
 * Known platforms are skipped. In-process attempts are throttled to once a day per row.
 */
export async function backfillLinkIcons(rows: { id: string; url: string; iconUrl: string | null }[]): Promise<number> {
  const now = Date.now();
  const pending = rows.filter((row) =>
    row.url && needsIcon(row.iconUrl) && !getPlatformFromUrl(row.url).isKnownApp
    && now - (iconAttempts.get(row.id) || 0) > ICON_RETRY_MS);
  if (!pending.length) return 0;
  pending.forEach((row) => iconAttempts.set(row.id, now));

  const icons = await resolveLinkIcons(pending.map((row) => row.url));
  let updated = 0;
  for (const [index, row] of pending.entries()) {
    if (!icons[index]) continue;
    await db.query(
      "UPDATE creator_custom_links SET icon_url = ? WHERE id = ? AND url = ? AND (icon_url IS NULL OR icon_url LIKE '%uploads/uploads/%')",
      [icons[index], row.id, row.url],
    );
    updated++;
  }
  return updated;
}

/** Flattens listLinks() output into the rows backfillLinkIcons() expects. */
export function linkIconRows(items: LinkItem[]) {
  return items.flatMap((item) => item.kind === "group"
    ? item.children.map((child) => ({ id: child.id, url: child.url, iconUrl: child.iconUrl }))
    : [{ id: item.id, url: item.url, iconUrl: item.iconUrl }]);
}
