"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Eye, Lock, ShieldCheck, AlertCircle, Crown, ArrowRight, X } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { THEME_LIST, ThemeService } from "@/services/ThemeService";
import { ThemeCard } from "@/themes/registry";
import { Button } from "@/components/ui/Button";
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
  const router = useRouter();
  const { profile, socials, series, totalAudience, theme, setTheme } = useCreator();
  const { showToast } = useToast();
  const cardProps = { profile, socials, series, totalAudience };

  const [limitStatus, setLimitStatus] = useState({
    allowed: true,
    isPro: false,
    remaining: 3,
    count: 0,
  });

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [targetThemeName, setTargetThemeName] = useState("");

  useEffect(() => {
    setLimitStatus(ThemeService.checkThemeChangeLimit());
  }, [theme]);

  function handleThemeSelect(tKey: ThemeKey, tName: string) {
    if (tKey === theme) return; // already selected

    const check = ThemeService.checkThemeChangeLimit();
    if (!check.isPro && check.count >= 3) {
      setTargetThemeName(tName);
      setShowUpgradeModal(true);
      return;
    }

    // Apply Theme
    setTheme(tKey);
    ThemeService.setSelectedTheme(tKey, true);
    if (!check.isPro) {
      const newCount = ThemeService.incrementThemeChangesCount();
      const newRemaining = Math.max(0, 3 - newCount);
      setLimitStatus({ ...check, count: newCount, remaining: newRemaining });
      if (newRemaining > 0) {
        showToast(`${tName} Theme applied! ✨ (${newRemaining} free ${newRemaining === 1 ? "change" : "changes"} left)`);
      } else {
        showToast(`${tName} Theme applied! ✨ (Used all 3 free theme changes)`, "info");
      }
    } else {
      showToast(`${tName} Theme applied! ✨ (Pro Unlimited)`);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-8 py-4 sm:py-8 space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

        {/* Theme Changes Status Pill / Badge */}
        <div className="shrink-0">
          {limitStatus.isPro ? (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-800 shadow-2xs">
              <Crown className="h-4 w-4 text-emerald-600" />
              <span>Pro Plan • Unlimited Theme Customizations</span>
            </div>
          ) : limitStatus.remaining > 0 ? (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-extrabold text-purple-900 shadow-2xs">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span>Early Access • {limitStatus.remaining}/3 Theme Changes Left</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-extrabold text-amber-900 shadow-2xs">
              <Lock className="h-4 w-4 text-amber-600" />
              <span>3/3 Early Access Changes Used • Limit Reached</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Left Sticky Live Preview Card */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-inflixo-purple" />
              Live Theme Preview
            </p>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-extrabold text-inflixo-purple">
              Active: {THEME_LIST.find((t) => t.key === theme)?.name}
            </span>
          </div>

          <div className="overflow-hidden rounded-3xl border border-inflixo-border bg-slate-900/5 p-2 shadow-lg">
            <ThemeCard themeKey={theme} {...cardProps} />
          </div>
        </div>

        {/* Right 2-Column Theme Selection Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {THEME_LIST.map((t) => {
              const isSelected = theme === t.key;
              const isBlocked = !limitStatus.isPro && limitStatus.count >= 3 && !isSelected;

              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleThemeSelect(t.key, t.name)}
                  className={`tap-scale relative rounded-3xl p-3.5 text-left transition-all hover:-translate-y-0.5 ${
                    isSelected
                      ? "bg-inflixo-purple-light/50 ring-2 ring-inflixo-purple shadow-md border border-purple-200"
                      : isBlocked
                      ? "bg-slate-50/80 border border-slate-200 opacity-80 hover:border-amber-400"
                      : "bg-white border border-slate-200 hover:border-inflixo-purple/40 hover:shadow-sm"
                  }`}
                >
                  <ThemeSwatchBanner swatch={t.swatch} />

                  {isSelected ? (
                    <div
                      className="absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md z-10"
                      style={{ backgroundImage: "var(--gradient-premium)" }}
                    >
                      <Check className="h-4 w-4 stroke-[3]" />
                    </div>
                  ) : isBlocked ? (
                    <div className="absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/80 text-amber-400 shadow-md backdrop-blur-md z-10">
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                  ) : null}

                  <div className="mt-3.5 px-1 pb-1">
                    <span className="inline-block rounded-full bg-inflixo-purple-light px-2.5 py-0.5 text-[11px] font-extrabold text-inflixo-purple mb-1">
                      {THEME_TAGS[t.key] || "Design Theme"}
                    </span>
                    <p className="text-sm font-black text-inflixo-navy">{t.name}</p>
                    <p className="text-xs text-muted mt-0.5 line-clamp-2 leading-relaxed">{t.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upgrade Modal Dialog when Limit Reached */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 p-6 sm:p-8 text-white shadow-2xl text-center space-y-5">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute right-4 top-4 rounded-xl bg-white/10 p-2 text-slate-400 hover:bg-white/20 hover:text-white transition-all"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Lock className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h3 className="font-display text-xl font-black text-white">3/3 Free Theme Changes Used</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Free accounts get <strong className="text-white font-extrabold">3 theme customizations</strong>. You have used all 3 free theme switches. Upgrade to <strong className="text-purple-300 font-extrabold">Inflixo Pro</strong> to unlock <strong className="font-extrabold text-white">"{targetThemeName}"</strong> and unlimited theme customizations!
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <Button
                variant="primary"
                fullWidth
                icon={<Crown className="h-4 w-4 text-amber-300 fill-current" />}
                onClick={() => router.push("/dashboard/subscription")}
              >
                Upgrade to Pro Plan
              </Button>

              <Button
                variant="ghost"
                fullWidth
                onClick={() => setShowUpgradeModal(false)}
                className="text-slate-400 hover:text-white"
              >
                Keep Current Theme
              </Button>
            </div>
          </div>
        </div>
      )}
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
