"use client";

import { useState, useMemo } from "react";
import {
  Settings,
  Eye,
  Smartphone,
  Tablet,
  Monitor,
  ExternalLink,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { ThemeCard } from "@/themes/registry";
import { THEME_PAGE_BACKGROUNDS, THEME_LIST } from "@/services/ThemeService";
import { VisibilitySettingsModal } from "@/components/shared/VisibilitySettingsModal";
import { VisibilitySettings, DEFAULT_VISIBILITY_SETTINGS } from "@/types";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { useToast } from "@/contexts/ToastContext";

type DeviceMode = "mobile" | "tablet" | "desktop";

function getCanonicalProfileUrl(username: string): string {
  const cleanUsername = (username || "creator").replace(/^@/, "");
  if (typeof window !== "undefined") {
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isLocalhost) {
      return `${window.location.origin}/${cleanUsername}`;
    }
  }
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inflixo.com";
  return `${baseUrl.replace(/\/$/, "")}/${cleanUsername}`;
}

export default function DashboardPreviewPage() {
  const { profile, socials, series, totalAudience, theme } = useCreator();
  const { showToast } = useToast();

  const [deviceMode, setDeviceMode] = useState<DeviceMode>("mobile");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);

  const [visibilitySettings, setVisibilitySettings] = useState<VisibilitySettings>(() => {
    if (profile.visibilitySettings) return profile.visibilitySettings;
    return storage.get<VisibilitySettings>(STORAGE_KEYS.visibilitySettings, DEFAULT_VISIBILITY_SETTINGS);
  });

  const pageBgStyle = THEME_PAGE_BACKGROUNDS[theme] || THEME_PAGE_BACKGROUNDS["minimal-white"];
  const activeThemeMeta = useMemo(() => {
    return THEME_LIST.find((t) => t.key === theme) || THEME_LIST[0];
  }, [theme]);

  const rawUsername = profile?.username || "creator";
  const canonicalUrl = getCanonicalProfileUrl(rawUsername);

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
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#17131A] tracking-tight">
              Profile Preview
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16794A] bg-[#ECFDF3] px-2.5 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-[#16794A]" />
              Public profile is live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6F6872] font-medium mt-1">
            See exactly how your public creator profile appears to visitors.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsVisibilityModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#ECE8EB] bg-white hover:bg-[#FAF8FA] px-3.5 py-2 text-xs font-semibold text-[#17131A] transition-colors cursor-pointer shadow-2xs"
          >
            <Settings className="h-3.5 w-3.5 text-[#803D63]" />
            <span>Display Settings</span>
          </button>

          <a
            href={canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#803D63] hover:bg-[#6F3456] px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer shadow-2xs"
          >
            <span>Open Public Profile</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* 2. COMPACT PREVIEW TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#ECE8EB] bg-white px-4 py-2.5 shadow-2xs">
        {/* Left: Device Mode Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#6F6872] uppercase tracking-wider text-[11px] pr-1">
            Preview as:
          </span>

          <div className="inline-flex items-center rounded-xl bg-[#FAF8FA] p-1 border border-[#ECE8EB]">
            <button
              type="button"
              onClick={() => setDeviceMode("mobile")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                deviceMode === "mobile"
                  ? "bg-white text-[#803D63] shadow-2xs border border-[#ECE8EB]"
                  : "text-[#6F6872] hover:text-[#17131A]"
              }`}
              title="Mobile view (390px)"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Mobile</span>
            </button>

            <button
              type="button"
              onClick={() => setDeviceMode("tablet")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                deviceMode === "tablet"
                  ? "bg-white text-[#803D63] shadow-2xs border border-[#ECE8EB]"
                  : "text-[#6F6872] hover:text-[#17131A]"
              }`}
              title="Tablet view (768px)"
            >
              <Tablet className="h-3.5 w-3.5" />
              <span>Tablet</span>
            </button>

            <button
              type="button"
              onClick={() => setDeviceMode("desktop")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                deviceMode === "desktop"
                  ? "bg-white text-[#803D63] shadow-2xs border border-[#ECE8EB]"
                  : "text-[#6F6872] hover:text-[#17131A]"
              }`}
              title="Desktop view"
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>Desktop</span>
            </button>
          </div>
        </div>

        {/* Right: Active Theme & Refresh Action */}
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <span className="text-[11px] font-semibold text-[#803D63] bg-[#F7EDF3] border border-[#ECE8EB] px-2.5 py-1 rounded-lg">
            Active theme: {activeThemeMeta.name}
          </span>

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#6F6872] hover:text-[#17131A] p-1.5 rounded-lg hover:bg-[#FAF8FA] transition-colors cursor-pointer"
            title="Refresh preview canvas"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-[#803D63]" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 3. PREVIEW CANVAS CONTAINER */}
      <div className="rounded-2xl border border-[#ECE8EB] bg-[#FAF8FA] p-3 sm:p-6 shadow-2xs flex items-start justify-center min-h-[580px] overflow-x-auto">
        <div
          className={`transition-all duration-300 w-full rounded-3xl overflow-hidden shadow-sm border border-[#ECE8EB] ${
            deviceMode === "mobile"
              ? "max-w-[400px]"
              : deviceMode === "tablet"
              ? "max-w-[768px]"
              : "max-w-4xl"
          }`}
        >
          {/* Scrollable Device Frame Canvas */}
          <div
            className={`w-full p-4 sm:p-6 max-h-[calc(100vh-230px)] overflow-y-auto scrollbar-thin transition-colors duration-300 ${pageBgStyle}`}
          >
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
      </div>

      {/* 4. VISIBILITY SETTINGS MODAL (100% UNTOUCHED LOGIC) */}
      <VisibilitySettingsModal
        isOpen={isVisibilityModalOpen}
        onClose={() => setIsVisibilityModalOpen(false)}
        settings={visibilitySettings}
        onSave={handleSaveVisibility}
      />
    </div>
  );
}
