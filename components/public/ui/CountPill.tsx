import type { ReactNode } from "react";
import { SECTION_FG, SECTION_LINE } from "./tokens";

/** Small bordered count ("3 series", "12 links") shown in a Section header. */
export function CountPill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      style={{ color: SECTION_FG, backgroundColor: "transparent", borderColor: SECTION_LINE }}
      className={`shrink-0 whitespace-nowrap rounded-[5px] border border-(--surface-border) bg-(--card-bg) px-1.5 py-px text-[11px] font-medium sm:px-2 sm:py-0.5 sm:text-[11px] ${className}`}
    >
      {children}
    </span>
  );
}
