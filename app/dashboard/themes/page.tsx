"use client";

import { useState } from "react";
import { Check, Sparkles, Palette, Eye } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { THEME_LIST } from "@/services/ThemeService";
import { ThemeCard } from "@/themes/registry";

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

export default function DashboardThemesPage() {
  const { profile, socials, series, totalAudience, theme, setTheme } = useCreator();
  const { showToast } = useToast();
  const cardProps = { profile, socials, series, totalAudience };

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 sm:py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-inflixo-purple uppercase tracking-wider mb-1">
          <Sparkles className="h-3.5 w-3.5" />
          Appearance &amp; Styling
        </div>
        <h1 className="font-display text-2xl font-black text-inflixo-navy sm:text-3xl">
          Pick your <span className="text-gradient-premium">page vibe</span>
        </h1>
        <p className="mt-1 text-sm text-muted">
          Select from 20 aesthetic design themes for your public Inflixo profile link.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Left Sticky Preview Card */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-inflixo-purple" />
              Live Theme Preview
            </p>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-bold text-inflixo-purple">
              Active: {THEME_LIST.find((t) => t.key === theme)?.name}
            </span>
          </div>

          <div className="overflow-hidden rounded-3xl border border-inflixo-border bg-slate-900/5 p-2 shadow-lg">
            <ThemeCard themeKey={theme} {...cardProps} />
          </div>
        </div>

        {/* Right 2-Column Theme Cards Selection Grid */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {THEME_LIST.map((t) => {
              const isSelected = theme === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setTheme(t.key);
                    showToast(`${t.name} Theme applied! ✨`);
                  }}
                  className={`tap-scale relative rounded-3xl p-3.5 text-left transition-all hover:-translate-y-0.5 ${
                    isSelected
                      ? "bg-inflixo-purple-light/50 ring-2 ring-inflixo-purple shadow-md border border-purple-200"
                      : "bg-white border border-slate-200 hover:border-inflixo-purple/40 hover:shadow-sm"
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

                  <div className="mt-3.5 px-1 pb-1">
                    <span className="inline-block rounded-full bg-inflixo-purple-light px-2.5 py-0.5 text-[11px] font-bold text-inflixo-purple mb-1">
                      {THEME_TAGS[t.key] || "Design Theme"}
                    </span>
                    <p className="text-sm font-extrabold text-inflixo-navy">{t.name}</p>
                    <p className="text-xs text-muted mt-0.5 line-clamp-2 leading-relaxed">{t.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
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
