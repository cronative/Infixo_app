"use client";

import { useSyncExternalStore } from "react";

export type PricingCurrency = "INR" | "USD";
export type PaidPlanKey = "starter" | "pro" | "vip";
export type BillingPeriod = "monthly" | "yearly";

const PLAN_PRICES: Record<PaidPlanKey, Record<BillingPeriod, Record<PricingCurrency, number>>> = {
  starter: {
    monthly: { INR: 99, USD: 2.99 },
    yearly: { INR: 999, USD: 29 },
  },
  pro: {
    monthly: { INR: 199, USD: 4.99 },
    yearly: { INR: 1999, USD: 49 },
  },
  vip: {
    monthly: { INR: 399, USD: 9.99 },
    yearly: { INR: 3999, USD: 99 },
  },
};

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

export function getPlanPrice(plan: PaidPlanKey, period: BillingPeriod, currency: PricingCurrency) {
  return PLAN_PRICES[plan][period][currency];
}

export function formatPlanPrice(plan: PaidPlanKey, period: BillingPeriod, currency: PricingCurrency) {
  const value = getPlanPrice(plan, period, currency);
  if (currency === "INR") {
    return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  }
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
