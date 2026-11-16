"use client";

import { Monitor, Package, Users } from "lucide-react";
import type { CreatorSetupItem, TeamMember } from "@/types";
import { BrandPlatformIcon, FooterCta, LIST_ROW_PAD, ListRow, SECTION_ROW, Section, type SectionColors } from "@/components/public/ui";
import { getInitials } from "@/lib/avatar";

/** Product tiles moved to the shared library. */
export { ProductTiles, type ProductTileItem } from "@/components/public/ui";

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
}: {
  items: CreatorSetupItem[];
  subtitle?: string | null;
  colors: SectionColors;
  allHref: string;
  limit?: number;
  lockedCount?: number;
  onItemClick?: (e: React.MouseEvent, item: CreatorSetupItem) => void;
  id?: string;
  className?: string;
}) {
  if (items.length === 0) return null;
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
        return (
          <ListRow
            key={item.id}
            href={item.linkUrl || undefined}
            external
            rel="noopener noreferrer sponsored"
            onClick={item.linkUrl ? (e) => onItemClick?.(e, item) : undefined}
            className={item.linkUrl ? `gap-3 ${LIST_ROW_PAD}` : `gap-3 ${SECTION_ROW} py-2.5`}
            leading={
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[5px] border border-(--surface-border) bg-(--surface)">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- remote gear thumbnails of any host
                  <img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <Package className="h-4 w-4 text-(--icon)" />
                )}
              </span>
            }
            title={item.name}
            titleStyle={{ color: colors.primary }}
            subtitle={meta || undefined}
            subtitleStyle={{ color: colors.muted }}
            arrow={item.linkUrl ? "external" : undefined}
          />
        );
      })}
      {items.length > limit && <FooterCta href={allHref}>See full setup ({items.length})</FooterCta>}
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
  colors: SectionColors;
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
        <ListRow
          key={m.id}
          leading={
            m.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- small avatar
              <img src={m.avatarUrl} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-full object-cover" />
            ) : (
              <span
                style={{ backgroundColor: "var(--accent)", color: "var(--on-accent)" }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              >
                {getInitials(m.name)}
              </span>
            )
          }
          title={m.name}
          titleStyle={{ color: colors.primary }}
          titleClassName="text-[13px] font-semibold leading-[18px] text-(--text)"
          subtitle={
            <>
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
            </>
          }
          meta={
            socials(m).length > 0 && (
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
            )
          }
        />
      ))}
      {limit && allHref && members.length > limit && <FooterCta href={allHref}>See all crew ({members.length})</FooterCta>}
    </Section>
  );
}
