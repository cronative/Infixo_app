import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { calculateTotalFanbase, getCreatorEra } from "@/lib/creatorEra";
import { ERA_CONFIG } from "@/lib/eraConfig";
import { getInitials } from "@/lib/avatar";
import { SITE_URL, TAGLINE } from "@/lib/brand";
import { fetchImageDataUrl, getWordmarkWhiteDataUrl } from "@/lib/ogAssets";

export const runtime = "nodejs";

// GET /api/og/:username — profile share image: avatar (or initials) + name + Creator Era.
export async function GET(_req: Request, props: { params: Promise<{ username: string }> }) {
  const { username } = await props.params;
  const clean = decodeURIComponent(username || "").replace(/^@/, "").trim().toLowerCase();

  let name = clean || "Creator";
  let handle = clean || "creator";
  let photo: string | null = null;
  let fans = 0;
  try {
    const [rows]: any = await db.query(
      "SELECT id, username, display_name, photo_url, peak_fanbase FROM creators WHERE LOWER(username) = ? LIMIT 1",
      [clean],
    );
    const c = rows?.[0];
    if (c) {
      name = c.display_name || c.username || clean;
      handle = c.username || clean;
      photo = c.photo_url || null;
      const [socials]: any = await db.query(
        "SELECT platform, username, follower_count, audience_count, is_primary FROM social_accounts WHERE creator_id = ?",
        [c.id],
      );
      fans = Math.max(Number(c.peak_fanbase) || 0, calculateTotalFanbase(socials) ?? 0);
    }
  } catch (err) {
    console.error("OG profile lookup failed:", err);
  }

  const era = getCreatorEra(fans);
  const cfg = ERA_CONFIG[era?.era ?? "Rising"];
  const [avatar, logo] = await Promise.all([fetchImageDataUrl(photo, SITE_URL), getWordmarkWhiteDataUrl()]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 80px",
          background: "linear-gradient(135deg, #2A0819 0%, #5E1A41 55%, #7A2253 100%)",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          <div
            style={{
              display: "flex",
              width: 240,
              height: 240,
              borderRadius: 999,
              padding: 8,
              background: cfg.accent ? `linear-gradient(135deg, ${cfg.accent}, ${cfg.color})` : cfg.color,
            }}
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" width={224} height={224} style={{ width: 224, height: 224, borderRadius: 999, objectFit: "cover" }} />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: 224,
                  height: 224,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#F7EEF2",
                  color: "#7A2253",
                  fontSize: 88,
                  fontWeight: 800,
                }}
              >
                {getInitials(name)}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 720 }}>
            <div style={{ fontSize: name.length > 22 ? 56 : 68, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em" }}>{name}</div>
            <div style={{ marginTop: 8, fontSize: 32, opacity: 0.75 }}>{`@${handle}`}</div>
            {era && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: 28,
                  padding: "12px 24px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.12)",
                  border: `2px solid ${cfg.accent ?? cfg.color}`,
                  fontSize: 30,
                  fontWeight: 700,
                }}
              >
                <div style={{ display: "flex", width: 18, height: 18, borderRadius: 999, background: cfg.accent ?? cfg.color, marginRight: 14 }} />
                {`${era.badge} · ${cfg.award}`}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="Inflixo" width={200} height={59} style={{ width: 200, height: 59 }} />
          ) : (
            <div style={{ fontSize: 44, fontWeight: 800 }}>Inflixo</div>
          )}
          <div style={{ fontSize: 30, opacity: 0.85 }}>{TAGLINE}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" } },
  );
}
