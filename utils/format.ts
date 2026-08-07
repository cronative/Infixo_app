export function formatCount(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0";
  if (value < 1000) return `${Math.round(value)}`;
  if (value < 1_000_000) {
    const k = value / 1000;
    return `${trimDecimal(k)}K`;
  }
  const m = value / 1_000_000;
  return `${trimDecimal(m)}M`;
}

function trimDecimal(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return rounded % 1 === 0 ? `${rounded}` : rounded.toFixed(1);
}

export function slugifyUsername(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, "")
    .slice(0, 30);
}

export function generateId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36)}`;
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
