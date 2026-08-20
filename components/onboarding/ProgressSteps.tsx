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
          const isActive = i === currentIndex;
          const Icon = STEP_ICONS[i] || User;

          return (
            <div key={step.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-2.5">
                <div
                  className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition-all duration-300 ${
                    isDone
                      ? "bg-inflixo-purple text-white shadow-sm"
                      : isActive
                      ? "scale-110 text-white shadow-[0_0_16px_rgba(99,102,241,0.45)] ring-4 ring-inflixo-purple-light"
                      : "border border-inflixo-border bg-surface-muted text-muted"
                  }`}
                  style={isDone || isActive ? { backgroundImage: "var(--gradient-premium)" } : undefined}
                >
                  {isDone ? (
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  ) : (
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-muted"}`} />
                  )}
                </div>
                <div className="flex flex-col">
                  <span
                    className={`text-xs font-bold leading-none transition-colors ${
                      isActive
                        ? "text-inflixo-purple-dark font-extrabold"
                        : isDone
                        ? "text-inflixo-navy"
                        : "text-muted/80"
                    }`}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-semibold text-inflixo-purple mt-0.5">
                      Step {i + 1} of {ONBOARDING_STEPS.length}
                    </span>
                  )}
                </div>
              </div>
              {i < ONBOARDING_STEPS.length - 1 && (
                <div className="mx-3 h-1 flex-1 overflow-hidden rounded-full bg-inflixo-border/80">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: isDone ? "100%" : isActive ? "50%" : "0%",
                      backgroundImage: "var(--gradient-premium)",
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
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-inflixo-purple text-[10px] font-extrabold text-white">
              {currentIndex + 1}
            </span>
            <span className="text-xs font-bold text-inflixo-navy">
              {ONBOARDING_STEPS[currentIndex].label}
            </span>
          </div>
          <span className="rounded-full bg-inflixo-purple-light px-2 py-0.5 text-[11px] font-extrabold text-inflixo-purple">
            {progressPercent}% Complete
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted border border-inflixo-border/50">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${progressPercent}%`,
              backgroundImage: "var(--gradient-energy)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

