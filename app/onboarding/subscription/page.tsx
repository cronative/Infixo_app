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

  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedOption, setSelectedOption] = useState<LaunchOption>("free");
  const [submitting, setSubmitting] = useState(false);

  const launchOptions: Array<{
    id: LaunchOption;
    name: string;
    badge?: string;
    price: string;
    period?: string;
    planKey: PlanKey;
    planName: string;
    bullets: string[];
    recommended?: boolean;
  }> = [
    {
      id: "free",
      name: "Free Trial",
      badge: "No card needed",
      price: "₹0",
      period: "7 days",
      planKey: "early_access",
      planName: "Free Trial",
      bullets: [
        "Public inflixo.com bio link for 7 days",
        "Up to 3 video series & 5 custom links",
        "1 shop product & 1 brand collab package",
      ],
    },
    {
      id: "starter",
      name: "Starter",
      price: formatPlanPrice("starter", billingCycle, pricingCurrency),
      period: billingCycle === "yearly" ? "/ year" : "/ month",
      planKey: "starter",
      planName: "Starter",
      bullets: [
        "Custom profile themes & social stats",
        "Up to 3 video series & 5 custom links",
        "1 brand collab package & 1 testimonial",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      badge: "Most popular",
      recommended: true,
      price: formatPlanPrice("pro", billingCycle, pricingCurrency),
      period: billingCycle === "yearly" ? "/ year" : "/ month",
      planKey: "creator_pro",
      planName: "Pro",
      bullets: [
        "Up to 20 video series (400 episodes)",
        "20 shop products & 20 custom links",
        "Creator Rate Card & Media Kit included",
      ],
    },
    {
      id: "vip",
      name: "VIP",
      price: formatPlanPrice("vip", billingCycle, pricingCurrency),
      period: billingCycle === "yearly" ? "/ year" : "/ month",
      planKey: "creator_VIP",
      planName: "VIP",
      bullets: [
        "Unlimited video series, shop & links",
        "Unlimited testimonials & collab packages",
        "Custom Media Kit & VIP priority support",
      ],
    },
  ];

  async function handleLaunch(optionId: LaunchOption = selectedOption) {
    if (submitting) return;
    setSubmitting(true);

    const selectedPlan = launchOptions.find((option) => option.id === optionId) || launchOptions[0];
    const planKey: PlanKey = selectedPlan.planKey;
    const planName = selectedPlan.planName;
    const email = authRepository.getPendingEmail() || profile?.email || "";

    try {
      if (optionId !== "free") {
        OnboardingService.setStep("finish");
        showToast(`Redirecting to checkout for ${planName}...`);
        router.push(`/checkout?plan=${optionId}&cycle=${billingCycle}&from=onboarding`);
        return;
      }

      // Activate Free tier immediately
      await SubscriptionService.activate(planKey, "monthly", email);
      OnboardingService.setStep("finish");
      showToast("🚀 You are LIVE! Welcome to your Inflixo creator page.");
      router.push("/dashboard");
    } catch (err) {
      console.error("Launch error:", err);
      OnboardingService.setStep("finish");
      router.push("/dashboard");
    } finally {
      setSubmitting(false);
    }
  }

  // Get dynamic button label
  const selectedPlanObj = launchOptions.find((o) => o.id === selectedOption) || launchOptions[0];
  const ctaLabel =
    selectedOption === "free"
      ? "Start 7-Day Free Trial 🚀"
      : `Go Live with ${selectedPlanObj.name} – ${selectedPlanObj.price}${billingCycle === "yearly" ? "/yr" : "/mo"}`;

  return (
    <OnboardingLayout step="subscription">
      <div className="w-full max-w-[460px] mx-auto pt-0 sm:pt-1 pb-4">
        {/* SINGLE UNIFIED WHITE CARD */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 sm:p-5 space-y-3.5 text-left shadow-xs">

          {/* 1. Header Section */}
          <div className="space-y-1">
            <h1 className="font-display text-xl sm:text-[24px] font-extrabold text-[#181716] tracking-tight leading-tight">
              Your profile is ready to go live!
            </h1>
            <p className="text-xs font-normal text-[#54514D] leading-relaxed">
              Start with a 7-day free trial to launch instantly, or pick a paid plan.
            </p>
          </div>

          {/* 2. Public Profile Preview Box */}
          <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-2 sm:p-2.5 space-y-1.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-xs font-bold text-[#181716] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Preview
              </span>
              <span className="text-[11px] font-semibold text-[#7A2253]">
                inflixo.com/{profile?.username || "username"}
              </span>
            </div>

            <div className="rounded-xl overflow-hidden shadow-2xs border border-[#e2e8f0] bg-white">
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

          {/* 3. Billing Period Toggle */}
          <div className="flex items-center justify-between pt-0.5 px-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
              Choose Your Plan
            </span>
            <div className="inline-flex items-center p-0.5 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  billingCycle === "monthly"
                    ? "bg-white text-[#181716] shadow-xs"
                    : "text-[#64748b] hover:text-[#181716]"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  billingCycle === "yearly"
                    ? "bg-[#7A2253] text-white shadow-xs"
                    : "text-[#7A2253] hover:text-[#7A2253]/80"
                }`}
              >
                <span>Yearly</span>
                <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-emerald-500 text-white">Save</span>
              </button>
            </div>
          </div>

          {/* 4. Plans List */}
          <div className="space-y-2">
            {launchOptions.map((option) => {
              const isSelected = selectedOption === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedOption(option.id)}
                  className={`w-full rounded-xl border p-2.5 sm:p-3 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-2 border-[#7A2253] bg-[#f8fafc] shadow-xs"
                      : option.recommended
                      ? "border-[#7A2253]/35 bg-white hover:border-[#7A2253]"
                      : "border-[#e2e8f0] bg-white hover:border-brand-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2.5">
                      {/* Radio Dot */}
                      <div
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                          isSelected
                            ? "border-[#7A2253] bg-[#7A2253] text-white"
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
                          {option.badge && (
                            <span
                              className={`border text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                option.recommended
                                  ? "bg-[#7A2253] text-white border-transparent"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              {option.badge}
                            </span>
                          )}
                        </div>

                        {/* Bullet Points */}
                        <ul className="mt-1 space-y-0.5">
                          {option.bullets.map((bullet, idx) => (
                            <li
                              key={idx}
                              className="text-[10.5px] leading-tight text-[#64748b] flex items-center gap-1"
                            >
                              <span className="h-1 w-1 rounded-full bg-[#94a3b8] shrink-0" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-[11px] font-semibold leading-relaxed text-[#7A2253]">
                          {option.id === "free"
                            ? "After 7 days, your profile will be private. Upgrade to keep it public."
                            : "Your profile stays public while your subscription is active."}
                        </p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right shrink-0">
                      <span className="block text-xs sm:text-sm font-extrabold text-[#181716]">
                        {option.price}
                      </span>
                      {option.period && (
                        <span className="block text-[9.5px] font-medium text-[#64748b]">
                          {option.period}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 5. Action Buttons (Back + Dynamic CTA) */}
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
              onClick={() => handleLaunch(selectedOption)}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#7A2253] hover:opacity-95 text-white font-semibold text-xs sm:text-sm h-10.5 sm:h-11 transition-all cursor-pointer shadow-md shadow-[#7A2253]/20 disabled:opacity-60 active:scale-98"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Launching Profile...</span>
                </>
              ) : (
                <>
                  <span>{ctaLabel}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {/* 6. Skip for Now / Direct Free Launch Option */}
          <div className="pt-0.5 text-center space-y-1">
            <button
              type="button"
              onClick={() => handleLaunch("free")}
              disabled={submitting}
              className="text-xs font-semibold text-[#7A2253] hover:underline cursor-pointer transition-colors"
            >
              Skip for now &amp; start 7-day free trial →
            </button>
            <p className="text-[10px] text-[#64748b]">
              ⚡ No credit card needed · Supports UPI, Cards &amp; NetBanking · Upgrade anytime
            </p>
          </div>

        </div>
      </div>
    </OnboardingLayout>
  );
}
