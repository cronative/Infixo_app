"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Sparkles,
  Eye,
  Search,
  X,
  Palette,
  ExternalLink,
  ChevronUp,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { THEME_LIST, ThemeService } from "@/services/ThemeService";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { ThemeKey, ThemeMeta } from "@/types";

export default function DashboardThemesPage() {
  const router = useRouter();
  const { profile, socials, series, totalAudience, theme, setTheme } = useCreator();
  const { showToast } = useToast();

  const [activeGroup, setActiveGroup] = useState<"all" | "light" | "shimmer" | "dark">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  const activeThemeMeta = useMemo(() => {
    return THEME_LIST.find((t) => t.key === theme) || THEME_LIST[0];
  }, [theme]);

  // Handle Theme Selection & Immediate Application
  function handleThemeSelect(tKey: ThemeKey, tName: string) {
    if (tKey === theme) return;

    setTheme(tKey);
    ThemeService.setSelectedTheme(tKey, true);
    showToast(`${tName} theme applied! ✨`);
  }

  const handleScrollToPreview = () => {
    if (previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Filter themes
  const filteredThemes = useMemo(() => {
    return THEME_LIST.filter((t) => {
      const matchesGroup = activeGroup === "all" || t.group === activeGroup;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.group.toLowerCase().includes(q);
      return matchesGroup && matchesQuery;
    });
  }, [activeGroup, searchQuery]);

  // Group counts
  const groupCounts = useMemo(() => {
    return {
      all: THEME_LIST.length,
      light: THEME_LIST.filter((t) => t.group === "light").length,
      shimmer: THEME_LIST.filter((t) => t.group === "shimmer").length,
      dark: THEME_LIST.filter((t) => t.group === "dark").length,
    };
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#17131A] tracking-tight">
            Appearance
          </h1>
          <p className="text-xs sm:text-sm text-[#6F6872] font-medium mt-1">
            Choose how your public creator profile looks.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F7EDF3] border border-[#ECE8EB] px-3.5 py-1.5 text-xs font-semibold text-[#803D63]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#803D63]" />
            Active theme: {activeThemeMeta.name}
          </span>
        </div>
      </div>

      {/* 2. MAIN TWO-COLUMN LAYOUT (Theme Browser Left, Live Preview Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* =========================================================================
           LEFT COLUMN: THEME BROWSER (Approx 45% -> 5 cols on lg, 6 cols on xl)
           ========================================================================= */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-4 text-left order-2 lg:order-1">
          
          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6F6872] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search themes by name or style..."
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-[#ECE8EB] rounded-xl text-xs font-medium text-[#17131A] placeholder:text-[#6F6872]/60 focus:outline-none focus:border-[#803D63] focus:ring-1 focus:ring-[#803D63]/20 transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6F6872] hover:text-[#17131A] p-0.5 rounded-full cursor-pointer"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveGroup("all")}
              className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeGroup === "all"
                  ? "bg-[#803D63] text-white shadow-2xs"
                  : "bg-white border border-[#ECE8EB] text-[#6F6872] hover:text-[#17131A] hover:bg-[#FAF8FA]"
              }`}
            >
              All ({groupCounts.all})
            </button>

            <button
              type="button"
              onClick={() => setActiveGroup("light")}
              className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeGroup === "light"
                  ? "bg-[#803D63] text-white shadow-2xs"
                  : "bg-white border border-[#ECE8EB] text-[#6F6872] hover:text-[#17131A] hover:bg-[#FAF8FA]"
              }`}
            >
              Light ({groupCounts.light})
            </button>

            <button
              type="button"
              onClick={() => setActiveGroup("shimmer")}
              className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1 ${
                activeGroup === "shimmer"
                  ? "bg-[#803D63] text-white shadow-2xs"
                  : "bg-white border border-[#ECE8EB] text-[#6F6872] hover:text-[#17131A] hover:bg-[#FAF8FA]"
              }`}
            >
              <Sparkles className="h-3 w-3" />
              <span>Shimmer ({groupCounts.shimmer})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveGroup("dark")}
              className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeGroup === "dark"
                  ? "bg-[#803D63] text-white shadow-2xs"
                  : "bg-white border border-[#ECE8EB] text-[#6F6872] hover:text-[#17131A] hover:bg-[#FAF8FA]"
              }`}
            >
              Dark ({groupCounts.dark})
            </button>
          </div>

          {/* Results Count Header */}
          <div className="flex items-center justify-between px-0.5 pt-1">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[#6F6872]">
              Explore themes
            </h2>
            <span className="text-[11px] text-[#6F6872] font-semibold">
              {filteredThemes.length} {filteredThemes.length === 1 ? "theme" : "themes"}
            </span>
          </div>

          {/* Theme Cards Grid (2 Columns on sm+) */}
          {filteredThemes.length === 0 ? (
            <div className="rounded-2xl border border-[#ECE8EB] bg-white p-8 text-center space-y-2 shadow-2xs">
              <Palette className="h-8 w-8 text-[#6F6872] mx-auto opacity-50" />
              <h3 className="font-display text-sm font-bold text-[#17131A]">No themes found</h3>
              <p className="text-xs text-[#6F6872] max-w-xs mx-auto">
                Try searching for a different name or select another style category.
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveGroup("all");
                  }}
                  className="text-xs font-semibold text-[#803D63] hover:underline cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredThemes.map((t) => {
                const isActive = theme === t.key;
                return (
                  <ThemeCard
                    key={t.key}
                    theme={t}
                    isActive={isActive}
                    onSelect={() => handleThemeSelect(t.key, t.name)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* =========================================================================
           RIGHT COLUMN: STICKY LIVE PROFILE PREVIEW (Approx 55% -> 7 cols on lg)
           ========================================================================= */}
        <div
          ref={previewRef}
          className="lg:col-span-6 xl:col-span-7 lg:sticky lg:top-20 space-y-2.5 order-1 lg:order-2"
        >
          {/* Preview Header */}
          <div className="flex items-center justify-between px-0.5 text-left">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#803D63]" />
              <h2 className="font-display text-xs sm:text-sm font-bold text-[#17131A]">
                Live profile preview
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#16794A] bg-[#ECFDF3] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#16794A]" />
                Active: {activeThemeMeta.name}
              </span>
            </div>
          </div>

          {/* Preview Frame Container */}
          <div className="rounded-2xl border border-[#ECE8EB] bg-[#FAF8FA] p-2.5 sm:p-3.5 shadow-2xs">
            <div className="max-h-[calc(100vh-140px)] sm:max-h-[calc(100vh-160px)] overflow-y-auto rounded-xl shadow-xs scrollbar-thin">
              <LivePreviewCard
                profile={profile}
                socials={socials}
                series={series}
                totalAudience={totalAudience}
                themeKey={theme}
                variant="full"
              />
            </div>
          </div>

          {/* Mobile quick scroll button */}
          <div className="block lg:hidden text-center pt-1">
            <button
              type="button"
              onClick={handleScrollToPreview}
              className="text-[11px] font-semibold text-[#803D63] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View preview canvas</span>
              <ChevronUp className="h-3 w-3" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ==========================================================================
   THEME CARD COMPONENT
   ========================================================================== */
interface ThemeCardProps {
  theme: ThemeMeta;
  isActive: boolean;
  onSelect: () => void;
}

function ThemeCard({ theme, isActive, onSelect }: ThemeCardProps) {
  const [bg, accent, text] = theme.swatch || ["#7c3aed", "#ede9fe", "#14121a"];
  const isDark = theme.group === "dark" || theme.group === "shimmer";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col rounded-2xl border bg-white p-2.5 text-left transition-all cursor-pointer shadow-2xs overflow-hidden ${
        isActive
          ? "border-[#803D63] ring-2 ring-[#803D63]/20 bg-[#F7EDF3]/30"
          : "border-[#ECE8EB] hover:border-[#803D63]/40 hover:shadow-xs"
      }`}
    >
      {/* Mini Visual Preview Canvas */}
      <div
        className="relative w-full h-24 sm:h-28 rounded-xl overflow-hidden p-2.5 flex flex-col justify-between transition-transform duration-300 group-hover:scale-[1.01]"
        style={{
          background:
            theme.key === "minimal-white"
              ? "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)"
              : `linear-gradient(135deg, ${bg} 0%, ${accent} 100%)`,
        }}
      >
        {/* Top: Swatches & Active Badge */}
        <div className="flex items-center justify-between w-full z-10">
          {/* Swatches */}
          <div className="flex items-center gap-1 rounded-full bg-black/25 backdrop-blur-md px-2 py-0.5 border border-white/20">
            <span
              className="h-2 w-2 rounded-full border border-white/40 shadow-2xs"
              style={{ backgroundColor: bg }}
              title="Background swatch"
            />
            <span
              className="h-2 w-2 rounded-full border border-white/40 shadow-2xs"
              style={{ backgroundColor: accent }}
              title="Accent swatch"
            />
            <span
              className="h-2 w-2 rounded-full border border-white/40 shadow-2xs"
              style={{ backgroundColor: text }}
              title="Text swatch"
            />
          </div>

          {/* Active Checkmark Pill */}
          {isActive ? (
            <span className="flex items-center gap-1 rounded-full bg-[#803D63] text-white px-2 py-0.5 text-[10px] font-bold shadow-xs border border-white/30">
              <Check className="h-2.5 w-2.5 stroke-[3]" />
              <span>Active</span>
            </span>
          ) : null}
        </div>

        {/* Center: Simplified Mini Wireframe Profile Skeleton */}
        <div className="flex items-center gap-2 opacity-70 z-10">
          <div className="h-5 w-5 rounded-full bg-white/50 border border-white/30 shrink-0" />
          <div className="space-y-0.5 flex-1 min-w-0">
            <div className="h-1.5 w-12 rounded-full bg-white/60" />
            <div className="h-1 w-8 rounded-full bg-white/40" />
          </div>
        </div>

        {/* Subtle Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Card Info Footer */}
      <div className="pt-2 px-1 flex items-center justify-between gap-1 w-full">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-[#17131A] flex items-center gap-1">
            <span>{theme.name}</span>
            {theme.isShimmer && (
              <Sparkles className="h-3 w-3 text-amber-500 fill-amber-400 shrink-0" />
            )}
          </p>
          <p className="truncate text-[10px] text-[#6F6872] capitalize">
            {theme.group} theme
          </p>
        </div>

        {isActive ? (
          <span className="text-[10px] font-bold text-[#803D63] bg-[#F7EDF3] px-1.5 py-0.5 rounded-md shrink-0">
            Current
          </span>
        ) : (
          <span className="text-[10px] font-semibold text-[#6F6872] group-hover:text-[#803D63] shrink-0">
            Apply →
          </span>
        )}
      </div>
    </button>
  );
}
