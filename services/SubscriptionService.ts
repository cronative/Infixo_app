import { subscriptionRepository, authRepository } from "@/repositories/localRepository";
import { BillingCycle, PlanKey, PlanMeta, Subscription } from "@/types";

export const INFLIXO_PLANS: PlanMeta[] = [
  {
    key: "creator",
    name: "Creator",
    badge: "7 DAYS FREE",
    isPopular: true,
    description: "Everything you need to build your Creator Home.",
    monthlyPrice: 199,
    yearlyPrice: 1999,
    yearlySavings: 389,
    freeTrialDays: 7,
    publicProfile: true,
    instagram: true,
    youtube: true,
    facebook: true,
    ottSeriesLimit: "Unlimited Series (3 Free during Early Access)",
    autoDataRefresh: "Every 12 Hours",
    removeBranding: true,
    support: "Priority",
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
    const sub: Subscription = {
      planKey: "early_access",
      planName: "Early Access",
      billingCycle,
      status: "active",
      activatedAt: new Date().toISOString(),
    };

    subscriptionRepository.save(sub);

    // Save activation to Live MySQL Database via API
    if (email) {
      fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          planKey: "early_access",
          planName: "Early Access",
          billingCycle,
        }),
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
          planName: data.subscription.planName || "Early Access",
          billingCycle: data.subscription.billingCycle || "yearly",
          status: data.subscription.status || "active",
          activatedAt: data.subscription.activatedAt || new Date().toISOString(),
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
    const sub: Subscription = { ...current, status: "cancelled" };
    subscriptionRepository.save(sub);

    const email = authRepository.getPendingEmail();
    if (email) {
      fetch("/api/razorpay/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).catch((e) => console.error("Failed to cancel Razorpay subscription:", e));
    }

    return sub;
  },
};
