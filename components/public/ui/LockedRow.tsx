import { Lock } from "lucide-react";

/**
 * Placeholder for items a limited (plan ended) profile doesn't show. Purely decorative bars under a
 * blur: the real items are never sent to the browser, so there is nothing to reveal in DevTools.
 */
export function LockedRow({ count }: { count: number }) {
  return (
    <div
      role="note"
      aria-label={`${count} more ${count === 1 ? "item" : "items"} locked`}
      className="relative flex min-h-14 items-center gap-3 overflow-hidden border-t border-(--surface-border) px-4 py-3 select-none"
    >
      <div aria-hidden className="flex w-full items-center gap-3 blur-[3px]">
        <span className="h-9 w-9 shrink-0 rounded-[5px] bg-(--accent-soft)" />
        <span className="flex-1 space-y-1.5">
          <span className="block h-2.5 w-3/4 rounded-[5px] bg-(--surface-border)" />
          <span className="block h-2 w-1/2 rounded-[5px] bg-(--surface-border)" />
        </span>
      </div>
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-[5px] border border-(--surface-border) bg-(--card-bg) px-2.5 py-1 text-[12px] font-semibold text-(--text)">
          <Lock className="h-3.5 w-3.5 text-(--accent-text)" aria-hidden />
          {count} more locked
        </span>
      </span>
    </div>
  );
}
