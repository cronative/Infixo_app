import puppeteer from "puppeteer";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";

interface CachedPdf {
  buffer: Uint8Array;
  expiresAt: number;
}

// In-memory PDF cache with 1-hour TTL
const pdfCache = new Map<string, CachedPdf>();

function getOriginFromReq(req: Request): string {
  const urlObj = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || urlObj.host || "127.0.0.1:3000";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let usernameParam = searchParams.get("username")?.trim();
    const creatorIdParam = searchParams.get("creatorId")?.trim();

    // Fallback: creator session if no query params provided
    if (!usernameParam && !creatorIdParam) {
      const session = await getSessionFromRequest(req);
      if (session?.creatorId) {
        const [rows]: any = await db.query(
          "SELECT username FROM creators WHERE id = ? LIMIT 1",
          [session.creatorId]
        );
        if (rows?.[0]?.username) {
          usernameParam = rows[0].username;
        }
      }
    }

    if (!usernameParam && !creatorIdParam) {
      return new Response("Missing username or creatorId", { status: 400 });
    }

    // Resolve username from DB if creatorId was passed
    let cleanUsername = (usernameParam || "").replace(/^@/, "").toLowerCase();
    if (!cleanUsername && creatorIdParam) {
      const [rows]: any = await db.query(
        "SELECT username FROM creators WHERE id = ? LIMIT 1",
        [creatorIdParam]
      );
      if (rows?.[0]?.username) {
        cleanUsername = rows[0].username.replace(/^@/, "").toLowerCase();
      }
    }

    if (!cleanUsername) {
      return new Response("Creator not found", { status: 404 });
    }

    // Check 1-hour in-memory cache
    const cached = pdfCache.get(cleanUsername);
    if (cached && Date.now() < cached.expiresAt) {
      return new Response(Buffer.from(cached.buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${cleanUsername}-mediakit.pdf"`,
          "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
        },
      });
    }

    const origin = getOriginFromReq(req);
    const targetUrl = `${origin}/${encodeURIComponent(cleanUsername)}/mediakit?print=1`;

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--font-render-hinting=medium",
      ],
    });

    let pdfBuffer: Uint8Array;
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
      await page.goto(targetUrl, {
        waitUntil: ["load", "networkidle0"],
        timeout: 30000,
      });

      // Allow a brief settling delay for fonts, SVG rendering, and images
      await new Promise((resolve) => setTimeout(resolve, 800));

      await page.emulateMediaType("print");
      const generated = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "10mm",
          bottom: "10mm",
          left: "12mm",
          right: "12mm",
        },
      });
      pdfBuffer = new Uint8Array(generated);
    } finally {
      await browser.close();
    }

    // Cache for 1 hour
    pdfCache.set(cleanUsername, {
      buffer: pdfBuffer,
      expiresAt: Date.now() + 3600 * 1000,
    });

    return new Response(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${cleanUsername}-mediakit.pdf"`,
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err: any) {
    console.error("MediaKit Headless Chrome PDF Error:", err);
    return new Response(`Failed to generate Media Kit PDF: ${err?.message || "Unknown error"}`, {
      status: 500,
    });
  }
}
