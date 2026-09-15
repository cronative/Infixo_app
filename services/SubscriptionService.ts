import { subscriptionRepository, authRepository } from "@/repositories/localRepository";
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

export function createSubscriptionLifecycle(
  planKey: PlanKey = "early_access",
  billingCycle: BillingCycle = "monthly",
  startedAt = new Date()
): Subscription {
  const plan = INFLIXO_PLANS.find((p) => p.key === planKey) || INFLIXO_PLANS[0];
  const activatedAt = startedAt.toISOString();

  // Free trial is real access, but it does not schedule any renewal.
  if (planKey === "early_access") {
    const trialEndsAt = addDays(startedAt, plan.freeTrialDays || 7).toISOString();

    return {
      planKey,
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
      firstMonthAmount: FIRST_MONTH_OFFER_AMOUNT_INR,
      firstMonthCurrency: "INR",
      autoRenew: false,
    };
  }

  // Paid launch offer: charge the first month once, then stop unless the creator upgrades again.
  const currentPeriodEndsAt =
    billingCycle === "yearly" ? addMonths(startedAt, 12).toISOString() : addMonths(startedAt, 1).toISOString();

  return {
    planKey,
    planName: plan.name,
    billingCycle,
    status: "active",
    activatedAt,
    trialStartedAt: null,
    trialEndsAt: null,
    currentPeriodStartedAt: activatedAt,
    currentPeriodEndsAt,
    renewsAt: null,
    endsAt: currentPeriodEndsAt,
    cancelledAt: null,
    cancelAtPeriodEnd: true,
    paymentMode: "one_time_first_month",
    firstMonthOffer: true,
    firstMonthAmount: FIRST_MONTH_OFFER_AMOUNT_INR,
    firstMonthCurrency: "INR",
    autoRenew: false,
  };
}

export const INFLIXO_PLANS: PlanMeta[] = [
  {
    key: "early_access",
    name: "Free Trial",
    badge: "7 DAYS PUBLIC",
    isPopular: false,
    description: "Try your public creator profile for 7 days. After trial, profile becomes private until you upgrade.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlySavings: 0,
    freeTrialDays: 7,
    publicProfile: true,
    instagram: true,
    youtube: true,
    facebook: true,
    ottSeriesLimit: "Up to 3 Series & 15 Episodes",
    autoDataRefresh: "Limited trial refresh",
    removeBranding: false,
    support: "Standard",
  },
  {
    key: "starter",
    name: "Starter",
    badge: "PUBLIC PROFILE",
    isPopular: false,
    description: "Keep your public Inflixo profile live after the free trial.",
    monthlyPrice: 99,
    yearlyPrice: 999,
    yearlySavings: 189,
    freeTrialDays: 0,
    publicProfile: true,
    instagram: true,
    youtube: true,
    facebook: true,
    ottSeriesLimit: "3 Series & 15 Episodes",
    autoDataRefresh: "Basic refresh",
    removeBranding: false,
    support: "Standard",
  },
  {
    key: "creator_pro",
    name: "Pro",
    badge: "PRO TIER",
    isPopular: false,
    description: "For serious creators who need rate cards, media kit and more content space.",
    monthlyPrice: 199,
    yearlyPrice: 1999,
    yearlySavings: 389,
    freeTrialDays: 0,
    publicProfile: true,
    instagram: true,
    youtube: true,
    facebook: true,
    ottSeriesLimit: "20 Series, 20 Episodes Each",
    autoDataRefresh: "Weekly refresh",
    removeBranding: false,
    support: "Priority",
  },
  {
    key: "creator_VIP",
    name: "VIP",
    badge: "👑 VIP BRAND COLLABS",
    isPopular: true,
    description: "For premium creators who want unlimited content space, custom media kit and stronger collab tools.",
    monthlyPrice: 399,
    yearlyPrice: 3999,
    yearlySavings: 789,
    freeTrialDays: 0,
    publicProfile: true,
    instagram: true,
    youtube: true,
    facebook: true,
    ottSeriesLimit: "Unlimited Series, Episodes, Links & Reviews, 10 Collab Packages",
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
    return INFLIXO_PLANS.find((p) => p.key === key) || INFLIXO_PLANS[0];
  },

  activate(planKey: PlanKey = "early_access", billingCycle: BillingCycle = "yearly"): Subscription {
    const email = authRepository.getPendingEmail();
    const sub = createSubscriptionLifecycle(planKey, billingCycle);

    subscriptionRepository.save(sub);

    // Keep local onboarding fast, then mirror the lifecycle to MySQL in the background.
    if (email) {
      fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ...sub }),
      }).catch((e) => console.error("Failed to save Subscription to MySQL DB:", e));
    }

    return sub;
  },

  async fetchFromDb(): Promise<Subscription | null> {
    const email = authRepository.getPendingEmail();
    if (!email) return null;

    try {
      const res = await fetch(`/api/subscription?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.subscription) {
        const sub: Subscription = {
          planKey: data.subscription.planKey || "early_access",
          planName: data.subscription.planName || "Free Trial",
          billingCycle: data.subscription.billingCycle || "yearly",
          status: data.subscription.status || "trial",
          activatedAt: data.subscription.activatedAt || new Date().toISOString(),
          trialStartedAt: data.subscription.trialStartedAt || null,
          trialEndsAt: data.subscription.trialEndsAt || null,
          currentPeriodStartedAt: data.subscription.currentPeriodStartedAt || null,
          currentPeriodEndsAt: data.subscription.currentPeriodEndsAt || null,
          renewsAt: data.subscription.renewsAt || null,
          endsAt: data.subscription.endsAt || null,
          cancelledAt: data.subscription.cancelledAt || null,
          cancelAtPeriodEnd: Boolean(data.subscription.cancelAtPeriodEnd),
          paymentMode: data.subscription.paymentMode || "free_trial",
          firstMonthOffer: Boolean(data.subscription.firstMonthOffer),
          firstMonthAmount: data.subscription.firstMonthAmount ?? FIRST_MONTH_OFFER_AMOUNT_INR,
          firstMonthCurrency: data.subscription.firstMonthCurrency || "INR",
          autoRenew: Boolean(data.subscription.autoRenew),
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
        body: JSON.stringify({ email, status: "cancelled", cancelledAt }),
      }).catch((e) => console.error("Failed to cancel subscription:", e));
    }

    return sub;
  },
};
