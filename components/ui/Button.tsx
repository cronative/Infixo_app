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
    "bg-[#651FFF] text-white shadow-md shadow-purple-600/20 hover:bg-[#500CD6] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed",
  secondary:
    "bg-[#FAF9FF] text-[#0F172A] border border-[#E9E3F5] hover:bg-[#F6F0FF] hover:border-purple-300 active:scale-[0.98]",
  outline:
    "bg-white text-[#0F172A] border border-[#E9E3F5] hover:border-[#651FFF]/40 hover:bg-[#FAF9FF] active:scale-[0.98]",
  ghost: "bg-transparent text-[#651FFF] hover:bg-[#F6F0FF] active:scale-[0.98]",
  danger: "bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-[0.98]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-10 px-4 text-xs font-bold rounded-xl gap-1.5 active:scale-[0.98]",
  md: "h-[52px] px-5 text-sm font-bold rounded-2xl gap-2 active:scale-[0.98]",
  lg: "h-[52px] px-6 text-sm sm:text-base font-bold rounded-full gap-2 active:scale-[0.98]",
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
        className={`inline-flex items-center justify-center font-bold tracking-tight transition-all duration-150 cursor-pointer ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        {...rest}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : icon}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
