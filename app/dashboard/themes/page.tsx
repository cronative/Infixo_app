"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ExternalLink,
  Loader2,
  Lock,
  Settings,
  X,
} from "lucide-react";
import { canUseThemeGroup } from "@/config/plans";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { THEME_LIST, ThemeService, resolveThemeKey } from "@/services/ThemeService";
import { AmbientAnimation } from "@/components/theme/AmbientAnimation";
import { FocusOverlay } from "@/components/theme/FocusOverlay";
import { getPublicTheme } from "@/components/public/publicTheme";
import { THEME_GROUPS, getThemeDefinition, listThemes, themeTokenStyle, type ThemeGroup } from "@/themes/config";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { ThemeKey, ThemeMeta } from "@/types";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PAGE_COPY } from "@/components/dashboard/pageCopy";
import { ThemeBackgroundAnim } from "@/components/theme/ThemeBackgroundAnim";
import { isSetupStepDone, markSetupStep } from "@/lib/setupProgress";
import { VisibilitySettingsModal } from "@/components/shared/VisibilitySettingsModal";
import { DEFAULT_VISIBILITY_SETTINGS, type CreatorProduct, type VisibilitySettings } from "@/types";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { ProductService } from "@/services/ProductService";
import { getPlanQuota } from "@/services/subscriptionLimits";

type GroupFilter = "all" | ThemeGroup;

const GROUP_FILTERS: { id: GroupFilter; label: string }[] = [
  { id: "all", label: "All" },
  ...THEME_GROUPS.map((group) => ({ id: group.id, label: group.title })),
];

/** Photo themes stay hidden until their image actually loads (missing files never show as broken cards). */
function useLoadedPlaceImages() {
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  useEffect(() => {
    let cancelled = false;
    for (const theme of listThemes()) {
      const src = theme.listing.image;
      if (!src) continue;
      const img = new window.Image();
      img.onload = () => { if (!cancelled) setLoaded((prev) => new Set(prev).add(theme.id)); };
      img.src = src;
    }
    return () => { cancelled = true; };
  }, []);
  return loaded;
}

/**
 * The public profile exactly as the live page renders it (same layers as CreatorPublicShell),
 * contained in a box instead of the viewport: theme background edge to edge behind the centre card,
 * which sits 20px from the left, right and top. Content scrolls inside the card; the background stays put.
 */
/** Every section of the public page (links, shop, packages, reviews, setup, team), loaded once for the preview. */
interface PreviewData {
  products: CreatorProduct[];
  customLinks: any[];
  mediaKitPackages: any[];
  reviews: any[];
  brands: any[];
  setupItems: any[];
  team: { members: any[] };
}

function ProfilePreview({
  themeKey,
  data,
  visibilitySettings,
  className = "",
}: {
  themeKey: ThemeKey;
  data: PreviewData;
  visibilitySettings: VisibilitySettings;
  className?: string;
}) {
  const { profile, socials, series, totalAudience } = useCreator();
  const t = getPublicTheme(themeKey);
  const { meta } = t;

  return (
    <div
      style={{ ...themeTokenStyle(themeKey), background: "var(--page-bg)", transform: "translateZ(0)" }}
      className={`relative min-h-0 overflow-hidden rounded-[5px] border border-[#E4E4E7] transition-colors duration-300 ${className}`}
    >
      {/* translateZ(0) makes this box the containing block, so the profile's fixed elements stay inside it. */}
      <div
        aria-hidden="true"
        style={{ background: "var(--page-bg)" }}
        className={`absolute inset-0 pointer-events-none bg-cover bg-center ${t.hasPhotoBackdrop ? "theme-photo-backdrop" : ""}`}
      />
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: "var(--page-overlay)" }} />
      <ThemeBackgroundAnim name={getThemeDefinition(themeKey).tokens["--page-anim"]} />
      {meta.animation?.type !== "none" && (
        <AmbientAnimation
          type={meta.animation?.type || meta.animationType}
          colors={meta.animation?.colors || meta.particleColors}
          themeKey={themeKey}
          contained={true}
        />
      )}
      {!t.hasPhotoBackdrop && <FocusOverlay overlay={meta.focusOverlay} contained={true} />}
      <div className="relative z-10 h-full flex flex-col px-4 py-4 min-h-0">
        {/* Inner box scrolls like a phone (padding stays outside, so nothing shows above the pinned nav). */}
        <div className="flex min-h-0 flex-1 flex-col rounded-[5px] overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-h-full shrink-0 flex-col">
            <LivePreviewCard
              profile={{ ...profile, visibilitySettings }}
              socials={socials}
              series={series}
              products={data.products}
              customLinks={data.customLinks}
              mediaKitPackages={data.mediaKitPackages}
              reviews={data.reviews}
              brands={data.brands}
              setupItems={data.setupItems}
              team={data.team}
              totalAudience={totalAudience}
              themeKey={themeKey}
              variant="full"
              layoutMode="premium"
              isInformational={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardThemesPage() {
  const { theme, setTheme, subscription, profile, updateProfile, handleViewProfile, isTrialExpired } = useCreator();

  // Full public page data for the live preview (same as the old Live Preview page).
  const [previewData, setPreviewData] = useState<PreviewData>({
    products: [],
    customLinks: [],
    mediaKitPackages: [],
    reviews: [],
    brands: [],
    setupItems: [],
    team: { members: [] },
  });
  useEffect(() => {
    const controller = new AbortController();
    ProductService.list(controller.signal)
      .then((items) => {
        const quota = getPlanQuota(subscription?.planKey || "early_access");
        const list = Array.isArray(items) ? items : [];
        setPreviewData((d) => ({ ...d, products: quota.maxProducts === Infinity ? list : list.slice(0, quota.maxProducts) }));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [subscription?.planKey]);
  useEffect(() => {
    if (!profile?.username) return;
    fetch(`/api/public/profile/${encodeURIComponent(profile.username)}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((all: any) =>
        setPreviewData((d) => ({
          ...d,
          customLinks: all?.links?.data?.links || d.customLinks,
          mediaKitPackages: all?.mediakit?.data?.packages || d.mediaKitPackages,
          reviews: all?.reviews?.data?.reviews || d.reviews,
          brands: all?.brands?.data?.brands || d.brands,
          setupItems: all?.setup?.data?.items || d.setupItems,
          team: all?.team?.data?.members ? { members: all.team.data.members } : d.team,
        }))
      )
      .catch(() => {});
  }, [profile?.username]);

  // Display settings (which sections are visible), moved here from the old Live Preview page.
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [visibilitySettings, setVisibilitySettings] = useState<VisibilitySettings>(() => {
    if (profile.visibilitySettings) return profile.visibilitySettings;
    return storage.get<VisibilitySettings>(STORAGE_KEYS.visibilitySettings, DEFAULT_VISIBILITY_SETTINGS);
  });
  useEffect(() => {
    if (profile.visibilitySettings) setVisibilitySettings(profile.visibilitySettings);
  }, [profile.visibilitySettings]);
  const handleSaveVisibility = async (newSettings: VisibilitySettings, customToast?: string) => {
    setVisibilitySettings(newSettings);
    storage.set(STORAGE_KEYS.visibilitySettings, newSettings);
    updateProfile({ visibilitySettings: newSettings });
    try {
      const { ProfileService } = await import("@/services/ProfileService");
      ProfileService.saveLocal({ visibilitySettings: newSettings });
      const targetEmail = profile.email || ProfileService.getProfile().email;
      if (targetEmail || profile.username) {
        await Promise.all([
          fetch("/api/creator/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: targetEmail, username: profile.username, visibilitySettings: newSettings }),
          }),
          fetch("/api/creator/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: targetEmail || `${profile.username}@inflixo.com`, visibilitySettings: newSettings }),
          }),
        ]);
      }
      showToast(customToast || "Display preferences updated! ✨");
    } catch (e) {
      console.warn("Error saving visibility settings:", e);
    }
  };
  // Theme access per plan (config/plans.ts): locked themes can be previewed but not applied.
  const isThemeLocked = (key: ThemeKey) => !canUseThemeGroup(subscription?.planKey, getThemeDefinition(key).listing.group);
  const { showToast } = useToast();

  // Active theme is what is saved in profile/DB. previewThemeKey is what is currently shown in the phone preview.
  const [previewThemeKey, setPreviewThemeKey] = useState<ThemeKey>(() =>
    resolveThemeKey(theme)
  );
  const [isApplying, setIsApplying] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const [panelHeight, setPanelHeight] = useState<number | null>(null);

  const previewThemeMeta = useMemo(() => {
    return ThemeService.getThemeMeta(previewThemeKey);
  }, [previewThemeKey]);

  const previewDisplayName = previewThemeMeta.name;
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");
  const loadedPlaceImages = useLoadedPlaceImages();
  const groupedThemes = useMemo(() => {
    const visible = THEME_LIST.filter((t) => {
      const def = getThemeDefinition(t.key);
      return !def.listing.image || loadedPlaceImages.has(t.key);
    });
    return THEME_GROUPS
      .filter((group) => groupFilter === "all" || group.id === groupFilter)
      .map((group) => ({ ...group, themes: visible.filter((t) => getThemeDefinition(t.key).listing.group === group.id) }))
      .filter((group) => group.themes.length > 0);
  }, [groupFilter, loadedPlaceImages]);
  const isPreviewDifferent = previewThemeKey !== theme;


  // Full-screen sticky height matching viewport
  useLayoutEffect(() => {
    const measure = () => {
      const vh = typeof window !== "undefined" ? window.innerHeight : 800;
      setPanelHeight(Math.max(820, vh - 32));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Apply bar sits over the content area (the dashboard's <main>), not the sidebar.
  const [contentBox, setContentBox] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const main = panelRef.current?.closest("main") || document.querySelector("main");
    if (!main) return;
    const measure = () => {
      const rect = main.getBoundingClientRect();
      setContentBox({ left: rect.left, width: rect.width });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(main);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  // Full-screen sheet (<1024px): lock the page behind it and close on Escape.
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSheetOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  // Apply Theme: ONLY when user clicks "Apply theme"!
  const handleApplyTheme = async () => {
    if (isApplying) return;
    setIsApplying(true);
    try {
      await setTheme(previewThemeKey);
      ThemeService.setSelectedTheme(previewThemeKey, true);
      markSetupStep("theme");
      showToast(`${previewDisplayName} applied`);
    } catch {
      showToast("Could not apply theme. Please try again.", "error");
    } finally {
      setIsApplying(false);
    }
  };

  // Selecting a card ONLY updates the preview; below 1024px it opens the full-screen preview sheet.
  const handleSelectTheme = (tKey: ThemeKey) => {
    // Re-selecting the active theme (e.g. keeping the default) confirms it — no Apply step is shown for it.
    if (tKey === theme && !isThemeLocked(tKey) && !isSetupStepDone("theme")) {
      ThemeService.setSelectedTheme(tKey, true);
      markSetupStep("theme");
    }
    setPreviewThemeKey(tKey);
    if (window.matchMedia("(max-width: 1023px)").matches) setSheetOpen(true);
  };

  const statusLine = isPreviewDifferent ? (
    <>Previewing: <strong className="font-semibold text-[#C21B5C]">{previewDisplayName}</strong> · not applied</>
  ) : (
    <>Active: <strong className="font-semibold text-[#18181B]">{previewDisplayName}</strong></>
  );

  const applyButton = isThemeLocked(previewThemeKey) ? (
    <Link
      href="/dashboard/subscription#plans"
      className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#C21B5C] hover:bg-[#A3164E] text-white px-4 h-8 text-[13px] font-medium transition-colors cursor-pointer"
    >
      <Lock className="h-3.5 w-3.5" />
      <span>Upgrade to apply</span>
    </Link>
  ) : (
    <button
      type="button"
      onClick={handleApplyTheme}
      disabled={isApplying}
      className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#C21B5C] hover:bg-[#A3164E] text-white px-4 h-8 text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-50"
    >
      {isApplying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
      <span>{isApplying ? "Applying..." : "Apply theme"}</span>
    </button>
  );

  return (
    <PageContainer>
      <PageHeader
        {...PAGE_COPY.themes}
        meta={
          isTrialExpired ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-(--danger)">
              <span className="h-1.5 w-1.5 rounded-full bg-(--danger)" />
              Profile is private (trial ended)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-medium text-(--success)">
              <span className="h-1.5 w-1.5 rounded-full bg-(--success)" />
              Public profile is live
            </span>
          )
        }
        actions={
          <>
            <button type="button" onClick={() => setIsVisibilityModalOpen(true)} className="dash-btn-secondary">
              <Settings className="h-3.5 w-3.5" />
              <span>Display settings</span>
            </button>
            <button type="button" onClick={handleViewProfile} className="dash-btn-primary">
              <span>Open public profile</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </>
        }
      />

      <div className="flex items-start gap-8">
        {/* LEFT: group filter + grouped theme grid */}
        <div className={`flex-1 min-w-0 space-y-5 ${isPreviewDifferent ? "pb-28" : ""}`}>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none" role="tablist" aria-label="Theme groups">
            {GROUP_FILTERS.map((filter) => {
              const isSelected = groupFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setGroupFilter(filter.id)}
                  className={`shrink-0 h-8 rounded-[5px] border px-3 text-[13px] font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? "border-[#C21B5C] bg-[#C21B5C] text-white shadow-none"
                      : "border-[#ECECF0] bg-white text-[#6B6B76] hover:border-[#D4D4D8] hover:bg-[#FAFAFB] hover:text-[#18181B]"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {groupedThemes.map((group) => (
            <section key={group.id} className="space-y-2.5">
              <div className="space-y-0.5">
                <h2 className="text-sm sm:text-base font-bold text-[#18181B]">{group.title}</h2>
                <p className="text-xs text-[#6B6B76]">{group.subtitle}</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {group.themes.map((t) => (
                  <ThemeCard
                    key={t.key}
                    theme={t}
                    isSelected={previewThemeKey === t.key}
                    isActive={theme === t.key}
                    isLocked={isThemeLocked(t.key)}
                    onSelect={() => handleSelectTheme(t.key)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* RIGHT: sticky phone preview (hidden below 1024px; the sheet takes over) */}
        <aside
          ref={panelRef}
          aria-label="Profile preview"
          style={{ height: panelHeight ? `${panelHeight}px` : "calc(100dvh - 2rem)" }}
          className="hidden lg:flex flex-col gap-2 w-[400px] xl:w-[512px] shrink-0 sticky top-6 min-h-[820px] max-h-[1080px]"
        >
          <p className="w-full text-xs text-[#6B6B76] text-center line-clamp-2 break-words">{statusLine}</p>
          <ProfilePreview themeKey={previewThemeKey} data={previewData} visibilitySettings={visibilitySettings} className="flex-1 w-full" />
        </aside>
      </div>

      {/* <1024px: full-screen preview sheet */}
      {/* Apply bar: shown while previewing a theme that isn't active */}
      {isPreviewDifferent && contentBox && (
        <div
          className="fixed bottom-4 z-40 flex justify-center px-4 pointer-events-none"
          style={{ left: contentBox.left, width: contentBox.width }}
        >
          <div
            role="region"
            aria-label="Apply theme"
            className="pointer-events-auto w-full max-w-[560px] flex items-center justify-between gap-3 rounded-[5px] border border-[#ECECF0] bg-white px-3.5 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,.12)] animate-in fade-in slide-in-from-bottom-4 duration-200"
          >
            <p className="min-w-0 flex items-center gap-1.5 text-xs">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/10" style={{ background: getThemeDefinition(theme).listing.swatches[0] }} />
              <span className="line-clamp-2 break-words text-[#6B6B76]">{getThemeDefinition(theme).name}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#A1A1AA]" />
              <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/10" style={{ background: getThemeDefinition(previewThemeKey).listing.swatches[0] }} />
              <span className="line-clamp-2 break-words font-bold text-[#18181B]" title={previewDisplayName}>{previewDisplayName}</span>
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewThemeKey(resolveThemeKey(theme))}
                disabled={isApplying}
                className="h-8 px-3.5 rounded-[5px] border border-[#ECECF0] bg-white text-[13px] font-medium text-[#18181B] hover:bg-[#FAFAFB] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              {applyButton}
            </div>
          </div>
        </div>
      )}

      <VisibilitySettingsModal
        isOpen={isVisibilityModalOpen}
        onClose={() => setIsVisibilityModalOpen(false)}
        settings={visibilitySettings}
        onSave={handleSaveVisibility}
      />

      {sheetOpen && (
        <div role="dialog" aria-modal="true" aria-label="Theme preview" className="lg:hidden fixed inset-0 z-[1000] flex flex-col bg-[#FAFAFB]">
          <div className="flex items-center justify-between gap-3 border-b border-[#ECECF0] bg-white px-4 py-3">
            <p className="min-w-0 text-xs text-[#6B6B76] line-clamp-2 break-words">{statusLine}</p>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              aria-label="Close preview"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] text-[#6B6B76] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 min-h-0 flex flex-col items-center p-4">
            <ProfilePreview themeKey={previewThemeKey} data={previewData} visibilitySettings={visibilitySettings} className="flex-1 w-full max-w-[512px]" />
          </div>
          {isPreviewDifferent && (
            <div className="border-t border-[#ECECF0] bg-white px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] flex justify-center [&>button]:w-full [&>button]:justify-center">
              {applyButton}
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}

/* ==========================================================================
   THEME CARD COMPONENT (5px Border Radius, Custom Thumbnails & Swatches)
   ========================================================================== */
interface ThemeCardProps {
  theme: ThemeMeta;
  isSelected: boolean;
  isActive: boolean;
  isLocked?: boolean;
  onSelect: () => void;
}

function ThemeCard({
  theme,
  isSelected,
  isActive,
  isLocked = false,
  onSelect,
}: ThemeCardProps) {
  const definition = getThemeDefinition(theme.key);
  const listing = definition.listing;
  const pageAnim = definition.tokens["--page-anim"];
  // Animated themes: the thumbnail plays a mini version on hover only (static otherwise).
  const [hovered, setHovered] = useState(false);
  const displayName = theme.name;
  const subtitle = listing.subtitle;
  const swatches = listing.swatches;

  // Determine thumbnail background style: custom image, custom thumbnail gradient, or fallback
  // Thumbnail: the theme's page background (the photo for India Places themes).
  const thumbnailStyle = { background: listing.thumbnail };

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className={`group relative flex flex-col justify-between w-full rounded-[5px] border p-2 text-left transition-all duration-200 cursor-pointer shadow-none ${
        isSelected
          ? "border-2 border-[#C21B5C] bg-white"
          : "border-[#ECECF0] bg-white hover:border-[#D4D4D8]"
      }`}
    >
      {/* Visual Thumbnail */}
      <div
        className="relative w-full h-32 sm:h-34 rounded-[5px] overflow-hidden transition-transform duration-300 group-hover:scale-[1.01]"
        style={thumbnailStyle}
      >
        {/* If selected (previewing), show circular maroon checkmark badge in top-right */}
        {isSelected && (
          <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#C21B5C] text-white shadow-none z-10">
            <Check className="h-3.5 w-3.5 stroke-[3]" />
          </div>
        )}

        {pageAnim !== "none" && <ThemeBackgroundAnim name={pageAnim} mini playing={hovered} />}

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
              className={`line-clamp-2 break-words text-sm font-bold ${
                isSelected ? "text-[#C21B5C]" : "text-[#18181B]"
              } leading-tight`}
            >
              {displayName}
            </p>
            {isActive && (
              <span className="shrink-0 inline-flex items-center rounded-[3px] bg-[#ecfdf5] border border-[#a7f3d0] px-1.5 py-0.2 text-[10px] font-bold text-[#059669]">
                Active
              </span>
            )}
            {isLocked && !isActive && (
              <span className="shrink-0 inline-flex items-center gap-0.5 rounded-[3px] bg-[#FFF5F7] border border-[#FFEDE6] px-1.5 py-0.2 text-[10px] font-bold text-[#C21B5C]" title="Available on Pro and VIP">
                <Lock className="h-2.5 w-2.5" />
                Pro
              </span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 break-words text-xs text-[#6B6B76] font-medium leading-tight">
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
