"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Eye, Copy, ExternalLink, LogOut } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { THEME_LIST, ThemeService } from "@/services/ThemeService";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { ThemeKey } from "@/types";
import { AuthService } from "@/services/AuthService";
import { copyToClipboard } from "@/lib/copyToClipboard";

export default function DashboardThemesPage() {
  const router = useRouter();
  const { profile, socials, series, totalAudience, theme, setTheme } = useCreator();
  const { showToast } = useToast();

  const [activeGroup, setActiveGroup] = useState<"all" | "light" | "shimmer" | "dark">("all");

  const handleStr = profile.username || "nikzios30";
  const profileUrl = `inflixo.com/${handleStr}`;

  async function handleCopyLink() {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
    const fullLink = `${origin}/${handleStr}`;
    const success = await copyToClipboard(fullLink);
    if (success) {
      showToast("Profile link copied! ✨");
    } else {
      showToast("Could not copy link", "error");
    }
  }

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

  const selectedThemeName = THEME_LIST.find((t) => t.key === theme)?.name || "Minimal White";

  return (
    <div className="min-h-dvh bg-[#F9FAFB] text-slate-900 pb-16">
      <div className="mx-auto max-w-6xl px-3 sm:px-6 py-4 sm:py-6 space-y-5 text-left">
        
        {/* Consistent Top Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <div>
              <h1 className="font-display text-lg font-black text-slate-900 truncate">
                Themes &amp; Styling
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Choose a visual design theme for your public profile. Changes update instantly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-[#803D63] hover:bg-indigo-100 transition-colors cursor-pointer shrink-0"
              title="Copy Profile Link"
            >
              <span>{profileUrl}</span>
              <Copy className="h-3 w-3 opacity-70" />
            </button>

            <a
              href={`/${handleStr}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5 text-[#803D63]" />
              <span>View Live Profile ↗</span>
            </a>

            <button
              type="button"
              onClick={() => {
                AuthService.logout();
                router.push("/login");
              }}
              className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Left Theme Selector & Right Sticky Live Preview */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Left Column: Filter Pills + Full-Bleed Theme Cards */}
          <div className="lg:col-span-7 space-y-4 order-2 lg:order-1">
            
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveGroup("all")}
                className={`tap-scale shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  activeGroup === "all"
                    ? "bg-[#803D63] text-white shadow-none"
                    : "bg-white border border-[#E5E7EB] text-[#4B5563] hover:border-gray-300"
                }`}
              >
                All
              </button>

              <button
                type="button"
                onClick={() => setActiveGroup("light")}
                className={`tap-scale shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  activeGroup === "light"
                    ? "bg-[#803D63] text-white shadow-none"
                    : "bg-white border border-[#E5E7EB] text-[#4B5563] hover:border-gray-300"
                }`}
              >
                Light
              </button>

              <button
                type="button"
                onClick={() => setActiveGroup("shimmer")}
                className={`tap-scale shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeGroup === "shimmer"
                    ? "bg-[#803D63] text-white shadow-none"
                    : "bg-white border border-[#E5E7EB] text-[#4B5563] hover:border-gray-300"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-[#803D63]" />
                Shimmer
              </button>

              <button
                type="button"
                onClick={() => setActiveGroup("dark")}
                className={`tap-scale shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  activeGroup === "dark"
                    ? "bg-[#803D63] text-white shadow-none"
                    : "bg-white border border-[#E5E7EB] text-[#4B5563] hover:border-gray-300"
                }`}
              >
                Dark
              </button>
            </div>

            {/* Theme Selection Grid: Full-Bleed Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredThemes.map((t) => {
                const isSelected = theme === t.key;
                return (
                  <ThemeTile
                    key={t.key}
                    theme={t}
                    isSelected={isSelected}
                    onSelect={() => handleThemeSelect(t.key, t.name)}
                  />
                );
              })}
            </div>
          </div>

          {/* Right Column: Sticky Live Mobile Preview Mockup */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-2.5 order-1 lg:order-2 h-fit">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-[#803D63]" />
                <span>Live Phone Preview</span>
              </p>
              <span className="bg-[#F6EBF1] text-[#803D63] border border-[#E8DCE4] text-xs font-semibold px-3 py-1 rounded-full">
                Selected: {selectedThemeName}
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-2xs">
              <LivePreviewCard
                profile={profile}
                socials={socials}
                series={series}
                totalAudience={totalAudience}
                themeKey={theme}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
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
  const isDark = theme.group === "dark" || theme.group === "shimmer";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`tap-scale relative w-full h-32 rounded-2xl overflow-hidden p-3.5 flex flex-col justify-between text-left transition-all cursor-pointer shadow-2xs ${
        isSelected
          ? "ring-2 ring-offset-2 ring-[#803D63]"
          : "border border-gray-200/80 hover:border-gray-400 hover:shadow-md"
      }`}
      style={{
        background: `linear-gradient(135deg, ${bg} 0%, ${accent} 100%)`,
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

        {/* Selected Checkmark Badge */}
        {isSelected && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#803D63] text-white shadow-md border-2 border-white">
            <Check className="h-3.5 w-3.5 stroke-[3]" />
          </div>
        )}
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
          {theme.isShimmer && <Sparkles className="h-3 w-3 text-amber-400 fill-amber-400" />}
        </div>
      </div>

      {/* Subtle Bottom Vignette Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none" />
    </button>
  );
}

