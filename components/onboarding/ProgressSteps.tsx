"use client";

import { Check, User, Share2, Palette, Tv, CreditCard, CheckCircle2 } from "lucide-react";
import { ONBOARDING_STEPS, OnboardingStep } from "@/types";

const STEP_ICONS = [User, Share2, Palette, Tv, CreditCard, CheckCircle2];

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
              <div className="flex items-center gap-2.5">
                {/* Step Circle */}
                <div
                  className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    isDone
                      ? "bg-[#803D63] text-white shadow-xs"
                      : isActive
                      ? "bg-[#803D63] text-white ring-4 ring-[#803D63]/10 shadow-xs"
                      : "bg-[#F8F7F3] border border-[#E7E3DC] text-[#797570]"
                  }`}
                >
                  {isDone ? (
                    <Check className="h-3.5 w-3.5 stroke-[3] text-white" />
                  ) : (
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-[#797570]"}`} />
                  )}
                </div>

                {/* Step Label */}
                <div className="flex flex-col">
                  <span
                    className={`text-xs font-bold leading-none transition-colors ${
                      isActive
                        ? "text-[#181716]"
                        : isDone
                        ? "text-[#181716]"
                        : "text-[#797570]"
                    }`}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-semibold text-[#803D63] mt-0.5">
                      Step {i + 1} of {ONBOARDING_STEPS.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Connecting Line */}
              {i < ONBOARDING_STEPS.length - 1 && (
                <div className="mx-3 h-1 flex-1 overflow-hidden rounded-full bg-[#E7E3DC]">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out bg-[#803D63]"
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
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#803D63] text-[10px] font-bold text-white">
              {currentIndex + 1}
            </span>
            <span className="text-xs font-bold text-[#181716]">
              {ONBOARDING_STEPS[currentIndex]?.label || "Setup"}
            </span>
          </div>
          <span className="rounded-full bg-[#803D63]/[0.09] border border-[#803D63]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#803D63]">
            {progressPercent}% Complete
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E7E3DC]">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out bg-[#803D63]"
            style={{
              width: `${progressPercent}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
