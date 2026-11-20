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
      className={`w-full flex ${minHeightClass} flex-col items-center justify-center rounded-[5px] border border-dashed border-[#ECECF0] bg-white px-6 py-8 text-center ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-[5px] bg-[#FFF6F2] text-[#C21B5C]">
        {icon}
      </div>
      <h3 className="mt-3 text-[15px] font-semibold text-[#18181B]">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-sm text-[13px] text-[#6B6B76] leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

