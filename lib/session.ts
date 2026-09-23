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

export function setSessionCookie(response: NextResponse, token: string, req?: Request): NextResponse {
  const secure = req ? isHttpsRequest(req) : process.env.NODE_ENV === "production";
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: "strict",
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
    sameSite: "strict",
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
    let crossOrigin = fetchSite === "cross-site";
    if (origin) {
      try {
        crossOrigin ||= new URL(origin).host !== new URL(req.url).host;
      } catch {
        crossOrigin = true;
      }
    }
    if (crossOrigin) {
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
