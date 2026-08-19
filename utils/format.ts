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

export function formatSyncDate(dateStr?: string): string {
  if (!dateStr) {
    return new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "Aug 18, 2026, 6:00 PM";
  }
}

export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  return "https://inflixo.com";
}

export function buildProfileUrl(username: string): string {
  const base = getBaseUrl();
  const handle = username ? username.replace(/^@/, "") : "username";
  return `${base}/${handle}`;
}

export function buildSeriesUrl(username: string, seriesId: string): string {
  const base = getBaseUrl();
  const handle = username ? username.replace(/^@/, "") : "creator";
  return `${base}/${handle}/series/${seriesId}`;
}

