"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Globe, Languages, MapPin, PenLine } from "lucide-react";
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

// ── Light section header ──────────────────────────────────────

/** Title + subtitle + count on a subtle theme tint, 1px divider below; body stays plain. */
export function AboutHeader({ title, subtitle, count, colors }: { title: string; subtitle?: string; count?: ReactNode; colors: AboutColors }) {
  return (
    <div
      className="flex items-end justify-between gap-3 border-b border-(--surface-border) px-3 pb-2 pt-2.5 sm:px-3.5"
      style={{ backgroundColor: "color-mix(in srgb, var(--accent) 7%, transparent)" }}
    >
      <div className="min-w-0">
        <h2 style={{ color: colors.primary, fontFamily: colors.headingFont }} className="text-sm font-semibold leading-5 tracking-tight text-(--text)">
          {title}
        </h2>
        {subtitle && (
          <p style={{ color: colors.muted }} className="mt-0.5 text-xs leading-[18px] text-(--text-muted)">
            {subtitle}
          </p>
        )}
      </div>
      {count != null && (
        <span style={{ color: colors.muted }} className="shrink-0 pb-0.5 text-[11px] text-(--text-muted)">
          {count}
        </span>
      )}
    </div>
  );
}

const CARD = "rounded-[5px] border border-(--surface-border) overflow-hidden text-left";

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
      {showHeader && <AboutHeader title="About me" subtitle="A little about me and what I love creating." colors={colors} />}
      <div className="space-y-2.5 p-3 sm:p-3.5">
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
            <li key={p} className="flex min-h-12 items-center gap-2.5 px-3 py-1.5 sm:px-3.5">
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

const COUNTED = new Set(["instagram", "youtube", "facebook"]);

export function SocialAccountsBlock({
  groups,
  total,
  colors,
  onLinkClick,
  showHeader = true,
}: {
  groups: { groupTitle: string | null; items: AboutSocialItem[] }[];
  total: number;
  colors: AboutColors;
  /** Return false to cancel navigation (e.g. dashboard preview). */
  onLinkClick?: (item: AboutSocialItem) => boolean;
  showHeader?: boolean;
}) {
  const handleOf = (item: AboutSocialItem) => {
    const raw = (item.handle || item.label || "").replace(/^@/, "");
    return item.platform === "spotify" && raw.toLowerCase() === "spotify" ? "Spotify Artist" : `@${raw}`;
  };
  const click = (item: AboutSocialItem) => (e: React.MouseEvent) => {
    if (onLinkClick && onLinkClick(item) === false) e.preventDefault();
  };

  return (
    <div className={CARD}>
      {showHeader && <AboutHeader title="Find me elsewhere" subtitle="My other channels & profiles — come say hi!" count={`${total} more`} colors={colors} />}
      <div className="space-y-3 p-2.5 sm:p-3">
        {groups.map((group, gi) => {
          // One connected list per group: primary first, then the rest.
          const ordered = [...group.items].sort((a, b) => Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)));
          return (
            <div key={group.groupTitle ?? `g-${gi}`} className="space-y-1.5">
              {group.groupTitle && (
                <div className="flex items-center justify-between px-1 pt-0.5">
                  <span style={{ color: colors.secondary, fontFamily: colors.headingFont }} className="text-[11px] font-bold uppercase tracking-wider text-(--text-secondary)">
                    {group.groupTitle}
                  </span>
                  <span style={{ color: colors.muted }} className="text-[10.5px] text-(--text-muted)">
                    {group.items.length} {group.items.length === 1 ? "account" : "accounts"}
                  </span>
                </div>
              )}
              <ul className="divide-y divide-(--surface-border) overflow-hidden rounded-[8px] border border-(--surface-border)">
                {ordered.map((item, i) => {
                  const count = item.isPrimary && COUNTED.has(item.platform) && (item.count ?? 0) > 0 ? item.count! : null;
                  return (
                    <li key={item.id ?? `${item.platform}-${item.handle}-${i}`}>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={click(item)}
                        className="group flex h-11 items-center gap-2 sm:gap-2.5 px-3 transition-colors hover:bg-(--surface)"
                        aria-label={`${handleOf(item)}${count ? `, ${formatFans(count)} ${unitFor(item.platform, item.unit)}` : ""}`}
                        title={`Open ${handleOf(item)} on ${PLATFORM_BRAND[item.platform]?.label ?? item.platform}`}
                      >
                        <BrandPlatformIcon platform={item.platform} size={22} />
                        <span style={{ color: colors.primary }} className="min-w-0 truncate text-[13px] font-medium text-(--text)">
                          {handleOf(item)}
                        </span>
                        {item.isPrimary && COUNTED.has(item.platform) && (
                          <span
                            style={{
                              backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
                              color: "var(--accent-text)",
                              borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
                            }}
                            className="shrink-0 rounded-[3px] border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                          >
                            Primary
                          </span>
                        )}
                        <span className="flex-1" />
                        {count && (
                          <span style={{ color: colors.muted }} className="shrink-0 text-xs tabular-nums text-(--text-muted)">
                            <span style={{ color: colors.primary }} className="font-semibold text-(--text)">{formatFans(count)}</span>
                            <span className="hidden sm:inline"> {unitFor(item.platform, item.unit)}</span>
                          </span>
                        )}
                        <ArrowUpRight style={{ color: colors.muted }} className="h-4 w-4 shrink-0 text-(--text-muted) transition-colors group-hover:text-(--text)" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
