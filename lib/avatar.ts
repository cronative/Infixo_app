/**
 * Generates 1-2 letter initials from a display name or username.
 * Examples:
 * - "Tony Stark" -> "TS"
 * - "Tony" -> "TO"
 * - "Maya Lin Smith" -> "MS"
 * - "" -> fallback ("CR")
 */
export function getInitials(name?: string | null, fallback = "CR"): string {
  if (!name || !name.trim()) return fallback;
  const cleaned = name.trim();
  const parts = cleaned.split(/\s+/);
  
  if (parts.length === 1) {
    return cleaned.slice(0, 2).toUpperCase();
  }
  
  const first = parts[0][0] || "";
  const last = parts[parts.length - 1][0] || "";
  return (first + last).toUpperCase();
}

export const initials = getInitials;

