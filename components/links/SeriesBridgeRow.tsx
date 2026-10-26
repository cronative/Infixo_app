"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Series } from "@/types";
import { SHOW_SERIES_BRIDGE } from "@/components/series/seriesConfig";

export interface SeriesBridgeRowProps {
  series: Series[];
  creatorUsername?: string;
  className?: string;
}

export function SeriesBridgeRow({
  series,
  creatorUsername,
  className = "",
}: SeriesBridgeRowProps) {
  if (!SHOW_SERIES_BRIDGE || !series || series.length === 0) {
    return null;
  }

  // Get featured or latest series (first series in list)
  const activeSeries = (series as any[]).find((s) => s.isFeatured) || series[0];
  if (!activeSeries) return null;

  const handle = creatorUsername ? creatorUsername.replace(/^@/, "") : "creator";
  const href = `/${handle}/series/${activeSeries.id}`;

  return (
    <Link
      href={href}
      className={`group flex items-center justify-between gap-3 h-[44px] min-h-[44px] px-3.5 rounded-xl border border-[#7A2253]/15 bg-[#7A2253]/[0.05] dark:bg-[#7A2253]/15 text-[#7A2253] dark:text-pink-300 transition-all duration-150 ease-out hover:bg-[#7A2253]/10 dark:hover:bg-[#7A2253]/25 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A2253] focus-visible:ring-offset-1 cursor-pointer select-none ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-[11px] leading-none shrink-0 text-[#7A2253] dark:text-pink-400">
          ▶
        </span>
        <span className="text-xs sm:text-[13px] font-medium truncate leading-tight">
          Now streaming: <span className="font-bold">{activeSeries.title}</span>
        </span>
      </div>

      <ArrowRight className="h-4 w-4 text-[#7A2253] dark:text-pink-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}
