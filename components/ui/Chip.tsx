"use client";

import { HTMLAttributes, forwardRef, ReactNode } from "react";

export type ChipVariant = "brand" | "neutral" | "soft" | "outline";

export interface ChipProps extends HTMLAttributes<HTMLDivElement> {
  variant?: ChipVariant;
  icon?: ReactNode;
  children: ReactNode;
}

/**
 * Standard Design System Chip
 * - fully rounded (rounded-full)
 * - min font size 12px (text-xs)
 * - zinc / brand colors
 */
export const Chip = forwardRef<HTMLDivElement, ChipProps>(
  ({ variant = "neutral", icon, className = "", children, ...rest }, ref) => {
    const variantClass = {
      brand: "bg-[#7A2253] text-white shadow-xs",
      soft: "bg-[#fdf2f8] text-[#7A2253] border border-[#7A2253]/20",
      neutral: "bg-zinc-100 text-[#52525B] border border-[#E4E4E7]",
      outline: "bg-transparent text-[#52525B] border border-[#E4E4E7] hover:border-[#7A2253] hover:text-[#7A2253]",
    }[variant];

    return (
      <div
        ref={ref}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold select-none transition-colors ${variantClass} ${className}`}
        {...rest}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
      </div>
    );
  }
);

Chip.displayName = "Chip";
