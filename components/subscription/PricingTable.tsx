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

  function handleNotifyMe(planName: string) {
    setNotifiedPlan(planName);
    showToast(`We'll notify you as soon as ${planName} goes live! 🚀`);
  }

  return (
    <div className="w-full space-y-6 max-w-6xl mx-auto py-2 text-left">
      {/* Lightweight Informational Banner Strip */}
      {showEarlyAccessBanner && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm text-indigo-900 flex items-center gap-2.5 shadow-2xs">
          <Sparkles className="h-4 w-4 text-[#6366F1] shrink-0" />
          <p className="font-medium text-xs sm:text-sm">
            🎉 <strong>Early Creator Access Active</strong> — Enjoy full access free during our launch phase. Paid tiers will unlock later with extra power tools.
          </p>
        </div>
      )}

      {/* 3 PLAN CARDS: FREE EARLY ACCESS | CREATOR PRO (MONTHLY) | CREATOR PRO (YEARLY) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {/* CARD 1: PRIMARY ACTIVE CARD (FREE EARLY ACCESS) */}
        <div className="flex flex-col justify-between rounded-xl border-2 border-[#6366F1] bg-white p-5 relative shadow-sm">
          <div className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-700">
            Active Launch Plan
          </div>

          <div>
            <div className="mt-1 space-y-0.5">
              <h4 className="font-display text-base font-bold text-slate-900 uppercase tracking-wider">
                FREE EARLY ACCESS
              </h4>
              <p className="text-xs font-medium text-slate-500">
                100% Free while Inflixo is in Early Access
              </p>
            </div>

            <div className="mt-4 pt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-extrabold text-slate-900">
                  ₹0
                </span>
                <span className="text-xs font-medium text-slate-500">
                  Forever Free during Early Access • No credit card needed
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Included Features:
              </p>
              <ul className="space-y-2 text-xs font-medium text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#6366F1] shrink-0 stroke-[2.5]" />
                  <span>Public Inflixo Profile (Live immediately)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#6366F1] shrink-0 stroke-[2.5]" />
                  <span>Unified Total Fanbase Counter</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#6366F1] shrink-0 stroke-[2.5]" />
                  <span>Instagram, YouTube &amp; Facebook Integration</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#6366F1] shrink-0 stroke-[2.5]" />
                  <span>Up to 3 OTT Video Series</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#6366F1] shrink-0 stroke-[2.5]" />
                  <span>Up to 5 Episodes per Series</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#6366F1] shrink-0 stroke-[2.5]" />
                  <span>All Core Profile Themes Included</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100">
            <div className="w-full rounded-xl bg-indigo-50 border border-indigo-200 py-2.5 px-4 text-xs font-bold text-[#6366F1] text-center">
              ✓ Active Plan (Current)
            </div>
          </div>
        </div>

        {/* CARD 2: MONTHLY PRO TIER (UPCOMING PREVIEW) */}
        <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 relative hover:border-gray-300 transition-colors">
          <div className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-3 py-0.5 text-xs font-semibold text-slate-600">
            Coming Soon
          </div>

          <div>
            <div className="mt-1 space-y-0.5">
              <h4 className="font-display text-base font-bold text-slate-900 uppercase tracking-wider">
                CREATOR PRO (MONTHLY)
              </h4>
              <p className="text-xs font-medium text-slate-500">
                Unlimited series &amp; professional power tools
              </p>
            </div>

            <div className="mt-4 pt-1">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl font-extrabold text-slate-900">
                  ₹199
                </span>
                <span className="text-xs font-medium text-slate-500">/ mo</span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
                Billed monthly • Unlock power tools
              </p>
            </div>

            <div className="mt-5 space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Features Included:
              </p>
              <ul className="space-y-2 text-xs font-medium text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Unlimited Series &amp; Episodes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Advanced Fanbase Analytics &amp; CTR</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Custom Profile Slug &amp; Branding Removal</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Priority Creator Support</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleNotifyMe("Creator Pro Monthly")}
              disabled={notifiedPlan === "Creator Pro Monthly"}
              className="w-full rounded-xl border border-gray-200 bg-white hover:bg-gray-50 py-2.5 px-4 text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Bell className="h-3.5 w-3.5 text-slate-500" />
              <span>{notifiedPlan === "Creator Pro Monthly" ? "We'll Notify You! ✓" : "🔔 Notify Me at Launch"}</span>
            </button>
          </div>
        </div>

        {/* CARD 3: YEARLY PRO TIER (UPCOMING PREVIEW) */}
        <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 relative hover:border-gray-300 transition-colors">
          <div className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-3 py-0.5 text-xs font-semibold text-slate-600">
            Coming Soon • Best Value
          </div>

          <div>
            <div className="mt-1 space-y-0.5">
              <h4 className="font-display text-base font-bold text-slate-900 uppercase tracking-wider">
                CREATOR PRO (YEARLY)
              </h4>
              <p className="text-xs font-medium text-slate-500">
                Annual plan with ~2 months free
              </p>
            </div>

            <div className="mt-4 pt-1">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl font-extrabold text-slate-900">
                  ₹1,999
                </span>
                <span className="text-xs font-medium text-slate-500">/ yr</span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
                Billed annually • Save ₹389/year
              </p>
            </div>

            <div className="mt-5 space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Features Included:
              </p>
              <ul className="space-y-2 text-xs font-medium text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Unlimited Series &amp; Episodes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Advanced Fanbase Analytics &amp; CTR</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Custom Profile Slug &amp; Branding Removal</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Priority Creator Support</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleNotifyMe("Creator Pro Yearly")}
              disabled={notifiedPlan === "Creator Pro Yearly"}
              className="w-full rounded-xl border border-gray-200 bg-white hover:bg-gray-50 py-2.5 px-4 text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Bell className="h-3.5 w-3.5 text-slate-500" />
              <span>{notifiedPlan === "Creator Pro Yearly" ? "We'll Notify You! ✓" : "🔔 Notify Me at Launch"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Single Centered Footer Note */}
      <div className="text-center text-xs text-slate-500 font-medium pt-2">
        ✨ Free Early Access is active automatically. You will be notified before any paid plans launch.
      </div>
    </div>
  );
}

