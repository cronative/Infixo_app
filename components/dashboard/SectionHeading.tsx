import { ReactNode, isValidElement } from "react";
import type { LucideIcon } from "lucide-react";

export interface SectionHeadingProps {
  /** Lucide icon component or a ready element; shown white on a filled brand box. */
  icon?: LucideIcon | ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-side count pill, e.g. "9 products". */
  count?: ReactNode;
  /** Extra right-side control (button/link), shown after the count. */
  action?: ReactNode;
  as?: "h2" | "h3";
  /** Replaces the filled brand icon box (e.g. a platform brand colour). */
  iconBoxClassName?: string;
  className?: string;
}

/**
 * The one section header for the dashboard, matching the public profile:
 * [icon box]  Title            [count] [action]
 *             Subtitle
 * On narrow screens the right side wraps under the title instead of squeezing it.
 */
export function SectionHeading({ icon, title, subtitle, count, action, as = "h2", iconBoxClassName, className = "" }: SectionHeadingProps) {
  let renderedIcon: ReactNode = null;
  if (icon) {
    if (isValidElement(icon)) renderedIcon = icon;
    else if (typeof icon === "function" || (typeof icon === "object" && icon !== null && "render" in icon)) {
      const Icon = icon as LucideIcon;
      renderedIcon = <Icon className="h-[18px] w-[18px]" />;
    }
  }
  const Title = as;
  const hasRight = (count !== undefined && count !== null && count !== false) || action;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-[#F6E0DC] bg-[#FFFBF7] px-4 py-3 ${className}`}>
      <div className="flex min-w-0 flex-1 basis-[200px] items-center gap-3">
        {renderedIcon && (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] ${iconBoxClassName ?? "bg-[#C21B5C] text-white [&_svg]:text-white"}`}>
            {renderedIcon}
          </span>
        )}
        <div className="min-w-0">
          <Title className="break-words text-[15px] font-bold leading-5 text-[#18181B]">{title}</Title>
          {subtitle && <p className="break-words text-[12px] leading-4 text-[#6B6B76]">{subtitle}</p>}
        </div>
      </div>
      {hasRight && (
        <div className="flex shrink-0 items-center gap-2">
          {count !== undefined && count !== null && count !== false && (
            <span className="inline-flex h-7 items-center rounded-[5px] border border-[#F6E0DC] px-2.5 text-[12px] font-semibold tabular-nums text-[#C21B5C]">
              {count}
            </span>
          )}
          {action}
        </div>
      )}
    </div>
  );
}
