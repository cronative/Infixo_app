// Google Analytics 4 Custom Event Helper for Infixo with Consent Enforcement
import { isCategoryAllowed } from "./cookieConsent";

export const GA_MEASUREMENT_ID = "G-HJCSX3TD2Q";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// Track pageviews
export function trackPageView(url: string) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    // Check if analytics cookies are permitted by user consent
    if (!isCategoryAllowed("analytics")) {
      return;
    }
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
}

// Track custom user events
export function trackEvent(
  action: string,
  params?: Record<string, any>
) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    if (!isCategoryAllowed("analytics")) {
      return;
    }
    window.gtag("event", action, params);
  }
}
