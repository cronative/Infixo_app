// Production-Ready Cookie Consent Manager for Inflixo
// Adheres to GDPR, ePrivacy, and CCPA principles with granular category control.

export const COOKIE_CONSENT_VERSION = "v1";
export const COOKIE_CONSENT_STORAGE_KEY = `inflixo_cookie_consent_${COOKIE_CONSENT_VERSION}`;

export interface CookiePreferences {
  essential: boolean; // Always true (required for auth, core navigation, security)
  analytics: boolean; // GA4 and usage analytics
  marketing: boolean; // Ad networks, retargeting & campaign pixels
  functional: boolean; // Enhanced personalizations & preferences
}

export interface StoredConsent {
  preferences: CookiePreferences;
  timestamp: string;
  version: string;
}

export const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  functional: false,
};

export const ALL_ACCEPTED_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: true,
  marketing: true,
  functional: true,
};

export const ESSENTIAL_ONLY_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  functional: false,
};

// Custom events for decoupled reactive updates
export const EVENT_CONSENT_UPDATED = "inflixo:cookie-consent-updated";
export const EVENT_OPEN_PREFERENCES = "inflixo:open-cookie-preferences";

/**
 * Update Google Analytics 4 (gtag.js) consent mode state
 */
export function applyGtagConsent(prefs: CookiePreferences) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  try {
    window.gtag("consent", "update", {
      analytics_storage: prefs.analytics ? "granted" : "denied",
      ad_storage: prefs.marketing ? "granted" : "denied",
      ad_user_data: prefs.marketing ? "granted" : "denied",
      ad_personalization: prefs.marketing ? "granted" : "denied",
      functionality_storage: prefs.functional ? "granted" : "denied",
      personalization_storage: prefs.functional ? "granted" : "denied",
    });
  } catch (err) {
    console.warn("Could not update gtag consent:", err);
  }
}

/**
 * Retrieve saved user consent from localStorage
 */
export function getStoredConsent(): StoredConsent | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;

    const parsed: StoredConsent = JSON.parse(raw);
    if (parsed && parsed.version === COOKIE_CONSENT_VERSION && parsed.preferences) {
      // Ensure essential is always true
      parsed.preferences.essential = true;
      return parsed;
    }
  } catch {
    // If JSON parsing fails, clear invalid storage
    try {
      localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
    } catch {}
  }
  return null;
}

/**
 * Check if the user has saved an active consent decision
 */
export function hasUserGivenConsent(): boolean {
  return getStoredConsent() !== null;
}

/**
 * Check if a specific cookie category is allowed
 */
export function isCategoryAllowed(category: keyof CookiePreferences): boolean {
  if (category === "essential") return true;
  const stored = getStoredConsent();
  if (!stored) return false;
  return Boolean(stored.preferences[category]);
}

/**
 * Save user cookie preferences, update GA4, and dispatch event
 */
export function saveConsent(prefs: Partial<CookiePreferences>): StoredConsent {
  const finalPrefs: CookiePreferences = {
    essential: true,
    analytics: Boolean(prefs.analytics),
    marketing: Boolean(prefs.marketing),
    functional: Boolean(prefs.functional),
  };

  const storedData: StoredConsent = {
    preferences: finalPrefs,
    timestamp: new Date().toISOString(),
    version: COOKIE_CONSENT_VERSION,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(storedData));
    } catch (err) {
      console.warn("Could not save cookie consent to localStorage:", err);
    }

    applyGtagConsent(finalPrefs);

    window.dispatchEvent(
      new CustomEvent(EVENT_CONSENT_UPDATED, { detail: storedData })
    );
  }

  return storedData;
}

/**
 * Convenient helper to accept all cookie categories
 */
export function acceptAllCookies(): StoredConsent {
  return saveConsent(ALL_ACCEPTED_PREFERENCES);
}

/**
 * Convenient helper to reject all optional cookie categories
 */
export function rejectOptionalCookies(): StoredConsent {
  return saveConsent(ESSENTIAL_ONLY_PREFERENCES);
}

/**
 * Open the cookie preferences modal from anywhere (e.g. footer links)
 */
export function openCookiePreferences(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_OPEN_PREFERENCES));
}
