"use client";

import { X, Sparkles, AlertCircle, Bell, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/contexts/ToastContext";

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

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#803D63]/10 text-[#803D63] shadow-2xs">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-purple-800">
              Early Access Limit Reached
            </span>
            <h3 className="font-display text-lg font-black text-slate-900 mt-1">
              {isSeries
                ? "3 Series Limit Reached"
                : isEpisode
                ? "15 Total Episodes Limit Reached"
                : "1 Collab Gig Limit Reached"}
            </h3>
          </div>
        </div>

        {/* Description Body */}
        <p className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
          {isSeries
            ? "Creator Early Access includes up to 3 Series. Upgrade to Creator Pro or VIP for Unlimited Series & Episodes!"
            : isEpisode
            ? `Creator Early Access includes up to 15 Total Episodes across all series. Upgrade to Creator Pro or VIP for Unlimited Episodes!`
            : "Creator Early Access includes 1 Active Collab Gig package. Upgrade to Creator VIP for Unlimited Collab Gigs & Rate Cards!"}
        </p>

        {/* Upgrade Plan Cards Preview */}
        <div className="mt-5 rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50/80 via-indigo-50/40 to-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-black text-purple-950">
              {isGig ? "Creator VIP Plan" : "Creator Pro Plan"}
            </span>
            <span className="rounded-full bg-[#803D63] px-2.5 py-0.5 text-[10px] font-black text-white shadow-2xs">
              RECOMMENDED
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {isGig ? "₹299" : "₹199"}
            </span>
            <span className="text-xs font-bold text-slate-500">/ month</span>
            <span className="text-xs font-extrabold text-purple-700 ml-1">
              {isGig ? "or ₹2,999 / year" : "or ₹1,999 / year"}
            </span>
          </div>

          <ul className="space-y-1.5 text-xs font-bold text-slate-700">
            <li className="flex items-center gap-1.5 text-emerald-700">
              <Check className="h-3.5 w-3.5 stroke-[3]" />
              <span>{isGig ? "Unlimited Collab Gigs & Media Kit" : "Unlimited Series & Episodes ♾️"}</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 stroke-[3] text-purple-600" /> Remove Inflixo Footer Branding
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 stroke-[3] text-purple-600" /> Priority Support &amp; Creator Analytics
            </li>
          </ul>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={handleNotifyMe}
            disabled={notified}
            className="tap-scale flex w-full sm:flex-1 items-center justify-center gap-2 rounded-2xl bg-[#803D63] hover:bg-[#6D3254] px-4 py-3 text-xs font-black text-white shadow-md transition-all cursor-pointer"
          >
            <Bell className="h-3.5 w-3.5" />
            {notified ? "We'll Notify You! ✓" : "Notify Me When Plans Launch"}
          </button>

          <button
            onClick={onClose}
            className="tap-scale flex w-full sm:w-auto items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-xs font-extrabold text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
