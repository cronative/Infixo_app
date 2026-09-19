import { ReactNode } from "react";

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  minHeightClass?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
  minHeightClass = "min-h-[300px]",
}: EmptyStateProps) {
  return (
    <div
      className={`w-full flex ${minHeightClass} flex-col items-center justify-center rounded-2xl border border-dashed border-[#cbd5e1] bg-white/70 p-8 text-center transition-all ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#043084]/5 text-[#043084]">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-base font-bold text-[#043084]">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-[#64748b] leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

