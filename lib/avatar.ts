/**
 * Generates 1-2 letter initials from a display name or username.
 * Examples:
 * - "Tony Stark" -> "TS"
 * - "Tony" -> "TO"
 * - "Maya Lin Smith" -> "MS"
 * - "" -> "C"
 */
export function getInitials(name?: string): string {
  if (!name || !name.trim()) return "C";
  const cleaned = name.trim();
  const parts = cleaned.split(/\s+/);
  
  if (parts.length === 1) {
    return cleaned.slice(0, 2).toUpperCase();
  }
  
  const first = parts[0][0] || "";
  const last = parts[parts.length - 1][0] || "";
  return (first + last).toUpperCase();
}
