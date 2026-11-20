import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

interface SectionCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon | ReactNode;
  /** Right-side count pill, e.g. "3 packages". */
  count?: ReactNode;
  /** Right side of the header: a 32px button or a text link. */
  action?: ReactNode;
  children: ReactNode;
  id?: string;
  className?: string;
  bodyClassName?: string;
}

/** White card with the shared section header (icon · title/subtitle · count) and a 16px body. */
export function SectionCard({
  title,
  subtitle,
  icon,
  count,
  action,
  children,
  id,
  className = "",
  bodyClassName = "p-4",
}: SectionCardProps) {
  return (
    <section id={id} className={`overflow-hidden rounded-[5px] border border-[#ECECF0] bg-white shadow-none ${className}`}>
      <SectionHeading icon={icon} title={title} subtitle={subtitle} count={count} action={action} />
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
