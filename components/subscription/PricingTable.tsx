"use client";

import { useState } from "react";
import { Check, Bell, Minus, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { BillingCycle, PlanKey } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { useCreator } from "@/contexts/CreatorContext";
import { SubscriptionService } from "@/services/SubscriptionService";
import { authRepository, profileRepository } from "@/repositories/localRepository";
import { formatPlanPrice, getPlanPrice, usePricingCurrency } from "@/lib/pricing";
import { RazorpayCheckoutButton } from "@/components/checkout/RazorpayCheckoutButton";

interface PricingTableProps {
  selectedPlan?: PlanKey;
  onSelectPlan?: (planKey: PlanKey) => void;
  billingCycle?: BillingCycle;
  onBillingCycleChange?: (cycle: BillingCycle) => void;
  showEarlyAccessBanner?: boolean;
  hideFreeTrial?: boolean;
}

export function PricingTable({ hideFreeTrial }: PricingTableProps) {
  const { showToast } = useToast();
  const { profile, subscription, refresh } = useCreator();
  const [notifiedPlan, setNotifiedPlan] = useState<string | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const currency = usePricingCurrency();

  // Once a user has selected/used free trial, do not show Free Trial in the plans list
  const hasSelectedFreeTrial = Boolean(
    hideFreeTrial ||
    subscription?.hasUsedTrial ||
    subscription?.trialStartedAt ||
    subscription?.paymentMode === "free_trial" ||
    subscription?.planKey === "early_access" ||
    subscription?.status === "trial" ||
    (subscription?.activatedAt && subscription?.status)
  );

  function handleNotifyMe(planName: string) {
    setNotifiedPlan(planName);
    showToast(`We will notify you as soon as ${planName} goes live. 🔔`);
  }

  const currentPeriod = cycle === "yearly" ? "yearly" : "monthly";
  const activeEmail =
    profile?.email ||
    authRepository.getPendingEmail() ||
    profileRepository.get()?.email ||
    authRepository.get()?.email ||
    "";

  const handleUpgradeSuccess = async (
    targetPlanKey: PlanKey,
    planTitle: string,
    verifyData?: {
      order_id?: string | null;
      subscription_id?: string | null;
      payment_id: string;
      signature: string;
      is_recurring?: boolean;
    }
  ) => {
    const emailToUse =
      activeEmail ||
      profile?.email ||
      authRepository.getPendingEmail() ||
      profileRepository.get()?.email ||
      authRepository.get()?.email ||
      "";

    // 1. Activate in local storage immediately
    await SubscriptionService.activate(targetPlanKey, currentPeriod, emailToUse);

    // The verified payment endpoint is the only authority that activates paid access.
    await refresh();
    showToast(`Successfully upgraded to ${planTitle}! 🎉`);
  };

  const currentPlanKey =
    subscription?.planKey === "creator_pro" || subscription?.planKey === "pro"
      ? "pro"
      : subscription?.planKey === "creator_VIP" || subscription?.planKey === "vip"
      ? "vip"
      : subscription?.planKey || "early_access";

  return (
    <div className="w-full space-y-8 text-left">

      {/* 1. UPCOMING PLANS INTRO & BILLING PERIOD TOGGLE */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-base sm:text-lg font-bold text-[#181716]">
              Choose the plan that fits your creator journey
            </h2>
            <p className="text-xs sm:text-sm text-[#797570] font-medium mt-0.5">
              Compare content, collaboration and profile features before paid plans become available.
            </p>
          </div>

          {/* Billing Switcher Toggle */}
          <div className="inline-flex items-center rounded-xl bg-[#fbfbfb] p-1 border border-[#E4DAD5] shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setCycle("monthly")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${cycle === "monthly"
                ? "bg-white text-[#181716] shadow-xs border border-[#E4DAD5]"
                : "text-[#797570] hover:text-foreground"
                }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setCycle("yearly")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${cycle === "yearly"
                ? "bg-[#043084] text-white shadow-xs"
                : "text-[#797570] hover:text-foreground"
                }`}
            >
              <span>Yearly</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${cycle === "yearly" ? "bg-white/20 text-white" : "bg-[#043084]/[0.09] text-[#043084] border border-[#043084]/20"
                }`}>
                Save
              </span>
            </button>
          </div>
        </div>

        {/* 2. READABLE PLAN CARDS */}
        <div className={`grid grid-cols-1 ${hasSelectedFreeTrial ? "md:grid-cols-3 gap-5" : "md:grid-cols-2 xl:grid-cols-4 gap-4"}`}>

          {/* Card 1: Free Trial (hidden once free trial has been selected/used) */}
          {!hasSelectedFreeTrial && (
            <div className="rounded-2xl border border-[#E4DAD5] bg-white p-5 sm:p-6 flex flex-col justify-between space-y-5 shadow-xs text-left">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-bold text-[#181716]">Free Trial</h3>
                  <span className="text-[10px] font-bold text-[#17845B] bg-[#EAF7F0] px-2 py-0.5 rounded-full border border-[#17845B]/20">
                    7 Days
                  </span>
                </div>

                <div>
                  <p className="font-display text-xl font-bold text-[#181716]">
                    ₹0
                  </p>
                  <p className="text-[11px] text-[#797570] font-medium mt-0.5">
                    Public profile for 7 days • No card required
                  </p>
                </div>

                <p className="text-xs text-[#797570] font-medium leading-relaxed">
                  Try Inflixo and see how your public creator profile looks before upgrading.
                </p>

                <div className="pt-3 border-t border-[#E4DAD5] space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#797570] block">
                    Trial Features
                  </span>
                  <ul className="space-y-2 text-xs text-[#181716] font-medium">
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" />
                      <span>Public profile active for 7 days</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" />
                      <span>3 series, 15 total episodes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" />
                      <span>1 product in shop</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" />
                      <span>5 custom links &amp; free themes</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E4DAD5]">
                <button
                  type="button"
                  disabled
                  className={`w-full rounded-xl py-2.5 px-3 text-xs font-semibold cursor-default text-center ${
                    currentPlanKey === "early_access"
                      ? "bg-[#EAF7F0] border border-[#17845B]/20 text-[#17845B]"
                      : "bg-[#fbfbfb] border border-[#E4DAD5] text-[#797570]"
                  }`}
                >
                  {currentPlanKey === "early_access" ? "Current Trial ✓" : "Included in Trial"}
                </button>
              </div>
            </div>
          )}

          {/* Card 2: Starter */}
          <div className="rounded-2xl border border-[#E4DAD5] bg-white p-5 sm:p-6 flex flex-col justify-between space-y-5 shadow-xs text-left">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-[#181716]">Starter</h3>
                <span className="text-[10px] font-semibold text-[#797570] bg-[#fbfbfb] border border-[#E4DAD5] px-2 py-0.5 rounded-full">
                  Public
                </span>
              </div>

              <div>
                <p className="font-display text-xl font-bold text-[#181716]">
                  {formatPlanPrice("starter", currentPeriod, currency)}
                  <span className="text-xs text-[#797570] font-normal">
                    {cycle === "yearly" ? " / year" : " / month"}
                  </span>
                </p>
                <p className="text-[11px] text-[#797570] font-medium mt-0.5">
                  Keep profile public after trial
                </p>
              </div>

              <p className="text-xs text-[#797570] font-medium leading-relaxed">
                Best for creators who only need a public profile and basic links.
              </p>

              <div className="pt-3 border-t border-[#E4DAD5] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#797570] block">
                  Starter Features
                </span>
                <ul className="space-y-2 text-xs text-[#181716] font-medium">
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" /><span>Public profile always live</span></li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" /><span>3 series, 15 total episodes</span></li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" /><span>1 product in shop</span></li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" /><span>5 custom links</span></li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" /><span>1 collab package + 1 review</span></li>
                  <li className="flex items-center gap-2 text-[#797570]"><Minus className="h-3.5 w-3.5 shrink-0" /><span>No rate card or media kit</span></li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E4DAD5]">
              {currentPlanKey === "starter" ? (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-xl bg-[#EAF7F0] border border-[#17845B]/20 py-2.5 px-3 text-xs font-semibold text-[#17845B] cursor-default text-center"
                >
                  Current Plan ✓
                </button>
              ) : (
                <RazorpayCheckoutButton
                  amount={Math.round(getPlanPrice("starter", currentPeriod, "INR") * 100)}
                  currency="INR"
                  planKey="starter"
                  billingCycle={currentPeriod}
                  buttonText={`Upgrade to Starter (${formatPlanPrice("starter", currentPeriod, currency)})`}
                  prefill={{
                    name: profile?.displayName || "Creator",
                    email: activeEmail,
                  }}
                  className="w-full rounded-xl border border-[#043084] bg-white hover:bg-[#043084]/5 text-[#043084] py-2.5 px-3 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  onSuccess={(data) => {
                    handleUpgradeSuccess("starter", "Starter Plan", data);
                  }}
                  onError={(err) => {
                    showToast(`Payment failed: ${err.description || "Transaction declined"}`);
                  }}
                />
              )}
            </div>
          </div>

          {/* Card 3: Pro */}
          <div className="rounded-2xl border border-[#E4DAD5] bg-white p-5 sm:p-6 flex flex-col justify-between space-y-5 shadow-xs text-left">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-[#181716]">Pro</h3>
                <span className="text-[10px] font-semibold text-[#797570] bg-[#fbfbfb] border border-[#E4DAD5] px-2 py-0.5 rounded-full">
                  Growth
                </span>
              </div>

              <div>
                <p className="font-display text-xl font-bold text-[#181716]">
                  {formatPlanPrice("pro", currentPeriod, currency)}
                  <span className="text-xs text-[#797570] font-normal">
                    {cycle === "yearly" ? " / year" : " / month"}
                  </span>
                </p>
                <p className="text-[11px] text-[#797570] font-medium mt-0.5">
                  Taxes may apply
                </p>
              </div>

              <p className="text-xs text-[#797570] font-medium leading-relaxed">
                For creators publishing consistently and starting brand collaborations.
              </p>

              <div className="pt-3 border-t border-[#E4DAD5] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#797570] block">
                  Pro Features
                </span>
                <ul className="space-y-2 text-xs text-[#181716] font-medium">
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" /><span>20 series, 200 episodes</span></li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" /><span>20 products in shop (matches 20 series)</span></li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" /><span>20 custom links &amp; 10 reviews</span></li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" /><span>5 collab packages</span></li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" /><span>Rate card &amp; full media kit</span></li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" /><span>Standard analytics + faster refresh</span></li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E4DAD5]">
              {currentPlanKey === "pro" ? (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-xl bg-[#EAF7F0] border border-[#17845B]/20 py-2.5 px-3 text-xs font-semibold text-[#17845B] cursor-default text-center"
                >
                  Current Plan ✓
                </button>
              ) : (
                <RazorpayCheckoutButton
                  amount={Math.round(getPlanPrice("pro", currentPeriod, "INR") * 100)}
                  currency="INR"
                  planKey="pro"
                  billingCycle={currentPeriod}
                  buttonText={`Upgrade to Pro (${formatPlanPrice("pro", currentPeriod, currency)})`}
                  prefill={{
                    name: profile?.displayName || "Creator",
                    email: activeEmail,
                  }}
                  className="w-full rounded-xl bg-[#043084] hover:bg-[#032360] text-white py-2.5 px-3 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  onSuccess={(data) => {
                    handleUpgradeSuccess("creator_pro", "Creator Pro", data);
                  }}
                  onError={(err) => {
                    showToast(`Payment failed: ${err.description || "Transaction declined"}`);
                  }}
                />
              )}
            </div>
          </div>

          {/* Card 4: VIP (Recommended) */}
          <div className="rounded-2xl border-2 border-[#043084] bg-white p-5 sm:p-6 flex flex-col justify-between space-y-5 shadow-xs text-left relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-[#181716]">VIP</h3>
                <span className="text-[10px] font-bold text-[#043084] bg-[#043084]/[0.09] px-2.5 py-0.5 rounded-full border border-[#043084]/20">
                  Recommended
                </span>
              </div>

              <div>
                <p className="font-display text-xl font-bold text-[#181716]">
                  {formatPlanPrice("vip", currentPeriod, currency)}
                  <span className="text-xs text-[#797570] font-normal">
                    {cycle === "yearly" ? " / year" : " / month"}
                  </span>
                </p>
                <p className="text-[11px] text-[#797570] font-medium mt-0.5">
                  Taxes may apply
                </p>
              </div>

              <p className="text-xs text-[#797570] font-medium leading-relaxed">
                For premium creators who want full profile, media kit and collab power.
              </p>

              <div className="pt-3 border-t border-[#E4DAD5] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#797570] block">
                  VIP Features
                </span>
                <ul className="space-y-2 text-xs text-[#181716] font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" />
                    <span>Unlimited content series &amp; episodes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" />
                    <span>Unlimited products in shop</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" />
                    <span>Unlimited custom links &amp; reviews</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" />
                    <span>10 collab packages</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" />
                    <span>Custom media kit + premium themes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" />
                    <span>Priority support &amp; daily stats refresh</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E4DAD5]">
              {currentPlanKey === "vip" ? (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-xl bg-[#EAF7F0] border border-[#17845B]/20 py-2.5 px-3 text-xs font-semibold text-[#17845B] cursor-default text-center"
                >
                  Current Plan ✓
                </button>
              ) : (
                <RazorpayCheckoutButton
                  amount={Math.round(getPlanPrice("vip", currentPeriod, "INR") * 100)}
                  currency="INR"
                  planKey="vip"
                  billingCycle={currentPeriod}
                  buttonText={`Upgrade to VIP (${formatPlanPrice("vip", currentPeriod, currency)})`}
                  prefill={{
                    name: profile?.displayName || "Creator",
                    email: activeEmail,
                  }}
                  className="w-full rounded-xl bg-[#043084] hover:bg-[#032360] text-white py-2.5 px-3 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  onSuccess={(data) => {
                    handleUpgradeSuccess("creator_VIP", "Creator VIP", data);
                  }}
                  onError={(err) => {
                    showToast(`Payment failed: ${err.description || "Transaction declined"}`);
                  }}
                />
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 3. DETAILED FEATURE COMPARISON TABLE */}
      <div className="space-y-3.5">
        <div>
          <h2 className="font-display text-base font-bold text-[#181716]">
            Compare plan features
          </h2>
          <p className="text-xs text-[#797570] font-medium mt-0.5">
            Detailed breakdown of limits and capabilities across all plans.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#E4DAD5] bg-white shadow-xs">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-[#E4DAD5] bg-[#fbfbfb] text-xs font-bold text-[#181716]">
                <th className="py-3.5 px-5">Feature</th>
                {!hasSelectedFreeTrial && (
                  <th className="py-3.5 px-4 text-center bg-[#043084]/[0.05] border-x border-[#E4DAD5]">
                    <div className="font-bold text-[#043084]">Free Trial</div>
                    <div className="text-[10px] font-medium text-[#797570] mt-0.5">7 days</div>
                  </th>
                )}
                <th className="py-3.5 px-4 text-center">
                  <div className="font-bold text-[#181716]">Starter</div>
                  <div className="text-[10px] font-medium text-[#797570] mt-0.5">
                    {`${formatPlanPrice("starter", currentPeriod, currency)}/${cycle === "yearly" ? "yr" : "mo"}`}
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">
                  <div className="font-bold text-[#181716]">Pro</div>
                  <div className="text-[10px] font-medium text-[#797570] mt-0.5">
                    {`${formatPlanPrice("pro", currentPeriod, currency)}/${cycle === "yearly" ? "yr" : "mo"}`}
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">
                  <div className="font-bold text-[#181716]">VIP</div>
                  <div className="text-[10px] font-medium text-[#797570] mt-0.5">
                    {`${formatPlanPrice("vip", currentPeriod, currency)}/${cycle === "yearly" ? "yr" : "mo"}`}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4DAD5] text-xs font-medium text-[#181716]">
              {/* Row 1: Content Series */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#181716]">
                  Content Series
                </td>
                {!hasSelectedFreeTrial && (
                  <td className="py-3 px-4 text-center bg-[#043084]/[0.05] border-x border-[#E4DAD5]">
                    3 series
                  </td>
                )}
                <td className="py-3 px-4 text-center">3 series</td>
                <td className="py-3 px-4 text-center">20 series</td>
                <td className="py-3 px-4 text-center font-semibold text-[#043084]">Unlimited</td>
              </tr>

              {/* Row 2: Total Episodes */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#181716]">
                  Total Episodes
                </td>
                {!hasSelectedFreeTrial && (
                  <td className="py-3 px-4 text-center bg-[#043084]/[0.05] border-x border-[#E4DAD5]">
                    15 episodes
                  </td>
                )}
                <td className="py-3 px-4 text-center">15 episodes</td>
                <td className="py-3 px-4 text-center">20 per series</td>
                <td className="py-3 px-4 text-center font-semibold text-[#043084]">Unlimited</td>
              </tr>

              {/* Row 3: Custom Links */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#181716]">
                  Custom Links
                </td>
                {!hasSelectedFreeTrial && (
                  <td className="py-3 px-4 text-center bg-[#043084]/[0.05] border-x border-[#E4DAD5]">
                    5 links
                  </td>
                )}
                <td className="py-3 px-4 text-center">5 links</td>
                <td className="py-3 px-4 text-center">20 links</td>
                <td className="py-3 px-4 text-center font-semibold text-[#043084]">Unlimited</td>
              </tr>

              {/* Row: Shop Products */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#181716]">
                  Shop Products
                </td>
                {!hasSelectedFreeTrial && (
                  <td className="py-3 px-4 text-center bg-[#043084]/[0.05] border-x border-[#E4DAD5]">
                    1 product
                  </td>
                )}
                <td className="py-3 px-4 text-center">1 product</td>
                <td className="py-3 px-4 text-center">20 products</td>
                <td className="py-3 px-4 text-center font-semibold text-[#043084]">Unlimited</td>
              </tr>

              {/* Row 4: Collab Packages */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#181716]">
                  Collab Packages
                </td>
                {!hasSelectedFreeTrial && (
                  <td className="py-3 px-4 text-center bg-[#043084]/[0.05] border-x border-[#E4DAD5]">
                    1 package
                  </td>
                )}
                <td className="py-3 px-4 text-center">1 package</td>
                <td className="py-3 px-4 text-center">3 packages</td>
                <td className="py-3 px-4 text-center font-semibold text-[#043084]">10 packages</td>
              </tr>

              {/* Row 5: Reviews */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#181716]">
                  Reviews
                </td>
                {!hasSelectedFreeTrial && (
                  <td className="py-3 px-4 text-center bg-[#043084]/[0.05] border-x border-[#E4DAD5]">
                    1 review
                  </td>
                )}
                <td className="py-3 px-4 text-center">1 review</td>
                <td className="py-3 px-4 text-center">10 reviews</td>
                <td className="py-3 px-4 text-center font-semibold text-[#043084]">Unlimited</td>
              </tr>

              {/* Row 6: Public Profile */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#181716]">
                  Public Profile
                </td>
                {!hasSelectedFreeTrial && (
                  <td className="py-3 px-4 text-center bg-[#043084]/[0.05] border-x border-[#E4DAD5]">
                    7 days
                  </td>
                )}
                <td className="py-3 px-4 text-center">Always live</td>
                <td className="py-3 px-4 text-center">Always live</td>
                <td className="py-3 px-4 text-center">Always live</td>
              </tr>

              {/* Row 7: Rate Card */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#181716]">
                  Rate Card
                </td>
                {!hasSelectedFreeTrial && (
                  <td className="py-3 px-4 text-center bg-[#043084]/[0.05] border-x border-[#E4DAD5]">
                    <Minus className="h-4 w-4 mx-auto text-[#797570]/50" />
                  </td>
                )}
                <td className="py-3 px-4 text-center">
                  <Minus className="h-4 w-4 mx-auto text-[#797570]/50" />
                </td>
                <td className="py-3 px-4 text-center">
                  <Check className="h-4 w-4 mx-auto text-[#17845B]" />
                </td>
                <td className="py-3 px-4 text-center"><Check className="h-4 w-4 mx-auto text-[#17845B]" /></td>
              </tr>

              {/* Row 8: Media Kit */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#181716]">
                  Media Kit
                </td>
                {!hasSelectedFreeTrial && (
                  <td className="py-3 px-4 text-center bg-[#043084]/[0.05] border-x border-[#E4DAD5]">
                    <Minus className="h-4 w-4 mx-auto text-[#797570]/50" />
                  </td>
                )}
                <td className="py-3 px-4 text-center">
                  <Minus className="h-4 w-4 mx-auto text-[#797570]/50" />
                </td>
                <td className="py-3 px-4 text-center">
                  Default
                </td>
                <td className="py-3 px-4 text-center">
                  Custom
                </td>
              </tr>

              {/* Row 9: Inflixo Branding */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#181716]">
                  Inflixo Branding
                </td>
                {!hasSelectedFreeTrial && (
                  <td className="py-3 px-4 text-center bg-[#043084]/[0.05] border-x border-[#E4DAD5]">
                    <Check className="h-4 w-4 mx-auto text-[#17845B]" />
                  </td>
                )}
                <td className="py-3 px-4 text-center">
                  <Check className="h-4 w-4 mx-auto text-[#17845B]" />
                </td>
                <td className="py-3 px-4 text-center">Small badge</td>
                <td className="py-3 px-4 text-center">Optional</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. TRANSPARENCY & SUPPORT NOTE */}
      <div className="text-center text-xs text-[#797570] font-medium pt-1 space-y-1">
        <p>Plan availability, limits and pricing are shown based on the latest Inflixo configuration.</p>
        <p className="text-[11px] text-[#797570]/80">
          Billing &amp; payments are securely processed by TrustIQ Labs PVT LTD. You&apos;ll be notified before any changes to your access.
        </p>
      </div>

    </div>
  );
}
