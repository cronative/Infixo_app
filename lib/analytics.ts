// Google Analytics 4 Custom Event Helper for Infixo

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
    window.gtag("event", action, params);
  }
}
