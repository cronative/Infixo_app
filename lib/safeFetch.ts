import { lookup } from "dns/promises";
import { isIP } from "net";

/**
 * Server-side fetch for user-supplied URLs (link previews, product images).
 * Only https, only public IPs, redirects re-validated on every hop, bounded body size.
 */

export class UnsafeUrlError extends Error {}

const MAX_REDIRECTS = 5;

function isPrivateIPv4(ip: string) {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIp(ip: string) {
  if (isIP(ip) === 4) return isPrivateIPv4(ip);
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateIp(v6.slice(7));
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe8") || v6.startsWith("fe9") || v6.startsWith("fea") || v6.startsWith("feb") || v6.startsWith("ff");
}

async function assertPublicHttpsUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError("Invalid URL.");
  }
  if (url.protocol !== "https:" || url.username || url.password) throw new UnsafeUrlError("Only public https URLs are allowed.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new UnsafeUrlError("Only public https URLs are allowed.");
  }
  return url;
}

export async function safeFetch(raw: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  const { timeoutMs = 8000, ...rest } = init;
  const signal = AbortSignal.timeout(timeoutMs);
  let current = raw;
  // Some stores redirect to themselves until their session cookie comes back; keep cookies per host across hops.
  const cookies = new Map<string, Map<string, string>>();
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertPublicHttpsUrl(current);
    const headers = new Headers(rest.headers);
    const jar = cookies.get(url.hostname);
    if (jar?.size) headers.set("Cookie", [...jar].map(([name, value]) => `${name}=${value}`).join("; "));
    const res = await fetch(url, { ...rest, headers, redirect: "manual", signal });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      for (const cookie of res.headers.getSetCookie()) {
        const [pair] = cookie.split(";");
        const eq = pair.indexOf("=");
        if (eq > 0) {
          if (!cookies.has(url.hostname)) cookies.set(url.hostname, new Map());
          cookies.get(url.hostname)!.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
        }
      }
      current = new URL(location, url).toString();
      continue;
    }
    return res;
  }
  throw new UnsafeUrlError("Too many redirects.");
}

/** Reads a response body, aborting once it exceeds maxBytes (or, with truncate, keeping only the first maxBytes). */
export async function readLimitedBody(res: Response, maxBytes: number, { truncate = false } = {}): Promise<Buffer> {
  const declared = Number(res.headers.get("content-length") || 0);
  if (!truncate && declared > maxBytes) throw new UnsafeUrlError("Response too large.");
  if (!res.body) return Buffer.alloc(0);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      if (!truncate) throw new UnsafeUrlError("Response too large.");
      chunks.push(value.subarray(0, value.byteLength - (total - maxBytes)));
      break;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
