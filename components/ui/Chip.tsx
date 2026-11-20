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
          "bg-[#FFEDE6] text-[#C21B5C] uppercase tracking-wider text-[11px] font-bold border border-[#C21B5C]/15";
        break;
      case "pill":
        variantClass =
          "bg-zinc-100 text-[#52525B] text-xs font-semibold border border-[#ECECF0]";
        break;
      case "filter":
        variantClass = selected
          ? "bg-[#C21B5C] text-white border-[#C21B5C] shadow-xs cursor-pointer"
          : "bg-white text-[#52525B] border-[#ECECF0] hover:border-[#C21B5C] hover:text-[#C21B5C] cursor-pointer";
        break;
      case "brand":
        variantClass = "bg-[#C21B5C] text-white shadow-xs";
        break;
      case "soft":
        variantClass = "bg-[#FFF6F2] text-[#C21B5C] border border-[#C21B5C]/20";
        break;
      case "outline":
        variantClass =
          "bg-transparent text-[#52525B] border border-[#ECECF0] hover:border-[#C21B5C] hover:text-[#C21B5C]";
        break;
      case "neutral":
      default:
        variantClass = "bg-zinc-100 text-[#52525B] border border-[#ECECF0]";
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
