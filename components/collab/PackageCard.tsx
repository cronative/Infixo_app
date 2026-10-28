"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { MediaKitPackage, PackagePriceUnit } from "@/types";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
  LinkedinIcon,
  XTwitterIcon,
  SpotifyIcon,
} from "@/components/shared/BrandIcons";
import { BRAND_TEXT } from "@/lib/brandColors";

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
  brandPrimary = "var(--accent)",
  isDark = false,
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
      return <InstagramIcon className={`h-3.5 w-3.5 ${BRAND_TEXT.instagram} shrink-0`} />;
    }
    if (pLower.includes("youtube")) {
      return <YoutubeIcon className={`h-3.5 w-3.5 ${BRAND_TEXT.youtube} shrink-0`} />;
    }
    if (pLower.includes("facebook")) {
      return <FacebookIcon className={`h-3.5 w-3.5 ${BRAND_TEXT.facebook} shrink-0`} />;
    }
    if (pLower.includes("linkedin")) {
      return <LinkedinIcon className="h-3.5 w-3.5 text-(--accent-text) shrink-0" />;
    }
    if (pLower.includes("twitter") || pLower.includes("x ")) {
      return <XTwitterIcon className="h-3.5 w-3.5 text-(--text) shrink-0" />;
    }
    if (pLower.includes("spotify") || pLower.includes("podcast")) {
      return <SpotifyIcon className="h-3.5 w-3.5 text-(--accent-text) shrink-0" />;
    }
    return null;
  };

  // Meta line label: "Monthly · {n} deliverables" or "{Platform} · Delivery in {n} days"
  const isMonthly = rawUnit === "per_month" || isMonthlyTitle;
  const metaLine = isMonthly
    ? `${platformName} · Monthly`
    : `${platformName} · Delivery in ${pkg.turnaroundDays || 2} days`;

  const bullets = pkg.deliverables || [];
  const visibleBullets = showAllBullets ? bullets : bullets.slice(0, 4);
  const hiddenCount = bullets.length - 4;

  return (
    <div
      style={{
        borderColor: isPopular ? brandPrimary : "var(--surface-border)",
        borderWidth: isPopular ? "1.5px" : "1px",
      }}
      className={`relative rounded-xl bg-(--card-bg) p-4 sm:p-4.5 transition-all shadow-xs flex flex-col justify-between text-left`}
    >
      <div>
        {/* Most popular label above title */}
        {isPopular && (
          <div className="mb-1.5 flex items-center">
            <span
              style={{ color: "var(--accent-text)" }}
              className="text-[11px] font-bold tracking-wider uppercase"
            >
              Most popular
            </span>
          </div>
        )}

        {/* Row 1: [Title ... Price on right] */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-[15px] sm:text-base text-(--text) leading-snug tracking-tight">
            {pkg.title}
          </h3>
          <div className="text-right shrink-0">
            <span className="font-bold text-[15px] sm:text-base text-(--text) whitespace-nowrap">
              {formattedPrice}
            </span>
            <span className="text-xs text-(--text-muted) font-normal ml-1">
              {unitLabel}
            </span>
          </div>
        </div>

        {/* Row 2: Meta line */}
        <div className="mt-1 flex items-center gap-1.5 text-xs text-(--text-muted) ">
          {getPlatformIcon()}
          <span>{metaLine}</span>
        </div>

        {/* Row 3: Bullet list */}
        {bullets.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {visibleBullets.map((bullet, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-[13px] text-(--text) leading-relaxed"
              >
                <span
                  style={{ color: "var(--accent-text)" }}
                  className="mt-0.5 shrink-0 flex items-center justify-center font-bold"
                >
                  <Check className="h-3.5 w-3.5 stroke-[2.8]" />
                </span>
                <span className="flex-1">{bullet}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Toggle +n more */}
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAllBullets(!showAllBullets)}
            className="mt-2 text-xs font-semibold text-(--text-muted) hover:text-(--text) inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{showAllBullets ? "Show less" : `+${hiddenCount} more`}</span>
            {showAllBullets ? <ChevronUp className="h-3 w-3 text-(--icon)" /> : <ChevronDown className="h-3 w-3 text-(--icon)" />}
          </button>
        )}
      </div>

      {/* Row 4: Action Button */}
      <div className="mt-3.5 pt-1">
        <button
          type="button"
          onClick={() => onEnquire(pkg)}
          style={{
            borderColor: isPopular ? brandPrimary : "var(--accent-text)",
            backgroundColor: isPopular ? brandPrimary : "transparent",
            color: isPopular ? "var(--on-accent)" : "var(--accent-text)",
          }}
          className={`w-full h-9 rounded-lg font-semibold text-xs sm:text-[13px] border transition-all cursor-pointer flex items-center justify-center hover:opacity-95 active:scale-[0.99]`}
        >
          Enquire
        </button>
      </div>
    </div>
  );
}
