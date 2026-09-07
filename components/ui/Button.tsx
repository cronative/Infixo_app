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
    "bg-[#803D63] text-white hover:bg-[#6F3456] shadow-xs active:scale-[0.99] disabled:opacity-50 disabled:bg-[#F5F3ED] disabled:text-[#797570] disabled:cursor-not-allowed",
  secondary:
    "bg-white text-[#181716] border border-[#E7E3DC] hover:bg-[#F8F7F3] hover:border-[#803D63]/30 shadow-xs",
  outline:
    "bg-white text-[#181716] border border-[#E7E3DC] hover:bg-[#F8F7F3] hover:border-[#803D63]/30",
  ghost: "bg-transparent text-[#54514D] hover:text-[#181716] hover:bg-[#F8F7F3]",
  danger: "bg-rose-50 text-[#C2414B] border border-rose-200 hover:bg-rose-100",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3.5 text-xs font-semibold rounded-xl gap-1.5",
  md: "h-11 px-4.5 text-sm font-semibold rounded-xl gap-2",
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
