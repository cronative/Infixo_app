"use client";

import { AlertCircle, Sparkles, Check } from "lucide-react";
import Link from "next/link";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { formatPlanPrice, usePricingCurrency } from "@/lib/pricing";
import { useCreator } from "@/contexts/CreatorContext";
import { getPlanQuota } from "@/services/subscriptionLimits";

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "series" | "episode" | "gig" | "product";
  seriesTitle?: string;
  planKey?: string;
}

export function LimitReachedModal({
  isOpen,
  onClose,
  type,
  seriesTitle,
  planKey: propPlanKey,
}: LimitReachedModalProps) {
  const { subscription } = useCreator();
  const pricingCurrency = usePricingCurrency();

  const currentPlanKey = propPlanKey || subscription?.planKey || "early_access";
  const normalizedKey =
    currentPlanKey === "creator_pro" || currentPlanKey === "pro"
      ? "pro"
      : currentPlanKey === "creator_VIP" || currentPlanKey === "vip"
      ? "vip"
      : currentPlanKey === "starter"
      ? "starter"
      : "early_access";

  const quota = getPlanQuota(normalizedKey);
  const planName = quota.name;

  const isSeries = type === "series";
  const isEpisode = type === "episode";
  const isGig = type === "gig";
  const isProduct = type === "product";

  const modalTitle = isSeries
    ? `${quota.maxSeries} Series Limit Reached`
    : isEpisode
    ? `${quota.maxEpisodesPerSeries} Episodes Limit Reached`
    : isProduct
    ? `${quota.maxProducts} Product Limit Reached`
    : `${quota.maxGigs} Collab Package Limit Reached`;

  let limitExplanation = "";
  if (isSeries) {
    limitExplanation =
      normalizedKey === "pro"
        ? "Pro plan includes up to 20 series. Upgrade to VIP for unlimited series."
        : `${planName} includes up to 3 series. Upgrade to Pro for 20 series or VIP for unlimited series.`;
  } else if (isEpisode) {
    limitExplanation =
      normalizedKey === "pro"
        ? seriesTitle
          ? `"${seriesTitle}" has reached the Pro plan limit (20 episodes). Upgrade to VIP for unlimited episodes.`
          : "Pro plan includes up to 20 episodes per series. Upgrade to VIP for unlimited episodes."
        : seriesTitle
        ? `"${seriesTitle}" has reached the ${planName} limit (5 episodes). Upgrade to Pro for 20 episodes per series or VIP for unlimited.`
        : `${planName} includes up to 5 episodes per series (15 total). Upgrade to Pro for 20 episodes per series or VIP for unlimited.`;
  } else if (isProduct) {
    limitExplanation =
      normalizedKey === "pro"
        ? "Pro plan includes up to 20 products in shop. Upgrade to VIP for unlimited products."
        : `${planName} includes 1 product in shop. Upgrade to Pro for 20 products or VIP for unlimited products.`;
  } else {
    limitExplanation =
      normalizedKey === "pro"
        ? "Pro plan includes up to 3 collab packages. Upgrade to VIP for 10 packages."
        : `${planName} includes 1 collab package. Upgrade to Pro for 3 packages or VIP for 10 packages.`;
  }

  const targetUpgradePlan = normalizedKey === "pro" ? "vip" : "pro";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={modalTitle}
      description={`${planName} Limit Reached`}
      icon={<AlertCircle className="h-4 w-4" />}
    >
      <ModalBody className="p-5 space-y-4 text-left">
        <p className="text-xs text-[#64748b] leading-relaxed font-medium">
          {limitExplanation}
        </p>

        {/* Upgrade Plan Card Preview */}
        <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display text-xs font-bold text-[#043084]">
              {targetUpgradePlan === "vip" ? "Inflixo VIP Plan" : "Inflixo Pro Plan"}
            </span>
            <span className="rounded-md bg-[#043084] px-2 py-0.5 text-[9px] font-bold text-white">
              RECOMMENDED
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-[#043084]">
              {formatPlanPrice(targetUpgradePlan, "monthly", pricingCurrency)}
            </span>
            <span className="text-xs text-[#64748b]">/ month</span>
            <span className="text-xs font-semibold text-[#043084] ml-1">
              {`or ${formatPlanPrice(targetUpgradePlan, "yearly", pricingCurrency)} / year`}
            </span>
          </div>

          <ul className="space-y-1.5 text-xs text-[#043084] font-medium">
            <li className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>
                {targetUpgradePlan === "vip"
                  ? "Unlimited products, series & episodes + 10 collab packages"
                  : "20 products in shop & 20 series with 20 episodes"}
              </span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-[#043084]" />
              <span>
                {targetUpgradePlan === "vip"
                  ? "Custom media kit & premium themes"
                  : "Rate card + default media kit"}
              </span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-[#043084]" />
              <span>
                {targetUpgradePlan === "vip"
                  ? "Unlimited custom links & reviews"
                  : "20 custom links & 10 reviews"}
              </span>
            </li>
          </ul>
        </div>
      </ModalBody>

      <ModalFooter className="px-5 py-3.5">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-[#e2e8f0] text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#043084] transition-colors cursor-pointer"
        >
          Close
        </button>

        <Link
          href="/dashboard/subscription"
          onClick={onClose}
          className="bg-[#043084] hover:bg-[#032360] active:scale-[0.99] text-white font-semibold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Upgrade Plan Now</span>
        </Link>
      </ModalFooter>
    </Modal>
  );
}
