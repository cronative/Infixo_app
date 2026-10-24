"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Check,
  ExternalLink,
  Sparkles,
  Loader2,
  Smartphone,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { THEME_LIST, ThemeService } from "@/services/ThemeService";
import { AmbientAnimation } from "@/components/theme/AmbientAnimation";
import { FocusOverlay } from "@/components/theme/FocusOverlay";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { ThemeKey, ThemeMeta } from "@/types";

interface CustomThemeMeta {
  name?: string;
  subtitle: string;
  swatches?: [string, string, string];
  thumbnailBg?: string;
  imageUrl?: string;
}

const THEME_CUSTOM_META: Record<string, CustomThemeMeta> = {
  "minimal-white": {
    name: "Minimal White",
    subtitle: "Clean & Minimal",
    swatches: ["#7A2253", "#9D174D", "#FBCFE8"],
    thumbnailBg: "linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 35%, #F4ACB7 72%, #831843 100%)",
  },
  "sage-studio": {
    name: "Sage Studio",
    subtitle: "Warm Editorial",
    swatches: ["#254334", "#4D5A47", "#D97706"],
    thumbnailBg: "linear-gradient(135deg, #EBE8DC 0%, #D8DEC9 45%, #465E4C 100%)",
  },
  "blush-paper": {
    name: "Blush Paper",
    subtitle: "Soft Creator",
    swatches: ["#F472B6", "#FB7185", "#FDA4AF"],
    thumbnailBg: "linear-gradient(135deg, #FFECEF 0%, #F8CDD4 45%, #CC8290 100%)",
  },
  "studio-frost": {
    name: "Studio Frost",
    subtitle: "Premium Frosted",
    swatches: ["#7A2253", "#818CF8", "#C7D2FE"],
    thumbnailBg: "linear-gradient(180deg, #FFFFFF 0%, #F5F9FD 50%, #E0EDF8 100%)",
  },
  "goa-beach": {
    name: "Goa Beach",
    subtitle: "Tropical & Vibrant",
    swatches: ["#0D9488", "#38BDF8", "#F59E0B"],
    imageUrl: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop&q=80",
  },
  "taj-mahal": {
    name: "Taj Mahal",
    subtitle: "Indian Heritage",
    swatches: ["#7A2253", "#991B1B", "#D97706"],
    imageUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&auto=format&fit=crop&q=80",
  },
  "marine-drive": {
    name: "Marine Drive",
    subtitle: "Mumbai Sea",
    swatches: ["#0F172A", "#38BDF8", "#BAE6FD"],
    imageUrl: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&auto=format&fit=crop&q=80",
  },
  "mountain-mist": {
    name: "Himalaya",
    subtitle: "Nature & Peace",
    swatches: ["#0F172A", "#64748B", "#CBD5E1"],
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80",
  },
  "neon-reels": {
    name: "Neon Creator",
    subtitle: "Modern & Bold",
    swatches: ["#EC4899", "#A855F7", "#C084FC"],
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
  },
  "midnight": {
    name: "Dark Studio",
    subtitle: "Professional",
    swatches: ["#DC2626", "#7F1D1D", "#CBD5E1"],
    thumbnailBg: "radial-gradient(ellipse 110% 90% at 85% 95%, #EF4444 0%, #991B1B 25%, #18181B 55%, #09090B 100%)",
  },
  "creator-studio": {
    name: "Grain Film",
    subtitle: "Cinematic",
    swatches: ["#78350F", "#B45309", "#FDE68A"],
    imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
  },
  "aurora-gradient": {
    name: "Color Pop",
    subtitle: "Creative & Fun",
    swatches: ["#EC4899", "#A855F7", "#818CF8"],
    thumbnailBg: "linear-gradient(135deg, #F43F5E 0%, #EC4899 30%, #8B5CF6 65%, #3B82F6 100%)",
  },
  "burj-khalifa": {
    name: "Burj Khalifa",
    subtitle: "Dubai Luxury",
    swatches: ["#0F172A", "#F59E0B", "#FDE68A"],
    imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=80",
  },
  "somnath-temple": {
    name: "Somnath Temple",
    subtitle: "Gujarat Heritage",
    swatches: ["#9A3412", "#EA580C", "#FED7AA"],
    imageUrl: "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=800&auto=format&fit=crop&q=80",
  },
  "dwarka-temple": {
    name: "Dwarka Temple",
    subtitle: "Devbhumi Gujarat",
    swatches: ["#B45309", "#D97706", "#FEF08A"],
    imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80",
  },
  "podcast-lounge": {
    name: "Podcast Lounge",
    subtitle: "Podcasts & Interviews",
    swatches: ["#1E1B4B", "#4338CA", "#A5B4FC"],
    thumbnailBg: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #4338CA 100%)",
  },
  "gamer-stream": {
    name: "Gamer Stream",
    subtitle: "Gaming & Live",
    swatches: ["#064E3B", "#10B981", "#6EE7B7"],
    thumbnailBg: "linear-gradient(135deg, #022C22 0%, #064E3B 50%, #10B981 100%)",
  },
  "food-vlog": {
    name: "Food Vlog",
    subtitle: "Food & Travel",
    swatches: ["#991B1B", "#EF4444", "#FCA5A5"],
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80",
  },
  "love-letter": {
    name: "Love Letter",
    subtitle: "Love & Lifestyle",
    swatches: ["#BE123C", "#FB7185", "#FFE4E6"],
    imageUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80",
  },
  "christmas-snow": {
    name: "Christmas Snow",
    subtitle: "Festive Holiday",
    swatches: ["#14532D", "#DC2626", "#F3F4F6"],
    imageUrl: "https://images.unsplash.com/photo-1543258103-a62bd96b300b?w=800&auto=format&fit=crop&q=80",
  },
  "sunrise-pop": {
    name: "Sunrise Pop",
    subtitle: "Warm Gradient",
    swatches: ["#EA580C", "#F59E0B", "#FDE047"],
    thumbnailBg: "linear-gradient(135deg, #EA580C 0%, #F59E0B 50%, #FDE047 100%)",
  },
  "candy-flow": {
    name: "Candy Flow",
    subtitle: "Soft Gradient",
    swatches: ["#DB2777", "#F472B6", "#FBCFE8"],
    thumbnailBg: "linear-gradient(135deg, #DB2777 0%, #F472B6 50%, #FBCFE8 100%)",
  },
  "mint-wave": {
    name: "Mint Wave",
    subtitle: "Fresh Gradient",
    swatches: ["#0D9488", "#2DD4BF", "#99F6E4"],
    thumbnailBg: "linear-gradient(135deg, #0D9488 0%, #2DD4BF 50%, #99F6E4 100%)",
  },
  "royal-glow": {
    name: "Royal Glow",
    subtitle: "Premium Gradient",
    swatches: ["#4C1D95", "#8B5CF6", "#FCD34D"],
    thumbnailBg: "linear-gradient(135deg, #4C1D95 0%, #8B5CF6 50%, #FCD34D 100%)",
  },
  "signature-purple": {
    name: "Signature Purple",
    subtitle: "Inflixo Signature",
    swatches: ["#7A2253", "#9D174D", "#FCE7F3"],
    thumbnailBg: "linear-gradient(135deg, #7A2253 0%, #9D174D 50%, #FCE7F3 100%)",
  },
  "floating-studio": {
    name: "Floating Studio",
    subtitle: "Clean Editorial",
    swatches: ["#1E293B", "#64748B", "#F1F5F9"],
    thumbnailBg: "linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 50%, #94A3B8 100%)",
  },
  "creative-paper": {
    name: "Creative Paper",
    subtitle: "Textured Minimal",
    swatches: ["#78350F", "#B45309", "#FEF3C7"],
    thumbnailBg: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 50%, #D97706 100%)",
  },
  "spotlight-stage": {
    name: "Spotlight Stage",
    subtitle: "Dramatic & Bold",
    swatches: ["#0F172A", "#D97706", "#FDE68A"],
    thumbnailBg: "radial-gradient(circle at 50% 30%, #D97706 0%, #1E1B4B 60%, #0F172A 100%)",
  },
};

const DEFAULT_THEME_KEY: ThemeKey = "minimal-white";
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
    themeKeys: ["goa-beach", "taj-mahal", "marine-drive", "mountain-mist", "burj-khalifa", "somnath-temple", "dwarka-temple"],
  },
  {
    key: "creators",
    title: "Creator Themes",
    description: "Bold, expressive looks for modern creators.",
    themeKeys: ["neon-reels", "midnight", "creator-studio", "aurora-gradient", "podcast-lounge", "food-vlog", "gamer-stream"],
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
    themeKeys: ["sunrise-pop", "candy-flow", "mint-wave", "royal-glow"],
  },
  {
    key: "classics",
    title: "Classic & Editorial",
    description: "Sharp, premium themes for minimal, dark, editorial and portfolio looks.",
    themeKeys: ["signature-purple", "floating-studio", "creative-paper", "spotlight-stage"],
  },
  {
    key: "animated",
    title: "Animated Themes",
    description: "Motion-led themes for creators who want extra energy.",
    themeKeys: DEFAULT_THEME_LIST.filter((item) => item.isAnimated || item.group === "animated").map((item) => item.key),
  },
];

export default function DashboardThemesPage() {
  const { profile, socials, series, totalAudience, theme, setTheme, handleViewProfile } = useCreator();
  const { showToast } = useToast();

  // Active theme is what is saved in profile/DB. previewThemeKey is what is currently shown in the phone preview.
  const [previewThemeKey, setPreviewThemeKey] = useState<ThemeKey>(() =>
    AVAILABLE_THEME_KEYS.has(theme) ? theme : DEFAULT_THEME_KEY
  );
  const [activeFilter, setActiveFilter] = useState<ThemeFilter>("all");
  const [isApplying, setIsApplying] = useState(false);
  const [justApplied, setJustApplied] = useState(false);

  const previewThemeMeta = useMemo(() => {
    return THEME_LIST.find((t) => t.key === previewThemeKey) || DEFAULT_THEME_LIST[0] || THEME_LIST[0];
  }, [previewThemeKey]);

  const previewDisplayName = THEME_CUSTOM_META[previewThemeMeta.key]?.name || previewThemeMeta.name;
  const isPreviewDifferent = previewThemeKey !== theme;

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

  const totalThemesCount = useMemo(() => {
    return groupedThemes.reduce((acc, g) => acc + g.themes.length, 0);
  }, [groupedThemes]);

  // Apply Theme: ONLY when user clicks "Apply Theme" button!
  const handleApplyTheme = async () => {
    if (isApplying) return;
    setIsApplying(true);
    try {
      await setTheme(previewThemeKey);
      ThemeService.setSelectedTheme(previewThemeKey, true);
      setJustApplied(true);
      setTimeout(() => setJustApplied(false), 2500);
      showToast(`${previewDisplayName} theme applied to your profile! ✨`);
    } catch {
      showToast("Could not apply theme. Please try again.", "error");
    } finally {
      setIsApplying(false);
    }
  };

  // Selecting a card ONLY updates the phone preview! It does NOT apply until Apply button is clicked.
  const handleSelectTheme = (tKey: ThemeKey) => {
    setPreviewThemeKey(tKey);
  };

  const isOuterPhotoTheme = Boolean(previewThemeMeta.outerBgClass?.includes("theme-bg-"));
  const pageBgStyle = isOuterPhotoTheme
    ? previewThemeMeta.outerBgClass
    : previewThemeMeta.colors.pageBackground.includes("gradient")
      ? previewThemeMeta.colors.pageBackground
      : "";

  return (
    <div className="w-full pb-16 text-left space-y-5">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0f172a]">
              Themes &amp; Styling
            </h1>
            <span className="inline-flex items-center gap-1 rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F3] px-2.5 py-0.5 text-xs font-semibold text-[#7A2253]">
              <Sparkles className="h-3 w-3" />
              <span>{previewDisplayName}</span>
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm font-medium text-[#64748b]">
            Select any theme to preview it on the phone. Click Apply Theme to make it live on your public profile.
          </p>
        </div>

        {/* Action Controls in Top Header */}
        <div className="flex items-center gap-2 shrink-0">
          {isPreviewDifferent && (
            <button
              type="button"
              onClick={handleApplyTheme}
              disabled={isApplying}
              className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#7A2253] hover:bg-[#601b41] text-white px-3.5 py-1.5 text-xs font-semibold transition-all shadow-md shadow-[#7A2253]/20 hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
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
          )}

          <button
            type="button"
            onClick={handleViewProfile}
            className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#e2e8f0] bg-white px-3.5 py-1.5 text-xs font-bold text-[#7A2253] shadow-2xs transition-all hover:bg-[#FFF0F5] hover:border-[#FCE7F3] cursor-pointer"
          >
            <span>Live Profile</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* TWO COLUMN WORKSPACE: Left Themes Listing + Right Sticky Live Phone Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =========================================================================
            LEFT COLUMN: THEMES CATALOG (6 cols on lg)
           ========================================================================= */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-4">
          {/* Filter Pills Bar with Total Count */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-[#f1f5f9] pt-0.5">
            <div className="flex items-center gap-1.5 shrink-0">
              {THEME_FILTERS.map((filter) => {
                const isSelected = activeFilter === filter.key;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setActiveFilter(filter.key)}
                    className={`shrink-0 rounded-[5px] border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#7A2253] bg-[#7A2253] text-white shadow-xs"
                        : "border-[#e2e8f0] bg-white text-[#475569] hover:border-[#cbd5e1] hover:bg-[#f8fafc] hover:text-[#0f172a]"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
            <span className="shrink-0 text-xs font-medium text-[#64748b] ml-auto self-center pl-2">
              {totalThemesCount} themes
            </span>
          </div>

          {/* Grouped Theme Sections */}
          <div className="space-y-6">
            {groupedThemes.map((group) => (
              <section key={group.key} className="space-y-2.5">
                <div className="space-y-0.5">
                  <h2 className="text-sm sm:text-base font-bold text-[#0f172a]">
                    {group.title}
                  </h2>
                  <p className="text-xs text-[#64748b]">
                    {group.description}
                  </p>
                </div>

                {/* Grid: 1 col on mobile, 2 cols on tablet/desktop inside the column */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.themes.map((t) => {
                    const isPreviewing = previewThemeKey === t.key;
                    const isActive = theme === t.key;
                    return (
                      <ThemeCard
                        key={t.key}
                        theme={t}
                        isSelected={isPreviewing}
                        isActive={isActive}
                        onSelect={() => handleSelectTheme(t.key)}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: STICKY LIVE PROFILE PREVIEW (6 cols on lg)
           ========================================================================= */}
        <div className="lg:col-span-6 xl:col-span-6 lg:sticky lg:top-4 space-y-3">
          {/* Header above Phone Mockup: Preview Status + Apply Theme Button */}
          <div className="flex items-center justify-between gap-3 min-h-[42px] border-b border-[#e2e8f0] pb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-[#7A2253]" />
                <h3 className="text-sm font-bold text-[#0f172a]">
                  Profile Preview
                </h3>
              </div>
              <p className="text-xs text-[#64748b]">
                {isPreviewDifferent ? (
                  <span>
                    Previewing: <strong className="text-[#7A2253] font-semibold">{previewDisplayName}</strong> (unsaved)
                  </span>
                ) : (
                  <span>
                    Active theme: <strong className="text-[#10b981] font-semibold">{previewDisplayName}</strong>
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isPreviewDifferent && (
                <button
                  type="button"
                  onClick={handleApplyTheme}
                  disabled={isApplying}
                  className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#7A2253] hover:bg-[#601b41] text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-md shadow-[#7A2253]/25 hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
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
              )}

              <button
                type="button"
                onClick={handleViewProfile}
                className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-semibold text-[#7A2253] shadow-2xs transition-all hover:bg-[#FFF0F5] hover:border-[#FCE7F3] cursor-pointer"
                title="View live public profile"
              >
                <span>Live View</span>
                <ExternalLink className="h-3.5 w-3.5 text-[#64748b]" />
              </button>
            </div>
          </div>

          {/* Phone Mockup Frame */}
          <div className="w-full flex justify-center pt-1">
            <div className="w-full max-w-[390px] sm:max-w-[420px] rounded-[38px] border-[6px] border-[#7A2253] bg-black shadow-2xl overflow-hidden relative">
              {/* Phone Top Notch/Island */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-4 w-28 bg-[#7A2253] rounded-full z-30 pointer-events-none" />

              {/* Scrollable Viewport inside phone */}
              <div
                style={{ backgroundColor: previewThemeMeta.colors.pageBackground }}
                className={`relative w-full h-[620px] lg:h-[670px] xl:h-[720px] overflow-y-auto overflow-x-hidden scrollbar-thin transition-colors duration-300 px-1 sm:px-1.5 pt-6 pb-6 ${pageBgStyle}`}
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

      {/* Floating Bottom Bar (visible on Mobile or when scrolling if preview is different) */}
      {isPreviewDifferent && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 sm:gap-3 rounded-[5px] border border-[#7A2253]/30 bg-white/95 px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs text-[#64748b]">Previewing:</span>
            <span className="text-xs font-bold text-[#7A2253] max-w-[130px] truncate sm:max-w-none">
              {previewDisplayName}
            </span>
          </div>

          <div className="h-4 w-px bg-[#e2e8f0]" />

          <button
            type="button"
            onClick={handleApplyTheme}
            disabled={isApplying}
            className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#7A2253] px-3.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-[#601b41] cursor-pointer"
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
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   THEME CARD COMPONENT (5px Border Radius, Custom Thumbnails & Swatches)
   ========================================================================== */
interface ThemeCardProps {
  theme: ThemeMeta;
  isSelected: boolean;
  isActive: boolean;
  onSelect: () => void;
}

function ThemeCard({
  theme,
  isSelected,
  isActive,
  onSelect,
}: ThemeCardProps) {
  const customMeta = THEME_CUSTOM_META[theme.key];
  const displayName = customMeta?.name || theme.name;
  const subtitle = customMeta?.subtitle || theme.tag || "Clean & Light";
  const swatches = customMeta?.swatches || theme.swatch || ["#7A2253", "#CBD5E1", "#F1F5F9"];

  // Determine thumbnail background style: custom image, custom thumbnail gradient, or fallback
  const thumbnailStyle = useMemo(() => {
    if (customMeta?.imageUrl) {
      return {
        backgroundImage: `url(${customMeta.imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    if (customMeta?.thumbnailBg) {
      return {
        background: customMeta.thumbnailBg,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    if (theme.colors.profileBackground.includes("gradient")) {
      return {
        background: theme.colors.profileBackground,
      };
    }
    return {
      background: `linear-gradient(135deg, ${theme.colors.pageBackground} 0%, ${swatches[0]} 48%, ${swatches[1]} 100%)`,
    };
  }, [customMeta, theme, swatches]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col justify-between w-full rounded-[5px] border p-2 text-left transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md ${
        isSelected
          ? "border-[#7A2253] ring-1.5 ring-[#7A2253] bg-white"
          : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
      }`}
    >
      {/* Visual Thumbnail */}
      <div
        className="relative w-full h-32 sm:h-34 rounded-[5px] overflow-hidden transition-transform duration-300 group-hover:scale-[1.01]"
        style={thumbnailStyle}
      >
        {/* If selected (previewing), show circular maroon checkmark badge in top-right */}
        {isSelected && (
          <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#7A2253] text-white shadow-md z-10">
            <Check className="h-3.5 w-3.5 stroke-[3]" />
          </div>
        )}

        {theme.isAnimated && (
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
          <div className="flex items-center gap-1.5">
            <p
              className={`truncate text-sm font-bold ${
                isSelected ? "text-[#7A2253]" : "text-[#0f172a]"
              } leading-tight`}
            >
              {displayName}
            </p>
            {isActive && (
              <span className="shrink-0 inline-flex items-center rounded-[3px] bg-[#ecfdf5] border border-[#a7f3d0] px-1.5 py-0.2 text-[10px] font-bold text-[#059669]">
                Active
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-[#64748b] font-medium leading-tight">
            {subtitle}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full border border-black/10 shadow-2xs"
            style={{ backgroundColor: swatches[0] }}
          />
          <span
            className="h-2.5 w-2.5 rounded-full border border-black/10 shadow-2xs"
            style={{ backgroundColor: swatches[1] }}
          />
          <span
            className="h-2.5 w-2.5 rounded-full border border-black/10 shadow-2xs"
            style={{ backgroundColor: swatches[2] }}
          />
        </div>
      </div>
    </button>
  );
}
