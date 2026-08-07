import { subscriptionRepository, authRepository } from "@/repositories/localRepository";
import { BillingCycle, PlanKey, PlanMeta, Subscription } from "@/types";

export const INFLIXO_PLANS: PlanMeta[] = [
  {
    key: "starter",
    name: "Starter",
    badge: "7 DAYS FREE",
    description: "7-Day Free Trial, then ₹99/mo. Includes 1 series, default theme & 24h fanbase sync.",
    monthlyPrice: 99,
    yearlyPrice: 99,
    yearlySavings: 0,
    freeTrialDays: 7,
    publicProfile: true,
    instagram: true,
    youtube: true,
    facebook: true,
    ottSeriesLimit: "1 Series",
    autoDataRefresh: "Every 24 Hours",
    removeBranding: false,
    support: "Standard",
  },
  {
    key: "pro",
    name: "Pro",
    isPopular: true,
    badge: "7 DAYS FREE",
    description: "7-Day Free Trial, best for active creators wanting 30 series & 12h fanbase sync.",
    monthlyPrice: 199,
    yearlyPrice: 149,
    yearlySavings: 600,
    freeTrialDays: 7,
    publicProfile: true,
    instagram: true,
    youtube: true,
    facebook: true,
    ottSeriesLimit: "30 Series",
    autoDataRefresh: "Every 12 Hours",
    removeBranding: true,
    support: "Priority",
  },
  {
    key: "unlimited",
    name: "VIP Unlimited",
    badge: "7 DAYS FREE",
    description: "7-Day Free Trial, ultimate plan with unlimited series & 6h data sync.",
    monthlyPrice: 299,
    yearlyPrice: 249,
    yearlySavings: 600,
    freeTrialDays: 7,
    publicProfile: true,
    instagram: true,
    youtube: true,
    facebook: true,
    ottSeriesLimit: "Unlimited Series",
    autoDataRefresh: "Every 6 Hours",
    removeBranding: true,
    support: "VIP Dedicated",
  },
];

export const SubscriptionService = {
  get(): Subscription {
    return subscriptionRepository.get();
  },

  getPlans(): PlanMeta[] {
    return INFLIXO_PLANS;
  },

  getPlan(key: PlanKey): PlanMeta {
    return INFLIXO_PLANS.find((p) => p.key === key) || INFLIXO_PLANS[2];
  },

  activate(planKey: PlanKey, billingCycle: BillingCycle): Subscription {
    const email = authRepository.getPendingEmail();
    const plan = this.getPlan(planKey);
    const sub: Subscription = {
      planKey: plan.key,
      planName: `${plan.name} Plan`,
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
          planKey: plan.key,
          planName: `${plan.name} Plan`,
          billingCycle,
        }),
      }).catch((e) => console.error("Failed to save Subscription to MySQL DB:", e));
    }

    return sub;
  },

  cancel(): Subscription {
    const current = subscriptionRepository.get();
    const sub: Subscription = { ...current, status: "cancelled" };
    subscriptionRepository.save(sub);

    // Cancel the underlying Razorpay mandate too (no-op server-side if the
    // creator is on Free Basic / has no live subscription), so they actually
    // stop being billed instead of just changing local UI state.
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
