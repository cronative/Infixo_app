"use client";

import { HTMLAttributes, forwardRef, ReactNode } from "react";

export type CardSize = "md" | "lg";
export type CardVariant = "default" | "warm" | "soft" | "glass";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  size?: CardSize;
  variant?: CardVariant;
  interactive?: boolean;
  children?: ReactNode;
}

/**
 * Standard Design System Card
 * - size="md": 16px corner radius (rounded-2xl)
 * - size="lg": 24px corner radius (rounded-[24px])
 * - border: #E4E4E7
 * - text: zinc / #18181B
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      size = "md",
      variant = "default",
      interactive = false,
      className = "",
      children,
      ...rest
    },
    ref
  ) => {
    const radiusClass = size === "lg" ? "rounded-[24px]" : "rounded-[16px]";

    const variantClass = {
      default: "bg-white border border-[#E4E4E7] shadow-sm",
      warm: "bg-[#FFFCFB] border border-[#E4E4E7] shadow-sm",
      soft: "bg-[#F7EDEF] border border-[#E4E4E7]",
      glass: "bg-white/95 backdrop-blur-xl border border-[#E4E4E7] shadow-[0_20px_60px_-15px_rgba(122,34,83,0.12)]",
    }[variant];

    const interactiveClass = interactive
      ? "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#7A2253]/35"
      : "";

    return (
      <div
        ref={ref}
        className={`${radiusClass} ${variantClass} ${interactiveClass} text-[#18181B] ${className}`}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
