"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, AtSign, ChevronDown, User, UsersRound, Languages, MapPin, PenLine } from "lucide-react";
import {
  BrandPlatformIcon,
  PLATFORM_BRAND,
  SECTION_CARD,
  SECTION_ROW,
  SECTION_ROW_HOVER,
  SectionCard,
  type SectionColors,
} from "@/components/public/ui";
import { formatFans } from "@/lib/creatorEra";

/** Moved to the shared library; re-exported for existing imports. */
export { LockedRow } from "@/components/public/ui";

/** @deprecated Use SectionColors from components/public/ui. */
export type AboutColors = SectionColors;

// ── Platform order (same everywhere: Instagram → YouTube → Facebook → others) ──

export const PLATFORM_ORDER = ["instagram", "youtube", "facebook"];
export const platformRank = (platform: string) => {
  const i = PLATFORM_ORDER.indexOf((platform || "").toLowerCase());
  return i === -1 ? PLATFORM_ORDER.length : i;
};

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
      <div className={`${SECTION_CARD} border-dashed p-3.5`}>
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
    <SectionCard icon={User} title="About Me" subtitle="A little about who I am." colors={colors} showHeader={showHeader}>
      <div className="space-y-2.5 px-4 py-3">
        {bio}
        {(location || langs.length > 0) && (
          <div style={{ color: colors.muted }} className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-(--text-muted)">
            {location && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="break-words">{location}</span>
              </span>
            )}
            {langs.length > 0 && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <Languages className="h-3.5 w-3.5 shrink-0" />
                <span className="break-words">{langs.join(", ")}</span>
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
                className="rounded-[5px] border border-(--surface-border) bg-(--surface) px-2 py-0.5 text-[12px] font-medium text-(--text-secondary)"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </SectionCard>
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
    <SectionCard icon={UsersRound} title="My Community" subtitle="All of you, on every platform." count={`${formatFans(total && total > 0 ? total : sum)} total`} colors={colors}>
      <ul className="divide-y divide-(--surface-border)">
        {rows.map((r) => {
          const p = r.platform.toLowerCase();
          const handle = (r.handle || "").replace(/^@/, "");
          return (
            <li key={p} className={`flex items-center gap-2.5 ${SECTION_ROW} py-2.5 ${SECTION_ROW_HOVER}`}>
              <BrandPlatformIcon platform={p} size={28} />
              <div className="min-w-0 flex-1">
                <p style={{ color: colors.primary }} className="break-words text-[13px] font-medium leading-[18px] text-(--text)">
                  {PLATFORM_BRAND[p]?.label ?? r.label ?? p}
                </p>
                {handle && (
                  <p style={{ color: colors.muted }} className="break-all text-xs leading-4 text-(--text-muted)">@{handle}</p>
                )}
              </div>
              <span style={{ color: colors.muted }} className="shrink-0 text-right text-xs tabular-nums text-(--text-muted)">
                <span style={{ color: colors.primary }} className="text-[13px] font-semibold text-(--text)">{formatFans(r.count)}</span> {unitFor(p, r.unit)}
              </span>
            </li>
          );
        })}
      </ul>
    </SectionCard>
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
  lockedCount = 0,
}: {
  groups: { groupTitle: string | null; items: AboutSocialItem[] }[];
  lockedCount?: number;
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
    <SectionCard icon={AtSign} title="More of Me" subtitle="My other channels & pages." count={`${total} more`} colors={colors} showHeader={showHeader} lockedCount={lockedCount}>
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
                <span style={{ color: colors.primary }} className="min-w-0 flex-1 break-all text-[13px] font-medium text-(--text)">
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
    </SectionCard>
  );
}
