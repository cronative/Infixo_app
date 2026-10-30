"use client";

import { useState } from "react";
import { Check, Clock, Tv, Briefcase, ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";
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
        backgroundColor: "var(--surface)",
        borderColor: "var(--surface-border)",
      }}
      className="rounded-[8px] border overflow-hidden text-left transition-all shadow-2xs flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div
          style={{ borderColor: "var(--surface-border)" }}
          className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b flex items-start justify-between gap-2.5"
        >
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <Briefcase className="h-4 w-4 text-(--accent-text) shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-[13.5px] sm:text-sm text-(--text) tracking-tight leading-snug truncate">
                {pkg.title}
              </h3>
              {pkg.description && (
                <p className="text-[11px] sm:text-xs text-(--text-muted) font-normal mt-0.5 leading-snug">
                  {pkg.description}
                </p>
              )}
            </div>
          </div>

          {isPopular && (
            <span
              style={{
                color: "var(--accent-text)",
                backgroundColor: "var(--accent-soft)",
                borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
              }}
              className="shrink-0 text-[10.5px] sm:text-[11px] font-bold px-2 py-0.5 rounded-[4px] border uppercase tracking-wider"
            >
              Popular
            </span>
          )}
        </div>

        {/* Price & Meta Row */}
        <div className="px-3.5 pt-3 pb-2.5 sm:px-4 sm:pt-3.5 sm:pb-3 space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1">
              <span className="font-black text-lg sm:text-xl text-(--text) tracking-tight tabular-nums">
                {formattedPrice}
              </span>
              <span className="text-xs text-(--text-muted) font-normal">
                {unitLabel}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs text-(--text-muted) shrink-0">
              <Clock className="h-3.5 w-3.5 text-(--text-muted) shrink-0" />
              <span>{deliveryLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-(--text-muted)">
            {getPlatformIcon()}
            <span>{platformName}</span>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{ borderColor: "var(--surface-border)" }}
          className="mx-3.5 sm:mx-4 border-t opacity-70 my-1"
          aria-hidden="true"
        />

        {/* What's Included */}
        {bullets.length > 0 && (
          <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 space-y-2">
            <span className="font-semibold text-xs sm:text-[12.5px] text-(--text) block">
              What&apos;s Included
            </span>

            <ul className="space-y-1.5 sm:space-y-2">
              {visibleBullets.map((bullet, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs sm:text-[12.5px] text-(--text) leading-relaxed"
                >
                  <Check className="h-3.5 w-3.5 text-(--accent-text) stroke-[2.5] shrink-0 mt-0.5" />
                  <span className="flex-1 text-(--text)/90">{bullet}</span>
                </li>
              ))}
            </ul>

            {/* Toggle +n more */}
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAllBullets(!showAllBullets)}
                className="mt-1 text-xs font-semibold text-(--text-muted) hover:text-(--text) inline-flex items-center gap-1 cursor-pointer transition-colors pt-1"
              >
                <span>{showAllBullets ? "Show less" : `+${hiddenCount} more`}</span>
                {showAllBullets ? <ChevronUp className="h-3 w-3 text-(--icon)" /> : <ChevronDown className="h-3 w-3 text-(--icon)" />}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 pt-1">
        <button
          type="button"
          onClick={() => onEnquire(pkg)}
          style={{
            backgroundColor: "var(--accent)",
            color: "var(--on-accent)",
          }}
          className="w-full py-2.5 px-4 rounded-[6px] font-bold text-xs sm:text-[13px] flex items-center justify-center gap-1.5 transition-all hover:opacity-95 shadow-xs cursor-pointer select-none active:scale-[0.99]"
        >
          <span>Enquire Now</span>
          <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
