import dns from "dns";
import { db } from "@/lib/db";
import { requireCreator } from "@/lib/creatorAuth";
import { apiSuccess, apiError } from "@/lib/apiResponse";

const TARGET_CNAME = (process.env.CUSTOM_DOMAIN_CNAME_TARGET || "cname.inflixo.com").toLowerCase();

export async function POST(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;

    const [rows]: any = await db.query(
      `SELECT id, username, custom_domain, custom_domain_verified FROM creators WHERE id = ? LIMIT 1`,
      [auth.creator.id]
    );

    const creator = rows?.[0];
    if (!creator || !creator.custom_domain) {
      return apiError("No custom domain configured. Please save a domain first.", 400);
    }

    const domain = creator.custom_domain.toLowerCase().trim();
    let isDnsVerified = false;
    let resolvedTarget: string | null = null;
    let verificationError: string | null = null;

    // Check query params for dev/test override
    const url = new URL(req.url);
    const isDev = process.env.NODE_ENV === "development";
    const forceVerify = isDev && url.searchParams.get("testVerify") === "true";

    if (forceVerify) {
      isDnsVerified = true;
      resolvedTarget = TARGET_CNAME;
    } else {
      try {
        const cnames = await dns.promises.resolveCname(domain);
        if (Array.isArray(cnames) && cnames.length > 0) {
          const match = cnames.find((c) => c.toLowerCase().replace(/\.$/, "") === TARGET_CNAME.replace(/\.$/, ""));
          if (match) {
            isDnsVerified = true;
            resolvedTarget = match;
          } else {
            resolvedTarget = cnames[0];
            verificationError = `Domain resolves to '${cnames[0]}', expected '${TARGET_CNAME}'.`;
          }
        }
      } catch (dnsErr: any) {
        // CNAME lookup failed, check A record fallback or return specific error
        try {
          const aRecords = await dns.promises.resolve4(domain);
          if (aRecords && aRecords.length > 0) {
            verificationError = `Found A records (${aRecords.join(", ")}), but a CNAME record pointing to '${TARGET_CNAME}' is required.`;
          } else {
            verificationError = `No DNS records found for '${domain}'. DNS propagation may take up to 24 hours.`;
          }
        } catch {
          verificationError = `DNS lookup failed for '${domain}'. Please verify you added the CNAME record in your registrar DNS settings.`;
        }
      }
    }

    if (isDnsVerified) {
      await db.query(
        `UPDATE creators SET custom_domain_verified = 1 WHERE id = ?`,
        [auth.creator.id]
      );

      return apiSuccess({
        customDomain: domain,
        isVerified: true,
        resolvedTarget,
      }, "🎉 DNS verification successful! Your custom domain is now active.");
    }

    return apiError(
      verificationError || `CNAME record could not be verified yet. Please make sure your CNAME points to '${TARGET_CNAME}'.`,
      422
    );
  } catch (error: any) {
    console.error("POST /api/creator/domain/verify error:", error);
    return apiError(error.message || "Failed to verify DNS record", 500);
  }
}
