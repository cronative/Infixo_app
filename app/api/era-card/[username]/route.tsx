import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { getCreatorEra, calculateTotalFanbase, formatFans } from "@/lib/creatorEra";
import { formatCount } from "@/utils/format";
import { getThemeDefinition } from "@/themes/config";
import { resolveThemeKey } from "@/lib/themeKeys";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  props: { params: Promise<{ username: string }> }
) {
  const { username } = await props.params;
  const cleanUser = decodeURIComponent(username || "").replace(/^@/, "").trim().toLowerCase();

  let displayName = "Creator";
  let handle = cleanUser || "creator";
  let photoUrl = "";
  let themeKey = "inflixo-maroon";
  let peakFanbase: number | null = null;
  let currentFanbase: number | null = null;

  try {
    const [creators]: any = await db.query(
      "SELECT id, username, display_name, photo_url, theme_key, peak_fanbase FROM creators WHERE LOWER(username) = ? OR username = ? OR LOWER(username) = ?",
      [cleanUser, username, `@${cleanUser}`]
    );

    if (creators && creators.length > 0) {
      const c = creators[0];
      displayName = c.display_name || cleanUser;
      handle = c.username || cleanUser;
      photoUrl = c.photo_url || "";
      themeKey = c.theme_key || "inflixo-maroon";
      peakFanbase = c.peak_fanbase !== null && c.peak_fanbase !== undefined ? Number(c.peak_fanbase) : null;

      const [socials]: any = await db.query(
        "SELECT platform, username, follower_count, audience_count FROM social_accounts WHERE creator_id = ?",
        [c.id]
      );
      currentFanbase = calculateTotalFanbase(socials);
    }
  } catch (err) {
    console.error("Era card DB fetch error:", err);
  }

  const effectiveFanbase = Math.max(peakFanbase ?? 0, currentFanbase ?? 0);
  const era = getCreatorEra(effectiveFanbase) || {
    era: "Rising",
    stage: "Bronze",
    badge: "Rising Bronze",
    min: 0,
    max: 99,
    nextMilestone: 100,
  };

  const themeDef = getThemeDefinition(resolveThemeKey(themeKey));
  const accentColor = themeDef?.tokens?.["--accent"] || "#7A2253";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1080px",
          height: "1920px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "100px 80px",
          background: "linear-gradient(170deg, #1e0513 0%, #0d0208 55%, #180410 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Glow ambient circle */}
        <div
          style={{
            position: "absolute",
            top: "35%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "700px",
            height: "700px",
            borderRadius: "50%",
            background: accentColor,
            opacity: 0.18,
            filter: "blur(120px)",
          }}
        />

        {/* TOP BAR */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: accentColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "26px",
                color: "#ffffff",
              }}
            >
              I
            </div>
            <div style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.03em" }}>
              INFLIXO
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 22px",
              borderRadius: "999px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              background: "rgba(255, 255, 255, 0.05)",
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: "#fbcfe8",
            }}
          >
            ✦ OFFICIAL CREATOR ERA
          </div>
        </div>

        {/* CENTER CONTENT */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            width: "100%",
            zIndex: 10,
          }}
        >
          {/* Avatar Ring */}
          <div
            style={{
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              padding: "6px",
              background: `linear-gradient(135deg, #fbcfe8, ${accentColor})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "36px",
            }}
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={displayName}
                style={{
                  width: "188px",
                  height: "188px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "188px",
                  height: "188px",
                  borderRadius: "50%",
                  background: "#2a0d1d",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "68px",
                  fontWeight: 900,
                  color: "#fbcfe8",
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div style={{ fontSize: "34px", fontWeight: 700, color: "#ffffff", marginBottom: "8px" }}>
            {displayName}
          </div>
          <div style={{ fontSize: "24px", color: "rgba(255, 255, 255, 0.6)", marginBottom: "48px" }}>
            @{handle}
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: "22px",
              fontWeight: 800,
              letterSpacing: "0.25em",
              color: "#f472b6",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            ENTERING THE
          </div>

          {/* Big Era Name */}
          <div
            style={{
              fontSize: "116px",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: "1.0",
              color: "#ffffff",
              textTransform: "uppercase",
              marginBottom: "20px",
              textShadow: "0 0 60px rgba(244, 114, 182, 0.35)",
            }}
          >
            {era.badge}
          </div>

          <div
            style={{
              fontSize: "36px",
              fontWeight: 800,
              letterSpacing: "0.2em",
              color: "#e2e8f0",
              marginBottom: "48px",
            }}
          >
            ERA ✨
          </div>

          {/* Fanbase Metric Box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "20px 42px",
              borderRadius: "16px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              fontSize: "28px",
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            <span style={{ color: "#f472b6", fontSize: "32px", fontWeight: 900 }}>
              {formatFans(effectiveFanbase)}
            </span>
            <span>fans across IG · YT · FB</span>
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            paddingTop: "40px",
            borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            fontSize: "22px",
            color: "rgba(255, 255, 255, 0.7)",
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 600 }}>
            inflixo.com/{handle}
          </div>
          <div style={{ fontWeight: 800, color: "#fbcfe8", letterSpacing: "0.05em" }}>
            #MyCreatorEra
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
    }
  );
}
