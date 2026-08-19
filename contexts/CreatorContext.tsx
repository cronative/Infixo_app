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

  const refresh = useCallback(async () => {
    // 1. Instant local storage state
    setProfile(ProfileService.getProfile());
    setSocials(SocialService.getAccounts());
    setThemeState(ThemeService.getSelectedTheme());
    setSubscription(SubscriptionService.get());
    setSeries(SeriesService.getAllLocal());

    // 2. Live DB sync (Profile, Social Accounts, Series & Subscription)
    try {
      const [dbProfile, dbSocials, dbSeries, dbSub] = await Promise.all([
        ProfileService.fetchFromDb().catch(() => null),
        SocialService.fetchFromDb().catch(() => null),
        SeriesService.fetchFromDb().catch(() => null),
        SubscriptionService.fetchFromDb().catch(() => null),
      ]);

      if (dbProfile) {
        setProfile(dbProfile);
      }
      if (dbSocials) {
        setSocials(dbSocials);
      }
      if (dbSeries && Array.isArray(dbSeries)) {
        setSeries(dbSeries);
      }
      if (dbSub) {
        setSubscription(dbSub);
      }
    } catch (e) {
      console.warn("Failed to sync DB in CreatorContext:", e);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
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
