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

  function handleNext() {
    setSubmitting(true);
    OnboardingService.setStep("series");
    setTimeout(() => {
      setSubmitting(false);
      router.push("/onboarding/series");
    }, 120);
  }

  const cardProps = { profile, socials, series, totalAudience };

  return (
    <OnboardingLayout
      step="theme"
      preview={<ThemeCard themeKey={theme} {...cardProps} />}
    >
      <div className="flex items-center gap-2 text-xs font-bold text-inflixo-purple uppercase tracking-wider mb-1">
        <Sparkles className="h-3.5 w-3.5" />
        Step 3 • Page Theme &amp; Vibe
      </div>
      <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-inflixo-navy sm:text-4xl">
        Pick your <span className="text-gradient-premium">page vibe</span>
      </h1>
      <p className="mt-2 text-[15px] text-muted leading-relaxed">
        Choose a visual design theme for your public Inflixo link-in-bio page. You can change this anytime.
      </p>

      {/* Mobile: Horizontal snap carousel */}
      <div className="no-scrollbar mt-6 -mx-5 flex gap-4 overflow-x-auto px-5 pb-3 lg:hidden snap-x">
        {THEME_LIST.map((t) => {
          const isSelected = theme === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTheme(t.key)}
              className={`tap-scale relative w-[82%] shrink-0 snap-center rounded-3xl p-3 text-left transition-all ${
                isSelected
                  ? "bg-inflixo-purple-light/50 ring-2 ring-inflixo-purple shadow-md"
                  : "bg-white border border-inflixo-border"
              }`}
            >
              <ThemeSwatchBanner swatch={t.swatch} />
              {isSelected && (
                <div
                  className="absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md z-10"
                  style={{ backgroundImage: "var(--gradient-premium)" }}
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                </div>
              )}
              <div className="mt-3 px-1">
                <span className="inline-block rounded-full bg-inflixo-purple/10 px-2 py-0.5 text-[10px] font-bold text-inflixo-purple mb-1">
                  {THEME_TAGS[t.key] || "Design Theme"}
                </span>
                <p className="text-sm font-extrabold text-inflixo-navy">{t.name}</p>
                <p className="text-xs text-muted mt-0.5 line-clamp-1">{t.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Desktop: 2-column Grid */}
      <div className="mt-6 hidden grid-cols-1 gap-4 sm:grid-cols-2 lg:grid">
        {THEME_LIST.map((t) => {
          const isSelected = theme === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTheme(t.key)}
              className={`tap-scale relative rounded-3xl p-3 text-left transition-all hover:-translate-y-0.5 ${
                isSelected
                  ? "bg-inflixo-purple-light/40 ring-2 ring-inflixo-purple shadow-md"
                  : "bg-white border border-inflixo-border hover:border-inflixo-purple/40"
              }`}
            >
              <ThemeSwatchBanner swatch={t.swatch} />
              {isSelected && (
                <div
                  className="absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md z-10"
                  style={{ backgroundImage: "var(--gradient-premium)" }}
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                </div>
              )}
              <div className="mt-3 px-1 pb-1">
                <span className="inline-block rounded-full bg-inflixo-purple-light px-2.5 py-0.5 text-[11px] font-bold text-inflixo-purple mb-1">
                  {THEME_TAGS[t.key] || "Design Theme"}
                </span>
                <p className="text-sm font-extrabold text-inflixo-navy">{t.name}</p>
                <p className="text-xs text-muted mt-0.5 line-clamp-2">{t.description}</p>
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
      className="relative h-16 w-full overflow-hidden rounded-2xl p-2.5 flex items-end justify-between border border-black/5 shadow-2xs"
      style={{
        background: `linear-gradient(135deg, ${bg} 0%, ${accent} 100%)`,
      }}
    >
      <div className="flex items-center gap-1 rounded-full bg-black/20 backdrop-blur-md px-2 py-1 border border-white/20">
        <span className="h-3 w-3 rounded-full border border-white/40 shadow-2xs" style={{ backgroundColor: bg }} />
        <span className="h-3 w-3 rounded-full border border-white/40 shadow-2xs" style={{ backgroundColor: accent }} />
        <span className="h-3 w-3 rounded-full border border-white/40 shadow-2xs" style={{ backgroundColor: text }} />
      </div>
    </div>
  );
}

