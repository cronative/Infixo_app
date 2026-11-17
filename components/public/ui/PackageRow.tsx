"use client";

import { Tv } from "lucide-react";
import type { MediaKitPackage } from "@/types";
import { BrandPlatformIcon } from "./BrandPlatformIcon";
import { ListRow } from "./ListRow";
import { CARD_ITEM, CARD_ITEM_HOVER, type SectionColors } from "./tokens";

// ── Package price helpers (same rules as the legacy PackageCard) ──

const UNIT_LABELS: Record<string, string> = {
  per_reel: "/ reel",
  per_post: "/ post",
  per_video: "/ video",
  per_package: "/ package",
  per_month: "/ month",
};

/** "₹12,000" / "From ₹5,000" / "Contact for pricing", plus its "/ reel" unit. */
export function packagePrice(pkg: MediaKitPackage) {
  const raw = (pkg.price || "").trim().replace(/^₹\s*/, "");
  const numeric = /^[\d,]+(\.\d+)?$/.test(raw) ? Number(raw.replace(/,/g, "")) : NaN;
  const value = !raw ? "Contact for pricing" : Number.isFinite(numeric) ? `₹${numeric.toLocaleString("en-IN")}` : `₹${raw}`;
  const isMonthly = pkg.title.toLowerCase().includes("monthly");
  const unitKey = pkg.priceUnit || (isMonthly ? "per_month" : "per_package");
  const unit = !raw ? "" : UNIT_LABELS[unitKey] || (unitKey.startsWith("/") ? unitKey : `/ ${unitKey.replace(/^per_/, "").replace(/_/g, " ")}`);
  return { value: pkg.isStartingPrice && raw ? `From ${value}` : value, unit, isMonthly: unitKey === "per_month" || isMonthly };
}

export function packagePlatformKey(platform: string) {
  const p = (platform || "").toLowerCase();
  if (p.includes("instagram") || p.includes("reel")) return "instagram";
  if (p.includes("youtube")) return "youtube";
  if (p.includes("facebook")) return "facebook";
  return null;
}

/** Collab package row: platform icon · 2-line title + description · price (never wraps) · › (tap opens the enquiry). */
export function PackageRow({ pkg, colors, onEnquire }: { pkg: MediaKitPackage; colors: SectionColors; onEnquire: (pkg: MediaKitPackage) => void }) {
  const { value, unit } = packagePrice(pkg);
  const pKey = packagePlatformKey(pkg.platform);
  const sub = pkg.description?.trim() || [pkg.platform, pkg.turnaroundDays ? `${pkg.turnaroundDays} days delivery` : ""].filter(Boolean).join(" · ");
  return (
    <li>
      <ListRow
        onClick={() => onEnquire(pkg)}
        className={`gap-3 p-3 ${CARD_ITEM} ${CARD_ITEM_HOVER}`}
        leading={
          pKey ? (
            <BrandPlatformIcon platform={pKey} size={32} />
          ) : (
            <span
              style={{ backgroundColor: "color-mix(in srgb, var(--accent) 10%, var(--surface))", color: "var(--accent-text)" }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px]"
            >
              <Tv className="h-4 w-4" />
            </span>
          )
        }
        title={pkg.title}
        titleStyle={{ color: colors.primary }}
        titleClassName="text-[13px] font-semibold leading-[18px] text-(--text)"
        subtitle={
          sub ? (
            <span style={{ color: colors.muted }} title={sub} className="mt-0.5 line-clamp-2 break-words text-xs leading-4 text-(--text-muted)">
              {sub}
            </span>
          ) : undefined
        }
        meta={
          <span className="shrink-0 text-right leading-tight">
            <span style={{ color: colors.primary }} className="block whitespace-nowrap text-[13px] font-semibold tabular-nums text-(--text)">{value}</span>
            {unit && <span style={{ color: colors.muted }} className="whitespace-nowrap text-[11px] text-(--text-muted)">{unit.replace(/^\/\s*/, "per ")}</span>}
          </span>
        }
        arrow="chevron"
      />
    </li>
  );
}
