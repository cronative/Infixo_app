"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ShieldCheck } from "lucide-react";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { Button } from "@/components/ui/Button";
import { SubscriptionService } from "@/services/SubscriptionService";
import { PaidCheckoutService } from "@/services/PaidCheckoutService";
import { OnboardingService } from "@/services/OnboardingService";
import { BillingCycle, PlanKey } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { PricingTable } from "@/components/subscription/PricingTable";

export default function SubscriptionStepPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("pro");
  const [cycle, setCycle] = useState<BillingCycle>("yearly");
  const [activating, setActivating] = useState(false);

  const planMeta = SubscriptionService.getPlan(selectedPlan);

  function handleActivate() {
    setActivating(true);

    // Starter Free Plan activates instantly — no payment required.
    if (selectedPlan === "starter") {
      setTimeout(() => {
        SubscriptionService.activate(selectedPlan, cycle);
        OnboardingService.setStep("finish");
        setActivating(false);
        showToast("Starter Free Plan activated — you're all set! 🎉");
        router.push("/onboarding/finish");
      }, 200);
      return;
    }

    // Paid plans open Razorpay Checkout to authorize payment/subscription;
    // if Razorpay keys aren't configured in environment, fallback to direct trial activation.
    PaidCheckoutService.start(selectedPlan, cycle, {
      onActivated: (sub) => {
        OnboardingService.setStep("finish");
        setActivating(false);
        const plan = SubscriptionService.getPlan(sub.planKey);
        showToast(`${plan.name} Plan added! Your 7-Day Free Trial has started 🎉`);
        router.push("/onboarding/finish");
      },
      onError: (message) => {
        console.warn("Razorpay checkout fallback to direct trial activation:", message);
        SubscriptionService.activate(selectedPlan, cycle);
        OnboardingService.setStep("finish");
        setActivating(false);
        const plan = SubscriptionService.getPlan(selectedPlan);
        showToast(`${plan.name} Plan activated! Start your 7-Day Free Trial 🎉`);
        router.push("/onboarding/finish");
      },
      onDismiss: () => setActivating(false),
    });
  }

  return (
    <OnboardingLayout step="subscription">
      <div className="flex items-center gap-2 text-xs font-bold text-inflixo-purple uppercase tracking-wider mb-1">
        <Sparkles className="h-3.5 w-3.5" />
        Step 5 • Select Subscription Plan
      </div>
      <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-inflixo-navy sm:text-4xl">
        Pick your <span className="text-gradient-premium">creator plan</span>
      </h1>
      <p className="mt-2 text-[15px] text-muted leading-relaxed">
        Choose the best plan for your content goals. All plans include a 7-day free trial.
      </p>

      <div className="mt-6">
        <PricingTable
          selectedPlan={selectedPlan}
          onSelectPlan={setSelectedPlan}
          billingCycle={cycle}
          onBillingCycleChange={setCycle}
          onConfirm={handleActivate}
          confirmLoading={activating}
          ctaText={
            selectedPlan === "free"
              ? `Get Started Free (${planMeta.name})`
              : `Pay & Start Free Trial (${planMeta.name})`
          }
        />
      </div>

      <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted font-medium">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        {selectedPlan === "free"
          ? "Free Basic — No card or payment needed"
          : "Paid plans authorize your card via Razorpay now; first charge is after the 7-day trial"}
      </div>

      {/* Step 5 Sticky Bottom Navigation Actions (Back + Activate) */}
      <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md py-4 border-t border-slate-200/80 mt-8 flex items-center gap-3 max-w-xl mx-auto">
        <Button variant="outline" size="lg" onClick={() => router.push("/onboarding/series")}>
          Back
        </Button>
        <Button fullWidth size="lg" loading={activating} onClick={handleActivate}>
          {selectedPlan === "free" ? `Get Started Free (${planMeta.name})` : `Pay & Start Free Trial (${planMeta.name})`} →
        </Button>
      </div>
    </OnboardingLayout>
  );
}

