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
          <Sparkles className="h-4 w-4 text-[#803D63] shrink-0" />
          <p className="font-medium text-xs sm:text-sm">
            🎉 <strong>Early Creator Access Active</strong> — Enjoy full access free during our launch phase. Paid tiers will unlock later with extra power tools.
          </p>
        </div>
      )}

      {/* 3 PLAN CARDS: STARTER / FREE ACCESS | PRO PLAN | VIP PLAN (MEDIA KIT & SPONSORSHIPS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {/* CARD 1: PRIMARY ACTIVE CARD (FREE EARLY ACCESS) */}
        <div className="flex flex-col justify-between rounded-2xl border-2 border-[#803D63] bg-white p-5 relative shadow-sm text-left">
          <div className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-700">
            Active Launch Plan
          </div>

          <div>
            <div className="mt-1 space-y-0.5">
              <h4 className="font-display text-base font-bold text-slate-900 uppercase tracking-wider">
                STARTER / FREE ACCESS
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
                  Forever Free • No credit card needed
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Included Features:
              </p>
              <ul className="space-y-2 text-xs font-medium text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#803D63] shrink-0 stroke-[2.5]" />
                  <span>Public Inflixo Landing Page</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#803D63] shrink-0 stroke-[2.5]" />
                  <span>Unified Total Fanbase Counter</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#803D63] shrink-0 stroke-[2.5]" />
                  <span>Instagram, YouTube &amp; Facebook Sync</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#803D63] shrink-0 stroke-[2.5]" />
                  <span>Up to 3 OTT Video Series</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#803D63] shrink-0 stroke-[2.5]" />
                  <span>Up to 5 Episodes per Series</span>
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

        {/* CARD 2: PRO PLAN (UNLIMITED SERIES & CUSTOM DOMAINS) */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 relative hover:border-slate-300 transition-colors text-left shadow-2xs">
          <div className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-3 py-0.5 text-xs font-semibold text-slate-600">
            Coming Soon • PRO Tier
          </div>

          <div>
            <div className="mt-1 space-y-0.5">
              <h4 className="font-display text-base font-bold text-slate-900 uppercase tracking-wider">
                INFLIXO PRO PLAN
              </h4>
              <p className="text-xs font-medium text-slate-500">
                Unlimited OTT series &amp; custom domain branding
              </p>
            </div>

            <div className="mt-4 pt-1">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl font-extrabold text-slate-900">
                  ₹299
                </span>
                <span className="text-xs font-medium text-slate-500">/ mo</span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
                Billed monthly or ₹2,499/year (~30% OFF)
              </p>
            </div>

            <div className="mt-5 space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Everything in Starter + Pro Features:
              </p>
              <ul className="space-y-2 text-xs font-medium text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-800">Unlimited OTT Series &amp; Episodes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>All 16+ Premium Themes &amp; Custom Fonts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Custom Profile Handle &amp; Subdomain</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Advanced Audience Click Retention Stats</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Remove Inflixo Footer Branding</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleNotifyMe("Inflixo Pro Plan")}
              disabled={notifiedPlan === "Inflixo Pro Plan"}
              className="w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2.5 px-4 text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Bell className="h-3.5 w-3.5 text-slate-500" />
              <span>{notifiedPlan === "Inflixo Pro Plan" ? "We'll Notify You! ✓" : "🔔 Notify Me at Launch"}</span>
            </button>
          </div>
        </div>

        {/* CARD 3: VIP PLAN (MEDIA KIT & BRAND COLLABORATION PACKAGES) */}
        <div className="flex flex-col justify-between rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-50/40 via-white to-white p-5 relative shadow-md text-left">
          <div className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-amber-400 text-amber-950 px-3 py-0.5 text-xs font-black shadow-2xs">
            👑 VIP PLAN • BRAND COLLABS
          </div>

          <div>
            <div className="mt-1 space-y-0.5">
              <h4 className="font-display text-base font-bold text-slate-900 uppercase tracking-wider">
                INFLIXO VIP PLAN
              </h4>
              <p className="text-xs font-medium text-slate-600">
                Media kit, brand rate card &amp; sponsorship portal
              </p>
            </div>

            <div className="mt-4 pt-1">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl font-extrabold text-slate-900">
                  ₹799
                </span>
                <span className="text-xs font-medium text-slate-500">/ mo</span>
              </div>
              <p className="mt-0.5 text-[11px] text-amber-700 font-bold">
                Designed for Monetizing Creators &amp; Agencies
              </p>
            </div>

            <div className="mt-5 space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Everything in Pro + VIP Power Tools:
              </p>
              <ul className="space-y-2 text-xs font-medium text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-600 shrink-0 stroke-[2.5]" />
                  <span className="font-bold text-slate-900">Interactive Creator Media Kit</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-600 shrink-0 stroke-[2.5]" />
                  <span className="font-bold text-slate-900">Collaboration Packages &amp; Rate Cards</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-600 shrink-0 stroke-[2.5]" />
                  <span>Direct Brand Inquiry Form &amp; Budget Filter</span>
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
              onClick={() => handleNotifyMe("Inflixo VIP Plan")}
              disabled={notifiedPlan === "Inflixo VIP Plan"}
              className="w-full rounded-xl bg-amber-400 hover:bg-amber-500 py-2.5 px-4 text-xs font-black text-amber-950 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-950" />
              <span>{notifiedPlan === "Inflixo VIP Plan" ? "We'll Notify You! ✓" : "✨ Join VIP Waitlist"}</span>
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

