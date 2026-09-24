"use client";

import { forwardRef } from "react";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { InflixoLogoIcon } from "@/components/shared/Logo";
import { QRCode } from "@/components/creator-card/QRCode";
import type { CardAppearance } from "@/components/creator-card/cardAppearance";

/** Card layout size in CSS px. Exported at 2x → 1080 × 1920 (9:16). */
export const CARD_WIDTH = 540;
export const CARD_HEIGHT = 960;
export const CARD_EXPORT_PIXEL_RATIO = 2;

const COVER_HEIGHT = 196;
const SHEET_OVERLAP = 36;
const AVATAR_SIZE = 132;
const QR_SIZE = 256;

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
}

const graphemeLength = (text: string) => {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)].length;
  }
  return [...text].length;
};

function nameFontSize(name: string) {
  const len = graphemeLength(name);
  if (len <= 14) return 40;
  if (len <= 20) return 34;
  if (len <= 28) return 29;
  return 25;
}

export const CreatorCard = forwardRef<HTMLDivElement, CreatorCardProps>(function CreatorCard(
  { displayName, username, category, photoSrc, fanbase, profileUrl, appearance: a },
  ref
) {
  const name = displayName.trim() || username;
  const handleSize = username.length > 22 ? 17 : 20;

  return (
    <div
      ref={ref}
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
      {/* Body sheet: every piece of text sits on this opaque surface, never on a photo. */}
      <div
        style={{
          position: "absolute",
          inset: `${COVER_HEIGHT - SHEET_OVERLAP}px 0 0 0`,
          background: a.bodyBackground,
          borderRadius: "36px 36px 0 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: `${AVATAR_SIZE / 2 + 18}px 40px 26px`,
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

        {/* QR tile: fixed white surface, independent of theme. */}
        <div
          style={{
            padding: 10,
            borderRadius: a.radius,
            background: "#FFFFFF",
            boxShadow: a.isDark ? "none" : "0 10px 30px rgba(15, 23, 42, 0.08)",
            border: a.isDark ? "none" : "1px solid rgba(15, 23, 42, 0.06)",
          }}
        >
          <QRCode value={profileUrl} size={QR_SIZE} />
        </div>

        <p style={{ margin: "16px 0 0", fontSize: 16, fontWeight: 500, color: a.secondaryText }}>
          Scan to explore my world
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
            alignItems: "center",
            gap: 7,
            fontSize: 13,
            fontWeight: 700,
            color: a.mutedText,
          }}
        >
          <InflixoLogoIcon color="current" className="h-4 w-4" />
          <span>Made with Inflixo</span>
        </div>
      </div>

      {/* Avatar straddles the cover / sheet edge. */}
      <div
        style={{
          position: "absolute",
          top: COVER_HEIGHT - SHEET_OVERLAP - AVATAR_SIZE / 2,
          left: (CARD_WIDTH - AVATAR_SIZE) / 2,
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
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
});
