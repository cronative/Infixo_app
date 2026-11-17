"use client";

import { createContext, useContext, type ReactNode } from "react";
import { Layers, type LucideIcon } from "lucide-react";
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
  /** Feature header: accent gradient bar, icon tile, bold title, light count pill (My Series). */
  hero?: boolean;
}

/**
 * Section header. Solid: soft accent tint, accent text, icon left, count pill
 * (beside the title on phones, right-aligned from sm). Plain (tabs layout):
 * accent @ 7% tint, title + subtitle left, muted count right.
 */
export function SectionHeader({ title, subtitle, count, colors, icon: Icon, solid = false, hero = false }: SectionHeaderProps) {
  if (hero) {
    return (
      <div
        className="flex items-center gap-2.5 px-3 py-2.5"
        style={{
          // Theme tokens only: accent fading toward its soft tint.
          background: "linear-gradient(100deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 72%, var(--accent-soft)) 100%)",
          color: "var(--on-accent)",
        }}
      >
        {Icon && (
          <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] border border-[color-mix(in_srgb,var(--on-accent)_25%,transparent)] bg-[color-mix(in_srgb,var(--on-accent)_14%,transparent)]">
              <Icon aria-hidden strokeWidth={2} className="h-5 w-5" />
            </span>
          </>
        )}
        <div className="min-w-0 flex-1">
          <h2 style={{ fontFamily: colors.headingFont }} className="text-[16px] font-bold leading-5 tracking-tight">
            {title}
          </h2>
          {subtitle && <p className="text-[12px] leading-4 opacity-90">{subtitle}</p>}
        </div>
        {count != null && (
          <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[5px] bg-(--card-bg) px-2 py-1 text-[12px] font-semibold text-(--accent-text)">
            <Layers aria-hidden className="h-3.5 w-3.5" />
            {count}
          </span>
        )}
      </div>
    );
  }
  if (solid) {
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
      {count != null && (
        <span style={{ color: colors.muted }} className="shrink-0 whitespace-nowrap text-[12px] text-(--text-muted)">
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
  hero = false,
  showHeader = true,
  lockedCount = 0,
  as: Tag = "div",
  id,
  className = "",
  children,
}: SectionCardProps) {
  const solidCtx = useContext(SolidContext);
  const fullBleed = useContext(FullBleedContext);
  const solid = solidProp || solidCtx;
  return (
    <Tag
      id={id}
      className={`${SECTION_CARD} scroll-mt-2 ${className} ${fullBleed ? FULL_BLEED : ""}`}
      // Solid section: the whole frame takes the header colour (inline so it wins over the base border).
      style={solid && showHeader ? { borderColor: SECTION_LINE } : undefined}
    >
      {showHeader && <SectionHeader icon={icon} solid={solid} hero={hero} title={title} subtitle={subtitle} count={count} colors={colors} />}
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
