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
 * - 5px corner radius on every size
 * - thin #ECECF0 border, no shadow
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
    const radiusClass = "rounded-[5px]";

    const variantClass = {
      default: "bg-white border border-[#ECECF0]",
      warm: "bg-[#FFFCFB] border border-[#ECECF0]",
      soft: "bg-[#FFF6F2] border border-[#F6E0DC]",
      glass: "bg-white/95 backdrop-blur-xl border border-[#ECECF0]",
    }[variant];

    const interactiveClass = interactive
      ? "transition-all duration-200 hover:border-[#C21B5C]/35"
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
