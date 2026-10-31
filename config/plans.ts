/**
 * Plans: the single source of truth for prices, limits and plan features.
 * UI counters, "x of y" chips, upgrade modals, disabled states, landing pricing and every
 * server-side 403 LIMIT_REACHED read from here (services/subscriptionLimits.ts, lib/pricing.ts,
 * lib/razorpayPlans.ts and lib/planServer.ts are thin adapters over this file).
 */

export type PlanKey = "trial" | "starter" | "pro" | "vip";
export type PaidPlanKey = Exclude<PlanKey, "trial">;
export type BillingPeriod = "monthly" | "yearly";
export type PricingCurrency = "INR" | "USD";
export type ThemeAccess = "basics-rainbow" | "all";

/** Infinity = unlimited. */
export interface PlanLimits {
  series: number;
  episodesPerSeries: number;
  products: number;
  /** A link group counts as 1. */
  links: number;
  collabPackages: number;
  reviews: number;
  gearItems: number;
  teamSeats: number;
  socialAccountsPerPlatform: number;
}

export interface PlanConfig {
  key: PlanKey;
  name: string;
  subtitle: string;
  /** null = not sold on that cycle (trial). */
  price: Record<BillingPeriod, Record<PricingCurrency, number> | null>;
  trialDays?: number;
  publicProfile: "during-trial" | "yes";
  limits: PlanLimits;
  themes: ThemeAccess;
  prioritySupport: boolean;
  popular?: boolean;
}

export const PLANS: Record<PlanKey, PlanConfig> = {
  trial: {
    key: "trial",
    name: "Trial",
    subtitle: "Try every basic feature free",
    price: { monthly: { INR: 0, USD: 0 }, yearly: null },
    trialDays: 7,
    publicProfile: "during-trial",
    limits: { series: 3, episodesPerSeries: 5, products: 1, links: 5, collabPackages: 1, reviews: 1, gearItems: 5, teamSeats: 0, socialAccountsPerPlatform: 5 },
    themes: "basics-rainbow",
    prioritySupport: false,
  },
  starter: {
    key: "starter",
    name: "Starter",
    subtitle: "Keep your profile public",
    price: { monthly: { INR: 99, USD: 2.99 }, yearly: { INR: 799, USD: 24 } },
    publicProfile: "yes",
    limits: { series: 3, episodesPerSeries: 5, products: 1, links: 5, collabPackages: 1, reviews: 1, gearItems: 5, teamSeats: 0, socialAccountsPerPlatform: 5 },
    themes: "basics-rainbow",
    prioritySupport: false,
  },
  pro: {
    key: "pro",
    name: "Pro",
    subtitle: "For growing creators",
    price: { monthly: { INR: 199, USD: 4.99 }, yearly: { INR: 1499, USD: 39 } },
    publicProfile: "yes",
    limits: { series: 20, episodesPerSeries: 20, products: 20, links: 20, collabPackages: 3, reviews: 10, gearItems: 20, teamSeats: 0, socialAccountsPerPlatform: 10 },
    themes: "all",
    prioritySupport: false,
    popular: true,
  },
  vip: {
    key: "vip",
    name: "VIP",
    subtitle: "For pro creators & teams",
    price: { monthly: { INR: 399, USD: 9.99 }, yearly: { INR: 2499, USD: 69 } },
    publicProfile: "yes",
    limits: {
      series: Infinity, episodesPerSeries: Infinity, products: Infinity, links: Infinity,
      collabPackages: 10, reviews: Infinity, gearItems: Infinity, teamSeats: 3, socialAccountsPerPlatform: 20,
    },
    themes: "all",
    prioritySupport: true,
  },
};

export const PAID_PLANS: PaidPlanKey[] = ["starter", "pro", "vip"];
export const PLAN_ORDER: PlanKey[] = ["trial", "starter", "pro", "vip"];

/** Stored keys (incl. legacy "early_access", "creator_pro", "creator_VIP") → plan key. */
export function normalizePlanKey(key: string | null | undefined): PlanKey {
  switch (key) {
    case "starter":
      return "starter";
    case "pro":
    case "creator_pro":
      return "pro";
    case "vip":
    case "creator_VIP":
      return "vip";
    default:
      return "trial";
  }
}

export function getPlan(key: string | null | undefined): PlanConfig {
  return PLANS[normalizePlanKey(key)];
}

export function getPlanLimit(key: string | null | undefined, resource: keyof PlanLimits): number {
  return getPlan(key).limits[resource];
}

export function isUnlimited(limit: number) {
  return !Number.isFinite(limit);
}

/** "3", "Unlimited". */
export function formatLimit(limit: number) {
  return isUnlimited(limit) ? "Unlimited" : String(limit);
}

export function formatMoney(amount: number, currency: PricingCurrency = "INR") {
  if (currency === "INR") return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 })}`;
}

export function planPrice(key: PaidPlanKey, period: BillingPeriod, currency: PricingCurrency = "INR"): number {
  return PLANS[key].price[period]![currency];
}

/** Whole-number % saved by paying yearly instead of 12 × monthly. */
export function yearlySavingsPercent(key: PaidPlanKey, currency: PricingCurrency = "INR"): number {
  const monthly = planPrice(key, "monthly", currency) * 12;
  return Math.round((1 - planPrice(key, "yearly", currency) / monthly) * 100);
}

/** Yearly price shown per month (rounded to whole rupees / cents). */
export function yearlyPerMonth(key: PaidPlanKey, currency: PricingCurrency = "INR"): number {
  const perMonth = planPrice(key, "yearly", currency) / 12;
  return currency === "INR" ? Math.round(perMonth) : Math.round(perMonth * 100) / 100;
}

/** Plan order for upgrade/downgrade labels (trial < starter < pro < vip). */
export function planRank(key: string | null | undefined) {
  return PLAN_ORDER.indexOf(normalizePlanKey(key));
}

/** Theme groups each plan can apply (themes/config.ts groups). */
export function canUseThemeGroup(key: string | null | undefined, group: string) {
  return getPlan(key).themes === "all" || group === "basics" || group === "rainbow";
}

/** Up to 7 short lines describing a plan's limits, for plan cards and the landing page. */
export function planFeatureLines(key: PlanKey): string[] {
  const p = PLANS[key];
  const l = p.limits;
  const n = (limit: number, one: string, many = `${one}s`) =>
    isUnlimited(limit) ? `Unlimited ${many}` : `${limit} ${limit === 1 ? one : many}`;
  const lines = [
    `${n(l.series, "series", "series")} · ${isUnlimited(l.episodesPerSeries) ? "unlimited episodes" : `${l.episodesPerSeries} episodes per series`}`,
    n(l.products, "shop product"),
    n(l.links, "link"),
    n(l.collabPackages, "collab package"),
    `${n(l.reviews, "brand review")} · ${n(l.gearItems, "gear item")}`,
    p.themes === "all" ? "All themes" : "Basics + Rainbow themes",
  ];
  if (l.teamSeats > 0) lines.push(`${l.teamSeats} team seats${p.prioritySupport ? " · priority WhatsApp support" : ""}`);
  else if (p.prioritySupport) lines.push("Priority WhatsApp support");
  return lines.slice(0, 7);
}

/** Whether a creator can activate the Premium Look single-vertical layout on their live public profile (Pro & VIP only). */
export function canUsePremiumLayout(key: string | null | undefined): boolean {
  const norm = normalizePlanKey(key);
  return norm === "pro" || norm === "vip";
}
