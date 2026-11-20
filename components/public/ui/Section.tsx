"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CountPill } from "./CountPill";
import { LockedRow } from "./LockedRow";
import { SECTION_BG, SECTION_CARD, SECTION_FG, SECTION_LINE, type SectionColors } from "./tokens";

// ── Solid (premium) mode ─────────────────────────────────────

const SolidContext = createContext(false);

/** Premium profile: every Section below renders the solid accent header + accent frame. */
export function SolidSectionsProvider({ children }: { children: ReactNode }) {
  return <SolidContext.Provider value={true}>{children}</SolidContext.Provider>;
}

// ── Full-bleed mode ──────────────────────────────────────────

const FullBleedContext = createContext(false);

/** Sections below run edge to edge of the profile card (no side gutter, square corners, no side borders). */
export function FullBleedSectionsProvider({ enabled = true, children }: { enabled?: boolean; children: ReactNode }) {
  return <FullBleedContext.Provider value={enabled}>{children}</FullBleedContext.Provider>;
}

/** True on the premium profile / listing pages: content items render as separate white cards. */
export function useCardLayout() {
  return useContext(FullBleedContext);
}

// ── Card mode (demo profile preview) ─────────────────────────

const CardSectionsContext = createContext(false);

/** Every Section below renders as its own rounded card with a white header: icon tile, title, subtitle, count. */
export function CardSectionsProvider({ enabled = true, children }: { enabled?: boolean; children: ReactNode }) {
  return <CardSectionsContext.Provider value={enabled}>{children}</CardSectionsContext.Provider>;
}

// ── Plain listing mode (demo listing pages) ──────────────────

const PlainSectionsContext = createContext(false);

/** Listing pages: no section frame; a centred heading (title + count pill + subtitle) above the item cards. */
export function PlainSectionsProvider({ enabled = true, children }: { enabled?: boolean; children: ReactNode }) {
  return <PlainSectionsContext.Provider value={enabled}>{children}</PlainSectionsContext.Provider>;
}

/** Cancels the card's side padding (--card-px); `!` beats a caller's w-full / rounded / border. */
const FULL_BLEED = "-mx-(--card-px) w-auto! rounded-none! border-x-0!";

// ── Header ───────────────────────────────────────────────────

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  count?: ReactNode;
  colors: SectionColors;
  /** Icon on the left (solid headers only). */
  icon?: LucideIcon;
  /** Soft accent header with accent text + count pill (premium, listing and detail pages). */
  solid?: boolean;
  /** Feature header: light accent tint, accent icon tile, bold title, count pill (My Series). */
  hero?: boolean;
  /** Card header: no tint, accent icon tile, title + subtitle, outlined count (card mode). */
  card?: boolean;
  /** Compact centred feature header: icon, title and count on one line, subtitle below (series listing page). */
  centered?: boolean;
}

/**
 * Section header. Solid: soft accent tint, accent text, icon left, count pill
 * (beside the title on phones, right-aligned from sm). Plain (tabs layout):
 * accent @ 7% tint, title + subtitle left, muted count right.
 */
export function SectionHeader({ title, subtitle, count, colors, icon: Icon, hero = false, centered = false, card = false }: SectionHeaderProps) {
  if (card) {
    return (
      <div className="flex items-start justify-between gap-3 px-1.5 pb-2 pt-1.5">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-(--accent) text-(--on-accent)">
              <Icon aria-hidden strokeWidth={2} className="h-[18px] w-[18px]" />
            </span>
          )}
          <div className="min-w-0">
            <h2 style={{ fontFamily: colors.headingFont }} className="text-[16px] font-bold leading-5 tracking-tight text-(--text)">
              {title}
            </h2>
            {subtitle && <p className="text-[12px] leading-4 text-(--text-muted)">{subtitle}</p>}
          </div>
        </div>
        {count != null && (
          <span className="shrink-0 whitespace-nowrap rounded-[6px] border border-[color-mix(in_srgb,var(--accent)_22%,var(--surface-border))] px-2 py-0.5 text-[12px] font-semibold leading-5 text-(--accent-text)">
            {count}
          </span>
        )}
      </div>
    );
  }
  const heroStyle = {
    // Theme tokens only: a light tint of the accent over the card, with accent text.
    background: "linear-gradient(100deg, color-mix(in srgb, var(--accent) 16%, var(--card-bg)) 0%, color-mix(in srgb, var(--accent) 7%, var(--card-bg)) 100%)",
    borderBottom: "1px solid color-mix(in srgb, var(--accent) 18%, var(--card-bg))",
    color: "var(--accent-text)",
  };
  if (hero && centered) {
    return (
      <div className="flex flex-col items-center px-4 py-3 text-center" style={heroStyle}>
        <div className="flex items-center justify-center gap-2">
          {Icon && (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] bg-(--accent) text-(--on-accent)">
              <Icon aria-hidden strokeWidth={2} className="h-4 w-4" />
            </span>
          )}
          <h2 style={{ fontFamily: colors.headingFont }} className="text-[17px] font-bold leading-6 tracking-tight">
            {title}
          </h2>
          {count != null && (
            <span className="whitespace-nowrap rounded-[5px] border border-[color-mix(in_srgb,var(--accent)_22%,transparent)] bg-(--card-bg) px-2 py-px text-[12px] font-semibold leading-5 text-(--accent-text)">
              {count}
            </span>
          )}
        </div>
        {subtitle && <p className="mt-1 text-[12px] leading-4 text-(--text-muted)">{subtitle}</p>}
      </div>
    );
  }
  if (hero) {
    return (
      <div
        className="flex items-center gap-2.5 px-3 py-2.5"
        style={heroStyle}
      >
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-(--accent) text-(--on-accent)">
            <Icon aria-hidden strokeWidth={2} className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 style={{ fontFamily: colors.headingFont }} className="text-[16px] font-bold leading-5 tracking-tight">
            {title}
          </h2>
          {subtitle && <p className="text-[12px] leading-4 text-(--text-muted)">{subtitle}</p>}
        </div>
        {count != null && (
          <span className="shrink-0 whitespace-nowrap rounded-[5px] border border-[color-mix(in_srgb,var(--accent)_22%,transparent)] bg-(--card-bg) px-2 py-0.5 text-[13px] font-semibold leading-5 text-(--accent-text)">
            {count}
          </span>
        )}
      </div>
    );
  }
  // Solid header: soft accent tint (series detail page and anything outside the full-bleed profile).
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2.5 transition-colors"
      style={{ backgroundColor: SECTION_BG, borderBottom: `1px solid ${SECTION_LINE}`, color: SECTION_FG }}
    >
      {Icon && <Icon aria-hidden strokeWidth={2} style={{ color: SECTION_FG }} className="h-5 w-5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h2
            style={{ color: SECTION_FG, fontFamily: colors.headingFont }}
            className="min-w-0 text-[14px] font-semibold leading-[18px] tracking-tight text-(--text)"
          >
            {title}
          </h2>
          {/* Phones: count beside the title so the subtitle keeps the full width. */}
          {count != null && <CountPill className="sm:hidden">{count}</CountPill>}
        </div>
        {subtitle && (
          <p style={{ color: SECTION_FG }} className="text-[12px] leading-4 text-(--text-muted)">
            {subtitle}
          </p>
        )}
      </div>
      {count != null && <CountPill className="hidden sm:inline">{count}</CountPill>}
    </div>
  );
}

// ── Card + Section ───────────────────────────────────────────

export interface SectionCardProps extends Omit<SectionHeaderProps, "solid"> {
  /** Static solid look (accent header + accent frame) outside a SolidSectionsProvider. */
  solid?: boolean;
  showHeader?: boolean;
  /** Limited (plan ended) profile: items hidden server-side; one blurred LockedRow stands in for them. */
  lockedCount?: number;
  as?: "div" | "section";
  id?: string;
  className?: string;
  children: ReactNode;
}

/** Card shell shared by every public block: header + body on the card surface. */
export function SectionCard({
  title,
  subtitle,
  count,
  colors,
  icon,
  solid: solidProp = false,
  hero = false,
  centered = false,
  showHeader = true,
  lockedCount = 0,
  as: Tag = "div",
  id,
  className = "",
  children,
}: SectionCardProps) {
  const solidCtx = useContext(SolidContext);
  const fullBleed = useContext(FullBleedContext);
  const cardMode = useContext(CardSectionsContext);
  const plainMode = useContext(PlainSectionsContext);
  const solid = solidProp || solidCtx;
  if (plainMode) {
    const countNumber = typeof count === "string" || typeof count === "number" ? String(count).match(/^\d+/)?.[0] ?? String(count) : count;
    return (
      <Tag id={id} className={`scroll-mt-2 text-left ${className}`}>
        {showHeader && (
          <div className="px-2.5 pb-1 pt-1 text-center">
            <h2 style={{ fontFamily: colors.headingFont }} className="flex items-center justify-center gap-2 text-[18px] font-bold leading-6 tracking-tight text-(--text)">
              {title}
              {countNumber != null && countNumber !== "" && (
                <span className="rounded-full bg-(--accent-soft) px-2 py-0.5 text-[12px] font-bold leading-4 text-(--accent-text)">{countNumber}</span>
              )}
            </h2>
            {subtitle && <p className="mt-0.5 text-[12px] leading-4 text-(--text-muted)">{subtitle}</p>}
          </div>
        )}
        <div>
          {children}
          {lockedCount > 0 && <LockedRow count={lockedCount} />}
        </div>
      </Tag>
    );
  }
  if (cardMode) {
    return (
      <Tag
        id={id}
        className={`scroll-mt-2 overflow-hidden rounded-[14px] border border-(--surface-border) bg-(--card-bg) p-2 text-left shadow-[0_8px_24px_-12px_color-mix(in_srgb,var(--accent)_25%,transparent)] ${className}`}
      >
        {showHeader && <SectionHeader icon={icon} card title={title} subtitle={subtitle} count={count} colors={colors} />}
        <div>
          {children}
          {lockedCount > 0 && <LockedRow count={lockedCount} />}
        </div>
      </Tag>
    );
  }
  return (
    <Tag
      id={id}
      className={`${SECTION_CARD} scroll-mt-2 ${className} ${fullBleed ? FULL_BLEED : ""}`}
      // Solid section: the whole frame takes the header colour (inline so it wins over the base border).
      style={solid && showHeader ? { borderColor: SECTION_LINE } : undefined}
    >
      {/* Profile / listing pages: every section uses the feature (hero) header, like My Series. */}
      {showHeader && <SectionHeader icon={icon} solid={solid} hero={hero || fullBleed} centered={centered} title={title} subtitle={subtitle} count={count} colors={colors} />}
      <div>
        {children}
        {lockedCount > 0 && <LockedRow count={lockedCount} />}
      </div>
    </Tag>
  );
}

export interface SectionProps extends Omit<SectionCardProps, "as" | "showHeader"> {
  /** 1px lines between body rows (default on). */
  divided?: boolean;
  bodyClassName?: string;
  /** "View all" bar (usually a FooterCta) after the body rows. */
  footer?: ReactNode;
}

/** The one public-page Section: header + connected body + optional footer. */
export function Section({ divided = true, bodyClassName = "", footer, children, ...card }: SectionProps) {
  return (
    <SectionCard as="section" {...card}>
      <div className={`${divided ? "divide-y divide-(--surface-border)" : ""} ${bodyClassName}`}>
        {children}
        {footer}
      </div>
    </SectionCard>
  );
}
