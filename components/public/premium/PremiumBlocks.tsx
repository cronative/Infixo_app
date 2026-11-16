"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, ExternalLink, Monitor, Package, Users } from "lucide-react";
import type { CreatorSetupItem, TeamMember } from "@/types";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "@/components/shared/BrandIcons";
import { BrandPlatformIcon, SECTION_FOOTER_CTA, SECTION_ROW, SECTION_ROW_HOVER, Section, type AboutColors } from "@/components/public/about/AboutSections";
import { getInitials } from "@/lib/avatar";

const THUMB = "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[5px] border border-(--surface-border) bg-(--surface)";
const MORE_ROW = `flex w-full items-center justify-center gap-1.5 ${SECTION_ROW} py-2.5 text-[13px] font-semibold text-(--accent-text) ${SECTION_ROW_HOVER} cursor-pointer`;

// ── Shop: compact product tiles ─────────────────────────────

export interface ProductTileItem {
  id: string | number;
  name: string;
  imageUrl?: string;
  href?: string;
  price?: string | null;
}

/** Premium shop: compact tiles, 2 per row on small phones, max 3 (image, full name, price + open icon). */
export function ProductTiles({
  products,
  onProductClick,
  previewFour = false,
}: {
  products: ProductTileItem[];
  /** Profile preview of 4: the 4th tile hides once the grid is 3 across. */
  previewFour?: boolean;
  onProductClick?: (e: React.MouseEvent, p: ProductTileItem) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-2 p-2.5 min-[400px]:grid-cols-3">
      {products.map((p, i) => (
        <li key={p.id} className={`min-w-0 ${previewFour && i === 3 ? "min-[400px]:hidden" : ""}`}>
          <a
            href={p.href || "#"}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={(e) => onProductClick?.(e, p)}
            className="group flex h-full flex-col rounded-[5px] bg-(--surface) p-1.5 transition-colors hover:bg-(--accent-soft)"
          >
            <span className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[5px] bg-(--card-bg)">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote product images of any host
                <img src={p.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <Package className="h-6 w-6 text-(--icon)" />
              )}
            </span>
            <span title={p.name} className="mt-1.5 line-clamp-2 break-words px-0.5 text-[12px] font-medium leading-4 text-(--text)">{p.name}</span>
            <span className="mt-auto flex items-center justify-between gap-1 px-0.5 pt-1.5">
              <span className="whitespace-nowrap text-[12px] font-bold tabular-nums leading-none text-(--text)">{p.price || ""}</span>
              <ExternalLink aria-hidden className="h-3.5 w-3.5 shrink-0 text-(--accent-text)" />
            </span>
          </a>
        </li>
      ))}
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
  lockedCount = 0,
  onItemClick,
  id,
  className,
  variant = "rows",
}: {
  items: CreatorSetupItem[];
  subtitle?: string | null;
  colors: AboutColors;
  allHref: string;
  limit?: number;
  lockedCount?: number;
  onItemClick?: (e: React.MouseEvent, item: CreatorSetupItem) => void;
  id?: string;
  className?: string;
  /** "strip": one row of square gear tiles (premium profile). */
  variant?: "rows" | "strip";
}) {
  if (items.length === 0) return null;
  if (variant === "strip") {
    const shown = items.slice(0, limit);
    return (
      <Section
        id={id}
        className={className}
        icon={Monitor}
        title="My Setup"
        subtitle={subtitle?.trim() || "The gear behind my videos."}
        count={`${items.length} ${items.length === 1 ? "item" : "items"}`}
        action={items.length > limit ? { label: "View all", href: allHref } : undefined}
        colors={colors}
        divided={false}
      >
        <ul className="grid grid-cols-5 gap-2 p-3">
          {shown.map((item) => {
            const tile = (
              <>
                <span className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-[5px] border border-(--surface-border) bg-(--surface)">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- remote gear thumbnails of any host
                    <img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-5 w-5 text-(--icon)" />
                  )}
                </span>
                <span style={{ color: colors.primary }} className="mt-1.5 line-clamp-2 text-center text-[11px] font-medium leading-[13px] text-(--text)">
                  {item.brand && !item.name.toLowerCase().startsWith(item.brand.toLowerCase()) ? `${item.brand} ${item.name}` : item.name}
                </span>
              </>
            );
            return (
              <li key={item.id} className="min-w-0">
                {item.linkUrl ? (
                  <a
                    href={item.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    title={item.name}
                    onClick={(e) => onItemClick?.(e, item)}
                    className="flex flex-col items-stretch transition-opacity hover:opacity-85"
                  >
                    {tile}
                  </a>
                ) : (
                  <div title={item.name} className="flex flex-col items-stretch">{tile}</div>
                )}
              </li>
            );
          })}
        </ul>
      </Section>
    );
  }
  return (
    <Section
      id={id}
      className={className}
      lockedCount={lockedCount}
      icon={Monitor}
      title="My Setup"
      subtitle={subtitle?.trim() || "The gear behind my videos."}
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
              <span style={{ color: colors.primary }} className="block break-words text-[13px] font-medium leading-[18px] text-(--text)">{item.name}</span>
              {meta && <span style={{ color: colors.muted }} className="block break-words text-xs text-(--text-muted)">{meta}</span>}
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
        <Link href={allHref} className={SECTION_FOOTER_CTA}>
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
  limit,
  allHref,
  lockedCount = 0,
  id,
  className,
}: {
  title?: string | null;
  subtitle?: string | null;
  members: TeamMember[];
  colors: AboutColors;
  /** Members shown before the "See all" footer (all when omitted). */
  limit?: number;
  lockedCount?: number;
  allHref?: string;
  id?: string;
  className?: string;
}) {
  if (members.length === 0) return null;
  // Every account the creator added for this member, each opening that profile.
  const socials = (m: TeamMember) => {
    const inflixo = (m.inflixoUsername || "").trim().replace(/^@/, "");
    return [
      inflixo && { href: `/${inflixo}`, label: "Inflixo", platform: "inflixo", external: false },
      m.instagramUrl && { href: m.instagramUrl, label: "Instagram", platform: "instagram", external: true },
      m.youtubeUrl && { href: m.youtubeUrl, label: "YouTube", platform: "youtube", external: true },
      m.facebookUrl && { href: m.facebookUrl, label: "Facebook", platform: "facebook", external: true },
    ].filter(Boolean) as { href: string; label: string; platform: string; external: boolean }[];
  };

  return (
    <Section
      id={id}
      className={className}
      lockedCount={lockedCount}
      icon={Users}
      title={title?.trim() || "My Crew"}
      subtitle={subtitle?.trim() || "The people behind my videos."}
      count={`${members.length} ${members.length === 1 ? "member" : "members"}`}
      colors={colors}
    >
      {(limit ? members.slice(0, limit) : members).map((m) => (
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
            <span style={{ color: colors.primary }} className="block break-words text-[13px] font-semibold leading-[18px] text-(--text)">{m.name}</span>
            {m.role && (
              <span style={{ color: "var(--accent-text)" }} className="block break-words text-xs font-medium leading-4">
                {m.role}
              </span>
            )}
            {m.oneLiner?.trim() && (
              <span style={{ color: colors.muted }} className="mt-0.5 block break-words text-xs italic text-(--text-muted)">
                “{m.oneLiner.trim()}”
              </span>
            )}
          </span>
          {socials(m).length > 0 && (
            <span className="flex shrink-0 items-center gap-1">
              {socials(m).map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  {...(s.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  aria-label={`Open ${m.name}'s ${s.label} profile`}
                  title={`${m.name} on ${s.label}`}
                  className="tap-44 flex h-8 w-8 items-center justify-center rounded-[5px] transition-transform hover:scale-105 active:scale-95"
                >
                  {s.platform === "inflixo" ? (
                    <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-[5px] border border-(--surface-border) bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element -- local brand mark */}
                      <img src="/logo-icon.svg" alt="" className="h-4 w-4 object-contain" />
                    </span>
                  ) : (
                    <BrandPlatformIcon platform={s.platform} size={24} />
                  )}
                </a>
              ))}
            </span>
          )}
        </div>
      ))}
      {limit && allHref && members.length > limit && (
        <Link href={allHref} className={SECTION_FOOTER_CTA}>
          See all crew ({members.length})
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </Section>
  );
}
