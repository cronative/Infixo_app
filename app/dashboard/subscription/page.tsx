"use client";

import { useState, useEffect } from "react";
import { Layers, Film, Briefcase, Sparkles, Check } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
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
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#17131A] tracking-tight">
            Plan
          </h1>
          <p className="text-xs sm:text-sm text-[#6F6872] font-medium mt-1">
            View your current access, usage limits and upcoming Inflixo plans.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#ECFDF3] border border-[#ECE8EB] px-3.5 py-1.5 text-xs font-semibold text-[#16794A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16794A]" />
            Early Access Active
          </span>
        </div>
      </div>

      {/* 2. SECTION 1 — CURRENT PLAN & REAL-TIME USAGE CARD */}
      <section className="rounded-2xl border border-[#ECE8EB] bg-white p-5 sm:p-6 text-left space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ECE8EB] pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#803D63] block">
              CURRENT ACCESS
            </span>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-[#17131A]">
                Inflixo Early Access
              </h2>
              <span className="text-[10px] font-bold text-[#16794A] bg-[#ECFDF3] px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <p className="text-xs text-[#6F6872] font-medium">
              You currently have Early Access to Inflixo while creator plans are being prepared.
            </p>
          </div>

          <span className="text-xs font-semibold text-[#6F6872] shrink-0 self-start sm:self-auto">
            Early Access is currently available to all creators. No card required.
          </span>
        </div>

        {/* Real-time Usage Metrics (3 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Metric 1: Content Series */}
          <div className="rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6F6872] flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-[#803D63]" />
                <span>Content Series</span>
              </span>
              <span className="text-xs font-bold text-[#17131A]">
                {seriesUsage.current} of {seriesUsage.max === Infinity ? "Unlimited" : seriesUsage.max}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-[#ECE8EB] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#803D63] h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, seriesUsage.percentage)}%` }}
              />
            </div>
            <p className="text-[10px] text-[#6F6872] font-medium">
              {seriesUsage.max === Infinity
                ? "Unlimited series allowed"
                : `${seriesUsage.max - seriesUsage.current} slots available`}
            </p>
          </div>

          {/* Metric 2: Total Episodes */}
          <div className="rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6F6872] flex items-center gap-1.5">
                <Film className="h-3.5 w-3.5 text-[#803D63]" />
                <span>Total Episodes</span>
              </span>
              <span className="text-xs font-bold text-[#17131A]">
                {episodeUsage.current} of {episodeUsage.max === Infinity ? "Unlimited" : episodeUsage.max}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-[#ECE8EB] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#803D63] h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, episodeUsage.percentage)}%` }}
              />
            </div>
            <p className="text-[10px] text-[#6F6872] font-medium">
              {episodeUsage.max === Infinity
                ? "Unlimited episodes allowed"
                : `${episodeUsage.max - episodeUsage.current} episode uploads left`}
            </p>
          </div>

          {/* Metric 3: Creator Services */}
          <div className="rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6F6872] flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-[#803D63]" />
                <span>Creator Services</span>
              </span>
              <span className="text-xs font-bold text-[#17131A]">
                {gigUsage.current} of {gigUsage.max === Infinity ? "Unlimited" : gigUsage.max}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-[#ECE8EB] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#803D63] h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, gigUsage.percentage)}%` }}
              />
            </div>
            <p className="text-[10px] text-[#6F6872] font-medium">
              {gigUsage.max === Infinity
                ? "Unlimited services allowed"
                : `${gigUsage.max - gigUsage.current} active slot available`}
            </p>
          </div>
        </div>
      </section>

      {/* 3. SECTION 2 — UPCOMING PLANS & PRICING TABLE */}
      <PricingTable />
    </div>
  );
}
