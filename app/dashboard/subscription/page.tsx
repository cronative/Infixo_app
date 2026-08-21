"use client";

import { useState, useEffect } from "react";
import { Sparkles, Layers, Film, Briefcase } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { BillingCycle, PlanKey } from "@/types";
import { PricingTable } from "@/components/subscription/PricingTable";
import { getSeriesUsage, getTotalEpisodesUsage, getGigUsage } from "@/services/subscriptionLimits";
import { MediaKitService } from "@/services/MediaKitService";

export default function DashboardSubscriptionPage() {
  const { profile, series, subscription } = useCreator();
  const [activeGigsCount, setActiveGigsCount] = useState(0);

  useEffect(() => {
    async function loadGigs() {
      const packages = MediaKitService.getPackages();
      setActiveGigsCount(packages.filter((p) => p.isActive).length);
    }
    loadGigs();
  }, [profile]);

  const planKey = subscription?.planKey || "early_access";
  const seriesUsage = getSeriesUsage(series, planKey);
  const episodeUsage = getTotalEpisodesUsage(series, planKey);
  const gigUsage = getGigUsage(activeGigsCount, planKey);

  return (
    <div className="min-h-dvh bg-[#F9FAFB] text-slate-900 pb-16">
      {/* Sticky Page Subheader */}
      <div className="sticky top-0 z-30 bg-[#FAF8FA]/95 backdrop-blur-md border-b border-[#E8DCE4]/80 px-3 sm:px-6 py-3.5 shadow-2xs text-left mb-6">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-base font-extrabold text-slate-900 truncate">
              Subscription &amp; Plans
            </h1>
            <p className="text-xs text-slate-500 font-medium truncate">
              Inflixo Early Access is 100% free for all creators until Pro &amp; VIP plans launch.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-bold shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>EARLY ACCESS FREE</span>
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 sm:px-6 space-y-5">
        {/* Current Active Plan Status Banner */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Current Plan</span>
                <span className="rounded-md border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-900">
                  EARLY ACCESS • FREE
                </span>
              </div>
              <p className="font-display text-lg font-extrabold text-slate-900">
                Inflixo Early Access
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Free for all creators until Creator Pro &amp; VIP plans are launched • No credit card required
              </p>
            </div>

            {/* Real-time Usage Meter Pills */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <Layers className="h-4 w-4 text-[#803D63]" />
                <span>Series: <strong className="text-[#803D63]">{seriesUsage.current} / {seriesUsage.max === Infinity ? "∞" : seriesUsage.max}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <Film className="h-4 w-4 text-[#803D63]" />
                <span>Episodes: <strong className="text-[#803D63]">{episodeUsage.current} / {episodeUsage.max === Infinity ? "∞" : episodeUsage.max}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <Briefcase className="h-4 w-4 text-[#803D63]" />
                <span>Collab Gigs: <strong className="text-[#803D63]">{gigUsage.current} / {gigUsage.max === Infinity ? "∞" : gigUsage.max}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Table with Monthly/Yearly Toggle */}
        <div className="space-y-4">
          <PricingTable />
        </div>
      </div>
    </div>
  );
}
