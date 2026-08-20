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
    "bg-[#6366F1] text-white hover:bg-[#4F46E5] disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed",
  secondary:
    "bg-slate-100 text-slate-900 border border-slate-200 hover:bg-slate-200",
  outline:
    "bg-white text-slate-900 border border-slate-200 hover:border-slate-300 hover:bg-slate-50",
  ghost: "bg-transparent text-[#6366F1] hover:bg-purple-50",
  danger: "bg-rose-50 text-rose-600 hover:bg-rose-100",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3.5 text-xs font-bold rounded-xl gap-1.5",
  md: "h-11 px-4.5 text-sm font-bold rounded-xl gap-2",
  lg: "h-12 px-6 text-sm font-bold rounded-xl gap-2",
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
