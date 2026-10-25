"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  Briefcase,
  CalendarClock,
  Check,
  CheckCircle2,
  CreditCard,
  Crown,
  FileText,
  Film,
  Gem,
  Layers,
  Link2,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  X,
  XCircle,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import {
  getSeriesUsage,
  getTotalEpisodesUsage,
  getGigUsage,
  getProductUsage,
  getPlanQuota,
} from "@/services/subscriptionLimits";
import { MediaKitService } from "@/services/MediaKitService";
import { ProductService } from "@/services/ProductService";
import { SubscriptionService } from "@/services/SubscriptionService";
import { RazorpayCheckoutButton } from "@/components/checkout/RazorpayCheckoutButton";
import { getPlanPrice, PaidPlanKey } from "@/lib/pricing";

function formatSubscriptionDate(value?: string | null) {
  if (!value) return "21 Nov 2026";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "21 Nov 2026";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function DashboardSubscriptionPage() {
  const { profile, series, subscription, refresh } = useCreator();
  const { showToast } = useToast();

  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [activeGigsCount, setActiveGigsCount] = useState(0);
  const [productsCount, setProductsCount] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setActiveGigsCount(MediaKitService.getPackages().filter((p) => p.isActive).length);
    const identifier = profile.email || profile.username;
    if (identifier) {
      MediaKitService.fetchFromDb(identifier, profile.id).then(({ packages }) => {
        if (!cancelled) setActiveGigsCount(packages.filter((p) => p.isActive !== false).length);
      });
    }
    ProductService.list().then((products) => {
      if (!cancelled) setProductsCount(products.length);
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [profile.email, profile.username, profile.id]);

  const planKey = subscription?.planKey || "starter";
  const normalizedKey: "starter" | "pro" | "vip" =
    planKey === "creator_pro" || planKey === "pro"
      ? "pro"
      : planKey === "creator_VIP" || planKey === "vip"
      ? "vip"
      : "starter";

  const seriesUsage = getSeriesUsage(series, planKey);
  const episodeUsage = getTotalEpisodesUsage(series, planKey);
  const gigUsage = getGigUsage(activeGigsCount, planKey);
  const productUsage = getProductUsage(productsCount, planKey);
  const quota = getPlanQuota(planKey);
  const planName = quota.name;

  const isAutoRenewActive = Boolean(subscription?.autoRenew !== false);
  const finishDate =
    subscription?.endsAt ||
    subscription?.currentPeriodEndsAt ||
    subscription?.trialEndsAt ||
    subscription?.activatedAt;
  const renewalText = formatSubscriptionDate(finishDate);

  const activePriceDisplay =
    billingCycle === "yearly"
      ? "₹999 / year"
      : normalizedKey === "pro"
      ? "₹199 / month"
      : normalizedKey === "vip"
      ? "₹399 / month"
      : "₹99 / month";

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    try {
      await SubscriptionService.cancelAutoRenew();
      await refresh();
      setShowCancelModal(false);
      showToast("Auto-renewal has been cancelled. Your access remains active until period ends.");
    } catch {
      showToast("Failed to cancel auto-renewal. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleUpgradeSuccess = async (targetPlanKey: PaidPlanKey) => {
    await SubscriptionService.activate(targetPlanKey, billingCycle, profile.email);
    await refresh();
    showToast(`Successfully upgraded to ${targetPlanKey.toUpperCase()}! 🎉`);
  };

  return (
    <div className="space-y-5 sm:space-y-6 w-full pb-12 text-left relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#181716] text-white px-4 py-3 rounded-[5px] shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-300">
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

      {/* ── 1. Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0f172a]">
            Subscription &amp; Plans
          </h1>
          <p className="text-xs sm:text-[13px] text-[#64748b] font-medium mt-0.5">
            Manage your plan, track usage, and upgrade as you grow.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF7F0] border border-[#10B981]/30 px-3 py-1 text-xs font-semibold text-[#047857]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
            <span>{planName} active</span>
          </span>
        </div>
      </div>

      {/* ── 2. Active Plan Card (Card 1) ── */}
      <div className="rounded-[5px] border border-rose-100 bg-[#FFF5F7]/40 p-4 sm:p-5 lg:p-6 shadow-2xs text-left">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left Plan Overview */}
          <div className="flex items-start gap-4">
            {/* Crown Icon Box */}
            <div className="flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-[5px] bg-[#FCE7F3]/70 text-[#7A2253] shrink-0 shadow-2xs">
              <Crown className="h-6 w-6 text-[#7A2253]" />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                  YOUR CURRENT PLAN
                </span>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0f172a]">
                  Inflixo {planName}
                </h2>
                <span className="inline-flex items-center rounded-[5px] border border-[#e2e8f0] bg-white px-2.5 py-0.5 text-xs font-bold text-[#0f172a] shadow-2xs">
                  {activePriceDisplay}
                </span>
              </div>

              <p className="text-xs text-[#64748b] max-w-xl leading-relaxed">
                Keep your public profile live with 1 product in shop and starter limits.
              </p>

              {/* Status Badges */}
              <div className="flex items-center gap-2 flex-wrap pt-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#7A2253] text-white px-2.5 py-1 text-xs font-bold shadow-2xs">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Active Plan</span>
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] px-2.5 py-1 text-xs font-bold shadow-2xs">
                  <span className="h-2 w-2 rounded-full border-2 border-[#10B981]" />
                  <span>Auto-debit Enabled</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Metrics: Valid Until, Next Debit, Billing Cycle */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0 w-full lg:w-auto">
            <div className="rounded-[5px] border border-[#e2e8f0] bg-white p-3 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#64748b]">
                <CalendarClock className="h-3.5 w-3.5 text-[#7A2253]" />
                <span>Valid Until</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#0f172a] mt-1.5">
                {formatSubscriptionDate(finishDate)}
              </p>
            </div>

            <div className="rounded-[5px] border border-[#e2e8f0] bg-white p-3 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#64748b]">
                <CreditCard className="h-3.5 w-3.5 text-[#7A2253]" />
                <span>Next Debit</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#0f172a] mt-1.5">
                {renewalText}
              </p>
            </div>

            <div className="rounded-[5px] border border-[#e2e8f0] bg-white p-3 shadow-2xs col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#64748b]">
                <RefreshCw className="h-3.5 w-3.5 text-[#7A2253]" />
                <span>Billing Cycle</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#0f172a] capitalize mt-1.5">
                {billingCycle === "yearly" ? "Yearly" : "Monthly"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Plan Usage Section (Card 2) ── */}
      <div className="space-y-2.5 text-left">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-[#0f172a]">Plan Usage</h2>
          <Link
            href="/dashboard/analytics"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#7A2253] hover:underline"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>View Detailed Analytics</span>
            <span className="text-[10px]">&gt;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Series */}
          <div className="rounded-[5px] border border-[#e2e8f0] bg-white p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0f172a] flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#7A2253]" />
                <span>Series / Playlists</span>
              </span>
              <span className="text-xs font-bold text-[#7A2253]">
                {seriesUsage.current} of {seriesUsage.max === Infinity ? "Unlimited" : seriesUsage.max}
              </span>
            </div>
            <div className="w-full bg-[#f1f5f9] h-2 rounded-[5px] overflow-hidden">
              <div
                className="bg-[#7A2253] h-full rounded-[5px] transition-all"
                style={{ width: `${Math.min(100, seriesUsage.percentage || 66)}%` }}
              />
            </div>
          </div>

          {/* Episodes */}
          <div className="rounded-[5px] border border-[#e2e8f0] bg-white p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0f172a] flex items-center gap-2">
                <Film className="h-4 w-4 text-[#7A2253]" />
                <span>Total Episodes</span>
              </span>
              <span className="text-xs font-bold text-[#7A2253]">
                {episodeUsage.current} of {episodeUsage.max === Infinity ? "Unlimited" : episodeUsage.max}
              </span>
            </div>
            <div className="w-full bg-[#f1f5f9] h-2 rounded-[5px] overflow-hidden">
              <div
                className="bg-[#7A2253] h-full rounded-[5px] transition-all"
                style={{ width: `${Math.min(100, episodeUsage.percentage || 46)}%` }}
              />
            </div>
          </div>

          {/* Shop Products */}
          <div className="rounded-[5px] border border-[#e2e8f0] bg-white p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0f172a] flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-[#7A2253]" />
                <span>Shop Products</span>
              </span>
              <span className="text-xs font-bold text-[#7A2253]">
                {productUsage.current} of {productUsage.max === Infinity ? "Unlimited" : productUsage.max}
              </span>
            </div>
            <div className="w-full bg-[#f1f5f9] h-2 rounded-[5px] overflow-hidden">
              <div
                className="bg-[#7A2253] h-full rounded-[5px] transition-all"
                style={{ width: `${Math.min(100, productUsage.percentage || 100)}%` }}
              />
            </div>
          </div>

          {/* Collab Packages */}
          <div className="rounded-[5px] border border-[#e2e8f0] bg-white p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0f172a] flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#7A2253]" />
                <span>Collab Packages</span>
              </span>
              <span className="text-xs font-bold text-[#7A2253]">
                {gigUsage.current} of {gigUsage.max === Infinity ? "Unlimited" : gigUsage.max}
              </span>
            </div>
            <div className="w-full bg-[#f1f5f9] h-2 rounded-[5px] overflow-hidden">
              <div
                className="bg-[#7A2253] h-full rounded-[5px] transition-all"
                style={{ width: `${Math.min(100, gigUsage.percentage || 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Choose Your Plan ── */}
      <div className="space-y-3.5 text-left pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0f172a]">Choose Your Plan</h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              Upgrade anytime and unlock more features to grow your audience.
            </p>
          </div>

          {/* Monthly / Yearly Toggle */}
          <div className="rounded-[5px] border border-[#e2e8f0] bg-white p-0.5 shadow-2xs flex items-center gap-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-[5px] px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-[#7A2253] text-white shadow-2xs"
                  : "text-[#64748b] hover:text-[#0f172a]"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`rounded-[5px] px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                billingCycle === "yearly"
                  ? "bg-[#7A2253] text-white shadow-2xs"
                  : "text-[#64748b] hover:text-[#0f172a]"
              }`}
            >
              <span>Yearly</span>
              <span className="rounded-[3px] bg-[#FCE7F3] text-[#7A2253] px-1.5 py-0.5 text-[10px] font-extrabold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Tier Cards (Responsive Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
          {/* Card 1: Starter (Current Plan) */}
          <div className="rounded-[5px] border-2 border-[#FCE7F3] bg-white p-5 flex flex-col justify-between shadow-2xs relative">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-[#FFF5F7] border border-[#FCE7F3] text-[#7A2253] shrink-0">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0f172a]">Starter</h3>
                    <p className="text-xs text-[#64748b]">For getting started</p>
                  </div>
                </div>

                <span className="rounded-[5px] bg-[#EAF7F0] border border-[#10B981]/30 text-[#047857] text-[10px] font-bold px-2 py-0.5 shrink-0">
                  Current Plan
                </span>
              </div>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#0f172a]">
                  {billingCycle === "yearly" ? "₹999" : "₹99"}
                </span>
                <span className="text-xs font-medium text-[#64748b]">
                  {billingCycle === "yearly" ? "/ year" : "/ month"}
                </span>
              </div>

              {/* Bullets */}
              <ul className="mt-5 space-y-2 text-xs text-[#0f172a]">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0 stroke-[2.5]" />
                  <span>3 content series</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0 stroke-[2.5]" />
                  <span>15 total episodes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0 stroke-[2.5]" />
                  <span>1 shop product</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0 stroke-[2.5]" />
                  <span>5 custom links</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0 stroke-[2.5]" />
                  <span>1 collab package</span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div className="mt-6">
              <div className="w-full rounded-[5px] bg-[#FFF5F7] border border-[#FCE7F3] text-[#7A2253] py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 cursor-default">
                <span>Current Plan</span>
                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* Card 2: Pro (Popular) */}
          <div className="rounded-[5px] border border-[#e2e8f0] bg-white p-5 flex flex-col justify-between shadow-2xs relative hover:border-[#cbd5e1] transition-all">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-[#FFF5F7] border border-[#FCE7F3] text-[#7A2253] shrink-0">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0f172a]">Pro</h3>
                    <p className="text-xs text-[#64748b]">For growing creators</p>
                  </div>
                </div>

                <span className="rounded-[5px] bg-[#FCE7F3] text-[#7A2253] text-[10px] font-bold px-2 py-0.5 shrink-0">
                  Popular
                </span>
              </div>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#0f172a]">
                  {billingCycle === "yearly" ? "₹1499" : "₹199"}
                </span>
                <span className="text-xs font-medium text-[#64748b]">
                  {billingCycle === "yearly" ? "/ year" : "/ month"}
                </span>
              </div>

              {/* Bullets */}
              <ul className="mt-5 space-y-2 text-xs text-[#0f172a]">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0 stroke-[2.5]" />
                  <span>20 content series</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0 stroke-[2.5]" />
                  <span>20 episodes per series</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0 stroke-[2.5]" />
                  <span>20 shop products</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0 stroke-[2.5]" />
                  <span>20 custom links</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0 stroke-[2.5]" />
                  <span>3 collab packages</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0 stroke-[2.5]" />
                  <span>Rate card &amp; media kit</span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div className="mt-6">
              <RazorpayCheckoutButton
                amount={getPlanPrice("pro", billingCycle, "INR") * 100}
                planKey="pro"
                billingCycle={billingCycle}
                buttonText="Upgrade to Pro"
                prefill={{ email: profile.email, name: profile.displayName }}
                className="w-full rounded-[5px] bg-[#7A2253] hover:bg-[#661842] text-white py-2.5 text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                icon={<Sparkles className="h-3.5 w-3.5" />}
                onSuccess={() => handleUpgradeSuccess("pro")}
              />
            </div>
          </div>

          {/* Card 3: VIP */}
          <div className="rounded-[5px] border border-[#e2e8f0] bg-white p-5 flex flex-col justify-between shadow-2xs relative hover:border-[#cbd5e1] transition-all">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-[#FFF5F7] border border-[#FCE7F3] text-[#7A2253] shrink-0">
                    <Gem className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0f172a]">VIP</h3>
                    <p className="text-xs text-[#64748b]">For professional creators</p>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#0f172a]">
                  {billingCycle === "yearly" ? "₹2499" : "₹399"}
                </span>
                <span className="text-xs font-medium text-[#64748b]">
                  {billingCycle === "yearly" ? "/ year" : "/ month"}
                </span>
              </div>

              {/* Bullets */}
              <ul className="mt-5 space-y-2 text-xs text-[#0f172a]">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0 stroke-[2.5]" />
                  <span>Unlimited series &amp; episodes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0 stroke-[2.5]" />
                  <span>Unlimited shop products</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0 stroke-[2.5]" />
                  <span>Unlimited custom links</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0 stroke-[2.5]" />
                  <span>10 collab packages</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0 stroke-[2.5]" />
                  <span>Custom media kit</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0 stroke-[2.5]" />
                  <span>Priority support</span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div className="mt-6">
              <RazorpayCheckoutButton
                amount={getPlanPrice("vip", billingCycle, "INR") * 100}
                planKey="vip"
                billingCycle={billingCycle}
                buttonText="Upgrade to VIP"
                prefill={{ email: profile.email, name: profile.displayName }}
                className="w-full rounded-[5px] bg-[#7A2253] hover:bg-[#661842] text-white py-2.5 text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                icon={<Sparkles className="h-3.5 w-3.5" />}
                onSuccess={() => handleUpgradeSuccess("vip")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Compare Plans (Responsive Table) ── */}
      <div className="space-y-3 text-left pt-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0f172a]">Compare Plans</h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            A quick comparison to help you choose the right plan.
          </p>
        </div>

        <div className="rounded-[5px] border border-[#e2e8f0] bg-white shadow-2xs overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[550px] text-left text-xs">
              <thead className="bg-[#f8fafc]/80 border-b border-[#e2e8f0]">
                <tr>
                  <th className="py-3 px-4 font-bold text-[#0f172a] w-2/5">Feature</th>
                  <th className="py-3 px-4 font-bold text-[#0f172a] text-center w-1/5">
                    <div>Starter</div>
                    <div className="text-[11px] font-normal text-[#64748b] mt-0.5">₹99/mo</div>
                  </th>
                  <th className="py-3 px-4 font-bold text-[#0f172a] text-center w-1/5">
                    <div>Pro</div>
                    <div className="text-[11px] font-normal text-[#64748b] mt-0.5">₹199/mo</div>
                  </th>
                  <th className="py-3 px-4 font-bold text-[#0f172a] text-center w-1/5">
                    <div>VIP</div>
                    <div className="text-[11px] font-normal text-[#64748b] mt-0.5">₹399/mo</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {/* 1. Content Series */}
                <tr className="hover:bg-[#f8fafc]/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-[#0f172a] flex items-center gap-2.5">
                    <Layers className="h-4 w-4 text-[#7A2253]" />
                    <span>Content Series</span>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-[#64748b]">3</td>
                  <td className="py-3 px-4 text-center font-semibold text-[#64748b]">20</td>
                  <td className="py-3 px-4 text-center font-bold text-[#7A2253]">Unlimited</td>
                </tr>

                {/* 2. Total Episodes */}
                <tr className="hover:bg-[#f8fafc]/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-[#0f172a] flex items-center gap-2.5">
                    <Film className="h-4 w-4 text-[#7A2253]" />
                    <span>Total Episodes</span>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-[#64748b]">15</td>
                  <td className="py-3 px-4 text-center font-semibold text-[#64748b]">20 per series</td>
                  <td className="py-3 px-4 text-center font-bold text-[#7A2253]">Unlimited</td>
                </tr>

                {/* 3. Shop Products */}
                <tr className="hover:bg-[#f8fafc]/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-[#0f172a] flex items-center gap-2.5">
                    <ShoppingBag className="h-4 w-4 text-[#7A2253]" />
                    <span>Shop Products</span>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-[#64748b]">1</td>
                  <td className="py-3 px-4 text-center font-semibold text-[#64748b]">20</td>
                  <td className="py-3 px-4 text-center font-bold text-[#7A2253]">Unlimited</td>
                </tr>

                {/* 4. Custom Links */}
                <tr className="hover:bg-[#f8fafc]/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-[#0f172a] flex items-center gap-2.5">
                    <Link2 className="h-4 w-4 text-[#7A2253]" />
                    <span>Custom Links</span>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-[#64748b]">5</td>
                  <td className="py-3 px-4 text-center font-semibold text-[#64748b]">20</td>
                  <td className="py-3 px-4 text-center font-bold text-[#7A2253]">Unlimited</td>
                </tr>

                {/* 5. Collab Packages */}
                <tr className="hover:bg-[#f8fafc]/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-[#0f172a] flex items-center gap-2.5">
                    <Briefcase className="h-4 w-4 text-[#7A2253]" />
                    <span>Collab Packages</span>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-[#64748b]">1</td>
                  <td className="py-3 px-4 text-center font-semibold text-[#64748b]">3</td>
                  <td className="py-3 px-4 text-center font-semibold text-[#64748b]">10</td>
                </tr>

                {/* 6. Rate Card & Media Kit */}
                <tr className="hover:bg-[#f8fafc]/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-[#0f172a] flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-[#7A2253]" />
                    <span>Rate Card &amp; Media Kit</span>
                  </td>
                  <td className="py-3 px-4 text-center text-[#94a3b8]">一</td>
                  <td className="py-3 px-4 text-center">
                    <Check className="h-4 w-4 text-[#7A2253] mx-auto stroke-[2.5]" />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Check className="h-4 w-4 text-[#7A2253] mx-auto stroke-[2.5]" />
                  </td>
                </tr>

                {/* 7. Priority Support */}
                <tr className="hover:bg-[#f8fafc]/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-[#0f172a] flex items-center gap-2.5">
                    <Sparkles className="h-4 w-4 text-[#7A2253]" />
                    <span>Priority Support</span>
                  </td>
                  <td className="py-3 px-4 text-center text-[#94a3b8]">一</td>
                  <td className="py-3 px-4 text-center text-[#94a3b8]">一</td>
                  <td className="py-3 px-4 text-center">
                    <Check className="h-4 w-4 text-[#7A2253] mx-auto stroke-[2.5]" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 6. Cancel Auto-Renewal Button ── */}
      {isAutoRenewActive && (
        <div className="pt-2 text-center sm:text-right">
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="text-xs font-semibold text-[#64748b] hover:text-rose-600 underline underline-offset-4 cursor-pointer transition-colors"
          >
            Cancel auto-renewal
          </button>
        </div>
      )}

      {/* ── 7. Cancel Auto-Renewal Confirmation Modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-[5px] border border-[#e2e8f0] bg-white p-6 shadow-2xl space-y-4 text-left">
            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 text-[#64748b] hover:text-[#0f172a] p-1 rounded-[5px]"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-[5px] bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#0f172a]">
                  Cancel Auto-Renewal?
                </h3>
                <p className="text-xs text-[#64748b]">
                  Inflixo {planName} Subscription
                </p>
              </div>
            </div>

            <div className="rounded-[5px] border border-rose-100 bg-rose-50/60 p-3.5 text-xs text-rose-900 space-y-1.5">
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
                className="rounded-[5px] border border-[#e2e8f0] bg-white hover:bg-[#fbfbfb] px-4 py-2 text-xs font-semibold text-[#0f172a] cursor-pointer"
              >
                Keep My Subscription
              </button>

              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="rounded-[5px] bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white px-4 py-2 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
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
