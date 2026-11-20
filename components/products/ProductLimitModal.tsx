"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { formatPlanPrice } from "@/lib/pricing";
import { getPlanQuota } from "@/services/subscriptionLimits";

export function ProductLimitModal({ isOpen, onClose, used, limit, plan }: {
  isOpen: boolean;
  onClose: () => void;
  used: number;
  limit: number;
  plan: string;
}) {
  const onPro = plan === "pro" || plan === "creator_pro";
  const target = onPro ? "vip" : "pro";
  const targetName = onPro ? "VIP" : "Pro";
  const targetLimit = getPlanQuota(target).maxProducts;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      wrapHeader
      title={`You've used ${used} of ${limit} ${limit === 1 ? "product" : "products"} on ${getPlanQuota(plan).name}`}
      description={Number.isFinite(targetLimit) ? `Upgrade to ${targetName} to add up to ${targetLimit} products.` : `Upgrade to ${targetName} to add unlimited products.`}
      icon={<ShoppingBag className="h-5 w-5" />}
    >
      <ModalFooter className="flex-wrap px-5 sm:px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="h-10 px-5 rounded-[5px] border border-[#ECECF0] bg-white text-xs font-semibold text-[#6B6B76] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors cursor-pointer"
        >
          Not now
        </button>
        <Link
          href="/dashboard/subscription"
          onClick={onClose}
          className="h-10 px-5 rounded-[5px] bg-[#C21B5C] text-white font-semibold text-xs transition-all cursor-pointer shadow-md shadow-[#C21B5C]/20 hover:opacity-95 inline-flex items-center gap-1.5"
        >
          Upgrade to {targetName} ({formatPlanPrice(target, "monthly", "INR")}/month)
        </Link>
      </ModalFooter>
    </Modal>
  );
}
