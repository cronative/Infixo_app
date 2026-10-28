"use client";

import { forwardRef, InputHTMLAttributes, ReactNode } from "react";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  helperText?: string;
  error?: string;
  prefixText?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      leftIcon,
      rightSlot,
      helperText,
      error,
      prefixText,
      id,
      className = "",
      disabled,
      ...rest
    },
    ref
  ) => {
    const inputId = id || rest.name;

    return (
      <div className="w-full text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-xs font-bold text-[#52525B]"
          >
            {label}
          </label>
        )}

        <div
          className={`group flex h-11 items-center rounded-[5px] border bg-white px-3.5 transition-all duration-150 focus-within:ring-2 ${
            error
              ? "border-[#DC2626] focus-within:border-[#DC2626] focus-within:ring-[#DC2626]/15 bg-rose-50/20"
              : "border-[#E4E4E7] focus-within:border-[#7A2253] focus-within:ring-[#7A2253]/15"
          } ${disabled ? "opacity-60 cursor-not-allowed bg-zinc-50" : ""}`}
        >
          {leftIcon && (
            <span
              className={`mr-2.5 flex shrink-0 items-center justify-center transition-colors ${
                error
                  ? "text-[#DC2626]"
                  : "text-[#71717A] group-focus-within:text-[#7A2253]"
              }`}
            >
              {leftIcon}
            </span>
          )}

          {prefixText && (
            <span className="mr-1 text-sm font-semibold text-[#52525B] select-none">
              {prefixText}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`h-full w-full min-w-0 flex-1 bg-transparent text-sm font-medium text-[#18181B] outline-none placeholder:text-[#71717A] placeholder:font-normal disabled:cursor-not-allowed ${className}`}
            {...rest}
          />

          {rightSlot && <div className="ml-2 shrink-0">{rightSlot}</div>}
        </div>

        {error ? (
          <p
            role="alert"
            aria-live="assertive"
            className="mt-1.5 text-xs font-semibold text-[#DC2626]"
          >
            {error}
          </p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs font-medium text-[#52525B]">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

TextField.displayName = "TextField";
