import { db } from "@/lib/db";
import { requireCreator } from "@/lib/creatorAuth";
import { apiSuccess, apiError } from "@/lib/apiResponse";

const TARGET_CNAME = process.env.CUSTOM_DOMAIN_CNAME_TARGET || "cname.inflixo.com";

function isValidHostname(domain: string): boolean {
  // Check for valid domain / subdomain format (e.g., links.creator.com, bio.brand.in, creator.com)
  const pattern = /^(?!:\/\/)([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return pattern.test(domain);
}

function cleanDomain(raw: string): string {
  let d = raw.trim().toLowerCase();
  d = d.replace(/^(https?:\/\/)/, "");
  d = d.replace(/\/.*$/, "");
  d = d.replace(/:\d+$/, "");
  return d;
}

// GET /api/creator/domain - Fetch creator's custom domain & status
export async function GET(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const [rows]: any = await db.query(
      `SELECT c.id, c.username, c.custom_domain, c.custom_domain_verified, c.custom_domain_configured_at,
              s.plan_key, s.status AS subscription_status
       FROM creators c
       LEFT JOIN subscriptions s ON c.id = s.creator_id
       WHERE c.id = ? LIMIT 1`,
      [auth.creator.id]
    );

    const creator = rows?.[0];
    if (!creator) return apiError("Creator not found", 404);

    const planKey = (creator.plan_key || "free").toLowerCase();
    const isProOrVip =
      planKey === "creator_vip" ||
      planKey === "vip" ||
      planKey === "unlimited" ||
      planKey === "creator_pro" ||
      planKey === "pro";

    return apiSuccess({
      customDomain: creator.custom_domain || null,
      isVerified: Boolean(creator.custom_domain_verified),
      configuredAt: creator.custom_domain_configured_at || null,
      targetCname: TARGET_CNAME,
      planKey: creator.plan_key || "free",
      canUseCustomDomain: isProOrVip,
      instructions: {
        recordType: "CNAME",
        host: creator.custom_domain ? (creator.custom_domain.includes(".") ? creator.custom_domain.split(".")[0] : "@") : "links",
        pointsTo: TARGET_CNAME,
        ttl: "3600 (or Auto)",
      },
    }, "Custom domain configuration retrieved");
  } catch (error: any) {
    console.error("GET /api/creator/domain error:", error);
    return apiError(error.message || "Failed to fetch domain configuration", 500);
  }
}

// POST /api/creator/domain - Set or update custom domain
export async function POST(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const body = await req.json();
    const rawDomain = body.domain || "";
    const domain = cleanDomain(rawDomain);

    if (!domain) {
      return apiError("Domain name is required", 400);
    }

    if (!isValidHostname(domain)) {
      return apiError("Invalid domain format. Example: links.yourname.com or yourbrand.com", 400);
    }

    // Disallow reserved domains
    if (domain === "inflixo.com" || domain.endsWith(".inflixo.com") || domain === "localhost") {
      return apiError("This domain is reserved by Inflixo", 400);
    }

    // Check if creator has Pro or VIP plan
    const [subRows]: any = await db.query(
      `SELECT plan_key, status FROM subscriptions WHERE creator_id = ? LIMIT 1`,
      [auth.creator.id]
    );
    const sub = subRows?.[0];
    const planKey = (sub?.plan_key || "").toLowerCase();
    const isEligible =
      planKey === "creator_vip" ||
      planKey === "vip" ||
      planKey === "unlimited" ||
      planKey === "creator_pro" ||
      planKey === "pro";

    if (!isEligible) {
      return apiError("Custom domain mapping is a Pro and VIP plan feature. Please upgrade to connect your domain.", 403);
    }

    // Check domain uniqueness across creators
    const [existing]: any = await db.query(
      `SELECT id, username FROM creators WHERE custom_domain = ? AND id != ? LIMIT 1`,
      [domain, auth.creator.id]
    );

    if (existing && existing.length > 0) {
      return apiError("This domain is already mapped to another Inflixo creator.", 409);
    }

    // Save domain in database
    await db.query(
      `UPDATE creators
       SET custom_domain = ?, custom_domain_verified = 0, custom_domain_configured_at = NOW()
       WHERE id = ?`,
      [domain, auth.creator.id]
    );

    return apiSuccess({
      customDomain: domain,
      isVerified: false,
      targetCname: TARGET_CNAME,
      instructions: {
        recordType: "CNAME",
        host: domain.includes(".") ? domain.split(".")[0] : "@",
        pointsTo: TARGET_CNAME,
      },
    }, "Custom domain saved. Please configure your DNS CNAME record and verify.");
  } catch (error: any) {
    console.error("POST /api/creator/domain error:", error);
    return apiError(error.message || "Failed to update custom domain", 500);
  }
}

// DELETE /api/creator/domain - Disconnect custom domain
export async function DELETE(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    await db.query(
      `UPDATE creators
       SET custom_domain = NULL, custom_domain_verified = 0, custom_domain_configured_at = NULL
       WHERE id = ?`,
      [auth.creator.id]
    );

    return apiSuccess({}, "Custom domain disconnected successfully");
  } catch (error: any) {
    console.error("DELETE /api/creator/domain error:", error);
    return apiError(error.message || "Failed to disconnect custom domain", 500);
  }
}
