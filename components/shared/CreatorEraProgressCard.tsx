"use client";

import { useMemo, useState } from "react";
import { getCreatorEra, getEraProgress, formatFans } from "@/lib/creatorEra";
import { CreatorEraBadge } from "@/components/shared/CreatorEraBadge";
import { CreatorEraBottomSheet } from "@/components/shared/CreatorEraBottomSheet";
import { Sparkles, Share2 } from "lucide-react";

export interface CreatorEraProgressCardProps {
  fanbase: number | null | undefined;
  peakFanbase?: number | null | undefined;
  className?: string;
  onShareClick?: () => void;
  showShareButton?: boolean;
}

export function CreatorEraProgressCard({
  fanbase,
  peakFanbase,
  className = "",
  onShareClick,
  showShareButton = false,
}: CreatorEraProgressCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const effectiveFanbase = useMemo(() => {
    const rawFanbase = typeof fanbase === "number" && !isNaN(fanbase) ? fanbase : null;
    const rawPeak = typeof peakFanbase === "number" && !isNaN(peakFanbase) ? peakFanbase : null;
    if (rawFanbase === null && rawPeak === null) return null;
    return Math.max(rawPeak ?? 0, rawFanbase ?? 0);
  }, [fanbase, peakFanbase]);

  const era = useMemo(() => getCreatorEra(effectiveFanbase), [effectiveFanbase]);
  const progress = useMemo(() => getEraProgress(effectiveFanbase), [effectiveFanbase]);

  if (!era || effectiveFanbase === null) return null;

  const milestoneText = progress.nextBadge
    ? `${formatFans(progress.fansNeeded)} fans to ${progress.nextBadge}`
    : "Top Creator Era reached 👑";

  return (
    <>
      <div
        className={`rounded-[5px] border border-[#ECECF0] bg-[#FAFAFB] p-3.5 sm:p-4 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}
      >
        {/* Left: Badge + "2,300 fans to Shining III" */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <CreatorEraBadge
            badge={era.badge}
            size="md"
            onClick={() => setSheetOpen(true)}
          />
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#18181B]">
            <Sparkles className="h-3.5 w-3.5 text-[#7A2253] shrink-0" />
            <span>{milestoneText}</span>
          </div>
        </div>

        {/* Right: Progress Bar & Optional Share button */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 w-full sm:w-auto">
          <div className="flex-1 sm:w-48 flex items-center gap-2">
            <div
              className="flex-1 h-2 rounded-full bg-[#ECECF0] overflow-hidden"
              role="progressbar"
              aria-valuenow={progress.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-[#7A2253] transition-all duration-500"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
            <span className="text-[12px] font-medium text-[#7A2253] tabular-nums shrink-0">
              {progress.progressPercent}%
            </span>
          </div>

          {showShareButton && onShareClick && (
            <button
              type="button"
              onClick={onShareClick}
              className="inline-flex h-8 items-center gap-1.5 px-3 rounded-[5px] bg-[#7A2253] text-white hover:bg-[#681c46] text-[13px] font-medium transition-colors cursor-pointer shrink-0"
              title="Share Creator Era card"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share Era</span>
            </button>
          )}
        </div>
      </div>

      <CreatorEraBottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        era={era}
        totalFans={effectiveFanbase}
        isCreatorView={true}
      />
    </>
  );
}
