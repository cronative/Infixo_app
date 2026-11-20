"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { LockedRow } from "./LockedRow";
import { SECTION_CARD, SECTION_LINE, type SectionColors } from "./tokens";

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
 * The one public section header (same layout as the dashboard):
 * [icon box]  Title              [count]
 *             Subtitle
 * Theme tokens only, so it follows every creator theme. The variant props are
 * kept for callers but no longer change the layout.
 */
export function SectionHeader({ title, subtitle, count, colors, icon: Icon }: SectionHeaderProps) {
  return (
    <div
      className="section-head flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4"
      style={{
        // A light accent tint so the header reads apart from the content below.
        background: "color-mix(in srgb, var(--accent) 7%, var(--card-bg))",
        borderBottom: "1px solid color-mix(in srgb, var(--accent) 14%, var(--surface-border))",
      }}
    >
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-(--accent) text-(--on-accent)">
            <Icon aria-hidden strokeWidth={2} className="h-[18px] w-[18px]" />
          </span>
        )}
        <div className="min-w-0 text-left">
          <h2 style={{ fontFamily: colors.headingFont }} className="break-words text-[16px] font-bold leading-5 tracking-tight text-(--text)">
            {title}
          </h2>
          {subtitle && <p className="break-words text-[12px] leading-4 text-(--text-muted)">{subtitle}</p>}
        </div>
      </div>
      {count != null && count !== "" && (
        <span className="shrink-0 whitespace-nowrap rounded-[5px] border border-[color-mix(in_srgb,var(--accent)_22%,var(--surface-border))] bg-(--card-bg) px-2 py-0.5 text-[12px] font-semibold leading-5 text-(--accent-text)">
          {count}
        </span>
      )}
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
    return (
      <Tag id={id} className={`plain-section scroll-mt-2 text-left ${className}`}>
        {showHeader && <SectionHeader icon={icon} title={title} subtitle={subtitle} count={count} colors={colors} />}
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
        {showHeader && <SectionHeader icon={icon} title={title} subtitle={subtitle} count={count} colors={colors} />}
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
      {showHeader && <SectionHeader icon={icon} title={title} subtitle={subtitle} count={count} colors={colors} />}
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
