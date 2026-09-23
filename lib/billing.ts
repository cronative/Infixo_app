import { RAZORPAY_RECURRING_PLANS } from "@/lib/razorpayPlans";

export type PaidPlanKey = "starter" | "pro" | "vip";
export type BillingCycle = "monthly" | "yearly";

export function normalizePaidPlan(planKey: unknown): PaidPlanKey | null {
  if (planKey === "starter") return "starter";
  if (planKey === "pro" || planKey === "creator_pro") return "pro";
  if (planKey === "vip" || planKey === "creator_VIP") return "vip";
  return null;
}

export function normalizeBillingCycle(cycle: unknown): BillingCycle | null {
  return cycle === "monthly" || cycle === "yearly" ? cycle : null;
}

export function getPaidPlan(planKey: unknown, cycle: unknown) {
  const normalizedPlan = normalizePaidPlan(planKey);
  const normalizedCycle = normalizeBillingCycle(cycle);
  if (!normalizedPlan || !normalizedCycle) return null;
  const config = RAZORPAY_RECURRING_PLANS[`${normalizedPlan}_${normalizedCycle}`];
  if (!config) return null;
  return {
    planKey: normalizedPlan,
    planName: normalizedPlan === "starter" ? "Starter Plan" : normalizedPlan === "pro" ? "Creator Pro" : "Creator VIP",
    billingCycle: normalizedCycle,
    amount: config.amountInPaise,
    currency: "INR" as const,
  };
}

export function addBillingPeriod(date: Date, cycle: BillingCycle) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + (cycle === "yearly" ? 12 : 1));
  return result;
}

export function toMysqlDate(date: Date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}
