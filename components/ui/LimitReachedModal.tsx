"use client";

import { AlertCircle, Bell, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";

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

  function handleNotifyMe() {
    setNotified(true);
    showToast("We'll notify you as soon as Creator Pro & VIP plans go live! 🚀");
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
      : "1 Service Limit Reached";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={modalTitle}
      description="Early Access Limit Reached"
      icon={<AlertCircle className="h-4 w-4" />}
    >
      <ModalBody className="p-5 space-y-4 text-left">
        <p className="text-xs text-[#797570] leading-relaxed font-medium">
          {isSeries
            ? "Early Access includes up to 3 Series. Upgrade to Pro or VIP for Unlimited Series & Episodes!"
            : isEpisode
              ? "Early Access includes up to 15 Total Episodes across all series. Upgrade to Pro or VIP for Unlimited Episodes!"
              : "Early Access includes 1 Active Service package. Upgrade to VIP for Unlimited Creator Services & Rate Cards!"}
        </p>

        {/* Upgrade Plan Cards Preview */}
        <div className="rounded-xl border border-[#E7E3DC] bg-[#fbfbfb] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display text-xs font-bold text-[#181716]">
              {isGig ? "Creator VIP Plan" : "Creator Pro Plan"}
            </span>
            <span className="rounded-md bg-[#b85c6b] px-2 py-0.5 text-[9px] font-bold text-white">
              RECOMMENDED
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-[#181716]">
              {isGig ? "₹299" : "₹199"}
            </span>
            <span className="text-xs text-[#797570]">/ month</span>
            <span className="text-xs font-semibold text-[#b85c6b] ml-1">
              {isGig ? "or ₹2,999 / year" : "or ₹1,999 / year"}
            </span>
          </div>

          <ul className="space-y-1.5 text-xs text-[#181716] font-medium">
            <li className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>{isGig ? "Unlimited Services & Media Kit" : "Unlimited Series & Episodes"}</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-[#b85c6b]" /> Remove Inflixo Footer Branding
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-[#b85c6b]" /> Priority Support &amp; Analytics
            </li>
          </ul>
        </div>
      </ModalBody>

      <ModalFooter className="px-5 py-3.5">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-[#E7E3DC] text-xs font-semibold text-[#797570] hover:bg-[#fbfbfb] hover:text-[#181716] transition-colors cursor-pointer"
        >
          Got it
        </button>
        <button
          type="button"
          onClick={handleNotifyMe}
          disabled={notified}
          className="bg-[#b85c6b] hover:bg-[#6F3456] text-white font-semibold text-xs py-2 px-4 rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
        >
          <Bell className="h-3.5 w-3.5" />
          <span>{notified ? "We'll Notify You! ✓" : "Notify Me"}</span>
        </button>
      </ModalFooter>
    </Modal>
  );
}
