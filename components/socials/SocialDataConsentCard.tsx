"use client";

import { ShieldCheck, Lock, Check } from "lucide-react";

interface SocialDataConsentCardProps {
  accepted: boolean;
  onToggle: (accepted: boolean) => void;
  error?: boolean;
  disabled?: boolean;
  variant?: "card" | "one-line";
}

export function SocialDataConsentCard({
  accepted,
  onToggle,
  error = false,
  disabled = false,
  variant = "card",
}: SocialDataConsentCardProps) {
  if (variant === "one-line") {
    return (
      <div
        className={`rounded-xl border p-4 transition-colors text-left flex items-center gap-3 ${
          error
            ? "border-rose-300 bg-rose-50"
            : disabled || accepted
            ? "border-indigo-100 bg-indigo-50/60"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        {/* Custom Interactive / Read-Only Checkbox */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onToggle(!accepted)}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
            disabled || accepted
              ? "border-[#803D63] bg-[#803D63] text-white cursor-default"
              : error
              ? "border-rose-400 bg-white"
              : "border-slate-300 bg-white hover:border-[#803D63]"
          }`}
        >
          {(accepted || disabled) && <Check className="h-3.5 w-3.5" />}
        </button>

        <div className="flex-1 flex flex-wrap items-center justify-between gap-2 min-w-0">
          <label
            onClick={() => !disabled && onToggle(!accepted)}
            className={`text-xs sm:text-sm font-bold text-slate-900 leading-snug select-none ${
              disabled ? "cursor-default" : "cursor-pointer"
            }`}
          >
            I authorize Inflixo to fetch public stats (followers, subscribers &amp; metadata) for my social accounts.
          </label>

          <div className="flex items-center gap-2 text-[11px] font-medium shrink-0">
            {disabled ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                Authorized
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                100% Public Data
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 transition-colors text-left ${
        error ? "border-rose-300 bg-rose-50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Custom Interactive / Read-Only Checkbox */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onToggle(!accepted)}
          className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition-colors ${
            disabled || accepted
              ? "border-[#803D63] bg-[#803D63] text-white cursor-default"
              : error
              ? "border-rose-400 bg-white"
              : "border-slate-300 bg-white hover:border-[#803D63]"
          }`}
        >
          {(accepted || disabled) && <Check className="h-3 w-3 stroke-[3]" />}
        </button>

        <div className="space-y-1.5 min-w-0 flex-1">
          <label
            onClick={() => !disabled && onToggle(!accepted)}
            className={`text-xs font-bold text-slate-900 leading-snug block select-none ${
              disabled ? "cursor-default" : "cursor-pointer"
            }`}
          >
            I authorize Inflixo to fetch public profile stats (followers, subscribers &amp; metadata) for my social accounts.
          </label>

          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {disabled
              ? "Authorization is active and locked while social accounts are connected to your profile."
              : "By checking this box, you confirm that you own or manage these social handles and grant permission to aggregate public numbers for your live Inflixo creator page."}
          </p>

          <div className="pt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-700">
            {disabled && (
              <span className="bg-gray-100 text-gray-700 border border-gray-200 text-xs font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                Authorization Active
              </span>
            )}
            <span className="bg-gray-100 text-gray-700 border border-gray-200 text-xs font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-indigo-600 shrink-0" />
              100% Public Data Only
            </span>
            <span className="bg-gray-100 text-gray-700 border border-gray-200 text-xs font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <Lock className="h-3 w-3 text-indigo-600 shrink-0" />
              No Passwords Required
            </span>
          </div>

          {error && !disabled && (
            <p className="text-xs font-bold text-rose-600 pt-0.5">
              Please check the authorization box to link your social accounts 💡
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
