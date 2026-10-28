"use client";

import { useSyncExternalStore } from "react";
import { formatMoney, planPrice, type BillingPeriod, type PaidPlanKey, type PricingCurrency } from "@/config/plans";

export type { BillingPeriod, PaidPlanKey, PricingCurrency } from "@/config/plans";

function detectPricingCurrency(): PricingCurrency {
  if (typeof window === "undefined") return "INR";

  const host = window.location.hostname.toLowerCase();
  const isLocalOrPrivateHost =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.endsWith(".local");

  if (isLocalOrPrivateHost) return "INR";

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const indiaTimeZones = new Set(["Asia/Kolkata", "Asia/Calcutta"]);
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  const hasIndiaLocale = languages.some((locale) => /(^|-)in$/i.test(locale));
  const hasIndiaTimeZone = indiaTimeZones.has(timeZone);

  if (hasIndiaTimeZone || hasIndiaLocale) return "INR";

  return "USD";
}

export function usePricingCurrency(): PricingCurrency {
  return useSyncExternalStore(
    () => () => {},
    detectPricingCurrency,
    () => "INR"
  );
}

/** Prices come from config/plans.ts. */
export function getPlanPrice(plan: PaidPlanKey, period: BillingPeriod, currency: PricingCurrency) {
  return planPrice(plan, period, currency);
}

export function formatPlanPrice(plan: PaidPlanKey, period: BillingPeriod, currency: PricingCurrency) {
  return formatMoney(getPlanPrice(plan, period, currency), currency);
}
