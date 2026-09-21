"use client";

import { useState, useEffect, useRef } from "react";
import {
  Layers,
  Film,
  Briefcase,
  CalendarClock,
  CreditCard,
  ShieldCheck,
  XCircle,
  Sparkles,
  ArrowUpRight,
  AlertTriangle,
  Check,
  Minus,
  CheckCircle2,
  X,
  RefreshCw,
  Zap,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { PricingTable } from "@/components/subscription/PricingTable";
import {
  getSeriesUsage,
  getTotalEpisodesUsage,
  getGigUsage,
  getPlanQuota,
} from "@/services/subscriptionLimits";
import { MediaKitService } from "@/services/MediaKitService";
import { SubscriptionService } from "@/services/SubscriptionService";
import { getPlanPrice, formatPlanPrice } from "@/lib/pricing";

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
  const { profile, series, subscription, refresh } = useCreator();
  const [activeGigsCount, setActiveGigsCount] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAllPlans, setShowAllPlans] = useState(true);

  const upgradeSectionRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    async function loadGigs() {
      const packages = MediaKitService.getPackages();
      setActiveGigsCount(packages.filter((p) => p.isActive).length);
    }
    loadGigs();
  }, [profile]);

  const planKey = subscription?.planKey || "early_access";
  const normalizedKey =
    planKey === "creator_pro" || planKey === "pro"
      ? "pro"
      : planKey === "creator_VIP" || planKey === "vip"
      ? "vip"
      : planKey === "starter"
      ? "starter"
      : "early_access";

  const seriesUsage = getSeriesUsage(series, planKey);
  const episodeUsage = getTotalEpisodesUsage(series, planKey);
  const gigUsage = getGigUsage(activeGigsCount, planKey);
  const quota = getPlanQuota(planKey);
  const planName = quota.name;
  const isTrial = planKey === "early_access";
  const isAutoRenewActive = Boolean(subscription?.autoRenew && subscription?.renewsAt);
  const renewalText = isAutoRenewActive
    ? formatSubscriptionDate(subscription?.renewsAt)
    : "No auto-renewal";
  const finishDate =
    subscription?.endsAt ||
    subscription?.currentPeriodEndsAt ||
    subscription?.trialEndsAt ||
    subscription?.activatedAt;
  const statusLabel =
    subscription?.status === "trial"
      ? "Free Trial"
      : subscription?.status === "cancelled"
      ? "Cancelled"
      : subscription?.status || "Active";

  const billingCycle = subscription?.billingCycle || "monthly";
  const paidKey: "starter" | "pro" | "vip" =
    normalizedKey === "early_access" ? "starter" : normalizedKey;
  const activePriceDisplay = isTrial
    ? "Free (7 Days Trial)"
    : `${formatPlanPrice(paidKey, billingCycle, "INR")} / ${
        billingCycle === "yearly" ? "year" : "month"
      }`;

  const isStarterOrTrial =
    planKey === "starter" ||
    planKey === "early_access" ||
    subscription?.status === "trial";

  const activatedMs = subscription?.activatedAt ? new Date(subscription.activatedAt).getTime() : Date.now();
  const safeActivatedMs = Number.isNaN(activatedMs) ? Date.now() : activatedMs;
  const explicitEndMs = finishDate ? new Date(finishDate).getTime() : safeActivatedMs + 7 * 24 * 60 * 60 * 1000;
  const daysLeft = Math.max(0, Math.ceil((explicitEndMs - Date.now()) / (1000 * 60 * 60 * 24)));
  const dayText = daysLeft === 1 ? "1 day" : `${daysLeft} days`;

  const handleScrollToUpgrade = () => {
    setShowAllPlans(true);
    setTimeout(() => {
      upgradeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    try {
      SubscriptionService.cancelAutoRenew();
      await refresh();
      setShowCancelModal(false);
      showToast("Auto-renewal has been cancelled. Your access remains active until period ends.");
    } catch (err) {
      showToast("Failed to cancel auto-renewal. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6 w-full pb-10 text-left relative">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#181716] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/60 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#043084]">
            Subscription &amp; Plans
          </h1>
          <p className="text-xs sm:text-[13px] text-[#475569] font-medium mt-0.5">
            Manage your active plan details, track your creator usage limits, and explore upgrade options.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#EAF7F0] border border-[#17845B]/20 px-3 py-1.5 text-xs font-bold text-[#17845B]">
            <span className="h-2 w-2 rounded-full bg-[#17845B] animate-pulse" />
            {planName} {statusLabel}
          </span>
        </div>
      </div>

      {/* 2. STARTER / TRIAL 7-DAYS COUNTDOWN BANNER ("PATTI") */}
      {isStarterOrTrial && (
        <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 via-amber-50/50 to-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs text-left">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-600 shrink-0">
              <Zap className="h-5 w-5 fill-amber-500 text-amber-600 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-sm sm:text-base font-bold text-amber-950">
                  ⚡ {dayText} left in your {planKey === "starter" ? "Starter Plan" : "Free Trial"}
                </h3>
                <span className="rounded-full bg-amber-200/80 border border-amber-300 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5 uppercase tracking-wide">
                  {daysLeft} Days Remaining
                </span>
              </div>
              <p className="text-xs text-amber-900/80 font-medium leading-relaxed">
                Your creator profile is currently live and public. After {dayText}, upgrade anytime to ensure permanent public access, unlimited episodes &amp; VIP creator features.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleScrollToUpgrade}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#043084] hover:bg-[#032363] active:scale-[0.99] text-white px-4 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Upgrade Plan</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. ACTIVE PLAN DETAILS CARD (PLAN K ANDAR KI DETAILS) */}
      <section className="rounded-2xl border-2 border-[#043084]/20 bg-white shadow-xs overflow-hidden text-left">
        {/* Card Header Banner */}
        <div className="bg-gradient-to-r from-[#043084]/[0.07] via-[#043084]/[0.03] to-transparent p-5 sm:p-6 border-b border-[#e2e8f0]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#043084] text-white px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Active Plan
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                    isAutoRenewActive
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : isTrial
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : "bg-slate-100 text-slate-700 border border-slate-300"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isAutoRenewActive ? "bg-emerald-600" : "bg-amber-500"
                    }`}
                  />
                  {isTrial ? "Trial Mode" : isAutoRenewActive ? "Auto-Debit Enabled" : "Manual / Renewal Off"}
                </span>
              </div>

              <div className="flex items-baseline gap-3 flex-wrap pt-1">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#043084]">
                  Inflixo {planName}
                </h2>
                <span className="text-sm font-bold text-[#181716] bg-white border border-[#E4DAD5] px-3 py-1 rounded-lg shadow-2xs">
                  {activePriceDisplay}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#475569] font-medium max-w-2xl leading-relaxed">
                {isTrial
                  ? "You are currently on the 7-day early access trial. Upgrade to any plan to keep your profile permanently public with automated renewal."
                  : quota.description}
              </p>
            </div>

            {/* Quick Summary Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0">
              <div className="rounded-xl border border-[#e2e8f0] bg-white p-3 shadow-2xs">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#64748b]">
                  <CalendarClock className="h-3.5 w-3.5 text-[#043084]" />
                  <span>Valid Until</span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-[#043084] mt-1">
                  {formatSubscriptionDate(finishDate)}
                </p>
              </div>

              <div
                className={`rounded-xl border p-3 shadow-2xs ${
                  isAutoRenewActive
                    ? "border-emerald-200 bg-emerald-50/40"
                    : "border-[#e2e8f0] bg-white"
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#64748b]">
                  <CreditCard className="h-3.5 w-3.5 text-[#043084]" />
                  <span>Next Debit</span>
                </div>
                <p
                  className={`text-xs sm:text-sm font-bold mt-1 ${
                    isAutoRenewActive ? "text-emerald-800" : "text-[#043084]"
                  }`}
                >
                  {renewalText}
                </p>
              </div>

              <div className="rounded-xl border border-[#e2e8f0] bg-white p-3 shadow-2xs col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#64748b]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#17845B]" />
                  <span>Billing Cycle</span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-[#181716] capitalize mt-1">
                  {isTrial ? "Trial (7 Days)" : `${billingCycle}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card Body: Active Plan Features & Quota */}
        <div className="p-5 sm:p-6 space-y-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] block mb-3">
              Included in Your Active Plan
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] space-y-1">
                <span className="text-[11px] text-[#64748b] font-medium block">Content Series</span>
                <span className="font-bold text-[#043084] text-sm">
                  {quota.maxSeries === Infinity ? "Unlimited" : `${quota.maxSeries} Series`}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] space-y-1">
                <span className="text-[11px] text-[#64748b] font-medium block">Episodes / Series</span>
                <span className="font-bold text-[#043084] text-sm">
                  {quota.maxEpisodesPerSeries === Infinity
                    ? "Unlimited"
                    : `${quota.maxEpisodesPerSeries} Episodes`}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] space-y-1">
                <span className="text-[11px] text-[#64748b] font-medium block">Custom Links</span>
                <span className="font-bold text-[#043084] text-sm">
                  {quota.maxCustomLinks === Infinity ? "Unlimited" : `${quota.maxCustomLinks} Links`}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] space-y-1">
                <span className="text-[11px] text-[#64748b] font-medium block">Media Kit &amp; Rate Card</span>
                <span className="font-bold text-[#043084] text-sm">
                  {quota.hasMediaKit && quota.hasRateCard
                    ? "Full Access ✓"
                    : quota.hasMediaKit
                    ? "Media Kit Only"
                    : "Not Included"}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Usage Progress Bars */}
          <div className="space-y-3 pt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] block">
              Real-Time Quota Usage
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Metric 1: Content Series */}
              <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#475569] flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-[#043084]" />
                    <span>Series / Playlists</span>
                  </span>
                  <span className="text-xs font-bold text-[#043084]">
                    {seriesUsage.current} of {seriesUsage.max === Infinity ? "Unlimited" : seriesUsage.max}
                  </span>
                </div>
                <div className="w-full bg-[#e2e8f0] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#043084] h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, seriesUsage.percentage)}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#64748b] font-medium">
                  {seriesUsage.max === Infinity
                    ? "Unlimited series allowed"
                    : `${Math.max(0, seriesUsage.max - seriesUsage.current)} series slots available`}
                </p>
              </div>

              {/* Metric 2: Total Episodes */}
              <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#475569] flex items-center gap-1.5">
                    <Film className="h-3.5 w-3.5 text-[#043084]" />
                    <span>Total Episodes</span>
                  </span>
                  <span className="text-xs font-bold text-[#043084]">
                    {episodeUsage.current} of {episodeUsage.max === Infinity ? "Unlimited" : episodeUsage.max}
                  </span>
                </div>
                <div className="w-full bg-[#e2e8f0] h-2 rounded-full overflow-hidden">
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

              {/* Metric 3: Collab Packages */}
              <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#475569] flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-[#043084]" />
                    <span>Collab Packages</span>
                  </span>
                  <span className="text-xs font-bold text-[#043084]">
                    {gigUsage.current} of {gigUsage.max === Infinity ? "Unlimited" : gigUsage.max}
                  </span>
                </div>
                <div className="w-full bg-[#e2e8f0] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#043084] h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, gigUsage.percentage)}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#64748b] font-medium">
                  {gigUsage.max === Infinity
                    ? "Unlimited collab packages allowed"
                    : `${Math.max(0, gigUsage.max - gigUsage.current)} active slots available`}
                </p>
              </div>
            </div>
          </div>

          {/* 3. PROMINENT ACTION BAR: DO YOU WANT TO UPGRADE & CANCEL BUTTON */}
          <div className="pt-4 border-t border-[#e2e8f0]">
            <div className="rounded-2xl border-2 border-[#043084] bg-gradient-to-r from-[#043084]/[0.08] via-[#043084]/[0.03] to-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#043084]">
                  <Sparkles className="h-4 w-4 text-[#043084]" />
                  <span>Do you want to upgrade your plan?</span>
                </div>
                <p className="text-xs sm:text-[13px] text-[#475569] font-medium max-w-xl">
                  {normalizedKey === "vip"
                    ? "You are already enjoying our highest VIP Tier! You can switch billing cycles or manage renewals anytime."
                    : "Need more content series, unlimited links, media kit branding or higher collab limits? Upgrade anytime with instant activation."}
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
                {/* Upgrade Button */}
                {normalizedKey !== "vip" && (
                  <button
                    type="button"
                    onClick={handleScrollToUpgrade}
                    className="rounded-xl bg-[#043084] hover:bg-[#032360] active:scale-[0.99] text-white py-2.5 px-5 text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Upgrade Plan</span>
                    <ArrowUpRight className="h-4 w-4 ml-0.5" />
                  </button>
                )}

                {/* Cancel Auto-Renewal Button */}
                {!isTrial && isAutoRenewActive && (
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/70 text-rose-700 py-2.5 px-4 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Cancel Auto-Renewal</span>
                  </button>
                )}

                {/* If already cancelled or trial */}
                {!isTrial && !isAutoRenewActive && (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>Auto-renewal cancelled</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. UPGRADE PLANS & FULL PRICING DETAILS SECTION */}
      <div ref={upgradeSectionRef} id="upgrade-plans-section" className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E4DAD5] pb-3">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#181716] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#043084]" />
              <span>Explore &amp; Upgrade Plans</span>
            </h2>
            <p className="text-xs text-[#797570] font-medium mt-0.5">
              Compare features across Starter, Pro, and VIP tiers. All upgrades are applied immediately.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAllPlans(!showAllPlans)}
            className="text-xs font-semibold text-[#043084] hover:underline self-start sm:self-auto cursor-pointer"
          >
            {showAllPlans ? "Hide Plans Table" : "Show Plans Table"}
          </button>
        </div>

        {showAllPlans && <PricingTable />}
      </div>

      {/* 5. CANCEL SUBSCRIPTION CONFIRMATION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-[#E4DAD5] bg-white p-6 shadow-2xl space-y-4 text-left">
            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 text-[#64748b] hover:text-[#181716] p-1 rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#181716]">
                  Cancel Auto-Renewal?
                </h3>
                <p className="text-xs text-[#64748b]">
                  Inflixo {planName} Subscription
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3.5 text-xs text-rose-900 space-y-1.5">
              <p className="font-semibold">Here is what will happen:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800">
                <li>
                  Your plan features will remain <strong>fully active until {formatSubscriptionDate(finishDate)}</strong>.
                </li>
                <li>
                  Your card/UPI mandate will <strong>not</strong> be charged automatically for the next cycle.
                </li>
                <li>
                  You can re-subscribe or upgrade anytime before or after expiry.
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="rounded-xl border border-[#E4DAD5] bg-white hover:bg-[#fbfbfb] px-4 py-2 text-xs font-semibold text-[#181716] cursor-pointer"
              >
                Keep My Subscription
              </button>

              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white px-4 py-2 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isCancelling ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Yes, Cancel Auto-Renewal</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
