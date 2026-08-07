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
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-inflixo-navy">
            {label}
          </label>
        )}
        <div
          className={`flex h-12 items-center rounded-2xl border px-4 shadow-[0_1px_2px_rgba(23,20,31,0.03)] transition-all focus-within:border-inflixo-purple focus-within:shadow-[0_0_0_4px_rgba(109,40,217,0.10)] ${
            rest.disabled ? "bg-slate-100/90 cursor-not-allowed text-slate-500 border-slate-200" : "bg-white"
          } ${error ? "border-rose-400" : "border-inflixo-border"}`}
        >
          {leftIcon && <span className="mr-2 shrink-0 text-muted">{leftIcon}</span>}
          {prefix && <span className="mr-1 shrink-0 text-sm text-muted">{prefix}</span>}
          <input
            ref={ref}
            id={inputId}
            className={`h-full w-full bg-transparent text-[15px] text-inflixo-navy outline-none placeholder:text-muted/70 ${className}`}
            {...rest}
          />
          {rightSlot}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs font-medium text-rose-500">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-muted">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
