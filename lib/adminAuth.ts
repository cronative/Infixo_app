import crypto from "crypto";

function getAdminSecret() {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("ADMIN_JWT_SECRET is not configured");
  return secret;
}

export function createAdminToken(email: string): string {
  const payload = JSON.stringify({
    email,
    role: "admin",
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days validity
  });
  const hmac = crypto.createHmac("sha256", getAdminSecret()).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64url") + "." + hmac;
}

export function verifyAdminToken(token: string | null | undefined): boolean {
  if (!token) return false;
  try {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) return false;

    const payload = Buffer.from(encodedPayload, "base64url").toString();
    const expectedSig = crypto.createHmac("sha256", getAdminSecret()).update(payload).digest("hex");

    // Timing-safe buffer comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSig);
    if (sigBuffer.length !== expectedBuffer.length) return false;
    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return false;

    const data = JSON.parse(payload);
    if (data.role !== "admin") return false;
    if (typeof data.exp === "number" && data.exp < Date.now()) return false;

    return true;
  } catch {
    return false;
  }
}

export async function isAuthorizedAdmin(req: Request): Promise<boolean> {
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(req.url).host) return false;
    } catch {
      return false;
    }
  }

  // 1. Check httpOnly cookie
  const cookieHeader = req.headers.get("cookie") || "";
  const cookieMatch = cookieHeader.match(/inflixo_admin_token=([^;]+)/);
  if (cookieMatch && verifyAdminToken(cookieMatch[1])) {
    return true;
  }

  // 2. Check Authorization header (Bearer <token> or x-admin-token)
  const authHeader = req.headers.get("authorization") || req.headers.get("x-admin-token");
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (verifyAdminToken(token)) {
      return true;
    }
  }

  return false;
}
