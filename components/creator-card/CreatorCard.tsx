"use client";

import { forwardRef } from "react";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { InflixoLogoIcon } from "@/components/shared/Logo";
import { QRCode } from "@/components/creator-card/QRCode";
import type { CardAppearance, CardLayoutType } from "@/components/creator-card/cardAppearance";

/** Card layout size in CSS px. Exported at 2x → 1080 × 1920 (9:16). */
export const CARD_WIDTH = 540;
export const CARD_HEIGHT = 960;
export const CARD_EXPORT_PIXEL_RATIO = 2;

export interface CreatorCardProps {
  displayName: string;
  username: string;
  category: string;
  /** Pre-resolved (data URL) photo, or null for the initials fallback. */
  photoSrc: string | null;
  /** Already formatted with formatCount(); null hides the fanbase block. */
  fanbase: string | null;
  profileUrl: string;
  appearance: CardAppearance;
  layout?: CardLayoutType;
  customMessage?: string;
}

const graphemeLength = (text: string) => {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)].length;
  }
  return [...text].length;
};

function nameFontSize(name: string, max = 40) {
  const len = graphemeLength(name);
  if (len <= 14) return max;
  if (len <= 20) return Math.round(max * 0.85);
  if (len <= 28) return Math.round(max * 0.72);
  return Math.round(max * 0.62);
}

// ─────────────────────────────────────────────────────────────
// Shared Micro Components
// ─────────────────────────────────────────────────────────────

function VerifiedCheckBadge({ color = "#043084", size = 26 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: "block" }}>
      <circle cx="12" cy="12" r="11" fill={color} />
      <path d="M7.5 12.2L10.5 15.2L16.5 9.2" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BarcodeStripe({ width = 180, height = 32, color = "#0F172A" }: { width?: number; height?: number; color?: string }) {
  const bars = [3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 2, 3, 1, 4, 1, 2, 3, 2, 1, 2, 4, 1, 3, 2, 1];
  return (
    <div style={{ display: "flex", gap: "2px", height, alignItems: "stretch", width, opacity: 0.8 }}>
      {bars.map((w, i) => (
        <div key={i} style={{ width: w * 2, background: color, borderRadius: 1 }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Layout 1: Classic Story
// ─────────────────────────────────────────────────────────────

const CLASSIC_COVER_HEIGHT = 196;
const CLASSIC_SHEET_OVERLAP = 36;
const CLASSIC_AVATAR_SIZE = 132;
const CLASSIC_QR_SIZE = 256;

function ClassicLayout({
  displayName,
  username,
  category,
  photoSrc,
  fanbase,
  profileUrl,
  appearance: a,
  customMessage,
}: CreatorCardProps) {
  const name = displayName.trim() || username;
  const handleSize = username.length > 22 ? 17 : 20;

  return (
    <div
      style={{
        position: "relative",
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        overflow: "hidden",
        background: a.coverBackground,
        color: a.primaryText,
        fontFamily: a.bodyFont,
        boxSizing: "border-box",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: `${CLASSIC_COVER_HEIGHT - CLASSIC_SHEET_OVERLAP}px 0 0 0`,
          background: a.bodyBackground,
          borderRadius: "36px 36px 0 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: `${CLASSIC_AVATAR_SIZE / 2 + 18}px 40px 26px`,
        }}
      >
        <h1
          style={{
            margin: 0,
            maxWidth: "100%",
            fontFamily: a.headingFont,
            fontWeight: Number(a.headingWeight) || 700,
            fontSize: nameFontSize(name),
            lineHeight: 1.18,
            letterSpacing: "-0.01em",
            color: a.primaryText,
            overflowWrap: "anywhere",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            paddingBottom: 2,
          }}
        >
          {name}
        </h1>

        <p
          style={{
            margin: "6px 0 0",
            maxWidth: "100%",
            fontSize: handleSize,
            fontWeight: 600,
            color: a.secondaryText,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          @{username}
        </p>

        {category && (
          <span
            style={{
              marginTop: 14,
              maxWidth: "88%",
              padding: "7px 16px",
              borderRadius: 999,
              background: a.chipBackground,
              border: `1px solid ${a.border}`,
              color: a.secondaryText,
              fontSize: 15,
              fontWeight: 600,
              lineHeight: 1.35,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {category}
          </span>
        )}

        <div style={{ flex: 1, minHeight: 16 }} />

        {fanbase && (
          <>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: a.mutedText,
              }}
            >
              Total Fanbase
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontFamily: a.headingFont,
                fontSize: 54,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: a.primaryText,
              }}
            >
              {fanbase}
            </p>
            <div style={{ flex: 1, minHeight: 16 }} />
          </>
        )}

        <div
          style={{
            padding: 10,
            borderRadius: a.radius,
            background: "#FFFFFF",
            boxShadow: a.isDark ? "none" : "0 10px 30px rgba(15, 23, 42, 0.08)",
            border: a.isDark ? "none" : "1px solid rgba(15, 23, 42, 0.06)",
          }}
        >
          <QRCode value={profileUrl} size={CLASSIC_QR_SIZE} />
        </div>

        <p style={{ margin: "16px 0 0", fontSize: 16, fontWeight: 600, color: a.secondaryText }}>
          {customMessage || "Scan to explore my world"}
        </p>
        <p
          style={{
            margin: "4px 0 0",
            maxWidth: "100%",
            fontSize: username.length > 22 ? 17 : 19,
            fontWeight: 700,
            color: a.primaryText,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          @{username}
        </p>

        <div style={{ flex: 1, minHeight: 14 }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 14,
              fontWeight: 800,
              color: a.primaryText,
              letterSpacing: "0.02em",
            }}
          >
            <InflixoLogoIcon color="color" className="h-4.5 w-4.5" />
            <span>Made with Inflixo</span>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 600,
              color: a.mutedText,
              letterSpacing: "0.03em",
            }}
          >
            Create your free Creator Card at <strong style={{ color: a.accent }}>inflixo.com</strong>
          </p>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: CLASSIC_COVER_HEIGHT - CLASSIC_SHEET_OVERLAP - CLASSIC_AVATAR_SIZE / 2,
          left: (CARD_WIDTH - CLASSIC_AVATAR_SIZE) / 2,
          width: CLASSIC_AVATAR_SIZE,
          height: CLASSIC_AVATAR_SIZE,
          borderRadius: "50%",
          padding: 5,
          background: a.bodyBackground,
          boxSizing: "border-box",
        }}
      >
        <CreatorAvatar
          src={photoSrc}
          name={name}
          className="h-full w-full rounded-full"
          textClassName="font-extrabold text-white"
          textStyle={{ fontSize: 44 }}
          style={{ background: a.accent, boxShadow: "none", borderColor: "transparent" }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Layout 2: Minimal Spotlight
// ─────────────────────────────────────────────────────────────

function MinimalLayout({
  displayName,
  username,
  category,
  photoSrc,
  fanbase,
  profileUrl,
  appearance: a,
  customMessage,
}: CreatorCardProps) {
  const name = displayName.trim() || username;
  const avatarSize = 142;

  return (
    <div
      style={{
        position: "relative",
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        overflow: "hidden",
        background: a.bodyBackground,
        color: a.primaryText,
        fontFamily: a.bodyFont,
        boxSizing: "border-box",
        WebkitFontSmoothing: "antialiased",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "44px 36px 36px",
      }}
    >
      {/* Top Header Tag */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: a.mutedText,
        }}
      >
        <InflixoLogoIcon color="current" className="h-4 w-4" style={{ color: a.accent }} />
        <span>Inflixo Creator Profile</span>
      </div>

      <div style={{ height: 26 }} />

      {/* Avatar with double ring and verified badge */}
      <div style={{ position: "relative", width: avatarSize, height: avatarSize }}>
        <div
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: "50%",
            padding: 5,
            background: a.isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.04)",
            border: `2px solid ${a.border}`,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              padding: 3,
              background: `linear-gradient(135deg, ${a.accent} 0%, rgba(255,255,255,0) 100%)`,
              boxSizing: "border-box",
            }}
          >
            <CreatorAvatar
              src={photoSrc}
              name={name}
              className="h-full w-full rounded-full"
              textClassName="font-extrabold text-white"
              textStyle={{ fontSize: 48 }}
              style={{ background: a.accent, boxShadow: "none", borderColor: "transparent" }}
            />
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 2, right: 2 }}>
          <VerifiedCheckBadge color={a.accent} size={30} />
        </div>
      </div>

      {/* Creator Info */}
      <div style={{ marginTop: 20, maxWidth: "100%" }}>
        <h1
          style={{
            margin: 0,
            fontFamily: a.headingFont,
            fontWeight: Number(a.headingWeight) || 700,
            fontSize: nameFontSize(name, 38),
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            color: a.primaryText,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </h1>

        <p
          style={{
            margin: "6px 0 0",
            fontSize: 18,
            fontWeight: 600,
            color: a.accent,
          }}
        >
          @{username}
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {category && (
            <span
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                background: a.chipBackground,
                border: `1px solid ${a.border}`,
                color: a.secondaryText,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {category}
            </span>
          )}
          {fanbase && (
            <span
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                background: a.isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(4, 48, 132, 0.08)",
                border: `1px solid ${a.border}`,
                color: a.primaryText,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              ✦ {fanbase} Fanbase
            </span>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 14 }} />

      {/* Floating Centerpiece QR Card */}
      <div
        style={{
          width: 320,
          padding: "24px 20px 20px",
          borderRadius: 28,
          background: "#FFFFFF",
          boxShadow: a.isDark
            ? "0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)"
            : "0 22px 60px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.05)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxSizing: "border-box",
        }}
      >
        <QRCode value={profileUrl} size={236} />
        <div style={{ height: 14 }} />
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
          {customMessage || "Point camera to scan"}
        </p>
        <p style={{ margin: "3px 0 0", fontSize: 12, fontWeight: 600, color: "#64748B" }}>
          inflixo.com/@{username}
        </p>
      </div>

      <div style={{ flex: 1, minHeight: 14 }} />

      {/* Minimal Footer */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontSize: 14,
            fontWeight: 800,
            color: a.primaryText,
          }}
        >
          <InflixoLogoIcon color="color" className="h-4.5 w-4.5" />
          <span>Inflixo Verified Creator</span>
        </div>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: a.mutedText }}>
          Claim your free card at <strong style={{ color: a.accent }}>inflixo.com</strong>
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Layout 3: VIP Pass / Event Badge
// ─────────────────────────────────────────────────────────────

function BadgeLayout({
  displayName,
  username,
  category,
  photoSrc,
  fanbase,
  profileUrl,
  appearance: a,
  customMessage,
}: CreatorCardProps) {
  const name = displayName.trim() || username;
  const avatarSize = 124;

  return (
    <div
      style={{
        position: "relative",
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        overflow: "hidden",
        background: a.isDark ? "#070B12" : "#F1F5F9",
        color: a.primaryText,
        fontFamily: a.bodyFont,
        boxSizing: "border-box",
        WebkitFontSmoothing: "antialiased",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* The Pass Frame */}
      <div
        style={{
          position: "relative",
          width: 492,
          height: 920,
          background: a.bodyBackground,
          borderRadius: 28,
          border: `2px solid ${a.border}`,
          boxShadow: a.isDark
            ? "0 25px 60px rgba(0, 0, 0, 0.7)"
            : "0 25px 60px rgba(15, 23, 42, 0.14)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top Lanyard Slot Cutout */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 14, paddingBottom: 10 }}>
          <div
            style={{
              width: 76,
              height: 12,
              borderRadius: 999,
              background: a.isDark ? "#03060A" : "#CBD5E1",
              border: `2px solid ${a.isDark ? "rgba(255,255,255,0.15)" : "#94A3B8"}`,
            }}
          />
        </div>

        {/* VIP Pass Header Ribbon */}
        <div
          style={{
            background: a.coverBackground,
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `2px solid ${a.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <InflixoLogoIcon color="white" className="h-4 w-4" />
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.2em", color: "#FFFFFF" }}>
              ALL ACCESS PASS
            </span>
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              padding: "3px 10px",
              borderRadius: 999,
              background: "#FFFFFF",
              color: "#0F172A",
              letterSpacing: "0.08em",
            }}
          >
            VIP 2026
          </span>
        </div>

        {/* Upper Pass Section */}
        <div
          style={{
            padding: "24px 32px 18px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {/* Avatar with VIP Squircle Frame */}
          <div
            style={{
              position: "relative",
              width: avatarSize,
              height: avatarSize,
              borderRadius: 32,
              padding: 4,
              background: `linear-gradient(135deg, ${a.accent} 0%, rgba(255,255,255,0.4) 100%)`,
              boxShadow: `0 10px 24px ${a.accentGlow || "rgba(0,0,0,0.15)"}`,
            }}
          >
            <div style={{ width: "100%", height: "100%", borderRadius: 28, overflow: "hidden" }}>
              <CreatorAvatar
                src={photoSrc}
                name={name}
                className="h-full w-full rounded-2xl"
                textClassName="font-extrabold text-white"
                textStyle={{ fontSize: 44 }}
                style={{ background: a.accent, boxShadow: "none", borderColor: "transparent" }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                top: -8,
                right: -8,
                padding: "3px 8px",
                borderRadius: 8,
                background: a.accent,
                color: "#FFFFFF",
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: "0.1em",
                boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
              }}
            >
              VIP
            </div>
          </div>

          {/* Name & Handle */}
          <h1
            style={{
              margin: "18px 0 0",
              fontFamily: a.headingFont,
              fontWeight: Number(a.headingWeight) || 800,
              fontSize: nameFontSize(name, 36),
              lineHeight: 1.15,
              color: a.primaryText,
              letterSpacing: "-0.01em",
            }}
          >
            {name}
          </h1>

          <p
            style={{
              margin: "4px 0 0",
              fontSize: 17,
              fontWeight: 700,
              color: a.secondaryText,
            }}
          >
            @{username}
          </p>

          {/* Side by side spec boxes */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              width: "100%",
              marginTop: 18,
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 14,
                background: a.chipBackground,
                border: `1px solid ${a.border}`,
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: a.mutedText, letterSpacing: "0.15em" }}>
                CATEGORY
              </div>
              <div style={{ marginTop: 2, fontSize: 14, fontWeight: 700, color: a.primaryText, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {category || "Creator"}
              </div>
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: 14,
                background: a.chipBackground,
                border: `1px solid ${a.border}`,
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: a.mutedText, letterSpacing: "0.15em" }}>
                FANBASE REACH
              </div>
              <div style={{ marginTop: 2, fontSize: 14, fontWeight: 800, color: a.accent }}>
                {fanbase || "Verified"}
              </div>
            </div>
          </div>
        </div>

        {/* Perforated Ticket Divider with side notches */}
        <div style={{ position: "relative", width: "100%", height: 32, display: "flex", alignItems: "center" }}>
          <div
            style={{
              position: "absolute",
              left: -16,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: a.isDark ? "#070B12" : "#F1F5F9",
              border: `2px solid ${a.border}`,
            }}
          />
          <div
            style={{
              position: "absolute",
              right: -16,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: a.isDark ? "#070B12" : "#F1F5F9",
              border: `2px solid ${a.border}`,
            }}
          />
          <div
            style={{
              width: "100%",
              margin: "0 28px",
              borderTop: `2px dashed ${a.border}`,
            }}
          />
        </div>

        {/* Bottom Ticket Stub (QR + Barcode) */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 32px 22px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              padding: 10,
              borderRadius: 20,
              background: "#FFFFFF",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <QRCode value={profileUrl} size={190} />
          </div>

          <p style={{ margin: "8px 0 0", fontSize: 13, fontWeight: 700, color: a.primaryText }}>
            {customMessage || "SCAN FOR LIVE BIO & PORTFOLIO"}
          </p>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginTop: 8 }}>
            <BarcodeStripe width={220} height={26} color={a.isDark ? "#FFFFFF" : "#0F172A"} />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: a.mutedText }}>
              PASS ID: #INF-{username.slice(0, 5).toUpperCase()}-2026
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: a.primaryText,
              }}
            >
              <InflixoLogoIcon color="color" className="h-4 w-4" />
              <span>Official Inflixo Creator Pass</span>
            </div>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: a.mutedText }}>
              CLAIM YOUR PASS AT INFLIXO.COM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Layout 4: Cyber Neon Glass
// ─────────────────────────────────────────────────────────────

function CyberCornerBrackets({ color = "#06B6D4" }: { color?: string }) {
  const s = 14;
  const b = "2.5px solid " + color;
  return (
    <>
      <div style={{ position: "absolute", top: -2, left: -2, width: s, height: s, borderTop: b, borderLeft: b, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: -2, right: -2, width: s, height: s, borderTop: b, borderRight: b, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -2, left: -2, width: s, height: s, borderBottom: b, borderLeft: b, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -2, right: -2, width: s, height: s, borderBottom: b, borderRight: b, pointerEvents: "none" }} />
    </>
  );
}

function CyberLayout({
  displayName,
  username,
  category,
  photoSrc,
  fanbase,
  profileUrl,
  appearance: a,
  customMessage,
}: CreatorCardProps) {
  const name = displayName.trim() || username;
  const avatarSize = 136;
  const cyan = "#06B6D4";
  const magenta = "#EC4899";

  return (
    <div
      style={{
        position: "relative",
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        overflow: "hidden",
        background: "#080614",
        color: "#FAF5FF",
        fontFamily: a.bodyFont,
        boxSizing: "border-box",
        WebkitFontSmoothing: "antialiased",
        padding: "28px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Ambient Glowing Orbs */}
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${cyan} 0%, rgba(6,182,212,0) 70%)`,
          opacity: 0.35,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -40,
          left: -40,
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${magenta} 0%, rgba(236,72,153,0) 70%)`,
          opacity: 0.35,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 300,
          left: 100,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, #7C3AED 0%, rgba(124,58,237,0) 70%)",
          opacity: 0.25,
          pointerEvents: "none",
        }}
      />

      {/* Cyber Glass HUD Card */}
      <div
        style={{
          position: "relative",
          width: 484,
          height: 904,
          borderRadius: 30,
          background: "rgba(15, 23, 42, 0.78)",
          border: "1px solid rgba(255, 255, 255, 0.16)",
          boxShadow: `0 0 50px rgba(6, 182, 212, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.25)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "28px 32px 26px",
          boxSizing: "border-box",
        }}
      >
        {/* Top Cyber System Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            fontSize: 11,
            fontFamily: "monospace",
            letterSpacing: "0.16em",
            color: cyan,
            borderBottom: "1px solid rgba(6, 182, 212, 0.25)",
            paddingBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981" }} />
            <span>CYBER ID // VERIFIED</span>
          </div>
          <span>SYS.ONLINE</span>
        </div>

        <div style={{ height: 26 }} />

        {/* Neon Halo Avatar */}
        <div
          style={{
            position: "relative",
            width: avatarSize,
            height: avatarSize,
            borderRadius: "50%",
            padding: 4,
            background: `linear-gradient(135deg, ${cyan} 0%, ${magenta} 100%)`,
            boxShadow: `0 0 30px rgba(6, 182, 212, 0.5), 0 0 15px rgba(236, 72, 153, 0.5)`,
          }}
        >
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden" }}>
            <CreatorAvatar
              src={photoSrc}
              name={name}
              className="h-full w-full rounded-full"
              textClassName="font-extrabold text-white"
              textStyle={{ fontSize: 44 }}
              style={{ background: "#1E1035", boxShadow: "none", borderColor: "transparent" }}
            />
          </div>
        </div>

        {/* Identity */}
        <h1
          style={{
            margin: "20px 0 0",
            fontFamily: a.headingFont,
            fontWeight: 800,
            fontSize: nameFontSize(name, 38),
            lineHeight: 1.15,
            color: "#FFFFFF",
            letterSpacing: "-0.01em",
            textShadow: "0 0 20px rgba(255, 255, 255, 0.3)",
          }}
        >
          {name}
        </h1>

        <p
          style={{
            margin: "6px 0 0",
            fontSize: 18,
            fontWeight: 700,
            color: cyan,
            letterSpacing: "0.04em",
          }}
        >
          @{username}
        </p>

        {/* Cyber Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, flexWrap: "wrap", justifyContent: "center" }}>
          {category && (
            <span
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                background: "rgba(6, 182, 212, 0.12)",
                border: "1px solid rgba(6, 182, 212, 0.4)",
                color: "#E0F2FE",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              {category}
            </span>
          )}
          {fanbase && (
            <span
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                background: "rgba(236, 72, 153, 0.15)",
                border: "1px solid rgba(236, 72, 153, 0.4)",
                color: "#FCE7F3",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.05em",
              }}
            >
              [ REACH: {fanbase} ]
            </span>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 14 }} />

        {/* QR Section with Cyber Brackets */}
        <div style={{ position: "relative" }}>
          <CyberCornerBrackets color={cyan} />
          <div
            style={{
              padding: 12,
              borderRadius: 20,
              background: "#FFFFFF",
              boxShadow: "0 0 30px rgba(6, 182, 212, 0.3)",
            }}
          >
            <QRCode value={profileUrl} size={210} />
          </div>
        </div>

        <p
          style={{
            margin: "16px 0 0",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.14em",
            fontFamily: "monospace",
            color: cyan,
          }}
        >
          {customMessage ? `// ${customMessage.toUpperCase()}` : "INITIALIZING SCAN // EXPLORE BIO"}
        </p>

        <div style={{ flex: 1, minHeight: 14 }} />

        {/* Cyber Footer */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.14em",
              color: cyan,
            }}
          >
            <InflixoLogoIcon color="current" className="h-4 w-4" style={{ color: cyan }} />
            <span>INFLIXO CYBER CREATOR NETWORK</span>
          </div>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255, 255, 255, 0.6)" }}>
            LAUNCH YOUR CREATOR HUB AT INFLIXO.COM
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Layout 5: Editorial Luxe (High-Fashion Magazine)
// ─────────────────────────────────────────────────────────────

function EditorialLayout({
  displayName,
  username,
  category,
  photoSrc,
  fanbase,
  profileUrl,
  appearance: a,
  customMessage,
}: CreatorCardProps) {
  const name = displayName.trim() || username;
  const avatarSize = 132;

  return (
    <div
      style={{
        position: "relative",
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        overflow: "hidden",
        background: a.bodyBackground,
        color: a.primaryText,
        fontFamily: a.bodyFont,
        boxSizing: "border-box",
        WebkitFontSmoothing: "antialiased",
        padding: "24px",
      }}
    >
      {/* Editorial Double Border */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 20,
          border: `1.5px solid ${a.border}`,
          padding: "28px 24px 22px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        {/* Magazine Masthead */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: a.mutedText,
            borderBottom: `1.5px solid ${a.border}`,
            paddingBottom: 10,
          }}
        >
          <span>THE CREATOR ISSUE</span>
          <span>VOL. 2026</span>
        </div>

        <div style={{ marginTop: 14 }}>
          <div
            style={{
              fontFamily: "ui-serif, Georgia, Cambria, serif",
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: "0.14em",
              lineHeight: 1,
              color: a.primaryText,
            }}
          >
            INFLIXO
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: a.accent,
            }}
          >
            OFFICIAL EDITORIAL SPOTLIGHT
          </div>
        </div>

        <div style={{ height: 22 }} />

        {/* Editorial Framed Avatar */}
        <div
          style={{
            position: "relative",
            width: avatarSize,
            height: avatarSize,
            borderRadius: "50%",
            padding: 5,
            border: `2px solid ${a.accent}`,
            boxShadow: `0 12px 30px ${a.accentGlow || "rgba(0,0,0,0.12)"}`,
          }}
        >
          <CreatorAvatar
            src={photoSrc}
            name={name}
            className="h-full w-full rounded-full"
            textClassName="font-extrabold text-white"
            textStyle={{ fontSize: 44 }}
            style={{ background: a.accent, boxShadow: "none", borderColor: "transparent" }}
          />
        </div>

        {/* Name in Editorial Serif */}
        <div style={{ marginTop: 18, maxWidth: "100%" }}>
          <h1
            style={{
              margin: 0,
              fontFamily: "ui-serif, Georgia, Cambria, serif",
              fontWeight: 700,
              fontSize: nameFontSize(name, 38),
              lineHeight: 1.15,
              color: a.primaryText,
              letterSpacing: "-0.01em",
            }}
          >
            {name}
          </h1>

          <p
            style={{
              margin: "4px 0 0",
              fontSize: 17,
              fontWeight: 600,
              color: a.accent,
              fontStyle: "italic",
            }}
          >
            @{username}
          </p>

          <p
            style={{
              margin: "8px 0 0",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: a.secondaryText,
            }}
          >
            {category ? `${category} · Verified Creator` : "Verified Inflixo Creator"}
          </p>
        </div>

        <div style={{ flex: 1, minHeight: 12 }} />

        {fanbase && (
          <div
            style={{
              padding: "6px 18px",
              borderRadius: 999,
              background: a.chipBackground,
              border: `1px solid ${a.border}`,
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "0.12em",
              color: a.primaryText,
            }}
          >
            ✦ {fanbase} AUDIENCE REACH ✦
          </div>
        )}

        <div style={{ flex: 1, minHeight: 12 }} />

        {/* Minimalist QR Feature */}
        <div
          style={{
            padding: 12,
            borderRadius: 16,
            background: "#FFFFFF",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            border: `1.5px solid ${a.border}`,
          }}
        >
          <QRCode value={profileUrl} size={198} />
        </div>

        <p
          style={{
            margin: "12px 0 0",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: a.mutedText,
          }}
        >
          {customMessage || "Scan to view bio & portfolio"}
        </p>

        <div style={{ flex: 1, minHeight: 12 }} />

        {/* Luxury Signature */}
        <div
          style={{
            width: "100%",
            borderTop: `1.5px solid ${a.border}`,
            paddingTop: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 11,
            fontWeight: 700,
            color: a.mutedText,
            letterSpacing: "0.08em",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <InflixoLogoIcon color="color" className="h-3.5 w-3.5" />
            <span style={{ fontWeight: 800, color: a.primaryText }}>INFLIXO CURATED</span>
          </div>
          <span>Create yours at <strong style={{ color: a.accent }}>inflixo.com</strong></span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Master CreatorCard Component
// ─────────────────────────────────────────────────────────────

export const CreatorCard = forwardRef<HTMLDivElement, CreatorCardProps>(function CreatorCard(
  props,
  ref
) {
  const layout = props.layout || "classic";

  return (
    <div
      ref={ref}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {layout === "minimal" && <MinimalLayout {...props} />}
      {layout === "badge" && <BadgeLayout {...props} />}
      {layout === "cyber" && <CyberLayout {...props} />}
      {layout === "editorial" && <EditorialLayout {...props} />}
      {layout === "classic" && <ClassicLayout {...props} />}
    </div>
  );
});
