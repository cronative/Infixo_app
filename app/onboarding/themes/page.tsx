"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Palette, Eye } from "lucide-react";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { Button } from "@/components/ui/Button";
import { useCreator } from "@/contexts/CreatorContext";
import { THEME_LIST } from "@/services/ThemeService";
import { ThemeCard } from "@/themes/registry";
import { OnboardingService } from "@/services/OnboardingService";
import { ThemeKey } from "@/types";

const THEME_TAGS: Record<string, string> = {
  "minimal-white": "🍃 Clean • Minimalist White",
  "signature-purple": "✨ Popular • Signature Purple",
  midnight: "🌙 Bold • Midnight Dark",
};

export default function ThemeStepPage() {
  const router = useRouter();
  const { profile, socials, series, totalAudience, theme, setTheme } = useCreator();
  const [submitting, setSubmitting] = useState(false);
  const [activeGroup, setActiveGroup] = useState<"all" | "animated" | "light" | "dark">("all");
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);

  function handleNext() {
    setSubmitting(true);
    OnboardingService.setStep("series");
    setTimeout(() => {
      setSubmitting(false);
      router.push("/onboarding/series");
    }, 120);
  }

  const cardProps = { profile, socials, series, totalAudience, isOnboarding: true, isInformational: true };

  const filteredThemes = THEME_LIST.filter((t) => {
    if (activeGroup === "all") return true;
    if (activeGroup === "animated") return Boolean(t.isAnimated || t.group === "animated");
    return t.group === activeGroup;
  });

  return (
    <OnboardingLayout
      step="theme"
      isMobilePreviewOpen={isMobilePreviewOpen}
      setIsMobilePreviewOpen={setIsMobilePreviewOpen}
      preview={<ThemeCard themeKey={theme} {...cardProps} />}
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#803D63]/20 bg-[#803D63]/10 px-3 py-1 text-xs font-bold text-[#803D63]">
          <Sparkles className="h-3.5 w-3.5 text-[#803D63] shrink-0" />
          <span>Step 3 of 6 • Theme Selection</span>
        </div>

        {/* Mobile / Tablet Dedicated Preview Trigger */}
        <button
          type="button"
          onClick={() => setIsMobilePreviewOpen(true)}
          className="lg:hidden tap-scale inline-flex items-center gap-1.5 rounded-full border border-[#803D63]/30 bg-[#803D63]/10 hover:bg-[#803D63]/15 px-3 py-1 text-xs font-bold text-[#803D63] transition-all cursor-pointer shadow-2xs"
          title="Preview public profile"
        >
          <Eye className="h-3.5 w-3.5 text-[#803D63]" />
          <span>Preview Profile</span>
        </button>
      </div>

      <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-4xl">
        Pick your page theme
      </h1>
      <p className="mt-2 text-[15px] text-slate-500 leading-relaxed font-medium">
        Choose a design theme for your creator page. You can change this anytime.
      </p>

      {/* Filter Pills: All, Animated, Light, Dark */}
      <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveGroup("all")}
          className={`tap-scale shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
            activeGroup === "all"
              ? "bg-[#803D63] text-white shadow-none"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          All
        </button>

        <button
          type="button"
          onClick={() => setActiveGroup("animated")}
          className={`tap-scale shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeGroup === "animated"
              ? "bg-[#803D63] text-white shadow-none"
              : "bg-white border border-gray-200 text-[#803D63] hover:bg-gray-50"
          }`}
        >
          <Sparkles className="h-3 w-3" />
          <span>Animated</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveGroup("light")}
          className={`tap-scale shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
            activeGroup === "light"
              ? "bg-[#803D63] text-white shadow-none"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Light
        </button>

        <button
          type="button"
          onClick={() => setActiveGroup("dark")}
          className={`tap-scale shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
            activeGroup === "dark"
              ? "bg-[#803D63] text-white shadow-none"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Dark
        </button>
      </div>

      {/* Theme Cards Grid: Compact Horizontal Tiles */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      <div className="pt-4 border-t border-[#E5E7EB] mt-8 flex flex-col-reverse sm:flex-row items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full sm:w-auto h-12 rounded-xl border-[#E5E7EB] text-slate-700 hover:bg-slate-50 font-bold text-sm px-6"
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
          className="w-full sm:flex-1 h-12 bg-[#803D63] hover:bg-[#6D3254] text-white font-bold text-sm rounded-xl cursor-pointer shadow-none"
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
      className={`tap-scale relative w-full h-32 rounded-2xl overflow-hidden p-3.5 flex flex-col justify-between text-left transition-all cursor-pointer shadow-xs ${
        isSelected
          ? "ring-2 ring-offset-2 ring-[#803D63]"
          : "border border-gray-200/80 hover:border-gray-400 hover:shadow-md"
      }`}
      style={{
        background:
          theme.key === "minimal-white"
            ? "linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%)"
            : `linear-gradient(135deg, ${bg} 0%, ${accent} 100%)`,
      }}
    >
      {/* Top Row: Glassmorphic Palette Dots & Checkmark Badge */}
      <div className="flex items-center justify-between w-full z-10">
        {/* Glassmorphic Color Dots Pill */}
        <div className="flex items-center gap-1.5 rounded-full bg-black/20 backdrop-blur-md px-2.5 py-1 border border-white/20 shadow-2xs">
          <span className="h-3 w-3 rounded-full border border-white/40 shadow-2xs" style={{ backgroundColor: bg }} />
          <span className="h-3 w-3 rounded-full border border-white/40 shadow-2xs" style={{ backgroundColor: accent }} />
          <span className="h-3 w-3 rounded-full border border-white/40 shadow-2xs" style={{ backgroundColor: text }} />
        </div>

        {/* Right Status Badges */}
        <div className="flex items-center gap-1.5">
          {isAnimated && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/40 text-amber-300 px-2 py-0.5 text-[9px] font-bold shadow-2xs border border-amber-300/30 backdrop-blur-xs">
              <Sparkles className="h-2.5 w-2.5 text-amber-300" />
              <span>Animated</span>
            </span>
          )}

          {/* Selected Checkmark Badge */}
          {isSelected && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#803D63] text-white shadow-md border-2 border-white">
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Dynamic Theme Name Tag */}
      <div className="z-10 self-start">
        <div
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold shadow-2xs ${
            isDark
              ? "bg-black/50 text-white backdrop-blur-md border border-white/10"
              : "bg-white/85 text-gray-900 backdrop-blur-md border border-white/40"
          }`}
        >
          <span>{theme.name}</span>
        </div>
      </div>

      {/* Subtle Bottom Vignette Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none" />
    </button>
  );
}

