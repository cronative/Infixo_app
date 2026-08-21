"use client";

import { useState } from "react";
import { Check, X, Bell, ShieldCheck } from "lucide-react";
import { BillingCycle, PlanKey } from "@/types";
import { useToast } from "@/contexts/ToastContext";

interface PricingTableProps {
  selectedPlan?: PlanKey;
  onSelectPlan?: (planKey: PlanKey) => void;
  billingCycle?: BillingCycle;
  onBillingCycleChange?: (cycle: BillingCycle) => void;
  onConfirm?: (targetPlan?: PlanKey) => void;
  confirmLoading?: boolean;
  ctaText?: string;
  showEarlyAccessBanner?: boolean;
}

export function PricingTable({
  showEarlyAccessBanner = true,
}: PricingTableProps) {
  const { showToast } = useToast();
  const [notifiedPlan, setNotifiedPlan] = useState<string | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  function handleNotifyMe(planName: string) {
    setNotifiedPlan(planName);
    showToast(`We will notify you as soon as ${planName} goes live.`);
  }

  return (
    <div className="w-full space-y-6 max-w-6xl mx-auto py-2 text-left">
      {/* Sober Informational Banner Strip */}
      {showEarlyAccessBanner && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-[#803D63] shrink-0" />
            <p className="font-semibold text-xs sm:text-sm text-slate-700">
              Free Creator Early Access is active automatically for all users until further notice.
            </p>
          </div>
          <span className="bg-[#803D63] text-white text-[10px] font-bold px-3 py-1 rounded-full shrink-0">
            ACTIVE EARLY ACCESS
          </span>
        </div>
      )}

      {/* Monthly vs Yearly Billing Switcher Toggle */}
      <div className="flex items-center justify-center gap-3 py-2">
        <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setCycle("monthly")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              cycle === "monthly"
                ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setCycle("yearly")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              cycle === "yearly"
                ? "bg-[#803D63] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Yearly Billing</span>
            <span className="bg-slate-200 text-slate-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">
              Save 16%
            </span>
          </button>
        </div>
      </div>

      {/* SOBER SAAS COMPARISON TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-extrabold text-slate-900">
              <th className="py-4 px-5 w-1/3">Features &amp; Quotas</th>
              <th className="py-4 px-5 w-1/5 text-center bg-purple-50/60 border-x border-purple-100/80">
                <div className="font-bold text-[#803D63]">Free Tier</div>
                <div className="text-[11px] font-normal text-slate-500 mt-0.5">₹0 / month</div>
              </th>
              <th className="py-4 px-5 w-1/5 text-center">
                <div className="font-bold text-slate-900">Pro Plan</div>
                <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                  {cycle === "yearly" ? "₹1,999 / year" : "₹199 / month"}
                </div>
              </th>
              <th className="py-4 px-5 w-1/5 text-center">
                <div className="font-bold text-slate-900">VIP Plan</div>
                <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                  {cycle === "yearly" ? "₹2,999 / year" : "₹299 / month"}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {/* Row 1: Collab Gigs & Rate Cards */}
            <tr>
              <td className="py-3.5 px-5 font-bold text-slate-900">
                Collab Gigs &amp; Rate Cards
              </td>
              <td className="py-3.5 px-5 text-center bg-purple-50/30 border-x border-purple-100/60 font-bold text-slate-800">
                1 Gig
              </td>
              <td className="py-3.5 px-5 text-center font-bold text-slate-900">3 Gigs</td>
              <td className="py-3.5 px-5 text-center font-extrabold text-[#803D63]">Unlimited</td>
            </tr>

            {/* Row 2: WhatsApp & Email Leads */}
            <tr>
              <td className="py-3.5 px-5 font-bold text-slate-900">
                Direct WhatsApp &amp; Email Leads
                <span className="block text-[11px] font-normal text-slate-500">Pre-verified brand campaign briefs</span>
              </td>
              <td className="py-3.5 px-5 text-center bg-purple-50/30 border-x border-purple-100/60 font-bold text-emerald-600">
                <Check className="h-4 w-4 mx-auto text-emerald-600 stroke-[3]" />
              </td>
              <td className="py-3.5 px-5 text-center font-bold text-emerald-600">
                <Check className="h-4 w-4 mx-auto text-emerald-600 stroke-[3]" />
              </td>
              <td className="py-3.5 px-5 text-center font-bold text-emerald-600">
                <Check className="h-4 w-4 mx-auto text-emerald-600 stroke-[3]" />
              </td>
            </tr>

            {/* Row 3: OTT Web Series Limit */}
            <tr>
              <td className="py-3.5 px-5 font-bold text-slate-900">
                OTT Web Series Quota
              </td>
              <td className="py-3.5 px-5 text-center bg-purple-50/30 border-x border-purple-100/60 font-bold text-slate-800">
                2 Web Series
              </td>
              <td className="py-3.5 px-5 text-center font-bold text-slate-900">30 Web Series</td>
              <td className="py-3.5 px-5 text-center font-extrabold text-[#803D63]">Unlimited</td>
            </tr>

            {/* Row 4: Total Episodes Quota */}
            <tr>
              <td className="py-3.5 px-5 font-bold text-slate-900">
                Total Episodes Quota
              </td>
              <td className="py-3.5 px-5 text-center bg-purple-50/30 border-x border-purple-100/60 font-bold text-slate-800">
                10 Episodes
              </td>
              <td className="py-3.5 px-5 text-center font-bold text-slate-900">300 Episodes</td>
              <td className="py-3.5 px-5 text-center font-extrabold text-[#803D63]">Unlimited</td>
            </tr>

            {/* Row 5: AI-Synced Fanbase Count */}
            <tr>
              <td className="py-3.5 px-5 font-bold text-slate-900">
                AI-Synced Fanbase Count
                <span className="block text-[11px] font-normal text-slate-500">Instagram, YouTube &amp; Facebook</span>
              </td>
              <td className="py-3.5 px-5 text-center bg-purple-50/30 border-x border-purple-100/60 font-bold text-emerald-600">
                <Check className="h-4 w-4 mx-auto text-emerald-600 stroke-[3]" />
              </td>
              <td className="py-3.5 px-5 text-center font-bold text-emerald-600">
                <Check className="h-4 w-4 mx-auto text-emerald-600 stroke-[3]" />
              </td>
              <td className="py-3.5 px-5 text-center font-bold text-emerald-600">
                <Check className="h-4 w-4 mx-auto text-emerald-600 stroke-[3]" />
              </td>
            </tr>

            {/* Row 6: Remove Inflixo Branding Watermark */}
            <tr>
              <td className="py-3.5 px-5 font-bold text-slate-900">
                Remove Inflixo Footer Branding
              </td>
              <td className="py-3.5 px-5 text-center bg-purple-50/30 border-x border-purple-100/60 text-slate-400">
                <X className="h-4 w-4 mx-auto text-slate-300" />
              </td>
              <td className="py-3.5 px-5 text-center font-bold text-emerald-600">
                <Check className="h-4 w-4 mx-auto text-emerald-600 stroke-[3]" />
              </td>
              <td className="py-3.5 px-5 text-center font-bold text-emerald-600">
                <Check className="h-4 w-4 mx-auto text-emerald-600 stroke-[3]" />
              </td>
            </tr>

            {/* Row 8: Action Buttons */}
            <tr className="bg-slate-50/50">
              <td className="py-4 px-5 font-bold text-slate-900">Plan Status</td>
              <td className="py-4 px-5 text-center bg-purple-50/60 border-x border-purple-100/80">
                <span className="inline-block w-full rounded-xl bg-[#F6EBF1] border border-[#E8DCE4] py-2 px-3 text-xs font-bold text-[#803D63]">
                  Active Plan
                </span>
              </td>
              <td className="py-4 px-5 text-center">
                <button
                  type="button"
                  onClick={() => handleNotifyMe("Pro Plan")}
                  disabled={notifiedPlan === "Pro Plan"}
                  className="w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2 px-3 text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Bell className="h-3.5 w-3.5 text-slate-500" />
                  <span>{notifiedPlan === "Pro Plan" ? "Notified ✓" : "Notify Me"}</span>
                </button>
              </td>
              <td className="py-4 px-5 text-center">
                <button
                  type="button"
                  onClick={() => handleNotifyMe("VIP Plan")}
                  disabled={notifiedPlan === "VIP Plan"}
                  className="w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2 px-3 text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Bell className="h-3.5 w-3.5 text-slate-500" />
                  <span>{notifiedPlan === "VIP Plan" ? "Notified ✓" : "Notify Me"}</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Single Centered Footer Note */}
      <div className="text-center text-xs text-slate-500 font-medium pt-2">
        Free Creator Early Access is active automatically for all users until further notice.
      </div>
    </div>
  );
}
