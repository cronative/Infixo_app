"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Package } from "lucide-react";
import type { CreatorSetupItem, TeamMember } from "@/types";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "@/components/shared/BrandIcons";
import { SECTION_ROW, SECTION_ROW_HOVER, Section, type AboutColors } from "@/components/public/about/AboutSections";
import { getInitials } from "@/lib/avatar";

const THUMB = "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[5px] border border-(--surface-border) bg-(--surface)";
const MORE_ROW = `flex w-full items-center justify-center gap-1.5 ${SECTION_ROW} py-2.5 text-[13px] font-semibold text-(--accent-text) ${SECTION_ROW_HOVER} cursor-pointer`;

// ── Sticky section nav with scroll-spy ─────────────────────────

export interface SectionNavItem {
  id: string;
  label: string;
  /** DOM id(s) of the section to scroll to / watch; the first one present in the page is used. */
  target: string | string[];
}

const findTarget = (t: string | string[]) => {
  for (const id of Array.isArray(t) ? t : [t]) {
    const el = document.getElementById(id);
    if (el) return el;
  }
  return null;
};

export function SectionNav({ items, className = "" }: { items: SectionNavItem[]; className?: string }) {
  const [active, setActive] = useState(items[0]?.id);
  const barRef = useRef<HTMLDivElement>(null);
  // While a chip-click smooth scroll runs, scroll-spy stays on the clicked chip.
  const locked = useRef(false);

  useEffect(() => {
    if (items.length === 0) return;
    const onScroll = () => {
      if (locked.current) return;
      const offset = (barRef.current?.getBoundingClientRect().bottom ?? 0) + 24;
      let current = items[0].id;
      for (const item of items) {
        const el = findTarget(item.target);
        if (el && el.getBoundingClientRect().top <= offset) current = item.id;
      }
      // At the very bottom the last section wins even if it's short.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = items[items.length - 1].id;
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items]);

  // Keep the active chip visible on narrow screens.
  useEffect(() => {
    const chip = barRef.current?.querySelector<HTMLElement>(`[data-nav="${active}"]`);
    chip?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  if (items.length < 2) return null;

  const go = (item: SectionNavItem) => {
    const el = findTarget(item.target);
    if (!el) return;
    setActive(item.id);
    locked.current = true;
    window.setTimeout(() => {
      locked.current = false;
    }, 800);
    const navH = barRef.current?.offsetHeight ?? 40;
    window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - navH - 12, behavior: "smooth" });
  };

  return (
    <div
      ref={barRef}
      className={`sticky top-0 z-30 -mx-4 border-b border-(--divider) bg-(--card-bg) px-4 sm:-mx-5 sm:px-5 ${className}`}
    >
      <nav
        aria-label="Profile sections"
        className="flex h-10 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              data-nav={item.id}
              onClick={() => go(item)}
              aria-current={isActive ? "true" : undefined}
              style={isActive ? { backgroundColor: "var(--accent)", color: "var(--on-accent)" } : undefined}
              className={`h-7 shrink-0 rounded-[5px] px-3 text-[12.5px] font-semibold transition-colors cursor-pointer ${
                isActive ? "" : "text-(--text-muted) hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] hover:text-(--text)"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ── Shop: flat product rows ────────────────────────────────────

export interface ProductRowItem {
  id: string | number;
  name: string;
  imageUrl?: string;
  href?: string;
  price?: string | null;
  isAffiliate?: boolean;
}

export function ProductRows({
  products,
  colors,
  limit = 5,
  allHref,
  onProductClick,
  onViewAll,
}: {
  products: ProductRowItem[];
  colors: AboutColors;
  limit?: number;
  allHref?: string;
  onProductClick?: (e: React.MouseEvent, p: ProductRowItem) => void;
  onViewAll?: (e: React.MouseEvent) => void;
}) {
  const shown = products.slice(0, limit);
  const hasAffiliate = products.some((p) => p.isAffiliate);
  return (
    <ul className="divide-y divide-(--surface-border)">
      {shown.map((p) => (
        <li key={p.id}>
          <a
            href={p.href || "#"}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={(e) => onProductClick?.(e, p)}
            className={`group flex items-center gap-3 ${SECTION_ROW} ${SECTION_ROW_HOVER}`}
          >
            <span className={THUMB}>
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote product thumbnails of any host
                <img src={p.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <Package className="h-5 w-5 text-(--icon)" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span style={{ color: colors.primary }} className="line-clamp-2 text-[13px] font-medium leading-[18px] text-(--text)">
                {p.name}
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-1.5">
                {p.price && (
                  <span style={{ color: colors.primary }} className="text-[13px] font-semibold tabular-nums text-(--text)">
                    {p.price}
                  </span>
                )}
                {p.isAffiliate && (
                  <span className="rounded-[3px] border border-(--surface-border) px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-(--text-muted)">
                    Affiliate
                  </span>
                )}
              </span>
            </span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-(--text-muted) transition-colors group-hover:text-(--text)" />
          </a>
        </li>
      ))}
      {products.length > limit && allHref && (
        <li>
          <Link href={allHref} onClick={onViewAll} className={MORE_ROW}>
            View all products ({products.length})
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </li>
      )}
      {hasAffiliate && (
        <li style={{ color: colors.muted }} className="px-4 py-2.5 text-xs text-(--text-muted)">
          Some links are affiliate links.
        </li>
      )}
    </ul>
  );
}

// ── My Setup ───────────────────────────────────────────────────

export function SetupSection({
  items,
  subtitle,
  colors,
  allHref,
  limit = 5,
  onItemClick,
  id,
  className,
}: {
  items: CreatorSetupItem[];
  subtitle?: string | null;
  colors: AboutColors;
  allHref: string;
  limit?: number;
  onItemClick?: (e: React.MouseEvent, item: CreatorSetupItem) => void;
  id?: string;
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <Section
      id={id}
      className={className}
      title="My Setup"
      subtitle={subtitle?.trim() || "The tools, gear and software behind my content."}
      count={`${items.length} ${items.length === 1 ? "item" : "items"}`}
      colors={colors}
    >
      {items.slice(0, limit).map((item) => {
        const meta = [item.brand, item.category].filter(Boolean).join(" · ");
        const body = (
          <>
            <span className={`${THUMB} h-11 w-11`}>
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote gear thumbnails of any host
                <img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <Package className="h-4 w-4 text-(--icon)" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span style={{ color: colors.primary }} className="block truncate text-[13px] font-medium text-(--text)">{item.name}</span>
              {meta && <span style={{ color: colors.muted }} className="block truncate text-xs text-(--text-muted)">{meta}</span>}
            </span>
          </>
        );
        return item.linkUrl ? (
          <a
            key={item.id}
            href={item.linkUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={(e) => onItemClick?.(e, item)}
            className={`group flex items-center gap-3 ${SECTION_ROW} py-2.5 ${SECTION_ROW_HOVER}`}
          >
            {body}
            <ArrowUpRight className="h-4 w-4 shrink-0 text-(--text-muted) group-hover:text-(--text)" />
          </a>
        ) : (
          <div key={item.id} className={`flex items-center gap-3 ${SECTION_ROW} py-2.5`}>
            {body}
          </div>
        );
      })}
      {items.length > limit && (
        <Link href={allHref} className={MORE_ROW}>
          See full setup ({items.length})
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </Section>
  );
}

// ── The Crew ───────────────────────────────────────────────────

export function CrewSection({
  title,
  subtitle,
  members,
  colors,
  id,
  className,
}: {
  title?: string | null;
  subtitle?: string | null;
  members: TeamMember[];
  colors: AboutColors;
  id?: string;
  className?: string;
}) {
  if (members.length === 0) return null;
  const socials = (m: TeamMember) =>
    [
      m.instagramUrl && { href: m.instagramUrl, label: "Instagram", icon: <InstagramIcon className="h-4 w-4" /> },
      m.youtubeUrl && { href: m.youtubeUrl, label: "YouTube", icon: <YoutubeIcon className="h-4 w-4" /> },
      m.facebookUrl && { href: m.facebookUrl, label: "Facebook", icon: <FacebookIcon className="h-4 w-4" /> },
    ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode }[];

  return (
    <Section
      id={id}
      className={className}
      title={title?.trim() || "The Crew"}
      subtitle={subtitle?.trim() || "Creative production crew, editors & management team."}
      count={`${members.length} ${members.length === 1 ? "member" : "members"}`}
      colors={colors}
    >
      {members.map((m) => (
        <div key={m.id} className={`flex items-center gap-3 ${SECTION_ROW} py-2.5 ${SECTION_ROW_HOVER}`}>
          {m.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- small avatar
            <img src={m.avatarUrl} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-full object-cover" />
          ) : (
            <span
              style={{ backgroundColor: "var(--accent)", color: "var(--on-accent)" }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            >
              {getInitials(m.name)}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span style={{ color: colors.primary }} className="text-[13px] font-semibold text-(--text)">{m.name}</span>
              {m.role && (
                <span
                  style={{ color: "var(--accent-text)", backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)" }}
                  className="rounded-[3px] px-1.5 py-px text-[10.5px] font-semibold"
                >
                  {m.role}
                </span>
              )}
            </span>
            {m.oneLiner?.trim() && (
              <span style={{ color: colors.muted }} className="mt-0.5 block truncate text-xs italic text-(--text-muted)">
                “{m.oneLiner.trim()}”
              </span>
            )}
          </span>
          {socials(m).length > 0 && (
            <span className="flex shrink-0 items-center gap-0.5">
              {socials(m).map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${m.name} on ${s.label}`}
                  className="flex h-8 w-8 items-center justify-center rounded-[5px] text-(--icon) hover:bg-(--surface) hover:text-(--text)"
                >
                  {s.icon}
                </a>
              ))}
            </span>
          )}
        </div>
      ))}
    </Section>
  );
}
