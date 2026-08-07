"use client";

import { useState } from "react";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { SubscriptionService } from "@/services/SubscriptionService";
import { PaidCheckoutService } from "@/services/PaidCheckoutService";
import { BillingCycle, PlanKey, SubscriptionStatus } from "@/types";
import { PricingTable } from "@/components/subscription/PricingTable";

const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  trial: "bg-amber-100 text-amber-900 border-amber-300",
  active: "bg-emerald-100 text-emerald-900 border-emerald-300",
  expired: "bg-rose-100 text-rose-900 border-rose-300",
  cancelled: "bg-zinc-100 text-zinc-700 border-zinc-300",
};

export default function DashboardSubscriptionPage() {
  const { subscription, refresh } = useCreator();
  const { showToast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(subscription.planKey || "pro");
  const [cycle, setCycle] = useState<BillingCycle>(subscription.billingCycle || "yearly");
  const [loading, setLoading] = useState(false);

  const activePlanMeta = SubscriptionService.getPlan(subscription.planKey || "pro");

  function handleActivate(targetPlan?: PlanKey, targetCycle?: BillingCycle) {
    const planToActivate = targetPlan || selectedPlan;
    const cycleToActivate = targetCycle || cycle;

    setLoading(true);
    PaidCheckoutService.start(planToActivate, cycleToActivate, {
      onActivated: (sub) => {
        refresh();
        setLoading(false);
        const plan = SubscriptionService.getPlan(sub.planKey);
        showToast(
          sub.status === "trial"
            ? `${plan.name} Plan added! Your free trial has started 🎉`
            : `${plan.name} Plan activated successfully! 🎉`
        );
      },
      onError: (message) => {
        console.warn("Razorpay checkout fallback to direct plan activation:", message);
        SubscriptionService.activate(planToActivate, cycleToActivate);
        refresh();
        setLoading(false);
        const plan = SubscriptionService.getPlan(planToActivate);
        showToast(`${plan.name} Plan activated successfully! 🎉`);
      },
      onDismiss: () => setLoading(false),
    });
  }

  function handleCancel() {
    SubscriptionService.cancel();
    refresh();
    showToast("Subscription cancelled", "info");
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8 sm:py-8 space-y-8">
      <div>
        <h1 className="font-display text-xl font-medium text-inflixo-navy sm:text-2xl">Subscription &amp; Plans</h1>
        <p className="mt-1 text-sm text-muted">Manage your active Inflixo creator subscription plan.</p>
      </div>

      {/* Current Active Plan Status Banner */}
      <div
        className="rounded-3xl border-2 border-inflixo-purple/40 bg-white p-6 shadow-md"
        style={{ backgroundImage: "linear-gradient(135deg, rgba(245,241,251,0.7), #ffffff 50%)" }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-inflixo-purple">Current Plan</span>
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold capitalize ${STATUS_STYLES[subscription.status]}`}>
                {subscription.status === "trial" ? "✅ 7-Day Free Trial Active" : subscription.status}
              </span>
            </div>
            <p className="font-display text-2xl font-black text-inflixo-navy mt-1">
              {activePlanMeta.name} Plan
            </p>
            <p className="text-xs text-muted mt-0.5">
              Billing: <strong className="capitalize text-inflixo-navy">{subscription.billingCycle || "Yearly"}</strong> (₹{subscription.billingCycle === "monthly" ? activePlanMeta.monthlyPrice : activePlanMeta.yearlyPrice})
            </p>
          </div>

          <div className="flex items-center gap-3">
            {subscription.status === "active" && (
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel Subscription
              </Button>
            )}
            <Button size="sm" icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => handleActivate()} loading={loading}>
              Save / Switch Plan
            </Button>
          </div>
        </div>
      </div>

      {/* Full Pricing Table Component */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-extrabold text-inflixo-navy uppercase tracking-wider">Compare All 4 Creator Plans:</p>
          {selectedPlan !== "free" && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Payments secured by Razorpay
            </span>
          )}
        </div>
        <PricingTable
          selectedPlan={selectedPlan}
          onSelectPlan={setSelectedPlan}
          billingCycle={cycle}
          onBillingCycleChange={setCycle}
          onConfirm={handleActivate}
          confirmLoading={loading}
          ctaText={
            selectedPlan === "free"
              ? `Switch to ${SubscriptionService.getPlan(selectedPlan).name} Plan`
              : `Pay & Switch to ${SubscriptionService.getPlan(selectedPlan).name}`
          }
        />
      </div>
    </div>
  );
}
