"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { Button } from "@/components/ui/Button";
import { SubscriptionService } from "@/services/SubscriptionService";
import { OnboardingService } from "@/services/OnboardingService";
import { BillingCycle, PlanKey } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { PricingTable } from "@/components/subscription/PricingTable";

export default function SubscriptionStepPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedPlan] = useState<PlanKey>("creator");
  const [cycle] = useState<BillingCycle>("monthly");
  const [activating, setActivating] = useState(false);

  function handleActivate() {
    setActivating(true);

    // Direct activation for Early Access phase (No payment/subscription required today).
    setTimeout(() => {
      SubscriptionService.activate(selectedPlan, cycle);
      OnboardingService.setStep("finish");
      setActivating(false);
      showToast("Inflixo Early Access Pass Activated! 100% Free 🚀");
      router.push("/onboarding/finish");
    }, 250);
  }

  return (
    <OnboardingLayout step="subscription">
      <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-[#6366F1]">
        <Sparkles className="h-3.5 w-3.5 text-[#6366F1] shrink-0" />
        <span>Step 5 of 6 • Creator Plan</span>
      </div>
      <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-4xl">
        Activate your <span className="text-gradient-premium">Free Early Access</span>
      </h1>
      <p className="mt-2 text-[15px] text-slate-500 leading-relaxed font-medium">
        Your public Inflixo profile goes live immediately. No credit card or subscription required today.
      </p>

      <div className="mt-6">
        <PricingTable />
      </div>

      {/* Step 5 Sticky Bottom Navigation Actions (Back + Activate) */}
      <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-sm py-4 border-t border-gray-200 -mx-4 sm:-mx-6 px-4 sm:px-6 mt-8 flex items-center gap-3">
        <Button variant="outline" size="lg" onClick={() => router.push("/onboarding/series")}>
          Back
        </Button>
        <Button fullWidth size="lg" loading={activating} onClick={handleActivate}>
          Activate Early Access &amp; Launch Profile →
        </Button>
      </div>
    </OnboardingLayout>
  );
}

