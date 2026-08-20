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
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-inflixo-navy">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          value={value}
          maxLength={maxLength}
          className={`w-full resize-none rounded-xl border bg-white px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#0F172A] outline-none transition-colors placeholder:text-slate-400 placeholder:font-normal focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] ${
            error ? "border-red-400 bg-red-50/10" : "border-[#E5E7EB]"
          } ${className}`}
          {...rest}
        />
        <div className="mt-1.5 flex items-center justify-between">
          {error ? (
            <p className="text-xs font-medium text-rose-500">{error}</p>
          ) : hint ? (
            <p className="text-xs text-muted">{hint}</p>
          ) : (
            <span />
          )}
          {maxLength && (
            <span className="text-xs text-muted">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
