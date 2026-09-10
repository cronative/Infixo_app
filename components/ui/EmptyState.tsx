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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E4DAD5] bg-[#FAF8F5] px-5 py-7 text-center">
      <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#151933]/[0.08] text-[#151933]">
        {icon}
      </div>
      <h3 className="text-sm sm:text-base font-bold text-[#181716]">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-xs font-medium text-[#6B5A5D] leading-relaxed">{description}</p>}
      {action && <div className="mt-3.5">{action}</div>}
    </div>
  );
}
