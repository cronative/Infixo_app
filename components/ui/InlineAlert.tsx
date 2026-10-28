"use client";

import { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

export type InlineAlertVariant = "error" | "info" | "success" | "warning";

interface InlineAlertProps {
  variant?: InlineAlertVariant;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function InlineAlert({
  variant = "info",
  children,
  className = "",
  action,
}: InlineAlertProps) {
  const styles = {
    error: {
      container: "border-[#DC2626]/30 bg-[#FEF2F2] text-[#DC2626]",
      icon: <AlertCircle className="h-4 w-4 shrink-0 text-[#DC2626]" />,
    },
    info: {
      container: "border-[#7A2253]/25 bg-[#FDF2F8] text-[#7A2253]",
      icon: <Info className="h-4 w-4 shrink-0 text-[#7A2253]" />,
    },
    success: {
      container: "border-[#16A34A]/30 bg-[#F0FDF4] text-[#16A34A]",
      icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16A34A]" />,
    },
    warning: {
      container: "border-amber-300 bg-amber-50 text-amber-800",
      icon: <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />,
    },
  }[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={`flex items-start gap-2.5 rounded-[5px] border p-3 text-xs font-semibold leading-relaxed ${styles.container} ${className}`}
    >
      <div className="mt-0.5">{styles.icon}</div>
      <div className="flex-1">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
