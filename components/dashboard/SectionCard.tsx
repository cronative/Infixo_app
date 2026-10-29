import { ReactNode, isValidElement } from "react";
import { LucideIcon } from "lucide-react";

interface SectionCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon | ReactNode;
  /** Right side of the header strip: a 32px button or a text link. */
  action?: ReactNode;
  children: ReactNode;
  id?: string;
  className?: string;
  bodyClassName?: string;
}

/** White card with a #FAFAFB header strip (title 16/600, subtitle 12px muted) and a 16px body. */
export function SectionCard({
  title,
  subtitle,
  icon,
  action,
  children,
  id,
  className = "",
  bodyClassName = "p-4",
}: SectionCardProps) {
  let renderedIcon: ReactNode = null;
  if (icon) {
    if (isValidElement(icon)) {
      renderedIcon = icon;
    } else if (typeof icon === "function") {
      const IconComp = icon as LucideIcon;
      renderedIcon = <IconComp className="w-4 h-4 text-[#7A2253]" />;
    }
  }

  return (
    <section id={id} className={`overflow-hidden rounded-[5px] border border-[#ECECF0] bg-white shadow-none ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-[#ECECF0] bg-[#FAFAFB] px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {renderedIcon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] bg-[#F7EEF2] text-[#7A2253]">
              {renderedIcon}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold leading-[1.25] text-[#18181B] break-words">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[12px] font-normal leading-normal text-[#6B6B76] break-words">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
