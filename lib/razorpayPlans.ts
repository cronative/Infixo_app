import Razorpay from "razorpay";
import { PAID_PLANS, PLANS, planPrice } from "@/config/plans";

export interface PlanConfig {
  key: string;
  name: string;
  period: "monthly" | "yearly";
  amountInPaise: number;
  description: string;
}

/** Razorpay recurring plans; amounts come from config/plans.ts (INR). */
export const RAZORPAY_RECURRING_PLANS: Record<string, PlanConfig> = Object.fromEntries(
  PAID_PLANS.flatMap((plan) =>
    (["monthly", "yearly"] as const).map((period) => [
      `${plan}_${period}`,
      {
        key: `${plan}_${period}`,
        name: `Inflixo ${PLANS[plan].name} ${period === "monthly" ? "Monthly" : "Yearly"}`,
        period,
        amountInPaise: planPrice(plan, period, "INR") * 100,
        description: `Inflixo ${PLANS[plan].name} plan billed ${period} with recurring auto-renewal`,
      },
    ]),
  ),
);

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
