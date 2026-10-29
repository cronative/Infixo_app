"use client";

import { useState, useId } from "react";
import { X, Flag, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export interface ReportProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorUsername?: string;
  creatorDisplayName?: string;
}

const REPORT_REASONS = [
  { id: "spam", label: "Spam, scam, or fraudulent links" },
  { id: "inappropriate", label: "Inappropriate, explicit, or adult content" },
  { id: "impersonation", label: "Impersonation of another person or brand" },
  { id: "harassment", label: "Hate speech, harassment, or bullying" },
  { id: "copyright", label: "Copyright or intellectual property infringement" },
  { id: "illegal", label: "Selling prohibited or regulated goods" },
  { id: "other", label: "Other violation of Community Guidelines" },
];

export function ReportProfileModal({
  isOpen,
  onClose,
  creatorUsername = "creator",
  creatorDisplayName,
}: ReportProfileModalProps) {
  const formId = useId();
  const [selectedReason, setSelectedReason] = useState<string>("spam");
  const [details, setDetails] = useState<string>("");
  const [reporterEmail, setReporterEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const cleanHandle = creatorUsername.replace(/^@/, "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/public/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorUsername: cleanHandle,
          reason: selectedReason,
          details: details.trim(),
          reporterEmail: reporterEmail.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to submit report");
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err?.message || "Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setIsSuccess(false);
    setErrorMessage(null);
    setDetails("");
    setReporterEmail("");
    setSelectedReason("spam");
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${formId}-title`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-left select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-[10px] border border-[#E7E3DC] bg-white p-5 sm:p-6 shadow-2xl text-[#181716] animate-scale-in">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close report dialog"
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-[5px] text-[#71717A] hover:bg-black/5 hover:text-[#18181B] transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {isSuccess ? (
          <div className="py-4 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-4 ring-emerald-50/60">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 id={`${formId}-title`} className="text-lg font-bold text-[#18181B]">
              Report Submitted
            </h3>
            <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed max-w-sm mx-auto">
              Thank you for helping keep Inflixo safe. Our Trust &amp; Safety team will review this profile against our Community Guidelines.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="w-full inline-flex items-center justify-center h-10 px-4 rounded-[5px] bg-[#7A2253] text-white text-xs font-bold hover:opacity-95 transition-all cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3 pr-8">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-[#7A2253]/10 text-[#7A2253]">
                <Flag className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <h3 id={`${formId}-title`} className="text-base sm:text-lg font-bold text-[#18181B] leading-tight">
                  Report this profile
                </h3>
                <p className="text-xs text-[#71717A] mt-0.5 truncate">
                  Tell us what is wrong with @{cleanHandle}
                  {creatorDisplayName ? ` (${creatorDisplayName})` : ""}
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2 p-3 rounded-[6px] bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Reasons List */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#18181B]">
                Reason for report <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {REPORT_REASONS.map((r) => {
                  const isChecked = selectedReason === r.id;
                  return (
                    <label
                      key={r.id}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-[5px] border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? "border-[#7A2253] bg-[#7A2253]/5 font-semibold text-[#7A2253]"
                          : "border-[#ECECF0] hover:bg-[#FAFAFB] text-[#27272A]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={r.id}
                        checked={isChecked}
                        onChange={() => setSelectedReason(r.id)}
                        className="accent-[#7A2253] h-3.5 w-3.5 cursor-pointer"
                      />
                      <span>{r.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Optional Details */}
            <div className="space-y-1">
              <label htmlFor={`${formId}-details`} className="block text-xs font-semibold text-[#18181B]">
                Additional details <span className="text-[#A1A1AA] font-normal">(optional)</span>
              </label>
              <textarea
                id={`${formId}-details`}
                rows={2}
                maxLength={1000}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide any links or context to help our review..."
                className="w-full rounded-[5px] border border-[#ECECF0] bg-[#FAFAFB] px-3 py-2 text-xs text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#7A2253] focus:bg-white focus:outline-hidden resize-none transition-colors"
              />
            </div>

            {/* Optional Email */}
            <div className="space-y-1">
              <label htmlFor={`${formId}-email`} className="block text-xs font-semibold text-[#18181B]">
                Your email <span className="text-[#A1A1AA] font-normal">(optional, for updates)</span>
              </label>
              <input
                id={`${formId}-email`}
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-[5px] border border-[#ECECF0] bg-[#FAFAFB] px-3 py-2 text-xs text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#7A2253] focus:bg-white focus:outline-hidden transition-colors"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ECECF0]">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-[5px] border border-[#ECECF0] bg-white text-xs font-semibold text-[#71717A] hover:bg-[#FAFAFB] hover:text-[#18181B] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[5px] bg-[#7A2253] text-white text-xs font-bold hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Submit Report</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
