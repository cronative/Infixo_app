import { NextRequest, NextResponse } from "next/server";
import { validateVideoUrl, extractVideoThumbnail } from "@/lib/videoUrl";
import { requireCreator } from "@/lib/creatorAuth";
import { readLimitedBody, safeFetch } from "@/lib/safeFetch";
import { fetchProductPreview } from "@/lib/productPreview";

const MAX_HTML_BYTES = 2 * 1024 * 1024;

// Simple in-memory cache for link previews (max 500 items)
const previewCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export async function GET(request: NextRequest) {
  // Server-side fetch of arbitrary URLs: only for signed-in creators.
  const auth = await requireCreator(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json(
      { error: { code: "MISSING_URL", message: "URL query parameter is required." } },
      { status: 400 }
    );
  }

  let normalizedUrl = rawUrl.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = "https://" + normalizedUrl;
  }

  // Shop: scrape the store page. Never falls back to a placeholder title.
  if (searchParams.get("type") === "product") {
    const cacheKey = `product:${normalizedUrl}`;
    const hit = previewCache.get(cacheKey);
    if (hit && Date.now() - hit.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(hit.data);
    }
    const product = await fetchProductPreview(normalizedUrl);
    // Only cache real results so a transient block or timeout isn't remembered for a day.
    if (product.name || product.image) {
      if (previewCache.size > 500) {
        const oldestKey = previewCache.keys().next().value;
        if (oldestKey) previewCache.delete(oldestKey);
      }
      previewCache.set(cacheKey, { data: product, timestamp: Date.now() });
    }
    return NextResponse.json(product);
  }

  // Check cache
  const cached = previewCache.get(normalizedUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  const validation = validateVideoUrl(normalizedUrl);
  if (!validation.isValid) {
    // Treat as general product / web URL
    try {
      const res = await safeFetch(normalizedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-IN,en;q=0.9",
        },
        timeoutMs: 6000,
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: { code: "FETCH_FAILED", message: "Couldn't fetch details. Please add them manually." } },
          { status: 422 }
        );
      }

      const html = (await readLimitedBody(res, MAX_HTML_BYTES)).toString("utf8");
      let title = "";
      let image = "";
      let price: number | null = null;

      // Extract title
      const ogTitleMatch = html.match(/<meta\s+[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                           html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i) ||
                           html.match(/<meta\s+[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i);
      if (ogTitleMatch) {
        title = ogTitleMatch[1].trim();
      } else {
        const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleTagMatch) title = titleTagMatch[1].trim();
      }

      // Extract image
      const ogImageMatch = html.match(/<meta\s+[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                           html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
                           html.match(/<meta\s+[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
      if (ogImageMatch) {
        let img = ogImageMatch[1].trim();
        if (img.startsWith("//")) img = "https:" + img;
        else if (img.startsWith("http://")) img = "https://" + img.slice(7);
        else if (img.startsWith("/") && !img.startsWith("http")) {
          const u = new URL(normalizedUrl);
          img = `${u.origin}${img}`;
        }
        image = img;
      }

      // Extract price from meta
      const ogPriceMatch = html.match(/<meta\s+[^>]*property=["'](?:og:price:amount|product:price:amount)["'][^>]*content=["']([^"']+)["']/i) ||
                           html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["'](?:og:price:amount|product:price:amount)["']/i);
      if (ogPriceMatch) {
        const p = parseFloat(ogPriceMatch[1].replace(/[^0-9.]/g, ""));
        if (!isNaN(p) && p >= 0) price = Math.round(p);
      }

      // Extract price from JSON-LD
      if (price === null) {
        const ldJsonMatches = html.match(/<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
        if (ldJsonMatches) {
          for (const block of ldJsonMatches) {
            try {
              const content = block.replace(/<\/?script[^>]*>/gi, "").trim();
              const parsed = JSON.parse(content);
              const findPrice = (obj: any): number | null => {
                if (!obj || typeof obj !== "object") return null;
                if (obj.price !== undefined && obj.price !== null) {
                  const p = parseFloat(String(obj.price).replace(/[^0-9.]/g, ""));
                  if (!isNaN(p) && p >= 0) return Math.round(p);
                }
                if (obj.offers) {
                  const offers = Array.isArray(obj.offers) ? obj.offers : [obj.offers];
                  for (const offer of offers) {
                    if (offer?.price !== undefined) {
                      const p = parseFloat(String(offer.price).replace(/[^0-9.]/g, ""));
                      if (!isNaN(p) && p >= 0) return Math.round(p);
                    }
                  }
                }
                return null;
              };
              const ldPrice = findPrice(parsed);
              if (ldPrice !== null) {
                price = ldPrice;
                break;
              }
            } catch {}
          }
        }
      }

      // Decode common HTML entities in title
      title = title.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
      if (title.length > 80) title = title.slice(0, 80).trim();

      const productResult = {
        name: title,
        title,
        image,
        thumbnail_url: image,
        price,
        url: normalizedUrl,
      };

      if (previewCache.size > 500) {
        const oldestKey = previewCache.keys().next().value;
        if (oldestKey) previewCache.delete(oldestKey);
      }
      previewCache.set(normalizedUrl, { data: productResult, timestamp: Date.now() });

      return NextResponse.json(productResult);
    } catch (fetchErr) {
      return NextResponse.json(
        { error: { code: "FETCH_FAILED", message: "Couldn't fetch details. Please add them manually." } },
        { status: 422 }
      );
    }
  }

  let title = "New Episode";
  let thumbnailUrl: string | null = extractVideoThumbnail(normalizedUrl, validation.platform);

  try {
    if (validation.platform === "YouTube") {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(normalizedUrl)}&format=json`;
      const res = await fetch(oembedUrl, {
        headers: { "User-Agent": "Infixo-App/1.0" },
        next: { revalidate: 86400 },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.title) title = data.title;
        if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
      }
    } else if (validation.platform === "Instagram") {
      // Instagram oEmbed requires a Facebook Graph API token
      const graphToken = process.env.META_GRAPH_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;
      if (graphToken) {
        try {
          const res = await fetch(
            `https://graph.facebook.com/v19.0/instagram_oembed?url=${encodeURIComponent(normalizedUrl)}&access_token=${graphToken}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.title) title = data.title;
            if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
          }
        } catch {}
      } else {
        title = "Instagram Video";
      }
    } else if (validation.platform === "Facebook") {
      const graphToken = process.env.META_GRAPH_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;
      if (graphToken) {
        try {
          const res = await fetch(
            `https://graph.facebook.com/v19.0/oembed_video?url=${encodeURIComponent(normalizedUrl)}&access_token=${graphToken}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.title) title = data.title;
            if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
          }
        } catch {}
      } else {
        title = "Facebook Video";
      }
    }
  } catch (err) {
    console.warn("Failed to fetch oEmbed preview:", err);
  }

  const result = {
    title,
    thumbnail_url: thumbnailUrl,
    platform: validation.platform,
    normalizedUrl: validation.normalizedUrl,
    videoId: validation.videoId,
  };

  // Cache result
  if (previewCache.size > 500) {
    const oldestKey = previewCache.keys().next().value;
    if (oldestKey) previewCache.delete(oldestKey);
  }
  previewCache.set(normalizedUrl, { data: result, timestamp: Date.now() });

  return NextResponse.json(result);
}
