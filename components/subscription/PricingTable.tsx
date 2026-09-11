"use client";

import { useState } from "react";
import { Check, Bell, Minus } from "lucide-react";
import { BillingCycle, PlanKey } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { formatPlanPrice, usePricingCurrency } from "@/lib/pricing";

interface PricingTableProps {
  selectedPlan?: PlanKey;
  onSelectPlan?: (planKey: PlanKey) => void;
  billingCycle?: BillingCycle;
  onBillingCycleChange?: (cycle: BillingCycle) => void;
  showEarlyAccessBanner?: boolean;
}

export function PricingTable({ }: PricingTableProps) {
  const { showToast } = useToast();
  const [notifiedPlan, setNotifiedPlan] = useState<string | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const currency = usePricingCurrency();

  function handleNotifyMe(planName: string) {
    setNotifiedPlan(planName);
    showToast(`We will notify you as soon as ${planName} goes live. 🔔`);
  }

  const currentPeriod = cycle === "yearly" ? "yearly" : "monthly";

  return (
    <div className="w-full space-y-8 max-w-6xl mx-auto text-left">

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
                ? "bg-[#151933] text-white shadow-xs"
                : "text-[#797570] hover:text-foreground"
                }`}
            >
              <span>Yearly</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${cycle === "yearly" ? "bg-white/20 text-white" : "bg-[#151933]/[0.09] text-[#151933] border border-[#151933]/20"
                }`}>
                Save
              </span>
            </button>
          </div>
        </div>

        {/* 2. READABLE PLAN CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

          {/* Card 1: Free Trial */}
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
                  Included Features
                </span>
                <ul className="space-y-2 text-xs text-[#181716] font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" />
                    <span>Up to 3 content series</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" />
                    <span>Up to 15 total episodes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" />
                    <span>1 collab package</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" />
                    <span>1 review</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" />
                    <span>5 custom links &amp; free themes</span>
                  </li>
                  <li className="flex items-center gap-2 text-[#797570]">
                    <Minus className="h-3.5 w-3.5 shrink-0" />
                    <span>No rate card or media kit</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E4DAD5]">
              <button
                type="button"
                disabled
                className="w-full rounded-xl bg-[#fbfbfb] border border-[#E4DAD5] py-2.5 px-3 text-xs font-semibold text-[#797570] cursor-default text-center"
              >
                Current Trial
              </button>
            </div>
          </div>

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
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" /><span>5 custom links</span></li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" /><span>1 collab package + 1 review</span></li>
                  <li className="flex items-center gap-2 text-[#797570]"><Minus className="h-3.5 w-3.5 shrink-0" /><span>No rate card or media kit</span></li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E4DAD5]">
              <button
                type="button"
                onClick={() => handleNotifyMe("Starter Plan")}
                disabled={notifiedPlan === "Starter Plan"}
                className="w-full rounded-xl border border-[#E4DAD5] bg-white hover:bg-surface-soft text-[#181716] py-2.5 px-3 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-80"
              >
                <Bell className="h-3.5 w-3.5 text-[#797570]" />
                <span>{notifiedPlan === "Starter Plan" ? "Notification Set ✓" : "Notify Me"}</span>
              </button>
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
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" />
                    <span>20 series/playlists</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" />
                    <span>20 episodes per series</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" />
                    <span>20 custom links</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" />
                    <span>3 collab packages &amp; 10 reviews</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#17845B] shrink-0" />
                    <span>Rate card + default media kit</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E4DAD5]">
              <button
                type="button"
                onClick={() => handleNotifyMe("Pro Plan")}
                disabled={notifiedPlan === "Pro Plan"}
                className="w-full rounded-xl bg-[#151933] hover:bg-brand-hover text-white py-2.5 px-3 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-80"
              >
                <Bell className="h-3.5 w-3.5" />
                <span>{notifiedPlan === "Pro Plan" ? "Notification Set ✓" : "Notify Me"}</span>
              </button>
            </div>
          </div>

          {/* Card 4: VIP (Recommended) */}
          <div className="rounded-2xl border-2 border-[#151933] bg-white p-5 sm:p-6 flex flex-col justify-between space-y-5 shadow-xs text-left relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-[#181716]">VIP</h3>
                <span className="text-[10px] font-bold text-[#151933] bg-[#151933]/[0.09] px-2.5 py-0.5 rounded-full border border-[#151933]/20">
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
              <button
                type="button"
                onClick={() => handleNotifyMe("VIP Plan")}
                disabled={notifiedPlan === "VIP Plan"}
                className="w-full rounded-xl border border-[#E4DAD5] bg-white hover:bg-surface-soft text-[#181716] py-2.5 px-3 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-80"
              >
                <Bell className="h-3.5 w-3.5 text-[#797570]" />
                <span>{notifiedPlan === "VIP Plan" ? "Notification Set ✓" : "Notify Me"}</span>
              </button>
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
                <th className="py-3.5 px-4 text-center bg-[#151933]/[0.05] border-x border-[#E4DAD5]">
                  <div className="font-bold text-[#151933]">Free Trial</div>
                  <div className="text-[10px] font-medium text-[#797570] mt-0.5">7 days</div>
                </th>
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
                <td className="py-3 px-4 text-center bg-[#151933]/[0.05] border-x border-[#E4DAD5]">
                  3 series
                </td>
                <td className="py-3 px-4 text-center">3 series</td>
                <td className="py-3 px-4 text-center">20 series</td>
                <td className="py-3 px-4 text-center font-semibold text-[#151933]">Unlimited</td>
              </tr>

              {/* Row 2: Total Episodes */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#181716]">
                  Total Episodes
                </td>
                <td className="py-3 px-4 text-center bg-[#151933]/[0.05] border-x border-[#E4DAD5]">
                  15 episodes
                </td>
                <td className="py-3 px-4 text-center">15 episodes</td>
                <td className="py-3 px-4 text-center">20 per series</td>
                <td className="py-3 px-4 text-center font-semibold text-[#151933]">Unlimited</td>
              </tr>

              {/* Row 3: Custom Links */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#181716]">
                  Custom Links
                </td>
                <td className="py-3 px-4 text-center bg-[#151933]/[0.05] border-x border-[#E4DAD5]">
                  5 links
                </td>
                <td className="py-3 px-4 text-center">5 links</td>
                <td className="py-3 px-4 text-center">20 links</td>
                <td className="py-3 px-4 text-center font-semibold text-[#151933]">Unlimited</td>
              </tr>

              {/* Row 4: Collab Packages */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#181716]">
                  Collab Packages
                </td>
                <td className="py-3 px-4 text-center bg-[#151933]/[0.05] border-x border-[#E4DAD5]">
                  1 package
                </td>
                <td className="py-3 px-4 text-center">1 package</td>
                <td className="py-3 px-4 text-center">3 packages</td>
                <td className="py-3 px-4 text-center font-semibold text-[#151933]">10 packages</td>
              </tr>

              {/* Row 5: Reviews */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#181716]">
                  Reviews
                </td>
                <td className="py-3 px-4 text-center bg-[#151933]/[0.05] border-x border-[#E4DAD5]">
                  1 review
                </td>
                <td className="py-3 px-4 text-center">1 review</td>
                <td className="py-3 px-4 text-center">10 reviews</td>
                <td className="py-3 px-4 text-center font-semibold text-[#151933]">Unlimited</td>
              </tr>

              {/* Row 6: Public Profile */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#181716]">
                  Public Profile
                </td>
                <td className="py-3 px-4 text-center bg-[#151933]/[0.05] border-x border-[#E4DAD5]">
                  7 days
                </td>
                <td className="py-3 px-4 text-center">Always live</td>
                <td className="py-3 px-4 text-center">Always live</td>
                <td className="py-3 px-4 text-center">Always live</td>
              </tr>

              {/* Row 7: Rate Card */}
              <tr>
                <td className="py-3 px-5 font-semibold text-[#181716]">
                  Rate Card
                </td>
                <td className="py-3 px-4 text-center bg-[#151933]/[0.05] border-x border-[#E4DAD5]">
                  <Minus className="h-4 w-4 mx-auto text-[#797570]/50" />
                </td>
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
                <td className="py-3 px-4 text-center bg-[#151933]/[0.05] border-x border-[#E4DAD5]">
                  <Minus className="h-4 w-4 mx-auto text-[#797570]/50" />
                </td>
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
                <td className="py-3 px-4 text-center bg-[#151933]/[0.05] border-x border-[#E4DAD5]">
                  <Check className="h-4 w-4 mx-auto text-[#17845B]" />
                </td>
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
