"use client";

import { useState } from "react";
import { MessageCircle, Send, Building2, DollarSign, Package } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";

interface BrandLeadQualifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorName: string;
  creatorUsername: string;
  whatsappNumber: string;
  packageName?: string;
  packagePrice?: string;
  deliverableText?: string;
}

export function BrandLeadQualifierModal({
  isOpen,
  onClose,
  creatorName,
  creatorUsername,
  whatsappNumber,
  packageName = "1x Sponsored Reel / Post",
  packagePrice = "Custom",
  deliverableText,
}: BrandLeadQualifierModalProps) {
  const { showToast } = useToast();
  const [brandName, setBrandName] = useState("");
  const [budget, setBudget] = useState(packagePrice !== "Custom" ? packagePrice : "");
  const [selectedDeliverable, setSelectedDeliverable] = useState(packageName);

  function cleanPhone(phone: string) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) return `91${digits}`;
    return digits;
  }

  function handleSendWhatsApp(e: React.FormEvent) {
    e.preventDefault();

    if (!brandName.trim()) {
      showToast("Please enter your Brand or Agency name", "error");
      return;
    }
    if (!budget.trim()) {
      showToast("Please enter your estimated campaign budget", "error");
      return;
    }

    const cleanNum = cleanPhone(whatsappNumber);
    if (!cleanNum) {
      showToast("Creator has not linked a valid WhatsApp number", "error");
      return;
    }

    const mediaKitUrl = `https://inflixo.com/${creatorUsername || "creator"}`;
    const briefText = `Hi ${creatorName || "Creator"}, I am from ${brandName.trim()}. We want to book your '${selectedDeliverable}' deliverable (Campaign Budget: ${budget.trim()}). Found your Inflixo Profile: ${mediaKitUrl}`;

    const waUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(briefText)}`;

    if (typeof window !== "undefined") {
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }

    showToast("Launching WhatsApp with pre-filled brand brief! 🚀", "success");
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Book via WhatsApp"
      description={`Send a direct brand collaboration brief to ${creatorName || "Creator"}`}
      icon={<MessageCircle className="h-4 w-4 text-[#17845B]" />}
    >
      <form id="brand-lead-form" onSubmit={handleSendWhatsApp} className="flex flex-col flex-1 min-h-0">
        <ModalBody className="p-5 space-y-4 text-left">
          {/* Deliverable Summary Badge */}
          <div className="rounded-xl border border-[#E4DAD5] bg-[#fbfbfb] p-3.5 flex items-center gap-3">
            <Package className="h-4 w-4 text-[#600a0f] shrink-0" />
            <div className="min-w-0 text-xs">
              <p className="font-bold text-[#181716] truncate">{packageName}</p>
              {deliverableText && <p className="text-[#797570] font-medium truncate mt-0.5">{deliverableText}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#181716] flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-[#600a0f]" />
              <span>Brand or Agency name</span> <span className="text-[#C2414B]">*</span>
            </label>
            <input
              type="text"
              required
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Puma India / Nike"
              className="w-full rounded-xl border border-[#E4DAD5] bg-[#fbfbfb] px-3.5 py-2.5 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#600a0f] focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#181716] flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-[#17845B]" />
              <span>Campaign budget</span> <span className="text-[#C2414B]">*</span>
            </label>
            <input
              type="text"
              required
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. ₹25,000 / $500 USD"
              className="w-full rounded-xl border border-[#E4DAD5] bg-[#fbfbfb] px-3.5 py-2.5 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#600a0f] focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#181716]">
              Selected package
            </label>
            <input
              type="text"
              value={selectedDeliverable}
              onChange={(e) => setSelectedDeliverable(e.target.value)}
              className="w-full rounded-xl border border-[#E4DAD5] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#181716]"
            />
          </div>
        </ModalBody>

        <ModalFooter className="px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E4DAD5] text-xs font-semibold text-[#797570] hover:bg-[#fbfbfb] hover:text-[#181716] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="brand-lead-form"
            className="bg-[#17845B] hover:bg-[#146c4b] text-white font-semibold text-xs py-2 px-4.5 rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Open WhatsApp with Brief →</span>
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
