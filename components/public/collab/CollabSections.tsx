"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, CheckCircle2, ChevronRight, Clock, Handshake, Star, Tv } from "lucide-react";
import type { CreatorReview, MediaKitPackage } from "@/types";
import { AboutHeader, BrandPlatformIcon, PLATFORM_BRAND, SECTION_CARD, SECTION_FOOTER_CTA, SectionCard, type AboutColors } from "@/components/public/about/AboutSections";
import { formatFans } from "@/lib/creatorEra";
import { getInitials } from "@/lib/avatar";

const CARD = SECTION_CARD;
const ROW = "px-4 py-3";
const OUTLINE_BTN =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-[5px] border border-(--accent) px-3.5 text-[13px] font-medium text-(--accent-text) transition-colors hover:bg-(--accent-soft) cursor-pointer";

// ── Package price helpers (same rules as the legacy PackageCard) ──

const UNIT_LABELS: Record<string, string> = {
  per_reel: "/ reel",
  per_post: "/ post",
  per_video: "/ video",
  per_package: "/ package",
  per_month: "/ month",
};

function packagePrice(pkg: MediaKitPackage) {
  const raw = (pkg.price || "").trim().replace(/^₹\s*/, "");
  const numeric = /^[\d,]+(\.\d+)?$/.test(raw) ? Number(raw.replace(/,/g, "")) : NaN;
  const value = !raw ? "Contact for pricing" : Number.isFinite(numeric) ? `₹${numeric.toLocaleString("en-IN")}` : `₹${raw}`;
  const isMonthly = pkg.title.toLowerCase().includes("monthly");
  const unitKey = pkg.priceUnit || (isMonthly ? "per_month" : "per_package");
  const unit = !raw ? "" : UNIT_LABELS[unitKey] || (unitKey.startsWith("/") ? unitKey : `/ ${unitKey.replace(/^per_/, "").replace(/_/g, " ")}`);
  return { value: pkg.isStartingPrice && raw ? `From ${value}` : value, unit, isMonthly: unitKey === "per_month" || isMonthly };
}

function packagePlatformKey(platform: string) {
  const p = (platform || "").toLowerCase();
  if (p.includes("instagram") || p.includes("reel")) return "instagram";
  if (p.includes("youtube")) return "youtube";
  if (p.includes("facebook")) return "facebook";
  return null;
}

// ── 1. Audience snapshot ──────────────────────────────────────

export function AudienceSnapshot({
  topPlatform,
  tags,
  mediaKitHref,
  colors,
  onMediaKitClick,
}: {
  /** @deprecated Total Fans is shown in the profile header. */
  totalFans?: number;
  topPlatform?: { platform: string; handle?: string; count: number; unit?: string } | null;
  tags: string[];
  mediaKitHref?: string;
  colors: AboutColors;
  onMediaKitClick?: (e: React.MouseEvent) => void;
}) {
  const label = (text: string) => (
    <span style={{ color: colors.muted }} className="w-[92px] shrink-0 text-xs text-(--text-muted)">
      {text}
    </span>
  );
  return (
    <div className={CARD}>
      <AboutHeader title="Audience snapshot" subtitle="Why brands work with me" colors={colors} />
      <ul className="divide-y divide-(--surface-border)">
        {/* Total Fans lives in the profile header, so it is not repeated here. */}
        {topPlatform && topPlatform.count > 0 && (
          <li className={`flex min-h-11 items-center gap-3 ${ROW} py-2`}>
            {label("Top platform")}
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <BrandPlatformIcon platform={topPlatform.platform} size={22} />
              <span style={{ color: colors.primary }} className="min-w-0 truncate text-[13px] font-medium text-(--text)">
                {topPlatform.handle ? `@${topPlatform.handle.replace(/^@/, "")}` : PLATFORM_BRAND[topPlatform.platform]?.label}
              </span>
              <span style={{ color: colors.muted }} className="ml-auto shrink-0 text-xs tabular-nums text-(--text-muted)">
                <span style={{ color: colors.primary }} className="font-semibold text-(--text)">{formatFans(topPlatform.count)}</span>{" "}
                {(topPlatform.unit || (topPlatform.platform === "youtube" ? "subscribers" : "followers")).toLowerCase()}
              </span>
            </span>
          </li>
        )}
        {tags.length > 0 && (
          <li className={`flex min-h-11 items-center gap-3 ${ROW} py-2`}>
            {label("Content")}
            <span className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  style={{ color: colors.secondary }}
                  className="rounded-[5px] border border-(--surface-border) bg-(--surface) px-2 py-0.5 text-[12px] font-medium text-(--text-secondary)"
                >
                  {t}
                </span>
              ))}
            </span>
          </li>
        )}
        <li className={`flex min-h-11 flex-wrap items-center justify-between gap-2 ${ROW}`}>
          {mediaKitHref && (
            <Link href={mediaKitHref} onClick={onMediaKitClick} className={OUTLINE_BTN}>
              View Media Kit
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
          <span style={{ color: colors.muted }} className="text-xs text-(--text-muted)">
            Usually replies within 24 hours
          </span>
        </li>
      </ul>
    </div>
  );
}

// ── 2. Work with me ───────────────────────────────────────────

function PackageRow({ pkg, colors, onEnquire }: { pkg: MediaKitPackage; colors: AboutColors; onEnquire: (pkg: MediaKitPackage) => void }) {
  const [showAll, setShowAll] = useState(false);
  const { value, unit, isMonthly } = packagePrice(pkg);
  const pKey = packagePlatformKey(pkg.platform);
  const bullets = (pkg.deliverables || []).filter((b) => b && b.trim());
  const visible = showAll ? bullets : bullets.slice(0, 4);
  const isPopular = Boolean(pkg.isPopular || pkg.badge?.toLowerCase().includes("popular"));

  return (
    <li className={`${ROW} space-y-2.5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 style={{ color: colors.primary, fontFamily: colors.headingFont }} className="text-[14px] font-semibold leading-5 text-(--text)">
              {pkg.title}
            </h3>
            {isPopular && (
              <span
                style={{
                  color: "var(--accent-text)",
                  backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
                  borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
                }}
                className="rounded-[5px] border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              >
                Popular
              </span>
            )}
          </div>
          <p style={{ color: colors.muted }} className="mt-1 flex items-center gap-1.5 text-xs text-(--text-muted)">
            {pKey ? <BrandPlatformIcon platform={pKey} size={16} /> : <Tv className="h-3.5 w-3.5" />}
            <span>{pkg.platform || "Instagram"}</span>
            <span aria-hidden>·</span>
            <Clock className="h-3 w-3" />
            <span>{isMonthly ? "Monthly" : `${pkg.turnaroundDays || 2} days delivery`}</span>
          </p>
        </div>
        <p className="shrink-0 text-right leading-tight">
          <span style={{ color: colors.primary }} className="block text-[15px] font-semibold tabular-nums text-(--text)">{value}</span>
          {unit && <span style={{ color: colors.muted }} className="text-[12px] text-(--text-muted)">{unit}</span>}
        </p>
      </div>

      {pkg.description && (
        <p style={{ color: colors.muted }} className="text-xs leading-relaxed text-(--text-muted)">{pkg.description}</p>
      )}

      {bullets.length > 0 && (
        <div>
          <p style={{ color: colors.primary }} className="mb-1 text-xs font-semibold text-(--text)">What&apos;s Included</p>
          <ul className="space-y-1">
            {visible.map((b, i) => (
              <li key={i} style={{ color: colors.secondary }} className="flex items-start gap-1.5 text-xs leading-[17px] text-(--text-secondary)">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-(--accent-text)" strokeWidth={2.5} />
                <span className="break-words">{b}</span>
              </li>
            ))}
          </ul>
          {bullets.length > 4 && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-1 text-[12px] font-semibold text-(--accent-text) hover:underline cursor-pointer">
              {showAll ? "Show less" : `+${bullets.length - 4} more`}
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => onEnquire(pkg)}
        style={{ backgroundColor: "var(--accent)", color: "var(--on-accent)" }}
        className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[5px] px-4 text-[13px] font-medium transition-opacity hover:opacity-95 cursor-pointer sm:w-auto"
      >
        Enquire Now
        <ArrowUpRight className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

function CompactPackageRow({ pkg, colors, onEnquire }: { pkg: MediaKitPackage; colors: AboutColors; onEnquire: (pkg: MediaKitPackage) => void }) {
  const { value, unit } = packagePrice(pkg);
  const pKey = packagePlatformKey(pkg.platform);
  const sub = pkg.description?.trim() || [pkg.platform, pkg.turnaroundDays ? `${pkg.turnaroundDays} days delivery` : ""].filter(Boolean).join(" · ");
  return (
    <li>
      <button
        type="button"
        onClick={() => onEnquire(pkg)}
        className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_4%,transparent)] cursor-pointer"
      >
        {pKey ? (
          <BrandPlatformIcon platform={pKey} size={32} />
        ) : (
          <span
            style={{ backgroundColor: "color-mix(in srgb, var(--accent) 10%, var(--surface))", color: "var(--accent-text)" }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px]"
          >
            <Tv className="h-4 w-4" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span style={{ color: colors.primary }} title={pkg.title} className="line-clamp-2 break-words text-[13px] font-semibold leading-[18px] text-(--text)">{pkg.title}</span>
          {sub && <span style={{ color: colors.muted }} title={sub} className="mt-0.5 line-clamp-2 break-words text-xs leading-4 text-(--text-muted)">{sub}</span>}
        </span>
        <span className="shrink-0 text-right leading-tight">
          <span style={{ color: colors.primary }} className="block whitespace-nowrap text-[13px] font-semibold tabular-nums text-(--text)">{value}</span>
          {unit && <span style={{ color: colors.muted }} className="whitespace-nowrap text-[11px] text-(--text-muted)">{unit.replace(/^\/\s*/, "per ")}</span>}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-(--text-muted) group-hover:text-(--text)" />
      </button>
    </li>
  );
}

export function WorkWithMe({
  packages,
  colors,
  onEnquire,
  compact = false,
  onCustomRequest,
  lockedCount = 0,
}: {
  lockedCount?: number;
  packages: MediaKitPackage[];
  colors: AboutColors;
  onEnquire: (pkg: MediaKitPackage) => void;
  /** Premium profile: one-line rows (tap opens the enquiry) + a single "Get in touch" button. */
  compact?: boolean;
  onCustomRequest?: () => void;
}) {
  const [showAllPackages, setShowAllPackages] = useState(false);
  if (compact) {
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
          <ul className="divide-y divide-(--surface-border)">
            {shownPackages.map((pkg) => (
              <CompactPackageRow key={pkg.id} pkg={pkg} colors={colors} onEnquire={onEnquire} />
            ))}
          </ul>
        )}
        {onCustomRequest && (
          <div className="border-t border-(--surface-border) p-3">
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
          <button type="button" onClick={() => setShowAllPackages((v) => !v)} className={`${SECTION_FOOTER_CTA} border-t border-(--surface-border)`}>
            {showAllPackages ? "Show less" : `View all packages (${packages.length})`}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAllPackages ? "rotate-180" : ""}`} />
          </button>
        )}
      </SectionCard>
    );
  }
  return (
    <SectionCard
      title="Work With Me"
      subtitle="Collab packages for brands."
      count={packages.length > 0 ? `${packages.length} ${packages.length === 1 ? "package" : "packages"}` : undefined}
      colors={colors}
    >
      {packages.length > 0 ? (
        <ul className="divide-y divide-(--surface-border)">
          {packages.map((pkg) => (
            <PackageRow key={pkg.id} pkg={pkg} colors={colors} onEnquire={onEnquire} />
          ))}
        </ul>
      ) : (
        <p style={{ color: colors.muted }} className="px-4 py-6 text-center text-xs text-(--text-muted)">No packages available at the moment.</p>
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
  compact = false,
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
  /** Premium profile: no brand chips, short subtitle. */
  compact?: boolean;
  /** When set, the overflow footer links to the full reviews page instead of expanding in place. */
  allHref?: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? reviews : reviews.slice(0, limit);
  const uniqueBrands = compact && reviews.length > 0 ? [] : Array.from(new Set(brands.map((b) => b.trim()).filter(Boolean)));
  if (reviews.length === 0 && uniqueBrands.length === 0) return null;

  return (
    <SectionCard
      icon={Star}
      lockedCount={lockedCount}
      title={title}
      subtitle={compact ? "Kind words from my collabs." : "Feedback from brands I've worked with."}
      count={reviews.length > 0 ? `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}` : undefined}
      colors={colors}
    >
      <ul className="divide-y divide-(--surface-border)">
        {uniqueBrands.length > 0 && (
          <li className={ROW}>
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
            <li key={rev.id} className={`${ROW} space-y-2`}>
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
            <Link href={allHref} className={SECTION_FOOTER_CTA}>
              View all reviews ({reviews.length})
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
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

// ── 4. Custom collaboration ───────────────────────────────────

export function CustomCollaboration({ colors, onRequest }: { colors: AboutColors; onRequest: () => void }) {
  return (
    <div className={CARD}>
      <AboutHeader title="Custom Collaboration" subtitle="Have something different in mind?" colors={colors} />
      <div className={`flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between ${ROW}`}>
        <p style={{ color: colors.secondary }} className="text-[13px] leading-relaxed text-(--text-secondary)">
          Custom campaign or long-term ambassadorship? Send a brief.
        </p>
        <button type="button" onClick={onRequest} className={`${OUTLINE_BTN} shrink-0`}>
          Send a Custom Request
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
