"use client";

import { useState } from "react";
import { Check, Bell, Minus, ShieldCheck, Sparkles } from "lucide-react";
import { BillingCycle, PlanKey } from "@/types";
import { useToast } from "@/contexts/ToastContext";

interface PricingTableProps {
  selectedPlan?: PlanKey;
  onSelectPlan?: (planKey: PlanKey) => void;
  billingCycle?: BillingCycle;
  onBillingCycleChange?: (cycle: BillingCycle) => void;
  showEarlyAccessBanner?: boolean;
}

export function PricingTable({}: PricingTableProps) {
  const { showToast } = useToast();
  const [notifiedPlan, setNotifiedPlan] = useState<string | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  function handleNotifyMe(planName: string) {
    setNotifiedPlan(planName);
    showToast(`We will notify you as soon as ${planName} goes live. 🔔`);
  }

  // Yearly savings percentage: (199*12 - 1999) / (199*12) = ~16%
  const proMonthly = 199;
  const proYearly = 1999;
  const vipMonthly = 299;
  const vipYearly = 2999;

  return (
    <div className="w-full space-y-8 max-w-6xl mx-auto text-left">
      
      {/* 1. UPCOMING PLANS INTRO & BILLING PERIOD TOGGLE */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-base sm:text-lg font-bold text-[#17131A]">
              Choose the plan that fits your creator journey
            </h2>
            <p className="text-xs sm:text-sm text-[#6F6872] font-medium mt-0.5">
              Compare content, collaboration and profile features before paid plans become available.
            </p>
          </div>

          {/* Billing Switcher Toggle */}
          <div className="inline-flex items-center rounded-xl bg-[#FAF8FA] p-1 border border-[#ECE8EB] shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setCycle("monthly")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                cycle === "monthly"
                  ? "bg-white text-[#17131A] shadow-2xs border border-[#ECE8EB]"
                  : "text-[#6F6872] hover:text-[#17131A]"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setCycle("yearly")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                cycle === "yearly"
                  ? "bg-[#803D63] text-white shadow-2xs"
                  : "text-[#6F6872] hover:text-[#17131A]"
              }`}
            >
              <span>Yearly</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                cycle === "yearly" ? "bg-white/20 text-white" : "bg-[#F7EDF3] text-[#803D63]"
              }`}>
                Save 16%
              </span>
            </button>
          </div>
        </div>

        {/* 2. THREE READABLE PLAN CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Early Access (Current) */}
          <div className="rounded-2xl border border-[#ECE8EB] bg-white p-5 sm:p-6 flex flex-col justify-between space-y-5 shadow-2xs text-left">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-[#17131A]">Early Access</h3>
                <span className="text-[10px] font-bold text-[#16794A] bg-[#ECFDF3] px-2 py-0.5 rounded-full">
                  Current
                </span>
              </div>

              <div>
                <p className="font-display text-xl font-bold text-[#17131A]">
                  Included
                </p>
                <p className="text-[11px] text-[#6F6872] font-medium mt-0.5">
                  Available during Early Access • No card required
                </p>
              </div>

              <p className="text-xs text-[#6F6872] font-medium leading-relaxed">
                Build your creator profile and explore Inflixo’s core tools.
              </p>

              <div className="pt-3 border-t border-[#ECE8EB] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F6872] block">
                  Included Features
                </span>
                <ul className="space-y-2 text-xs text-[#17131A] font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#16794A] shrink-0" />
                    <span>Up to 3 content series</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#16794A] shrink-0" />
                    <span>Up to 15 total episodes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#16794A] shrink-0" />
                    <span>1 creator service &amp; rate card</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#16794A] shrink-0" />
                    <span>Total Fanbase counter</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#16794A] shrink-0" />
                    <span>Social profiles &amp; custom links</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-[#ECE8EB]">
              <button
                type="button"
                disabled
                className="w-full rounded-xl bg-[#FAF8FA] border border-[#ECE8EB] py-2.5 px-3 text-xs font-semibold text-[#6F6872] cursor-default text-center"
              >
                Current Access
              </button>
            </div>
          </div>

          {/* Card 2: Pro (Recommended) */}
          <div className="rounded-2xl border-2 border-[#803D63] bg-white p-5 sm:p-6 flex flex-col justify-between space-y-5 shadow-xs text-left relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-[#17131A]">Pro</h3>
                <span className="text-[10px] font-bold text-[#803D63] bg-[#F7EDF3] px-2.5 py-0.5 rounded-full border border-[#803D63]/20">
                  Recommended
                </span>
              </div>

              <div>
                <p className="font-display text-xl font-bold text-[#17131A]">
                  {cycle === "yearly" ? `₹${proYearly.toLocaleString("en-IN")}` : `₹${proMonthly}`}
                  <span className="text-xs text-[#6F6872] font-normal">
                    {cycle === "yearly" ? " / year" : " / month"}
                  </span>
                </p>
                <p className="text-[11px] text-[#6F6872] font-medium mt-0.5">
                  Taxes may apply
                </p>
              </div>

              <p className="text-xs text-[#6F6872] font-medium leading-relaxed">
                For creators publishing consistently and working with brands.
              </p>

              <div className="pt-3 border-t border-[#ECE8EB] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F6872] block">
                  Pro Features
                </span>
                <ul className="space-y-2 text-xs text-[#17131A] font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#16794A] shrink-0" />
                    <span>Up to 30 content series</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#16794A] shrink-0" />
                    <span>Up to 300 total episodes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#16794A] shrink-0" />
                    <span>3 creator services &amp; rate cards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#16794A] shrink-0" />
                    <span>Remove Inflixo branding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#16794A] shrink-0" />
                    <span>Direct brand lead routing</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-[#ECE8EB]">
              <button
                type="button"
                onClick={() => handleNotifyMe("Pro Plan")}
                disabled={notifiedPlan === "Pro Plan"}
                className="w-full rounded-xl bg-[#803D63] hover:bg-[#6F3456] text-white py-2.5 px-3 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-80"
              >
                <Bell className="h-3.5 w-3.5" />
                <span>{notifiedPlan === "Pro Plan" ? "Notification Set ✓" : "Notify Me"}</span>
              </button>
            </div>
          </div>

          {/* Card 3: VIP */}
          <div className="rounded-2xl border border-[#ECE8EB] bg-white p-5 sm:p-6 flex flex-col justify-between space-y-5 shadow-2xs text-left">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-[#17131A]">VIP</h3>
                <span className="text-[10px] font-semibold text-[#6F6872] bg-[#FAF8FA] border border-[#ECE8EB] px-2 py-0.5 rounded-full">
                  Upcoming
                </span>
              </div>

              <div>
                <p className="font-display text-xl font-bold text-[#17131A]">
                  {cycle === "yearly" ? `₹${vipYearly.toLocaleString("en-IN")}` : `₹${vipMonthly}`}
                  <span className="text-xs text-[#6F6872] font-normal">
                    {cycle === "yearly" ? " / year" : " / month"}
                  </span>
                </p>
                <p className="text-[11px] text-[#6F6872] font-medium mt-0.5">
                  Taxes may apply
                </p>
              </div>

              <p className="text-xs text-[#6F6872] font-medium leading-relaxed">
                For established creators managing a larger content portfolio.
              </p>

              <div className="pt-3 border-t border-[#ECE8EB] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F6872] block">
                  VIP Features
                </span>
                <ul className="space-y-2 text-xs text-[#17131A] font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#16794A] shrink-0" />
                    <span>Unlimited content series</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#16794A] shrink-0" />
                    <span>Unlimited total episodes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#16794A] shrink-0" />
                    <span>Unlimited creator services</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#16794A] shrink-0" />
                    <span>Remove Inflixo branding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#16794A] shrink-0" />
                    <span>Full feature access &amp; priority</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-[#ECE8EB]">
              <button
                type="button"
                onClick={() => handleNotifyMe("VIP Plan")}
                disabled={notifiedPlan === "VIP Plan"}
                className="w-full rounded-xl border border-[#ECE8EB] bg-white hover:bg-[#FAF8FA] text-[#17131A] py-2.5 px-3 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-80"
              >
                <Bell className="h-3.5 w-3.5 text-[#6F6872]" />
                <span>{notifiedPlan === "VIP Plan" ? "Notification Set ✓" : "Notify Me"}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 3. DETAILED FEATURE COMPARISON TABLE */}
      <div className="space-y-3.5">
        <div>
          <h2 className="font-display text-base font-bold text-[#17131A]">
            Compare plan features
          </h2>
          <p className="text-xs text-[#6F6872] font-medium mt-0.5">
            Detailed breakdown of limits and capabilities across all plans.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#ECE8EB] bg-white shadow-2xs">
          <table className="w-full text-left border-collapse min-w-[580px]">
            <thead>
              <tr className="border-b border-[#ECE8EB] bg-[#FAF8FA] text-xs font-bold text-[#17131A]">
                <th className="py-3.5 px-5 w-2/5">Feature</th>
                <th className="py-3.5 px-4 w-1/5 text-center bg-[#F7EDF3]/40 border-x border-[#ECE8EB]">
                  <div className="font-bold text-[#803D63]">Early Access</div>
                  <div className="text-[10px] font-medium text-[#6F6872] mt-0.5">Current</div>
                </th>
                <th className="py-3.5 px-4 w-1/5 text-center">
                  <div className="font-bold text-[#17131A]">Pro</div>
                  <div className="text-[10px] font-medium text-[#6F6872] mt-0.5">
                    {cycle === "yearly" ? "₹1,999/yr" : "₹199/mo"}
                  </div>
                </th>
                <th className="py-3.5 px-4 w-1/5 text-center">
                  <div className="font-bold text-[#17131A]">VIP</div>
                  <div className="text-[10px] font-medium text-[#6F6872] mt-0.5">
                    {cycle === "yearly" ? "₹2,999/yr" : "₹299/mo"}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECE8EB] text-xs font-medium text-[#17131A]">
              {/* Row 1: Content Series */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#17131A]">
                  Content Series
                </td>
                <td className="py-3 px-4 text-center bg-[#F7EDF3]/20 border-x border-[#ECE8EB]">
                  3 series
                </td>
                <td className="py-3 px-4 text-center">30 series</td>
                <td className="py-3 px-4 text-center font-semibold text-[#803D63]">Unlimited</td>
              </tr>

              {/* Row 2: Total Episodes */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#17131A]">
                  Total Episodes
                </td>
                <td className="py-3 px-4 text-center bg-[#F7EDF3]/20 border-x border-[#ECE8EB]">
                  15 episodes
                </td>
                <td className="py-3 px-4 text-center">300 episodes</td>
                <td className="py-3 px-4 text-center font-semibold text-[#803D63]">Unlimited</td>
              </tr>

              {/* Row 3: Creator Services */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#17131A]">
                  Creator Services
                </td>
                <td className="py-3 px-4 text-center bg-[#F7EDF3]/20 border-x border-[#ECE8EB]">
                  1 service
                </td>
                <td className="py-3 px-4 text-center">3 services</td>
                <td className="py-3 px-4 text-center font-semibold text-[#803D63]">Unlimited</td>
              </tr>

              {/* Row 4: Total Fanbase */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#17131A]">
                  Total Fanbase Counter
                </td>
                <td className="py-3 px-4 text-center bg-[#F7EDF3]/20 border-x border-[#ECE8EB]">
                  <Check className="h-4 w-4 mx-auto text-[#16794A]" />
                </td>
                <td className="py-3 px-4 text-center">
                  <Check className="h-4 w-4 mx-auto text-[#16794A]" />
                </td>
                <td className="py-3 px-4 text-center">
                  <Check className="h-4 w-4 mx-auto text-[#16794A]" />
                </td>
              </tr>

              {/* Row 5: Brand Enquiries */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#17131A]">
                  Direct Brand Enquiries (WhatsApp &amp; Email)
                </td>
                <td className="py-3 px-4 text-center bg-[#F7EDF3]/20 border-x border-[#ECE8EB]">
                  <Check className="h-4 w-4 mx-auto text-[#16794A]" />
                </td>
                <td className="py-3 px-4 text-center">
                  <Check className="h-4 w-4 mx-auto text-[#16794A]" />
                </td>
                <td className="py-3 px-4 text-center">
                  <Check className="h-4 w-4 mx-auto text-[#16794A]" />
                </td>
              </tr>

              {/* Row 6: Client Reviews */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#17131A]">
                  Client Reviews &amp; Invitations
                </td>
                <td className="py-3 px-4 text-center bg-[#F7EDF3]/20 border-x border-[#ECE8EB]">
                  <Check className="h-4 w-4 mx-auto text-[#16794A]" />
                </td>
                <td className="py-3 px-4 text-center">
                  <Check className="h-4 w-4 mx-auto text-[#16794A]" />
                </td>
                <td className="py-3 px-4 text-center">
                  <Check className="h-4 w-4 mx-auto text-[#16794A]" />
                </td>
              </tr>

              {/* Row 7: Custom Links */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#17131A]">
                  Custom Links &amp; Social Presences
                </td>
                <td className="py-3 px-4 text-center bg-[#F7EDF3]/20 border-x border-[#ECE8EB]">
                  <Check className="h-4 w-4 mx-auto text-[#16794A]" />
                </td>
                <td className="py-3 px-4 text-center">
                  <Check className="h-4 w-4 mx-auto text-[#16794A]" />
                </td>
                <td className="py-3 px-4 text-center">
                  <Check className="h-4 w-4 mx-auto text-[#16794A]" />
                </td>
              </tr>

              {/* Row 8: Remove Inflixo Branding */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#17131A]">
                  Remove Inflixo Branding
                </td>
                <td className="py-3 px-4 text-center bg-[#F7EDF3]/20 border-x border-[#ECE8EB]">
                  <Minus className="h-4 w-4 mx-auto text-[#6F6872]/50" />
                </td>
                <td className="py-3 px-4 text-center">
                  <Check className="h-4 w-4 mx-auto text-[#16794A]" />
                </td>
                <td className="py-3 px-4 text-center">
                  <Check className="h-4 w-4 mx-auto text-[#16794A]" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. TRANSPARENCY & SUPPORT NOTE */}
      <div className="text-center text-xs text-[#6F6872] font-medium pt-1 space-y-1">
        <p>Plan availability, limits and pricing are shown based on the latest Inflixo configuration.</p>
        <p className="text-[11px] text-[#6F6872]/80">You'll be notified before any change to your current access.</p>
      </div>

    </div>
  );
}
