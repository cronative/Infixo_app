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
    "text-white shadow-[0_1px_1px_rgba(255,255,255,0.15)_inset,0_10px_24px_-10px_rgba(109,40,217,0.55)] hover:shadow-[0_1px_1px_rgba(255,255,255,0.2)_inset,0_16px_32px_-12px_rgba(109,40,217,0.65)] hover:-translate-y-px active:translate-y-0 active:scale-[0.98] disabled:opacity-50",
  secondary:
    "bg-inflixo-lavender text-inflixo-purple-dark hover:bg-inflixo-purple-light active:scale-[0.98]",
  outline:
    "bg-white text-inflixo-navy border border-inflixo-border hover:border-inflixo-purple/40 hover:bg-surface-muted active:scale-[0.98]",
  ghost: "bg-transparent text-inflixo-navy hover:bg-surface-muted active:scale-[0.98]",
  danger: "bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-[0.98]",
};

const variantStyle: Partial<Record<Variant, React.CSSProperties>> = {
  primary: { backgroundImage: "var(--gradient-premium)" },
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-xl gap-1.5",
  md: "h-12 px-5 text-[15px] rounded-2xl gap-2",
  lg: "h-14 px-6 text-base rounded-2xl gap-2",
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
        style={{ ...variantStyle[variant], ...style }}
        className={`inline-flex items-center justify-center font-semibold tracking-tight transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70 ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        {...rest}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
