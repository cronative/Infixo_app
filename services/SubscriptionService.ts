import { subscriptionRepository, authRepository, profileRepository } from "@/repositories/localRepository";
import { BillingCycle, PlanKey, PlanMeta, Subscription } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;
export const FIRST_MONTH_OFFER_AMOUNT_INR = 99;

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function normalizePlanKey(key?: string): PlanKey {
  if (!key) return "early_access";
  if (key === "creator_pro" || key === "pro") return "pro";
  if (key === "creator_VIP" || key === "vip") return "vip";
  if (key === "starter") return "starter";
  return "early_access";
}

export function createSubscriptionLifecycle(
  planKey: PlanKey = "early_access",
  billingCycle: BillingCycle = "monthly",
  startedAt = new Date()
): Subscription {
  const normalizedKey = normalizePlanKey(planKey);
  const plan =
    INFLIXO_PLANS.find((p) => p.key === planKey || p.key === normalizedKey) ||
    INFLIXO_PLANS[0];
  const activatedAt = startedAt.toISOString();

  // Free trial is real access, but it does not schedule any renewal.
  if (normalizedKey === "early_access") {
    const trialEndsAt = addDays(startedAt, plan.freeTrialDays || 7).toISOString();

    return {
      planKey: "early_access",
      planName: plan.name || "Free Trial",
      billingCycle,
      status: "trial",
      activatedAt,
      trialStartedAt: activatedAt,
      trialEndsAt,
      currentPeriodStartedAt: activatedAt,
      currentPeriodEndsAt: trialEndsAt,
      renewsAt: null,
      endsAt: trialEndsAt,
      cancelledAt: null,
      cancelAtPeriodEnd: false,
      paymentMode: "free_trial",
      firstMonthOffer: true,
      firstMonthAmount: 0,
      firstMonthCurrency: "INR",
      autoRenew: false,
      hasUsedTrial: true,
    };
  }

  // Paid subscription: active with auto-renewal for both monthly and yearly cycles.
  const currentPeriodEndsAt =
    billingCycle === "yearly" ? addMonths(startedAt, 12).toISOString() : addMonths(startedAt, 1).toISOString();

  const periodAmount = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

  let existingTrialStartedAt: string | null = null;
  let existingTrialEndsAt: string | null = null;
  let hasUsedTrial = false;

  try {
    const currentSub = typeof window !== "undefined" ? subscriptionRepository.get() : null;
    existingTrialStartedAt = currentSub?.trialStartedAt || null;
    existingTrialEndsAt = currentSub?.trialEndsAt || null;
    hasUsedTrial = Boolean(existingTrialStartedAt || currentSub?.hasUsedTrial || currentSub?.planKey === "early_access");
  } catch {
    // fallback if outside browser
  }

  return {
    planKey: plan.key,
    planName: plan.name,
    billingCycle,
    status: "active",
    activatedAt,
    trialStartedAt: existingTrialStartedAt,
    trialEndsAt: existingTrialEndsAt,
    currentPeriodStartedAt: activatedAt,
    currentPeriodEndsAt,
    renewsAt: currentPeriodEndsAt,
    endsAt: currentPeriodEndsAt,
    cancelledAt: null,
    cancelAtPeriodEnd: false,
    paymentMode: "recurring",
    firstMonthOffer: false,
    firstMonthAmount: periodAmount,
    firstMonthCurrency: "INR",
    autoRenew: true,
    hasUsedTrial,
  };
}

export const INFLIXO_PLANS: PlanMeta[] = [
  {
    key: "early_access",
    name: "Free Trial",
    badge: "7 DAYS PUBLIC",
    isPopular: false,
    description: "Try your public creator profile for 7 days with 1 shop product and 3 series. After trial, profile becomes private until you upgrade.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlySavings: 0,
    freeTrialDays: 7,
    publicProfile: true,
    instagram: true,
    youtube: true,
    facebook: true,
    ottSeriesLimit: "Up to 3 Series & 15 Episodes",
    shopProductLimit: "1 Product in Shop",
    autoDataRefresh: "Limited trial refresh",
    removeBranding: false,
    support: "Standard",
  },
  {
    key: "starter",
    name: "Starter",
    badge: "PUBLIC PROFILE",
    isPopular: false,
    description: "Keep your public Inflixo profile live after the free trial with 1 product in shop and starter limits.",
    monthlyPrice: 99,
    yearlyPrice: 999,
    yearlySavings: 189,
    freeTrialDays: 0,
    publicProfile: true,
    instagram: true,
    youtube: true,
    facebook: true,
    ottSeriesLimit: "3 Series & 15 Episodes",
    shopProductLimit: "1 Product in Shop",
    autoDataRefresh: "Basic refresh",
    removeBranding: false,
    support: "Standard",
  },
  {
    key: "pro",
    name: "Pro",
    badge: "PRO TIER",
    isPopular: false,
    description: "For serious creators who need 20 products in shop (matches 20 series), rate cards, and full media kit.",
    monthlyPrice: 199,
    yearlyPrice: 1999,
    yearlySavings: 389,
    freeTrialDays: 0,
    publicProfile: true,
    instagram: true,
    youtube: true,
    facebook: true,
    ottSeriesLimit: "20 Series, 20 Episodes Each",
    shopProductLimit: "20 Products in Shop (matches 20 series)",
    autoDataRefresh: "Weekly refresh",
    removeBranding: false,
    support: "Priority",
  },
  {
    key: "creator_pro",
    name: "Pro",
    badge: "PRO TIER",
    isPopular: false,
    description: "For serious creators who need 20 products in shop (matches 20 series), rate cards, and full media kit.",
    monthlyPrice: 199,
    yearlyPrice: 1999,
    yearlySavings: 389,
    freeTrialDays: 0,
    publicProfile: true,
    instagram: true,
    youtube: true,
    facebook: true,
    ottSeriesLimit: "20 Series, 20 Episodes Each",
    shopProductLimit: "20 Products in Shop (matches 20 series)",
    autoDataRefresh: "Weekly refresh",
    removeBranding: false,
    support: "Priority",
  },
  {
    key: "vip",
    name: "VIP",
    badge: "👑 VIP BRAND COLLABS",
    isPopular: true,
    description: "For premium creators who want unlimited products in shop, unlimited series, custom media kit and collab tools.",
    monthlyPrice: 399,
    yearlyPrice: 3999,
    yearlySavings: 789,
    freeTrialDays: 0,
    publicProfile: true,
    instagram: true,
    youtube: true,
    facebook: true,
    ottSeriesLimit: "Unlimited Series, Episodes, Links & Reviews, 10 Collab Packages",
    shopProductLimit: "Unlimited Products in Shop",
    autoDataRefresh: "Daily refresh",
    removeBranding: true,
    support: "VIP Dedicated Manager",
  },
  {
    key: "creator_VIP",
    name: "VIP",
    badge: "👑 VIP BRAND COLLABS",
    isPopular: true,
    description: "For premium creators who want unlimited products in shop, unlimited series, custom media kit and collab tools.",
    monthlyPrice: 399,
    yearlyPrice: 3999,
    yearlySavings: 789,
    freeTrialDays: 0,
    publicProfile: true,
    instagram: true,
    youtube: true,
    facebook: true,
    ottSeriesLimit: "Unlimited Series, Episodes, Links & Reviews, 10 Collab Packages",
    shopProductLimit: "Unlimited Products in Shop",
    autoDataRefresh: "Daily refresh",
    removeBranding: true,
    support: "VIP Dedicated Manager",
  },
];

export const SubscriptionService = {
  get(): Subscription {
    return subscriptionRepository.get();
  },

  getPlans(): PlanMeta[] {
    return INFLIXO_PLANS;
  },

  getPlan(key?: PlanKey): PlanMeta {
    if (!key) return INFLIXO_PLANS[0];
    const normalizedKey = normalizePlanKey(key);
    return INFLIXO_PLANS.find((p) => p.key === key || p.key === normalizedKey) || INFLIXO_PLANS[0];
  },

  async activate(
    planKey: PlanKey = "early_access",
    billingCycle: BillingCycle = "yearly",
    overrideEmail?: string
  ): Promise<Subscription> {
    const email =
      overrideEmail ||
      authRepository.getPendingEmail() ||
      profileRepository.get()?.email ||
      authRepository.get()?.email;
    const sub = createSubscriptionLifecycle(planKey, billingCycle);

    subscriptionRepository.save(sub);

    // Paid access is persisted only by verified payment endpoints.
    if (email && planKey === "early_access") {
      try {
        await fetch("/api/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start_trial" }),
        });
      } catch (e) {
        console.error("Failed to save Subscription to MySQL DB:", e);
      }
    }

    return sub;
  },

  async cancelAutoRenew(): Promise<Subscription> {
    const current = subscriptionRepository.get();
    const email =
      authRepository.getPendingEmail() ||
      profileRepository.get()?.email ||
      authRepository.get()?.email;
    const nowIso = new Date().toISOString();
    const updated: Subscription = {
      ...current,
      autoRenew: false,
      renewsAt: null,
      cancelledAt: nowIso,
      cancelAtPeriodEnd: true,
    };

    if (!email) throw new Error("No signed-in account");
    const httpResponse = await fetch("/api/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    const apiResponse = await httpResponse.json().catch(() => null);
    if (!httpResponse.ok || (apiResponse && apiResponse.status === 0)) {
      throw new Error(apiResponse?.message || apiResponse?.error || "Failed to cancel subscription");
    }
    subscriptionRepository.save(updated);

    return updated;
  },

  resumeAutoRenew(): Subscription {
    const current = subscriptionRepository.get();
    const email =
      authRepository.getPendingEmail() ||
      profileRepository.get()?.email ||
      authRepository.get()?.email;
    const nextRenewal = current.currentPeriodEndsAt || current.endsAt || new Date().toISOString();
    const updated: Subscription = {
      ...current,
      autoRenew: true,
      renewsAt: nextRenewal,
      cancelledAt: null,
      cancelAtPeriodEnd: false,
    };

    subscriptionRepository.save(updated);

    return updated;
  },

  async fetchFromDb(overrideEmail?: string): Promise<Subscription | null> {
    const email =
      overrideEmail ||
      authRepository.getPendingEmail() ||
      profileRepository.get()?.email ||
      authRepository.get()?.email;
    if (!email) return null;

    try {
      const httpResponse = await fetch(`/api/subscription?email=${encodeURIComponent(email)}`);
      const apiResponse = await httpResponse.json();
      const subData = apiResponse.data?.subscription || apiResponse.subscription;
      if (httpResponse.ok && (apiResponse.status === 1 || apiResponse.success) && subData) {
        const sub: Subscription = {
          planKey: subData.planKey || "early_access",
          planName: subData.planName || "Free Trial",
          billingCycle: subData.billingCycle || "yearly",
          status: subData.status || "trial",
          activatedAt: subData.activatedAt || new Date().toISOString(),
          trialStartedAt: subData.trialStartedAt || null,
          trialEndsAt: subData.trialEndsAt || null,
          currentPeriodStartedAt: subData.currentPeriodStartedAt || null,
          currentPeriodEndsAt: subData.currentPeriodEndsAt || null,
          renewsAt: subData.renewsAt || null,
          endsAt: subData.endsAt || null,
          cancelledAt: subData.cancelledAt || null,
          cancelAtPeriodEnd: Boolean(subData.cancelAtPeriodEnd),
          paymentMode: subData.paymentMode || "free_trial",
          firstMonthOffer: Boolean(subData.firstMonthOffer),
          firstMonthAmount: subData.firstMonthAmount ?? FIRST_MONTH_OFFER_AMOUNT_INR,
          firstMonthCurrency: subData.firstMonthCurrency || "INR",
          autoRenew: Boolean(subData.autoRenew),
        };
        subscriptionRepository.save(sub);
        return sub;
      }
    } catch (e) {
      console.warn("Failed to fetch subscription from DB:", e);
    }
    return null;
  },

  cancel(): Subscription {
    const current = subscriptionRepository.get();
    const cancelledAt = new Date().toISOString();
    const sub: Subscription = {
      ...current,
      status: "cancelled",
      cancelledAt,
      autoRenew: false,
      renewsAt: null,
    };
    subscriptionRepository.save(sub);

    const email = authRepository.getPendingEmail();
    if (email) {
      fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      }).catch((e) => console.error("Failed to cancel subscription:", e));
    }

    return sub;
  },
};
