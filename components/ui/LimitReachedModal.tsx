"use client";

import { X, Sparkles, AlertCircle, Bell, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/contexts/ToastContext";

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "series" | "episode";
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
    showToast("We'll notify you as soon as Creator Plan goes live! 🚀");
    setTimeout(() => {
      onClose();
      setNotified(false);
    }, 1500);
  }

  const isSeries = type === "series";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 shadow-2xs">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-purple-700">
              Early Access Limit
            </span>
            <h3 className="font-display text-lg font-black text-slate-900 mt-1">
              {isSeries
                ? "You've reached your Early Access Series limit"
                : `You've reached 5 episodes for ${seriesTitle ? `"${seriesTitle}"` : "this Series"}`}
            </h3>
          </div>
        </div>

        {/* Description Body */}
        <p className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
          {isSeries
            ? "Early Access includes up to 3 Series. Unlimited Series will be available with the Inflixo Creator Plan."
            : "Early Access supports up to 5 episodes per Series. Unlimited episodes are coming with the Inflixo Creator Plan."}
        </p>

        {/* Coming Soon Creator Plan Card Preview */}
        <div className="mt-5 rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50/80 via-indigo-50/40 to-white p-4">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-black text-purple-950">
              Inflixo Creator Plan
            </span>
            <span className="rounded-full bg-purple-600 px-2.5 py-0.5 text-[10px] font-black text-white shadow-2xs">
              COMING SOON
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900">₹199</span>
            <span className="text-xs font-bold text-slate-500">/ month</span>
            <span className="text-xs font-extrabold text-purple-700 ml-1">
              or ₹1,999 / year — Save ₹389
            </span>
          </div>

          <ul className="mt-3 space-y-1.5 text-xs font-bold text-slate-700">
            <li className="flex items-center gap-1.5 text-emerald-700">
              <Check className="h-3.5 w-3.5 stroke-[3]" /> Unlimited Series &amp; Episodes
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 stroke-[3] text-purple-600" /> Instagram, YouTube &amp; Facebook Stats
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 stroke-[3] text-purple-600" /> All Themes + QR Code Sharing
            </li>
          </ul>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={handleNotifyMe}
            disabled={notified}
            className="tap-scale flex w-full sm:flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-xs font-black text-white shadow-md hover:shadow-lg transition-all"
          >
            <Bell className="h-3.5 w-3.5" />
            {notified ? "We'll Notify You! ✓" : "Notify Me When Plans Go Live"}
          </button>

          <button
            onClick={onClose}
            className="tap-scale flex w-full sm:w-auto items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-xs font-extrabold text-slate-700 hover:bg-slate-200 transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
