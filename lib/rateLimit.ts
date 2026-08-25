// In-Memory Rate Limiter for Infixo APIs (Sliding Window Algorithm)

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const ipStore = new Map<string, RateLimitRecord>();

// Cleanup stale records every 10 minutes to prevent memory leak
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipStore.entries()) {
      if (record.resetAt <= now) {
        ipStore.delete(ip);
      }
    }
  }, 10 * 60 * 1000);
}

export function checkRateLimit(
  ip: string,
  limit: number = 5,
  windowMs: number = 5 * 60 * 1000 // 5 minutes
): { success: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  const record = ipStore.get(ip);

  if (!record || record.resetAt <= now) {
    ipStore.set(ip, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { success: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  if (record.count >= limit) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    return { success: false, remaining: 0, retryAfterSec };
  }

  record.count += 1;
  return { success: true, remaining: limit - record.count, retryAfterSec: 0 };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip"); // Cloudflare support

  if (cfConnectingIp) return cfConnectingIp.trim();
  if (realIp) return realIp.trim();
  if (forwarded) return forwarded.split(",")[0].trim();
  return "127.0.0.1";
}
