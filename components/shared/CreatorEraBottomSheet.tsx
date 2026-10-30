"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Check, ArrowRight, Info, ChevronDown } from "lucide-react";
import {
  CreatorEra,
  MAIN_ERAS,
  formatFans,
  getMedalGradient,
  getEraProgress,
} from "@/lib/creatorEra";

export interface CreatorEraBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  era: CreatorEra | null;
  totalFans?: number | null;
  creatorName?: string;
  creatorUsername?: string;
  isCreatorView?: boolean;
  primaryAccounts?: Array<{
    platform: string;
    username: string;
    count?: number;
    url?: string;
  }>;
}

export function CreatorEraBottomSheet({
  isOpen,
  onClose,
  era,
  totalFans,
  creatorName,
  creatorUsername,
  isCreatorView = false,
}: CreatorEraBottomSheetProps) {
  const [howWeCountOpen, setHowWeCountOpen] = useState(false);
  const [expandedEra, setExpandedEra] = useState<string | null>(era?.era || null);

  useEffect(() => {
    if (era?.era) {
      setExpandedEra(era.era);
    }
  }, [era?.era]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !era) return null;

  const fanCount = typeof totalFans === "number" && !isNaN(totalFans) ? totalFans : era.min;
  const progress = getEraProgress(fanCount);
  const displayName = creatorName?.trim() || "Creator";
  const cleanUsername = (creatorUsername || "").trim().replace(/^@/, "");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Sheet / Dialog Content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Creator Era Levels"
        className="relative z-10 w-full sm:max-w-md bg-white rounded-t-[16px] sm:rounded-[12px] border border-[#e2e8f0] shadow-2xl p-5 sm:p-6 text-left max-h-[88vh] flex flex-col animate-in slide-in-from-bottom-5 duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#f1f5f9] shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            {/* Metal Medal Icon */}
            <div
              className="w-9 h-9 rounded-full shrink-0 border border-black/20 shadow-xs flex items-center justify-center"
              style={{ background: getMedalGradient(era.stage) }}
            >
              <span className="text-white text-xs drop-shadow-xs font-black">✦</span>
            </div>

            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-[#0f172a] leading-tight truncate">
                {isCreatorView ? (
                  <>You&apos;re in your <span className="text-[#7A2253]">{era.era} Era</span></>
                ) : (
                  <>{displayName} is a <span className="text-[#7A2253]">{era.badge}</span></>
                )}
              </h3>
              <p className="text-xs text-[#64748b] mt-0.5 font-medium">
                {era.stage} level · {formatFans(fanCount)} total fans
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-[5px] text-[#94a3b8] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Bar towards Next Milestone (if available) */}
        {progress.nextBadge && progress.nextMilestone && (
          <div className="mt-3 p-3 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 shrink-0">
            <div className="flex items-center justify-between text-xs font-semibold text-[#0f172a]">
              <span>
                Next: {progress.nextBadge} at {formatFans(progress.nextMilestone)}
              </span>
              <span className="text-[#64748b]">
                {formatFans(progress.fansNeeded)} to go
              </span>
            </div>
            <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#7A2253] rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress.progressPercent))}%` }}
              />
            </div>
          </div>
        )}

        {/* Creator Era Levels Listing (10 Eras · 30 Tiers) */}
        <div className="py-3 flex-1 overflow-y-auto space-y-1.5 scrollbar-thin">
          <div className="flex items-center justify-between px-1 mb-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
              Creator Era Levels
            </p>
            <span className="text-[10px] text-[#94a3b8] font-medium">10 Eras · 30 Tiers</span>
          </div>

          {MAIN_ERAS.map((m, index) => {
            const isCurrent = m.name === era.era;
            const isExpanded = expandedEra === m.name;

            return (
              <div
                key={m.name}
                className={`rounded-[8px] transition-all text-xs border ${
                  isCurrent
                    ? "bg-[#FFF0F5] border-[#FCE7F3] p-3 shadow-2xs"
                    : isExpanded
                    ? "bg-[#F8FAFC] border-[#E2E8F0] p-2.5"
                    : "bg-[#F8FAFC]/70 hover:bg-[#F1F5F9] border-transparent p-2.5"
                }`}
              >
                {/* Era Row Header (Clickable to toggle sub-levels) */}
                <button
                  type="button"
                  onClick={() => setExpandedEra((prev) => (prev === m.name ? null : m.name))}
                  className="w-full flex items-center justify-between gap-2 text-left cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] text-[10px] font-extrabold ${
                        isCurrent
                          ? "bg-[#7A2253] text-white"
                          : "bg-[#E2E8F0] text-[#64748b]"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span
                      className={`truncate font-bold ${
                        isCurrent ? "text-[#7A2253] text-[13px]" : "text-[#334155]"
                      }`}
                    >
                      {m.name} Era
                    </span>
                    {isCurrent && (
                      <span className="text-[9.5px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-[4px] bg-[#7A2253]/10 text-[#7A2253]">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[11px] font-mono ${
                        isCurrent ? "text-[#7A2253] font-bold" : "text-[#64748b]"
                      }`}
                    >
                      {m.range}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-[#94a3b8] transition-transform duration-200 ${
                        isExpanded ? "rotate-180 text-[#0f172a]" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Sub-levels with metal medal icons (Bronze, Silver, Gold) */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2 border-t border-[#FCE7F3] space-y-1.5 animate-in fade-in duration-150">
                    {m.subLevels.map((sub) => {
                      const isCurrentLevel = isCurrent && sub.stage === era.stage;

                      return (
                        <div
                          key={sub.stage}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-[5px] text-xs transition-colors ${
                            isCurrentLevel
                              ? "bg-[#7A2253] text-white font-bold shadow-2xs"
                              : "bg-white/80 text-[#334155] font-medium border border-[#E2E8F0]/60"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/20"
                              style={{ background: getMedalGradient(sub.stage) }}
                              aria-hidden="true"
                            />
                            <span className="truncate">{sub.badge}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-[11px] font-mono ${
                                isCurrentLevel ? "text-white/90" : "text-[#64748b]"
                              }`}
                            >
                              {sub.range}
                            </span>
                            {isCurrentLevel && (
                              <Check className="h-3.5 w-3.5 stroke-[2.5] text-white shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* "How we count" Collapsible Note */}
        <div className="pt-2 border-t border-[#f1f5f9] shrink-0">
          <button
            type="button"
            onClick={() => setHowWeCountOpen((prev) => !prev)}
            className="flex items-center justify-between w-full py-1 px-1 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] transition-colors cursor-pointer select-none"
          >
            <span className="inline-flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-[#7A2253]" />
              <span>How Creator Era works</span>
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                howWeCountOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {howWeCountOpen && (
            <div className="text-[11px] text-[#64748b] space-y-1.5 px-2 pb-1 pt-2 animate-in fade-in duration-150">
              <p>
                • Counts are calculated from public follower and subscriber counts across verified connected platforms.
              </p>
              <p>• Your Creator Era never goes down — you always keep the highest milestone reached.</p>
              <p>• Total fans reflect cross-platform audience footprint on Inflixo.</p>
            </div>
          )}
        </div>

        {/* CTA Footer */}
        <div className="pt-3 border-t border-[#f1f5f9] shrink-0">
          <Link
            href="/eras"
            onClick={onClose}
            className="tap-scale flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-[6px] bg-[#7A2253] hover:bg-[#681c46] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <span>{isCreatorView ? "See all eras & milestones" : "Find your Creator Era on Inflixo"} →</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
