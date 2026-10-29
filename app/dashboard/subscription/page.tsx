"use client";

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  Briefcase,
  CalendarClock,
  CreditCard,
  Crown,
  Film,
  Gem,
  Layers,
  Link2,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Star,
  Wrench,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import {
  PAID_PLANS,
  PLANS,
  formatLimit,
  formatMoney,
  getPlan,
  isUnlimited,
  normalizePlanKey,
  planFeatureLines,
  planPrice,
  planRank,
  yearlyPerMonth,
  yearlySavingsPercent,
  type BillingPeriod,
  type PaidPlanKey,
} from "@/config/plans";
import { countSeriesEpisodes, getFullestSeriesEpisodeUsage } from "@/services/subscriptionLimits";
import { getFreeTrialStatus } from "@/lib/trialStatus";
import { MediaKitService } from "@/services/MediaKitService";
import { SubscriptionService } from "@/services/SubscriptionService";
import { RazorpayCheckoutButton } from "@/components/checkout/RazorpayCheckoutButton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PAGE_COPY } from "@/components/dashboard/pageCopy";
import type { Subscription } from "@/types";

type PlanState = "trial" | "active" | "expired" | "cancelled";

const ICON_BOX = "flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] bg-[#F7EEF2] text-[#7A2253]";
const PLAN_ICONS: Record<PaidPlanKey, ReactNode> = {
  starter: <Sparkles className="h-4 w-4" />,
  pro: <Crown className="h-4 w-4" />,
  vip: <Gem className="h-4 w-4" />,
};

function formatDate(value?: string | null, withYear = true) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) }).format(date);
}

/** Dev only: ?mockPlanState=trial|active|expired|cancelled renders that state with fake dates. */
function useMockSubscription(real: Subscription | null | undefined): Subscription | null | undefined {
  const params = useSearchParams();
  const mock = process.env.NODE_ENV !== "production" ? params?.get("mockPlanState") : null;
  const [now] = useState(() => Date.now());
  return useMemo(() => {
    if (!mock) return real;
    const iso = (days: number) => new Date(now + days * 86_400_000).toISOString();
    const base = { planName: "", billingCycle: "monthly", activatedAt: iso(-20), autoRenew: true } as const;
    switch (mock) {
      case "trial":
        return { ...base, planKey: "early_access", status: "trial", trialEndsAt: iso(3) } as Subscription;
      case "expired":
        return { ...base, planKey: "early_access", status: "expired", trialEndsAt: iso(-2) } as Subscription;
      case "cancelled":
        return { ...base, planKey: "pro", status: "active", autoRenew: false, cancelAtPeriodEnd: true, currentPeriodEndsAt: iso(24) } as Subscription;
      case "active":
        return { ...base, planKey: "pro", status: "active", currentPeriodEndsAt: iso(24) } as Subscription;
      default:
        return real;
    }
  }, [mock, real, now]);
}

function UsageRow({ icon, label, used, limit, detail }: { icon: ReactNode; label: string; used: number | null; limit: number; detail?: string }) {
  const unlimited = isUnlimited(limit);
  const pct = used === null || unlimited || limit <= 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const barColor = pct >= 100 ? "bg-[#E11D48]" : pct >= 80 ? "bg-amber-500" : "bg-[#7A2253]";
  return (
    <div className="flex items-center gap-3 rounded-[5px] border border-[#ECECF0] bg-[#FAFAFB] p-3 shadow-none min-w-0">
      <div className={ICON_BOX}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="line-clamp-2 break-words text-[13px] font-semibold text-[#18181B]" title={label}>{label}</p>
          <p className="shrink-0 text-[12px] font-medium text-[#18181B] tabular-nums">
            {used === null ? "–" : unlimited ? `${used} · Unlimited` : `${used} of ${limit}`}
          </p>
        </div>
        {detail && <p className="line-clamp-2 break-words text-[12px] text-[#6B6B76]" title={detail}>{detail}</p>}
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[#ECECF0]">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${unlimited ? 0 : pct}%` }} />
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[5px] border border-[#ECECF0] bg-[#FAFAFB] px-3 py-2">
      <p className="text-[12px] text-[#6B6B76]">{label}</p>
      <p className="line-clamp-2 break-words text-[13px] font-semibold text-[#18181B]" title={value}>{value}</p>
    </div>
  );
}

function PlanPage() {
  const { profile, series, subscription: realSubscription, refresh } = useCreator();
  const subscription = useMockSubscription(realSubscription);
  const { showToast } = useToast();

  const [billingCycle, setBillingCycle] = useState<BillingPeriod>("monthly");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [counts, setCounts] = useState<{ products: number | null; links: number | null; packages: number | null; reviews: number | null; gear: number | null }>({
    products: null, links: null, packages: null, reviews: null, gear: null,
  });

  // Usage counts from each feature's own API.
  useEffect(() => {
    let cancelled = false;
    const set = (key: keyof typeof counts, value: number) => { if (!cancelled) setCounts((c) => ({ ...c, [key]: value })); };
    const json = (url: string) => fetch(url, { cache: "no-store" }).then((r) => (r.ok ? r.json() : Promise.reject(r)));
    json("/api/products").then((d) => set("products", Number(d.used ?? d.items?.length ?? 0))).catch(() => {});
    json("/api/links").then((d) => set("links", Number(d.used ?? d.items?.length ?? 0))).catch(() => {});
    if (profile.email) json(`/api/creator/reviews?email=${encodeURIComponent(profile.email)}`).then((d) => set("reviews", (d.data?.reviews || []).length)).catch(() => {});
    if (profile.id) json(`/api/creator/setup?creatorId=${encodeURIComponent(profile.id)}`).then((d) => set("gear", (d.data?.items || []).length)).catch(() => {});
    const identifier = profile.email || profile.username;
    if (identifier) {
      MediaKitService.fetchFromDb(identifier, profile.id).then(({ packages }) => set("packages", packages.length)).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [profile.email, profile.username, profile.id]);

  // ---- Plan state ----------------------------------------------------------
  const planKey = normalizePlanKey(subscription?.planKey);
  const plan = getPlan(planKey);
  const trial = getFreeTrialStatus(subscription ?? null);
  const autoPayOn = subscription?.autoRenew !== false && !subscription?.cancelAtPeriodEnd;
  const state: PlanState = trial.isExpired || subscription?.status === "expired"
    ? "expired"
    : trial.isFreeTrial
      ? "trial"
      : !autoPayOn || subscription?.status === "cancelled"
        ? "cancelled"
        : "active";
  const cycle: BillingPeriod = subscription?.billingCycle === "yearly" ? "yearly" : "monthly";
  const periodEnd = subscription?.currentPeriodEndsAt || subscription?.renewsAt || subscription?.endsAt;
  const trialEnd = subscription?.trialEndsAt;
  const endDate = formatDate(state === "trial" || (state === "expired" && trial.isFreeTrial) ? trialEnd : periodEnd);
  const endDateShort = formatDate(state === "trial" ? trialEnd : periodEnd, false);
  const isPaidCurrent = planKey !== "trial" && (state === "active" || state === "cancelled");

  const statusChip =
    state === "active"
      ? { text: "Active", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" }
      : state === "trial"
        ? { text: "Trial", cls: "bg-[#FFF5F7] text-[#7A2253] border-[#FCE7F3]" }
        : state === "expired"
          ? { text: "Expired · Profile private", cls: "bg-rose-50 text-rose-700 border-rose-200" }
          : { text: `Cancelled · ends ${endDateShort || "soon"}`, cls: "bg-amber-50 text-amber-700 border-amber-200" };

  const priceLine = planKey === "trial"
    ? `Free · ${PLANS.trial.trialDays} days`
    : `${formatMoney(planPrice(planKey, cycle))} / ${cycle === "monthly" ? "month" : "year"}`;

  const dateLabel = state === "trial" ? "Trial ends" : state === "active" ? "Renews on" : "Ends on";
  const cheapest = formatMoney(planPrice("starter", "monthly"));

  // ---- Usage ---------------------------------------------------------------
  const fullest = getFullestSeriesEpisodeUsage(series, planKey);
  const usageRows = [
    { icon: <Layers className="h-4 w-4" />, label: "Series", used: series.length, limit: plan.limits.series },
    {
      icon: <Film className="h-4 w-4" />,
      label: "Episodes",
      used: fullest.series ? countSeriesEpisodes(fullest.series) : 0,
      limit: plan.limits.episodesPerSeries,
      detail: fullest.series ? `Per series · most in ${fullest.series.title}` : "Per series",
    },
    { icon: <ShoppingBag className="h-4 w-4" />, label: "Shop products", used: counts.products, limit: plan.limits.products },
    { icon: <Link2 className="h-4 w-4" />, label: "Links", used: counts.links, limit: plan.limits.links },
    { icon: <Briefcase className="h-4 w-4" />, label: "Collab packages", used: counts.packages, limit: plan.limits.collabPackages },
    { icon: <Star className="h-4 w-4" />, label: "Brand reviews", used: counts.reviews, limit: plan.limits.reviews },
    { icon: <Wrench className="h-4 w-4" />, label: "Gear items", used: counts.gear, limit: plan.limits.gearItems },
  ];

  // ---- Actions -------------------------------------------------------------
  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    try {
      await SubscriptionService.cancelAutoRenew();
      await refresh();
      setShowCancelModal(false);
      showToast("Auto-renewal cancelled. Your plan stays active till the end of this period.");
    } catch {
      showToast("Couldn't cancel auto-renewal. Please try again.", "error");
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePurchaseSuccess = async (target: PaidPlanKey) => {
    try {
      await SubscriptionService.activate(target, billingCycle, profile.email);
      await refresh();
      showToast(`You're on ${PLANS[target].name} now.`);
    } catch {
      showToast("Payment received, but we couldn't update your plan yet. Please refresh.", "error");
    }
  };

  return (
    <PageContainer>
      <PageHeader {...PAGE_COPY.plan} />

      {/* b. Current plan */}
      <section className="space-y-2">
        <div className="rounded-[5px] border border-[#ECECF0] bg-white p-4 shadow-none flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={ICON_BOX}>{planKey === "trial" ? <CalendarClock className="h-4 w-4" /> : PLAN_ICONS[planKey]}</div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[16px] font-semibold text-[#18181B]">{plan.name}</p>
                <span className={`inline-flex items-center h-6 rounded-[5px] border px-2 text-[12px] font-medium ${statusChip.cls}`}>{statusChip.text}</span>
              </div>
              <p className="text-[12px] text-[#6B6B76]">{priceLine}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2 lg:w-[420px]">
            <InfoBox label={dateLabel} value={endDate || "—"} />
            <InfoBox label="Billing cycle" value={planKey === "trial" ? "—" : cycle === "monthly" ? "Monthly" : "Yearly"} />
            <InfoBox label="Auto-pay" value={planKey !== "trial" && autoPayOn ? "On" : "Off"} />
          </div>
        </div>

        {state === "trial" && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between rounded-[5px] border border-[#ECECF0] bg-[#FAFAFB] px-3.5 py-2.5">
            <p className="text-[13px] text-[#3F3F46]">
              Trial ends in {trial.daysLeft ?? 0} {trial.daysLeft === 1 ? "day" : "days"}. After that your profile goes private. Keep it public from {cheapest}/month.
            </p>
            <a href="#plans" className="inline-flex h-8 shrink-0 items-center justify-center rounded-[5px] bg-[#7A2253] px-3 text-[13px] font-medium text-white hover:bg-[#681c46] transition-colors">
              Choose plan
            </a>
          </div>
        )}
        {state === "expired" && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between rounded-[5px] border border-rose-200 bg-rose-50 px-3.5 py-2.5">
            <p className="text-[13px] font-medium text-rose-700">Your profile is private. Pick a plan to make it public again.</p>
            <a href="#plans" className="inline-flex h-8 shrink-0 items-center justify-center rounded-[5px] bg-rose-600 px-3 text-[13px] font-medium text-white hover:bg-rose-700 transition-colors">
              Choose plan
            </a>
          </div>
        )}
      </section>

      {/* c. Usage */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#F7EEF2] text-[#7A2253]">
            <Activity className="h-4 w-4" />
          </div>
          <h2 className="text-[16px] font-semibold text-[#18181B]">Usage</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {usageRows.map((row) => <UsageRow key={row.label} {...row} />)}
        </div>
      </section>

      {/* d. Plans */}
      <section id="plans" className="space-y-3 scroll-mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#F7EEF2] text-[#7A2253]">
              <Crown className="h-4 w-4" />
            </div>
            <h2 className="text-[16px] font-semibold text-[#18181B]">Plans</h2>
          </div>
          <div className="inline-flex h-8 items-center rounded-[5px] border border-[#ECECF0] bg-white p-0.5" role="tablist" aria-label="Billing cycle">
            {(["monthly", "yearly"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={billingCycle === value}
                onClick={() => setBillingCycle(value)}
                className={`h-7 px-3 rounded-[5px] text-[13px] font-medium transition-colors cursor-pointer ${
                  billingCycle === value ? "bg-[#7A2253] text-white" : "text-[#6B6B76] hover:text-[#18181B]"
                }`}
              >
                {value === "monthly" ? "Monthly" : "Yearly"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PAID_PLANS.map((key) => {
            const p = PLANS[key];
            const isCurrent = isPaidCurrent && key === planKey;
            const isHigher = planRank(key) > planRank(planKey) || !isPaidCurrent;
            const price = billingCycle === "monthly" ? planPrice(key, "monthly") : yearlyPerMonth(key);
            return (
              <div
                key={key}
                className={`relative flex flex-col rounded-[5px] border bg-white p-4 shadow-none ${p.popular ? "border-[#7A2253] ring-1 ring-[#7A2253]" : "border-[#ECECF0]"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={ICON_BOX}>{PLAN_ICONS[key]}</div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[#18181B]">{p.name}</p>
                      <p className="line-clamp-2 break-words text-[12px] text-[#6B6B76]" title={p.subtitle}>{p.subtitle}</p>
                    </div>
                  </div>
                  {p.popular && (
                    <span className="shrink-0 h-6 inline-flex items-center rounded-[5px] bg-[#7A2253] px-2 text-[12px] font-medium text-white">Popular</span>
                  )}
                </div>

                <div className="mt-3">
                  <p className="text-2xl font-bold text-[#18181B] tabular-nums">
                    {formatMoney(price)}
                    <span className="text-[12px] font-normal text-[#6B6B76]"> / month</span>
                  </p>
                  <p className="min-h-4 text-[12px] text-[#6B6B76]">
                    {billingCycle === "yearly" && (
                      <>
                        {formatMoney(planPrice(key, "yearly"))} billed yearly ·{" "}
                        <span className="font-medium text-[#7A2253]">Save {yearlySavingsPercent(key)}%</span>
                      </>
                    )}
                  </p>
                </div>

                <ul className="mt-3 flex-1 space-y-1.5 border-t border-[#ECECF0] pt-3 text-[13px] text-[#3F3F46]">
                  {planFeatureLines(key).map((line) => (
                    <li key={line} className="flex gap-1.5">
                      <span aria-hidden="true" className="text-[#7A2253]">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4">
                  {isCurrent ? (
                    <button type="button" disabled className="w-full h-9 rounded-[5px] border border-[#ECECF0] bg-[#FAFAFB] text-[13px] font-medium text-[#6B6B76] cursor-not-allowed">
                      Current plan
                    </button>
                  ) : (
                    <RazorpayCheckoutButton
                      amount={planPrice(key, billingCycle) * 100}
                      planKey={key}
                      billingCycle={billingCycle}
                      buttonText={isHigher ? "Upgrade" : "Switch"}
                      prefill={{ email: profile.email, name: profile.displayName }}
                      className={
                        isHigher
                          ? "w-full h-9 rounded-[5px] bg-[#7A2253] hover:bg-[#681c46] text-white text-[13px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-none"
                          : "w-full h-9 rounded-[5px] border border-[#7A2253] bg-white text-[#7A2253] hover:bg-[#F7EEF2] text-[13px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-none"
                      }
                      onSuccess={() => handlePurchaseSuccess(key)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* f. Footer */}
      {planKey !== "trial" && state === "active" && (
        <p className="pt-1 text-center text-xs text-[#64748b]">
          <button type="button" onClick={() => setShowCancelModal(true)} className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-[#0f172a] cursor-pointer">
            <RefreshCw className="h-3 w-3" />
            Cancel auto-renewal
          </button>
        </p>
      )}
      {planKey === "trial" && (
        <p className="pt-1 text-center text-[11px] text-[#64748b]">
          <CreditCard className="inline h-3 w-3 mr-1" />
          Payments are secured by Razorpay. <Link href="/terms" className="underline underline-offset-2">Terms</Link>
        </p>
      )}

      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => { if (!isCancelling) setShowCancelModal(false); }}
        onConfirm={() => void handleConfirmCancel()}
        title="Cancel auto-renewal?"
        description={`Your plan stays active till ${endDateShort || "the end of this period"}. After that your profile goes private.`}
        confirmText="Cancel auto-renewal"
        cancelText="Keep it"
        loading={isCancelling}
        isDestructive
        focusCancel
      />
    </PageContainer>
  );
}

/** useSearchParams (dev-only state mocks) needs a Suspense boundary in the app router. */
export default function DashboardSubscriptionPage() {
  return (
    <Suspense fallback={null}>
      <PlanPage />
    </Suspense>
  );
}
