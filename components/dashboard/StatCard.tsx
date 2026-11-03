import { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface StatCardAction {
  label: string;
  onClick?: () => void;
  href?: string;
  title?: string;
}

export interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  /** Makes the whole card clickable and shows a muted chevron. */
  href?: string;
  /** Small pill inline after the value. A string gets the default pill; a node renders as-is. */
  badge?: ReactNode;
  /** Small text link in the top-right corner (replaces the chevron). */
  action?: StatCardAction;
  /** Optional line under the value (progress bar, short detail). Use sparingly. */
  footer?: ReactNode;
  className?: string;
}

const COLS = {
  1: "grid-cols-1",
  2: "grid-cols-1 min-[380px]:grid-cols-2",
  3: "grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
} as const;

/** Equal-column grid for StatCards: 1–2 per row on mobile, `cols` per row on desktop, 12px gap. */
export function StatCardGrid({ cols = 4, children, className = "" }: { cols?: keyof typeof COLS; children: ReactNode; className?: string }) {
  return <div className={`grid gap-3 ${COLS[cols]} ${className}`}>{children}</div>;
}

const actionCls =
  "relative z-10 shrink-0 text-[12px] font-medium text-[#7A2253] hover:underline underline-offset-2 cursor-pointer whitespace-nowrap";

/**
 * The one stat/metric card for the dashboard: label on top, value below,
 * optional inline badge, chevron (linked) or small top-right action.
 */
export function StatCard({ label, value, href, badge, action, footer, className = "" }: StatCardProps) {
  const valueTitle = typeof value === "string" || typeof value === "number" ? String(value) : undefined;

  return (
    <div
      className={`group relative flex min-h-[72px] min-w-0 flex-col justify-start rounded-[5px] border border-[#E8E8EC] bg-white px-4 py-3.5 shadow-none transition-colors hover:border-[#7A2253] ${className}`}
    >
      {/* Stretched link: whole card clickable while the action stays its own control. */}
      {href && (
        <Link href={href} className="absolute inset-0 z-0 rounded-[5px]" aria-label={typeof label === "string" ? label : undefined} />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-normal leading-[18px] text-[#6B6B76]">{label}</p>
          <div className="mt-0.5 flex min-w-0 items-center gap-2">
            <span
              className="min-w-0 truncate text-[20px] font-semibold leading-[26px] text-[#18181B] tabular-nums"
              title={valueTitle}
            >
              {value}
            </span>
            {badge != null && badge !== false && (
              typeof badge === "string" ? (
                <span className="inline-flex shrink-0 items-center rounded-full border border-[#7A2253]/20 bg-[#F7EEF2] px-2 py-0.5 text-[11px] font-semibold leading-4 text-[#7A2253] whitespace-nowrap">
                  {badge}
                </span>
              ) : (
                <span className="relative z-10 inline-flex shrink-0 items-center">{badge}</span>
              )
            )}
          </div>
        </div>

        {action ? (
          action.href ? (
            <Link href={action.href} className={actionCls} title={action.title}>
              {action.label}
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} className={actionCls} title={action.title}>
              {action.label}
            </button>
          )
        ) : (
          href && <ChevronRight className="mt-2.5 h-4 w-4 shrink-0 text-[#A1A1AA] transition-colors group-hover:text-[#7A2253]" aria-hidden />
        )}
      </div>

      {footer && <div className="relative z-10 mt-1.5 min-w-0">{footer}</div>}
    </div>
  );
}
