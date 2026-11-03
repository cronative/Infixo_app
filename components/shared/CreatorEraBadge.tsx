"use client";

import { EraBadge } from "@/components/shared/EraBadge";
import { parseEraBadge } from "@/lib/eraConfig";

export interface CreatorEraBadgeProps {
  badge?: string | null;
  className?: string;
  size?: "xs" | "sm" | "md";
  onClick?: (e?: React.MouseEvent) => void;
}

/** Thin wrapper kept for existing call sites; renders the shared premium EraBadge. */
export function CreatorEraBadge({ badge, className = "", size = "sm", onClick }: CreatorEraBadgeProps) {
  if (!badge) return null;
  const { era, stage } = parseEraBadge(badge);
  return (
    <EraBadge
      era={era}
      stage={stage}
      label={badge}
      size={size === "md" ? "md" : "sm"}
      showInfo={Boolean(onClick)}
      onClick={onClick ? () => onClick() : undefined}
      className={`shrink-0 ${className}`}
    />
  );
}
