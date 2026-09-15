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
  CustomLink,
  DEFAULT_CUSTOM_LINKS,
  Series,
  Subscription,
  ThemeKey,
  EMPTY_SOCIAL_ACCOUNTS,
  CreatorReview,
  CreatorSetupItem,
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
    storage.clearAll();
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

export const customLinksRepository = {
  get(): CustomLink[] {
    return storage.get<CustomLink[]>(STORAGE_KEYS.customLinks, DEFAULT_CUSTOM_LINKS);
  },
  save(links: CustomLink[]) {
    storage.set(STORAGE_KEYS.customLinks, links);
  },
};

export const themeRepository = {
  get(): ThemeKey {
    return storage.get<ThemeKey>(STORAGE_KEYS.theme, "minimal-white");
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
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    return storage.get<Subscription>(STORAGE_KEYS.subscription, {
      planKey: "early_access",
      planName: "Free Trial",
      billingCycle: "yearly",
      status: "trial",
      activatedAt: now.toISOString(),
      trialStartedAt: now.toISOString(),
      trialEndsAt,
      currentPeriodStartedAt: now.toISOString(),
      currentPeriodEndsAt: trialEndsAt,
      renewsAt: null,
      endsAt: trialEndsAt,
      cancelledAt: null,
      cancelAtPeriodEnd: false,
      paymentMode: "free_trial",
      firstMonthOffer: true,
      firstMonthAmount: 99,
      firstMonthCurrency: "INR",
      autoRenew: false,
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

const DEFAULT_REVIEWS: CreatorReview[] = [];

export const reviewsRepository = {
  getAll(): CreatorReview[] {
    return storage.get<CreatorReview[]>(STORAGE_KEYS.reviews, DEFAULT_REVIEWS);
  },
  saveAll(reviews: CreatorReview[]) {
    storage.set(STORAGE_KEYS.reviews, reviews);
  },
};

export const otherSocialsRepository = {
  getAll(): any[] {
    return storage.get<any[]>(STORAGE_KEYS.otherSocials, []);
  },
  saveAll(socials: any[]) {
    storage.set(STORAGE_KEYS.otherSocials, socials);
  },
};

export const teamRepository = {
  get(): any | null {
    return storage.get<any | null>(STORAGE_KEYS.team, null);
  },
  save(team: any | null) {
    storage.set(STORAGE_KEYS.team, team);
  },
};

export const creatorSetupRepository = {
  getAll(): CreatorSetupItem[] {
    return storage.get<CreatorSetupItem[]>(STORAGE_KEYS.creatorSetup, []);
  },
  saveAll(items: CreatorSetupItem[]) {
    storage.set(STORAGE_KEYS.creatorSetup, items);
  },
};

export const brandsRepository = {
  getAll(): any[] {
    return storage.get<any[]>(STORAGE_KEYS.brands, []);
  },
  saveAll(brands: any[]) {
    storage.set(STORAGE_KEYS.brands, brands);
  },
};

export const collaborationsRepository = {
  getAll(): any[] {
    return storage.get<any[]>(STORAGE_KEYS.collaborations, []);
  },
  saveAll(collabs: any[]) {
    storage.set(STORAGE_KEYS.collaborations, collabs);
  },
};

export const sectionsRepository = {
  getAll(): any[] {
    return storage.get<any[]>(STORAGE_KEYS.sections, []);
  },
  saveAll(sections: any[]) {
    storage.set(STORAGE_KEYS.sections, sections);
  },
};
