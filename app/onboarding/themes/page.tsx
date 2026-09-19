"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { Button } from "@/components/ui/Button";
import { useCreator } from "@/contexts/CreatorContext";
import { THEME_LIST } from "@/services/ThemeService";
import { OnboardingService } from "@/services/OnboardingService";

export default function ThemeStepPage() {
  const router = useRouter();
  const { theme, setTheme } = useCreator();
  const [submitting, setSubmitting] = useState(false);
  const [activeGroup, setActiveGroup] = useState<"all" | "animated" | "light" | "dark">("all");

  function handleNext() {
    setSubmitting(true);
    OnboardingService.setStep("subscription");
    setTimeout(() => {
      setSubmitting(false);
      router.push("/onboarding/subscription");
    }, 120);
  }

  const filteredThemes = THEME_LIST.filter((t) => {
    if (activeGroup === "all") return true;
    if (activeGroup === "animated") return Boolean(t.isAnimated || t.group === "animated");
    return t.group === activeGroup;
  });

  return (
    <OnboardingLayout step="theme">
      <div className="w-full max-w-[460px] mx-auto pt-0 sm:pt-1 pb-4">
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 sm:p-5 space-y-3 text-left shadow-xs">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#043084]">
              DESIGN &amp; THEME
            </span>
            <h1 className="font-display text-xl sm:text-[24px] font-extrabold text-[#181716] tracking-tight leading-tight">
              Pick your page theme
            </h1>
            <p className="text-xs font-normal text-[#54514D] leading-relaxed">
              Choose a design theme for your creator page. You can change this anytime.
            </p>
          </div>

          {/* Filter Pills: All, Animated, Light, Dark */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveGroup("all")}
              className={`tap-scale shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${activeGroup === "all"
                ? "bg-[#043084]/[0.08] text-[#043084] border border-[#043084]/25"
                : "bg-white border border-[#e2e8f0] text-[#54514D] hover:bg-surface-soft"
                }`}
            >
              All
            </button>

            <button
              type="button"
              onClick={() => setActiveGroup("animated")}
              className={`tap-scale shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${activeGroup === "animated"
                ? "bg-[#043084]/[0.08] text-[#043084] border border-[#043084]/25"
                : "bg-white border border-[#e2e8f0] text-[#54514D] hover:bg-surface-soft"
                }`}
            >
              <Sparkles className="h-3 w-3" />
              <span>Animated</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveGroup("light")}
              className={`tap-scale shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${activeGroup === "light"
                ? "bg-[#043084]/[0.08] text-[#043084] border border-[#043084]/25"
                : "bg-white border border-[#e2e8f0] text-[#54514D] hover:bg-surface-soft"
                }`}
            >
              Light
            </button>

            <button
              type="button"
              onClick={() => setActiveGroup("dark")}
              className={`tap-scale shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${activeGroup === "dark"
                ? "bg-[#043084]/[0.08] text-[#043084] border border-[#043084]/25"
                : "bg-white border border-[#e2e8f0] text-[#54514D] hover:bg-surface-soft"
                }`}
            >
              Dark
            </button>
          </div>

          {/* Theme Cards Grid: Compact Horizontal Tiles */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {filteredThemes.map((t) => {
              const isSelected = theme === t.key;
              return (
                <ThemeTile
                  key={t.key}
                  theme={t}
                  isSelected={isSelected}
                  onSelect={() => setTheme(t.key)}
                />
              );
            })}
          </div>

          {/* Bottom Navigation (Back + Next) */}
          <div className="pt-0.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/onboarding/socials")}
              className="rounded-xl border border-[#cbd5e1] bg-white text-[#181716] font-semibold text-xs sm:text-sm h-10.5 sm:h-11 px-3.5 hover:bg-surface-soft transition-all cursor-pointer shrink-0"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#043084] hover:bg-brand-hover text-white font-semibold text-xs sm:text-sm h-10.5 sm:h-11 transition-all cursor-pointer shadow-xs disabled:opacity-60 active:scale-98"
            >
              <span>Save &amp; Next →</span>
            </button>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}

function ThemeTile({
  theme,
  isSelected,
  onSelect,
}: {
  theme: (typeof THEME_LIST)[number];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [bg, accent, text] = theme.swatch || ["#7c3aed", "#ede9fe", "#14121a"];
  const isDark = theme.mode === "dark" || theme.group === "dark";
  const isAnimated = Boolean(theme.isAnimated || theme.group === "animated");

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`tap-scale relative w-full h-24 sm:h-26 rounded-xl overflow-hidden p-2.5 sm:p-3 flex flex-col justify-between text-left transition-all cursor-pointer shadow-xs ${isSelected
        ? "ring-2 ring-offset-2 ring-[#043084]"
        : "border border-gray-200/80 hover:border-brand-border hover:shadow-sm"
        }`}
      style={{
        background:
          theme.key === "minimal-white"
            ? "linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%)"
            : `linear-gradient(135deg, ${bg} 0%, ${accent} 100%)`,
      }}
    >
      {/* Top Row: Color Dots & Status */}
      <div className="flex items-center justify-between w-full z-10">
        <div className="flex items-center gap-1 rounded-full bg-black/20 backdrop-blur-md px-2 py-0.5 border border-white/20 shadow-2xs">
          <span className="h-2.5 w-2.5 rounded-full border border-white/40" style={{ backgroundColor: bg }} />
          <span className="h-2.5 w-2.5 rounded-full border border-white/40" style={{ backgroundColor: accent }} />
          <span className="h-2.5 w-2.5 rounded-full border border-white/40" style={{ backgroundColor: text }} />
        </div>

        <div className="flex items-center gap-1.5">
          {isAnimated && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/40 text-amber-300 px-1.5 py-0.5 text-[9px] font-bold shadow-2xs border border-amber-300/30 backdrop-blur-xs">
              <Sparkles className="h-2.5 w-2.5 text-amber-300" />
              <span>Animated</span>
            </span>
          )}

          {isSelected && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#043084] text-white shadow-md border border-white">
              <Check className="h-3 w-3 stroke-[3]" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Theme Name */}
      <div className="z-10 self-start">
        <div
          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-2xs ${isDark
            ? "bg-black/50 text-white backdrop-blur-md border border-white/10"
            : "bg-white/90 text-gray-900 backdrop-blur-md border border-white/40"
            }`}
        >
          <span>{theme.name}</span>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none" />
    </button>
  );
}
