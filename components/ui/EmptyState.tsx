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
  minHeightClass = "min-h-[220px]",
}: EmptyStateProps) {
  return (
    <div
      className={`w-full flex ${minHeightClass} flex-col items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-white px-6 py-8 text-center ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f1f5f9] text-[#64748b]">
        {icon}
      </div>
      <h3 className="mt-3 text-[15px] font-semibold text-[#0f172a]">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-sm text-[13px] text-[#64748b] leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

