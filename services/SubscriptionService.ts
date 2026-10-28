import { subscriptionRepository, authRepository, profileRepository } from "@/repositories/localRepository";
import { BillingCycle, PlanKey, PlanMeta, Subscription } from "@/types";
import { PAID_PLANS, PLANS, planFeatureLines, planPrice } from "@/config/plans";

const DAY_MS = 24 * 60 * 60 * 1000;
export const FIRST_MONTH_OFFER_AMOUNT_INR = planPrice("starter", "monthly");

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
      planName: plan.name,
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
    trialEndsAt: null,
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

/** Plan metadata derived from config/plans.ts (the single source of truth). */
export const INFLIXO_PLANS: PlanMeta[] = (["trial", ...PAID_PLANS] as const).map((key) => {
  const plan = PLANS[key];
  const isTrial = key === "trial";
  const monthly = plan.price.monthly?.INR ?? 0;
  const yearly = plan.price.yearly?.INR ?? 0;
  const lines = planFeatureLines(key);
  return {
    key: isTrial ? "early_access" : key,
    name: plan.name,
    badge: isTrial ? `${plan.trialDays} DAYS PUBLIC` : undefined,
    isPopular: Boolean(plan.popular),
    description: plan.subtitle,
    monthlyPrice: monthly,
    yearlyPrice: yearly,
    yearlySavings: isTrial ? 0 : monthly * 12 - yearly,
    freeTrialDays: plan.trialDays ?? 0,
    publicProfile: true,
    instagram: true,
    youtube: true,
    facebook: true,
    ottSeriesLimit: lines[0],
    shopProductLimit: lines[1],
    autoDataRefresh: "Every 24 Hours",
    removeBranding: false,
    support: plan.prioritySupport ? "Priority" : "Standard",
  };
});

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
