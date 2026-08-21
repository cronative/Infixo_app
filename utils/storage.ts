// ---------------------------------------------------------------------------
// Thin, typed wrapper around window.localStorage.
// This is the ONLY module allowed to touch `localStorage` directly.
// Repositories use this; services use repositories; components use services.
// Swapping this file's implementation (e.g. for an API-backed store) is the
// intended seam for the future Node.js/MySQL migration.
// ---------------------------------------------------------------------------

const NAMESPACE = "inflixo";

function isBrowser() {
  return typeof window !== "undefined";
}

function nsKey(key: string) {
  return `${NAMESPACE}:${key}`;
}

export const storage = {
  get<T>(key: string, fallback: T): T {
    if (!isBrowser()) return fallback;
    try {
      const raw = window.localStorage.getItem(nsKey(key));
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    if (!isBrowser()) return;
    try {
      window.localStorage.setItem(nsKey(key), JSON.stringify(value));
    } catch {
      // localStorage may be full or disabled — fail silently in prototype
    }
  },

  remove(key: string): void {
    if (!isBrowser()) return;
    window.localStorage.removeItem(nsKey(key));
  },

  clearAll(): void {
    if (!isBrowser()) return;
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(`${NAMESPACE}:`))
      .forEach((k) => window.localStorage.removeItem(k));
  },
};

export const STORAGE_KEYS = {
  auth: "auth",
  otpEmail: "otp_email",
  profile: "profile",
  socials: "socials",
  customLinks: "custom_links",
  theme: "theme",
  series: "series",
  subscription: "subscription",
  onboardingStep: "onboarding_step",
} as const;
