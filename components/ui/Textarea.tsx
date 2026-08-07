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
          className={`w-full resize-none rounded-2xl border bg-white px-4 py-3 text-[15px] text-inflixo-navy shadow-[0_1px_2px_rgba(23,20,31,0.03)] outline-none transition-all placeholder:text-muted/70 focus:border-inflixo-purple focus:shadow-[0_0_0_4px_rgba(109,40,217,0.10)] ${
            error ? "border-rose-400" : "border-inflixo-border"
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
