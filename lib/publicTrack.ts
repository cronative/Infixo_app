// Public-profile analytics: fire-and-forget beacons to POST /api/analytics/track.
// Tracking is off until a public page calls setPublicTrackContext(), so dashboard,
// Themes and live-preview renders of the same components never send events.

export type PublicEventType =
  | "profile_view"
  | "series_open"
  | "episode_click"
  | "link_click"
  | "product_click"
  | "setup_click"
  | "media_kit_view"
  | "collab_package_view";

export type PublicTrackSource = "public_profile" | "public_series" | "public_products" | "public_mediakit";

interface TrackContext {
  creatorId?: string;
  username: string;
  source: PublicTrackSource;
}

const VISITOR_KEY = "inflixo_vid";
const PROFILE_VIEW_KEY = "inflixo_pv";
const PROFILE_VIEW_WINDOW_MS = 30 * 60 * 1000;
const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|curl|wget/i;

let context: TrackContext | null = null;

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export function getVisitorId(): string {
  const existing = readStorage(VISITOR_KEY);
  if (existing) return existing;
  const next = `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  writeStorage(VISITOR_KEY, next);
  return next;
}

/** True when the signed-in creator is looking at their own public page. */
function isOwner(username: string) {
  try {
    const stored = JSON.parse(readStorage("inflixo_creator_profile") || "null");
    const handle = String(stored?.username || "").replace(/^@/, "").toLowerCase();
    return Boolean(handle) && handle === username.replace(/^@/, "").toLowerCase();
  } catch {
    return false;
  }
}

function isBot() {
  return typeof navigator === "undefined" || navigator.webdriver === true || BOT_UA.test(navigator.userAgent || "");
}

/** Enable tracking for a public page; pass null on unmount. Owners and bots stay disabled. */
export function setPublicTrackContext(next: TrackContext | null) {
  if (!next || !next.username || next.username === "demo_creator" || isOwner(next.username) || isBot()) {
    context = null;
    return;
  }
  context = next;
}

function eventId(type: string, target: string | null) {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `${type}:${target ?? "-"}:${random}`;
}

export function trackPublicEvent(type: PublicEventType, target: string | null = null) {
  if (!context || typeof window === "undefined") return;
  try {
    const body = JSON.stringify({
      creatorId: context.creatorId,
      username: context.username,
      eventType: type,
      eventTarget: target,
      eventId: eventId(type, target),
      visitorId: getVisitorId(),
      source: context.source,
      metadata: type === "profile_view" ? { referrer: document.referrer || "" } : undefined,
    });
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/analytics/track", blob)) {
      fetch("/api/analytics/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch {}
}

/** profile_view, max 1 per visitor per creator per 30 minutes. */
export function trackProfileView() {
  if (!context) return;
  const key = `${PROFILE_VIEW_KEY}:${context.username.toLowerCase()}`;
  const last = Number(readStorage(key) || 0);
  if (last && Date.now() - last < PROFILE_VIEW_WINDOW_MS) return;
  writeStorage(key, String(Date.now()));
  trackPublicEvent("profile_view");
}
