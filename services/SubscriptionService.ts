import { subscriptionRepository, authRepository } from "@/repositories/localRepository";
import { BillingCycle, PlanKey, PlanMeta, Subscription } from "@/types";

export const INFLIXO_PLANS: PlanMeta[] = [
  {
    key: "early_access",
    name: "Creator Early Access",
    badge: "100% FREE LAUNCH",
    isPopular: false,
    description: "Free during early access phase until Pro & VIP launch.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlySavings: 0,
    freeTrialDays: 0,
    publicProfile: true,
    instagram: true,
    youtube: true,
    facebook: true,
    ottSeriesLimit: "Up to 3 Series & 15 Episodes",
    autoDataRefresh: "Every 24 Hours",
    removeBranding: false,
    support: "Standard",
  },
  {
    key: "creator_pro",
    name: "Creator Pro",
    badge: "PRO TIER",
    isPopular: true,
    description: "Unlimited OTT series & custom domain branding.",
    monthlyPrice: 199,
    yearlyPrice: 1999,
    yearlySavings: 389,
    freeTrialDays: 7,
    publicProfile: true,
    instagram: true,
    youtube: true,
    facebook: true,
    ottSeriesLimit: "Unlimited Series & Episodes",
    autoDataRefresh: "Every 12 Hours",
    removeBranding: true,
    support: "Priority",
  },
  {
    key: "creator_VIP",
    name: "Creator VIP",
    badge: "👑 VIP BRAND COLLABS",
    isPopular: false,
    description: "Media kit, brand rate card & sponsorship portal.",
    monthlyPrice: 299,
    yearlyPrice: 2999,
    yearlySavings: 589,
    freeTrialDays: 7,
    publicProfile: true,
    instagram: true,
    youtube: true,
    facebook: true,
    ottSeriesLimit: "Unlimited Series, Episodes & Gigs",
    autoDataRefresh: "Every 3 Hours",
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
