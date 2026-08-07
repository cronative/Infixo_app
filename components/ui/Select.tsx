"use client";

import { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = "", id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-inflixo-navy">
            {label}
          </label>
        )}
        <div
          className={`relative flex h-12 items-center rounded-2xl border bg-white px-4 shadow-[0_1px_2px_rgba(23,20,31,0.03)] transition-all focus-within:border-inflixo-purple focus-within:shadow-[0_0_0_4px_rgba(109,40,217,0.10)] ${
            error ? "border-rose-400" : "border-inflixo-border"
          }`}
        >
          <select
            ref={ref}
            id={inputId}
            className={`h-full w-full appearance-none bg-transparent text-[15px] outline-none ${
              rest.value ? "text-inflixo-navy" : "text-muted/70"
            } ${className}`}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-muted" />
        </div>
        {error && <p className="mt-1.5 text-xs font-medium text-rose-500">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
