export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-xl bg-[linear-gradient(90deg,var(--surface-muted)_25%,rgba(109,40,217,0.08)_37%,var(--surface-muted)_63%)] bg-[length:200%_100%] ${className}`}
    />
  );
}

export function SkeletonProfileCard() {
  return (
    <div className="rounded-3xl border border-inflixo-border bg-white p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-full max-w-xs" />
      </div>
      <div className="mt-6 grid grid-cols-3 gap-2">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
      </div>
    </div>
  );
}
