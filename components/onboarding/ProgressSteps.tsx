"use client";

import { Check, AtSign, User, Share2, Sparkles } from "lucide-react";
import { ONBOARDING_STEPS, OnboardingStep } from "@/types";

const STEP_ICONS = [AtSign, User, Share2, Sparkles];

export function ProgressSteps({ current }: { current: OnboardingStep }) {
  const currentIndex = ONBOARDING_STEPS.findIndex((s) => s.key === current);
  const progressPercent = Math.round(((currentIndex + 1) / ONBOARDING_STEPS.length) * 100);

  return (
    <div className="w-full">
      {/* Desktop: full step row with icons & smooth progress bar */}
      <div className="hidden items-center sm:flex">
        {ONBOARDING_STEPS.map((step, i) => {
          const isDone = i < currentIndex || (current === "finish" && i === currentIndex);
          const isActive = i === currentIndex && current !== "finish";
          const Icon = STEP_ICONS[i] || User;

          return (
            <div key={step.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-1.5">
                {/* Step Circle */}
                <div
                  className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 ${isDone
                    ? "bg-[#043084] text-white"
                    : isActive
                      ? "bg-[#043084] text-white ring-2 ring-[#043084]/20"
                      : "bg-white border border-[#e2e8f0] text-[#64748b]"
                    }`}
                >
                  {isDone ? (
                    <Check className="h-3 w-3 stroke-[3] text-white" />
                  ) : (
                    <Icon className={`h-2.5 w-2.5 ${isActive ? "text-white" : "text-[#64748b]"}`} />
                  )}
                </div>

                {/* Step Label */}
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-[11.5px] font-bold leading-tight transition-colors ${isActive
                      ? "text-[#043084]"
                      : isDone
                        ? "text-[#043084]"
                        : "text-[#64748b]"
                      }`}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <span className="text-[9.5px] font-semibold text-[#043084]/70 leading-none">
                      ({i + 1}/{ONBOARDING_STEPS.length})
                    </span>
                  )}
                </div>
              </div>

              {/* Connecting Line */}
              {i < ONBOARDING_STEPS.length - 1 && (
                <div className="mx-2 sm:mx-3 h-[2px] flex-1 overflow-hidden rounded-full bg-[#e2e8f0]">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out bg-[#043084]"
                    style={{
                      width: isDone ? "100%" : isActive ? "50%" : "0%",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: compact progress bar with badge */}
      <div className="sm:hidden">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#043084] text-[10px] font-bold text-white">
              {currentIndex + 1}
            </span>
            <span className="text-xs font-bold text-[#043084]">
              {ONBOARDING_STEPS[currentIndex]?.label || "Setup"}
            </span>
          </div>
          <span className="rounded-full bg-[#f1f5f9] border border-[#e2e8f0] px-2.5 py-0.5 text-[11px] font-bold text-[#043084]">
            {progressPercent}% Complete
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e2e8f0]">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out bg-[#043084]"
            style={{
              width: `${progressPercent}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
