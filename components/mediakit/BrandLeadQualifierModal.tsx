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
        <ModalBody className="p-4 sm:p-5 space-y-3.5 text-left">
          {/* Deliverable Summary Badge */}
          <div className="rounded-[5px] border border-[#ECECF0] bg-[#FAFAFB] p-3 flex items-center gap-3">
            <Package className="h-4 w-4 text-[#C21B5C] shrink-0" />
            <div className="min-w-0 text-xs">
              <p className="font-bold text-[#C21B5C] truncate">{packageName}</p>
              {deliverableText && <p className="text-[#6B6B76] font-medium truncate mt-0.5">{deliverableText}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[13px] font-medium text-[#18181B]">
              Brand or Agency name <span className="text-[#C2414B]">*</span>
            </label>
            <div className="flex items-center rounded-[5px] border border-[#ECECF0] bg-white focus-within:border-[#C21B5C] focus-within:ring-2 focus-within:ring-[#C21B5C]/10 overflow-hidden transition-colors">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#ECECF0] bg-[#FAFAFB] text-[#6B6B76]">
                <Building2 className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Mamaearth / Local Brand / Agency"
                className="flex-1 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#18181B] placeholder:text-[#6B6B76]/50 bg-transparent outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[13px] font-medium text-[#18181B]">
              Campaign budget <span className="text-[#C2414B]">*</span>
            </label>
            <div className="flex items-center rounded-[5px] border border-[#ECECF0] bg-white focus-within:border-[#C21B5C] focus-within:ring-2 focus-within:ring-[#C21B5C]/10 overflow-hidden transition-colors">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#ECECF0] bg-[#FAFAFB] text-[#17845B] font-bold text-sm">
                ₹
              </span>
              <input
                type="text"
                required
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 15,000 or 25,000"
                className="flex-1 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#18181B] placeholder:text-[#6B6B76]/50 bg-transparent outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[13px] font-medium text-[#18181B]">
              Selected package
            </label>
            <div className="flex items-center rounded-[5px] border border-[#ECECF0] bg-white focus-within:border-[#C21B5C] focus-within:ring-2 focus-within:ring-[#C21B5C]/10 overflow-hidden transition-colors">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#ECECF0] bg-[#FAFAFB] text-[#6B6B76]">
                <Package className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={selectedDeliverable}
                onChange={(e) => setSelectedDeliverable(e.target.value)}
                className="flex-1 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#C21B5C] bg-transparent outline-none"
              />
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="px-4 sm:px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-[5px] border border-[#ECECF0] bg-white text-xs font-semibold text-[#6B6B76] hover:bg-[#F4F4F5] hover:text-[#C21B5C] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="brand-lead-form"
            className="h-9 bg-[#17845B] hover:bg-[#126c4a] text-white font-semibold text-xs px-4.5 rounded-[5px] transition-all hover:-translate-y-0.5 cursor-pointer shadow-xs hover:shadow-sm inline-flex items-center gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Open WhatsApp with Brief →</span>
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
