"use client";

import { useState } from "react";
import { Check, Sparkles, Bell } from "lucide-react";
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
    showToast(`We'll notify you as soon as ${planName} goes live! 🚀`);
  }

  return (
    <div className="w-full space-y-6 max-w-6xl mx-auto py-2 text-left">
      {/* Lightweight Informational Banner Strip */}
      {showEarlyAccessBanner && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm text-indigo-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-[#803D63] shrink-0" />
            <p className="font-medium text-xs sm:text-sm">
              🎉 <strong>Creator Early Access Active</strong> — Enjoy full features free (3 Series, 15 Episodes, 1 Collab Gig) until Creator Pro &amp; VIP plans launch!
            </p>
          </div>
          <span className="bg-[#803D63] text-white text-[10px] font-black px-3 py-1 rounded-full shrink-0 shadow-2xs">
            FREE UNTIL LAUNCH
          </span>
        </div>
      )}

      {/* Monthly vs Yearly Billing Switcher Toggle */}
      <div className="flex items-center justify-center gap-3 py-2">
        <div className="inline-flex items-center rounded-xl bg-slate-200/80 p-1 border border-slate-300/60 shadow-2xs">
          <button
            type="button"
            onClick={() => setCycle("monthly")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              cycle === "monthly"
                ? "bg-white text-slate-900 shadow-2xs"
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
            <span className="bg-amber-400 text-amber-950 text-[9px] font-black px-1.5 py-0.5 rounded-md">
              SAVE ~16%
            </span>
          </button>
        </div>
      </div>

      {/* 3 PLAN CARDS: EARLY ACCESS | CREATOR PRO | CREATOR VIP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {/* CARD 1: EARLY ACCESS (FREE ACTIVE) */}
        <div className="flex flex-col justify-between rounded-2xl border-2 border-[#803D63] bg-white p-5 relative shadow-sm text-left">
          <div className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-700">
            Active Launch Plan
          </div>

          <div>
            <div className="mt-1 space-y-0.5">
              <h4 className="font-display text-base font-bold text-slate-900 uppercase tracking-wider">
                CREATOR EARLY ACCESS
              </h4>
              <p className="text-xs font-medium text-slate-500">
                100% Free for all creators during launch phase
              </p>
            </div>

            <div className="mt-4 pt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-extrabold text-slate-900">
                  ₹0
                </span>
                <span className="text-xs font-medium text-slate-500">
                  Free until Pro &amp; VIP launch
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Included Free Quotas:
              </p>
              <ul className="space-y-2 text-xs font-medium text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#803D63] shrink-0 stroke-[2.5]" />
                  <span><strong>3 Web Series</strong> Limit</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#803D63] shrink-0 stroke-[2.5]" />
                  <span><strong>15 Total Episodes</strong> Limit</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#803D63] shrink-0 stroke-[2.5]" />
                  <span><strong>1 Active Collab Gig</strong> Package</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#803D63] shrink-0 stroke-[2.5]" />
                  <span>Public Inflixo Creator Profile</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#803D63] shrink-0 stroke-[2.5]" />
                  <span>Instagram, YouTube &amp; Facebook Sync</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#803D63] shrink-0 stroke-[2.5]" />
                  <span>All Standard Profile Themes</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100">
            <div className="w-full rounded-xl bg-[#F6EBF1] border border-[#E8DCE4] py-2.5 px-4 text-xs font-bold text-[#803D63] text-center">
              ✓ Active Plan (Current)
            </div>
          </div>
        </div>

        {/* CARD 2: CREATOR PRO PLAN */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 relative hover:border-slate-300 transition-colors text-left shadow-2xs">
          <div className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-3 py-0.5 text-xs font-semibold text-slate-600">
            Coming Soon • PRO Tier
          </div>

          <div>
            <div className="mt-1 space-y-0.5">
              <h4 className="font-display text-base font-bold text-slate-900 uppercase tracking-wider">
                CREATOR PRO PLAN
              </h4>
              <p className="text-xs font-medium text-slate-500">
                Unlimited series &amp; episodes for growing creators
              </p>
            </div>

            <div className="mt-4 pt-1">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl font-extrabold text-slate-900">
                  {cycle === "yearly" ? "₹1,999" : "₹199"}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {cycle === "yearly" ? "/ year" : "/ month"}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
                {cycle === "yearly" ? "₹1,999 billed annually (~₹166/mo)" : "Or ₹1,999/year (Save ~16%)"}
              </p>
            </div>

            <div className="mt-5 space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Everything in Early Access + Pro Features:
              </p>
              <ul className="space-y-2 text-xs font-medium text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-900">Unlimited OTT Web Series ♾️</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-900">Unlimited Episodes ♾️</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Up to 5 Active Collab Gigs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Remove Inflixo Footer Branding</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Priority Support &amp; Analytics</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleNotifyMe("Creator Pro Plan")}
              disabled={notifiedPlan === "Creator Pro Plan"}
              className="w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2.5 px-4 text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Bell className="h-3.5 w-3.5 text-slate-500" />
              <span>{notifiedPlan === "Creator Pro Plan" ? "We'll Notify You! ✓" : "🔔 Notify Me at Launch"}</span>
            </button>
          </div>
        </div>

        {/* CARD 3: CREATOR VIP PLAN */}
        <div className="flex flex-col justify-between rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-50/40 via-white to-white p-5 relative shadow-md text-left">
          <div className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-amber-400 text-amber-950 px-3 py-0.5 text-xs font-black shadow-2xs">
            👑 CREATOR VIP • BRAND COLLABS
          </div>

          <div>
            <div className="mt-1 space-y-0.5">
              <h4 className="font-display text-base font-bold text-slate-900 uppercase tracking-wider">
                CREATOR VIP PLAN
              </h4>
              <p className="text-xs font-medium text-slate-600">
                Media kit, brand rate card &amp; sponsorship portal
              </p>
            </div>

            <div className="mt-4 pt-1">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl font-extrabold text-slate-900">
                  {cycle === "yearly" ? "₹2,999" : "₹299"}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {cycle === "yearly" ? "/ year" : "/ month"}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-amber-700 font-bold">
                {cycle === "yearly" ? "₹2,999 billed annually (~₹249/mo)" : "Or ₹2,999/year (Save ~16%)"}
              </p>
            </div>

            <div className="mt-5 space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Everything in Pro + VIP Power Tools:
              </p>
              <ul className="space-y-2 text-xs font-medium text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-600 shrink-0 stroke-[2.5]" />
                  <span className="font-bold text-slate-900">Unlimited Web Series &amp; Episodes ♾️</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-600 shrink-0 stroke-[2.5]" />
                  <span className="font-bold text-slate-900">Unlimited Collab Gigs &amp; Media Kit ♾️</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-600 shrink-0 stroke-[2.5]" />
                  <span>Direct WhatsApp &amp; Email Sponsor Inquiry</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-600 shrink-0 stroke-[2.5]" />
                  <span>Exportable One-Click PDF Media Kit</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-600 shrink-0 stroke-[2.5]" />
                  <span>Dedicated VIP Creator Manager</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-amber-100">
            <button
              type="button"
              onClick={() => handleNotifyMe("Creator VIP Plan")}
              disabled={notifiedPlan === "Creator VIP Plan"}
              className="w-full rounded-xl bg-amber-400 hover:bg-amber-500 py-2.5 px-4 text-xs font-black text-amber-950 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-950" />
              <span>{notifiedPlan === "Creator VIP Plan" ? "We'll Notify You! ✓" : "✨ Join VIP Waitlist"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Single Centered Footer Note */}
      <div className="text-center text-xs text-slate-500 font-medium pt-2">
        ✨ Free Creator Early Access is active automatically for all users until Creator Pro &amp; VIP plans launch.
      </div>
    </div>
  );
}
