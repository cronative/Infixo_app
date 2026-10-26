"use client";

import { Download } from "lucide-react";
import { MediaKitSettings, SocialAccounts } from "@/types";
import { formatCount } from "@/utils/format";

const SHOW_MEDIA_KIT_PDF = false;

interface MediaKitSnapshotCardProps {
  settings?: MediaKitSettings;
  socials?: SocialAccounts;
  totalAudience?: number;
  brandPrimary?: string;
  isDark?: boolean;
}

function formatUpdatedDate(dateStr?: string): string {
  try {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime())) return "Oct 2026";
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return "Oct 2026";
  }
}

export function MediaKitSnapshotCard({
  settings,
  socials,
  totalAudience = 0,
  brandPrimary = "#7A2253",
  isDark = false,
}: MediaKitSnapshotCardProps) {
  // Stat 1: Combined followers
  const combinedFollowers = totalAudience > 0 ? formatCount(totalAudience) : null;

  // Stat 2: Avg reel views
  let avgReelViews: string | null = null;
  if (settings?.avgReelViews) {
    const rawViews = String(settings.avgReelViews).trim();
    if (rawViews && rawViews !== "0" && rawViews.toUpperCase() !== "N/A") {
      const num = Number(rawViews.replace(/[^0-9.]/g, ""));
      if (!isNaN(num) && num > 0 && !rawViews.toLowerCase().includes("k") && !rawViews.toLowerCase().includes("m")) {
        avgReelViews = formatCount(num);
      } else {
        avgReelViews = rawViews;
      }
    }
  }

  // Stat 3: Engagement rate
  let engagementRate: string | null = null;
  if (settings?.engagementRate) {
    const rawRate = String(settings.engagementRate).trim();
    if (rawRate && rawRate !== "0" && rawRate !== "0%" && rawRate.toUpperCase() !== "N/A") {
      engagementRate = rawRate.endsWith("%") ? rawRate : `${rawRate}%`;
    }
  }

  // Stat 4: Top cities (up to 3)
  let topCities: string | null = null;
  if (settings?.topCities) {
    const rawCities = String(settings.topCities).trim();
    if (rawCities && rawCities.toUpperCase() !== "N/A") {
      const cityList = rawCities
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .slice(0, 3);
      if (cityList.length > 0) {
        topCities = cityList.join(", ");
      }
    }
  }

  // Build stat tiles list (hidden if empty or null)
  const statTiles: { label: string; value: string; isCity?: boolean }[] = [];
  if (combinedFollowers) {
    statTiles.push({ label: "Combined followers", value: combinedFollowers });
  }
  if (avgReelViews) {
    statTiles.push({ label: "Avg. reel views", value: avgReelViews });
  }
  if (engagementRate) {
    statTiles.push({ label: "Engagement rate", value: engagementRate });
  }
  if (topCities) {
    statTiles.push({ label: "Top cities", value: topCities, isCity: true });
  }

  // Per-platform breakdown: "IG 10.4K · YT 8.2K · FB 2.4K"
  const platformParts: string[] = [];
  if (socials?.instagram?.followers && socials.instagram.followers > 0) {
    platformParts.push(`IG ${formatCount(socials.instagram.followers)}`);
  }
  if (socials?.youtube?.subscribers && socials.youtube.subscribers > 0) {
    platformParts.push(`YT ${formatCount(socials.youtube.subscribers)}`);
  }
  if (socials?.facebook?.followers && socials.facebook.followers > 0) {
    platformParts.push(`FB ${formatCount(socials.facebook.followers)}`);
  }
  const platformBreakdown = platformParts.join(" · ");

  // Content languages chips
  let languages: string[] = [];
  if (settings?.contentLanguages) {
    if (Array.isArray(settings.contentLanguages)) {
      languages = settings.contentLanguages.map((l) => String(l).trim()).filter(Boolean);
    } else {
      languages = String(settings.contentLanguages)
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
    }
  }

  // Categories chips
  let categories: string[] = [];
  if (settings?.categories) {
    if (Array.isArray(settings.categories)) {
      categories = settings.categories.map((c) => String(c).trim()).filter(Boolean);
    } else {
      categories = String(settings.categories)
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
    }
  }

  const updatedDateLabel = formatUpdatedDate(settings?.updatedAt);

  return (
    <div className="rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-[#1E1E24] p-4 sm:p-5 shadow-xs text-left">
      {/* Header: "Audience" + "Updated {Mon YYYY}" */}
      <div className="flex items-center justify-between pb-3">
        <h3 className="font-bold text-base sm:text-[17px] text-zinc-900 dark:text-zinc-100 tracking-tight">
          Audience
        </h3>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
          Updated {updatedDateLabel}
        </span>
      </div>

      {/* Row of stat tiles: 2 cols on mobile, 4 on desktop */}
      {statTiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
          {statTiles.map((tile, i) => (
            <div
              key={i}
              className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-700/60 p-2.5 sm:p-3 flex flex-col justify-center"
            >
              <div
                className={`font-bold text-zinc-900 dark:text-zinc-100 leading-tight ${
                  tile.isCity
                    ? "text-xs sm:text-[13px] line-clamp-1"
                    : "text-base sm:text-lg tracking-tight"
                }`}
                title={tile.value}
              >
                {tile.value}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5 line-clamp-1">
                {tile.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Per-platform breakdown line */}
      {platformBreakdown && (
        <div className="mt-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 pt-0.5 flex items-center gap-1.5 flex-wrap">
          <span className="text-zinc-400 dark:text-zinc-500 font-normal">Platforms:</span>
          <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{platformBreakdown}</span>
        </div>
      )}

      {/* Optional extras: Languages and Categories as small neutral chips */}
      {(languages.length > 0 || categories.length > 0) && (
        <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center gap-2">
          {languages.map((lang, idx) => (
            <span
              key={`lang_${idx}`}
              className="inline-flex items-center text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-0.5 rounded-md"
            >
              {lang}
            </span>
          ))}
          {categories.map((cat, idx) => (
            <span
              key={`cat_${idx}`}
              className="inline-flex items-center text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-0.5 rounded-md"
            >
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* Download Media Kit PDF button (hidden behind flag) */}
      {SHOW_MEDIA_KIT_PDF && (
        <div className="mt-4 pt-2">
          <button
            type="button"
            className="w-full h-9 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download media kit (PDF)</span>
          </button>
        </div>
      )}
    </div>
  );
}
