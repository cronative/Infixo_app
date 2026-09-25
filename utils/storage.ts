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

function sanitizeForStorage(value: any): any {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    // Strip large base64 data URLs (images, posters, avatars) to prevent localStorage quota crash (5MB limit)
    if (value.startsWith("data:image/") || value.startsWith("data:video/") || (value.startsWith("data:") && value.length > 500)) {
      return null;
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeForStorage);
  }
  if (typeof value === "object") {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      cleaned[k] = sanitizeForStorage(v);
    }
    return cleaned;
  }
  return value;
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
      const sanitized = sanitizeForStorage(value);
      window.localStorage.setItem(nsKey(key), JSON.stringify(sanitized));
    } catch (e) {
      console.warn(`[storage] Could not save key "${key}" to localStorage:`, e);
      // If quota exceeded, attempt to clear any legacy oversized cache keys
      try {
        window.localStorage.removeItem(nsKey(STORAGE_KEYS.series));
        window.localStorage.removeItem(nsKey(STORAGE_KEYS.brands));
      } catch {}
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
  reviews: "reviews",
  subscription: "subscription",
  onboardingStep: "onboarding_step",
  visibilitySettings: "visibility_settings",
  otherSocials: "other_socials",
  team: "team",
  creatorSetup: "creator_setup",
  brands: "brands",
  collaborations: "collaborations",
  sections: "sections",
} as const;
