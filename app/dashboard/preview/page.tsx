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
    <div className="min-h-dvh bg-[#F9FAFB] text-slate-900 pb-16">
      {/* Sticky Page Subheader */}
      <div className="sticky top-0 z-30 bg-[#FAF8FA]/95 backdrop-blur-md border-b border-[#E8DCE4]/80 px-3 sm:px-6 py-3.5 shadow-2xs text-left mb-6">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-base font-extrabold text-slate-900 truncate">
              Profile Preview
            </h1>
            <p className="text-xs text-slate-500 font-medium truncate">
              This is exactly how your public profile looks to brands &amp; fans
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsVisibilityModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-[#803D63]/30 hover:text-[#803D63] transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Page Display Settings</span>
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 sm:px-6 space-y-5">
        {/* Preview Card */}
        <div className={`w-full rounded-3xl p-4 sm:p-8 transition-colors duration-300 shadow-sm ${pageBgStyle}`}>
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

      {/* Visibility Settings Modal */}
      <VisibilitySettingsModal
        isOpen={isVisibilityModalOpen}
        onClose={() => setIsVisibilityModalOpen(false)}
        settings={visibilitySettings}
        onSave={handleSaveVisibility}
      />
    </div>
  );
}

