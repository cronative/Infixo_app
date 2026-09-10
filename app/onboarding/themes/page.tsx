"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Palette } from "lucide-react";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { Button } from "@/components/ui/Button";
import { useCreator } from "@/contexts/CreatorContext";
import { THEME_LIST } from "@/services/ThemeService";
import { OnboardingService } from "@/services/OnboardingService";
import { ThemeKey } from "@/types";

const THEME_TAGS: Record<string, string> = {
  "minimal-white": "🍃 Clean • Minimalist White",
  "signature-purple": "✨ Popular • Signature Purple",
  midnight: "🌙 Bold • Midnight Dark",
};

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
      <h1 className="text-xl sm:text-2xl font-bold leading-snug tracking-tight text-[#181716]">
        Pick your page theme
      </h1>
      <p className="mt-1 text-xs text-[#54514D] leading-relaxed">
        Choose a design theme for your creator page. You can change this anytime.
      </p>

      {/* Filter Pills: All, Animated, Light, Dark */}
      <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveGroup("all")}
          className={`tap-scale shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${activeGroup === "all"
            ? "bg-[#151933]/[0.08] text-[#151933] border border-[#151933]/25"
            : "bg-white border border-[#E7E3DC] text-[#54514D] hover:bg-[#fbfbfb]"
            }`}
        >
          All
        </button>

        <button
          type="button"
          onClick={() => setActiveGroup("animated")}
          className={`tap-scale shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${activeGroup === "animated"
            ? "bg-[#151933]/[0.08] text-[#151933] border border-[#151933]/25"
            : "bg-white border border-[#E7E3DC] text-[#54514D] hover:bg-[#fbfbfb]"
            }`}
        >
          <Sparkles className="h-3 w-3" />
          <span>Animated</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveGroup("light")}
          className={`tap-scale shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${activeGroup === "light"
            ? "bg-[#151933]/[0.08] text-[#151933] border border-[#151933]/25"
            : "bg-white border border-[#E7E3DC] text-[#54514D] hover:bg-[#fbfbfb]"
            }`}
        >
          Light
        </button>

        <button
          type="button"
          onClick={() => setActiveGroup("dark")}
          className={`tap-scale shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${activeGroup === "dark"
            ? "bg-[#151933]/[0.08] text-[#151933] border border-[#151933]/25"
            : "bg-white border border-[#E7E3DC] text-[#54514D] hover:bg-[#fbfbfb]"
            }`}
        >
          Dark
        </button>
      </div>

      {/* Theme Cards Grid: Compact Horizontal Tiles */}
      <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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

      {/* Step 3 Form Bottom Navigation (Natural flow, Back + Next) */}
      <div className="pt-3.5 border-t border-[#E7E3DC] mt-5 sm:mt-6 flex flex-col-reverse sm:flex-row items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full sm:w-auto h-10 rounded-xl border-[#E7E3DC] text-[#181716] hover:bg-[#fbfbfb] font-semibold text-xs sm:text-sm px-5"
          onClick={() => router.push("/onboarding/socials")}
        >
          Back
        </Button>
        <Button
          type="button"
          fullWidth
          size="lg"
          loading={submitting}
          onClick={handleNext}
          className="w-full sm:flex-1 h-10 bg-[#151933] hover:bg-[#2c1937] text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-xs"
        >
          Save &amp; Next →
        </Button>
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
  const isDark = theme.group === "dark" || theme.key === "midnight" || theme.key === "cosmic-purple" || theme.key === "aurora-night" || theme.key === "rose-glow" || theme.key === "ocean-motion" || theme.key === "sunset-studio";
  const isAnimated = Boolean(theme.isAnimated || theme.group === "animated");

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`tap-scale relative w-full h-24 sm:h-26 rounded-xl overflow-hidden p-2.5 sm:p-3 flex flex-col justify-between text-left transition-all cursor-pointer shadow-xs ${isSelected
        ? "ring-2 ring-offset-2 ring-[#151933]"
        : "border border-gray-200/80 hover:border-gray-400 hover:shadow-sm"
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
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#151933] text-white shadow-md border border-white">
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

