"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ShieldCheck } from "lucide-react";
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
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("creator");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
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
      <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
        <Sparkles className="h-3.5 w-3.5" />
        Step 5 • Select Creator Plan
      </div>
      <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-4xl">
        Pick your <span className="text-gradient-premium">creator plan</span>
      </h1>
      <p className="mt-2 text-[15px] text-slate-500 leading-relaxed font-medium">
        Build your official Creator Home. Free Early Access active — no subscription or credit card needed today.
      </p>

      <div className="mt-6">
        <PricingTable />
      </div>

      <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        <span>Early Access Active — Free Profile &amp; up to 3 Series Listing</span>
      </div>

      {/* Step 5 Sticky Bottom Navigation Actions (Back + Activate) */}
      <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md py-4 border-t border-slate-200/80 mt-8 flex items-center gap-3 max-w-xl mx-auto">
        <Button variant="outline" size="lg" onClick={() => router.push("/onboarding/series")}>
          Back
        </Button>
        <Button fullWidth size="lg" loading={activating} onClick={handleActivate}>
          Join Free Early Access →
        </Button>
      </div>
    </OnboardingLayout>
  );
}
