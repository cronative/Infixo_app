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
import { PAGE_COPY } from "@/components/dashboard/pageCopy";
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
        {...PAGE_COPY.preview}
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

      {/* 2. COMPACT PREVIEW TOOLBAR */}
      <div className="flex items-center justify-between gap-3 rounded-[5px] border border-[#ECECF0] bg-white px-3.5 py-2 shadow-none">
        {/* Left: Active Theme Info */}
        <div className="flex items-center gap-2">
          <span className="h-6 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#7A2253] bg-[#F7EEF2] px-2 rounded-[5px]">
            <Sparkles className="h-3.5 w-3.5 text-[#7A2253]" />
            <span>Active theme: {activeThemeMeta.name}</span>
          </span>
        </div>

        {/* Right: Refresh Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex h-8 items-center gap-1.5 text-[13px] font-medium text-[#18181B] px-3 rounded-[5px] bg-white hover:bg-[#FAFAFB] border border-[#ECECF0] transition-colors cursor-pointer"
            title="Refresh preview canvas"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-[#7A2253]" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 3. FULL SCREEN / FULL WIDTH PREVIEW CANVAS */}
      <div className="rounded-[5px] border border-[#ECECF0] overflow-hidden shadow-none">
        <div
          style={{ ...themeTokenStyle(activeThemeMeta.key), background: "var(--page-bg)", transform: "translateZ(0)" }}
          className={`relative overflow-hidden w-full min-h-[880px] lg:min-h-[940px] xl:min-h-[980px] h-[max(920px,calc(100dvh-120px))] px-5 py-[20px] transition-colors duration-300 ${pageBgStyle}`}
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

          {/* Fixed card height: the panel minus 20px top/bottom; strictly identical height across all tabs */}
          <div className="relative z-10 w-full max-w-[620px] mx-auto flex flex-col h-full min-h-0">
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
                  containedScroll={true}
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
