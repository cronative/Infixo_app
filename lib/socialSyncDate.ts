export function formatSimplifiedSyncDate(dateStr?: string | null): string {
  if (!dateStr) return "Updated recently";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Updated recently";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Updated recently";
    if (diffHours < 24) return `Updated ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Updated yesterday";
    if (diffDays < 7) return `Updated ${diffDays}d ago`;
    return `Last updated ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  } catch {
    return "Updated recently";
  }
}

