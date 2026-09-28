import crypto from "crypto";
import { NextResponse } from "next/server";
import { apiError } from "./apiResponse";

const SESSION_COOKIE_NAME = "inflixo_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET env variable is not set");
  return secret;
}

export interface SessionPayload {
  email: string;
  creatorId: string;
  iat: number;
  exp: number;
}

// ─── Token helpers ────────────────────────────────────────────────────────────

export function createSessionToken(email: string, creatorId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    email: email.toLowerCase().trim(),
    creatorId,
    iat: now,
    exp: now + SESSION_MAX_AGE,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("hex");
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) return null;

    const expectedSig = crypto
      .createHmac("sha256", getSecret())
      .update(encodedPayload)
      .digest("hex");

    // Timing-safe comparison
    const sigBuf = Buffer.from(signature, "hex");
    const expectedBuf = Buffer.from(expectedSig, "hex");
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

    const payload: SessionPayload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString()
    );

    if (!payload.email || !payload.creatorId) return null;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

// ─── Request helpers ─────────────────────────────────────────────────────────

export function getSessionFromRequest(req: Request): SessionPayload | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  return verifySessionToken(decodeURIComponent(match[1]));
}

// ─── Response cookie helpers ──────────────────────────────────────────────────

/**
 * Whether the incoming request actually arrived over HTTPS.
 *
 * We used to gate the cookie's `secure` flag on `NODE_ENV === "production"`,
 * but `next start` always forces NODE_ENV to "production" even when you run
 * it locally on plain http (e.g. `npm run start` -> http://localhost:3030).
 * A `Secure` cookie is silently dropped by the browser over a non-TLS
 * origin, so login would "succeed" (verify-otp returns 200) but no cookie
 * ever actually got stored — every following request, including /api/me,
 * then looks unauthenticated. Deriving it from the request itself fixes
 * local production testing while staying secure behind a real HTTPS proxy
 * (which sets x-forwarded-proto).
 */
function isHttpsRequest(req: Request): boolean {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0].trim().toLowerCase() === "https";
  }
  try {
    return new URL(req.url).protocol === "https:";
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

export function isAllowedOrigin(req: Request, origin?: string | null): boolean {
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.host.toLowerCase();
    const originHostNoWww = originHost.replace(/^www\./, "");
    const originWithoutPort = originHost.split(":")[0];
    const originBase = originWithoutPort.replace(/^www\./, "");

    // 1. Gather all candidate host headers from the request
    const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0].trim().toLowerCase();
    const hostHeader = req.headers.get("host")?.toLowerCase();
    let reqUrlHost: string | null = null;
    try {
      reqUrlHost = new URL(req.url).host.toLowerCase();
    } catch {}

    const candidates = [forwardedHost, hostHeader, reqUrlHost].filter(Boolean) as string[];

    for (const cand of candidates) {
      const candNoWww = cand.replace(/^www\./, "");
      const candWithoutPort = cand.split(":")[0];
      const candBase = candWithoutPort.replace(/^www\./, "");

      if (
        originHost === cand ||
        originHostNoWww === candNoWww ||
        originWithoutPort === candWithoutPort ||
        originBase === candBase
      ) {
        return true;
      }
    }

    // 2. Check environment configured URLs
    const envUrls = [
      process.env.APP_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.NEXTAUTH_URL,
      "https://inflixo.com",
      "https://www.inflixo.com",
    ].filter(Boolean) as string[];

    for (const envUrl of envUrls) {
      try {
        const u = new URL(envUrl);
        const uHost = u.host.toLowerCase();
        const uHostNoWww = uHost.replace(/^www\./, "");
        const uWithoutPort = uHost.split(":")[0];
        const uBase = uWithoutPort.replace(/^www\./, "");

        if (
          originHost === uHost ||
          originHostNoWww === uHostNoWww ||
          originWithoutPort === uWithoutPort ||
          originBase === uBase
        ) {
          return true;
        }
      } catch {}
    }

    // 3. Localhost / 127.0.0.1 for local dev/testing
    if (originHost.startsWith("localhost") || originHost.startsWith("127.0.0.1")) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function setSessionCookie(response: NextResponse, token: string, req?: Request): NextResponse {
  const secure = req ? isHttpsRequest(req) : process.env.NODE_ENV === "production";
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return response;
}

export function clearSessionCookie(response: NextResponse, req?: Request): NextResponse {
  const secure = req ? isHttpsRequest(req) : process.env.NODE_ENV === "production";
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}

// ─── Convenience: require session or return 401 ───────────────────────────────

export function requireSession(
  req: Request
): { session: SessionPayload; error: null } | { session: null; error: NextResponse } {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method.toUpperCase())) {
    const fetchSite = req.headers.get("sec-fetch-site");
    const origin = req.headers.get("origin");

    // Block only if sec-fetch-site explicitly says cross-site AND origin is not allowed
    if (fetchSite === "cross-site") {
      if (!isAllowedOrigin(req, origin)) {
        return {
          session: null,
          error: apiError("Cross-origin request rejected", 403),
        };
      }
    } else if (origin && !isAllowedOrigin(req, origin)) {
      return {
        session: null,
        error: apiError("Cross-origin request rejected", 403),
      };
    }
  }

  const session = getSessionFromRequest(req);
  if (!session) {
    return {
      session: null,
      error: apiError("Unauthorized — please log in", 401),
    };
  }
  return { session, error: null };
}

// ─── Ownership check ─────────────────────────────────────────────────────────

/**
 * Verifies that the session email matches the email in the request body.
 * Pass `allowedEmail` from the parsed request body.
 */
export function ownsResource(session: SessionPayload, allowedEmail: string): boolean {
  return session.email === allowedEmail.toLowerCase().trim();
}
