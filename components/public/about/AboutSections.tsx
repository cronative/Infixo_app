"use client";

import { createContext, useContext, useId, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, AtSign, ChevronDown, Lock, User, UsersRound, type LucideIcon, Globe, Languages, MapPin, PenLine } from "lucide-react";
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
      className="inline-flex shrink-0 items-center justify-center rounded-[5px]"
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
/** Section footer "View all" bar: same solid accent as an open collapsible header. */
export const SECTION_FOOTER_CTA =
  "flex h-11 w-full items-center justify-center gap-1.5 rounded-t-none! rounded-b-[5px]! border-t border-[color-mix(in_srgb,var(--accent-text)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent-soft)_40%,var(--card-bg))] text-xs sm:text-[13px] font-semibold text-(--accent-text) transition-colors hover:bg-(--accent-soft) cursor-pointer";

/** Section header: soft accent tint + accent text (the "Work with me" pill look, readable in every theme). The "View all" footer is a lighter tint of it. */
export const SECTION_BG = "var(--accent-soft)";
export const SECTION_FG = "var(--accent-text)";
/** Header divider, count pill and open-section frame. */
export const SECTION_LINE = "color-mix(in srgb, var(--accent-text) 30%, transparent)";

type HeaderAction = { label: string; href: string; onClick?: (e: React.MouseEvent) => void };

/** Header row: primary @ 7% tint, compact 8px 14px padding, 14px title + 11.5px subtitle left, count right, 1px divider. */
export function AboutHeader({
  title,
  subtitle,
  count,
  action,
  colors,
  collapsible = false,
  open = true,
  onToggle,
  bodyId,
  icon,
  solid = false,
}: {
  title: string;
  subtitle?: string;
  count?: ReactNode;
  action?: HeaderAction;
  colors: AboutColors;
  /** Same look as an open accordion header, but static (listing / detail pages). */
  solid?: boolean;
  /** Whole header toggles the body; chevron on the right. */
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
  bodyId?: string;
  /** Collapsible (premium) headers: icon on the left. */
  icon?: LucideIcon;
}) {
  if (collapsible || solid) {
    return (
      <CollapsibleHeader
        isStatic={!collapsible}
        title={title}
        subtitle={subtitle}
        count={count}
        colors={colors}
        open={collapsible ? open : true}
        onToggle={onToggle}
        bodyId={bodyId}
        icon={icon}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-between gap-2.5 border-b border-(--surface-border) px-3.5 py-2"
      style={{ backgroundColor: "color-mix(in srgb, var(--accent) 7%, transparent)" }}
    >
      <div className="min-w-0 flex-1">
        <h2 style={{ color: colors.primary, fontFamily: colors.headingFont }} className="text-[14px] font-semibold leading-[18px] tracking-tight text-(--text)">
          {title}
        </h2>
        {subtitle && (
          <p style={{ color: colors.muted }} className="text-[12px] leading-4 text-(--text-muted)">
            {subtitle}
          </p>
        )}
      </div>
      {action ? (
        <Link href={action.href} onClick={action.onClick} className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[12px] font-semibold text-(--accent-text) hover:underline">
          {action.label}
          <ArrowRight className="h-3 w-3" />
        </Link>
      ) : count != null && (
        <span style={{ color: colors.muted }} className="shrink-0 whitespace-nowrap text-[12px] text-(--text-muted)">
          {count}
        </span>
      )}
    </div>
  );
}

/**
 * App-style accordion header. Closed: soft accent tint. Open: solid accent bar
 * with on-accent text, so the header reads clearly apart from the details below
 * (theme tokens only, so it works on light and dark cards).
 */
function CollapsibleHeader({
  title,
  subtitle,
  count,
  colors,
  open,
  onToggle,
  bodyId,
  icon: Icon,
  isStatic = false,
}: {
  isStatic?: boolean;
  title: string;
  subtitle?: string;
  count?: ReactNode;
  colors: AboutColors;
  open: boolean;
  onToggle?: () => void;
  bodyId?: string;
  icon?: LucideIcon;
}) {
  const fg = open ? SECTION_FG : undefined;
  const pill = (cls: string) =>
    count != null && (
      <span
        style={
          open
            ? { color: fg, backgroundColor: "transparent", borderColor: SECTION_LINE }
            : { color: "var(--accent-text)" }
        }
        className={`shrink-0 whitespace-nowrap rounded-[5px] border border-(--surface-border) bg-(--card-bg) px-1.5 py-px text-[11px] font-medium sm:px-2 sm:py-0.5 sm:text-[11px] ${cls}`}
      >
        {count}
      </span>
    );
  return (
    <div
      onClick={isStatic ? undefined : onToggle}
      className={`flex items-center gap-2.5 px-3 py-2.5 transition-colors ${isStatic ? "" : "cursor-pointer select-none"}`}
      style={{
        backgroundColor: open ? SECTION_BG : "color-mix(in srgb, var(--accent) 6%, var(--card-bg))",
        borderBottom: open ? `1px solid ${SECTION_LINE}` : undefined,
        color: fg,
      }}
    >
      {Icon && (
        <Icon
          aria-hidden
          strokeWidth={2}
          style={{ color: fg ?? "var(--accent-text)" }}
          className="h-5 w-5 shrink-0"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h2
            style={{ color: fg ?? colors.primary, fontFamily: colors.headingFont }}
            className="min-w-0 text-[14px] font-semibold leading-[18px] tracking-tight text-(--text)"
          >
            {isStatic ? (
              title
            ) : (
              <button type="button" aria-expanded={open} aria-controls={bodyId} className="text-left outline-none focus-visible:underline cursor-pointer">
                {title}
              </button>
            )}
          </h2>
          {/* Phones: count beside the title so the subtitle keeps the full width. */}
          {pill("sm:hidden")}
        </div>
        {subtitle && (
          <p
            style={{ color: fg ?? colors.muted }}
            className="text-[12px] leading-4 text-(--text-muted)"
          >
            {subtitle}
          </p>
        )}
      </div>
      {pill("hidden sm:inline")}
      {!isStatic && (
        <ChevronDown
          aria-hidden
          style={{ color: fg ?? "var(--text-muted)" }}
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      )}
    </div>
  );
}

// ── Collapsible sections (premium profile) ────────────────────

interface SectionCollapseValue {
  enabled: boolean;
  /** Title of the one open section (accordion), or null when all are closed. */
  openTitle: string | null;
  setOpenTitle: (title: string | null) => void;
  /** Every section always open with the solid accent header (no toggles). */
  solid?: boolean;
}

const SectionCollapseContext = createContext<SectionCollapseValue>({ enabled: false, openTitle: null, setOpenTitle: () => {} });

const SOLID_SECTIONS: SectionCollapseValue = { enabled: false, openTitle: null, setOpenTitle: () => {}, solid: true };

/** Premium profile: all sections open, solid accent headers, each showing a short preview + "View all". */
export function SolidSectionsProvider({ children }: { children: ReactNode }) {
  return <SectionCollapseContext.Provider value={SOLID_SECTIONS}>{children}</SectionCollapseContext.Provider>;
}

/**
 * Turns every SectionCard header below it into an accordion toggle:
 * only one section is open at a time (opening one closes the other).
 */
export function SectionCollapseProvider({ defaultOpen = null, children }: { defaultOpen?: string | null; children: ReactNode }) {
  const [openTitle, setOpenTitle] = useState<string | null>(defaultOpen);
  const value = useMemo(() => ({ enabled: true, openTitle, setOpenTitle }), [openTitle]);
  return <SectionCollapseContext.Provider value={value}>{children}</SectionCollapseContext.Provider>;
}

/**
 * Card shell shared by every public block: tinted header + body. Inside a
 * SectionCollapseProvider the header opens/closes the body as an accordion
 * (body kept in the DOM, just hidden, so links stay crawlable).
 */
export function SectionCard({
  title,
  subtitle,
  count,
  action,
  colors,
  showHeader = true,
  as: Tag = "div",
  id,
  className = "",
  icon,
  solid: solidProp = false,
  lockedCount = 0,
  children,
}: {
  title: string;
  subtitle?: string;
  count?: ReactNode;
  action?: HeaderAction;
  colors: AboutColors;
  showHeader?: boolean;
  icon?: LucideIcon;
  /** Limited (plan ended) profile: items hidden server-side; one blurred placeholder row stands in for them. */
  lockedCount?: number;
  /** Static "open" look (solid accent header + accent frame) for listing / detail pages. */
  solid?: boolean;
  as?: "div" | "section";
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  const ctx = useContext(SectionCollapseContext);
  const solid = solidProp || Boolean(ctx.solid);
  const collapsible = ctx.enabled && showHeader;
  const open = !collapsible || ctx.openTitle === title;
  const bodyId = useId();
  const cardRef = useRef<HTMLElement | null>(null);

  const toggle = () => {
    if (open) {
      ctx.setOpenTitle(null);
      return;
    }
    ctx.setOpenTitle(title);
    // The section that closes above can pull this one up off-screen; bring its header back into view.
    requestAnimationFrame(() => {
      const el = cardRef.current;
      if (el && el.getBoundingClientRect().top < 8) el.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  };

  return (
    <Tag
      ref={cardRef as React.Ref<HTMLDivElement>}
      id={id}
      className={`${CARD} scroll-mt-2 ${className}`}
      // Open section: the whole frame takes the header colour (inline so it wins over the base border).
      style={(collapsible && open) || (solid && showHeader) ? { borderColor: SECTION_LINE } : undefined}
    >
      {showHeader && (
        <AboutHeader
          icon={icon}
          solid={solid}
          title={title}
          subtitle={subtitle}
          count={count}
          action={action}
          colors={colors}
          collapsible={collapsible}
          open={open}
          onToggle={toggle}
          bodyId={bodyId}
        />
      )}
      <div id={bodyId} hidden={collapsible && !open}>
        {children}
        {lockedCount > 0 && <LockedRow count={lockedCount} />}
      </div>
    </Tag>
  );
}

const CARD = SECTION_CARD;

/**
 * Placeholder for items a limited (plan ended) profile doesn't show. Purely decorative bars under a
 * blur: the real items are never sent to the browser, so there is nothing to reveal in DevTools.
 */
export function LockedRow({ count }: { count: number }) {
  return (
    <div
      role="note"
      aria-label={`${count} more ${count === 1 ? "item" : "items"} locked`}
      className="relative flex min-h-14 items-center gap-3 overflow-hidden border-t border-(--surface-border) px-4 py-3 select-none"
    >
      <div aria-hidden className="flex w-full items-center gap-3 blur-[3px]">
        <span className="h-9 w-9 shrink-0 rounded-[5px] bg-(--accent-soft)" />
        <span className="flex-1 space-y-1.5">
          <span className="block h-2.5 w-3/4 rounded-[5px] bg-(--surface-border)" />
          <span className="block h-2 w-1/2 rounded-[5px] bg-(--surface-border)" />
        </span>
      </div>
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-[5px] border border-(--surface-border) bg-(--card-bg) px-2.5 py-1 text-[12px] font-semibold text-(--text)">
          <Lock className="h-3.5 w-3.5 text-(--accent-text)" aria-hidden />
          {count} more locked
        </span>
      </span>
    </div>
  );
}

/**
 * The one public-page Section: tinted header + connected body on the card surface.
 * `divided` puts 1px lines between body rows.
 */
export function Section({
  title,
  subtitle,
  count,
  action,
  colors,
  divided = true,
  bodyClassName = "",
  children,
  id,
  className = "",
  icon,
  solid,
  lockedCount,
}: {
  title: string;
  subtitle?: string;
  count?: ReactNode;
  action?: HeaderAction;
  colors: AboutColors;
  solid?: boolean;
  divided?: boolean;
  bodyClassName?: string;
  children: ReactNode;
  id?: string;
  className?: string;
  icon?: LucideIcon;
  lockedCount?: number;
}) {
  return (
    <SectionCard as="section" id={id} className={className} icon={icon} solid={solid} lockedCount={lockedCount} title={title} subtitle={subtitle} count={count} action={action} colors={colors}>
      <div className={`${divided ? "divide-y divide-(--surface-border)" : ""} ${bodyClassName}`}>{children}</div>
    </SectionCard>
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
