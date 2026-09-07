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
      <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#803D63]/20 bg-[#803D63]/[0.09] px-3 py-1 text-xs font-bold text-[#803D63]">
        <Sparkles className="h-3.5 w-3.5 text-[#803D63] shrink-0" />
        <span>Step 5 of 6 • Creator Plan</span>
      </div>
      <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#181716] sm:text-3xl">
        Activate your Early Access
      </h1>
      <p className="mt-1.5 text-xs sm:text-sm text-[#54514D] leading-relaxed">
        Your public Inflixo profile goes live immediately. No credit card required.
      </p>

      {/* Primary Early Access Card */}
      <div className="mt-6 rounded-2xl border-2 border-[#803D63] bg-white p-6 sm:p-7 shadow-xs text-left relative overflow-hidden">
        {/* Header inside card */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#E7E3DC]">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#803D63]/[0.09] px-3 py-1 text-xs font-bold text-[#803D63] mb-2 border border-[#803D63]/20">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Current Pass</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#181716]">Early Access</h2>
            <p className="text-xs sm:text-sm text-[#54514D] mt-0.5">
              Start building and sharing your complete creator profile.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#797570] block">Status</span>
            <span className="text-xl sm:text-2xl font-bold text-[#803D63]">Active</span>
          </div>
        </div>

        {/* Included Features List */}
        <div className="py-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#797570]">Included:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EARLY_ACCESS_FEATURES.map((feature, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#181716]">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#803D63]/[0.09] text-[#803D63]">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Small Note Box */}
        <div className="rounded-xl bg-[#F8F7F3] border border-[#E7E3DC] p-3.5 text-xs text-[#54514D] font-medium flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#803D63] shrink-0" />
          <span>No credit card required. You’ll be notified before paid plans become available.</span>
        </div>
      </div>

      {/* Upcoming Plans (Compact Coming Soon Cards) */}
      <div className="mt-8 space-y-3 text-left">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#797570]">
            Upcoming Plans
          </h3>
          <span className="text-[11px] font-semibold text-[#797570] bg-[#F8F7F3] px-2.5 py-0.5 rounded-full border border-[#E7E3DC]">
            Coming Soon
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Pro Card */}
          <div className="rounded-2xl border border-[#E7E3DC] bg-white p-5 space-y-3 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base sm:text-lg font-bold text-[#181716]">Pro</h4>
                  <span className="rounded-full bg-[#803D63]/[0.09] border border-[#803D63]/20 px-2 py-0.5 text-[10px] font-bold text-[#803D63]">
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs text-[#54514D] mt-1">
                  For growing creators looking to monetize at scale.
                </p>
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-2 border-t border-[#E7E3DC]">
              <div>
                <span className="text-lg font-bold text-[#181716]">₹499</span>
                <span className="text-xs text-[#797570] font-medium"> / month</span>
              </div>
              <button
                type="button"
                onClick={() => showToast("We'll notify you when Pro is available! 🚀")}
                className="tap-scale inline-flex items-center gap-1.5 rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] hover:bg-[#E7E3DC] px-3 py-1.5 text-xs font-semibold text-[#181716] transition-colors cursor-pointer"
              >
                <Bell className="h-3.5 w-3.5 text-[#803D63]" />
                <span>Notify Me</span>
              </button>
            </div>
          </div>

          {/* VIP Card */}
          <div className="rounded-2xl border border-[#E7E3DC] bg-white p-5 space-y-3 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base sm:text-lg font-bold text-[#181716]">VIP</h4>
                  <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs text-[#54514D] mt-1">
                  For top-tier talent, studios &amp; celebrity creators.
                </p>
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-2 border-t border-[#E7E3DC]">
              <div>
                <span className="text-lg font-bold text-[#181716]">₹1,499</span>
                <span className="text-xs text-[#797570] font-medium"> / month</span>
              </div>
              <button
                type="button"
                onClick={() => showToast("We'll notify you when VIP is available! 👑")}
                className="tap-scale inline-flex items-center gap-1.5 rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] hover:bg-[#E7E3DC] px-3 py-1.5 text-xs font-semibold text-[#181716] transition-colors cursor-pointer"
              >
                <Bell className="h-3.5 w-3.5 text-[#803D63]" />
                <span>Notify Me</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step 5 Form Bottom Navigation (Natural flow, Back + Activate) */}
      <div className="pt-4 border-t border-[#E7E3DC] mt-8 flex flex-col-reverse sm:flex-row items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={activating}
          className="w-full sm:w-auto h-11 rounded-xl border-[#E7E3DC] text-[#181716] hover:bg-[#F8F7F3] font-semibold text-sm px-6"
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
          className="w-full sm:flex-1 h-11 bg-[#803D63] hover:bg-[#6F3456] text-white font-bold text-sm rounded-xl cursor-pointer shadow-xs"
        >
          Activate Early Access &amp; Launch Profile →
        </Button>
      </div>
    </OnboardingLayout>
  );
}

