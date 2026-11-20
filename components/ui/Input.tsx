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
          className={`flex h-10 items-center rounded-[5px] border overflow-hidden transition-colors focus-within:border-[#C21B5C] focus-within:ring-2 focus-within:ring-[#C21B5C]/10 ${
            rest.disabled ? "bg-[#FAFAFB] cursor-not-allowed text-[#6B6B76] border-[#ECECF0]" : "bg-white"
          } ${error ? "border-[#C2414B] bg-rose-50/20 focus-within:border-[#C2414B]" : "border-[#ECECF0]"}`}
        >
          {leftIcon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#ECECF0] bg-[#FAFAFB] text-[#6B6B76]">
              {leftIcon}
            </span>
          )}
          {prefix && (
            <span className="pl-3 pr-1 shrink-0 text-xs sm:text-sm font-semibold text-[#A1A1AA] select-none">
              <span className="hidden sm:inline">{prefix}</span>
              <span className="sm:hidden">{prefix.includes("inflixo.com") ? "@" : prefix}</span>
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`h-full w-full min-w-0 flex-1 bg-transparent px-3 text-xs sm:text-sm font-medium text-[#18181B] outline-none placeholder:text-[#6B6B76]/50 placeholder:font-normal ${className}`}
            {...rest}
          />
          {rightSlot && <div className="pr-3 shrink-0">{rightSlot}</div>}
        </div>
        {error ? (
          <p className="mt-1 text-xs font-semibold text-[#C2414B]">{error}</p>
        ) : hint ? (
          <p className="mt-1 text-xs font-medium text-[#6B6B76]">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
