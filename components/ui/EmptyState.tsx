import { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#E9E3F5] bg-[#FAF9FF] px-6 py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6F0FF] text-[#651FFF]">
        {icon}
      </div>
      <h3 className="text-base font-extrabold text-[#0F172A]">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-xs font-medium text-[#64748B] leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
