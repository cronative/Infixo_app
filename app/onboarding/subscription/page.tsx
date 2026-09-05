"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Check, ShieldCheck, Bell } from "lucide-react";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { Button } from "@/components/ui/Button";
import { SubscriptionService } from "@/services/SubscriptionService";
import { OnboardingService } from "@/services/OnboardingService";
import { BillingCycle, PlanKey } from "@/types";
import { useToast } from "@/contexts/ToastContext";

const EARLY_ACCESS_FEATURES = [
  "Up to 3 content series",
  "Up to 15 total episodes",
  "1 creator service and rate card",
  "Total Fanbase",
  "Social profiles and custom links",
  "Client reviews",
  "Direct brand inquiries",
  "Public creator profile",
];

export default function SubscriptionStepPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedPlan] = useState<PlanKey>("creator");
  const [cycle] = useState<BillingCycle>("monthly");
  const [activating, setActivating] = useState(false);

  function handleActivate() {
    if (activating) return;
    setActivating(true);

    // Direct activation for Early Access phase (No payment/subscription required today).
    setTimeout(() => {
      SubscriptionService.activate(selectedPlan, cycle);
      OnboardingService.setStep("finish");
      setActivating(false);
      showToast("Early Access Activated! Welcome to Inflixo 🚀");
      router.push("/onboarding/finish");
    }, 250);
  }

  return (
    <OnboardingLayout step="subscription">
      <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#803D63]/20 bg-[#803D63]/10 px-3 py-1 text-xs font-bold text-[#803D63]">
        <Sparkles className="h-3.5 w-3.5 text-[#803D63] shrink-0" />
        <span>Step 5 of 6 • Creator Plan</span>
      </div>
      <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-4xl">
        Activate your <span className="text-gradient-premium">Early Access</span>
      </h1>
      <p className="mt-2 text-[15px] text-slate-500 leading-relaxed font-medium">
        Your public Inflixo profile goes live immediately. No credit card required.
      </p>

      {/* Primary Early Access Card */}
      <div className="mt-6 rounded-3xl border-2 border-[#803D63] bg-white p-6 sm:p-8 shadow-xs text-left relative overflow-hidden">
        {/* Header inside card */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#803D63]/10 px-3 py-1 text-xs font-bold text-[#803D63] mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Current Pass</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900">Early Access</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Start building and sharing your complete creator profile.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Status</span>
            <span className="text-xl sm:text-2xl font-black text-[#803D63]">Active</span>
          </div>
        </div>

        {/* Included Features List */}
        <div className="py-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Included:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EARLY_ACCESS_FEATURES.map((feature, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#803D63]/10 text-[#803D63]">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Small Note Box */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs text-slate-600 font-medium flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#803D63] shrink-0" />
          <span>No credit card required. You’ll be notified before paid plans become available.</span>
        </div>
      </div>

      {/* Upcoming Plans (Compact Coming Soon Cards) */}
      <div className="mt-8 space-y-3 text-left">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Upcoming Plans
          </h3>
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
            Coming Soon
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Pro Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-slate-900">Pro</h4>
                  <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-bold text-[#803D63]">
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  For growing creators looking to monetize at scale.
                </p>
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
              <div>
                <span className="text-lg font-extrabold text-slate-900">₹499</span>
                <span className="text-xs text-slate-500 font-medium"> / month</span>
              </div>
              <button
                type="button"
                onClick={() => showToast("We'll notify you when Pro is available! 🚀")}
                className="tap-scale inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                <Bell className="h-3.5 w-3.5 text-[#803D63]" />
                <span>Notify Me</span>
              </button>
            </div>
          </div>

          {/* VIP Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-slate-900">VIP</h4>
                  <span className="rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  For top-tier talent, studios &amp; celebrity creators.
                </p>
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
              <div>
                <span className="text-lg font-extrabold text-slate-900">₹1,499</span>
                <span className="text-xs text-slate-500 font-medium"> / month</span>
              </div>
              <button
                type="button"
                onClick={() => showToast("We'll notify you when VIP is available! 👑")}
                className="tap-scale inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                <Bell className="h-3.5 w-3.5 text-[#803D63]" />
                <span>Notify Me</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step 5 Form Bottom Navigation (Natural flow, Back + Activate) */}
      <div className="pt-4 border-t border-[#E5E7EB] mt-8 flex flex-col-reverse sm:flex-row items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={activating}
          className="w-full sm:w-auto h-12 rounded-xl border-[#E5E7EB] text-slate-700 hover:bg-slate-50 font-bold text-sm px-6"
          onClick={() => router.push("/onboarding/series")}
        >
          Back
        </Button>
        <Button
          type="button"
          fullWidth
          size="lg"
          loading={activating}
          disabled={activating}
          onClick={handleActivate}
          className="w-full sm:flex-1 h-12 bg-[#803D63] hover:bg-[#6D3254] text-white font-bold text-sm rounded-xl cursor-pointer shadow-none"
        >
          Activate Early Access &amp; Launch Profile →
        </Button>
      </div>
    </OnboardingLayout>
  );
}

