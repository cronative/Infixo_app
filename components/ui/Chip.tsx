"use client";

import { HTMLAttributes, forwardRef, ReactNode } from "react";

export type ChipVariant =
  | "eyebrow"
  | "pill"
  | "brand"
  | "neutral"
  | "soft"
  | "outline"
  | "filter";

export interface ChipProps extends HTMLAttributes<HTMLDivElement> {
  variant?: ChipVariant;
  icon?: ReactNode;
  children: ReactNode;
  selected?: boolean;
}

/**
 * Standard Design System Chip / Badge
 * - fully rounded (rounded-full)
 * - min font size 12px (or 11px uppercase for eyebrows)
 * - zinc / brand colors
 * - Lucide line icons
 */
export const Chip = forwardRef<HTMLDivElement, ChipProps>(
  (
    {
      variant = "neutral",
      icon,
      selected,
      className = "",
      children,
      ...rest
    },
    ref
  ) => {
    let variantClass = "";

    switch (variant) {
      case "eyebrow":
        variantClass =
          "bg-[#F7EDEF] text-[#7A2253] uppercase tracking-wider text-[11px] font-bold border border-[#7A2253]/15";
        break;
      case "pill":
        variantClass =
          "bg-zinc-100 text-[#52525B] text-xs font-semibold border border-[#E4E4E7]";
        break;
      case "filter":
        variantClass = selected
          ? "bg-[#7A2253] text-white border-[#7A2253] shadow-xs cursor-pointer"
          : "bg-white text-[#52525B] border-[#E4E4E7] hover:border-[#7A2253] hover:text-[#7A2253] cursor-pointer";
        break;
      case "brand":
        variantClass = "bg-[#7A2253] text-white shadow-xs";
        break;
      case "soft":
        variantClass = "bg-[#fdf2f8] text-[#7A2253] border border-[#7A2253]/20";
        break;
      case "outline":
        variantClass =
          "bg-transparent text-[#52525B] border border-[#E4E4E7] hover:border-[#7A2253] hover:text-[#7A2253]";
        break;
      case "neutral":
      default:
        variantClass = "bg-zinc-100 text-[#52525B] border border-[#E4E4E7]";
        break;
    }

    return (
      <div
        ref={ref}
        className={`inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1 text-xs select-none transition-colors duration-150 ${variantClass} ${className}`}
        {...rest}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
      </div>
    );
  }
);

Chip.displayName = "Chip";
