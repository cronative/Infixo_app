"use client";

import { useState, useEffect } from "react";
import {
  Briefcase,
  Mail,
  Phone,
  Building2,
  Calendar,
  Send,
  Loader2,
  CheckCircle2,
  Sparkles,
  DollarSign,
} from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { MediaKitPackage } from "@/types";

interface CollaborationInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  creatorEmail?: string;
  creatorName: string;
  creatorUsername: string;
  packages?: MediaKitPackage[];
  selectedPackageTitle?: string;
}

export function CollaborationInquiryModal({
  isOpen,
  onClose,
  creatorId,
  creatorEmail,
  creatorName,
  creatorUsername,
  packages = [],
  selectedPackageTitle,
}: CollaborationInquiryModalProps) {
  const { showToast } = useToast();

  const [brandName, setBrandName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [budgetRange, setBudgetRange] = useState("₹25,000 – ₹50,000");
  const [timeline, setTimeline] = useState("Within 2–4 weeks");
  const [deliverables, setDeliverables] = useState(
    selectedPackageTitle || (packages.length > 0 ? packages[0].title : "Sponsored Video / Reel")
  );

  useEffect(() => {
    if (selectedPackageTitle) {
      setDeliverables(selectedPackageTitle);
    } else if (packages.length > 0 && !deliverables) {
      setDeliverables(packages[0].title);
    }
  }, [selectedPackageTitle, packages, isOpen]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim() || !contactName.trim() || !contactEmail.trim()) {
      showToast("Please fill in the required contact information", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/collaborations/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator_id: creatorId,
          creator_email: creatorEmail,
          creator_username: creatorUsername,
          brand_name: brandName.trim(),
          contact_name: contactName.trim(),
          contact_email: contactEmail.trim(),
          contact_phone: contactPhone.trim() || undefined,
          budget_range: budgetRange,
          timeline,
          deliverables,
          message: message.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
        showToast("Collaboration request sent! ✨");
      } else {
        showToast(data.error || "Failed to submit request", "error");
      }
    } catch (err) {
      console.error("Failed to submit inquiry:", err);
      showToast("Network error. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setBrandName("");
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setMessage("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      title={`Collaborate with ${creatorName}`}
      description="Send a direct brand collaboration inquiry to the creator."
      icon={<Briefcase className="h-4 w-4 text-[#043084]" />}
    >
      {isSuccess ? (
        <div className="p-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="font-display text-base font-bold text-[#241618]">
            Inquiry Sent to @{creatorUsername} 🎉
          </h3>
          <p className="text-xs text-[#6B5A5D] max-w-sm mx-auto leading-relaxed">
            Thank you! Your brand collaboration details have been delivered to {creatorName}’s creator inbox.
          </p>
          <div className="pt-3">
            <button
              type="button"
              onClick={handleClose}
              className="bg-[#043084] hover:bg-brand-hover text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="text-left">
          <ModalBody className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Brand & Contact Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#043084] block">
                  Brand / Company Name <span className="text-[#C2414B]">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748b]" />
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="h-9.5 w-full rounded-lg border border-[#e2e8f0] bg-white pl-8 pr-3 text-xs sm:text-[13px] font-medium text-[#043084] placeholder:text-[#94a3b8] focus:border-[#043084] focus:outline-none focus:ring-1 focus:ring-[#043084]/20 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#043084] block">
                  Your Name <span className="text-[#C2414B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="h-9.5 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs sm:text-[13px] font-medium text-[#043084] placeholder:text-[#94a3b8] focus:border-[#043084] focus:outline-none focus:ring-1 focus:ring-[#043084]/20 transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#043084] block">
                  Business Email <span className="text-[#C2414B]">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748b]" />
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="sarah@acme.com"
                    className="h-9.5 w-full rounded-lg border border-[#e2e8f0] bg-white pl-8 pr-3 text-xs sm:text-[13px] font-medium text-[#043084] placeholder:text-[#94a3b8] focus:border-[#043084] focus:outline-none focus:ring-1 focus:ring-[#043084]/20 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#043084] block">
                  Phone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748b]" />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-9.5 w-full rounded-lg border border-[#e2e8f0] bg-white pl-8 pr-3 text-xs sm:text-[13px] font-medium text-[#043084] placeholder:text-[#94a3b8] focus:border-[#043084] focus:outline-none focus:ring-1 focus:ring-[#043084]/20 transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Budget & Timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#043084] block">
                  Estimated Budget
                </label>
                <select
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className="h-9.5 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs sm:text-[13px] font-medium text-[#043084] focus:border-[#043084] focus:outline-none focus:ring-1 focus:ring-[#043084]/20 transition-all shadow-2xs cursor-pointer"
                >
                  <option value="Under ₹15,000">Under ₹15,000</option>
                  <option value="₹15,000 – ₹30,000">₹15,000 – ₹30,000</option>
                  <option value="₹30,000 – ₹60,000">₹30,000 – ₹60,000</option>
                  <option value="₹60,000 – ₹1,00,000">₹60,000 – ₹1,00,000</option>
                  <option value="₹1,00,000+">₹1,00,000+</option>
                  <option value="Flexible / Negotiable">Flexible / Negotiable</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#043084] block">
                  Campaign Timeline
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748b]" />
                  <input
                    type="text"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="e.g. Next month / Q3"
                    className="h-9.5 w-full rounded-lg border border-[#e2e8f0] bg-white pl-8 pr-3 text-xs sm:text-[13px] font-medium text-[#043084] placeholder:text-[#94a3b8] focus:border-[#043084] focus:outline-none focus:ring-1 focus:ring-[#043084]/20 transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Preferred Deliverables */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#043084] block">
                Deliverables / Format
              </label>
              <input
                type="text"
                value={deliverables}
                onChange={(e) => setDeliverables(e.target.value)}
                placeholder="e.g. 1x Dedicated Reel, 2x Stories with Link"
                className="h-9.5 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs sm:text-[13px] font-medium text-[#043084] placeholder:text-[#94a3b8] focus:border-[#043084] focus:outline-none focus:ring-1 focus:ring-[#043084]/20 transition-all shadow-2xs"
              />
            </div>

            {/* Campaign Details / Message */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#043084] block">
                Campaign Brief &amp; Notes
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share project goals, product details, or specific campaign requirements..."
                className="w-full rounded-lg border border-[#e2e8f0] bg-white p-3 text-xs sm:text-[13px] font-medium text-[#043084] placeholder:text-[#94a3b8] focus:border-[#043084] focus:outline-none focus:ring-1 focus:ring-[#043084]/20 transition-all shadow-2xs resize-none"
              />
            </div>
          </ModalBody>

          <ModalFooter className="px-5 py-3 flex items-center justify-between">
            <button
              type="button"
              onClick={handleClose}
              className="h-9 px-4 rounded-lg border border-[#e2e8f0] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#043084] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-9 inline-flex items-center gap-1.5 rounded-lg bg-[#043084] hover:bg-brand-hover px-4.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 cursor-pointer shadow-xs hover:shadow-sm disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Collaboration Request</span>
                </>
              )}
            </button>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}
