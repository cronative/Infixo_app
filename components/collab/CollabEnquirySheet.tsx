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
  { value: "", label: "Select approx. budget" },
  { value: "<₹10K", label: "< ₹10,000" },
  { value: "₹10–25K", label: "₹10,000 – ₹25,000" },
  { value: "₹25–50K", label: "₹25,000 – ₹50,000" },
  { value: "₹50K–1L", label: "₹50,000 – ₹1,00,000" },
  { value: "₹1L+", label: "₹1,00,000+" },
];

const TIMELINE_OPTIONS = [
  { value: "", label: "When should it go live?" },
  { value: "ASAP", label: "As soon as possible" },
  { value: "Within 2 weeks", label: "Within 2 weeks" },
  { value: "This month", label: "This month" },
  { value: "In 1–3 months", label: "In 1–3 months" },
  { value: "Flexible", label: "Flexible" },
];

const inputClass = (error?: string) =>
  `w-full h-10 px-3 rounded-[5px] border bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 outline-none transition-colors ${
    error ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-400" : "border-zinc-200 dark:border-zinc-700 focus:border-zinc-400"
  }`;

const packageOptionLabel = (pkg: MediaKitPackage) => {
  if (pkg.details?.priceVisibility === "quote") return pkg.title;
  const raw = String(pkg.price || "").trim().replace(/^₹\s*/, "");
  if (!raw) return pkg.title;
  const price = /^\d+$/.test(raw) ? `₹${Number(raw).toLocaleString("en-IN")}` : `₹${raw}`;
  return `${pkg.title} (${price})`;
};

/** One labelled field per row; optional fields say so in the label. */
function Field({ label, required, error, hint, children }: { label: string; required?: boolean; error?: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
          {label} {required ? <span className="text-rose-500">*</span> : <span className="font-normal text-zinc-400">(optional)</span>}
        </label>
        {hint}
      </div>
      {children}
      {error && <p className="text-[11px] font-medium text-rose-500">{error}</p>}
    </div>
  );
}

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
  // Form State
  const [brandName, setBrandName] = useState("");
  const [contactName, setContactName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedPkgId, setSelectedPkgId] = useState<string>("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [campaignLocation, setCampaignLocation] = useState("");
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
        setSelectedPkgId(String(preselectedPackage.id));
      } else {
        setSelectedPkgId("");
      }
      setErrors({});
      setApiErrorMsg(null);
      setIsSuccess(false);
    }
  }, [isOpen, preselectedPackage]);

  // Escape closes the sheet, like the backdrop and the ✕ button.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handlePackageChange = (val: string) => {
    setSelectedPkgId(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiErrorMsg(null);

    const activePkg = packages.find((p) => String(p.id) === String(selectedPkgId));
    let packageName = "Collaboration";
    if (selectedPkgId === "custom") {
      packageName = "Custom collab";
    } else if (activePkg?.title) {
      packageName = activePkg.title;
    } else if (preselectedPackage && String(preselectedPackage.id) === String(selectedPkgId)) {
      packageName = preselectedPackage.title;
    }

    const payload: CollabEnquiryInput = {
      creatorId,
      brandName: brandName.trim(),
      contactName: contactName.trim(),
      workEmail: workEmail.trim(),
      phone: phone.trim() || undefined,
      packageId: selectedPkgId === "custom" ? "custom" : selectedPkgId,
      packageName: selectedPkgId ? packageName : "",
      budget: budget || undefined,
      timeline: timeline || undefined,
      campaignLocation: campaignLocation.trim() || undefined,
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
    setTimeline("");
    setCampaignLocation("");
    setIsSuccess(false);
    onClose();
  };

  // WhatsApp & Mailto Links
  const resolvedWhatsapp = settings?.whatsappNumber?.trim() || creatorWhatsapp.trim();
  const cleanPhone = resolvedWhatsapp.replace(/[^0-9]/g, "");
  const showWhatsapp = settings?.allowWhatsapp !== false && Boolean(cleanPhone);
  const waPrefill = encodeURIComponent(`Hi ${creatorDisplayName}, I'm reaching out regarding a brand collaboration.`);
  const waUrl = `https://wa.me/${cleanPhone}?text=${waPrefill}`;

  const resolvedEmail = settings?.sponsorEmail?.trim() || creatorEmail.trim();
  const showEmail = settings?.allowEmail !== false && Boolean(resolvedEmail);
  const mailSubject = encodeURIComponent(`Collab request – ${brandName.trim() || "Brand"}`);
  const mailtoUrl = `mailto:${resolvedEmail}?subject=${mailSubject}`;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center py-4 animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Sheet / Modal Container */}
      <div role="dialog" aria-modal="true" aria-label={`Collab request to ${creatorDisplayName}`} className="relative w-[min(450px,calc(100vw-30px))] max-h-[calc(100dvh-32px)] flex flex-col rounded-[5px] bg-white dark:bg-[#1E1E24] shadow-2xl overflow-hidden z-10 transition-all text-left">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Collab request to {creatorDisplayName}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Fill out this quick brief to get rates and availability.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto flex-1 text-left space-y-4">
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
                  {creatorDisplayName || "The creator"} will reply soon.
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleDone}
                  style={{ backgroundColor: brandPrimary }}
                  className="w-full h-10 rounded-[5px] text-white font-semibold text-xs sm:text-sm shadow-xs hover:opacity-95 transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Enquiry Form */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {apiErrorMsg && (
                <div className="rounded-[5px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-3 text-xs text-rose-700 dark:text-rose-300">
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

              <Field label="Brand / company name" required error={errors.brandName}>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={brandName}
                  onChange={(e) => {
                    setBrandName(e.target.value);
                    if (errors.brandName) setErrors({ ...errors, brandName: "" });
                  }}
                  placeholder="e.g. Acme Health or Spotify"
                  className={inputClass(errors.brandName)}
                />
              </Field>

              <Field label="Your name" required error={errors.contactName}>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={contactName}
                  onChange={(e) => {
                    setContactName(e.target.value);
                    if (errors.contactName) setErrors({ ...errors, contactName: "" });
                  }}
                  placeholder="e.g. Sarah Jenkins"
                  className={inputClass(errors.contactName)}
                />
              </Field>

              <Field label="Work email" required error={errors.workEmail}>
                <input
                  type="email"
                  required
                  maxLength={255}
                  value={workEmail}
                  onChange={(e) => {
                    setWorkEmail(e.target.value);
                    if (errors.workEmail) setErrors({ ...errors, workEmail: "" });
                  }}
                  placeholder="name@company.com"
                  className={inputClass(errors.workEmail)}
                />
              </Field>

              <Field label="Phone / WhatsApp">
                <input type="tel" maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className={inputClass()} />
              </Field>

              <Field label="Interested package" required error={errors.packageId}>
                <select
                  required
                  value={selectedPkgId}
                  onChange={(e) => {
                    handlePackageChange(e.target.value);
                    if (errors.packageId) setErrors({ ...errors, packageId: "" });
                  }}
                  className={`${inputClass(errors.packageId)} cursor-pointer ${selectedPkgId ? "" : "text-zinc-400"}`}
                >
                  <option value="" disabled>Select a package</option>
                  {preselectedPackage && !packages.some((p) => String(p.id) === String(preselectedPackage.id)) && (
                    <option value={String(preselectedPackage.id)}>{packageOptionLabel(preselectedPackage)}</option>
                  )}
                  {packages
                    .filter((p) => p.isActive !== false && !p.isDraft)
                    .map((pkg) => (
                      <option key={pkg.id} value={String(pkg.id)}>
                        {packageOptionLabel(pkg)}
                      </option>
                    ))}
                  <option value="custom">Custom collab (not listed)</option>
                </select>
              </Field>

              <Field label="Estimated budget">
                <select value={budget} onChange={(e) => setBudget(e.target.value)} className={`${inputClass()} cursor-pointer ${budget ? "" : "text-zinc-400"}`}>
                  {BUDGET_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Campaign timeline">
                <select value={timeline} onChange={(e) => setTimeline(e.target.value)} className={`${inputClass()} cursor-pointer ${timeline ? "" : "text-zinc-400"}`}>
                  {TIMELINE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Website / Instagram">
                <input
                  type="text"
                  maxLength={255}
                  value={websiteOrSocial}
                  onChange={(e) => setWebsiteOrSocial(e.target.value)}
                  placeholder="https://brand.com or @brandhandle"
                  className={inputClass()}
                />
              </Field>

              <Field label="Campaign location">
                <input
                  type="text"
                  maxLength={150}
                  value={campaignLocation}
                  onChange={(e) => setCampaignLocation(e.target.value)}
                  placeholder="e.g. Mumbai, Ahmedabad or Online"
                  className={inputClass()}
                />
              </Field>

              <Field
                label="Campaign brief"
                required
                error={errors.message}
                hint={
                  <span className={`text-[11px] ${message.trim().length < 20 ? "text-zinc-400" : "text-emerald-600 font-medium"}`}>
                    {message.trim().length}/20 chars min
                  </span>
                }
              >
                <textarea
                  rows={3}
                  required
                  maxLength={3000}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (errors.message) setErrors({ ...errors, message: "" });
                  }}
                  placeholder="Goals, key deliverables, product details…"
                  className={`${inputClass(errors.message)} h-auto min-h-[80px] resize-y py-2.5`}
                />
              </Field>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: brandPrimary }}
                  className="w-full h-10 rounded-[5px] text-white font-semibold text-xs sm:text-sm shadow-xs hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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
