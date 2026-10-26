"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, MessageCircle, Mail, Loader2, Sparkles } from "lucide-react";
import { MediaKitPackage, MediaKitSettings } from "@/types";
import { collabEnquirySchema, CollabEnquiryInput } from "@/lib/collabSchema";

interface CollabEnquirySheetProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  creatorDisplayName?: string;
  creatorEmail?: string;
  creatorWhatsapp?: string;
  packages: MediaKitPackage[];
  preselectedPackage?: MediaKitPackage | null;
  settings?: MediaKitSettings;
  brandPrimary?: string;
}

const BUDGET_OPTIONS = [
  { value: "", label: "Select approx. budget (optional)" },
  { value: "<₹10K", label: "< ₹10,000" },
  { value: "₹10–25K", label: "₹10,000 – ₹25,000" },
  { value: "₹25–50K", label: "₹25,000 – ₹50,000" },
  { value: "₹50K+", label: "₹50,000+" },
];

export function CollabEnquirySheet({
  isOpen,
  onClose,
  creatorId,
  creatorDisplayName = "Creator",
  creatorEmail = "",
  creatorWhatsapp = "",
  packages = [],
  preselectedPackage = null,
  settings,
  brandPrimary = "#7A2253",
}: CollabEnquirySheetProps) {
  // Extract creator first name
  const creatorFirstName = creatorDisplayName.trim().split(/\s+/)[0] || "Creator";

  // Form State
  const [brandName, setBrandName] = useState("");
  const [contactName, setContactName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedPkgId, setSelectedPkgId] = useState<string>("custom");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");
  const [websiteOrSocial, setWebsiteOrSocial] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiErrorMsg, setApiErrorMsg] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Sync preselected package when opened
  useEffect(() => {
    if (isOpen) {
      if (preselectedPackage) {
        setSelectedPkgId(preselectedPackage.id);
      } else {
        setSelectedPkgId("custom");
      }
      setErrors({});
      setApiErrorMsg(null);
      setIsSuccess(false);
    }
  }, [isOpen, preselectedPackage]);

  if (!isOpen || !mounted) return null;

  const handlePackageChange = (val: string) => {
    setSelectedPkgId(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiErrorMsg(null);

    const activePkg = packages.find((p) => p.id === selectedPkgId);
    const packageName = selectedPkgId === "custom" ? "Custom collab" : activePkg?.title || "Collaboration";

    const payload: CollabEnquiryInput = {
      creatorId,
      brandName: brandName.trim(),
      contactName: contactName.trim(),
      workEmail: workEmail.trim(),
      phone: phone.trim() || undefined,
      packageId: selectedPkgId === "custom" ? null : selectedPkgId,
      packageName,
      budget: budget || undefined,
      message: message.trim(),
      websiteOrSocial: websiteOrSocial.trim() || undefined,
      hp: honeypot || undefined,
    };

    // Client-side Zod validation
    const validation = collabEnquirySchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field && !fieldErrors[field.toString()]) {
          fieldErrors[field.toString()] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/collab-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || (!data.success && data.status !== 1)) {
        setApiErrorMsg(data.message || data.error || "Failed to submit collab request. Please try again.");
      } else {
        setIsSuccess(true);
      }
    } catch {
      setApiErrorMsg("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    // Reset form
    setBrandName("");
    setContactName("");
    setWorkEmail("");
    setPhone("");
    setMessage("");
    setWebsiteOrSocial("");
    setBudget("");
    setIsSuccess(false);
    onClose();
  };

  // WhatsApp & Mailto Links
  const resolvedWhatsapp = settings?.whatsappNumber?.trim() || creatorWhatsapp.trim();
  const cleanPhone = resolvedWhatsapp.replace(/[^0-9]/g, "");
  const showWhatsapp = settings?.allowWhatsapp !== false && Boolean(cleanPhone);
  const waPrefill = encodeURIComponent(`Hi ${creatorFirstName}, I'm reaching out regarding a brand collaboration.`);
  const waUrl = `https://wa.me/${cleanPhone}?text=${waPrefill}`;

  const resolvedEmail = settings?.sponsorEmail?.trim() || creatorEmail.trim();
  const showEmail = settings?.allowEmail !== false && Boolean(resolvedEmail);
  const mailSubject = encodeURIComponent(`Collab request – ${brandName.trim() || "Brand"}`);
  const mailtoUrl = `mailto:${resolvedEmail}?subject=${mailSubject}`;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Sheet / Modal Container */}
      <div className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#1E1E24] shadow-2xl overflow-hidden z-10 transition-all text-left">
        {/* Mobile Pull Handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="h-1.5 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Collab request to {creatorFirstName}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Fill out this quick brief to get rates and availability.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 text-left space-y-4">
          {isSuccess ? (
            /* Success State */
            <div className="py-8 px-4 text-center space-y-3.5">
              <div
                style={{ backgroundColor: `${brandPrimary}15`, color: brandPrimary }}
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
              >
                <CheckCircle2 className="h-8 w-8 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Request sent!
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 max-w-sm mx-auto leading-relaxed">
                  {creatorFirstName} will reply on email.
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleDone}
                  style={{ backgroundColor: brandPrimary }}
                  className="w-full h-10 rounded-lg text-white font-semibold text-xs sm:text-sm shadow-xs hover:opacity-95 transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Enquiry Form */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {apiErrorMsg && (
                <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-3 text-xs text-rose-700 dark:text-rose-300">
                  {apiErrorMsg}
                </div>
              )}

              {/* Honeypot anti-spam (hidden) */}
              <div style={{ display: "none" }} aria-hidden="true">
                <input
                  type="text"
                  name="hp"
                  tabIndex={-1}
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  autoComplete="off"
                />
              </div>

              {/* Row 1: Brand / Company Name* + Your Name* */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Brand / company name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => {
                      setBrandName(e.target.value);
                      if (errors.brandName) setErrors({ ...errors, brandName: "" });
                    }}
                    placeholder="e.g. Acme Health or Spotify"
                    className={`w-full h-9.5 px-3 rounded-lg border bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 outline-none transition-colors ${
                      errors.brandName
                        ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-400"
                        : "border-zinc-200 dark:border-zinc-700 focus:border-zinc-400"
                    }`}
                  />
                  {errors.brandName && (
                    <p className="text-[11px] text-rose-500 font-medium">{errors.brandName}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Your name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => {
                      setContactName(e.target.value);
                      if (errors.contactName) setErrors({ ...errors, contactName: "" });
                    }}
                    placeholder="e.g. Sarah Jenkins"
                    className={`w-full h-9.5 px-3 rounded-lg border bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 outline-none transition-colors ${
                      errors.contactName
                        ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-400"
                        : "border-zinc-200 dark:border-zinc-700 focus:border-zinc-400"
                    }`}
                  />
                  {errors.contactName && (
                    <p className="text-[11px] text-rose-500 font-medium">{errors.contactName}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Work Email* + Phone / WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Work email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={workEmail}
                    onChange={(e) => {
                      setWorkEmail(e.target.value);
                      if (errors.workEmail) setErrors({ ...errors, workEmail: "" });
                    }}
                    placeholder="name@company.com"
                    className={`w-full h-9.5 px-3 rounded-lg border bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 outline-none transition-colors ${
                      errors.workEmail
                        ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-400"
                        : "border-zinc-200 dark:border-zinc-700 focus:border-zinc-400"
                    }`}
                  />
                  {errors.workEmail && (
                    <p className="text-[11px] text-rose-500 font-medium">{errors.workEmail}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Phone / WhatsApp <span className="text-zinc-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full h-9.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400"
                  />
                </div>
              </div>

              {/* Row 3: Package Select + Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Package
                  </label>
                  <select
                    value={selectedPkgId}
                    onChange={(e) => handlePackageChange(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 cursor-pointer"
                  >
                    <option value="custom">Custom collab</option>
                    {packages
                      .filter((p) => p.isActive)
                      .map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.title} ({pkg.price?.startsWith("₹") ? pkg.price : `₹${pkg.price}`})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Budget <span className="text-zinc-400 font-normal">(optional)</span>
                  </label>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 cursor-pointer"
                  >
                    {BUDGET_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Website / Instagram Handle */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Website / Instagram handle <span className="text-zinc-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={websiteOrSocial}
                  onChange={(e) => setWebsiteOrSocial(e.target.value)}
                  placeholder="https://brand.com or @brandhandle"
                  className="w-full h-9.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400"
                />
              </div>

              {/* Row 5: Message* (min 20 chars) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Message / Campaign brief <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[11px] ${message.length < 20 ? "text-zinc-400" : "text-emerald-600 font-medium"}`}>
                    {message.length}/20 chars min
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (errors.message) setErrors({ ...errors, message: "" });
                  }}
                  placeholder="Tell us what you have in mind: timeline, goals, key deliverables..."
                  className={`w-full p-3 rounded-lg border bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 outline-none transition-colors resize-y min-h-[80px] ${
                    errors.message
                      ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-400"
                      : "border-zinc-200 dark:border-zinc-700 focus:border-zinc-400"
                  }`}
                />
                {errors.message && (
                  <p className="text-[11px] text-rose-500 font-medium">{errors.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: brandPrimary }}
                  className="w-full h-10 rounded-lg text-white font-semibold text-xs sm:text-sm shadow-xs hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending collab request...</span>
                    </>
                  ) : (
                    <span>Send Collab Request</span>
                  )}
                </button>
              </div>

              {/* Secondary contact options */}
              {(showWhatsapp || showEmail) && (
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-center gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {showWhatsapp && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-emerald-600 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Prefer WhatsApp?</span>
                    </a>
                  )}
                  {showWhatsapp && showEmail && <span>·</span>}
                  {showEmail && (
                    <a
                      href={mailtoUrl}
                      className="inline-flex items-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      <Mail className="h-3.5 w-3.5 text-zinc-500" />
                      <span>Email instead</span>
                    </a>
                  )}
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
