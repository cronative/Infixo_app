"use client";

import { AlertCircle, Bell, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { formatPlanPrice, usePricingCurrency } from "@/lib/pricing";

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "series" | "episode" | "gig";
  seriesTitle?: string;
}

export function LimitReachedModal({
  isOpen,
  onClose,
  type,
  seriesTitle,
}: LimitReachedModalProps) {
  const { showToast } = useToast();
  const [notified, setNotified] = useState(false);
  const pricingCurrency = usePricingCurrency();

  function handleNotifyMe() {
    setNotified(true);
    showToast("We'll notify you as soon as Pro & VIP plans go live! 🚀");
    setTimeout(() => {
      onClose();
      setNotified(false);
    }, 1500);
  }

  const isSeries = type === "series";
  const isEpisode = type === "episode";
  const isGig = type === "gig";

  const modalTitle = isSeries
    ? "3 Series Limit Reached"
    : isEpisode
      ? "15 Total Episodes Limit Reached"
      : "1 Collab Package Limit Reached";
  const episodeLimitMessage = seriesTitle
    ? `"${seriesTitle}" has reached the episode limit for your plan. Upgrade to Pro for 20 episodes per series or VIP for unlimited.`
    : "Free Trial includes up to 15 total episode links. Upgrade to Pro for 20 episodes per series or VIP for unlimited.";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={modalTitle}
      description="Free Trial Limit Reached"
      icon={<AlertCircle className="h-4 w-4" />}
    >
      <ModalBody className="p-5 space-y-4 text-left">
        <p className="text-xs text-[#64748b] leading-relaxed font-medium">
          {isSeries
            ? "Free Trial includes up to 3 series. Upgrade to Pro for 20 series or VIP for unlimited series."
            : isEpisode
              ? episodeLimitMessage
              : "Free Trial includes 1 collab package. Upgrade to Pro for 3 packages or VIP for 10 packages."}
        </p>

        {/* Upgrade Plan Cards Preview */}
        <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display text-xs font-bold text-[#151933]">
              {isGig ? "VIP Plan" : "Pro Plan"}
            </span>
            <span className="rounded-md bg-[#151933] px-2 py-0.5 text-[9px] font-bold text-white">
              RECOMMENDED
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-[#151933]">
              {isGig ? formatPlanPrice("vip", "monthly", pricingCurrency) : formatPlanPrice("pro", "monthly", pricingCurrency)}
            </span>
            <span className="text-xs text-[#64748b]">/ month</span>
            <span className="text-xs font-semibold text-[#151933] ml-1">
              {isGig
                ? `or ${formatPlanPrice("vip", "yearly", pricingCurrency)} / year`
                : `or ${formatPlanPrice("pro", "yearly", pricingCurrency)} / year`}
            </span>
          </div>

          <ul className="space-y-1.5 text-xs text-[#151933] font-medium">
            <li className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>{isGig ? "10 collab packages + custom media kit" : "20 series with 20 episodes each"}</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-[#151933]" /> Remove Inflixo Footer Branding
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-[#151933]" /> Priority Support &amp; Analytics
            </li>
          </ul>
        </div>
      </ModalBody>

      <ModalFooter className="px-5 py-3.5">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-[#e2e8f0] text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#151933] transition-colors cursor-pointer"
        >
          Got it
        </button>
        <button
          type="button"
          onClick={handleNotifyMe}
          disabled={notified}
          className="bg-[#151933] hover:bg-brand-hover text-white font-semibold text-xs py-2 px-4 rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
        >
          <Bell className="h-3.5 w-3.5" />
          <span>{notified ? "We'll Notify You! ✓" : "Notify Me"}</span>
        </button>
      </ModalFooter>
    </Modal>
  );
}
