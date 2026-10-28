/** Marks a dashboard item that is beyond the current plan limit (kept, but hidden on the public profile). */
export function OverLimitBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="Beyond your plan limit: kept here, hidden on your public profile. Upgrade to show it."
      className={`inline-flex shrink-0 items-center rounded-[4px] border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ${className}`}
    >
      Hidden · over plan limit
    </span>
  );
}
