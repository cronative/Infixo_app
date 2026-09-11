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
    "bg-[#151933] text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-md active:scale-[0.99] disabled:translate-y-0 disabled:opacity-50 disabled:bg-[#f1f5f9] disabled:text-[#94a3b8] disabled:cursor-not-allowed disabled:shadow-none",
  secondary:
    "bg-[#ffffff] text-[#151933] border border-[#e2e8f0] shadow-xs hover:-translate-y-0.5 hover:bg-[#f8fafc] hover:border-[#cbd5e1] hover:shadow-sm",
  outline:
    "bg-transparent text-[#151933] border border-[#e2e8f0] hover:-translate-y-0.5 hover:bg-[#f8fafc] hover:border-[#cbd5e1]",
  ghost: "bg-transparent text-[#475569] hover:text-[#151933] hover:bg-[#f1f5f9]",
  danger: "bg-rose-50 text-[#ef4444] border border-rose-200 hover:-translate-y-0.5 hover:bg-rose-100",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs font-semibold rounded-lg gap-1.5",
  md: "h-9 sm:h-10 px-4 text-xs sm:text-sm font-semibold rounded-xl gap-2",
  lg: "h-10 sm:h-11 px-5 text-xs sm:text-sm font-bold rounded-xl gap-2",
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
