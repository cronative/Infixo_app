"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import {
  CreatorProfile,
  SocialAccounts,
  ThemeKey,
  Series,
  Subscription,
  EMPTY_SOCIAL_ACCOUNTS,
} from "@/types";
import { ProfileService } from "@/services/ProfileService";
import { SocialService } from "@/services/SocialService";
import { ThemeService } from "@/services/ThemeService";
import { SeriesService } from "@/services/SeriesService";
import { SubscriptionService } from "@/services/SubscriptionService";

interface CreatorContextValue {
  profile: CreatorProfile;
  socials: SocialAccounts;
  theme: ThemeKey;
  series: Series[];
  subscription: Subscription;
  totalAudience: number;
  loading: boolean;
  refresh: () => void;
  updateProfile: (patch: Partial<CreatorProfile>) => void;
  updateSocials: (patch: Partial<SocialAccounts>) => void;
  setTheme: (key: ThemeKey) => void;
}

const CreatorContext = createContext<CreatorContextValue | null>(null);

const EMPTY_PROFILE: CreatorProfile = {
  photoDataUrl: null,
  displayName: "",
  username: "",
  category: null,
  bio: "",
  updatedAt: new Date().toISOString(),
};

export function CreatorProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CreatorProfile>(EMPTY_PROFILE);
  const [socials, setSocials] = useState<SocialAccounts>(EMPTY_SOCIAL_ACCOUNTS);
  const [theme, setThemeState] = useState<ThemeKey>("minimal-white");
  const [series, setSeries] = useState<Series[]>([]);
  const [subscription, setSubscription] = useState<Subscription>(SubscriptionService.get());
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    // 1. Instant local storage state for fast first paint
    setProfile(ProfileService.getProfile());
    setSocials(SocialService.getAccounts());
    setThemeState(ThemeService.getSelectedTheme());
    setSubscription(SubscriptionService.get());
    setSeries(SeriesService.getAllLocal());

    // 2. Authoritative Server DB Sync via /api/me (cookie-backed session)
    try {
      const meRes = await fetch("/api/me", { cache: "no-store" }).catch(() => null);
      if (meRes && meRes.ok) {
        const meJson = await meRes.json().catch(() => null);
        if (meJson?.status === 1 && meJson?.data?.authenticated) {
          const { profile: dbProfile, subscription: dbSub, email: sessionEmail } = meJson.data;

          if (dbProfile) {
            setProfile(dbProfile);
            if (dbProfile.themeKey) {
              setThemeState(dbProfile.themeKey);
              ThemeService.setSelectedTheme(dbProfile.themeKey);
            }
          }

          if (dbSub) {
            setSubscription(dbSub);
          }

          const activeEmail = sessionEmail || dbProfile?.email;
          const activeUsername = dbProfile?.username;

          const [dbSocials, dbSeries] = await Promise.all([
            SocialService.fetchFromDb({ email: activeEmail, username: activeUsername }).catch(() => null),
            SeriesService.fetchFromDb().catch(() => null),
          ]);

          if (dbSocials) {
            setSocials(dbSocials);
          }
          if (dbSeries && Array.isArray(dbSeries)) {
            setSeries(dbSeries);
          }

          setLoading(false);
          return;
        }
      }

      // Fallback for legacy flows without cookie
      const dbProfile = await ProfileService.fetchFromDb().catch(() => null);

      if (dbProfile) {
        setProfile(dbProfile);

        if (dbProfile.id || dbProfile.email || dbProfile.username) {
          const [dbSocials, dbSeries, dbSub] = await Promise.all([
            SocialService.fetchFromDb({ email: dbProfile.email, username: dbProfile.username }).catch(() => null),
            SeriesService.fetchFromDb().catch(() => null),
            SubscriptionService.fetchFromDb(dbProfile.email).catch(() => null),
          ]);

          if (dbSocials) {
            setSocials(dbSocials);
          }
          if (dbSeries && Array.isArray(dbSeries)) {
            setSeries(dbSeries);
          }
          if (dbSub) {
            setSubscription(dbSub);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to sync DB in CreatorContext:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    setHydrated(true);
  }, [refresh]);

  const updateProfile = useCallback((patch: Partial<CreatorProfile>) => {
    const updated = ProfileService.saveLocal(patch);
    setProfile(updated);
  }, []);

  const updateSocials = useCallback((patch: Partial<SocialAccounts>) => {
    const updated = SocialService.saveAccounts(patch);
    setSocials(updated);
  }, []);

  const setTheme = useCallback((key: ThemeKey) => {
    ThemeService.setSelectedTheme(key);
    setThemeState(key);
  }, []);

  const totalAudience = SocialService.calculateTotalAudience(socials);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-inflixo-purple-light border-t-inflixo-purple" />
      </div>
    );
  }

  return (
    <CreatorContext.Provider
      value={{
        profile,
        socials,
        theme,
        series,
        subscription,
        totalAudience,
        loading,
        refresh,
        updateProfile,
        updateSocials,
        setTheme,
      }}
    >
      {children}
    </CreatorContext.Provider>
  );
}

export function useCreator() {
  const ctx = useContext(CreatorContext);
  if (!ctx) throw new Error("useCreator must be used within CreatorProvider");
  return ctx;
}
