"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Settings,
  ExternalLink,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { ThemeCard } from "@/themes/registry";
import { THEME_PAGE_BACKGROUNDS, THEME_LIST } from "@/services/ThemeService";
import { AmbientAnimation } from "@/components/theme/AmbientAnimation";
import { FocusOverlay } from "@/components/theme/FocusOverlay";
import { VisibilitySettingsModal } from "@/components/shared/VisibilitySettingsModal";
import { VisibilitySettings, DEFAULT_VISIBILITY_SETTINGS } from "@/types";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { useToast } from "@/contexts/ToastContext";
import { ProductService } from "@/services/ProductService";
import { getPlanQuota } from "@/services/subscriptionLimits";
import type { CreatorProduct } from "@/types";
import { buildProfileUrl } from "@/utils/format";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DEFAULT_THEME_KEY } from "@/lib/themeKeys";
import { getThemeDefinition, themeTokenStyle } from "@/themes/config";
import { ThemeBackgroundAnim } from "@/components/theme/ThemeBackgroundAnim";

export default function DashboardPreviewPage() {
  const { profile, socials, series, totalAudience, theme, updateProfile, subscription, handleViewProfile, isTrialExpired } = useCreator();
  const { showToast } = useToast();

  const [products, setProducts] = useState<CreatorProduct[]>([]);
  const [productRefresh, setProductRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    ProductService.list(controller.signal).then(setProducts).catch(() => {});
    return () => controller.abort();
  }, [productRefresh]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);

  const [visibilitySettings, setVisibilitySettings] = useState<VisibilitySettings>(() => {
    if (profile.visibilitySettings) return profile.visibilitySettings;
    return storage.get<VisibilitySettings>(STORAGE_KEYS.visibilitySettings, DEFAULT_VISIBILITY_SETTINGS);
  });

  useEffect(() => {
    if (profile.visibilitySettings) {
      setVisibilitySettings(profile.visibilitySettings);
    }
  }, [profile.visibilitySettings]);

  const activeThemeMeta = useMemo(() => {
    return THEME_LIST.find((t) => t.key === theme) || THEME_LIST[0];
  }, [theme]);

  const pageBgStyle = activeThemeMeta.outerBgClass || THEME_PAGE_BACKGROUNDS[theme] || THEME_PAGE_BACKGROUNDS[DEFAULT_THEME_KEY];

  const rawUsername = profile?.username || "creator";
  const canonicalUrl = buildProfileUrl(rawUsername);

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

  const handleRefresh = () => {
    setIsRefreshing(true);
    setProductRefresh((value) => value + 1);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("Preview updated! 🔄");
    }, 400);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Live Preview"
        subtitle="See exactly how your public creator profile appears to visitors."
        actions={
          <>
            {isTrialExpired ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 h-9 rounded-[5px] border border-rose-200">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                Profile is private (Trial ended)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#17845B] bg-[#EAF7F0] px-2.5 h-9 rounded-[5px] border border-[#17845B]/20">
                <span className="h-1.5 w-1.5 rounded-full bg-[#17845B]" />
                Public profile is live
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsVisibilityModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] h-9 px-3.5 text-xs font-semibold text-[#7A2253] transition-all cursor-pointer shadow-2xs"
            >
              <Settings className="h-3.5 w-3.5 text-[#7A2253]" />
              <span>Display Settings</span>
            </button>
            <button
              type="button"
              onClick={handleViewProfile}
              className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#7A2253] hover:bg-[#681c46] h-9 px-4 text-xs font-bold text-white transition-all cursor-pointer shadow-2xs"
            >
              <span>Open Public Profile</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </>
        }
      />

      {/* 2. COMPACT PREVIEW TOOLBAR */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2 shadow-xs">
        {/* Left: Active Theme Info */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A2253] bg-[#7A2253]/[0.09] border border-[#7A2253]/20 px-2.5 py-1 rounded-lg">
            <Sparkles className="h-3.5 w-3.5 text-[#7A2253]" />
            <span>Active theme: {activeThemeMeta.name}</span>
          </span>
        </div>

        {/* Right: Refresh Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748b] hover:text-[#7A2253] px-2.5 py-1 rounded-lg hover:bg-[#f1f5f9] border border-transparent hover:border-brand-border transition-colors cursor-pointer"
            title="Refresh preview canvas"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-[#7A2253]" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 3. FULL SCREEN / FULL WIDTH PREVIEW CANVAS */}
      <div className="rounded-xl border border-[#e2e8f0] overflow-hidden shadow-xs">
        <div
          style={{ ...themeTokenStyle(activeThemeMeta.key), background: "var(--page-bg)" }}
          className={`relative overflow-hidden w-full px-5 py-3 sm:py-6 md:py-8 transition-colors duration-300 ${pageBgStyle}`}
        >
          {/* Theme background animation (--page-anim), behind the card */}
          <ThemeBackgroundAnim name={getThemeDefinition(activeThemeMeta.key).tokens["--page-anim"]} />

          {/* Ambient Background Animation in Live Preview */}
          <AmbientAnimation
            type={activeThemeMeta.animation?.type || activeThemeMeta.animationType}
            colors={activeThemeMeta.animation?.colors || activeThemeMeta.particleColors}
            themeKey={theme}
            contained={true}
          />

          {/* Theme-aware Focus Overlay */}
          <FocusOverlay overlay={activeThemeMeta.focusOverlay} contained={true} />

          <div className="relative z-10 w-full max-w-[620px] mx-auto flex flex-col min-h-full">
            {(() => {
              const quota = getPlanQuota(subscription?.planKey || "early_access");
              const visibleProducts =
                quota.maxProducts === Infinity
                  ? products
                  : products.slice(0, quota.maxProducts);
              return (
                <ThemeCard
                  themeKey={theme}
                  profile={{ ...profile, visibilitySettings }}
                  socials={socials}
                  series={series}
                  products={visibleProducts}
                  totalAudience={totalAudience}
                  variant="full"
                />
              );
            })()}
          </div>
        </div>
      </div>

      {/* 4. VISIBILITY SETTINGS MODAL */}
      <VisibilitySettingsModal
        isOpen={isVisibilityModalOpen}
        onClose={() => setIsVisibilityModalOpen(false)}
        settings={visibilitySettings}
        onSave={handleSaveVisibility}
      />
    </PageContainer>
  );
}
