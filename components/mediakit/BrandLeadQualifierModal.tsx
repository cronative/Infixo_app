"use client";

import { useState } from "react";
import { MessageCircle, X, Send, Sparkles, ShieldCheck, DollarSign, Building2, Package } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

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

  if (!isOpen) return null;

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
    const briefText = `Hi ${creatorName || "Creator"}, I am from ${brandName.trim()}. We want to book your '${selectedDeliverable}' deliverable (Campaign Budget: ${budget.trim()}). Found your Inflixo Media Kit: ${mediaKitUrl}`;

    const waUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(briefText)}`;
    
    // Launch WhatsApp web / app link in new tab
    if (typeof window !== "undefined") {
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }

    showToast("Launching WhatsApp with pre-filled brand brief! 🚀", "success");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-gray-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-left animate-in zoom-in-95">
        
        {/* Header & Close */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>Book via WhatsApp</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">
                  <ShieldCheck className="h-3 w-3" /> 0% Commission
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Send a pre-verified brand campaign brief to {creatorName || "Creator"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Deliverable Summary Badge */}
        <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-3.5 flex items-center gap-3">
          <Package className="h-5 w-5 text-[#803D63] shrink-0" />
          <div className="min-w-0 text-xs">
            <p className="font-extrabold text-slate-900 truncate">{packageName}</p>
            {deliverableText && <p className="text-slate-500 font-medium truncate mt-0.5">{deliverableText}</p>}
          </div>
        </div>

        {/* Lead Qualifier Form Inputs */}
        <form onSubmit={handleSendWhatsApp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-[#803D63]" />
              <span>Your Brand / Agency Name</span> <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Nike / Puma / Local Marketing Agency"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#803D63] focus:outline-none focus:ring-2 focus:ring-[#803D63]/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
              <span>Campaign Budget</span> <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. ₹25,000 / $500 USD"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#803D63] focus:outline-none focus:ring-2 focus:ring-[#803D63]/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Selected Package Title
            </label>
            <input
              type="text"
              value={selectedDeliverable}
              onChange={(e) => setSelectedDeliverable(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700"
            />
          </div>

          {/* Direct Submit Action */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-2"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Open WhatsApp with Brief →</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
