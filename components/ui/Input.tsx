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
          <label htmlFor={inputId} className="mb-1.5 block text-xs font-bold text-[#52525B]">
            {label}
          </label>
        )}
        <div
          className={`flex h-10 items-center rounded-[5px] border overflow-hidden transition-colors focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 ${
            rest.disabled ? "bg-[#f8fafc] cursor-not-allowed text-[#64748b] border-[#e2e8f0]" : "bg-white"
          } ${error ? "border-[#C2414B] bg-rose-50/20 focus-within:border-[#C2414B]" : "border-[#e2e8f0]"}`}
        >
          {leftIcon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
              {leftIcon}
            </span>
          )}
          {prefix && (
            <span className="pl-3 pr-1 shrink-0 text-xs sm:text-sm font-semibold text-[#94a3b8] select-none">
              <span className="hidden sm:inline">{prefix}</span>
              <span className="sm:hidden">{prefix.includes("inflixo.com") ? "@" : prefix}</span>
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`h-full w-full min-w-0 flex-1 bg-transparent px-3 text-xs sm:text-sm font-medium text-[#0f172a] outline-none placeholder:text-[#64748b]/50 placeholder:font-normal ${className}`}
            {...rest}
          />
          {rightSlot && <div className="pr-3 shrink-0">{rightSlot}</div>}
        </div>
        {error ? (
          <p className="mt-1 text-xs font-semibold text-[#C2414B]">{error}</p>
        ) : hint ? (
          <p className="mt-1 text-xs font-medium text-[#64748b]">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
