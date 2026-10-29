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
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
} from "@/components/shared/BrandIcons";
import { BRAND_BG } from "@/lib/brandColors";

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

function getTierEmoji(stage: string): string {
  const s = (stage || "").toLowerCase();
  if (s.includes("bronze")) return "🥉";
  if (s.includes("silver")) return "🥈";
  if (s.includes("gold")) return "🥇";
  return "✨";
}

function getPlatformIcon(platform: string) {
  const p = platform.toLowerCase();
  if (p === "instagram") return <InstagramIcon className="h-3.5 w-3.5 text-white" />;
  if (p === "youtube") return <YoutubeIcon className="h-3.5 w-3.5 text-white" />;
  if (p === "facebook") return <FacebookIcon className="h-3.5 w-3.5 text-white" />;
  return null;
}

function getPlatformBg(platform: string) {
  const p = platform.toLowerCase();
  if (p === "instagram") return BRAND_BG.instagram;
  if (p === "youtube") return BRAND_BG.youtube;
  if (p === "facebook") return BRAND_BG.facebook;
  return "bg-slate-700";
}

export function CreatorEraBottomSheet({
  isOpen,
  onClose,
  era,
  totalFans,
  creatorName,
  creatorUsername,
  isCreatorView = false,
  primaryAccounts = [],
}: CreatorEraBottomSheetProps) {
  const [howWeCountOpen, setHowWeCountOpen] = useState(false);

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

  // PUBLIC COMPACT POPUP (Requirement F)
  if (!isCreatorView) {
    const validAccounts = primaryAccounts.filter((a) => a.username || (a.count && a.count > 0));

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
        <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${displayName} Creator Era`}
          className="relative z-10 w-full sm:max-w-[420px] bg-white rounded-t-[16px] sm:rounded-[12px] border border-[#e2e8f0] shadow-2xl p-5 sm:p-6 text-left max-h-[70vh] flex flex-col justify-between animate-in slide-in-from-bottom-5 duration-200 overflow-y-auto"
        >
          <div>
            {/* Top Row: Title + Close */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 pr-2">
                <h3 className="text-base sm:text-lg font-bold text-[#0f172a] leading-tight">
                  {displayName} is a {era.badge} {getTierEmoji(era.stage)}
                </h3>
                <p className="text-xs sm:text-sm text-[#64748b] mt-1 font-medium">
                  {formatFans(fanCount)} people follow {displayName}&apos;s journey
                </p>
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

            {/* Breakdown: Primary accounts only */}
            <div className="mt-4 p-3.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
              {validAccounts.length > 0 ? (
                validAccounts.map((acc) => (
                  <div key={acc.platform + acc.username} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] ${getPlatformBg(acc.platform)} shadow-2xs`}>
                        {getPlatformIcon(acc.platform)}
                      </span>
                      <span className="font-semibold text-[#0f172a] truncate">
                        @{acc.username.replace(/^@/, "")}
                      </span>
                    </div>
                    <span className="font-bold text-[#0f172a] tabular-nums shrink-0">
                      {formatFans(acc.count || 0)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between text-xs text-[#64748b]">
                  <span>Connected primary platforms</span>
                  <span className="font-bold text-[#0f172a]">{formatFans(fanCount)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-end font-bold text-xs text-[#0f172a]">
                <span>= {formatFans(fanCount)} total fans</span>
              </div>
            </div>

            {/* Explanation */}
            <p className="text-[11.5px] text-[#64748b] mt-3 leading-normal">
              Counted from public followers &amp; subscribers. The era never goes down.
            </p>

            {/* See all eras link */}
            <div className="mt-2.5">
              <Link
                href="/eras"
                onClick={onClose}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#7A2253] hover:underline"
              >
                <span>See all eras →</span>
              </Link>
            </div>
          </div>

          {/* Footer strip */}
          <div className="mt-5 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-3 sm:p-3.5 bg-[#FFF0F5] border-t border-[#FCE7F3] rounded-b-[12px]">
            <Link
              href={cleanUsername ? `/login?ref=era&from=${cleanUsername}` : `/login?ref=era`}
              onClick={onClose}
              className="text-xs font-bold text-[#7A2253] hover:underline block leading-snug"
            >
              Are you a creator too? ✨ Find your Creator Era — create your free Inflixo profile →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // CREATOR / DASHBOARD VIEW (Full Ladder + Progress Bar)
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Sheet Content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Creator Era Ladder"
        className="relative z-10 w-full sm:max-w-md bg-white rounded-t-[16px] sm:rounded-[12px] border border-[#e2e8f0] shadow-2xl p-5 sm:p-6 text-left max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-5 duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#f1f5f9]">
          <div className="flex items-start gap-3 min-w-0">
            {/* Medal */}
            <div
              className="w-9 h-9 rounded-full shrink-0 border border-black/20 shadow-xs flex items-center justify-center"
              style={{ background: getMedalGradient(era.stage) }}
            >
              <span className="text-white text-xs drop-shadow-xs font-black">✦</span>
            </div>

            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-[#0f172a] leading-tight truncate">
                You&apos;re in your <span className="text-[#7A2253]">{era.era} Era</span>
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

        {/* Creator View Only: Progress Bar */}
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

        {/* 10-Era Ladder */}
        <div className="py-3 flex-1 overflow-y-auto space-y-1.5 scrollbar-thin">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] px-1 mb-1">
            Creator Era Ladder
          </p>
          {MAIN_ERAS.map((m, index) => {
            const isCurrent = m.name === era.era;
            return (
              <div
                key={m.name}
                className={`rounded-[8px] transition-all text-xs ${
                  isCurrent
                    ? "bg-[#FFF0F5] border border-[#FCE7F3] p-3 shadow-2xs"
                    : "bg-[#F8FAFC] hover:bg-[#F1F5F9] p-2.5"
                }`}
              >
                {/* Era Row Header */}
                <div className="flex items-center justify-between gap-2">
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
                  </div>

                  <span
                    className={`text-[11px] font-mono ${
                      isCurrent ? "text-[#7A2253] font-bold" : "text-[#64748b]"
                    }`}
                  >
                    {m.range}
                  </span>
                </div>

                {/* Expanded 3 sub-levels for current era */}
                {isCurrent && (
                  <div className="mt-2.5 pt-2 border-t border-[#FCE7F3] space-y-1.5">
                    {m.subLevels.map((sub) => {
                      const isCurrentLevel = sub.stage === era.stage;
                      return (
                        <div
                          key={sub.stage}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-[5px] text-xs transition-colors ${
                            isCurrentLevel
                              ? "bg-[#7A2253] text-white font-bold shadow-2xs"
                              : "bg-white/80 text-[#334155] font-medium"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/20"
                              style={{ background: getMedalGradient(sub.stage) }}
                            />
                            <span className="truncate">{sub.stage}</span>
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
                              <Check className="h-3 w-3 stroke-[2.5] text-white shrink-0" />
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

        {/* "How we count" collapsible */}
        <div className="pt-2 border-t border-[#f1f5f9] shrink-0">
          <button
            type="button"
            onClick={() => setHowWeCountOpen((prev) => !prev)}
            className="flex items-center justify-between w-full py-1 px-1 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-[#7A2253]" />
              <span>How we count</span>
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
                • We add up public followers &amp; subscribers from the Instagram, YouTube and
                Facebook accounts you connect.
              </p>
              <p>
                • Counts refresh automatically from public profile data — no logins or passwords
                needed.
              </p>
              <p>• Your era never goes down. We keep the highest one you&apos;ve reached.</p>
              <p>• Only connected, verified primary accounts count toward your total.</p>
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
            <span>What&apos;s your Creator Era? Find yours →</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
