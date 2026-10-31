"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { usePathname } from "next/navigation";
import { fetchMe } from "@/lib/meClient";
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
import { OnboardingService } from "@/services/OnboardingService";

import { getFreeTrialStatus } from "@/lib/trialStatus";
import { DEFAULT_THEME_KEY } from "@/lib/themeKeys";

interface CreatorContextValue {
  profile: CreatorProfile;
  socials: SocialAccounts;
  theme: ThemeKey;
  series: Series[];
  subscription: Subscription;
  totalAudience: number;
  loading: boolean;
  onboardingStep: string;
  isTrialExpired: boolean;
  trialStatus: ReturnType<typeof getFreeTrialStatus>;
  isTrialModalOpen: boolean;
  openTrialExpiredModal: () => void;
  closeTrialExpiredModal: () => void;
  handleViewProfile: (e?: React.MouseEvent) => void;
  refresh: () => void;
  updateProfile: (patch: Partial<CreatorProfile>) => void;
  updateSocials: (patch: Partial<SocialAccounts>) => void;
  setTheme: (key: ThemeKey) => void;
}

const CreatorContext = createContext<CreatorContextValue | null>(null);

// Pages that don't use creator socials/series. Those load on the first visit to any other page.
const ROUTES_WITHOUT_EXTRAS = ["/dashboard/products", "/dashboard/links", "/dashboard/analytics"];
const routeNeedsExtras = (path: string) => !ROUTES_WITHOUT_EXTRAS.some((route) => path === route || path.startsWith(`${route}/`));

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
  const [theme, setThemeState] = useState<ThemeKey>(DEFAULT_THEME_KEY);
  const [series, setSeries] = useState<Series[]>([]);
  const [subscription, setSubscription] = useState<Subscription>(SubscriptionService.get());
  const [onboardingStep, setOnboardingStep] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname() || "";
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);
  const identity = useRef<{ email?: string; username?: string } | null>(null);
  const extrasLoaded = useRef(false);

  const loadExtras = useCallback(async () => {
    if (!identity.current) return;
    extrasLoaded.current = true;
    const [dbSocials, dbSeries] = await Promise.all([
      SocialService.fetchFromDb(identity.current).catch(() => null),
      SeriesService.fetchFromDb().catch(() => null),
    ]);
    if (dbSocials) {
      setSocials(dbSocials);
    }
    if (dbSeries && Array.isArray(dbSeries)) {
      setSeries(dbSeries);
    }
  }, []);

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
      const meRes = await fetchMe().catch(() => null);
      if (meRes && meRes.ok) {
        const meJson = meRes.body;
        if (meJson?.status === 1 && meJson?.data?.authenticated) {
          const { profile: dbProfile, subscription: dbSub, email: sessionEmail, onboardingStep: dbStep } = meJson.data;

          if (dbStep) {
            setOnboardingStep(dbStep);
            OnboardingService.setStep(dbStep);
          }

          if (dbProfile) {
            setProfile(dbProfile);
            if (dbProfile.themeKey) {
              setThemeState(dbProfile.themeKey);
              ThemeService.cacheSelectedTheme(dbProfile.themeKey);
            }
          }

          if (dbSub) {
            setSubscription(dbSub);
          }

          identity.current = { email: sessionEmail || dbProfile?.email, username: dbProfile?.username };
          extrasLoaded.current = false;
          if (routeNeedsExtras(pathnameRef.current)) {
            await loadExtras();
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
  }, [loadExtras]);

  useEffect(() => {
    refresh();
    setHydrated(true);
  }, [refresh]);

  // Arriving from a lightweight page: load socials/series once.
  useEffect(() => {
    if (!loading && !extrasLoaded.current && routeNeedsExtras(pathname)) {
      void loadExtras();
    }
  }, [loading, pathname, loadExtras]);

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
  const trialStatus = getFreeTrialStatus(subscription);
  const isTrialExpired = trialStatus.isExpired;
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);

  const openTrialExpiredModal = useCallback(() => {
    setIsTrialModalOpen(true);
  }, []);

  const closeTrialExpiredModal = useCallback(() => {
    setIsTrialModalOpen(false);
  }, []);

  const handleViewProfile = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isTrialExpired) {
      setIsTrialModalOpen(true);
    } else {
      const handleStr = profile.username || "creator";
      window.open(`/${handleStr}`, "_blank");
    }
  }, [isTrialExpired, profile.username]);

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
        isTrialExpired,
        trialStatus,
        isTrialModalOpen,
        openTrialExpiredModal,
        closeTrialExpiredModal,
        handleViewProfile,
        refresh,
        updateProfile,
        updateSocials,
        setTheme,
        onboardingStep,
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
