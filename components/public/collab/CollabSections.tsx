"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, CheckCircle2, Handshake, Star } from "lucide-react";
import type { CreatorReview, MediaKitPackage } from "@/types";
import {
  CARD_ITEM,
  CARD_LIST,
  FooterCta,
  PackageRow,
  SectionCard,
  useCardLayout,
  type SectionColors as AboutColors,
} from "@/components/public/ui";
import { getInitials } from "@/lib/avatar";

const ROW = "px-4 py-3";

// ── 1. Audience snapshot ──────────────────────────────────────

// ── 2. Work with me ───────────────────────────────────────────

/** Tabs layout: full package card row (deliverables + Enquire button). */
export function WorkWithMe({
  packages,
  colors,
  onEnquire,
  onCustomRequest,
  lockedCount = 0,
}: {
  lockedCount?: number;
  packages: MediaKitPackage[];
  colors: AboutColors;
  onEnquire: (pkg: MediaKitPackage) => void;
  onCustomRequest?: () => void;
}) {
  const [showAllPackages, setShowAllPackages] = useState(false);
  const shownPackages = showAllPackages ? packages : packages.slice(0, 3);
  return (
    <SectionCard
      icon={Handshake}
      lockedCount={lockedCount}
      title="Work With Me"
      subtitle="Brands, let's create together."
      count={packages.length > 0 ? `${packages.length} ${packages.length === 1 ? "package" : "packages"}` : undefined}
      colors={colors}
    >
      {packages.length > 0 && (
        <ul className={CARD_LIST}>
          {shownPackages.map((pkg) => (
            <PackageRow key={pkg.id} pkg={pkg} colors={colors} onEnquire={onEnquire} />
          ))}
        </ul>
      )}
      {onCustomRequest && (
        <div className={packages.length > 0 ? "px-2.5 pb-2.5" : "p-2.5"}>
          <button
            type="button"
            onClick={onCustomRequest}
            style={{ backgroundColor: "var(--accent)", color: "var(--on-accent)" }}
            className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-[5px] px-4 text-[13px] font-semibold transition-opacity hover:opacity-95 cursor-pointer"
          >
            Get in touch for collaboration
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {packages.length > 3 && (
        <div className="px-2.5 pb-2.5">
          <FooterCta
            boxed
            onClick={() => setShowAllPackages((v) => !v)}
            aria-expanded={showAllPackages}
            trailing={<ChevronDown className={`h-4 w-4 transition-transform ${showAllPackages ? "rotate-180" : ""}`} />}
          >
            {showAllPackages ? "Show less" : `View all packages (${packages.length})`}
          </FooterCta>
        </div>
      )}
    </SectionCard>
  );
}

// ── 3. What brands say ────────────────────────────────────────

export function WhatBrandsSay({
  reviews,
  brands,
  colors,
  limit = 4,
  title = "What Brands Say",
  allHref,
  lockedCount = 0,
}: {
  lockedCount?: number;
  reviews: CreatorReview[];
  brands: string[];
  colors: AboutColors;
  /** Reviews shown before "Show all"; brand chips are hidden when limit is 1 (compact). */
  limit?: number;
  title?: string;
  /** When set, the overflow footer links to the full reviews page instead of expanding in place. */
  allHref?: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const cards = useCardLayout();
  const visible = showAll ? reviews : reviews.slice(0, limit);
  // Brand chips only stand in when there are no reviews yet.
  const uniqueBrands = reviews.length > 0 ? [] : Array.from(new Set(brands.map((b) => b.trim()).filter(Boolean)));
  if (reviews.length === 0 && uniqueBrands.length === 0) return null;

  return (
    <SectionCard
      icon={Star}
      lockedCount={lockedCount}
      title={title}
      subtitle="Kind words from my collabs."
      count={reviews.length > 0 ? `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}` : undefined}
      colors={colors}
    >
      <ul className={cards ? CARD_LIST : "divide-y divide-(--surface-border)"}>
        {uniqueBrands.length > 0 && (
          <li className={cards ? `${CARD_ITEM} p-3` : ROW}>
            <p style={{ color: colors.muted }} className="mb-2 text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">
              Brands I&apos;ve worked with
            </p>
            <div className="flex flex-wrap gap-1.5">
              {uniqueBrands.map((b) => (
                <span
                  key={b}
                  title={b}
                  className="inline-flex h-7 items-center gap-1.5 rounded-full border border-(--surface-border) pl-0.5 pr-2.5"
                >
                  <span
                    style={{ backgroundColor: "color-mix(in srgb, var(--accent) 12%, var(--surface))", color: "var(--accent-text)" }}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                  >
                    {getInitials(b, "B")}
                  </span>
                  <span style={{ color: colors.primary }} className="text-xs font-medium text-(--text)">{b}</span>
                </span>
              ))}
            </div>
          </li>
        )}
        {visible.map((rev) => {
          const rating = Number(rev.rating) || 5;
          return (
            <li key={rev.id} className={`${cards ? `${CARD_ITEM} p-3` : ROW} space-y-2`}>
              <div className="flex items-start gap-2.5">
                <span
                  style={{ backgroundColor: "color-mix(in srgb, var(--accent) 10%, var(--surface))", color: "var(--accent-text)" }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] border border-(--surface-border) text-xs font-bold"
                >
                  {getInitials(rev.clientName, "B")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1">
                    <span style={{ color: colors.primary }} className="break-words text-[13px] font-semibold text-(--text)">{rev.clientName}</span>
                    {rev.isVerified && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-(--accent-text)" aria-label="Verified" />}
                  </p>
                  {rev.projectTitle && (
                    <p style={{ color: colors.muted }} className="break-words text-xs text-(--text-muted)">{rev.projectTitle}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <span className="flex items-center justify-end gap-0.5" aria-hidden>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < Math.round(rating) ? "fill-amber-400 text-amber-500" : "text-slate-300"}`} />
                    ))}
                  </span>
                  <span style={{ color: colors.muted }} className="text-[11px] font-semibold tabular-nums text-(--text-muted)">
                    {rating.toFixed(1)}/5
                  </span>
                </div>
              </div>
              {rev.comment?.trim() && <ReviewComment text={rev.comment.trim()} color={colors.primary} />}
            </li>
          );
        })}
        {reviews.length > limit && allHref && (
          <li>
            <FooterCta boxed={cards} href={allHref}>View all reviews ({reviews.length})</FooterCta>
          </li>
        )}
        {reviews.length > limit && !allHref && (
          <li className="py-2 text-center">
            <button type="button" onClick={() => setShowAll((v) => !v)} className="text-xs font-semibold text-(--accent-text) hover:underline cursor-pointer">
              {showAll ? "Show less" : `Show all ${reviews.length} reviews`}
            </button>
          </li>
        )}
      </ul>
    </SectionCard>
  );
}

/** Review quote clamped to 3 lines; "Read more" appears only when the text is actually cut. */
function ReviewComment({ text, color }: { text: string; color?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;
    const check = () => setClamped(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, expanded]);

  return (
    <div>
      <p ref={ref} style={{ color }} className={`text-[13px] leading-relaxed text-(--text) ${expanded ? "" : "line-clamp-3"}`}>
        &ldquo;{text}&rdquo;
      </p>
      {(clamped || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="tap-44 mt-0.5 text-xs font-semibold text-(--accent-text) hover:underline cursor-pointer"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
