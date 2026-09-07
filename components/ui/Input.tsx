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
          <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold text-[#6B5A5D]">
            {label}
          </label>
        )}
        <div
          className={`flex h-11 items-center rounded-[10px] border px-3.5 transition-colors focus-within:border-[#B85C6B] focus-within:ring-3 focus-within:ring-[#F3DDE0] ${rest.disabled ? "bg-[#fbfbfb] cursor-not-allowed text-[#6B5A5D] border-[#E4DAD5]" : "bg-[#FFFFFF]"
            } ${error ? "border-[#C1443A] bg-[#fbfbfb]" : "border-[#E4DAD5]"}`}
        >
          {leftIcon && <span className="mr-2 shrink-0 text-[#6B5A5D]">{leftIcon}</span>}
          {prefix && (
            <span className="mr-1 shrink-0 text-xs sm:text-sm font-semibold text-[#6B5A5D] select-none">
              <span className="hidden sm:inline">{prefix}</span>
              <span className="sm:hidden">{prefix.includes("inflixo.com") ? "@" : prefix}</span>
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`h-full w-full min-w-0 flex-1 bg-transparent text-xs sm:text-sm font-semibold text-[#241618] outline-none placeholder:text-[#6B5A5D]/60 placeholder:font-normal ${className}`}
            {...rest}
          />
          {rightSlot && <div className="ml-1.5 shrink-0">{rightSlot}</div>}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs font-semibold text-rose-500">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs font-medium text-[#797570]">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
