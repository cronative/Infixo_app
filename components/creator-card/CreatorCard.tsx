"use client";

import { forwardRef, type CSSProperties, type ReactNode } from "react";
import { Award, BadgeCheck } from "lucide-react";
import { QRCode } from "@/components/creator-card/QRCode";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  PinterestIcon,
  SnapchatIcon,
  SpotifyIcon,
  ThreadsIcon,
  TiktokIcon,
  TwitchIcon,
  XTwitterIcon,
  YoutubeIcon,
} from "@/components/shared/BrandIcons";
import { formatFans, type EraStage } from "@/lib/creatorEra";
import { getInitials } from "@/lib/avatar";
import type { CardAppearance, CardLayoutType } from "@/components/creator-card/cardAppearance";

/** Card layout size in CSS px. Exported at 2x → 1080 × 1920 (9:16) or 1080 × 1080 (1:1). */
export const CARD_WIDTH = 540;
export const CARD_HEIGHT = 960;
export const CARD_EXPORT_PIXEL_RATIO = 2;
/** 9:16 top/bottom safe zone (110 CSS px = 220 px at 1080 export). Only decoration lives here. */
export const CARD_SAFE_ZONE = 110;

export type CardAspect = "portrait" | "square";
export const cardHeightFor = (aspect: CardAspect) => (aspect === "square" ? CARD_WIDTH : CARD_HEIGHT);

export type CardPlatform =
  | "instagram"
  | "youtube"
  | "facebook"
  | "tiktok"
  | "twitter"
  | "linkedin"
  | "threads"
  | "snapchat"
  | "pinterest"
  | "twitch"
  | "spotify";

export interface CreatorCardAssets {
  /** Same-origin data URLs (see useExportableAsset) so they survive PNG export. */
  wordmark: string | null;
  wordmarkWhite: string | null;
  icon: string | null;
}

export interface CreatorCardStats {
  fans: number;
  series: number;
  products: number;
  links: number;
}

export interface CreatorCardEra {
  badge: string;
  stage: EraStage;
}

export interface CreatorCardProps {
  displayName: string;
  username: string;
  /** Content tags, already joined: "Vlogger · Podcaster". */
  tags: string;
  /** Pre-resolved (data URL) photo, or null for the initials fallback. */
  photoSrc: string | null;
  profileUrl: string;
  appearance: CardAppearance;
  layout?: CardLayoutType;
  aspect?: CardAspect;
  tagline: string;
  platforms: CardPlatform[];
  verified: boolean;
  era: CreatorCardEra | null;
  stats: CreatorCardStats;
  assets: CreatorCardAssets;
}

// ─────────────────────────────────────────────────────────────
// Colour helpers (theme accents are hex; anything else passes through)
// ─────────────────────────────────────────────────────────────

function hexRgb(color: string): [number, number, number] | null {
  const m = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function alpha(color: string, a: number) {
  const rgb = hexRgb(color);
  if (!rgb) return `color-mix(in srgb, ${color} ${Math.round(a * 100)}%, transparent)`;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;
}

function mixWhite(color: string, t: number) {
  const rgb = hexRgb(color);
  if (!rgb) return color;
  const [r, g, b] = rgb.map((v) => Math.round(v + (255 - v) * t));
  return `rgb(${r}, ${g}, ${b})`;
}

function luminance(color: string) {
  const rgb = hexRgb(color);
  if (!rgb) return 0.3;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const accentOnLight = (c: string) => (luminance(c) > 0.5 ? "#18181B" : c);
const accentOnDark = (c: string) => (luminance(c) < 0.2 ? mixWhite(c, 0.5) : c);

const graphemeLength = (text: string) => {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)].length;
  }
  return [...text].length;
};

function nameFontSize(name: string, max: number) {
  const len = graphemeLength(name);
  if (len <= 12) return max;
  if (len <= 18) return Math.round(max * 0.86);
  if (len <= 24) return Math.round(max * 0.74);
  if (len <= 32) return Math.round(max * 0.64);
  return Math.round(max * 0.56);
}

const SERIF = "ui-serif, Georgia, Cambria, 'Times New Roman', serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

// Same colours the public profile uses for the Creator Era pill.
const ERA_COLORS: Record<EraStage, { icon: string; bg: string; text: string; border: string }> = {
  Bronze: { icon: "#C2410C", bg: "#FFE4D6", text: "#9A3412", border: "#FED7AA" },
  Silver: { icon: "#64748B", bg: "#F1F5F9", text: "#475569", border: "#E2E8F0" },
  Gold: { icon: "#D97706", bg: "#FEF3C7", text: "#B45309", border: "#FDE68A" },
};

const PLATFORM_ICONS: Record<CardPlatform, (p: { width: number; height: number }) => ReactNode> = {
  instagram: (p) => <InstagramIcon {...p} />,
  youtube: (p) => <YoutubeIcon {...p} />,
  facebook: (p) => <FacebookIcon {...p} />,
  tiktok: (p) => <TiktokIcon {...p} />,
  twitter: (p) => <XTwitterIcon {...p} />,
  linkedin: (p) => <LinkedinIcon {...p} />,
  threads: (p) => <ThreadsIcon {...p} />,
  snapchat: (p) => <SnapchatIcon {...p} />,
  pinterest: (p) => <PinterestIcon {...p} />,
  twitch: (p) => <TwitchIcon {...p} />,
  spotify: (p) => <SpotifyIcon {...p} />,
};

// ─────────────────────────────────────────────────────────────
// Skin: the per-style visual tokens. Every style renders the same blocks.
// ─────────────────────────────────────────────────────────────

interface Skin {
  text: string;
  sub: string;
  muted: string;
  accent: string;
  heading: string;
  body: string;
  weight: number;
  logoWhite: boolean;
  label?: CSSProperties;
  name?: CSSProperties;
  nameMax: number;
  avatarShape: "circle" | "arch" | "squircle";
  avatarRing: CSSProperties;
  initialsBg: string;
  initialsText: string;
  tag: CSSProperties;
  statWrap: CSSProperties;
  statCell: CSSProperties;
  statValue: CSSProperties;
  statLabel: CSSProperties;
  statDivider?: string;
  qrTile: CSSProperties;
  url?: CSSProperties;
  tagline?: CSSProperties;
}

function buildSkin(layout: CardLayoutType, a: CardAppearance): Skin {
  const dark = a.isDark;
  const accent = dark ? accentOnDark(a.accent) : accentOnLight(a.accent);
  const base: Skin = {
    text: a.primaryText,
    sub: a.secondaryText,
    muted: a.mutedText,
    accent,
    heading: a.headingFont,
    body: a.bodyFont,
    weight: Number(a.headingWeight) || 700,
    logoWhite: dark,
    nameMax: 36,
    avatarShape: "circle",
    avatarRing: { padding: 5, background: a.bodyBackground, boxShadow: `0 0 0 2px ${alpha(a.accent, 0.35)}` },
    initialsBg: alpha(a.accent, dark ? 0.25 : 0.12),
    initialsText: accent,
    tag: {
      padding: "6px 16px",
      borderRadius: 999,
      background: a.chipBackground,
      border: `1px solid ${a.border}`,
      color: a.secondaryText,
    },
    statWrap: {},
    statCell: {
      padding: "12px 6px",
      borderRadius: 16,
      background: a.chipBackground,
      border: `1px solid ${a.border}`,
    },
    statValue: { fontFamily: a.headingFont, fontWeight: 800, color: a.primaryText },
    statLabel: { color: a.mutedText },
    qrTile: {
      borderRadius: 14,
      boxShadow: dark ? `0 0 0 1px ${a.border}` : "0 8px 24px rgba(15, 23, 42, 0.10), 0 0 0 1px rgba(15, 23, 42, 0.06)",
    },
  };

  switch (layout) {
    case "minimal":
      return {
        ...base,
        nameMax: 38,
        label: { color: a.mutedText, letterSpacing: "0.26em" },
        avatarRing: { padding: 6, background: "transparent", border: `2px solid ${alpha(a.accent, 0.5)}` },
        tag: { padding: 0, background: "transparent", border: "none", color: a.secondaryText, fontWeight: 600 },
        statWrap: { borderTop: `1px solid ${a.border}`, borderBottom: `1px solid ${a.border}`, padding: "14px 0" },
        statCell: { padding: "2px 6px" },
        statDivider: a.border,
        statValue: { fontFamily: a.headingFont, fontWeight: 700, color: a.primaryText },
      };
    case "badge":
      return {
        ...base,
        label: { color: accent, letterSpacing: "0.22em" },
        statCell: {
          padding: "12px 6px",
          borderRadius: 12,
          border: `1.5px dashed ${alpha(a.accent, 0.45)}`,
          background: alpha(a.accent, dark ? 0.1 : 0.05),
        },
      };
    case "cyber": {
      const neon = accentOnDark(a.accent);
      return {
        ...base,
        text: "#F5F7FF",
        sub: "rgba(235, 240, 255, 0.78)",
        muted: "rgba(220, 228, 255, 0.6)",
        accent: neon,
        logoWhite: true,
        label: { color: neon, fontFamily: MONO, letterSpacing: "0.24em", textShadow: `0 0 12px ${alpha(a.accent, 0.8)}` },
        name: { textShadow: `0 0 24px ${alpha(a.accent, 0.45)}` },
        avatarShape: "squircle",
        avatarRing: {
          padding: 4,
          background: `linear-gradient(135deg, ${neon}, ${alpha(a.accent, 0.2)})`,
          boxShadow: `0 0 28px ${alpha(a.accent, 0.55)}`,
        },
        initialsBg: "#0B0E1A",
        initialsText: neon,
        tag: {
          padding: "6px 14px",
          borderRadius: 8,
          background: "rgba(255, 255, 255, 0.05)",
          border: `1px solid ${alpha(a.accent, 0.45)}`,
          color: "rgba(235, 240, 255, 0.85)",
          fontFamily: MONO,
        },
        statCell: {
          padding: "12px 6px",
          borderRadius: 12,
          background: "rgba(255, 255, 255, 0.045)",
          border: `1px solid ${alpha(a.accent, 0.4)}`,
          boxShadow: `inset 0 0 18px ${alpha(a.accent, 0.12)}`,
        },
        statValue: { fontFamily: a.headingFont, fontWeight: 800, color: "#FFFFFF", textShadow: `0 0 14px ${alpha(a.accent, 0.85)}` },
        statLabel: { color: neon, fontFamily: MONO },
        qrTile: { borderRadius: 12, boxShadow: `0 0 0 2px ${neon}, 0 0 26px ${alpha(a.accent, 0.6)}` },
        url: { color: neon, fontFamily: MONO },
      };
    }
    case "editorial":
      return {
        ...base,
        heading: SERIF,
        weight: 600,
        nameMax: 42,
        label: { color: a.secondaryText, fontFamily: SERIF, letterSpacing: "0.32em", fontWeight: 600 },
        name: { letterSpacing: "-0.015em" },
        avatarShape: "arch",
        avatarRing: { padding: 6, background: "transparent", border: `1.5px solid ${alpha(a.accent, 0.6)}` },
        tag: { padding: 0, background: "transparent", border: "none", color: accent, fontStyle: "italic", fontFamily: SERIF, fontWeight: 500 },
        statWrap: { borderTop: `1px solid ${a.primaryText}`, borderBottom: `1px solid ${a.primaryText}`, padding: "14px 0" },
        statCell: { padding: "2px 6px" },
        statDivider: alpha(a.primaryText, 0.25) as string,
        statValue: { fontFamily: SERIF, fontWeight: 600, fontStyle: "italic", color: a.primaryText },
        statLabel: { color: a.mutedText, letterSpacing: "0.12em", textTransform: "uppercase" },
        qrTile: { borderRadius: 4, boxShadow: `0 0 0 1px ${a.border}` },
        url: { fontFamily: SERIF, fontStyle: "italic" },
        tagline: { fontFamily: SERIF, fontStyle: "italic", fontWeight: 500 },
      };
    default:
      return base;
  }
}

// ─────────────────────────────────────────────────────────────
// Shared content blocks (identical content in every style)
// ─────────────────────────────────────────────────────────────

const P: CSSProperties = { margin: 0 };

function Header({ skin, assets, compact }: { skin: Skin; assets: CreatorCardAssets; compact?: boolean }) {
  const logo = skin.logoWhite ? assets.wordmarkWhite : assets.wordmark;
  const h = compact ? 24 : 28;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="Inflixo" style={{ height: h, width: "auto", display: "block" }} />
      ) : (
        <span style={{ fontFamily: skin.heading, fontWeight: 800, fontSize: h * 0.8, color: skin.text }}>Inflixo</span>
      )}
      <span style={{ width: 1.5, height: h * 0.7, background: skin.muted, opacity: 0.45 }} />
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          color: skin.accent,
          ...skin.label,
        }}
      >
        My Creator Journey
      </span>
    </div>
  );
}

function Avatar({ skin, photoSrc, name, size, verified }: { skin: Skin; photoSrc: string | null; name: string; size: number; verified: boolean }) {
  const height = skin.avatarShape === "arch" ? Math.round(size * 1.18) : size;
  const radius =
    skin.avatarShape === "circle" ? "50%" : skin.avatarShape === "squircle" ? size * 0.3 : `${size / 2}px ${size / 2}px 14px 14px`;
  const ringPad = Number(skin.avatarRing.padding ?? 0);
  const outerRadius =
    skin.avatarShape === "circle"
      ? "50%"
      : skin.avatarShape === "squircle"
        ? size * 0.3 + ringPad
        : `${size / 2 + ringPad}px ${size / 2 + ringPad}px ${14 + ringPad}px ${14 + ringPad}px`;
  const tick = Math.round(size * 0.24);

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{ borderRadius: outerRadius, ...skin.avatarRing }}>
        <div style={{ width: size, height, borderRadius: radius, overflow: "hidden", background: skin.initialsBg }}>
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: skin.heading,
                fontWeight: 800,
                fontSize: Math.round(size * 0.36),
                color: skin.initialsText,
              }}
            >
              {getInitials(name)}
            </div>
          )}
        </div>
      </div>
      {verified && (
        <span
          aria-label="Verified creator"
          style={{
            position: "absolute",
            right: skin.avatarShape === "circle" ? Math.round(size * 0.02) : -Math.round(tick * 0.25),
            bottom: skin.avatarShape === "circle" ? Math.round(size * 0.02) : -Math.round(tick * 0.25),
            width: tick + 6,
            height: tick + 6,
            borderRadius: "50%",
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.18)",
          }}
        >
          <BadgeCheck width={tick} height={tick} fill="#1877F2" color="#FFFFFF" strokeWidth={2.2} />
        </span>
      )}
    </div>
  );
}

function Socials({ platforms, color, size = 22, justify = "center" }: { platforms: CardPlatform[]; color: string; size?: number; justify?: CSSProperties["justifyContent"] }) {
  if (platforms.length === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: justify, gap: 16, color, flexWrap: "wrap" }}>
      {platforms.map((p) => (
        <span key={p} style={{ display: "flex" }}>
          {PLATFORM_ICONS[p]({ width: size, height: size })}
        </span>
      ))}
    </div>
  );
}

interface IdentityProps {
  skin: Skin;
  props: CreatorCardProps;
  avatarSize: number;
  compact?: boolean;
}

function NameBlock({ skin, props, align, maxSize }: { skin: Skin; props: CreatorCardProps; align: "center" | "left"; maxSize: number }) {
  const name = props.displayName.trim() || props.username;
  return (
    <>
      <h1
        style={{
          ...P,
          maxWidth: "100%",
          fontFamily: skin.heading,
          fontWeight: skin.weight,
          fontSize: nameFontSize(name, maxSize),
          lineHeight: 1.15,
          letterSpacing: "-0.01em",
          color: skin.text,
          overflowWrap: "anywhere",
          textAlign: align,
          ...skin.name,
        }}
      >
        {name}
      </h1>
      <p
        style={{
          ...P,
          marginTop: 8,
          maxWidth: "100%",
          lineHeight: 1.3,
          fontSize: props.username.length > 22 ? 16 : 18,
          fontWeight: 600,
          color: skin.sub,
          overflowWrap: "anywhere",
          textAlign: align,
        }}
      >
        @{props.username}
      </p>
    </>
  );
}

function Tags({ skin, tags }: { skin: Skin; tags: string }) {
  if (!tags) return null;
  return (
    <span style={{ display: "inline-block", maxWidth: "100%", fontSize: 15, fontWeight: 600, lineHeight: 1.35, overflowWrap: "anywhere", ...skin.tag }}>
      {tags}
    </span>
  );
}

function StoryIdentity({ skin, props, avatarSize }: IdentityProps) {
  const name = props.displayName.trim() || props.username;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "100%" }}>
      <Avatar skin={skin} photoSrc={props.photoSrc} name={name} size={avatarSize} verified={props.verified} />
      <div style={{ height: 14 }} />
      <NameBlock skin={skin} props={props} align="center" maxSize={skin.nameMax} />
      {props.platforms.length > 0 && <div style={{ height: 12 }} />}
      <Socials platforms={props.platforms} color={skin.text} />
      {props.tags && <div style={{ height: 12 }} />}
      <Tags skin={skin} tags={props.tags} />
    </div>
  );
}

function CompactIdentity({ skin, props, avatarSize }: IdentityProps) {
  const name = props.displayName.trim() || props.username;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, width: "100%", minWidth: 0 }}>
      <Avatar skin={skin} photoSrc={props.photoSrc} name={name} size={avatarSize} verified={props.verified} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0, flex: 1, gap: 8 }}>
        <div>
          <NameBlock skin={skin} props={props} align="left" maxSize={Math.round(skin.nameMax * 0.72)} />
        </div>
        <Socials platforms={props.platforms} color={skin.text} size={20} justify="flex-start" />
        <Tags skin={skin} tags={props.tags} />
      </div>
    </div>
  );
}

function EraChip({ era }: { era: CreatorCardEra | null }) {
  if (!era) return null;
  const c = ERA_COLORS[era.stage] ?? ERA_COLORS.Gold;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 18px 8px 14px",
        borderRadius: 999,
        background: c.bg,
        border: `1.5px solid ${c.border}`,
        color: c.text,
        fontSize: 16,
        fontWeight: 700,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
      }}
    >
      <Award width={20} height={20} color={c.icon} strokeWidth={2.2} />
      <span>{era.badge}</span>
    </div>
  );
}

function statItems(stats: CreatorCardStats) {
  return [
    { label: "Total Fans", n: stats.fans, value: formatFans(stats.fans) },
    { label: "Series", n: stats.series, value: String(stats.series) },
    { label: "Products", n: stats.products, value: String(stats.products) },
    { label: "Links", n: stats.links, value: String(stats.links) },
  ].filter((s) => s.n > 0);
}

/** Single-row grid of the non-zero stats; value size shrinks to fit the column width. */
function Stats({ skin, stats, width, compact }: { skin: Skin; stats: CreatorCardStats; width: number; compact?: boolean }) {
  const items = statItems(stats);
  if (items.length === 0) return null;
  const gap = skin.statDivider ? 0 : 8;
  const cellW = (width - gap * (items.length - 1)) / items.length;
  const base = compact ? 30 : items.length >= 4 ? 30 : items.length === 3 ? 34 : 40;
  const longest = Math.max(...items.map((i) => i.value.length));
  const valueSize = Math.max(18, Math.min(base, Math.floor((cellW - 14) / (longest * 0.64))));

  return (
    <div style={{ width, display: "grid", gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, gap, ...skin.statWrap }}>
      {items.map((item, i) => (
        <div
          key={item.label}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 0,
            ...skin.statCell,
            ...(skin.statDivider && i > 0 ? { borderLeft: `1px solid ${skin.statDivider}` } : null),
          }}
        >
          <span style={{ fontSize: valueSize, lineHeight: 1.1, letterSpacing: "-0.01em", whiteSpace: "nowrap", ...skin.statValue }}>{item.value}</span>
          <span style={{ marginTop: 4, fontSize: 14, fontWeight: 600, lineHeight: 1.2, whiteSpace: "nowrap", ...skin.statLabel }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

const QR_SIZE = Math.round(CARD_WIDTH * 0.25);

function QrTile({ skin, profileUrl }: { skin: Skin; profileUrl: string }) {
  return (
    <div style={{ flexShrink: 0, overflow: "hidden", background: "#FFFFFF", lineHeight: 0, ...skin.qrTile }}>
      <QRCode value={profileUrl} size={QR_SIZE} />
    </div>
  );
}

function Tagline({ skin, text, align }: { skin: Skin; text: string; align: "left" | "center" }) {
  if (!text) return null;
  return (
    <p style={{ ...P, fontSize: 18, fontWeight: 600, lineHeight: 1.35, color: skin.text, overflowWrap: "anywhere", textAlign: align, ...skin.tagline }}>
      {text}
    </p>
  );
}

function UrlLine({ skin, username, align, size = 16 }: { skin: Skin; username: string; align: "left" | "center"; size?: number }) {
  return (
    <p style={{ ...P, fontSize: size, fontWeight: 700, lineHeight: 1.3, color: skin.accent, overflowWrap: "anywhere", textAlign: align, ...skin.url }}>
      inflixo.com/
      <wbr />
      {username}
    </p>
  );
}

/** Tagline (5) + QR & profile URL (6) as one row in the 9:16 layouts. */
function QrRow({ skin, props }: { skin: Skin; props: CreatorCardProps }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, width: "100%" }}>
      <QrTile skin={skin} profileUrl={props.profileUrl} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0, flex: 1 }}>
        <Tagline skin={skin} text={props.tagline} align="left" />
        <UrlLine skin={skin} username={props.username} align="left" />
      </div>
    </div>
  );
}

function Footer({ skin, assets }: { skin: Skin; assets: CreatorCardAssets }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: skin.muted, fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>
      {assets.icon && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={assets.icon} alt="" style={{ width: 22, height: 22, borderRadius: 6, display: "block" }} />
      )}
      <span>
        Create yours at <span style={{ color: skin.text, fontWeight: 800 }}>inflixo.com</span>
      </span>
    </div>
  );
}

const Spacer = ({ min = 12 }: { min?: number }) => <div style={{ flex: 1, minHeight: min }} />;

// ─────────────────────────────────────────────────────────────
// Composition: 9:16 story stack and 1:1 compact grid
// ─────────────────────────────────────────────────────────────

interface StackOptions {
  width: number;
  avatarSize: number;
  /** Wraps the header (e.g. Classic's white pill). */
  header?: (node: ReactNode) => ReactNode;
  /** Extra decoration rendered directly under the header (e.g. Editorial rules). */
  afterHeader?: ReactNode;
  headerGap?: number;
  qrWrap?: CSSProperties;
}

function StoryStack({ skin, props, o }: { skin: Skin; props: CreatorCardProps; o: StackOptions }) {
  const header = <Header skin={skin} assets={props.assets} />;
  return (
    <>
      {o.header ? o.header(header) : header}
      {o.afterHeader}
      <div style={{ height: o.headerGap ?? 28, flexShrink: 0 }} />
      <StoryIdentity skin={skin} props={props} avatarSize={o.avatarSize} />
      {props.era && <div style={{ height: 16, flexShrink: 0 }} />}
      <EraChip era={props.era} />
      <Spacer min={16} />
      <Stats skin={skin} stats={props.stats} width={o.width} />
      <Spacer min={16} />
      <div style={{ width: "100%", ...o.qrWrap }}>
        <QrRow skin={skin} props={props} />
      </div>
      <Spacer min={14} />
      <Footer skin={skin} assets={props.assets} />
    </>
  );
}

function SquareStack({ skin, props, width, header }: { skin: Skin; props: CreatorCardProps; width: number; header?: (n: ReactNode) => ReactNode }) {
  const h = <Header skin={skin} assets={props.assets} compact />;
  return (
    <>
      {header ? header(h) : h}
      <Spacer min={12} />
      <div style={{ display: "flex", gap: 22, width: "100%", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
          <CompactIdentity skin={skin} props={props} avatarSize={84} compact />
          <EraChip era={props.era} />
          <Tagline skin={skin} text={props.tagline} align="left" />
        </div>
        <div style={{ width: QR_SIZE, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <QrTile skin={skin} profileUrl={props.profileUrl} />
          <UrlLine skin={skin} username={props.username} align="center" size={14} />
        </div>
      </div>
      <Spacer min={10} />
      <Stats skin={skin} stats={props.stats} width={width} compact />
      <Spacer min={8} />
      <Footer skin={skin} assets={props.assets} />
    </>
  );
}

function contentBox(square: boolean, padX: number, extra?: CSSProperties): CSSProperties {
  return {
    position: "absolute",
    left: padX,
    right: padX,
    top: square ? 26 : CARD_SAFE_ZONE,
    bottom: square ? 24 : CARD_SAFE_ZONE,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    ...extra,
  };
}

function Shell({ a, height, background, children }: { a: CardAppearance; height: number; background: string; children: ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        width: CARD_WIDTH,
        height,
        overflow: "hidden",
        background,
        color: a.primaryText,
        fontFamily: a.bodyFont,
        boxSizing: "border-box",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {children}
    </div>
  );
}

const layer = (style: CSSProperties) => <div aria-hidden style={{ position: "absolute", pointerEvents: "none", ...style }} />;

// ─────────────────────────────────────────────────────────────
// 1. Classic Story — cover band, overlapping sheet
// ─────────────────────────────────────────────────────────────

function ClassicLayout(props: CreatorCardProps & { height: number; square: boolean }) {
  const a = props.appearance;
  const skin = buildSkin("classic", a);
  const pad = props.square ? 28 : 40;
  const sheetTop = props.square ? 82 : 250;
  const pill = (node: ReactNode) => (
    <div style={{ padding: "8px 18px", borderRadius: 999, background: "rgba(255, 255, 255, 0.95)", boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)" }}>
      {node}
    </div>
  );
  const pillSkin: Skin = { ...skin, logoWhite: false, text: "#0F172A", muted: "#64748B", accent: accentOnLight(a.accent) };
  const header = (_: ReactNode) => pill(<Header skin={pillSkin} assets={props.assets} compact={props.square} />);

  return (
    <Shell a={a} height={props.height} background={a.bodyBackground}>
      {layer({ inset: `0 0 auto 0`, height: sheetTop + 40, background: a.coverBackground })}
      {layer({ top: -120, right: -90, width: 300, height: 300, borderRadius: "50%", background: "rgba(255, 255, 255, 0.10)" })}
      {layer({ top: 60, left: -70, width: 180, height: 180, borderRadius: "50%", background: "rgba(255, 255, 255, 0.07)" })}
      {layer({ inset: `${sheetTop}px 0 0 0`, background: a.bodyBackground, borderRadius: "34px 34px 0 0" })}
      <div style={contentBox(props.square, pad)}>
        {props.square ? (
          <SquareStack skin={skin} props={props} width={CARD_WIDTH - pad * 2} header={header} />
        ) : (
          <StoryStack
            skin={skin}
            props={props}
            o={{
              width: CARD_WIDTH - pad * 2,
              avatarSize: 118,
              header,
              headerGap: 22,
              qrWrap: { padding: 16, borderRadius: 22, background: a.chipBackground, border: `1px solid ${a.border}`, boxSizing: "border-box" },
            }}
          />
        )}
      </div>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. Minimal Spotlight — airy, soft accent halo, hairlines
// ─────────────────────────────────────────────────────────────

function MinimalLayout(props: CreatorCardProps & { height: number; square: boolean }) {
  const a = props.appearance;
  const skin = buildSkin("minimal", a);
  const pad = props.square ? 30 : 48;
  return (
    <Shell a={a} height={props.height} background={a.bodyBackground}>
      {layer({
        top: props.square ? -160 : -80,
        left: "50%",
        width: 560,
        height: 560,
        marginLeft: -280,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${alpha(a.accent, a.isDark ? 0.32 : 0.18)} 0%, transparent 65%)`,
      })}
      {layer({
        bottom: -220,
        left: "50%",
        width: 620,
        height: 420,
        marginLeft: -310,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${alpha(a.accent, a.isDark ? 0.2 : 0.1)} 0%, transparent 70%)`,
      })}
      <div style={contentBox(props.square, pad)}>
        {props.square ? (
          <SquareStack skin={skin} props={props} width={CARD_WIDTH - pad * 2} />
        ) : (
          <StoryStack skin={skin} props={props} o={{ width: CARD_WIDTH - pad * 2, avatarSize: 124, headerGap: 34 }} />
        )}
      </div>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. VIP Pass — lanyard, pass body + tear-off stub
// ─────────────────────────────────────────────────────────────

function VipLayout(props: CreatorCardProps & { height: number; square: boolean }) {
  const a = props.appearance;
  const skin = buildSkin("badge", a);
  const passBg = a.bodyBackground;
  const passShadow = "0 24px 60px rgba(0, 0, 0, 0.28)";
  const stripes = "repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0 2px, transparent 2px 16px)";
  const outer = (children: ReactNode) => (
    <Shell a={a} height={props.height} background={a.coverBackground}>
      {layer({ inset: 0, background: stripes })}
      {children}
    </Shell>
  );

  if (props.square) {
    const pad = 18;
    const inner = CARD_WIDTH - pad * 2 - 40;
    return outer(
      <div
        style={{
          position: "absolute",
          inset: pad,
          borderRadius: 26,
          background: passBg,
          boxShadow: passShadow,
          padding: "20px 20px 14px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxSizing: "border-box",
        }}
      >
        {layer({ top: 0, left: 26, right: 26, height: 5, borderRadius: "0 0 6px 6px", background: alpha(a.accent, 0.8) })}
        <SquareStack skin={skin} props={props} width={inner} />
      </div>
    );
  }

  const side = 30;
  const passTop = CARD_SAFE_ZONE - 6;
  const inner = CARD_WIDTH - side * 2 - 52;
  return outer(
    <>
      {/* Lanyard strap + clip, decoration only in the safe zone */}
      {layer({ top: 0, left: "50%", width: 58, marginLeft: -29, height: passTop - 6, background: "rgba(255, 255, 255, 0.22)", borderLeft: "1px solid rgba(255,255,255,0.35)", borderRight: "1px solid rgba(255,255,255,0.35)" })}
      {layer({ top: passTop - 26, left: "50%", width: 34, height: 34, marginLeft: -17, borderRadius: "50%", border: "5px solid #D4D4D8", background: "transparent", boxShadow: "0 2px 6px rgba(0,0,0,0.25)" })}
      <div style={{ position: "absolute", left: side, right: side, top: passTop, bottom: CARD_SAFE_ZONE - 6, display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            position: "relative",
            flex: 1,
            borderRadius: "26px 26px 16px 16px",
            background: passBg,
            boxShadow: passShadow,
            padding: "34px 26px 22px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {layer({ top: 14, left: "50%", width: 64, height: 10, marginLeft: -32, borderRadius: 6, background: alpha(a.primaryText, 0.14) })}
          <Header skin={skin} assets={props.assets} />
          <div style={{ height: 24 }} />
          <StoryIdentity skin={skin} props={props} avatarSize={112} />
          {props.era && <div style={{ height: 14 }} />}
          <EraChip era={props.era} />
          <Spacer min={14} />
          <Stats skin={skin} stats={props.stats} width={inner} />
        </div>
        <div
          style={{
            position: "relative",
            borderRadius: "16px 16px 26px 26px",
            background: passBg,
            boxShadow: passShadow,
            padding: "18px 26px 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          {layer({ top: -5, left: 18, right: 18, borderTop: `2px dashed ${alpha(a.primaryText, 0.18)}` })}
          <QrRow skin={skin} props={props} />
          <Footer skin={skin} assets={props.assets} />
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. Cyber Neon — dark base, neon glow from theme accent, HUD frame
// ─────────────────────────────────────────────────────────────

function HudCorners({ color, inset }: { color: string; inset: CSSProperties }) {
  const arm = 26;
  const s = (pos: CSSProperties, borders: CSSProperties) =>
    layer({ width: arm, height: arm, ...pos, ...borders, filter: `drop-shadow(0 0 6px ${color})` });
  const b = `2px solid ${color}`;
  return (
    <div aria-hidden style={{ position: "absolute", ...inset, pointerEvents: "none" }}>
      {s({ top: 0, left: 0 }, { borderTop: b, borderLeft: b })}
      {s({ top: 0, right: 0 }, { borderTop: b, borderRight: b })}
      {s({ bottom: 0, left: 0 }, { borderBottom: b, borderLeft: b })}
      {s({ bottom: 0, right: 0 }, { borderBottom: b, borderRight: b })}
    </div>
  );
}

function CyberLayout(props: CreatorCardProps & { height: number; square: boolean }) {
  const a = props.appearance;
  const skin = buildSkin("cyber", a);
  const base = a.isDark ? a.bodyBackground : `linear-gradient(180deg, #070912 0%, #0B0D1C 100%)`;
  const pad = props.square ? 30 : 40;
  const grid = `linear-gradient(${alpha(a.accent, 0.09)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(a.accent, 0.09)} 1px, transparent 1px)`;
  const hudInset: CSSProperties = props.square
    ? { top: 12, left: 12, right: 12, bottom: 12 }
    : { top: CARD_SAFE_ZONE - 16, left: 18, right: 18, bottom: CARD_SAFE_ZONE - 16 };

  return (
    <Shell a={a} height={props.height} background={`radial-gradient(120% 60% at 0% 0%, ${alpha(a.accent, 0.38)} 0%, transparent 55%), radial-gradient(110% 55% at 100% 100%, ${alpha(a.accent, 0.3)} 0%, transparent 55%), ${base}`}>
      {layer({ inset: 0, backgroundImage: grid, backgroundSize: "36px 36px", opacity: 0.9 })}
      {layer({ inset: 0, background: "repeating-linear-gradient(180deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 4px)" })}
      <HudCorners color={skin.accent} inset={hudInset} />
      <div style={contentBox(props.square, pad)}>
        {props.square ? (
          <SquareStack skin={skin} props={props} width={CARD_WIDTH - pad * 2} />
        ) : (
          <StoryStack
            skin={skin}
            props={props}
            o={{
              width: CARD_WIDTH - pad * 2,
              avatarSize: 118,
              headerGap: 26,
              qrWrap: {
                padding: 16,
                borderRadius: 16,
                background: "rgba(255, 255, 255, 0.04)",
                border: `1px solid ${alpha(a.accent, 0.35)}`,
                boxSizing: "border-box",
              },
            }}
          />
        )}
      </div>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. Editorial Luxe — magazine masthead, serif, hairline rules
// ─────────────────────────────────────────────────────────────

function EditorialLayout(props: CreatorCardProps & { height: number; square: boolean }) {
  const a = props.appearance;
  const skin = buildSkin("editorial", a);
  const pad = props.square ? 30 : 44;
  const rule = (mt: number) => (
    <div style={{ width: "100%", marginTop: mt, flexShrink: 0 }}>
      <div style={{ height: 1, background: a.primaryText }} />
      <div style={{ height: 3 }} />
      <div style={{ height: 1, background: alpha(a.primaryText, 0.35) }} />
    </div>
  );
  return (
    <Shell a={a} height={props.height} background={a.bodyBackground}>
      {layer({ inset: 0, background: `linear-gradient(180deg, ${alpha(a.accent, a.isDark ? 0.16 : 0.08)} 0%, transparent 30%, transparent 72%, ${alpha(a.accent, a.isDark ? 0.14 : 0.07)} 100%)` })}
      {!props.square && layer({ top: 48, left: pad, right: pad, height: 1, background: alpha(a.primaryText, 0.25) })}
      {!props.square && layer({ bottom: 48, left: pad, right: pad, height: 1, background: alpha(a.primaryText, 0.25) })}
      {layer({ top: props.square ? -60 : 70, right: -80, width: 240, height: 240, borderRadius: "50%", border: `1px solid ${alpha(a.accent, 0.25)}` })}
      <div style={contentBox(props.square, pad)}>
        {props.square ? (
          <SquareStack skin={skin} props={props} width={CARD_WIDTH - pad * 2} />
        ) : (
          <StoryStack skin={skin} props={props} o={{ width: CARD_WIDTH - pad * 2, avatarSize: 112, afterHeader: rule(14), headerGap: 24 }} />
        )}
      </div>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────

export const CreatorCard = forwardRef<HTMLDivElement, CreatorCardProps>(function CreatorCard(
  { layout = "classic", aspect = "portrait", ...rest },
  ref
) {
  const height = cardHeightFor(aspect);
  const props = { ...rest, layout, aspect, height, square: aspect === "square" };
  return (
    <div ref={ref} style={{ width: CARD_WIDTH, height }}>
      {layout === "minimal" && <MinimalLayout {...props} />}
      {layout === "badge" && <VipLayout {...props} />}
      {layout === "cyber" && <CyberLayout {...props} />}
      {layout === "editorial" && <EditorialLayout {...props} />}
      {layout === "classic" && <ClassicLayout {...props} />}
    </div>
  );
});
