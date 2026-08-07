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
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-inflixo-purple/25 bg-gradient-to-b from-inflixo-lavender/70 to-surface-muted/40 px-6 py-12 text-center">
      <div
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl text-inflixo-purple"
        style={{ backgroundImage: "linear-gradient(135deg, var(--inflixo-purple-light), #ffffff)", boxShadow: "var(--shadow-soft)" }}
      >
        {icon}
      </div>
      <p className="text-[15px] font-semibold text-inflixo-navy">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
