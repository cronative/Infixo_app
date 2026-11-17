import { withPdfPage } from "@/lib/pdfBrowser";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";
import { getCachedMediaKitPdf, setCachedMediaKitPdf } from "@/lib/mediakitPdfCache";

// Always fetched fresh by the browser; the server keeps it for a few minutes and drops it on any save.
const PDF_HEADERS = (username: string) => ({
  "Content-Type": "application/pdf",
  "Content-Disposition": `attachment; filename="${username}-media-kit.pdf"`,
  "Cache-Control": "private, no-store",
});

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

    const cached = getCachedMediaKitPdf(cleanUsername);
    if (cached) {
      return new Response(Buffer.from(cached), { status: 200, headers: PDF_HEADERS(cleanUsername) });
    }

    const origin = getOriginFromReq(req);
    const targetUrl = `${origin}/${encodeURIComponent(cleanUsername)}/mediakit?print=1`;

    const pdfBuffer = await withPdfPage(async (page) => {
      await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
      await page.goto(targetUrl, { waitUntil: ["load", "networkidle0"] });

      // Allow a brief settling delay for fonts, SVG rendering, and images
      await new Promise((resolve) => setTimeout(resolve, 800));

      await page.emulateMediaType("print");
      const generated = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "10mm", bottom: "10mm", left: "12mm", right: "12mm" },
      });
      return new Uint8Array(generated);
    });

    setCachedMediaKitPdf(cleanUsername, pdfBuffer);
    return new Response(Buffer.from(pdfBuffer), { status: 200, headers: PDF_HEADERS(cleanUsername) });
  } catch (err) {
    // Real error stays in server logs; the client only gets a generic message.
    console.error("MediaKit PDF generation failed:", err);
    return Response.json({ error: "Couldn't generate PDF, please try again" }, { status: 500 });
  }
}
