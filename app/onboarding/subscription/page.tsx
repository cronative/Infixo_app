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
  const { profile, socials, series, theme, totalAudience, subscription } = useCreator();
  const pricingCurrency = usePricingCurrency();

  const hasSelectedFreeTrial = Boolean(
    subscription?.hasUsedTrial ||
    subscription?.trialStartedAt ||
    subscription?.paymentMode === "free_trial" ||
    subscription?.planKey === "early_access" ||
    (subscription?.activatedAt && subscription?.status)
  );

  const [selectedOption, setSelectedOption] = useState<LaunchOption>(
    hasSelectedFreeTrial ? "starter" : "free"
  );
  const [submitting, setSubmitting] = useState(false);

  const allLaunchOptions: Array<{
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
        name: "7-Day Free Trial",
        badge: "₹0 · NO CARD NEEDED",
        description: "Launch your public profile instantly for 7 days with 1 product in shop & 3 series. No card required.",
        price: "₹0",
        planKey: "early_access",
        planName: "Free Trial",
      },
      {
        id: "starter",
        name: "Starter Plan",
        badge: "POPULAR",
        description: "Keep your profile public with 1 product in shop, 3 series, 5 custom links, 1 package and 1 review.",
        price: formatPlanPrice("starter", "monthly", pricingCurrency),
        period: "/ month",
        planKey: "starter",
        planName: "Starter",
      },
      {
        id: "pro",
        name: "Pro Plan",
        badge: "BEST VALUE",
        description: "20 products in shop (matches 20 series), 20 links, rate card and default media kit.",
        price: formatPlanPrice("pro", "monthly", pricingCurrency),
        period: "/ month",
        planKey: "creator_pro",
        planName: "Pro",
      },
      {
        id: "vip",
        name: "VIP Plan",
        badge: "RECOMMENDED",
        description: "Unlimited products in shop, unlimited series, links & reviews, plus custom media kit.",
        price: formatPlanPrice("vip", "monthly", pricingCurrency),
        period: "/ month",
        planKey: "creator_VIP",
        planName: "VIP",
        recommended: true,
      },
    ];

  const launchOptions = hasSelectedFreeTrial
    ? allLaunchOptions.filter((opt) => opt.id !== "free")
    : allLaunchOptions;

  async function handleLaunch() {
    if (submitting) return;
    setSubmitting(true);

    const selectedPlan = launchOptions.find((option) => option.id === selectedOption) || launchOptions[0];
    const planKey: PlanKey = selectedPlan.planKey;
    const planName = selectedPlan.planName;
    const email = authRepository.getPendingEmail() || profile?.email || "";

    try {
      if (selectedOption !== "free") {
        OnboardingService.setStep("finish");
        showToast(`Complete Razorpay checkout to activate ${planName}.`);
        router.push("/dashboard/subscription");
        return;
      }

      // 1. Activate plan locally
      await SubscriptionService.activate(planKey, "monthly", email);

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
      <div className="w-full max-w-[460px] mx-auto pt-0 sm:pt-1 pb-4">
        {/* SINGLE UNIFIED WHITE CARD */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 sm:p-5 space-y-3 text-left shadow-xs">

          {/* 1. Header Section */}
          <div className="space-y-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#043084]">
              STEP 4 OF 4 · PUBLIC PROFILE
            </span>
            <h1 className="font-display text-xl sm:text-[24px] font-extrabold text-[#181716] tracking-tight leading-tight">
              Your profile is ready to go live!
            </h1>
            <p className="text-xs font-normal text-[#54514D] leading-relaxed">
              Review your public creator profile below. Go live for free or choose a plan to launch.
            </p>
          </div>

          {/* 2. Public Profile Preview Box */}
          <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-2 sm:p-2.5 space-y-1.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-xs font-bold text-[#181716] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Preview
              </span>
              <span className="text-[11px] font-semibold text-[#043084]">
                inflixo.com/@{profile?.username || "username"}
              </span>
            </div>

            <div className="rounded-lg overflow-hidden shadow-2xs border border-[#e2e8f0] bg-white max-h-[220px] sm:max-h-[240px] overflow-y-auto scrollbar-thin">
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
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
              Choose Launch Option
            </label>

            <div className="space-y-1.5">
              {launchOptions.map((option) => {
                const isSelected = selectedOption === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedOption(option.id)}
                    className={`w-full rounded-xl border p-2 sm:p-2.5 text-left transition-all cursor-pointer ${isSelected
                      ? "border-2 border-[#043084] bg-[#f8fafc] shadow-2xs"
                      : option.recommended
                        ? "border-[#043084]/30 bg-white hover:border-[#043084]"
                        : "border-[#e2e8f0] bg-white hover:border-brand-border"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-2">
                        <div
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${isSelected
                            ? "border-[#043084] bg-[#043084] text-white"
                            : "border-[#cbd5e1] bg-white"
                            }`}
                        >
                          {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs sm:text-[13px] font-bold text-[#181716]">
                              {option.name}
                            </span>
                            <span className={`${option.recommended ? "bg-[#043084] text-white border-[#043084]" : option.id === "free" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-[#043084]/[0.08] text-[#043084] border-[#043084]/20"} border text-[9px] font-bold px-1.5 py-0.2 rounded-full`}>
                              {option.badge}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[10.5px] leading-tight text-[#64748b]">
                            {option.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block text-xs sm:text-sm font-extrabold text-[#181716]">
                          {option.price}
                        </span>
                        {option.period && (
                          <span className="block text-[9px] font-medium text-[#64748b]">
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
          <div className="pt-0.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/onboarding/socials")}
              className="rounded-xl border border-[#cbd5e1] bg-white text-[#181716] font-semibold text-xs sm:text-sm h-10.5 sm:h-11 px-3.5 hover:bg-surface-soft transition-all cursor-pointer shrink-0"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleLaunch}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#043084] hover:bg-brand-hover text-white font-semibold text-xs sm:text-sm h-10.5 sm:h-11 transition-all cursor-pointer shadow-xs disabled:opacity-60 active:scale-98"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Launching Profile...</span>
                </>
              ) : selectedOption === "free" ? (
                <>
                  <span>Launch Free Profile 🚀</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>Continue to Secure Checkout 🔒</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <p className="text-[10px] text-center text-[#64748b] pt-0.5">
            No credit card needed for Free Trial · Upgrade or cancel anytime
          </p>

        </div>
      </div>
    </OnboardingLayout>
  );
}
