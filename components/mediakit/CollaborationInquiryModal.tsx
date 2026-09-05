"use client";

import { useState } from "react";
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
}

export function CollaborationInquiryModal({
  isOpen,
  onClose,
  creatorId,
  creatorEmail,
  creatorName,
  creatorUsername,
  packages = [],
}: CollaborationInquiryModalProps) {
  const { showToast } = useToast();

  const [brandName, setBrandName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [budgetRange, setBudgetRange] = useState("₹25,000 – ₹50,000");
  const [timeline, setTimeline] = useState("Within 2–4 weeks");
  const [deliverables, setDeliverables] = useState(
    packages.length > 0 ? packages[0].title : "Sponsored Video / Reel"
  );
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
      icon={<Briefcase className="h-4 w-4 text-[#803D63]" />}
    >
      {isSuccess ? (
        <div className="p-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="font-display text-base font-bold text-[#17131A]">
            Inquiry Sent to @{creatorUsername} 🎉
          </h3>
          <p className="text-xs text-[#6F6872] max-w-sm mx-auto leading-relaxed">
            Thank you! Your brand collaboration details have been delivered to {creatorName}’s creator inbox.
          </p>
          <div className="pt-3">
            <button
              type="button"
              onClick={handleClose}
              className="bg-[#803D63] hover:bg-[#6D3254] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="text-left">
          <ModalBody className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Brand & Contact Person */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#17131A] uppercase tracking-wider block">
                  Brand / Company Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6F6872]" />
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] pl-8 pr-3 py-2 text-xs font-semibold text-[#17131A] placeholder:text-[#6F6872]/60 focus:bg-white focus:border-[#803D63] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#17131A] uppercase tracking-wider block">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] px-3 py-2 text-xs font-semibold text-[#17131A] placeholder:text-[#6F6872]/60 focus:bg-white focus:border-[#803D63] focus:outline-none"
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#17131A] uppercase tracking-wider block">
                  Business Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6F6872]" />
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="sarah@acme.com"
                    className="w-full rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] pl-8 pr-3 py-2 text-xs font-semibold text-[#17131A] placeholder:text-[#6F6872]/60 focus:bg-white focus:border-[#803D63] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#17131A] uppercase tracking-wider block">
                  Phone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6F6872]" />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] pl-8 pr-3 py-2 text-xs font-semibold text-[#17131A] placeholder:text-[#6F6872]/60 focus:bg-white focus:border-[#803D63] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Budget & Timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#17131A] uppercase tracking-wider block">
                  Estimated Budget
                </label>
                <select
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className="w-full rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] px-3 py-2 text-xs font-semibold text-[#17131A] focus:bg-white focus:border-[#803D63] focus:outline-none"
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
                <label className="text-[11px] font-bold text-[#17131A] uppercase tracking-wider block">
                  Campaign Timeline
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6F6872]" />
                  <input
                    type="text"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="e.g. Next month / Q3"
                    className="w-full rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] pl-8 pr-3 py-2 text-xs font-semibold text-[#17131A] placeholder:text-[#6F6872]/60 focus:bg-white focus:border-[#803D63] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Preferred Deliverables */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#17131A] uppercase tracking-wider block">
                Deliverables / Format
              </label>
              <input
                type="text"
                value={deliverables}
                onChange={(e) => setDeliverables(e.target.value)}
                placeholder="e.g. 1x Dedicated Reel, 2x Stories with Link"
                className="w-full rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] px-3 py-2 text-xs font-semibold text-[#17131A] placeholder:text-[#6F6872]/60 focus:bg-white focus:border-[#803D63] focus:outline-none"
              />
            </div>

            {/* Campaign Details / Message */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#17131A] uppercase tracking-wider block">
                Campaign Brief &amp; Notes
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share project goals, product details, or specific campaign requirements..."
                className="w-full rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] p-3 text-xs font-semibold text-[#17131A] placeholder:text-[#6F6872]/60 focus:bg-white focus:border-[#803D63] focus:outline-none resize-none"
              />
            </div>
          </ModalBody>

          <ModalFooter className="p-4 sm:p-5 flex items-center justify-between">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 text-xs font-semibold text-[#6F6872] hover:text-[#17131A] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
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
