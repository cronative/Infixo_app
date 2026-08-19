"use client";

import { useState, useEffect } from "react";
import { Check, Sparkles, Eye } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { THEME_LIST, ThemeService } from "@/services/ThemeService";
import { ThemeCard } from "@/themes/registry";
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

export default function DashboardThemesPage() {
  const { profile, socials, series, totalAudience, theme, setTheme } = useCreator();
  const { showToast } = useToast();
  const cardProps = { profile, socials, series, totalAudience };

  const [activeGroup, setActiveGroup] = useState<"all" | "light" | "shimmer" | "dark">("all");

  function handleThemeSelect(tKey: ThemeKey, tName: string) {
    if (tKey === theme) return;

    setTheme(tKey);
    ThemeService.setSelectedTheme(tKey, true);
    showToast(`${tName} theme applied! ✨`);
  }

  const filteredThemes = THEME_LIST.filter((t) => {
    if (activeGroup === "all") return true;
    return t.group === activeGroup;
  });

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-8 py-4 sm:py-8 text-left">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Left Column: Title + Filter Tabs + Theme Cards */}
        <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-900 sm:text-3xl">
              Themes
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Choose a visual design theme for your public profile. Changes update instantly.
            </p>
          </div>

          {/* Category Group Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveGroup("all")}
              className={`tap-scale shrink-0 rounded-full px-4 py-2 text-xs font-black transition-all cursor-pointer ${
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
              className={`tap-scale shrink-0 rounded-full px-4 py-2 text-xs font-black transition-all cursor-pointer ${
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
              className={`tap-scale shrink-0 rounded-full px-4 py-2 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeGroup === "shimmer"
                  ? "bg-[#651FFF] text-white shadow-xs"
                  : "bg-purple-50 text-[#651FFF] border border-purple-200 hover:bg-purple-100"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              ✨ Shimmer
            </button>

            <button
              type="button"
              onClick={() => setActiveGroup("dark")}
              className={`tap-scale shrink-0 rounded-full px-4 py-2 text-xs font-black transition-all cursor-pointer ${
                activeGroup === "dark"
                  ? "bg-[#651FFF] text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              🌙 Dark
            </button>
          </div>

          {/* Theme Selection Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filteredThemes.map((t) => {
              const isSelected = theme === t.key;

              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleThemeSelect(t.key, t.name)}
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
        </div>

        {/* Right Sticky Live Preview Card (Starts at Top level with Title!) */}
        <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-3 order-1 lg:order-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-[#651FFF]" />
              Live Theme Preview
            </p>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-extrabold text-[#651FFF]">
              Selected: {THEME_LIST.find((t) => t.key === theme)?.name}
            </span>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-900/5 p-2 shadow-lg">
            <ThemeCard themeKey={theme} {...cardProps} />
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
