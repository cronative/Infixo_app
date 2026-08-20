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
    <div className="mx-auto max-w-5xl px-3 sm:px-6 py-4 sm:py-6 space-y-4 text-left">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold mb-1.5">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>EARLY ACCESS ACTIVE</span>
        </div>
        <h1 className="font-display text-xl font-bold text-slate-900">Subscription &amp; Plans</h1>
        <p className="mt-0.5 text-xs text-slate-500 font-medium">
          Inflixo is currently in Early Access. All features and up to 3 Series are 100% free.
        </p>
      </div>

      {/* Current Active Plan Status Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Current Plan</span>
              <span className="rounded border border-emerald-300 bg-emerald-100 px-2 py-0.2 text-[10px] font-bold text-emerald-900">
                EARLY ACCESS • FREE
              </span>
            </div>
            <p className="font-display text-lg font-bold text-slate-900">
              Inflixo Early Access
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Free while Inflixo is in Early Access • No credit card required
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1 shrink-0">
            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              <div className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-[#6366F1]" />
                <span>Series: <strong className="text-[#6366F1]">{seriesUsage.current} / {EARLY_ACCESS_LIMITS.maxSeries}</strong></span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1">
                <Film className="h-3.5 w-3.5 text-[#6366F1]" />
                <span>Episodes: <strong className="text-[#6366F1]">{episodeUsage.current} / {episodeUsage.theoreticalMax}</strong></span>
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
