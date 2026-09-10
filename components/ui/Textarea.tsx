"use client";

import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  maxLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, maxLength, className = "", id, value, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    const currentLength = typeof value === "string" ? value.length : 0;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#334155]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          value={value}
          maxLength={maxLength}
          className={`w-full resize-none rounded-xl border bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#3a2447] outline-none transition-colors placeholder:text-[#94a3b8] placeholder:font-normal border-[#cbd5e1] focus:border-[#3a2447] focus:ring-2 focus:ring-[#3a2447]/10 ${error ? "border-[#ef4444] bg-rose-50/20" : "border-[#cbd5e1]"
            } ${className}`}
          {...rest}
        />
        <div className="mt-1.5 flex items-center justify-between">
          {error ? (
            <p className="text-xs font-semibold text-[#ef4444]">{error}</p>
          ) : hint ? (
            <p className="text-xs text-[#64748b]">{hint}</p>
          ) : (
            <span />
          )}
          {maxLength && (
            <span className="text-xs text-[#94a3b8]">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
