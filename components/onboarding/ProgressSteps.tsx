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
              <div className="flex items-center gap-2">
                {/* Step Circle */}
                <div
                  className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${isDone
                    ? "bg-[#3a2447] text-white"
                    : isActive
                      ? "bg-[#3a2447] text-white ring-3 ring-[#3a2447]/15"
                      : "bg-white border border-[#e2e8f0] text-[#64748b]"
                    }`}
                >
                  {isDone ? (
                    <Check className="h-3 w-3 stroke-[3] text-white" />
                  ) : (
                    <Icon className={`h-3 w-3 ${isActive ? "text-white" : "text-[#64748b]"}`} />
                  )}
                </div>

                {/* Step Label */}
                <div className="flex flex-col">
                  <span
                    className={`text-[11px] font-bold leading-tight transition-colors ${isActive
                      ? "text-[#3a2447]"
                      : isDone
                        ? "text-[#3a2447]"
                        : "text-[#64748b]"
                      }`}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <span className="text-[9px] font-semibold text-[#64748b] leading-none mt-0.5">
                      {i + 1}/{ONBOARDING_STEPS.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Connecting Line */}
              {i < ONBOARDING_STEPS.length - 1 && (
                <div className="mx-2 sm:mx-2.5 h-[2px] flex-1 overflow-hidden rounded-full bg-[#e2e8f0]">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out bg-[#3a2447]"
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
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3a2447] text-[10px] font-bold text-white">
              {currentIndex + 1}
            </span>
            <span className="text-xs font-bold text-[#3a2447]">
              {ONBOARDING_STEPS[currentIndex]?.label || "Setup"}
            </span>
          </div>
          <span className="rounded-full bg-[#f1f5f9] border border-[#e2e8f0] px-2.5 py-0.5 text-[11px] font-bold text-[#3a2447]">
            {progressPercent}% Complete
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e2e8f0]">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out bg-[#3a2447]"
            style={{
              width: `${progressPercent}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
