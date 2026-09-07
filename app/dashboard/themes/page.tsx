"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Check,
  Eye,
  Search,
  X,
  Palette,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  Undo2,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { THEME_LIST, THEME_PAGE_BACKGROUNDS, ThemeService } from "@/services/ThemeService";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { AmbientAnimation } from "@/components/theme/AmbientAnimation";
import { FocusOverlay } from "@/components/theme/FocusOverlay";
import { ThemeKey, ThemeMeta } from "@/types";
import { buildProfileUrl } from "@/utils/format";

export default function DashboardThemesPage() {
  const { profile, socials, series, totalAudience, theme, setTheme } = useCreator();
  const { showToast } = useToast();

  // Active theme vs Interactive Preview theme
  const [previewThemeKey, setPreviewThemeKey] = useState<ThemeKey>(theme);
  const [isApplying, setIsApplying] = useState(false);

  // Search & Filter state
  const [activeGroup, setActiveGroup] = useState<"all" | "animated" | "light" | "dark">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Horizontal Carousel Scrolling state
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Sync preview theme if global theme changes from external context
  useEffect(() => {
    setPreviewThemeKey(theme);
  }, [theme]);

  // Theme Meta lookups
  const activeThemeMeta = useMemo(() => {
    return THEME_LIST.find((t) => t.key === theme) || THEME_LIST[0];
  }, [theme]);

  const previewThemeMeta = useMemo(() => {
    return THEME_LIST.find((t) => t.key === previewThemeKey) || activeThemeMeta;
  }, [previewThemeKey, activeThemeMeta]);

  const isPreviewDifferent = previewThemeKey !== theme;
  const canonicalUrl = buildProfileUrl(profile?.username || "creator");
  const pageBgStyle = previewThemeMeta.outerBgClass || THEME_PAGE_BACKGROUNDS[previewThemeKey] || THEME_PAGE_BACKGROUNDS["minimal-white"];

  // Filter themes based on search & category
  const filteredThemes = useMemo(() => {
    return THEME_LIST.filter((t) => {
      const matchesGroup =
        activeGroup === "all" ||
        (activeGroup === "animated" ? Boolean(t.isAnimated || t.group === "animated") : t.group === activeGroup);
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.group.toLowerCase().includes(q);
      return matchesGroup && matchesQuery;
    });
  }, [activeGroup, searchQuery]);

  // Group counts for filter pills
  const groupCounts = useMemo(() => {
    return {
      all: THEME_LIST.length,
      animated: THEME_LIST.filter((t) => t.isAnimated || t.group === "animated").length,
      light: THEME_LIST.filter((t) => t.group === "light").length,
      dark: THEME_LIST.filter((t) => t.group === "dark").length,
    };
  }, []);

  // Update carousel scroll state
  const checkScrollState = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScrollState();
    window.addEventListener("resize", checkScrollState);
    return () => window.removeEventListener("resize", checkScrollState);
  }, [checkScrollState, filteredThemes]);

  // Mouse wheel horizontal scroll handler
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        if (
          (e.deltaY > 0 && el.scrollLeft + el.clientWidth < el.scrollWidth - 2) ||
          (e.deltaY < 0 && el.scrollLeft > 2)
        ) {
          e.preventDefault();
          el.scrollLeft += e.deltaY;
          checkScrollState();
        }
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [checkScrollState]);

  const scrollCarousel = (direction: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    const scrollAmount = 300;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
    setTimeout(checkScrollState, 350);
  };

  // Preview click handler (instant preview, not applied yet)
  const handleThemePreview = (tKey: ThemeKey) => {
    setPreviewThemeKey(tKey);
  };

  // Apply theme permanently
  const handleApplyTheme = async () => {
    if (isApplying || previewThemeKey === theme) return;

    setIsApplying(true);
    try {
      setTheme(previewThemeKey);
      ThemeService.setSelectedTheme(previewThemeKey, true);
      showToast(`${previewThemeMeta.name} applied as your live theme! ✨`);
    } catch (err) {
      console.error("Failed to apply theme:", err);
      showToast("Failed to apply theme. Please try again.", "error");
      setPreviewThemeKey(theme);
    } finally {
      setIsApplying(false);
    }
  };

  // Cancel preview and revert to active theme
  const handleCancelPreview = () => {
    setPreviewThemeKey(theme);
    showToast(`Reverted preview to ${activeThemeMeta.name}`);
  };

  return (
    <div className="space-y-6 w-full pb-16 text-left">
      {/* =========================================================================
         1. APPEARANCE PAGE HEADING
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#181716]">
            Appearance
          </h1>
          <p className="text-xs sm:text-[13px] text-[#797570] font-medium mt-0.5">
            Choose how your public creator profile looks.
          </p>
        </div>

        {/* Retained active-theme badge on the right */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#f3dde057] border border-[#B85C6B]/20 px-3.5 py-1.5 text-xs font-semibold text-[#8C3F4D] shadow-xs">
            <span className="h-2 w-2 rounded-full bg-[#B85C6B]" />
            Active theme: {activeThemeMeta.name}
          </span>
        </div>
      </div>

      {/* =========================================================================
         2. SEARCH AND THEME FILTERS TOOLBAR
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-[#E4DAD5] bg-white p-2 sm:p-2.5 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B5A5D] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search themes by name or style..."
            className="w-full pl-9 pr-8 py-2 bg-[#fbfbfb] border border-[#E4DAD5] rounded-xl text-xs font-medium text-[#241618] placeholder:text-[#6B5A5D]/60 focus:outline-none focus:border-[#B85C6B] focus:bg-white focus:ring-1 focus:ring-[#B85C6B]/20 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B5A5D] hover:text-[#241618] p-0.5 rounded-full cursor-pointer"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => setActiveGroup("all")}
            className={`tap-scale shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${activeGroup === "all"
              ? "bg-[#B85C6B] text-white shadow-xs"
              : "bg-[#fbfbfb] border border-[#E4DAD5] text-[#6B5A5D] hover:text-[#241618] hover:bg-white"
              }`}
          >
            All ({groupCounts.all})
          </button>

          <button
            type="button"
            onClick={() => setActiveGroup("animated")}
            className={`tap-scale shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${activeGroup === "animated"
              ? "bg-[#B85C6B] text-white shadow-xs"
              : "bg-[#fbfbfb] border border-[#E4DAD5] text-[#8C3F4D] hover:text-[#241618] hover:bg-white"
              }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Animated ({groupCounts.animated})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveGroup("light")}
            className={`tap-scale shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${activeGroup === "light"
              ? "bg-[#B85C6B] text-white shadow-xs"
              : "bg-[#fbfbfb] border border-[#E4DAD5] text-[#6B5A5D] hover:text-[#241618] hover:bg-white"
              }`}
          >
            Light ({groupCounts.light})
          </button>

          <button
            type="button"
            onClick={() => setActiveGroup("dark")}
            className={`tap-scale shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${activeGroup === "dark"
              ? "bg-[#B85C6B] text-white shadow-xs"
              : "bg-[#fbfbfb] border border-[#E4DAD5] text-[#6B5A5D] hover:text-[#241618] hover:bg-white"
              }`}
          >
            Dark ({groupCounts.dark})
          </button>
        </div>
      </div>

      {/* =========================================================================
         3. HORIZONTALLY SCROLLABLE THEME LISTING
         ========================================================================= */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[#6B5A5D] flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5 text-[#B85C6B]" />
            <span>Select theme to preview</span>
          </h2>
          <span className="text-[11px] text-[#6B5A5D] font-semibold">
            {filteredThemes.length} {filteredThemes.length === 1 ? "theme" : "themes"}
          </span>
        </div>

        {/* Carousel Outer Wrapper with Navigation Arrows and Edge Fades */}
        <div className="relative w-full overflow-hidden rounded-2xl group/carousel">
          {/* Left Navigation Arrow */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollCarousel("left")}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-white/95 border border-[#E4DAD5] text-[#241618] shadow-md hover:bg-white hover:scale-105 transition-all cursor-pointer"
              title="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          {/* Right Navigation Arrow */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollCarousel("right")}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-white/95 border border-[#E4DAD5] text-[#241618] shadow-md hover:bg-white hover:scale-105 transition-all cursor-pointer"
              title="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {/* Soft Left Edge Fade */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#fbfbfb] to-transparent pointer-events-none z-10 transition-opacity duration-200 ${canScrollLeft ? "opacity-100" : "opacity-0"
              }`}
          />

          {/* Soft Right Edge Fade */}
          <div
            className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#fbfbfb] to-transparent pointer-events-none z-10 transition-opacity duration-200 ${canScrollRight ? "opacity-100" : "opacity-0"
              }`}
          />

          {/* Scrollable Track */}
          {filteredThemes.length === 0 ? (
            <div className="rounded-2xl border border-[#E4DAD5] bg-white p-8 text-center space-y-2 shadow-xs">
              <Palette className="h-8 w-8 text-[#6B5A5D] mx-auto opacity-50" />
              <h3 className="font-display text-sm font-bold text-[#241618]">No themes found</h3>
              <p className="text-xs text-[#6B5A5D] max-w-xs mx-auto">
                Try searching for a different name or select another style category.
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveGroup("all");
                  }}
                  className="text-xs font-semibold text-[#B85C6B] hover:underline cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            </div>
          ) : (
            <div
              ref={carouselRef}
              onScroll={checkScrollState}
              tabIndex={0}
              role="region"
              aria-label="Theme list carousel"
              className="flex items-stretch gap-3 overflow-x-auto py-1 px-0.5 scrollbar-none snap-x snap-mandatory focus:outline-none"
            >
              {filteredThemes.map((t) => {
                const isActive = theme === t.key;
                const isPreviewing = previewThemeKey === t.key;

                return (
                  <ThemeCarouselCard
                    key={t.key}
                    theme={t}
                    isActive={isActive}
                    isPreviewing={isPreviewing}
                    onSelect={() => handleThemePreview(t.key)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
         4. THEME INTERACTION & LIVE PROFILE PREVIEW ACTION BAR
         ========================================================================= */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#E4DAD5] bg-white p-3 sm:p-4 shadow-xs">
          {/* Left: Section Title & Current Preview Status */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#B85C6B]" />
              <h2 className="font-display text-sm sm:text-base font-bold text-[#241618]">
                Live Profile Preview
              </h2>
            </div>

            {isPreviewDifferent ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f3dde057] border border-[#B85C6B]/20 px-2.5 py-0.5 text-xs font-bold text-[#8C3F4D] animate-pulse">
                <Sparkles className="h-3 w-3 text-[#B85C6B]" />
                Previewing: {previewThemeMeta.name}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#17845B] bg-[#EAF7F0] px-2.5 py-0.5 rounded-full border border-[#17845B]/20">
                <span className="h-1.5 w-1.5 rounded-full bg-[#17845B]" />
                Showing active theme
              </span>
            )}
          </div>

          {/* Right: Actions (Apply / Cancel when previewing, or Open Public Profile) */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {isPreviewDifferent && (
              <>
                <button
                  type="button"
                  onClick={handleCancelPreview}
                  disabled={isApplying}
                  className="tap-scale inline-flex items-center gap-1.5 rounded-xl border border-[#E4DAD5] bg-white hover:bg-[#fbfbfb] text-[#6B5A5D] hover:text-[#241618] px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  title="Cancel preview and revert to active theme"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  <span>Cancel Preview</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyTheme}
                  disabled={isApplying}
                  className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-[#B85C6B] hover:bg-[#8C3F4D] text-white px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  title="Save and apply this theme permanently"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Applying...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>Apply Theme</span>
                    </>
                  )}
                </button>
              </>
            )}

            <a
              href={canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-scale inline-flex items-center gap-1.5 rounded-xl border border-[#E4DAD5] bg-[#fbfbfb] hover:bg-white text-[#241618] px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer shadow-xs hover:border-[#B85C6B]/30"
              title="Open public profile in new tab"
            >
              <span>Open Public Profile</span>
              <ExternalLink className="h-3.5 w-3.5 text-[#B85C6B]" />
            </a>
          </div>
        </div>

        {/* =========================================================================
           5. FULL-WIDTH LIVE PROFILE PREVIEW CONTAINER
           ========================================================================= */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#E4DAD5] bg-[#fbfbfb] p-3 sm:p-6 md:p-8 shadow-xs transition-all">
          <div
            style={{ backgroundColor: previewThemeMeta.colors.pageBackground }}
            className={`relative w-full rounded-2xl border border-black/5 overflow-hidden transition-colors duration-300 p-3 sm:p-6 md:p-8 ${pageBgStyle}`}
          >
            {/* Ambient Background Animation in Live Preview */}
            <AmbientAnimation
              type={previewThemeMeta.animation?.type || previewThemeMeta.animationType}
              colors={previewThemeMeta.animation?.colors || previewThemeMeta.particleColors}
              themeKey={previewThemeKey}
              contained={true}
            />

            {/* Theme-aware Focus Overlay */}
            <FocusOverlay overlay={previewThemeMeta.focusOverlay} contained={true} />

            <div className="relative z-10 w-full max-w-[620px] mx-auto">
              <LivePreviewCard
                profile={profile}
                socials={socials}
                series={series}
                totalAudience={totalAudience}
                themeKey={previewThemeKey}
                variant="full"
                isInformational={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   THEME CAROUSEL CARD COMPONENT
   ========================================================================== */
interface ThemeCarouselCardProps {
  theme: ThemeMeta;
  isActive: boolean;
  isPreviewing: boolean;
  onSelect: () => void;
}

function ThemeCarouselCard({
  theme,
  isActive,
  isPreviewing,
  onSelect,
}: ThemeCarouselCardProps) {
  const [bg, accent, text] = theme.swatch || ["#7c3aed", "#ede9fe", "#14121a"];
  const isThemeAnimated = Boolean(theme.isAnimated || theme.group === "animated");

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col justify-between w-[260px] sm:w-[280px] shrink-0 rounded-2xl border p-3 text-left transition-all cursor-pointer shadow-xs snap-start ${isPreviewing
        ? "border-[#B85C6B] ring-2 ring-[#B85C6B]/25 bg-[#f3dde057]/30"
        : "border-[#E4DAD5] bg-white hover:border-[#B85C6B]/40 hover:shadow-sm"
        }`}
    >
      {/* Mini Visual Palette / Swatch Banner */}
      <div
        className="relative w-full h-24 sm:h-28 rounded-xl overflow-hidden p-2.5 flex flex-col justify-between transition-transform duration-300 group-hover:scale-[1.01]"
        style={{
          background:
            theme.key === "minimal-white"
              ? "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)"
              : `linear-gradient(135deg, ${bg} 0%, ${accent} 100%)`,
        }}
      >
        {/* Top Row: Swatches & Animated / Active Badge */}
        <div className="flex items-center justify-between w-full z-10">
          {/* Swatches Pill */}
          <div className="flex items-center gap-1.5 rounded-full bg-black/25 backdrop-blur-md px-2.5 py-1 border border-white/20 shadow-xs">
            <span
              className="h-2.5 w-2.5 rounded-full border border-white/40 shadow-xs"
              style={{ backgroundColor: bg }}
              title="Card background"
            />
            <span
              className="h-2.5 w-2.5 rounded-full border border-white/40 shadow-xs"
              style={{ backgroundColor: accent }}
              title="Accent color"
            />
            <span
              className="h-2.5 w-2.5 rounded-full border border-white/40 shadow-xs"
              style={{ backgroundColor: text }}
              title="Text color"
            />
          </div>

          {/* Right Badges */}
          <div className="flex items-center gap-1">
            {isThemeAnimated && (
              <span className="flex items-center gap-1 rounded-full bg-black/40 text-amber-300 px-2 py-0.5 text-[9px] font-bold shadow-xs border border-amber-300/30 backdrop-blur-xs">
                <Sparkles className="h-2.5 w-2.5 text-amber-300" />
                <span>Animated</span>
              </span>
            )}

            {/* Active Badge (only when applied) */}
            {isActive ? (
              <span className="flex items-center gap-1 rounded-full bg-[#B85C6B] text-white px-2.5 py-0.5 text-[10px] font-bold shadow-xs border border-white/30">
                <Check className="h-3 w-3 stroke-[3]" />
                <span>Active</span>
              </span>
            ) : isPreviewing ? (
              <span className="flex items-center gap-1 rounded-full bg-white/90 text-[#B85C6B] px-2 py-0.5 text-[10px] font-bold shadow-xs border border-[#B85C6B]/30 backdrop-blur-xs">
                <Eye className="h-2.5 w-2.5" />
                <span>Previewing</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Center: Clean Mini Profile Skeleton */}
        <div className="flex items-center gap-2 opacity-70 z-10">
          <div className="h-5 w-5 rounded-full bg-white/60 border border-white/30 shrink-0" />
          <div className="space-y-1 flex-1 min-w-0">
            <div className="h-1.5 w-14 rounded-full bg-white/70" />
            <div className="h-1 w-9 rounded-full bg-white/50" />
          </div>
        </div>

        {/* Subtle Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Card Info Footer */}
      <div className="pt-2.5 px-0.5 flex items-center justify-between gap-2 w-full">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-[#241618] flex items-center gap-1">
            <span>{theme.name}</span>
          </p>
          <p className="truncate text-[10px] text-[#6B5A5D] capitalize font-medium">
            {theme.tag || `${theme.group} theme`}
          </p>
        </div>

        {/* Action Button/Indicator */}
        <div>
          {isActive ? (
            <span className="text-[11px] font-bold text-[#8C3F4D] bg-[#f3dde057] border border-[#B85C6B]/20 px-2 py-1 rounded-lg">
              Active
            </span>
          ) : isPreviewing ? (
            <span className="text-[11px] font-bold text-[#8C3F4D] bg-[#f3dde057] border border-[#B85C6B]/20 px-2 py-1 rounded-lg">
              Previewing
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-[#6B5A5D] group-hover:text-[#B85C6B] transition-colors">
              Preview →
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

