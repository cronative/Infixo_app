"use client";

import { useState } from "react";
import { Check, Star, Sparkles, ShieldCheck, RefreshCw, CreditCard } from "lucide-react";
import { BillingCycle, PlanKey } from "@/types";
import { INFLIXO_PLANS } from "@/services/SubscriptionService";

interface PricingTableProps {
  selectedPlan: PlanKey;
  onSelectPlan: (planKey: PlanKey) => void;
  billingCycle: BillingCycle;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  onConfirm?: (targetPlan?: PlanKey) => void;
  confirmLoading?: boolean;
  ctaText?: string;
}

export function PricingTable({
  selectedPlan,
  onSelectPlan,
  billingCycle,
  onBillingCycleChange,
  onConfirm,
  confirmLoading = false,
  ctaText = "Start 7-Day Free Trial",
}: PricingTableProps) {
  const isYearly = billingCycle === "yearly";

  const DISPLAY_CARDS = [
    {
      key: "starter" as PlanKey,
      title: "Starter",
      subTitle: "1 Month Free, then ₹99/month",
      monthlyPrice: 99,
      yearlyPrice: 99,
      yearlyPriceFormatted: "₹99",
      monthlyPriceFormatted: "₹99",
      featuresHeader: "Starter plan includes:",
      features: [
        "1 Month Free Trial",
        "₹99/month after trial",
        "1 OTT Series limit",
        "No theme change (Default theme)",
        "24-Hour Fanbase Data Sync",
        "Instagram, YouTube & Facebook Links",
      ],
      isRecommended: false,
      badgeText: "1 Month Free",
    },
    {
      key: "pro" as PlanKey,
      title: "Pro",
      subTitle: "Best for active creators & series builders",
      monthlyPrice: 199,
      yearlyPrice: 149,
      yearlyPriceFormatted: "₹149",
      monthlyPriceFormatted: "₹199",
      featuresHeader: "Everything in Starter, plus:",
      features: [
        "30 OTT Series limit",
        "All 20 Themes & theme changes",
        "Faster 12-Hour Fanbase Data Sync",
        "Remove Inflixo branding",
        "Priority Creator Support",
      ],
      isRecommended: true,
      badgeText: "Most Popular",
    },
    {
      key: "unlimited" as PlanKey,
      title: "VIP Unlimited",
      subTitle: "For top creators & large brand channels",
      monthlyPrice: 299,
      yearlyPrice: 249,
      yearlyPriceFormatted: "₹249",
      monthlyPriceFormatted: "₹299",
      featuresHeader: "Everything in Pro, plus:",
      features: [
        "Unlimited OTT Series & Shows",
        "Fastest 6-Hour Fanbase Data Sync",
        "All Premium Themes + Custom branding",
        "VIP Dedicated Priority Support",
      ],
      isRecommended: false,
    },
  ];

  return (
    <div className="w-full space-y-10 max-w-6xl mx-auto py-4">
      {/* Header Title & Subtitle matching Screenshot */}
      <div className="text-center space-y-2">
        <h2 className="font-display text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Find the plan for you
        </h2>
        <p className="text-base text-slate-500 font-medium">
          You can cancel at any time. All plans include a 7-day free trial.
        </p>
      </div>

      {/* Monthly vs Yearly Billing Switch Toggle */}
      <div className="flex justify-center items-center gap-3">
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 p-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => onBillingCycleChange("yearly")}
            className={`tap-scale flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold transition-all ${
              isYearly
                ? "bg-[#7C3AED] text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Billed Annually
            <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-black text-amber-950">
              SAVE UP TO 30%
            </span>
          </button>
          <button
            type="button"
            onClick={() => onBillingCycleChange("monthly")}
            className={`tap-scale rounded-full px-5 py-2.5 text-xs font-extrabold transition-all ${
              !isYearly
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Billed Monthly
          </button>
        </div>
      </div>

      {/* 3 Premium Plan Cards Grid matching Screenshot */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-stretch">
        {DISPLAY_CARDS.map((card) => {
          const isSelected = selectedPlan === card.key;
          const displayPrice = isYearly ? card.yearlyPriceFormatted : card.monthlyPriceFormatted;
          const billedSubtext = isYearly
            ? `Billed annually, or ₹${card.monthlyPrice} monthly`
            : `Billed monthly, or save with yearly billing`;

          return (
            <div
              key={card.key}
              onClick={() => onSelectPlan(card.key)}
              className={`relative flex flex-col justify-between rounded-[28px] p-7 transition-all duration-300 cursor-pointer ${
                card.isRecommended
                  ? "bg-[#F5F0FF] border-2 border-[#7C3AED] shadow-xl"
                  : isSelected
                  ? "bg-white border-2 border-[#7C3AED] shadow-lg ring-4 ring-purple-100"
                  : "bg-[#F8F9FA] border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md"
              }`}
            >
              <div>
                {/* Header Title & Badge */}
                <div className="flex items-center justify-between">
                  <h3 className={`font-display text-2xl sm:text-3xl font-black ${
                    card.isRecommended ? "text-[#7C3AED]" : "text-slate-900"
                  }`}>
                    {card.title}
                  </h3>

                  {card.badgeText && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E9D5FF] px-3 py-1 text-xs font-bold text-[#6D28D9]">
                      <Star className="h-3 w-3 fill-[#6D28D9]" />
                      {card.badgeText}
                    </span>
                  )}
                </div>

                {/* Price Display */}
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
                      {displayPrice}
                    </span>
                    <span className="text-sm font-bold text-slate-500">/mo</span>
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-slate-500">
                    {billedSubtext}
                  </p>
                </div>

                {/* Full Width Pill CTA Button directly below price */}
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPlan(card.key);
                      if (onConfirm) onConfirm(card.key);
                    }}
                    disabled={confirmLoading && isSelected}
                    className={`tap-scale w-full rounded-full py-3.5 px-6 text-sm font-extrabold transition-all shadow-xs ${
                      card.isRecommended || isSelected
                        ? "bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md"
                        : "bg-white border border-slate-300 hover:bg-slate-100 text-slate-900"
                    }`}
                  >
                    {confirmLoading && isSelected
                      ? "Processing..."
                      : isSelected
                      ? card.isRecommended
                        ? "Keep Pro access"
                        : "Selected Plan"
                      : card.title === "Starter"
                      ? "Get started"
                      : card.title === "Pro"
                      ? "Keep Pro access"
                      : "Upgrade to Premium"}
                  </button>
                </div>

                {/* Horizontal Divider Line */}
                <div className={`my-6 border-b ${card.isRecommended ? "border-purple-200/80" : "border-slate-200"}`} />

                {/* Features Header */}
                <p className="text-xs font-bold text-slate-600 mb-4">
                  {card.featuresHeader}
                </p>

                {/* Features List with Circle Check Icons */}
                <ul className="space-y-3.5 text-xs font-bold text-slate-900">
                  {card.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                        card.isRecommended
                          ? "bg-[#E9D5FF] text-[#6D28D9]"
                          : "bg-slate-200 text-slate-700"
                      }`}>
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Free Basic Banner Option at Bottom */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="text-left space-y-1">
          <p className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <span>🎁 Looking for 100% Free Plan?</span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
              FREE FOREVER
            </span>
          </p>
          <p className="text-xs font-medium text-slate-500">
            Free Basic includes your personal details &amp; fanbase count with standard theme — zero cost forever.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelectPlan("free");
            if (onConfirm) onConfirm();
          }}
          className={`tap-scale shrink-0 rounded-full px-6 py-2.5 text-xs font-extrabold transition-all ${
            selectedPlan === "free"
              ? "bg-emerald-600 text-white shadow-md"
              : "bg-slate-100 text-slate-900 hover:bg-slate-200"
          }`}
        >
          {selectedPlan === "free" ? "Selected Free Basic" : "Choose Free Basic (₹0)"}
        </button>
      </div>
    </div>
  );
}
