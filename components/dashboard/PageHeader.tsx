import { ReactNode } from "react";

export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * Shared PageHeader for all /dashboard pages.
 * - One row: left = title + subtitle (4px below), right = actions vertically centered
 * - Title: text-2xl font-bold text-[#0F172A]
 * - Subtitle: text-sm text-[#64748B] mt-1
 * - Actions: gap 8px (gap-2), primary action always last (rightmost), heights 36px (h-9)
 * - Margin-bottom 24px (mb-6)
 * - Mobile (<640px): stack — title/subtitle first, actions below, full-width primary button
 */
export function PageHeader({ title, subtitle, actions, className = "" }: PageHeaderProps) {
  return (
    <header className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 ${className}`}>
      {/* Left: Title + Subtitle */}
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[#64748B] mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right: Actions */}
      {actions && (
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 w-full sm:w-auto [&>button:last-child]:w-full sm:[&>button:last-child]:w-auto [&>a:last-child]:w-full sm:[&>a:last-child]:w-auto [&>*:last-child]:justify-center">
          {actions}
        </div>
      )}
    </header>
  );
}
