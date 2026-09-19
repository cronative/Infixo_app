"use client";

import { useState, useMemo } from "react";
import {
  Check,
  ExternalLink,
  Sparkles,
  Loader2,
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
  "sage-studio": "Warm Editorial",
  "blush-paper": "Soft Creator",
  "studio-frost": "Premium Frosted",
  "taj-mahal": "Indian Heritage",
  "marine-drive": "Mumbai Sea",
  "burj-khalifa": "Dubai Luxury",
  "somnath-temple": "Gujarat Heritage",
  "dwarka-temple": "Devbhumi Gujarat",
  "goa-beach": "Coastal Creator",
  "creator-studio": "Creator Workspace",
  "neon-reels": "Reels & Shorts",
  "podcast-lounge": "Podcasts & Interviews",
  "food-vlog": "Food & Travel",
  "gamer-stream": "Gaming & Live",
  "love-letter": "Love & Lifestyle",
  "christmas-snow": "Festive Holiday",
  "mountain-mist": "Travel & Nature",
  "street-food": "Food Reviews",
  "cafe-mocha": "Cafe & Stories",
  "aurora-gradient": "Bold Gradient",
  "sunrise-pop": "Warm Gradient",
  "candy-flow": "Soft Gradient",
  "mint-wave": "Fresh Gradient",
  "royal-glow": "Premium Gradient",
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

const DEFAULT_THEME_KEY: ThemeKey = "minimal-white";
const GRADIENT_THEME_KEYS = new Set<ThemeKey>(["aurora-gradient", "sunrise-pop", "candy-flow", "mint-wave", "royal-glow"]);
const AVAILABLE_THEME_KEYS = new Set<ThemeKey>(THEME_LIST.map((item) => item.key));
const DEFAULT_THEME_LIST = THEME_LIST.filter((theme) => AVAILABLE_THEME_KEYS.has(theme.key));

type ThemeFilter = "all" | "light" | "places" | "creators" | "moments" | "gradients" | "classics" | "animated";

const THEME_FILTERS: Array<{ key: ThemeFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "light", label: "Essential" },
  { key: "places", label: "Places" },
  { key: "creators", label: "Creator" },
  { key: "moments", label: "Moments" },
  { key: "gradients", label: "Gradients" },
  { key: "classics", label: "Classic" },
  { key: "animated", label: "Animated" },
];

const THEME_GROUPS: Array<{
  key: Exclude<ThemeFilter, "all">;
  title: string;
  description: string;
  themeKeys: ThemeKey[];
}> = [
    {
      key: "light",
      title: "Essential Themes",
      description: "Clean, premium defaults that work for almost every creator.",
      themeKeys: ["minimal-white", "sage-studio", "blush-paper", "studio-frost"],
    },
    {
      key: "places",
      title: "Places & Travel",
      description: "Location-inspired looks with stronger visual identity.",
      themeKeys: ["taj-mahal", "marine-drive", "burj-khalifa", "somnath-temple", "dwarka-temple", "goa-beach", "mountain-mist"],
    },
    {
      key: "creators",
      title: "Creator Styles",
      description: "Designed around niches like reels, podcasts, food, gaming and cafe stories.",
      themeKeys: ["creator-studio", "neon-reels", "podcast-lounge", "food-vlog", "gamer-stream", "street-food", "cafe-mocha"],
    },
    {
      key: "moments",
      title: "Moments & Seasonal",
      description: "Themes for emotion, festivals and special campaigns.",
      themeKeys: ["love-letter", "christmas-snow"],
    },
    {
      key: "gradients",
      title: "Gradient Colors",
      description: "Color-forward profiles with smooth, expressive gradient backgrounds.",
      themeKeys: Array.from(GRADIENT_THEME_KEYS),
    },
    {
      key: "classics",
      title: "Classic & Editorial",
      description: "Sharp, premium themes for minimal, dark, editorial and portfolio looks.",
      themeKeys: ["signature-purple", "midnight", "floating-studio", "creative-paper"],
    },
    {
      key: "animated",
      title: "Animated Themes",
      description: "Motion-led themes for creators who want extra energy.",
      themeKeys: DEFAULT_THEME_LIST.filter((item) => item.isAnimated || item.group === "animated").map((item) => item.key),
    },
  ];

export default function DashboardThemesPage() {
  const { profile, socials, series, totalAudience, theme, setTheme } = useCreator();
  const { showToast } = useToast();

  // Active theme vs Interactive Preview theme
  const [previewThemeKey, setPreviewThemeKey] = useState<ThemeKey>(() => AVAILABLE_THEME_KEYS.has(theme) ? theme : DEFAULT_THEME_KEY);
  const [activeFilter, setActiveFilter] = useState<ThemeFilter>("all");
  const [isApplying, setIsApplying] = useState(false);
  const [justApplied, setJustApplied] = useState(false);

  // Theme Meta lookups
  const activeThemeMeta = useMemo(() => {
    return DEFAULT_THEME_LIST[0] || THEME_LIST[0];
  }, []);

  const previewThemeMeta = useMemo(() => {
    return THEME_LIST.find((t) => t.key === previewThemeKey) || activeThemeMeta;
  }, [previewThemeKey, activeThemeMeta]);

  const groupedThemes = useMemo(() => {
    return THEME_GROUPS
      .filter((group) => activeFilter === "all" || group.key === activeFilter)
      .map((group) => ({
        ...group,
        themes: group.themeKeys
          .map((key) => DEFAULT_THEME_LIST.find((item) => item.key === key))
          .filter((item): item is ThemeMeta => Boolean(item)),
      }))
      .filter((group) => group.themes.length > 0);
  }, [activeFilter]);

  const isPreviewDifferent = previewThemeKey !== theme;
  const canonicalUrl = buildProfileUrl(profile?.username || "creator");
  const pageBgStyle = previewThemeMeta.outerBgClass || THEME_PAGE_BACKGROUNDS[previewThemeKey] || THEME_PAGE_BACKGROUNDS["minimal-white"];

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
      setPreviewThemeKey(DEFAULT_THEME_KEY);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="w-full pb-8 text-left">
      {/* 2-COLUMN SPLIT LAYOUT: Appearance + Themes on Left | Sticky Profile Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">

        {/* LEFT COLUMN: APPEARANCE & THEMES (6 cols on lg, 5 cols on xl) */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-3.5">
          {/* Header: Themes title */}
          <div className="flex flex-col gap-2.5">
            <div className="space-y-0.5">
              <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#043084]">
                Themes
              </h1>
              <p className="max-w-xl text-xs sm:text-[13px] text-[#475569] font-medium">
                Choose the look of your public profile. Preview first, then apply when it feels right.
              </p>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {THEME_FILTERS.map((filter) => {
                const isSelected = activeFilter === filter.key;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setActiveFilter(filter.key)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${isSelected
                      ? "border-[#043084] bg-[#043084] text-white shadow-xs"
                      : "border-[#dbe3ee] bg-white text-[#64748b] hover:border-[#043084]/30 hover:bg-[#f8fafc] hover:text-[#043084]"
                      }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grouped Theme List */}
          <div className="space-y-4">
            {groupedThemes.map((group) => (
              <section key={group.key} className="space-y-2">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold tracking-tight text-[#043084]">
                      {group.title}
                    </h2>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[#64748b]">
                      {group.description}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-[#e2e8f0] bg-white px-2 py-0.5 text-[10px] font-bold text-[#64748b]">
                    {group.themes.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {group.themes.map((t) => {
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
              </section>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: STICKY PROFILE PREVIEW (6 cols on lg, 7 cols on xl) */}
        <div className="lg:col-span-6 xl:col-span-6 lg:sticky lg:top-6 space-y-4">
          {/* Header: Profile preview title + Action Controls aligned at top */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-h-[46px]">
            <div className="space-y-0.5">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#043084] leading-tight">
                Profile preview
              </h2>
              <p className="text-xs sm:text-[13px] text-[#475569] font-normal">
                {isPreviewDifferent ? (
                  <span>
                    Previewing: <strong className="text-[#043084] font-semibold">{previewThemeMeta.name}</strong>
                  </span>
                ) : (
                  <span>
                    Active theme: <strong className="text-[#043084] font-semibold">{previewThemeMeta.name}</strong>
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {isPreviewDifferent && (
                <>
                  <button
                    type="button"
                    onClick={handleApplyTheme}
                    disabled={isApplying}
                    className="h-9 px-3.5 rounded-lg bg-[#043084] hover:bg-brand-hover text-white text-xs font-semibold transition-all hover:-translate-y-0.5 cursor-pointer shadow-xs hover:shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
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
                className="h-9 px-3 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-[#043084] text-xs font-semibold transition-all hover:-translate-y-0.5 cursor-pointer shadow-xs hover:shadow-sm inline-flex items-center gap-1.5"
                title="View public profile in new tab"
              >
                <span>View Profile</span>
                <ExternalLink className="h-3.5 w-3.5 text-[#64748b]" />
              </a>
            </div>
          </div>

          {/* Clean Phone Mockup Frame (Expanded width & height, redundant outer container removed) */}
          <div className="w-full flex justify-center pt-1">
            <div className="w-full max-w-[450px] sm:max-w-[470px] xl:max-w-[490px] rounded-[38px] border-[6px] border-[#043084] bg-black shadow-2xl overflow-hidden relative">
              {/* Phone Top Notch/Island */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-4 w-28 bg-[#043084] rounded-full z-30 pointer-events-none" />

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
  const [bg, accent, text] = theme.swatch || ["#7c3aed", "#ede9fe", "#043084"];
  const isThemeAnimated = Boolean(theme.isAnimated || theme.group === "animated");
  const subtitle = THEME_SUBTITLES[theme.key] || theme.tag || (theme.mode === "dark" ? "Bold & Dark" : "Clean & Light");
  const hasImageBackground = Boolean(theme.outerBgClass?.includes("theme-bg-"));
  const thumbnailBackground = hasImageBackground
    ? undefined
    : theme.colors.profileBackground.includes("gradient")
      ? theme.colors.profileBackground
      : `linear-gradient(135deg, ${theme.colors.pageBackground} 0%, ${bg} 48%, ${accent} 100%)`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col justify-between w-full rounded-xl border p-2 text-left transition-all duration-200 cursor-pointer shadow-xs hover:-translate-y-0.5 hover:shadow-md ${isPreviewing
        ? "border-[#043084] ring-2 ring-[#043084]/20 bg-[#043084]/[0.03]"
        : isActive
          ? "border-[#17845B]/40 ring-1 ring-[#17845B]/20 bg-white"
          : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1] hover:shadow-sm"
        }`}
    >
      {/* Visual Thumbnail: theme background only */}
      <div
        className={`relative w-full h-28 rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-[1.01] ${hasImageBackground ? theme.outerBgClass : ""}`}
        style={{ background: thumbnailBackground }}
      >
        {hasImageBackground && (
          <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-black/24 pointer-events-none" />
        )}

        {isThemeAnimated && (
          <div className="absolute inset-0 opacity-70 pointer-events-none">
            <AmbientAnimation
              type={theme.animation?.type || theme.animationType}
              colors={theme.animation?.colors || theme.particleColors}
              themeKey={theme.key}
              contained={true}
            />
          </div>
        )}
      </div>

      {/* Card Info Footer */}
      <div className="pt-2.5 px-1 pb-0.5 flex items-center justify-between gap-2 w-full">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] sm:text-sm font-bold text-[#043084] leading-tight">
            {theme.name}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-[#64748b] font-medium">
            {subtitle}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {isThemeAnimated && (
            <span className="inline-flex items-center rounded-full bg-[#043084]/[0.08] px-1.5 py-1 text-[#043084]">
              <Sparkles className="h-3 w-3" />
            </span>
          )}
          {isActive && (
            <span className="inline-flex items-center rounded-full bg-[#EAF7F0] px-1.5 py-1 text-[#17845B]">
              <Check className="h-3 w-3 stroke-[3]" />
            </span>
          )}
          <span className="h-2.5 w-2.5 rounded-full border border-white shadow-xs" style={{ backgroundColor: bg }} />
          <span className="h-2.5 w-2.5 rounded-full border border-white shadow-xs" style={{ backgroundColor: accent }} />
          <span className="h-2.5 w-2.5 rounded-full border border-white shadow-xs" style={{ backgroundColor: text }} />
        </div>
      </div>
    </button>
  );
}
