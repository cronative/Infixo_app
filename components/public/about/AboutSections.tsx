"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, Globe, Languages, MapPin, PenLine } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  PinterestIcon,
  SnapchatIcon,
  SpotifyIcon,
  ThreadsIcon,
  TwitchIcon,
  XTwitterIcon,
  YoutubeIcon,
} from "@/components/shared/BrandIcons";
import { formatFans } from "@/lib/creatorEra";

export interface AboutColors {
  primary?: string;
  secondary?: string;
  muted?: string;
  headingFont?: string;
}

// ── Platform order (same everywhere: Instagram → YouTube → Facebook → others) ──

export const PLATFORM_ORDER = ["instagram", "youtube", "facebook"];
export const platformRank = (platform: string) => {
  const i = PLATFORM_ORDER.indexOf((platform || "").toLowerCase());
  return i === -1 ? PLATFORM_ORDER.length : i;
};

// ── Brand colours ─────────────────────────────────────────────

const IG_GRADIENT = "linear-gradient(45deg, #FEDA75 0%, #FA7E1E 25%, #D62976 50%, #962FBF 75%, #4F5BD5 100%)";
export const PLATFORM_BRAND: Record<string, { bg: string; bar: string; label: string; ink?: string }> = {
  instagram: { bg: IG_GRADIENT, bar: "linear-gradient(90deg, #FA7E1E 0%, #D62976 50%, #962FBF 100%)", label: "Instagram" },
  youtube: { bg: "#FF0000", bar: "#FF0000", label: "YouTube" },
  facebook: { bg: "#1877F2", bar: "#1877F2", label: "Facebook" },
  twitter: { bg: "#000000", bar: "#000000", label: "X" },
  linkedin: { bg: "#0A66C2", bar: "#0A66C2", label: "LinkedIn" },
  threads: { bg: "#000000", bar: "#000000", label: "Threads" },
  snapchat: { bg: "#FFFC00", bar: "#FFFC00", label: "Snapchat", ink: "#000000" },
  pinterest: { bg: "#E60023", bar: "#E60023", label: "Pinterest" },
  twitch: { bg: "#9146FF", bar: "#9146FF", label: "Twitch" },
  spotify: { bg: "#1DB954", bar: "#1DB954", label: "Spotify" },
};

function Glyph({ platform, size }: { platform: string; size: number }) {
  const p = { width: size, height: size };
  switch (platform) {
    case "instagram": return <InstagramIcon {...p} />;
    case "youtube": return <YoutubeIcon {...p} />;
    case "facebook": return <FacebookIcon {...p} />;
    case "twitter": return <XTwitterIcon {...p} />;
    case "linkedin": return <LinkedinIcon {...p} />;
    case "threads": return <ThreadsIcon {...p} />;
    case "snapchat": return <SnapchatIcon {...p} />;
    case "pinterest": return <PinterestIcon {...p} />;
    case "twitch": return <TwitchIcon {...p} />;
    case "spotify": return <SpotifyIcon {...p} />;
    default: return <Globe {...p} />;
  }
}

/** Brand-colour tile with a white glyph (IG gradient, YT red, FB blue…). */
export function BrandPlatformIcon({ platform, size = 32 }: { platform: string; size?: number }) {
  const p = platform.toLowerCase();
  const brand = PLATFORM_BRAND[p];
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[6px]"
      style={{ width: size, height: size, background: brand?.bg ?? "#71717A", color: brand?.ink ?? "#FFFFFF" }}
      aria-hidden
    >
      <Glyph platform={p} size={Math.round(size * 0.55)} />
    </span>
  );
}

// ── Section (one style for every public block) ───────────────

/** Bordered 5px card on the theme card surface; clips its rows. */
export const SECTION_CARD = "overflow-hidden rounded-[5px] border border-(--surface-border) bg-(--card-bg) text-left";
/** A body row: 12px 16px padding, ≥44px tap height, primary @ 4% hover. */
export const SECTION_ROW = "min-h-11 px-4 py-3";
export const SECTION_ROW_HOVER = "transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_4%,transparent)]";

/** Header row: primary @ 7% tint, 12px 16px padding, 15px title + 12px subtitle left, 12px count right, 1px divider. */
export function AboutHeader({ title, subtitle, count, colors }: { title: string; subtitle?: string; count?: ReactNode; colors: AboutColors }) {
  return (
    <div
      className="flex items-end justify-between gap-3 border-b border-(--surface-border) px-4 py-3"
      style={{ backgroundColor: "color-mix(in srgb, var(--accent) 7%, transparent)" }}
    >
      <div className="min-w-0">
        <h2 style={{ color: colors.primary, fontFamily: colors.headingFont }} className="text-[15px] font-semibold leading-5 tracking-tight text-(--text)">
          {title}
        </h2>
        {subtitle && (
          <p style={{ color: colors.muted }} className="mt-0.5 text-xs leading-[18px] text-(--text-muted)">
            {subtitle}
          </p>
        )}
      </div>
      {count != null && (
        <span style={{ color: colors.muted }} className="shrink-0 pb-px text-xs text-(--text-muted)">
          {count}
        </span>
      )}
    </div>
  );
}

const CARD = SECTION_CARD;

/**
 * The one public-page Section: tinted header + connected body on the card surface.
 * `divided` puts 1px lines between body rows.
 */
export function Section({
  title,
  subtitle,
  count,
  colors,
  divided = true,
  bodyClassName = "",
  children,
  id,
  className = "",
}: {
  title: string;
  subtitle?: string;
  count?: ReactNode;
  colors: AboutColors;
  divided?: boolean;
  bodyClassName?: string;
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={`${CARD} ${className}`}>
      <AboutHeader title={title} subtitle={subtitle} count={count} colors={colors} />
      <div className={`${divided ? "divide-y divide-(--surface-border)" : ""} ${bodyClassName}`}>{children}</div>
    </section>
  );
}

// ── 1. About me ───────────────────────────────────────────────

export function AboutMeBlock({
  bio,
  location,
  languages,
  tags,
  colors,
  ownerPreview,
  showHeader = true,
}: {
  /** Rendered bio (e.g. ExpandableText) or null when empty. */
  bio: ReactNode | null;
  location?: string | null;
  languages?: string[];
  tags?: string[];
  colors: AboutColors;
  /** Dashboard preview: show an "Add bio" nudge instead of hiding. */
  ownerPreview?: boolean;
  showHeader?: boolean;
}) {
  if (!bio) {
    if (!ownerPreview) return null;
    return (
      <div className={`${CARD} border-dashed p-3.5`}>
        <p style={{ color: colors.primary }} className="text-[13px] font-semibold text-(--text)">About me</p>
        <p style={{ color: colors.muted }} className="mt-0.5 text-xs text-(--text-muted)">
          Fans see this first. Add a short bio about you and what you create.
        </p>
        <Link
          href="/dashboard/profile?edit=details"
          className="mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-[5px] bg-(--accent) px-3 text-xs font-semibold text-white hover:opacity-90"
        >
          <PenLine className="h-3.5 w-3.5" />
          Add bio
        </Link>
      </div>
    );
  }
  const langs = (languages ?? []).filter(Boolean);
  const chips = (tags ?? []).filter(Boolean);
  return (
    <div className={CARD}>
      {showHeader && <AboutHeader title="About me" subtitle="Get to know me" colors={colors} />}
      <div className="space-y-2.5 px-4 py-3">
        {bio}
        {(location || langs.length > 0) && (
          <div style={{ color: colors.muted }} className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-(--text-muted)">
            {location && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{location}</span>
              </span>
            )}
            {langs.length > 0 && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <Languages className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{langs.join(", ")}</span>
              </span>
            )}
          </div>
        )}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((t) => (
              <span
                key={t}
                style={{ color: colors.secondary }}
                className="rounded-[5px] border border-(--surface-border) bg-(--surface) px-2 py-0.5 text-[11.5px] font-medium text-(--text-secondary)"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 2. Fanbase by platform ────────────────────────────────────

const unitFor = (platform: string, unit?: string) =>
  (unit || (platform === "youtube" ? "subscribers" : "followers")).toLowerCase();

export function FanbaseByPlatform({
  items,
  total,
  colors,
}: {
  items: { platform: string; label?: string; handle?: string; count: number; unit?: string }[];
  /** Combined total shown in the header — pass the same number the profile header shows. */
  total?: number;
  colors: AboutColors;
}) {
  const rows = items.filter((i) => i.count > 0).sort((a, b) => platformRank(a.platform) - platformRank(b.platform));
  const sum = rows.reduce((s, r) => s + r.count, 0);
  if (sum === 0) return null;
  return (
    <div className={CARD}>
      <AboutHeader title="Fanbase by platform" subtitle="Primary accounts only." count={`${formatFans(total && total > 0 ? total : sum)} total`} colors={colors} />
      <ul className="divide-y divide-(--surface-border)">
        {rows.map((r) => {
          const p = r.platform.toLowerCase();
          const handle = (r.handle || "").replace(/^@/, "");
          return (
            <li key={p} className={`flex items-center gap-2.5 ${SECTION_ROW} py-2.5 ${SECTION_ROW_HOVER}`}>
              <BrandPlatformIcon platform={p} size={28} />
              <div className="min-w-0 flex-1">
                <p style={{ color: colors.primary }} className="truncate text-[13px] font-medium leading-[18px] text-(--text)">
                  {PLATFORM_BRAND[p]?.label ?? r.label ?? p}
                </p>
                {handle && (
                  <p style={{ color: colors.muted }} className="truncate text-xs leading-4 text-(--text-muted)">@{handle}</p>
                )}
              </div>
              <span style={{ color: colors.muted }} className="shrink-0 text-right text-xs tabular-nums text-(--text-muted)">
                <span style={{ color: colors.primary }} className="text-[13px] font-semibold text-(--text)">{formatFans(r.count)}</span> {unitFor(p, r.unit)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── 3. Social accounts ────────────────────────────────────────

export interface AboutSocialItem {
  id?: string | number;
  platform: string;
  handle: string;
  url: string;
  count?: number;
  unit?: string;
  isPrimary?: boolean;
  label?: string;
}

export function SocialAccountsBlock({
  groups,
  total,
  colors,
  onLinkClick,
  showHeader = true,
  collapsedCount = 3,
}: {
  groups: { groupTitle: string | null; items: AboutSocialItem[] }[];
  total: number;
  colors: AboutColors;
  /** Return false to cancel navigation (e.g. dashboard preview). */
  onLinkClick?: (item: AboutSocialItem) => boolean;
  showHeader?: boolean;
  /** Rows shown before "Show all". */
  collapsedCount?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const handleOf = (item: AboutSocialItem) => {
    const raw = (item.handle || item.label || "").replace(/^@/, "");
    return item.platform === "spotify" && raw.toLowerCase() === "spotify" ? "Spotify Artist" : `@${raw}`;
  };
  const click = (item: AboutSocialItem) => (e: React.MouseEvent) => {
    if (onLinkClick && onLinkClick(item) === false) e.preventDefault();
  };

  // One flat divided list: a small muted "INSTAGRAM · 3" label row per platform, then its accounts.
  type Row = { kind: "label"; key: string; text: string } | { kind: "item"; key: string; item: AboutSocialItem };
  const rows: Row[] = [];
  let shownItems = 0;
  for (const [gi, group] of groups.entries()) {
    const items = group.items;
    if (items.length === 0) continue;
    if (!expanded && shownItems >= collapsedCount) break;
    const p = items[0].platform;
    const name = PLATFORM_BRAND[p]?.label ?? (group.groupTitle || p);
    rows.push({ kind: "label", key: `l-${gi}`, text: `${name} · ${items.length}` });
    for (const [i, item] of items.entries()) {
      if (!expanded && shownItems >= collapsedCount) break;
      rows.push({ kind: "item", key: String(item.id ?? `${item.platform}-${item.handle}-${i}`), item });
      shownItems += 1;
    }
  }
  const totalItems = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className={CARD}>
      {showHeader && <AboutHeader title="Find me elsewhere" subtitle="My other channels & profiles" count={`${total} more`} colors={colors} />}
      <ul className="divide-y divide-(--surface-border)">
        {rows.map((row) =>
          row.kind === "label" ? (
            <li key={row.key} style={{ color: colors.muted }} className="px-4 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-(--text-muted)">
              {row.text}
            </li>
          ) : (
            <li key={row.key}>
              <a
                href={row.item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={click(row.item)}
                className={`group flex items-center gap-2.5 ${SECTION_ROW} py-2.5 ${SECTION_ROW_HOVER}`}
                title={`Open ${handleOf(row.item)} on ${PLATFORM_BRAND[row.item.platform]?.label ?? row.item.platform}`}
              >
                <BrandPlatformIcon platform={row.item.platform} size={22} />
                <span style={{ color: colors.primary }} className="min-w-0 flex-1 truncate text-[13px] font-medium text-(--text)">
                  {handleOf(row.item)}
                </span>
                <ArrowUpRight style={{ color: colors.muted }} className="h-4 w-4 shrink-0 text-(--text-muted) transition-colors group-hover:text-(--text)" />
              </a>
            </li>
          )
        )}
        {totalItems > collapsedCount && (
          <li>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className={`flex w-full items-center justify-center gap-1 ${SECTION_ROW} py-2.5 text-[13px] font-semibold text-(--accent-text) ${SECTION_ROW_HOVER} cursor-pointer`}
            >
              {expanded ? "Show less" : `Show all (${totalItems})`}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
