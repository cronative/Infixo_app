import { ReactNode } from "react";

interface StatTileProps {
  icon: ReactNode;
  value: ReactNode;
  label: ReactNode;
  /** Optional line under the label (trend, platform icons, status). */
  extra?: ReactNode;
  /** Optional small control in the top-right corner. */
  action?: ReactNode;
  /** Overrides the 22/600 value style (e.g. a long email). */
  valueClassName?: string;
  href?: string;
  className?: string;
}

/** Grid for StatTiles: 2 on mobile, 3 on tablet, max 5 per row on desktop. */
export function StatGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 ${className}`}>
      {children}
    </div>
  );
}

/**
 * StatTile with full-height square left icon box (Instagram account row style).
 * - Left: full-height square box with bg-[#FAFAFB], border-r border-[#ECECF0], bold 20px icon in #7A2253
 * - Right: Value & Label, compact and vertically centered
 */
export function StatTile({ icon, value, label, extra, action, valueClassName, href, className = "" }: StatTileProps) {
  const content = (
    <div className="flex h-full w-full items-stretch">
      {/* Full-height Square Left Box */}
      <div className="flex w-[64px] sm:w-[68px] shrink-0 items-center justify-center border-r border-[#ECECF0] bg-[#FAFAFB] text-[#7A2253] [&>svg]:h-[30px] [&>svg]:w-[30px] [&>svg]:stroke-[2.25]">
        {icon}
      </div>

      {/* Right Content */}
      <div className="flex-1 min-w-0 p-3 sm:p-3.5 flex flex-col justify-center">
        {action && <div className="self-end -mt-1 -mr-1 mb-1">{action}</div>}
        <div className={valueClassName ?? "text-[18px] sm:text-[20px] font-semibold leading-tight text-[#18181B] whitespace-nowrap tabular-nums"}>
          {value}
        </div>
        <div className="mt-0.5 text-[12px] font-normal leading-normal text-[#6B6B76] break-words">
          {label}
        </div>
        {extra && <div className="mt-1">{extra}</div>}
      </div>
    </div>
  );

  const cls = `block min-w-0 rounded-[5px] border border-[#ECECF0] bg-white shadow-none overflow-hidden min-h-[64px] sm:min-h-[68px] ${className}`;
  return href ? (
    <a href={href} className={`${cls} transition-colors hover:border-[#7A2253]/30`}>
      {content}
    </a>
  ) : (
    <div className={cls}>{content}</div>
  );
}
