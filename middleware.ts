import { NextResponse, type NextRequest } from "next/server";

const DEFAULT_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "inflixo.com",
  "www.inflixo.com",
  "app.inflixo.com",
]);

export async function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].toLowerCase();
  const pathname = req.nextUrl.pathname;

  // 1. Skip system paths, internal API, assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/logo") ||
    pathname.startsWith("/admin/phpmyadmin") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. If it's standard Inflixo domain, localhost or Vercel preview, proceed normally
  if (
    DEFAULT_HOSTS.has(host) ||
    host.endsWith(".vercel.app") ||
    host.endsWith(".ngrok-free.app") ||
    host.endsWith(".local")
  ) {
    return NextResponse.next();
  }

  // 3. Custom domain detected! Query domain lookup API
  try {
    const origin = req.nextUrl.origin;
    const lookupUrl = `${origin}/api/public/domain-lookup?domain=${encodeURIComponent(host)}`;
    const res = await fetch(lookupUrl, { next: { revalidate: 300 } });

    if (res.ok) {
      const json = await res.json();
      const username = json.data?.username;
      const isVerified = json.data?.isVerified;

      if (username) {
        // Rewrite to creator's public profile page seamlessly
        const rewritePath = pathname === "/" ? `/${username}` : `/${username}${pathname}`;
        const rewriteUrl = new URL(rewritePath, req.url);
        return NextResponse.rewrite(rewriteUrl);
      }
    }
  } catch (err) {
    console.error(`[Custom Domain Middleware] Lookup failed for ${host}:`, err);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
