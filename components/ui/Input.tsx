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
          <label htmlFor={inputId} className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#64748B]">
            {label}
          </label>
        )}
        <div
          className={`flex h-11 items-center rounded-xl border px-3.5 transition-colors focus-within:border-[#803D63] focus-within:ring-1 focus-within:ring-[#803D63] ${
            rest.disabled ? "bg-slate-100 cursor-not-allowed text-slate-400 border-slate-200" : "bg-white"
          } ${error ? "border-red-400 bg-red-50/10" : "border-slate-200"}`}
        >
          {leftIcon && <span className="mr-2 shrink-0 text-slate-400">{leftIcon}</span>}
          {prefix && (
            <span className="mr-1 shrink-0 text-xs sm:text-sm font-bold text-slate-400 select-none">
              <span className="hidden sm:inline">{prefix}</span>
              <span className="sm:hidden">{prefix.includes("inflixo.com") ? "@" : prefix}</span>
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`h-full w-full min-w-0 flex-1 bg-transparent text-xs sm:text-sm font-bold text-[#0F172A] outline-none placeholder:text-slate-400 placeholder:font-normal ${className}`}
            {...rest}
          />
          {rightSlot && <div className="ml-1.5 shrink-0">{rightSlot}</div>}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs font-semibold text-red-500">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs font-medium text-[#64748B]">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
