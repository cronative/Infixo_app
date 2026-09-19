"use client";

import { useState, useEffect } from "react";
import { Layers, Film, Briefcase, CalendarClock, CreditCard, ShieldCheck, XCircle } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { PricingTable } from "@/components/subscription/PricingTable";
import { getSeriesUsage, getTotalEpisodesUsage, getGigUsage, getPlanQuota } from "@/services/subscriptionLimits";
import { MediaKitService } from "@/services/MediaKitService";

function formatSubscriptionDate(value?: string | null) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

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
  const quota = getPlanQuota(planKey);
  const planName = quota.name;
  const isTrial = planKey === "early_access";
  const renewalText = subscription?.autoRenew && subscription?.renewsAt
    ? formatSubscriptionDate(subscription.renewsAt)
    : "No auto-renewal";
  const finishDate =
    subscription?.endsAt || subscription?.currentPeriodEndsAt || subscription?.trialEndsAt || subscription?.activatedAt;
  const statusLabel = subscription?.status === "trial" ? "Free Trial" : subscription?.status || "Trial";

  return (
    <div className="space-y-4 sm:space-y-4.5 w-full pb-8 text-left">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#043084]">
            Plan
          </h1>
          <p className="text-xs sm:text-[13px] text-[#475569] font-medium mt-0.5">
            View your current access, usage limits and upcoming Inflixo plans.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#EAF7F0] border border-[#17845B]/20 px-3 py-1 text-xs font-semibold text-[#17845B]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#17845B]" />
            {planName} Active
          </span>
        </div>
      </div>

      <section className="rounded-xl border border-[#e2e8f0] bg-white p-3.5 sm:p-4 text-left shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#f8fafc] border border-[#e2e8f0] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#64748b]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#043084]" />
              Subscription check
            </span>
            <h2 className="font-display text-base sm:text-lg font-bold text-[#043084]">
              {statusLabel} access for Inflixo {planName}
            </h2>
            <p className="text-xs sm:text-[13px] text-[#475569] font-medium">
              First month offer is ₹99 only. It is a one-time first-month payment and will not renew automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 lg:min-w-[580px]">
            <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                <CalendarClock className="h-3.5 w-3.5 text-[#043084]" />
                Finish date
              </div>
              <p className="mt-0.5 text-xs sm:text-sm font-bold text-[#043084]">{formatSubscriptionDate(finishDate)}</p>
            </div>
            <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                <CreditCard className="h-3.5 w-3.5 text-[#043084]" />
                Renewal
              </div>
              <p className="mt-0.5 text-xs sm:text-sm font-bold text-[#043084]">{renewalText}</p>
            </div>
            <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                <XCircle className="h-3.5 w-3.5 text-[#043084]" />
                Cancel date
              </div>
              <p className="mt-0.5 text-xs sm:text-sm font-bold text-[#043084]">
                {formatSubscriptionDate(subscription?.cancelledAt)}
              </p>
            </div>
            <div className="rounded-lg border border-[#17845B]/20 bg-[#EAF7F0] p-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#17845B]">
                <ShieldCheck className="h-3.5 w-3.5" />
                First month
              </div>
              <p className="mt-0.5 text-xs sm:text-sm font-bold text-[#043084]">
                ₹{subscription?.firstMonthAmount ?? 99} one-time
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECTION 1 — CURRENT PLAN & REAL-TIME USAGE CARD */}
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-4 sm:p-4.5 text-left space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#e2e8f0] pb-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#043084] block">
              CURRENT ACCESS
            </span>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base sm:text-lg font-bold text-[#043084]">
                Inflixo {planName}
              </h2>
              <span className="text-[10px] font-bold text-[#17845B] bg-[#EAF7F0] px-2 py-0.2 rounded-full border border-[#17845B]/20">
                Active
              </span>
            </div>
            <p className="text-xs text-[#64748b] font-medium">
              {isTrial
                ? "Your profile stays public for 7 days. Upgrade when you want to keep it live after the trial."
                : quota.description}
            </p>
          </div>

          <span className="text-xs font-semibold text-[#64748b] shrink-0 self-start sm:self-auto">
            {isTrial ? "No card required for your 7-day trial." : "Your plan limits are applied automatically."}
          </span>
        </div>

        {/* Real-time Usage Metrics (3 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Metric 1: Content Series */}
          <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748b] flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-[#043084]" />
                <span>Series / Playlists</span>
              </span>
              <span className="text-xs font-bold text-[#043084]">
                {seriesUsage.current} of {seriesUsage.max === Infinity ? "Unlimited" : seriesUsage.max}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-[#e2e8f0] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#043084] h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, seriesUsage.percentage)}%` }}
              />
            </div>
            <p className="text-[10px] text-[#64748b] font-medium">
              {seriesUsage.max === Infinity
                ? "Unlimited series allowed"
                : `${Math.max(0, seriesUsage.max - seriesUsage.current)} slots available`}
            </p>
          </div>

          {/* Metric 2: Total Episodes */}
          <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748b] flex items-center gap-1.5">
                <Film className="h-3.5 w-3.5 text-[#043084]" />
                <span>Total Episodes</span>
              </span>
              <span className="text-xs font-bold text-[#043084]">
                {episodeUsage.current} of {episodeUsage.max === Infinity ? "Unlimited" : episodeUsage.max}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-[#e2e8f0] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#043084] h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, episodeUsage.percentage)}%` }}
              />
            </div>
            <p className="text-[10px] text-[#64748b] font-medium">
              {episodeUsage.max === Infinity
                ? "Unlimited episodes allowed"
                : `${Math.max(0, episodeUsage.max - episodeUsage.current)} episode links left`}
            </p>
          </div>

          {/* Metric 3: Creator Services */}
          <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748b] flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-[#043084]" />
                <span>Collab Packages</span>
              </span>
              <span className="text-xs font-bold text-[#043084]">
                {gigUsage.current} of {gigUsage.max === Infinity ? "Unlimited" : gigUsage.max}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-[#e2e8f0] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#043084] h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, gigUsage.percentage)}%` }}
              />
            </div>
            <p className="text-[10px] text-[#64748b] font-medium">
              {gigUsage.max === Infinity
                ? "Unlimited services allowed"
                : `${Math.max(0, gigUsage.max - gigUsage.current)} active slot available`}
            </p>
          </div>
        </div>
      </section>

      {/* 3. SECTION 2 — UPCOMING PLANS & PRICING TABLE */}
      <PricingTable />
    </div>
  );
}
