"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Palette } from "lucide-react";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { Button } from "@/components/ui/Button";
import { useCreator } from "@/contexts/CreatorContext";
import { THEME_LIST } from "@/services/ThemeService";
import { ThemeCard } from "@/themes/registry";
import { OnboardingService } from "@/services/OnboardingService";
import { ThemeKey } from "@/types";

const THEME_TAGS: Record<string, string> = {
  "minimal-white": "🍃 Clean • Minimalist",
  "modern-purple": "✨ Popular • Signature Purple",
  midnight: "🌙 Bold • Midnight Dark",
  "ocean-blue": "🌊 Calm • Ocean Blue",
  sunset: "🌅 Warm • Sunset Gradient",
  forest: "🌲 Earthy • Natural Sage",
  "rose-gold": "👑 Editorial • Rose Gold",
  mono: "🖤 High Contrast • Black & White",
  "neon-pulse": "⚡ Electric • Neon Cyber",
  "pastel-dream": "🎨 Soft • Pastel Gradient",
  cyberpunk: "🤖 Tech • Dark Cyberpunk",
  "emerald-luxe": "💎 Luxury • Royal Emerald",
  "crimson-velvet": "🔥 Rich • Crimson Red",
  "solar-flare": "☀️ Vibrant • Solar Amber",
  "lavender-haze": "🔮 Dreamy • Lavender Haze",
  "nordic-frost": "❄️ Crisp • Nordic Blue",
  "golden-hour": "🌇 Warm • Golden Hour",
  "cosmic-galaxy": "🌌 Deep • Cosmic Nebula",
  "tokyo-drift": "🚗 Dark • Neon Tokyo",
  "retro-synth": "📻 80s • Retro Synthwave",
};

export default function ThemeStepPage() {
  const router = useRouter();
  const { profile, socials, series, totalAudience, theme, setTheme } = useCreator();
  const [submitting, setSubmitting] = useState(false);
  const [activeGroup, setActiveGroup] = useState<"all" | "shimmer" | "light" | "dark">("all");

  function handleNext() {
    setSubmitting(true);
    OnboardingService.setStep("series");
    setTimeout(() => {
      setSubmitting(false);
      router.push("/onboarding/series");
    }, 120);
  }

  const cardProps = { profile, socials, series, totalAudience };

  const filteredThemes = THEME_LIST.filter((t) => {
    if (activeGroup === "all") return true;
    return t.group === activeGroup;
  });

  return (
    <OnboardingLayout
      step="theme"
      preview={<ThemeCard themeKey={theme} {...cardProps} />}
    >
      <div className="flex items-center gap-2 text-xs font-bold text-[#651FFF] uppercase tracking-wider mb-1">
        <Sparkles className="h-3.5 w-3.5" />
        Step 3 • Theme
      </div>
      <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-4xl">
        Pick your page theme
      </h1>
      <p className="mt-2 text-[15px] text-slate-500 leading-relaxed">
        Choose a design theme for your creator page. You can change this anytime.
      </p>

      {/* Category Group Filter Tabs */}
      <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveGroup("all")}
          className={`tap-scale shrink-0 rounded-full px-3.5 py-1.5 text-xs font-black transition-all cursor-pointer ${
            activeGroup === "all"
              ? "bg-[#651FFF] text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          All
        </button>

        <button
          type="button"
          onClick={() => setActiveGroup("light")}
          className={`tap-scale shrink-0 rounded-full px-3.5 py-1.5 text-xs font-black transition-all cursor-pointer ${
            activeGroup === "light"
              ? "bg-[#651FFF] text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          🍃 Light
        </button>

        <button
          type="button"
          onClick={() => setActiveGroup("shimmer")}
          className={`tap-scale shrink-0 rounded-full px-3.5 py-1.5 text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
            activeGroup === "shimmer"
              ? "bg-[#651FFF] text-white shadow-xs"
              : "bg-purple-50 text-[#651FFF] border border-purple-200 hover:bg-purple-100"
          }`}
        >
          <Sparkles className="h-3 w-3" />
          ✨ Shimmer
        </button>

        <button
          type="button"
          onClick={() => setActiveGroup("dark")}
          className={`tap-scale shrink-0 rounded-full px-3.5 py-1.5 text-xs font-black transition-all cursor-pointer ${
            activeGroup === "dark"
              ? "bg-[#651FFF] text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          🌙 Dark
        </button>
      </div>

      {/* Mobile: Horizontal snap carousel */}
      <div className="no-scrollbar mt-4 -mx-5 flex gap-4 overflow-x-auto px-5 pb-3 lg:hidden snap-x">
        {filteredThemes.map((t) => {
          const isSelected = theme === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTheme(t.key)}
              className={`tap-scale relative w-[82%] shrink-0 snap-center overflow-hidden rounded-3xl text-left transition-all ${
                isSelected
                  ? "bg-purple-50/70 ring-2 ring-[#651FFF] shadow-md border border-purple-200"
                  : "bg-white border border-slate-200/80"
              }`}
            >
              <ThemeSwatchBanner swatch={t.swatch} />
              {isSelected && (
                <div
                  className="absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md z-10 bg-[#651FFF] border-2 border-white"
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                </div>
              )}
              <div className="p-4 pt-3">
                <p className="text-sm font-black text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{t.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Desktop: 2-column Grid */}
      <div className="mt-4 hidden grid-cols-1 gap-4 sm:grid-cols-2 lg:grid">
        {filteredThemes.map((t) => {
          const isSelected = theme === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTheme(t.key)}
              className={`tap-scale relative overflow-hidden rounded-[24px] text-left transition-all hover:-translate-y-0.5 ${
                isSelected
                  ? "bg-purple-50/70 ring-2 ring-[#651FFF] shadow-xs border border-purple-200"
                  : "bg-white border border-slate-200/80 hover:border-purple-300 hover:shadow-xs"
              }`}
            >
              <ThemeSwatchBanner swatch={t.swatch} />
              {isSelected && (
                <div
                  className="absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md z-10 bg-[#651FFF] border-2 border-white"
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                </div>
              )}
              <div className="p-4 pt-3">
                <p className="text-sm font-black text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{t.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Step 3 Sticky Form Bottom Navigation (Back + Next) */}
      <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md py-4 border-t border-slate-200/80 mt-8 flex items-center gap-3">
        <Button variant="outline" size="lg" onClick={() => router.push("/onboarding/socials")}>
          Back
        </Button>
        <Button fullWidth size="lg" loading={submitting} onClick={handleNext}>
          Save &amp; Next →
        </Button>
      </div>
    </OnboardingLayout>
  );
}

function ThemeSwatchBanner({ swatch }: { swatch: string[] }) {
  const [bg, accent, text] = swatch || ["#7c3aed", "#ede9fe", "#14121a"];
  return (
    <div
      className="relative h-20 w-full p-3 flex items-end justify-between border-b border-black/5"
      style={{
        background: `linear-gradient(135deg, ${bg} 0%, ${accent} 100%)`,
      }}
    >
      <div className="flex items-center gap-1.5 rounded-full bg-black/20 backdrop-blur-md px-2.5 py-1 border border-white/20">
        <span className="h-3.5 w-3.5 rounded-full border border-white/40 shadow-2xs" style={{ backgroundColor: bg }} />
        <span className="h-3.5 w-3.5 rounded-full border border-white/40 shadow-2xs" style={{ backgroundColor: accent }} />
        <span className="h-3.5 w-3.5 rounded-full border border-white/40 shadow-2xs" style={{ backgroundColor: text }} />
      </div>
    </div>
  );
}

