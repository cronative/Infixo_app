"use client";

import { InputHTMLAttributes, ReactNode, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  prefix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightSlot, prefix, className = "", id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <div className="w-full text-left">
        {label && (
          <label htmlFor={inputId} className="mb-1 block text-xs font-semibold text-[#334155]">
            {label}
          </label>
        )}
        <div
          className={`flex h-10 items-center rounded-xl border px-3.5 transition-colors focus-within:border-[#3a2447] focus-within:ring-2 focus-within:ring-[#3a2447]/10 ${rest.disabled ? "bg-[#f8fafc] cursor-not-allowed text-[#94a3b8] border-[#e2e8f0]" : "bg-[#ffffff]"
            } ${error ? "border-[#ef4444] bg-rose-50/20" : "border-[#cbd5e1]"}`}
        >
          {leftIcon && <span className="mr-2 shrink-0 text-[#64748b]">{leftIcon}</span>}
          {prefix && (
            <span className="mr-1 shrink-0 text-xs sm:text-sm font-semibold text-[#64748b] select-none">
              <span className="hidden sm:inline">{prefix}</span>
              <span className="sm:hidden">{prefix.includes("inflixo.com") ? "@" : prefix}</span>
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`h-full w-full min-w-0 flex-1 bg-transparent text-xs sm:text-sm font-semibold text-[#3a2447] outline-none placeholder:text-[#94a3b8] placeholder:font-normal ${className}`}
            {...rest}
          />
          {rightSlot && <div className="ml-1.5 shrink-0">{rightSlot}</div>}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs font-semibold text-[#ef4444]">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs font-medium text-[#64748b]">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
