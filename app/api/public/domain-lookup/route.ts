import { db } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/apiResponse";

// In-memory cache for fast domain lookups (TTL: 5 minutes)
const domainCache = new Map<string, { username: string; isVerified: boolean; cachedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const domain = (url.searchParams.get("domain") || "").trim().toLowerCase();

    if (!domain) {
      return apiError("Domain parameter is required", 400);
    }

    const cached = domainCache.get(domain);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return apiSuccess({ username: cached.username, isVerified: cached.isVerified });
    }

    const [rows]: any = await db.query(
      `SELECT username, custom_domain_verified FROM creators WHERE custom_domain = ? LIMIT 1`,
      [domain]
    );

    const match = rows?.[0];
    if (!match) {
      return apiError("Domain not mapped to any Inflixo creator", 404);
    }

    const result = {
      username: match.username,
      isVerified: Boolean(match.custom_domain_verified),
    };

    domainCache.set(domain, { ...result, cachedAt: Date.now() });

    return apiSuccess(result, "Domain mapping found");
  } catch (error: any) {
    console.error("GET /api/public/domain-lookup error:", error);
    return apiError(error.message || "Domain lookup failed", 500);
  }
}
