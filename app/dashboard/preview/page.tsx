"use client";

import { useState, useMemo } from "react";
import {
  Settings,
  Eye,
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
import { buildProfileUrl } from "@/utils/format";

export default function DashboardPreviewPage() {
  const { profile, socials, series, totalAudience, theme } = useCreator();
  const { showToast } = useToast();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);

  const [visibilitySettings, setVisibilitySettings] = useState<VisibilitySettings>(() => {
    if (profile.visibilitySettings) return profile.visibilitySettings;
    return storage.get<VisibilitySettings>(STORAGE_KEYS.visibilitySettings, DEFAULT_VISIBILITY_SETTINGS);
  });

  const activeThemeMeta = useMemo(() => {
    return THEME_LIST.find((t) => t.key === theme) || THEME_LIST[0];
  }, [theme]);

  const pageBgStyle = activeThemeMeta.outerBgClass || THEME_PAGE_BACKGROUNDS[theme] || THEME_PAGE_BACKGROUNDS["minimal-white"];

  const rawUsername = profile?.username || "creator";
  const canonicalUrl = buildProfileUrl(rawUsername);

  const handleSaveVisibility = async (newSettings: VisibilitySettings) => {
    setVisibilitySettings(newSettings);
    storage.set(STORAGE_KEYS.visibilitySettings, newSettings);
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
      showToast("Display preferences updated! ✨");
    } catch (e) {
      console.warn("Error saving visibility settings:", e);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("Preview updated! 🔄");
    }, 400);
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12 text-left">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#181716] tracking-tight">
              Profile Preview
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#17845B] bg-[#EAF7F0] px-2.5 py-0.5 rounded-full border border-[#17845B]/20">
              <span className="h-1.5 w-1.5 rounded-full bg-[#17845B]" />
              Public profile is live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#797570] font-medium mt-1">
            See exactly how your public creator profile appears to visitors.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsVisibilityModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#fbfbfb] px-3.5 py-2 text-xs font-semibold text-[#181716] transition-colors cursor-pointer shadow-xs"
          >
            <Settings className="h-3.5 w-3.5 text-[#b85c6b]" />
            <span>Display Settings</span>
          </button>

          <a
            href={canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#b85c6b] hover:bg-[#6F3456] px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
          >
            <span>Open Public Profile</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* 2. COMPACT PREVIEW TOOLBAR */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E7E3DC] bg-white px-4 py-2.5 shadow-xs">
        {/* Left: Active Theme Info */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b85c6b] bg-[#b85c6b]/[0.09] border border-[#b85c6b]/20 px-3 py-1.5 rounded-xl">
            <Sparkles className="h-3.5 w-3.5 text-[#b85c6b]" />
            <span>Active theme: {activeThemeMeta.name}</span>
          </span>
        </div>

        {/* Right: Refresh Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#797570] hover:text-[#181716] px-3 py-1.5 rounded-xl hover:bg-[#fbfbfb] border border-transparent hover:border-[#E7E3DC] transition-colors cursor-pointer"
            title="Refresh preview canvas"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-[#b85c6b]" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 3. FULL SCREEN / FULL WIDTH PREVIEW CANVAS */}
      <div className="rounded-2xl border border-[#E7E3DC] overflow-hidden shadow-xs">
        <div
          style={{ backgroundColor: activeThemeMeta.colors.pageBackground }}
          className={`relative w-full p-3 sm:p-6 md:p-8 transition-colors duration-300 ${pageBgStyle}`}
        >
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
            <ThemeCard
              themeKey={theme}
              profile={{ ...profile, visibilitySettings }}
              socials={socials}
              series={series}
              totalAudience={totalAudience}
              variant="full"
            />
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
    </div>
  );
}
