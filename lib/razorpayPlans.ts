import Razorpay from "razorpay";

export interface PlanConfig {
  key: string;
  name: string;
  period: "monthly" | "yearly";
  amountInPaise: number;
  description: string;
}

export const RAZORPAY_RECURRING_PLANS: Record<string, PlanConfig> = {
  starter_monthly: {
    key: "starter_monthly",
    name: "Inflixo Starter Monthly",
    period: "monthly",
    amountInPaise: 9900, // ₹99
    description: "Inflixo Starter plan billed monthly with recurring auto-renewal",
  },
  starter_yearly: {
    key: "starter_yearly",
    name: "Inflixo Starter Yearly",
    period: "yearly",
    amountInPaise: 99900, // ₹999
    description: "Inflixo Starter plan billed yearly with recurring auto-renewal",
  },
  pro_monthly: {
    key: "pro_monthly",
    name: "Inflixo Pro Monthly",
    period: "monthly",
    amountInPaise: 19900, // ₹199
    description: "Inflixo Pro plan billed monthly with recurring auto-renewal",
  },
  pro_yearly: {
    key: "pro_yearly",
    name: "Inflixo Pro Yearly",
    period: "yearly",
    amountInPaise: 199900, // ₹1999
    description: "Inflixo Pro plan billed yearly with recurring auto-renewal",
  },
  vip_monthly: {
    key: "vip_monthly",
    name: "Inflixo VIP Monthly",
    period: "monthly",
    amountInPaise: 39900, // ₹399
    description: "Inflixo VIP plan billed monthly with recurring auto-renewal",
  },
  vip_yearly: {
    key: "vip_yearly",
    name: "Inflixo VIP Yearly",
    period: "yearly",
    amountInPaise: 399900, // ₹3999
    description: "Inflixo VIP plan billed yearly with recurring auto-renewal",
  },
};

// In-memory cache of created Razorpay Plan IDs to prevent duplicate plan creations
const planIdCache = new Map<string, string>();

export async function getOrCreateRazorpayPlan(
  razorpay: Razorpay,
  planKey: string,
  billingCycle: "monthly" | "yearly" = "monthly"
): Promise<string> {
  const normalizedKey =
    planKey === "creator_pro" || planKey === "pro"
      ? "pro"
      : planKey === "creator_VIP" || planKey === "vip"
      ? "vip"
      : "starter";

  const configKey = `${normalizedKey}_${billingCycle}`;
  const config = RAZORPAY_RECURRING_PLANS[configKey] || RAZORPAY_RECURRING_PLANS.starter_monthly;

  // Check cache first
  if (planIdCache.has(configKey)) {
    return planIdCache.get(configKey)!;
  }

  try {
    // 1. Check existing plans on Razorpay account
    const existingPlans = await razorpay.plans.all({ count: 50 });
    const match = existingPlans.items?.find((p: any) => {
      return (
        p.item?.name === config.name &&
        p.item?.amount === config.amountInPaise &&
        p.period === config.period
      );
    });

    if (match && match.id) {
      planIdCache.set(configKey, match.id);
      return match.id;
    }
  } catch (err) {
    console.warn("Could not list existing Razorpay plans, attempting creation:", err);
  }

  // 2. Create new plan on Razorpay
  const newPlan = await razorpay.plans.create({
    period: config.period,
    interval: 1,
    item: {
      name: config.name,
      amount: config.amountInPaise,
      currency: "INR",
      description: config.description,
    },
  });

  planIdCache.set(configKey, newPlan.id);
  return newPlan.id;
}
