"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Shield,
  Sliders,
  Check,
  X,
  Lock,
  ChevronRight,
  Info,
  Cookie,
} from "lucide-react";
import {
  CookiePreferences,
  StoredConsent,
  getStoredConsent,
  saveConsent,
  acceptAllCookies,
  rejectOptionalCookies,
  DEFAULT_PREFERENCES,
  EVENT_CONSENT_UPDATED,
  EVENT_OPEN_PREFERENCES,
  applyGtagConsent,
} from "@/lib/cookieConsent";

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Initialize consent state on client mount
  useEffect(() => {
    setMounted(true);
    const existing = getStoredConsent();

    if (existing) {
      setPreferences(existing.preferences);
      applyGtagConsent(existing.preferences);
      setShowBanner(false);
    } else {
      // First visit: Show banner after a slight natural delay
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for global custom events to open preferences modal from footers or policies
  useEffect(() => {
    const handleOpenModal = () => {
      const existing = getStoredConsent();
      if (existing) {
        setPreferences(existing.preferences);
      } else {
        setPreferences(DEFAULT_PREFERENCES);
      }
      setShowPreferences(true);
      setShowBanner(false);
    };

    const handleConsentUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<StoredConsent>;
      if (customEvent.detail?.preferences) {
        setPreferences(customEvent.detail.preferences);
      }
    };

    window.addEventListener(EVENT_OPEN_PREFERENCES, handleOpenModal);
    window.addEventListener(EVENT_CONSENT_UPDATED, handleConsentUpdated);

    return () => {
      window.removeEventListener(EVENT_OPEN_PREFERENCES, handleOpenModal);
      window.removeEventListener(EVENT_CONSENT_UPDATED, handleConsentUpdated);
    };
  }, []);

  // Handle background scroll locking and keyboard accessibility for Preferences modal
  useEffect(() => {
    if (!showPreferences) return;

    // Save previous active element for focus restoration
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Prevent background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus first interactive element in modal
    const focusTimer = setTimeout(() => {
      modalRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowPreferences(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(focusTimer);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
        previousFocusRef.current.focus();
      }
    };
  }, [showPreferences]);

  const handleAcceptAll = useCallback(() => {
    const saved = acceptAllCookies();
    setPreferences(saved.preferences);
    setShowBanner(false);
    setShowPreferences(false);
  }, []);

  const handleRejectOptional = useCallback(() => {
    const saved = rejectOptionalCookies();
    setPreferences(saved.preferences);
    setShowBanner(false);
    setShowPreferences(false);
  }, []);

  const handleSavePreferences = useCallback(() => {
    const saved = saveConsent(preferences);
    setPreferences(saved.preferences);
    setShowBanner(false);
    setShowPreferences(false);
  }, [preferences]);

  const toggleCategory = (category: keyof CookiePreferences) => {
    if (category === "essential") return; // Cannot toggle essential
    setPreferences((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  if (!mounted) return null;

  return (
    <>
      {/* =========================================================================
          1. FLOATING COMPACT COOKIE BANNER (First Visit)
         ========================================================================= */}
      {showBanner && !showPreferences && (
        <aside
          role="region"
          aria-label="Cookie consent banner"
          className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-lg animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
        >
          <div className="rounded-2xl border border-[#DDD8CF] bg-white p-5 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.03]">
            <div className="space-y-4">
              {/* Header with Title & Cookie Icon */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#111110] tracking-tight">
                    We value your privacy
                  </h3>
                  <p className="text-xs sm:text-sm text-[#55524E] leading-relaxed">
                    We use cookies to keep Inflixo working properly, understand how the site is used, and improve your experience.
                  </p>
                </div>
              </div>

              {/* Action Buttons: Accept All (Maroon Primary), Reject & Manage (Neutral Secondaries) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                {/* Primary Action: Maroon */}
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="inline-flex items-center justify-center rounded-xl bg-[#803D63] hover:bg-[#6F3456] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all shadow-[0_2px_8px_rgba(128,61,99,0.20)] cursor-pointer tap-scale"
                >
                  Accept All
                </button>

                {/* Secondary Action: Reject Optional */}
                <button
                  type="button"
                  onClick={handleRejectOptional}
                  className="inline-flex items-center justify-center rounded-xl bg-white hover:bg-[#F8F7F3] border border-[#DDD8CF] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#111110] transition-all cursor-pointer hover:border-[#111110]/30"
                >
                  Reject Optional
                </button>

                {/* Manage Preferences */}
                <button
                  type="button"
                  onClick={() => {
                    setShowBanner(false);
                    setShowPreferences(true);
                  }}
                  className="inline-flex items-center justify-center rounded-xl bg-transparent hover:bg-[#F8F7F3] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#55524E] hover:text-[#111110] transition-all cursor-pointer"
                >
                  <Sliders className="mr-1.5 h-3.5 w-3.5" />
                  Manage Preferences
                </button>
              </div>

              {/* Policy Links */}
              <div className="flex items-center gap-3 pt-1 text-[11px] font-medium text-[#7C7873] border-t border-[#F0ECE1]">
                <Link
                  href="/privacy"
                  className="hover:text-[#111110] underline underline-offset-2 transition-colors"
                >
                  Privacy Policy
                </Link>
                <span>•</span>
                <Link
                  href="/cookies"
                  className="hover:text-[#111110] underline underline-offset-2 transition-colors"
                >
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* =========================================================================
          2. COOKIE PREFERENCES MODAL / BOTTOM SHEET
         ========================================================================= */}
      {showPreferences && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-preferences-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPreferences(false);
            }
          }}
        >
          <div
            ref={modalRef}
            tabIndex={-1}
            className="w-full sm:max-w-xl max-h-[92dvh] sm:max-h-[85vh] flex flex-col bg-white rounded-t-3xl sm:rounded-3xl border border-[#DDD8CF] shadow-[0_24px_60px_rgba(0,0,0,0.18)] outline-none overflow-hidden animate-in slide-in-from-bottom-6 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#EBE7DF] bg-[#FAF9F5] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-[#DDD8CF] text-[#111110]">
                  <Sliders className="h-4 w-4" />
                </div>
                <div>
                  <h2
                    id="cookie-preferences-title"
                    className="font-display text-lg font-bold text-[#111110] leading-none"
                  >
                    Cookie Preferences
                  </h2>
                  <p className="text-xs text-[#7C7873] mt-1">
                    Control how Inflixo uses cookies on your device
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                aria-label="Close preferences modal"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#7C7873] hover:text-[#111110] hover:bg-[#EBE7DF]/60 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body / Categories List */}
            <div className="p-6 overflow-y-auto space-y-4 text-left">
              <p className="text-xs sm:text-sm text-[#55524E] leading-relaxed pb-1">
                Choose which cookies you&apos;d like to allow. Essential cookies are always enabled because Inflixo needs them to function.
              </p>

              <div className="space-y-3">
                {/* Category 1: Essential Cookies (Locked ON) */}
                <div className="p-4 rounded-2xl border border-[#EBE7DF] bg-[#FAF9F5]/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-[#111110]" />
                      <h3 className="font-display text-sm font-bold text-[#111110]">
                        Essential Cookies
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-[#17845B] bg-[#EAF7F0] border border-[#17845B]/25 px-2.5 py-0.5 rounded-full">
                      Always On
                    </span>
                  </div>
                  <p className="text-xs text-[#55524E] leading-relaxed">
                    Required for login, security and core functionality. Cannot be disabled.
                  </p>
                </div>

                {/* Category 2: Analytics Cookies (Toggle) */}
                <div className="p-4 rounded-2xl border border-[#EBE7DF] bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm font-bold text-[#111110]">
                      Analytics Cookies
                    </h3>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={preferences.analytics}
                      onClick={() => toggleCategory("analytics")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#803D63] focus:ring-offset-2 ${
                        preferences.analytics ? "bg-[#803D63]" : "bg-[#DDD8CF]"
                      }`}
                    >
                      <span className="sr-only">Toggle Analytics Cookies</span>
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          preferences.analytics ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-[#55524E] leading-relaxed">
                    Help us understand how visitors use Inflixo so we can improve the experience.
                  </p>
                </div>

                {/* Category 3: Marketing Cookies (Toggle) */}
                <div className="p-4 rounded-2xl border border-[#EBE7DF] bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm font-bold text-[#111110]">
                      Marketing Cookies
                    </h3>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={preferences.marketing}
                      onClick={() => toggleCategory("marketing")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#803D63] focus:ring-offset-2 ${
                        preferences.marketing ? "bg-[#803D63]" : "bg-[#DDD8CF]"
                      }`}
                    >
                      <span className="sr-only">Toggle Marketing Cookies</span>
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          preferences.marketing ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-[#55524E] leading-relaxed">
                    Used only if Inflixo uses advertising, retargeting or marketing technologies.
                  </p>
                </div>

                {/* Category 4: Functional Cookies (Toggle) */}
                <div className="p-4 rounded-2xl border border-[#EBE7DF] bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm font-bold text-[#111110]">
                      Functional Cookies
                    </h3>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={preferences.functional}
                      onClick={() => toggleCategory("functional")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#803D63] focus:ring-offset-2 ${
                        preferences.functional ? "bg-[#803D63]" : "bg-[#DDD8CF]"
                      }`}
                    >
                      <span className="sr-only">Toggle Functional Cookies</span>
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          preferences.functional ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-[#55524E] leading-relaxed">
                    Used for optional preferences or enhanced functionality, where applicable.
                  </p>
                </div>
              </div>

              {/* Policy Link Footnote */}
              <div className="pt-2 text-center text-xs text-[#7C7873]">
                Learn more in our{" "}
                <Link
                  href="/cookies"
                  onClick={() => setShowPreferences(false)}
                  className="text-[#111110] underline underline-offset-2 hover:text-[#803D63] font-medium"
                >
                  Cookie Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  onClick={() => setShowPreferences(false)}
                  className="text-[#111110] underline underline-offset-2 hover:text-[#803D63] font-medium"
                >
                  Privacy Policy
                </Link>
                .
              </div>
            </div>

            {/* Modal Footer / Actions */}
            <div className="p-4 sm:p-5 border-t border-[#EBE7DF] bg-[#FAF9F5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
              <div className="flex items-center gap-2 order-2 sm:order-1">
                <button
                  type="button"
                  onClick={handleRejectOptional}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-white hover:bg-[#F2EFE9] border border-[#DDD8CF] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#111110] transition-all cursor-pointer"
                >
                  Reject Optional
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-white hover:bg-[#F2EFE9] border border-[#DDD8CF] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#111110] transition-all cursor-pointer"
                >
                  Accept All
                </button>
              </div>

              {/* Primary Action: Save Preferences in Inflixo Maroon */}
              <button
                type="button"
                onClick={handleSavePreferences}
                className="order-1 sm:order-2 inline-flex items-center justify-center rounded-xl bg-[#803D63] hover:bg-[#6F3456] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all shadow-[0_2px_8px_rgba(128,61,99,0.20)] cursor-pointer tap-scale"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
