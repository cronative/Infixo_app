"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Check } from "lucide-react";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { SubscriptionService } from "@/services/SubscriptionService";
import { OnboardingService } from "@/services/OnboardingService";
import { useCreator } from "@/contexts/CreatorContext";
import { PlanKey } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { authRepository } from "@/repositories/localRepository";
import { formatPlanPrice, usePricingCurrency } from "@/lib/pricing";

type LaunchOption = "free" | "starter" | "pro" | "vip";

export default function SubscriptionStepPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { profile, socials, series, theme, totalAudience } = useCreator();
  const pricingCurrency = usePricingCurrency();

  const [selectedOption, setSelectedOption] = useState<LaunchOption>("free");
  const [submitting, setSubmitting] = useState(false);

  const launchOptions: Array<{
    id: LaunchOption;
    name: string;
    badge: string;
    description: string;
    price: string;
    period?: string;
    planKey: PlanKey;
    planName: string;
    recommended?: boolean;
  }> = [
    {
      id: "free",
      name: "Start Free Trial",
      badge: "7 DAYS PUBLIC",
      description: "Try your public profile first. After 7 days, upgrade to keep it public.",
      price: "₹0",
      planKey: "early_access",
      planName: "Free Trial",
    },
    {
      id: "starter",
      name: "Starter Trial",
      badge: "7 DAYS TRIAL",
      description: "Keep your profile public with 3 series, 5 custom links, 1 package and 1 review.",
      price: formatPlanPrice("starter", "monthly", pricingCurrency),
      period: "/ month",
      planKey: "starter",
      planName: "Starter",
    },
    {
      id: "pro",
      name: "Pro Trial",
      badge: "7 DAYS TRIAL",
      description: "20 series, 20 custom links, rate card and default media kit.",
      price: formatPlanPrice("pro", "monthly", pricingCurrency),
      period: "/ month",
      planKey: "creator_pro",
      planName: "Pro",
    },
    {
      id: "vip",
      name: "VIP Trial",
      badge: "RECOMMENDED",
      description: "Unlimited series, links and reviews, plus custom media kit and premium tools.",
      price: formatPlanPrice("vip", "monthly", pricingCurrency),
      period: "/ month",
      planKey: "creator_VIP",
      planName: "VIP",
      recommended: true,
    },
  ];

  async function handleLaunch() {
    if (submitting) return;
    setSubmitting(true);

    const selectedPlan = launchOptions.find((option) => option.id === selectedOption) || launchOptions[0];
    const planKey: PlanKey = selectedPlan.planKey;
    const planName = selectedPlan.planName;
    const email = authRepository.getPendingEmail() || profile?.email || "";

    try {
      // 1. Activate plan locally
      SubscriptionService.activate(planKey, "monthly");

      // 2. Persist to MySQL database
      if (email) {
        await fetch("/api/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            planKey,
            planName,
            billingCycle: "monthly",
          }),
        }).catch((err) => console.warn("Subscription sync warning:", err));
      }

      // 3. Mark onboarding finished
      OnboardingService.setStep("finish");

      if (selectedOption === "free") {
        showToast("🚀 You are LIVE! Welcome to your Inflixo creator page.");
      } else {
        showToast(`🎉 ${planName} trial activated! Welcome to your live profile.`);
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Launch error:", err);
      OnboardingService.setStep("finish");
      router.push("/dashboard");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <OnboardingLayout step="subscription">
      <div className="w-full max-w-[500px] mx-auto pt-4 sm:pt-8 pb-12">
        {/* SINGLE UNIFIED WHITE CARD (Matching Step 1, 2, 3 design) */}
        <div className="rounded-[28px] border border-[#E7E3DC] bg-white p-6 sm:p-9 space-y-6 text-left shadow-[0_4px_24px_rgba(0,0,0,0.035)]">

          {/* 1. Header Section */}
          <div className="space-y-1.5">
            <span className="block text-[11px] font-bold uppercase tracking-widest text-[#151933]">
              STEP 4 OF 4 · PUBLIC PROFILE
            </span>
            <h1 className="font-display text-2xl sm:text-[32px] font-extrabold text-[#181716] tracking-tight leading-tight">
              Your profile is ready to go live!
            </h1>
            <p className="text-xs sm:text-[13px] font-normal text-[#54514D] leading-relaxed pt-0.5">
              Review your public creator profile below. Go live for free or choose a plan to launch.
            </p>
          </div>

          {/* 2. Public Profile Preview Box */}
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-3 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-[#181716] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Public Profile Preview
              </span>
              <span className="text-[11px] font-semibold text-[#151933]">
                inflixo.com/@{profile?.username || "username"}
              </span>
            </div>

            <div className="rounded-xl overflow-hidden shadow-xs border border-[#e2e8f0] bg-white max-h-[360px] overflow-y-auto scrollbar-thin">
              <LivePreviewCard
                profile={profile}
                socials={socials}
                series={series}
                totalAudience={totalAudience}
                themeKey={theme}
                variant="compact"
                isInformational={true}
              />
            </div>
          </div>

          {/* 3. Launch Options */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748b]">
              Choose Launch Option
            </label>

            <div className="space-y-2.5">
              {launchOptions.map((option) => {
                const isSelected = selectedOption === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedOption(option.id)}
                    className={`w-full rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${isSelected
                        ? "border-2 border-[#151933] bg-[#f8fafc] shadow-2xs"
                        : option.recommended
                          ? "border-[#151933]/30 bg-white hover:border-[#151933]"
                          : "border-[#e2e8f0] bg-white hover:border-brand-border"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${isSelected
                              ? "border-[#151933] bg-[#151933] text-white"
                              : "border-[#cbd5e1] bg-white"
                            }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-[#181716]">
                              {option.name}
                            </span>
                            <span className={`${option.recommended ? "bg-[#151933] text-white border-[#151933]" : option.id === "free" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-[#151933]/[0.08] text-[#151933] border-[#151933]/20"} border text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                              {option.badge}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-snug text-[#64748b]">
                            {option.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block text-base font-extrabold text-[#181716]">
                          {option.price}
                        </span>
                        {option.period && (
                          <span className="block text-[10px] font-medium text-[#64748b]">
                            {option.period}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Action Buttons (Back + Go Live / Purchase CTA) */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/onboarding/socials")}
              className="rounded-xl border border-[#cbd5e1] bg-white text-[#181716] font-semibold text-xs sm:text-sm h-12 px-5 hover:bg-surface-soft transition-all cursor-pointer shrink-0"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleLaunch}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#151933] hover:bg-brand-hover text-white font-semibold text-xs sm:text-sm h-12 transition-all cursor-pointer shadow-xs disabled:opacity-60 active:scale-98"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Launching Profile...</span>
                </>
              ) : selectedOption === "free" ? (
                <>
                  <span>Go Live for Free</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>Start {launchOptions.find((option) => option.id === selectedOption)?.planName || "Plan"} Trial</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </OnboardingLayout>
  );
}
