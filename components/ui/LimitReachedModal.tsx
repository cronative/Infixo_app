"use client";

import {
  AlertCircle,
  Sparkles,
  Check,
  Crown,
  ChevronRight,
  TrendingUp,
  Gift,
  Film,
  Clapperboard,
  ShoppingBag,
  Link2,
  Star,
} from "lucide-react";
import Link from "next/link";
import { Modal, ModalBody } from "@/components/ui/Modal";
import { formatPlanPrice, usePricingCurrency } from "@/lib/pricing";
import { useCreator } from "@/contexts/CreatorContext";
import { getPlanQuota } from "@/services/subscriptionLimits";

export interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "series" | "episode" | "gig" | "product" | "link" | "review";
  seriesTitle?: string;
  planKey?: string;
  currentCount?: number;
  maxLimit?: number;
}

export function LimitReachedModal({
  isOpen,
  onClose,
  type,
  seriesTitle,
  planKey: propPlanKey,
  currentCount,
  maxLimit: propMaxLimit,
}: LimitReachedModalProps) {
  const { subscription } = useCreator();
  const pricingCurrency = usePricingCurrency();

  const currentPlanKey = propPlanKey || subscription?.planKey || "starter";
  const normalizedKey =
    currentPlanKey === "creator_pro" || currentPlanKey === "pro"
      ? "pro"
      : currentPlanKey === "creator_VIP" || currentPlanKey === "vip"
      ? "vip"
      : currentPlanKey === "starter"
      ? "starter"
      : "early_access";

  const quota = getPlanQuota(normalizedKey);
  const planName = quota.name === "Free Trial" ? "Starter" : quota.name;

  const isSeries = type === "series";
  const isEpisode = type === "episode";
  const isGig = type === "gig";
  const isProduct = type === "product";
  const isLink = type === "link";
  const isReview = type === "review";

  // Target plan to upgrade to
  const targetUpgradePlan = normalizedKey === "pro" ? "vip" : "pro";
  const targetPlanTitle = targetUpgradePlan === "vip" ? "Inflixo VIP Plan" : "Inflixo Pro Plan";

  // Resource-specific dynamic metadata
  let resourceSingular = "collaboration package";
  let resourcePlural = "Collab Packages";
  let resourceIcon = <Gift className="h-4 w-4" />;
  let maxLimit = quota.maxGigs;
  let encouragingText =
    "Your content is getting noticed and brands are showing interest. To add more collaboration packages, upgrade your plan and unlock higher limits.";
  let whyUpgradeText =
    "Get more collaboration opportunities, showcase your offerings better, and grow faster.";
  let socialProofText = "Creators like you are unlocking more brand deals";

  if (isSeries) {
    resourceSingular = "series";
    resourcePlural = "Series";
    resourceIcon = <Clapperboard className="h-4 w-4" />;
    maxLimit = quota.maxSeries;
    encouragingText =
      "Your content catalog is growing fast! To create more series and expand your creator studio, upgrade your plan and unlock higher limits.";
    whyUpgradeText =
      "Organize your videos into bingeable series, keep viewers engaged, and build loyal followers.";
    socialProofText = "Creators like you are publishing episodic series";
  } else if (isEpisode) {
    resourceSingular = seriesTitle ? `episode in "${seriesTitle}"` : "episode";
    resourcePlural = "Episodes per Series";
    resourceIcon = <Film className="h-4 w-4" />;
    maxLimit = quota.maxEpisodesPerSeries;
    encouragingText =
      "Your audience loves your episodes! To publish more episodes in this series, upgrade your plan and unlock higher limits.";
    whyUpgradeText =
      "Give your viewers more episodes, tell complete stories, and maximize watch time.";
    socialProofText = "Top creators publish 10+ episodes per series";
  } else if (isProduct) {
    resourceSingular = "product in shop";
    resourcePlural = "Products in Shop";
    resourceIcon = <ShoppingBag className="h-4 w-4" />;
    maxLimit = quota.maxProducts;
    encouragingText =
      "Your creator shop is getting traction! To recommend more products and increase your affiliate earnings, upgrade your plan and unlock higher limits.";
    whyUpgradeText =
      "Feature more gear, curated fashion, and top recommendations for your audience to buy.";
    socialProofText = "Creators like you are earning daily through shop";
  } else if (isLink) {
    resourceSingular = "custom link";
    resourcePlural = "Custom Links";
    resourceIcon = <Link2 className="h-4 w-4" />;
    maxLimit = quota.maxCustomLinks;
    encouragingText =
      "Your custom links are driving clicks! To add more links and promote all your work, upgrade your plan and unlock higher limits.";
    whyUpgradeText =
      "Share your portfolio, brand deals, and all your links in one unified creator hub.";
    socialProofText = "Creators like you are driving 3x more link clicks";
  } else if (isReview) {
    resourceSingular = "brand review";
    resourcePlural = "Reviews";
    resourceIcon = <Star className="h-4 w-4" />;
    maxLimit = quota.maxReviews;
    encouragingText =
      "Brand feedback is boosting your credibility! To showcase more testimonials, upgrade your plan and unlock higher limits.";
    whyUpgradeText =
      "Showcase proof of past brand successes to close higher-paying sponsorship deals.";
    socialProofText = "Creators with 5+ reviews land 2x more collaborations";
  }

  const effectiveMax = propMaxLimit !== undefined ? propMaxLimit : maxLimit;
  const usedCount = currentCount !== undefined ? currentCount : effectiveMax;

  // Features list for target upgrade plan
  const features =
    targetUpgradePlan === "vip"
      ? [
          { text: "Up to 10 collab packages", highlight: isGig },
          { text: "Unlimited products in shop & series (unlimited episodes)", highlight: isProduct || isSeries || isEpisode },
          { text: "Unlimited custom links & reviews", highlight: isLink || isReview },
          { text: "Custom media kit & premium themes", highlight: false },
          { text: "VIP dedicated support & verification badge", highlight: false },
        ]
      : [
          { text: "Up to 3 collab packages", highlight: isGig },
          { text: "20 products in shop & 20 series (20 episodes)", highlight: isProduct || isSeries || isEpisode },
          { text: "Custom links & 10 reviews", highlight: isLink || isReview },
          { text: "Rate card + advanced media kit", highlight: false },
          { text: "Priority support", highlight: false },
        ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title="You've reached your limit"
      description={`You've used ${usedCount} ${resourceSingular} in your ${planName} plan.`}
      icon={<AlertCircle className="h-5 w-5 text-[#7A2253]" />}
    >
      <ModalBody className="p-5 sm:p-6 space-y-4 text-left overflow-y-auto">
        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          {/* Left Column (7 cols): Encouragement + Usage Card */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            {/* Encouraging Card */}
            <div className="rounded-[5px] bg-gradient-to-r from-[#FFF5F7] to-[#FDF2F8] border border-[#FCE7F3] p-4 flex items-center justify-between gap-3 relative overflow-hidden">
              <div className="min-w-0 flex-1 space-y-1">
                <h4 className="font-bold text-sm text-[#0f172a] flex items-center gap-1.5">
                  <span>You&apos;re doing great!</span>
                  <span>🎉</span>
                </h4>
                <p className="text-xs text-[#64748b] leading-relaxed">
                  {encouragingText}
                </p>
              </div>

              {/* Star Card Graphic */}
              <div className="relative shrink-0 flex items-center justify-center w-16 h-16 select-none" aria-hidden="true">
                <span className="absolute -top-1 -right-1 h-3 w-1 bg-amber-400 rotate-45 rounded-full opacity-80" />
                <span className="absolute top-1 -right-2 h-1 w-3 bg-rose-400 rotate-12 rounded-full opacity-80" />
                <span className="absolute -top-2 right-4 h-3 w-1 bg-[#7A2253] rotate-12 rounded-full opacity-60" />
                <div className="w-12 h-10 rounded-[6px] bg-gradient-to-br from-[#FCE7F3] to-[#FBCFE8] border border-[#F472B6]/40 shadow-xs rotate-[-10deg] flex items-center justify-center text-[#7A2253]">
                  <span className="text-base font-bold">⭐</span>
                </div>
              </div>
            </div>

            {/* Current Usage Section */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-[#0f172a]">Your current usage</p>
              <div className="rounded-[5px] border border-[#e2e8f0] bg-[#f8fafc] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F1] text-[#7A2253] shrink-0">
                      {resourceIcon}
                    </div>
                    <span className="text-xs font-semibold text-[#0f172a] truncate">
                      {resourcePlural}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-[#7A2253] whitespace-nowrap">
                    {usedCount} of {effectiveMax} used
                  </span>
                </div>

                {/* Progress bar (100% full since limit reached) */}
                <div className="h-2 w-full bg-[#e2e8f0] rounded-full overflow-hidden">
                  <div className="h-full bg-[#7A2253] rounded-full w-full" />
                </div>

                <p className="text-[11px] text-[#64748b]">
                  You&apos;ve reached the limit for your {planName} plan.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Plan Upgrade Card */}
          <div className="md:col-span-5 rounded-[5px] border border-[#FCE7F3] bg-white p-4 sm:p-4.5 space-y-3.5 flex flex-col justify-between shadow-2xs">
            {/* Plan Header */}
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2.5">
                <span className="font-bold text-xs sm:text-sm text-[#0f172a] flex items-center gap-1.5">
                  <Crown className="h-4 w-4 text-amber-500 fill-amber-500/20 shrink-0" />
                  <span>{targetPlanTitle}</span>
                </span>
                <span className="rounded-[5px] bg-[#7A2253] px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider shrink-0">
                  Most Popular
                </span>
              </div>

              {/* Pricing */}
              <div className="space-y-0.5">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-[#0f172a]">
                    {formatPlanPrice(targetUpgradePlan, "monthly", pricingCurrency)}
                  </span>
                  <span className="text-xs font-medium text-[#64748b]">/ month</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
                  <span className="font-semibold text-[#0f172a]">
                    or {formatPlanPrice(targetUpgradePlan, "yearly", pricingCurrency)} / year
                  </span>
                  <span className="rounded-full bg-[#FCE7F3] px-2 py-0.5 text-[10px] font-bold text-[#7A2253]">
                    Save 37%
                  </span>
                </div>
              </div>
            </div>

            {/* Feature Bullets */}
            <ul className="space-y-2 text-xs text-[#334155] py-1 border-t border-[#f1f5f9]">
              {features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#10b981] text-white">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span className={feat.highlight ? "font-bold text-[#0f172a]" : "text-[#475569]"}>
                    {feat.text}
                  </span>
                </li>
              ))}
            </ul>

            {/* Upgrade Button */}
            <Link
              href="/dashboard/subscription"
              onClick={onClose}
              className="w-full bg-[#7A2253] hover:opacity-95 text-white font-semibold text-xs py-2.5 px-4 rounded-[5px] transition-all cursor-pointer shadow-xs inline-flex items-center justify-center gap-1.5 group"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Upgrade to {targetUpgradePlan === "vip" ? "VIP" : "Pro"}</span>
              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Bottom Banner: Why upgrade? & Social Proof */}
        <div className="rounded-[5px] bg-[#FFF5F7] border border-[#FCE7F3] p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] bg-white border border-[#FCE7F3] text-[#7A2253]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#7A2253]">
                Why upgrade?
              </p>
              <p className="text-[11px] text-[#64748b] mt-0.5">
                {whyUpgradeText}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <div className="flex -space-x-1.5 overflow-hidden">
              <div className="inline-flex h-6 w-6 rounded-full ring-2 ring-white bg-[#7A2253] text-white text-[9px] font-bold items-center justify-center">
                NE
              </div>
              <div className="inline-flex h-6 w-6 rounded-full ring-2 ring-white bg-amber-600 text-white text-[9px] font-bold items-center justify-center">
                SK
              </div>
              <div className="inline-flex h-6 w-6 rounded-full ring-2 ring-white bg-purple-600 text-white text-[9px] font-bold items-center justify-center">
                RD
              </div>
            </div>
            <TrendingUp className="h-3.5 w-3.5 text-[#7A2253] shrink-0" />
            <span className="text-[11px] font-semibold text-[#7A2253]">
              {socialProofText}
            </span>
          </div>
        </div>

        {/* Bottom Footer: Close for now button */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-[5px] border border-[#e2e8f0] bg-white text-xs font-semibold text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a] transition-colors cursor-pointer"
          >
            Close for now
          </button>
        </div>
      </ModalBody>
    </Modal>
  );
}
