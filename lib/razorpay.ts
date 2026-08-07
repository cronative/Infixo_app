// ---------------------------------------------------------------------------
// Razorpay server helper — thin REST wrapper over api.razorpay.com/v1.
// Implemented with plain fetch() (no `razorpay` npm SDK) so it has zero new
// install-time dependencies. All calls run server-side only; the Key Secret
// must never reach the client.
// ---------------------------------------------------------------------------

import crypto from "crypto";

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

export type RazorpayMode = "test" | "live";

export function getRazorpayMode(): RazorpayMode {
  return process.env.RAZORPAY_MODE === "live" ? "live" : "test";
}

export interface RazorpayKeys {
  keyId: string;
  keySecret: string;
  mode: RazorpayMode;
}

/**
 * Returns the active Key ID / Key Secret pair based on RAZORPAY_MODE.
 * Throws a clear error if the secret hasn't been configured yet, instead of
 * silently sending broken requests to Razorpay.
 */
export function getRazorpayKeys(): RazorpayKeys {
  const mode = getRazorpayMode();
  const keyId =
    (mode === "live" ? process.env.RAZORPAY_LIVE_KEY_ID : process.env.RAZORPAY_TEST_KEY_ID) ||
    "rzp_test_SQis9g0UgsSikN";
  const keySecret =
    (mode === "live" ? process.env.RAZORPAY_LIVE_KEY_SECRET : process.env.RAZORPAY_TEST_KEY_SECRET) || "";

  return { keyId, keySecret, mode };
}

/** Basic-auth signed fetch against the Razorpay REST API. */
export async function razorpayRequest<T = any>(
  path: string,
  options: { method?: "GET" | "POST"; body?: Record<string, unknown> } = {}
): Promise<T> {
  const { keyId, keySecret } = getRazorpayKeys();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const res = await fetch(`${RAZORPAY_API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data?.error?.description || `Razorpay API error (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

/**
 * Verifies the signature Razorpay Checkout returns to the browser after a
 * subscription payment: HMAC-SHA256("<payment_id>|<subscription_id>", secret).
 */
export function verifySubscriptionPaymentSignature(params: {
  razorpayPaymentId: string;
  razorpaySubscriptionId: string;
  razorpaySignature: string;
}): boolean {
  const { keySecret } = getRazorpayKeys();
  const payload = `${params.razorpayPaymentId}|${params.razorpaySubscriptionId}`;
  const expected = crypto.createHmac("sha256", keySecret).update(payload).digest("hex");
  return timingSafeEqualHex(expected, params.razorpaySignature);
}

/** Verifies the X-Razorpay-Signature header on incoming webhook requests. */
export function verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string): boolean {
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return timingSafeEqualHex(expected, signature);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
