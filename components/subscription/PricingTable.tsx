"use client";

import { useState } from "react";
import { Check, Sparkles, ShieldCheck, Bell, Info, Zap } from "lucide-react";
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

  function handleNotifyMe(planName: string) {
    setNotifiedPlan(planName);
    showToast(`We'll notify you as soon as ${planName} goes live! 🚀`);
  }

  return (
    <div className="w-full space-y-8 max-w-6xl mx-auto py-2 text-left">
      {/* Optional Early Access Banner */}
      {showEarlyAccessBanner && (
        <div className="relative overflow-hidden rounded-3xl border border-purple-200/80 bg-[#651FFF] p-5 sm:p-6 text-white shadow-md shadow-purple-600/25">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white border border-white/30">
                <Sparkles className="h-3.5 w-3.5" />
                <span>INFLIXO EARLY ACCESS • 100% FREE</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-normal">
                Enjoy Free Access During Early Launch
              </h3>
              <p className="text-xs sm:text-sm text-purple-100 leading-relaxed font-medium">
                All early creators get <strong>Free Early Access</strong>. Creator Pro monthly &amp; yearly plans will launch soon with extra premium features!
              </p>
            </div>

            <div className="shrink-0 flex flex-col items-start md:items-end gap-1.5">
              <span className="rounded-2xl bg-white/20 text-white px-3.5 py-2 text-xs font-bold border border-white/30 backdrop-blur-md flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-300" /> No Credit Card Required
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3 PLAN CARDS: FREE EARLY ACCESS | CREATOR PRO (MONTHLY) | CREATOR PRO (YEARLY) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* CARD 1: FREE EARLY ACCESS */}
        <div className="flex flex-col justify-between rounded-3xl border-2 border-emerald-500/80 bg-white p-6 shadow-xs relative hover:border-emerald-600 transition-all">
          <div className="absolute -top-3.5 left-6 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3.5 py-1 text-xs font-bold text-white shadow-md">
            Active Early Access ✓
          </div>

          <div>
            <div className="mt-2 space-y-1">
              <h4 className="font-display text-xl font-bold text-slate-900 uppercase tracking-wider">
                FREE EARLY ACCESS
              </h4>
              <p className="text-xs font-semibold text-slate-500">
                100% Free while Inflixo is in Early Access
              </p>
            </div>

            <div className="mt-5 rounded-2xl bg-emerald-50/80 p-4 border border-emerald-100">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-bold tracking-normal text-slate-900">
                  ₹0
                </span>
                <span className="text-xs font-semibold text-slate-500">/ forever free</span>
              </div>
              <p className="mt-1 text-xs font-bold text-emerald-800">
                No credit card required
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Included in Early Access:
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-slate-800">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 stroke-[3] shrink-0" />
                  <span>Creator Profile Page</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 stroke-[3] shrink-0" />
                  <span>Instagram, YouTube &amp; Facebook</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 stroke-[3] shrink-0" />
                  <span>Total Fanbase Counter</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 stroke-[3] shrink-0" />
                  <span>Public Inflixo Link</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 stroke-[3] shrink-0" />
                  <span>Up to 3 Series</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 stroke-[3] shrink-0" />
                  <span>Up to 5 Episodes per Series</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled
              className="w-full rounded-2xl bg-emerald-100 py-3 px-4 text-xs font-bold text-emerald-800 text-center"
            >
              Active Plan (Free)
            </button>
          </div>
        </div>

        {/* CARD 2: CREATOR PRO — MONTHLY PLAN */}
        <div className="flex flex-col justify-between rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-xs relative hover:border-purple-600 transition-all">
          <div className="absolute -top-3.5 left-6 inline-flex items-center gap-1 rounded-full bg-slate-900 px-3.5 py-1 text-xs font-bold text-white shadow-md">
            Monthly Plan
          </div>

          <div>
            <div className="mt-2 space-y-1">
              <h4 className="font-display text-xl font-bold text-slate-900 uppercase tracking-wider">
                CREATOR PRO (MONTHLY)
              </h4>
              <p className="text-xs font-semibold text-slate-500">
                Unlimited series &amp; professional tools
              </p>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-100 p-4 border border-slate-200">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-bold tracking-normal text-slate-900">
                  ₹199
                </span>
                <span className="text-xs font-semibold text-slate-500">/ month</span>
              </div>
              <p className="mt-1 text-xs font-bold text-slate-700">
                Billed monthly • Cancel anytime
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Everything in Free plus:
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-slate-800">
                <li className="flex items-center gap-2.5 text-slate-900 font-bold">
                  <Check className="h-4 w-4 text-[#651FFF] stroke-[3] shrink-0" />
                  <span>Unlimited Series &amp; Episodes</span>
                </li>
                <li className="flex items-center gap-2.5 text-slate-900 font-bold">
                  <Check className="h-4 w-4 text-[#651FFF] stroke-[3] shrink-0" />
                  <span>All Premium Themes</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#651FFF] stroke-[3] shrink-0" />
                  <span>Custom Bio Link Slug</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#651FFF] stroke-[3] shrink-0" />
                  <span>Advanced Analytics &amp; Clicks</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#651FFF] stroke-[3] shrink-0" />
                  <span>Priority Creator Support</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleNotifyMe("Creator Pro Monthly")}
              disabled={notifiedPlan === "Creator Pro Monthly"}
              className="tap-scale w-full rounded-2xl bg-slate-900 hover:bg-slate-800 py-3.5 px-6 text-xs sm:text-sm font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              {notifiedPlan === "Creator Pro Monthly" ? "We'll Notify You! ✓" : "Notify Me (Monthly ₹199)"}
            </button>
          </div>
        </div>

        {/* CARD 3: CREATOR PRO — YEARLY PLAN */}
        <div className="flex flex-col justify-between rounded-3xl border-2 border-[#651FFF] bg-white p-6 shadow-md relative ring-4 ring-purple-100 hover:scale-[1.02] transition-all">
          <div className="absolute -top-3.5 left-6 inline-flex items-center gap-1 rounded-full bg-[#651FFF] px-3.5 py-1 text-xs font-bold text-white shadow-md">
            Best Value ⭐ Save ₹389
          </div>

          <div>
            <div className="mt-2 space-y-1">
              <h4 className="font-display text-xl font-bold text-slate-900 uppercase tracking-wider">
                CREATOR PRO (YEARLY)
              </h4>
              <p className="text-xs font-semibold text-slate-500">
                Annual plan with ~2 months free
              </p>
            </div>

            <div className="mt-5 rounded-2xl bg-purple-50/80 p-4 border border-purple-100">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-bold tracking-normal text-slate-900">
                  ₹1,999
                </span>
                <span className="text-xs font-semibold text-slate-500">/ year</span>
              </div>
              <p className="mt-1 text-xs font-bold text-[#651FFF]">
                Save ₹389/year (Roughly 2 months free!)
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Everything in Monthly plus:
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-slate-800">
                <li className="flex items-center gap-2.5 text-slate-900 font-bold">
                  <Check className="h-4 w-4 text-[#651FFF] stroke-[3] shrink-0" />
                  <span>Unlimited Series &amp; Episodes</span>
                </li>
                <li className="flex items-center gap-2.5 text-slate-900 font-bold">
                  <Check className="h-4 w-4 text-[#651FFF] stroke-[3] shrink-0" />
                  <span>All Premium Themes</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#651FFF] stroke-[3] shrink-0" />
                  <span>Custom Bio Link Slug</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#651FFF] stroke-[3] shrink-0" />
                  <span>Advanced Analytics &amp; Clicks</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#651FFF] stroke-[3] shrink-0" />
                  <span>Priority Creator Support</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleNotifyMe("Creator Pro Yearly")}
              disabled={notifiedPlan === "Creator Pro Yearly"}
              className="tap-scale w-full rounded-2xl bg-[#651FFF] hover:bg-[#500CD6] py-3.5 px-6 text-xs sm:text-sm font-bold text-white shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              {notifiedPlan === "Creator Pro Yearly" ? "We'll Notify You! ✓" : "Notify Me (Yearly ₹1,999)"}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-semibold pt-2">
        <Info className="h-4 w-4 text-[#651FFF]" />
        <span>Free Early Access applies automatically. Paid Creator Pro plans launch after Early Access phase.</span>
      </div>
    </div>
  );
}
