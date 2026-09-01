"use client";

import { useState } from "react";
import { Settings, Eye } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { ThemeCard } from "@/themes/registry";
import { THEME_PAGE_BACKGROUNDS } from "@/services/ThemeService";
import { VisibilitySettingsModal } from "@/components/shared/VisibilitySettingsModal";
import { VisibilitySettings, DEFAULT_VISIBILITY_SETTINGS } from "@/types";
import { STORAGE_KEYS, storage } from "@/utils/storage";

export default function DashboardPreviewPage() {
  const { profile, socials, series, totalAudience, theme } = useCreator();

  const pageBgStyle = THEME_PAGE_BACKGROUNDS[theme] || THEME_PAGE_BACKGROUNDS["minimal-white"];

  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [visibilitySettings, setVisibilitySettings] = useState<VisibilitySettings>(() => {
    if (profile.visibilitySettings) return profile.visibilitySettings;
    return storage.get<VisibilitySettings>(STORAGE_KEYS.visibilitySettings, DEFAULT_VISIBILITY_SETTINGS);
  });

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
    } catch (e) {
      console.warn("Error saving visibility settings:", e);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 text-left">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#17131A] tracking-tight">
            Profile Preview
          </h1>
          <p className="text-xs sm:text-sm text-[#6F6872] font-medium mt-1">
            This is exactly how your public profile looks to brands and fans.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsVisibilityModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#ECE8EB] bg-white hover:bg-[#FAF8FA] px-3.5 py-2 text-xs font-semibold text-[#17131A] transition-colors cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
        >
          <Settings className="h-3.5 w-3.5 text-[#803D63]" />
          <span>Page Display Settings</span>
        </button>
      </div>

      {/* 2. PREVIEW CANVAS CONTAINER */}
      <div className="space-y-4">
        <div className={`w-full rounded-3xl p-4 sm:p-8 transition-colors duration-300 shadow-2xs border border-[#ECE8EB] ${pageBgStyle}`}>
          <div className="w-full max-w-2xl mx-auto">
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

      {/* Visibility Settings Modal (100% Intact) */}
      <VisibilitySettingsModal
        isOpen={isVisibilityModalOpen}
        onClose={() => setIsVisibilityModalOpen(false)}
        settings={visibilitySettings}
        onSave={handleSaveVisibility}
      />
    </div>
  );
}
