"use client";

import { useState } from "react";
import { Check, Clock, Tv, ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";
import { MediaKitPackage } from "@/types";
import {
  InstagramOutlineIcon,
  YoutubeOutlineIcon,
  FacebookOutlineIcon,
} from "@/components/shared/BrandIcons";

interface PackageCardProps {
  pkg: MediaKitPackage;
  onEnquire: (pkg: MediaKitPackage) => void;
  brandPrimary?: string;
  isDark?: boolean;
}

const UNIT_LABELS: Record<string, string> = {
  per_reel: "/ reel",
  per_post: "/ post",
  per_video: "/ video",
  per_package: "/ package",
  per_month: "/ month",
};

export function PackageCard({
  pkg,
  onEnquire,
}: PackageCardProps) {
  const [showAllBullets, setShowAllBullets] = useState(false);

  const rawPrice = pkg.price?.trim() || "";
  const numericPrice = rawPrice.startsWith("₹") ? rawPrice : `₹${rawPrice}`;

  // Resolve price unit
  const isMonthlyTitle = pkg.title.toLowerCase().includes("monthly");
  const rawUnit = pkg.priceUnit || (isMonthlyTitle ? "per_month" : "per_package");
  const unitLabel = UNIT_LABELS[rawUnit] || (rawUnit.startsWith("/") ? rawUnit : `/${rawUnit}`);

  const formattedPrice = pkg.isStartingPrice ? `From ${numericPrice}` : numericPrice;
  const isPopular = Boolean(pkg.isPopular || pkg.badge?.toLowerCase().includes("popular"));

  // Meta line icon
  const platformName = pkg.platform || "Instagram";
  const pLower = platformName.toLowerCase();

  const getPlatformIcon = () => {
    if (pLower.includes("instagram") || pLower.includes("reel") || pLower.includes("story")) {
      return <InstagramOutlineIcon className="h-3.5 w-3.5 text-(--text-muted) shrink-0" />;
    }
    if (pLower.includes("youtube") || pLower.includes("vlog")) {
      return <YoutubeOutlineIcon className="h-3.5 w-3.5 text-(--text-muted) shrink-0" />;
    }
    if (pLower.includes("facebook")) {
      return <FacebookOutlineIcon className="h-3.5 w-3.5 text-(--text-muted) shrink-0" />;
    }
    return <Tv className="h-3.5 w-3.5 text-(--text-muted) shrink-0" />;
  };

  const isMonthly = rawUnit === "per_month" || isMonthlyTitle;
  const deliveryLabel = isMonthly ? "Monthly" : `${pkg.turnaroundDays || 2} days`;

  const bullets = pkg.deliverables || [];
  const visibleBullets = showAllBullets ? bullets : bullets.slice(0, 4);
  const hiddenCount = bullets.length - 4;

  return (
    <div
      style={{
        backgroundColor: "transparent",
        borderColor: "var(--surface-border)",
      }}
      className="rounded-[5px] border overflow-hidden text-left transition-all shadow-none flex flex-col justify-between h-full"
    >
      <div>
        {/* Compact theme-tinted package header containing title, subtitle, left-aligned price, and meta row */}
        <div
          style={{
            backgroundColor: "color-mix(in srgb, var(--accent) 6%, var(--surface))",
            borderColor: "var(--surface-border)",
          }}
          className="px-3 py-2.5 sm:px-3.5 sm:py-3 border-b space-y-1"
        >
          {/* Row 1: Package Title & Popular badge on right */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-[13px] text-(--text) tracking-tight leading-[18px] truncate">
              {pkg.title}
            </h3>
            {isPopular && (
              <span
                style={{
                  color: "var(--accent-text)",
                  backgroundColor: "color-mix(in srgb, var(--accent) 12%, var(--surface))",
                  borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
                }}
                className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] border uppercase tracking-wider"
              >
                Popular
              </span>
            )}
          </div>

          {/* Row 2: Platform icon + platform name | thin vertical divider | clock icon + delivery time */}
          <div className="flex items-center gap-1.5 text-xs text-(--text-muted) leading-[17px] pt-0.5">
            <div className="flex items-center gap-1">
              {getPlatformIcon()}
              <span className="leading-none">{platformName}</span>
            </div>
            <span className="text-(--surface-border) font-light select-none" aria-hidden="true">|</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-(--text-muted) shrink-0" />
              <span className="leading-none">{deliveryLabel}</span>
            </div>
          </div>

          {/* Row 3: Price and billing unit, LEFT-ALIGNED */}
          <div className="flex items-baseline gap-1 pt-0.5">
            <span className="font-semibold text-[15px] sm:text-base text-(--text) tracking-tight tabular-nums leading-[21px]">
              {formattedPrice}
            </span>
            <span className="text-xs text-(--text-muted) font-normal leading-[17px]">
              {unitLabel}
            </span>
          </div>

          {/* Row 4: Package Description */}
          {pkg.description && (
            <p className="text-xs text-(--text-muted) font-normal leading-[17px] pt-0.5">
              {pkg.description}
            </p>
          )}
        </div>

        {/* Package Body: What's Included */}
        {bullets.length > 0 && (
          <div className="p-2.5 sm:p-3 space-y-2">
            <span className="font-medium text-xs text-(--text) block leading-[18px]">
              What&apos;s Included
            </span>

            <ul className="space-y-1.5">
              {visibleBullets.map((bullet, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs text-(--text) leading-[18px]"
                >
                  <Check className="h-3.5 w-3.5 text-(--accent-text) stroke-[2] shrink-0 mt-0.5" />
                  <span className="flex-1 text-(--text)/90">{bullet}</span>
                </li>
              ))}
            </ul>

            {/* Toggle +n more */}
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAllBullets(!showAllBullets)}
                className="mt-1 text-xs font-medium text-(--text-muted) hover:text-(--text) inline-flex items-center gap-1 cursor-pointer transition-colors pt-0.5"
              >
                <span>{showAllBullets ? "Show less" : `+${hiddenCount} more`}</span>
                {showAllBullets ? <ChevronUp className="h-3 w-3 text-(--icon)" /> : <ChevronDown className="h-3 w-3 text-(--icon)" />}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action Button: Enquire Now (Full-width edge-to-edge, 0px radius clipped by parent card) */}
      <button
        type="button"
        onClick={() => onEnquire(pkg)}
        style={{
          backgroundColor: "var(--accent)",
          color: "var(--on-accent)",
        }}
        className="w-full min-h-[44px] py-2.5 px-3 rounded-none border-t border-(--surface-border) font-medium text-[13px] leading-[18px] flex items-center justify-center gap-1.5 transition-all hover:opacity-95 shadow-none cursor-pointer select-none active:scale-[0.99] mt-auto"
      >
        <span>Enquire Now</span>
        <ArrowUpRight className="h-3.5 w-3.5 stroke-[2]" />
      </button>
    </div>
  );
}
