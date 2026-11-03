import { NextRequest, NextResponse } from "next/server";
import { requireCreator } from "@/lib/creatorAuth";
import { validateVideoUrl, normalizeVideoUrl } from "@/lib/videoUrl";
import { safeFetch, readLimitedBody } from "@/lib/safeFetch";

// Simple in-memory cache for video metadata (~24 hours TTL, max 1000 items)
interface CacheEntry {
  title: string;
  platform: string;
  timestamp: number;
}

const metaCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 1000;

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return !isNaN(code) ? String.fromCharCode(code) : "";
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = parseInt(hex, 16);
      return !isNaN(code) ? String.fromCharCode(code) : "";
    });
}

function sanitizeTitle(str: string): string {
  if (!str) return "";
  const noTags = str.replace(/<[^>]*>/g, "");
  const decoded = decodeHtmlEntities(noTags);
  const normalized = decoded.replace(/\s+/g, " ").trim();
  return normalized.slice(0, 100).trim();
}

export async function GET(request: NextRequest) {
  // Creator authentication
  const auth = await requireCreator(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl || !rawUrl.trim()) {
    return NextResponse.json(
      { error: "URL query parameter is required." },
      { status: 400 }
    );
  }

  const normalizedUrl = normalizeVideoUrl(rawUrl.trim());
  const validation = validateVideoUrl(normalizedUrl);

  if (!validation.isValid || validation.platform === "Other") {
    return NextResponse.json(
      { error: validation.error || "Please enter a valid YouTube, Instagram, or Facebook video link." },
      { status: 400 }
    );
  }

  // Check cache
  const cached = metaCache.get(validation.normalizedUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      title: cached.title,
      platform: cached.platform,
      normalizedUrl: validation.normalizedUrl,
    });
  }

  let title = "";

  try {
    if (validation.platform === "YouTube") {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
        validation.normalizedUrl
      )}&format=json`;
      const res = await fetch(oembedUrl, {
        headers: { "User-Agent": "Infixo-App/1.0" },
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.title) {
          title = sanitizeTitle(String(data.title));
        }
      }
    } else if (validation.platform === "Instagram" || validation.platform === "Facebook") {
      // 1. Try Meta Graph oEmbed if token is present
      const graphToken =
        process.env.META_GRAPH_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;
      if (graphToken) {
        try {
          const endpoint =
            validation.platform === "Instagram"
              ? `https://graph.facebook.com/v19.0/instagram_oembed?url=${encodeURIComponent(
                  validation.normalizedUrl
                )}&access_token=${graphToken}`
              : `https://graph.facebook.com/v19.0/oembed_video?url=${encodeURIComponent(
                  validation.normalizedUrl
                )}&access_token=${graphToken}`;
          const res = await fetch(endpoint, {
            signal: AbortSignal.timeout(3500),
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.title) {
              title = sanitizeTitle(String(data.title));
            }
          }
        } catch {}
      }

      // 2. Fallback: attempt safeFetch to extract og:title
      if (!title) {
        try {
          const res = await safeFetch(validation.normalizedUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              Accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
            timeoutMs: 3500,
          });
          if (res.ok) {
            const html = (await readLimitedBody(res, 512 * 1024)).toString("utf8");
            const ogTitleMatch =
              html.match(/<meta\s+[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
              html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i) ||
              html.match(/<meta\s+[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i);
            if (ogTitleMatch && ogTitleMatch[1]) {
              title = sanitizeTitle(ogTitleMatch[1]);
            } else {
              const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
              if (titleTagMatch && titleTagMatch[1]) {
                title = sanitizeTitle(titleTagMatch[1]);
              }
            }
          }
        } catch {}
      }
    }
  } catch (err) {
    // Timeout or network error: title remains empty, frontend will use fallback "Episode N"
  }

  // Cache only if a title was successfully resolved
  if (title) {
    if (metaCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = metaCache.keys().next().value;
      if (oldestKey) metaCache.delete(oldestKey);
    }
    metaCache.set(validation.normalizedUrl, {
      title,
      platform: validation.platform,
      timestamp: Date.now(),
    });
  }

  return NextResponse.json({
    title,
    platform: validation.platform,
    normalizedUrl: validation.normalizedUrl,
  });
}
