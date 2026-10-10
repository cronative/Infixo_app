"use client";

import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[#7A2253] hover:bg-[#631841] text-white shadow-md shadow-[#7A2253]/25 transition-all active:scale-[0.99] disabled:translate-y-0 disabled:opacity-50 disabled:bg-[#fdf2f8] disabled:text-[#71717A] disabled:cursor-not-allowed disabled:shadow-none",
  secondary:
    "bg-white text-[#18181B] border border-[#E4E4E7] shadow-xs hover:bg-[#fdf2f8] hover:border-[#7A2253] hover:text-[#7A2253] hover:shadow-sm",
  outline:
    "bg-transparent text-[#7A2253] border border-[#E4E4E7] hover:bg-[#fdf2f8] hover:border-[#7A2253]",
  ghost: "bg-transparent text-[#52525B] hover:text-[#7A2253] hover:bg-[#fdf2f8]",
  danger: "bg-rose-50 text-[#ef4444] border border-rose-200 hover:-translate-y-0.5 hover:bg-rose-100",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-xs font-semibold rounded-lg gap-1.5",
  md: "h-11 px-4 text-sm font-bold rounded-xl gap-2",
  lg: "h-12 px-5 text-sm sm:text-base font-bold rounded-xl gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading, icon, fullWidth, className = "", children, disabled, style, ...rest },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        style={style}
        className={`inline-flex items-center justify-center font-bold tracking-tight transition-all duration-200 cursor-pointer ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        {...rest}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : icon}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
