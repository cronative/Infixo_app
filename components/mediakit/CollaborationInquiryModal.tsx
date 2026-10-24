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
  User,
  Tag,
  FileText,
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
      const httpResponse = await fetch("/api/collaborations/submit", {
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

      const apiResponse = await httpResponse.json();
      if (httpResponse.ok && (apiResponse.status === 1 || apiResponse.success)) {
        setIsSuccess(true);
        showToast("Collaboration request sent! ✨");
      } else {
        showToast(apiResponse.message || apiResponse.error || "Failed to submit request", "error");
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
      icon={<Briefcase className="h-4 w-4 text-[#7A2253]" />}
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
              className="bg-[#7A2253] hover:bg-brand-hover text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="text-left">
          <ModalBody className="p-4 sm:p-5 space-y-3.5 max-h-[70vh] overflow-y-auto">
            {/* Brand & Contact Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[13px] font-medium text-[#0f172a] block">
                  Brand / Company Name <span className="text-[#C2414B]">*</span>
                </label>
                <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Mamaearth / Local Brand / Agency"
                    className="flex-1 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[13px] font-medium text-[#0f172a] block">
                  Your Name <span className="text-[#C2414B]">*</span>
                </label>
                <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Rohan Sharma"
                    className="flex-1 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[13px] font-medium text-[#0f172a] block">
                  Business Email <span className="text-[#C2414B]">*</span>
                </label>
                <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@brand.com"
                    className="flex-1 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[13px] font-medium text-[#0f172a] block">
                  Phone / WhatsApp
                </label>
                <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="flex-1 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Budget & Timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[13px] font-medium text-[#0f172a] block">
                  Estimated Budget
                </label>
                <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#17845B] font-bold text-sm">
                    ₹
                  </span>
                  <select
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="flex-1 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] bg-transparent outline-none cursor-pointer"
                  >
                    <option value="Under ₹15,000">Under ₹15,000</option>
                    <option value="₹15,000 – ₹30,000">₹15,000 – ₹30,000</option>
                    <option value="₹30,000 – ₹60,000">₹30,000 – ₹60,000</option>
                    <option value="₹60,000 – ₹1,00,000">₹60,000 – ₹1,00,000</option>
                    <option value="₹1,00,000+">₹1,00,000+</option>
                    <option value="Flexible / Negotiable">Flexible / Negotiable</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[13px] font-medium text-[#0f172a] block">
                  Campaign Timeline
                </label>
                <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                    <Calendar className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="e.g. Next month / Q3"
                    className="flex-1 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Preferred Deliverables */}
            <div className="space-y-1">
              <label className="text-[13px] font-medium text-[#0f172a] block">
                Deliverables / Format
              </label>
              <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                  <Tag className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={deliverables}
                  onChange={(e) => setDeliverables(e.target.value)}
                  placeholder="e.g. 1x Dedicated Reel, 2x Stories with Link"
                  className="flex-1 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                />
              </div>
            </div>

            {/* Campaign Details / Message */}
            <div className="space-y-1">
              <label className="text-[13px] font-medium text-[#0f172a] block">
                Campaign Brief &amp; Notes
              </label>
              <div className="flex items-start rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] pt-2.5 self-start">
                  <FileText className="h-4 w-4" />
                </span>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share project goals, product details, or specific campaign requirements..."
                  className="flex-1 p-3 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none resize-y min-h-[75px]"
                />
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="px-4 sm:px-5 py-3 flex items-center justify-between">
            <button
              type="button"
              onClick={handleClose}
              className="h-9 px-4 rounded-[5px] border border-[#e2e8f0] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#7A2253] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-9 inline-flex items-center gap-1.5 rounded-[5px] bg-[#7A2253] hover:bg-brand-hover px-4.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 cursor-pointer shadow-xs hover:shadow-sm disabled:opacity-50"
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
