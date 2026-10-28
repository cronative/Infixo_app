/**
 * Shared GET /api/me loader. The root SessionProvider, the dashboard layout's
 * session re-check and CreatorProvider all need /api/me on the same page load;
 * this collapses them into one request. Only authenticated responses are reused
 * (briefly), so a pre-login "anonymous" answer is never served after login.
 */

export interface MeResult {
  status: number;
  ok: boolean;
  body: { status?: number; data?: Record<string, any> } | null;
}

const REUSE_MS = 10_000;
let inFlight: Promise<MeResult> | null = null;
let cached: { at: number; result: MeResult } | null = null;

function isAuthenticated(result: MeResult) {
  return result.ok && result.body?.status === 1 && Boolean(result.body?.data?.authenticated);
}

export function fetchMe(): Promise<MeResult> {
  if (cached && Date.now() - cached.at < REUSE_MS) return Promise.resolve(cached.result);
  if (inFlight) return inFlight;
  inFlight = fetch("/api/me", { credentials: "include", cache: "no-store" })
    .then(async (res) => ({ status: res.status, ok: res.ok, body: await res.json().catch(() => null) }))
    .then((result) => {
      cached = isAuthenticated(result) ? { at: Date.now(), result } : null;
      return result;
    })
    .finally(() => { inFlight = null; });
  return inFlight;
}

export function clearMeCache() {
  cached = null;
}
