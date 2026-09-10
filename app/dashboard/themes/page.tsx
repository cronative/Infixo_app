"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Check,
  ExternalLink,
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

const THEME_SUBTITLES: Record<string, string> = {
  "minimal-white": "Clean & Minimal",
  "signature-purple": "Inflixo Signature",
  "midnight-dark": "Bold & Dark",
  "cyberpunk-neon": "Animated & Futuristic",
  "cosmic-void": "Deep Space & Stars",
  "sunset-creator": "Warm Gradient & Glow",
  "editorial-noir": "Monochrome & Sharp",
  "vintage-sepia": "Earthy & Warm",
  "galaxy-nebula": "Cosmic Dust & Glow",
  "matrix-code": "Digital & Tech Grid",
  "party-glam": "Gold & Luxury",
  "orbs-flow": "Liquid Float & Orbs",
  "diwali-glow": "Festive Lights & Spark",
  "sparkle-minimal": "Subtle Stars & Clean",
};

export default function DashboardThemesPage() {
  const { profile, socials, series, totalAudience, theme, setTheme } = useCreator();
  const { showToast } = useToast();

  // Active theme vs Interactive Preview theme
  const [previewThemeKey, setPreviewThemeKey] = useState<ThemeKey>(theme);
  const [isApplying, setIsApplying] = useState(false);
  const [justApplied, setJustApplied] = useState(false);

  // Category Filter state
  const [activeGroup, setActiveGroup] = useState<"all" | "animated" | "light" | "dark">("all");

  // Sync preview theme if global theme changes
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

  // Filter themes based on group
  const filteredThemes = useMemo(() => {
    return THEME_LIST.filter((t) => {
      if (activeGroup === "all") return true;
      if (activeGroup === "animated") return Boolean(t.isAnimated || t.group === "animated");
      return t.group === activeGroup;
    });
  }, [activeGroup]);

  // Preview click handler (instant preview, does not apply immediately)
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
      setJustApplied(true);
      showToast(`${previewThemeMeta.name} applied to your profile! ✨`);
      setTimeout(() => setJustApplied(false), 2000);
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
  };

  return (
    <div className="w-full pb-16 text-left">
      {/* 2-COLUMN SPLIT LAYOUT: Appearance + Themes on Left | Sticky Profile Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* LEFT COLUMN: APPEARANCE & THEMES (6 cols on lg, 5 cols on xl) */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-4">
          {/* Header: Appearance title + Filter Pills aligned at top */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[52px]">
            <div className="space-y-0.5">
              <h1 className="text-[22px] sm:text-[24px] font-bold tracking-tight text-[#181716] leading-tight">
                Appearance
              </h1>
              <p className="text-xs sm:text-[13px] text-[#54514D] font-normal">
                Choose how your public creator profile looks.
              </p>
            </div>

            {/* Simple Filter Pills (No Counts) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none shrink-0">
              {(["all", "animated", "light", "dark"] as const).map((group) => {
                const isSelected = activeGroup === group;
                const label =
                  group === "all"
                    ? "All"
                    : group === "animated"
                    ? "Animated"
                    : group === "light"
                    ? "Light"
                    : "Dark";

                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setActiveGroup(group)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                      isSelected
                        ? "bg-[#3a2447] text-white shadow-xs"
                        : "border border-[#E7E3DC] bg-white text-[#54514D] hover:text-[#181716] hover:bg-[#FAF8F5]"
                    }`}
                  >
                    {group === "animated" && <Sparkles className="inline h-3 w-3 mr-1" />}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2-Column Responsive Grid for Themes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredThemes.map((t) => {
              const isActive = theme === t.key;
              const isPreviewing = previewThemeKey === t.key;

              return (
                <ThemeCard
                  key={t.key}
                  theme={t}
                  isActive={isActive}
                  isPreviewing={isPreviewing}
                  onSelect={() => handleThemePreview(t.key)}
                />
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: STICKY PROFILE PREVIEW (6 cols on lg, 7 cols on xl) */}
        <div className="lg:col-span-6 xl:col-span-7 lg:sticky lg:top-6 space-y-4">
          {/* Header: Profile preview title + Action Controls aligned at top */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-h-[52px]">
            <div className="space-y-0.5">
              <h2 className="text-[22px] sm:text-[24px] font-bold tracking-tight text-[#181716] leading-tight">
                Profile preview
              </h2>
              <p className="text-xs sm:text-[13px] text-[#54514D] font-normal">
                {isPreviewDifferent ? (
                  <span>
                    Previewing: <strong className="text-[#181716] font-semibold">{previewThemeMeta.name}</strong>
                  </span>
                ) : (
                  <span>
                    Active theme: <strong className="text-[#181716] font-semibold">{previewThemeMeta.name}</strong>
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {isPreviewDifferent && (
                <>
                  <button
                    type="button"
                    onClick={handleCancelPreview}
                    disabled={isApplying}
                    className="h-9 px-3 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-[#54514D] hover:text-[#181716] text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                    <span>Cancel</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyTheme}
                    disabled={isApplying}
                    className="h-9 px-3.5 rounded-xl bg-[#3a2447] hover:bg-[#2c1937] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Applying...</span>
                      </>
                    ) : justApplied ? (
                      <>
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                        <span>Applied!</span>
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
                className="h-9 px-3 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-[#181716] text-xs font-semibold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                title="View public profile in new tab"
              >
                <span>View Profile</span>
                <ExternalLink className="h-3.5 w-3.5 text-[#797570]" />
              </a>
            </div>
          </div>

          {/* Clean Phone Mockup Frame (Expanded width & height, redundant outer container removed) */}
          <div className="w-full flex justify-center pt-1">
            <div className="w-full max-w-[450px] sm:max-w-[470px] xl:max-w-[490px] rounded-[38px] border-[6px] border-[#181716] bg-black shadow-2xl overflow-hidden relative">
              {/* Phone Top Notch/Island */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-4 w-28 bg-[#181716] rounded-full z-30 pointer-events-none" />

              {/* Scrollable Viewport inside phone */}
              <div
                style={{ backgroundColor: previewThemeMeta.colors.pageBackground }}
                className={`relative w-full h-[640px] lg:h-[690px] xl:h-[740px] overflow-y-auto overflow-x-hidden scrollbar-thin transition-colors duration-300 px-1 sm:px-1.5 pt-6 pb-6 ${pageBgStyle}`}
              >
                {/* Ambient Background Animation */}
                <AmbientAnimation
                  type={previewThemeMeta.animation?.type || previewThemeMeta.animationType}
                  colors={previewThemeMeta.animation?.colors || previewThemeMeta.particleColors}
                  themeKey={previewThemeKey}
                  contained={true}
                />

                {/* Theme-aware Focus Overlay */}
                <FocusOverlay overlay={previewThemeMeta.focusOverlay} contained={true} />

                <div className="relative z-10 w-full">
                  <LivePreviewCard
                    profile={profile}
                    socials={socials}
                    series={series}
                    totalAudience={totalAudience}
                    themeKey={previewThemeKey}
                    variant="full"
                    isInformational={true}
                    cardPadding="px-3.5 sm:px-4 py-5 sm:py-6"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ==========================================================================
   THEME CARD SUB-COMPONENT (Identical size, clean thumbnail, single active badge)
   ========================================================================== */
interface ThemeCardProps {
  theme: ThemeMeta;
  isActive: boolean;
  isPreviewing: boolean;
  onSelect: () => void;
}

function ThemeCard({
  theme,
  isActive,
  isPreviewing,
  onSelect,
}: ThemeCardProps) {
  const [bg, accent] = theme.swatch || ["#7c3aed", "#ede9fe"];
  const isThemeAnimated = Boolean(theme.isAnimated || theme.group === "animated");
  const subtitle = THEME_SUBTITLES[theme.key] || theme.tag || (theme.mode === "dark" ? "Bold & Dark" : "Clean & Light");

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col justify-between w-full rounded-2xl border p-3 text-left transition-all cursor-pointer shadow-xs ${
        isPreviewing
          ? "border-[#3a2447] ring-2 ring-[#3a2447]/20 bg-[#3a2447]/[0.03]"
          : isActive
          ? "border-[#17845B]/40 ring-1 ring-[#17845B]/20 bg-white"
          : "border-[#E7E3DC] bg-white hover:border-[#3a2447]/30 hover:shadow-sm"
      }`}
    >
      {/* Visual Thumbnail (Taller ~16:8 aspect ratio) */}
      <div
        className="relative w-full h-28 sm:h-32 rounded-xl overflow-hidden p-2.5 flex flex-col justify-between transition-transform duration-300 group-hover:scale-[1.01]"
        style={{
          background:
            theme.key === "minimal-white"
              ? "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)"
              : `linear-gradient(135deg, ${bg} 0%, ${accent} 100%)`,
        }}
      >
        {/* Top Badges */}
        <div className="flex items-center justify-between w-full z-10">
          {/* Animated badge (Left) */}
          {isThemeAnimated ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/40 text-amber-300 px-2 py-0.5 text-[10px] font-bold shadow-xs border border-amber-300/30 backdrop-blur-xs">
              <Sparkles className="h-2.5 w-2.5 text-amber-300" />
              <span>Animated</span>
            </span>
          ) : (
            <span />
          )}

          {/* Status badge: ✓ Active vs Previewing */}
          {isActive ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF7F0] text-[#17845B] border border-[#17845B]/20 px-2.5 py-0.5 text-[10px] font-bold shadow-xs">
              <Check className="h-3 w-3 stroke-[3]" />
              <span>Active</span>
            </span>
          ) : isPreviewing ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#3a2447] text-white px-2.5 py-0.5 text-[10px] font-bold shadow-xs">
              <span>Previewing</span>
            </span>
          ) : null}
        </div>

        {/* Center: Clean Mini Profile Skeleton */}
        <div className="flex items-center gap-2 opacity-70 z-10">
          <div className="h-5 w-5 rounded-full bg-white/70 border border-white/40 shrink-0" />
          <div className="space-y-1 flex-1 min-w-0">
            <div className="h-1.5 w-16 rounded-full bg-white/70" />
            <div className="h-1 w-10 rounded-full bg-white/50" />
          </div>
        </div>

        {/* Subtle Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Card Info Footer */}
      <div className="pt-2 px-0.5 flex items-center justify-between gap-2 w-full">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs sm:text-[13px] font-bold text-[#181716]">
            {theme.name}
          </p>
          <p className="truncate text-[11px] text-[#797570] font-normal">
            {subtitle}
          </p>
        </div>
      </div>
    </button>
  );
}
