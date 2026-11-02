import { readLimitedBody, safeFetch } from "@/lib/safeFetch";

/** Product details scraped from a store page. Fields we can't find are null, never a placeholder. */
export interface ProductPreview {
  name: string | null;
  image: string | null;
  price: number | null;
  store: string | null;
}

const MAX_HTML_BYTES = 4 * 1024 * 1024;
const MAX_PRICE_RUPEES = 10_000_000;
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
  "Sec-Ch-Ua": '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"macOS"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Upgrade-Insecure-Requests": "1",
};

const NAMED_ENTITIES: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };

function decodeEntities(text: string) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

function clean(text: string | undefined | null) {
  return text ? decodeEntities(text).replace(/\s+/g, " ").trim() : "";
}

function parseAttributes(tag: string) {
  const attrs: Record<string, string> = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? "";
  }
  return attrs;
}

/** All <meta> tags keyed by property / name / itemprop (first occurrence wins). */
function readMeta(html: string) {
  const meta: Record<string, string> = {};
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = parseAttributes(tag);
    const key = (attrs.property || attrs.name || attrs.itemprop || "").toLowerCase();
    if (key && attrs.content && !(key in meta)) meta[key] = attrs.content;
  }
  return meta;
}

function toRupees(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(num) || num < 0) return null;
  const rounded = Math.round(num);
  return rounded <= MAX_PRICE_RUPEES ? rounded : null;
}

function isProductNode(node: Record<string, unknown>) {
  const type = node["@type"];
  return Array.isArray(type) ? type.includes("Product") : type === "Product";
}

/** Walks JSON-LD (arrays, @graph) for a Product and returns offers.price / offers.lowPrice. */
function jsonLdPrice(html: string): number | null {
  const blocks = html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const [, content] of blocks) {
    let parsed: unknown;
    try { parsed = JSON.parse(content.trim()); } catch { continue; }
    const queue: unknown[] = [parsed];
    while (queue.length) {
      const node = queue.shift();
      if (Array.isArray(node)) { queue.push(...node); continue; }
      if (!node || typeof node !== "object") continue;
      const obj = node as Record<string, unknown>;
      if (isProductNode(obj) && obj.offers) {
        const offers = Array.isArray(obj.offers) ? obj.offers : [obj.offers];
        for (const offer of offers as Record<string, unknown>[]) {
          const price = toRupees(offer?.price ?? offer?.lowPrice);
          if (price !== null) return price;
        }
      }
      if (obj["@graph"]) queue.push(obj["@graph"]);
    }
  }
  return null;
}

function absoluteHttpsUrl(raw: string, base: string): string | null {
  try {
    const url = new URL(raw.trim(), base);
    if (url.protocol === "http:") url.protocol = "https:";
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function storeFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

export function extractProductPreview(html: string, pageUrl: string): ProductPreview {
  const meta = readMeta(html);
  const store = storeFromUrl(pageUrl);

  const amazonProductTitle = html.match(/<span\b[^>]*id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i)?.[1];
  let name = clean(amazonProductTitle || meta["og:title"] || meta["twitter:title"] || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
  // Strip common Amazon title prefixes/suffixes
  name = name.replace(/^Amazon\.in\s*:\s*Buy\s+/i, "").replace(/\s*:\s*Amazon\.in.*$/i, "").trim();
  // Bot-check / error pages are often titled with just the store name.
  if (name && (
    (store && name.toLowerCase() === store.toLowerCase()) ||
    /^(amazon\.in|amazon\.com|robot check|page not found)$/i.test(name)
  )) {
    name = "";
  }

  // Fallback for Amazon product URLs with a readable slug (/Product-Name-Slug/dp/ASIN) when blocked by CAPTCHA
  if (!name) {
    try {
      const u = new URL(pageUrl);
      const slugMatch = u.pathname.match(/^\/([^/]+)\/(?:dp|gp\/product)\/[A-Z0-9]{10}/i);
      if (slugMatch && slugMatch[1] && slugMatch[1].toLowerCase() !== "gp") {
        name = decodeURIComponent(slugMatch[1]).replace(/[-_]+/g, " ").trim();
      }
    } catch {}
  }

  // Amazon omits og:image; its main product image carries data-old-hires or data-a-dynamic-image.
  const landingImage = html.match(/<img\b[^>]*id=["'](?:landingImage|imgBlkFront)["'][^>]*>/i)?.[0];
  const landingAttrs = landingImage ? parseAttributes(landingImage) : {};
  let dynamicImg = "";
  if (landingAttrs["data-a-dynamic-image"]) {
    const dynMatch = decodeEntities(landingAttrs["data-a-dynamic-image"]).match(/https:\/\/[^"'\s]+/i);
    if (dynMatch) dynamicImg = dynMatch[0];
  }
  const rawImage = meta["og:image:secure_url"] || meta["og:image"] || meta["twitter:image"] || meta["twitter:image:src"]
    || landingAttrs["data-old-hires"] || dynamicImg || landingAttrs.src || "";

  const amazonPriceWhole = html.match(/<span\b[^>]*class=["'][^"']*a-price-whole[^"']*["'][^>]*>([\d,]+)/i)?.[1];
  const price = toRupees(meta["product:price:amount"]) ?? toRupees(meta["og:price:amount"]) ?? jsonLdPrice(html) ?? toRupees(amazonPriceWhole);

  return {
    name: name ? name.slice(0, 80).trim() : null,
    image: rawImage ? absoluteHttpsUrl(clean(rawImage), pageUrl) : null,
    price,
    store,
  };
}

export async function fetchProductPreview(url: string): Promise<ProductPreview> {
  const empty: ProductPreview = { name: null, image: null, price: null, store: storeFromUrl(url) };
  try {
    const res = await safeFetch(url, { headers: BROWSER_HEADERS, timeoutMs: 5000 });
    if (!res.ok) {
      // Even when HTTP status is 503 (e.g. Amazon bot block), extract slug from URL if available
      return extractProductPreview("", url);
    }
    if (!(res.headers.get("content-type") || "text/html").includes("html")) return empty;
    const html = (await readLimitedBody(res, MAX_HTML_BYTES, { truncate: true })).toString("utf8");
    return extractProductPreview(html, url);
  } catch {
    return extractProductPreview("", url);
  }
}
