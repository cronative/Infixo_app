"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, CheckCircle2, Clock, Star, Tv } from "lucide-react";
import type { CreatorReview, MediaKitPackage } from "@/types";
import { AboutHeader, BrandPlatformIcon, PLATFORM_BRAND, type AboutColors } from "@/components/public/about/AboutSections";
import { formatFans } from "@/lib/creatorEra";
import { getInitials } from "@/lib/avatar";

const CARD = "rounded-[5px] border border-(--surface-border) overflow-hidden text-left";
const ROW = "px-3 py-3 sm:px-3.5";
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
  const unit = !raw ? "" : UNIT_LABELS[unitKey] || (unitKey.startsWith("/") ? unitKey : `/ ${unitKey}`);
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
  totalFans,
  topPlatform,
  tags,
  mediaKitHref,
  colors,
  onMediaKitClick,
}: {
  totalFans: number;
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
        {totalFans > 0 && (
          <li className={`flex min-h-11 items-center gap-3 ${ROW} py-2`}>
            {label("Total Fans")}
            <span style={{ color: colors.primary }} className="text-[15px] font-semibold tabular-nums text-(--text)">{formatFans(totalFans)}</span>
          </li>
        )}
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
                  className="rounded-[5px] border border-(--surface-border) bg-(--surface) px-2 py-0.5 text-[11.5px] font-medium text-(--text-secondary)"
                >
                  {t}
                </span>
              ))}
            </span>
          </li>
        )}
        {mediaKitHref && (
          <li className={`flex flex-wrap items-center justify-between gap-2 ${ROW}`}>
            <Link href={mediaKitHref} onClick={onMediaKitClick} className={OUTLINE_BTN}>
              View Media Kit
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <span style={{ color: colors.muted }} className="text-xs text-(--text-muted)">
              Usually replies within 24 hours
            </span>
          </li>
        )}
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
                className="rounded-[4px] border px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider"
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
          {unit && <span style={{ color: colors.muted }} className="text-[11.5px] text-(--text-muted)">{unit}</span>}
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
            <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-1 text-[11.5px] font-semibold text-(--accent-text) hover:underline cursor-pointer">
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

export function WorkWithMe({ packages, colors, onEnquire }: { packages: MediaKitPackage[]; colors: AboutColors; onEnquire: (pkg: MediaKitPackage) => void }) {
  return (
    <div className={CARD}>
      <AboutHeader
        title="Work With Me"
        subtitle="Collab packages for brands."
        count={packages.length > 0 ? `${packages.length} ${packages.length === 1 ? "package" : "packages"}` : undefined}
        colors={colors}
      />
      {packages.length > 0 ? (
        <ul className="divide-y divide-(--surface-border)">
          {packages.map((pkg) => (
            <PackageRow key={pkg.id} pkg={pkg} colors={colors} onEnquire={onEnquire} />
          ))}
        </ul>
      ) : (
        <p style={{ color: colors.muted }} className="px-4 py-6 text-center text-xs text-(--text-muted)">No packages available at the moment.</p>
      )}
    </div>
  );
}

// ── 3. What brands say ────────────────────────────────────────

export function WhatBrandsSay({ reviews, brands, colors }: { reviews: CreatorReview[]; brands: string[]; colors: AboutColors }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? reviews : reviews.slice(0, 4);
  const uniqueBrands = Array.from(new Set(brands.map((b) => b.trim()).filter(Boolean)));
  if (reviews.length === 0 && uniqueBrands.length === 0) return null;

  return (
    <div className={CARD}>
      <AboutHeader
        title="What Brands Say"
        subtitle="Feedback from brands I've worked with."
        count={reviews.length > 0 ? `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}` : undefined}
        colors={colors}
      />
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
                  <span style={{ color: colors.primary }} className="max-w-[120px] truncate text-xs font-medium text-(--text)">{b}</span>
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
                    <span style={{ color: colors.primary }} className="truncate text-[13px] font-semibold text-(--text)">{rev.clientName}</span>
                    {rev.isVerified && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-(--accent-text)" aria-label="Verified" />}
                  </p>
                  {rev.projectTitle && (
                    <p style={{ color: colors.muted }} className="truncate text-xs text-(--text-muted)">{rev.projectTitle}</p>
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
              {rev.comment?.trim() && (
                <p style={{ color: colors.primary }} className="text-[12.5px] leading-relaxed text-(--text)">&ldquo;{rev.comment.trim()}&rdquo;</p>
              )}
            </li>
          );
        })}
        {reviews.length > 4 && (
          <li className="py-2 text-center">
            <button type="button" onClick={() => setShowAll((v) => !v)} className="text-xs font-semibold text-(--accent-text) hover:underline cursor-pointer">
              {showAll ? "Show less" : `Show all ${reviews.length} reviews`}
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}

// ── 4. Custom collaboration ───────────────────────────────────

export function CustomCollaboration({ colors, onRequest }: { colors: AboutColors; onRequest: () => void }) {
  return (
    <div className={CARD}>
      <AboutHeader title="Custom Collaboration" subtitle="Have something different in mind?" colors={colors} />
      <div className={`flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between ${ROW}`}>
        <p style={{ color: colors.secondary }} className="text-[12.5px] leading-relaxed text-(--text-secondary)">
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
