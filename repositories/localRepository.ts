// ---------------------------------------------------------------------------
// Repository layer: raw read/write per entity, backed by localStorage today.
// Services call these. When the backend arrives, only this file (and the
// underlying storage util) needs to be swapped for fetch()-based calls —
// service and component code stays identical.
// ---------------------------------------------------------------------------

import { storage, STORAGE_KEYS } from "@/utils/storage";
import {
  AuthSession,
  CreatorProfile,
  SocialAccounts,
  Series,
  Subscription,
  ThemeKey,
  EMPTY_SOCIAL_ACCOUNTS,
} from "@/types";

export const authRepository = {
  get(): AuthSession | null {
    return storage.get<AuthSession | null>(STORAGE_KEYS.auth, null);
  },
  save(session: AuthSession) {
    storage.set(STORAGE_KEYS.auth, session);
  },
  getPendingEmail(): string {
    const session = storage.get<AuthSession | null>(STORAGE_KEYS.auth, null);
    if (session?.email) {
      return session.email;
    }
    const profile = storage.get<CreatorProfile | null>(STORAGE_KEYS.profile, null);
    if (profile?.email) {
      return profile.email;
    }
    return storage.get<string>(STORAGE_KEYS.otpEmail, "");
  },
  savePendingEmail(email: string) {
    storage.set(STORAGE_KEYS.otpEmail, email);
  },
  clear() {
    storage.remove(STORAGE_KEYS.auth);
  },
};

export const profileRepository = {
  get(): CreatorProfile | null {
    return storage.get<CreatorProfile | null>(STORAGE_KEYS.profile, null);
  },
  save(profile: CreatorProfile) {
    storage.set(STORAGE_KEYS.profile, profile);
  },
};

export const socialRepository = {
  get(): SocialAccounts {
    return storage.get<SocialAccounts>(STORAGE_KEYS.socials, EMPTY_SOCIAL_ACCOUNTS);
  },
  save(socials: SocialAccounts) {
    storage.set(STORAGE_KEYS.socials, socials);
  },
};

export const themeRepository = {
  get(): ThemeKey {
    return storage.get<ThemeKey>(STORAGE_KEYS.theme, "modern-purple");
  },
  save(theme: ThemeKey) {
    storage.set(STORAGE_KEYS.theme, theme);
  },
};

export const seriesRepository = {
  getAll(): Series[] {
    return storage.get<Series[]>(STORAGE_KEYS.series, []);
  },
  saveAll(series: Series[]) {
    storage.set(STORAGE_KEYS.series, series);
  },
};

export const subscriptionRepository = {
  get(): Subscription {
    return storage.get<Subscription>(STORAGE_KEYS.subscription, {
      planKey: "pro",
      planName: "Pro Plan",
      billingCycle: "yearly",
      status: "trial",
      activatedAt: null,
    });
  },
  save(sub: Subscription) {
    storage.set(STORAGE_KEYS.subscription, sub);
  },
};

export const onboardingRepository = {
  getStep(): string {
    return storage.get<string>(STORAGE_KEYS.onboardingStep, "profile");
  },
  saveStep(step: string) {
    storage.set(STORAGE_KEYS.onboardingStep, step);
  },
};
