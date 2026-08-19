"use client";

import { useState } from "react";
import { ShieldCheck, CheckCircle2, Sparkles, Layers, Film } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { BillingCycle, PlanKey } from "@/types";
import { PricingTable } from "@/components/subscription/PricingTable";
import { getSeriesUsage, getTotalEpisodesUsage, EARLY_ACCESS_LIMITS } from "@/services/subscriptionLimits";

export default function DashboardSubscriptionPage() {
  const { series, subscription } = useCreator();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("creator");
  const [cycle, setCycle] = useState<BillingCycle>(subscription.billingCycle || "monthly");

  const seriesUsage = getSeriesUsage(series);
  const episodeUsage = getTotalEpisodesUsage(series);

  return (
    <div className="mx-auto max-w-5xl px-3 sm:px-8 py-4 sm:py-8 space-y-6 text-left">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-black mb-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>EARLY ACCESS ACTIVE</span>
        </div>
        <h1 className="font-display text-2xl font-black text-slate-900 sm:text-3xl">Subscription &amp; Plans</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">
          Inflixo is currently in Early Access. All features and up to 3 Series are 100% free.
        </p>
      </div>

      {/* Current Active Plan Status Banner */}
      <div className="rounded-3xl border-2 border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-white to-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800">Current Plan</span>
              <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-900">
                EARLY ACCESS • FREE
              </span>
            </div>
            <p className="font-display text-2xl font-black text-slate-900">
              Inflixo Early Access
            </p>
            <p className="text-xs text-slate-600 font-bold">
              Free while Inflixo is in Early Access • No credit card required • Does not expire based on signup date
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1 shrink-0">
            <div className="flex items-center gap-3 text-xs font-extrabold text-slate-800 bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-purple-600" />
                <span>Series: <strong className="text-purple-700">{seriesUsage.current} / {EARLY_ACCESS_LIMITS.maxSeries}</strong></span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <Film className="h-4 w-4 text-purple-600" />
                <span>Episodes: <strong className="text-purple-700">{episodeUsage.current} / {episodeUsage.theoreticalMax}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Table displaying Early Access (Free) vs Creator Plan (Coming Soon) */}
      <div className="space-y-4">
        <PricingTable />
      </div>
    </div>
  );
}
