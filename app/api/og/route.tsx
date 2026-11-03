import { ImageResponse } from "next/og";
import { HEADLINE, TAGLINE } from "@/lib/brand";
import { getWordmarkWhiteDataUrl } from "@/lib/ogAssets";

export const runtime = "nodejs";

// GET /api/og — default social share image: Inflixo logo + tagline.
export async function GET() {
  const logo = await getWordmarkWhiteDataUrl();
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #3B0C27 0%, #7A2253 55%, #A23372 100%)",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="Inflixo" width={340} height={101} style={{ width: 340, height: 101 }} />
        ) : (
          <div style={{ fontSize: 88, fontWeight: 800 }}>Inflixo</div>
        )}
        <div style={{ marginTop: 36, fontSize: 60, fontWeight: 800, letterSpacing: "-0.02em" }}>{TAGLINE}</div>
        <div style={{ marginTop: 18, fontSize: 28, opacity: 0.82, maxWidth: 900, textAlign: "center" }}>{HEADLINE}</div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } },
  );
}
