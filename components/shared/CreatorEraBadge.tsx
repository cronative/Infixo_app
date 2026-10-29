import { getMedalGradient } from "@/lib/creatorEra";

export interface CreatorEraBadgeProps {
  badge?: string | null;
  className?: string;
  size?: "xs" | "sm" | "md";
  onClick?: (e?: React.MouseEvent) => void;
}

export function CreatorEraBadge({
  badge,
  className = "",
  size = "sm",
  onClick,
}: CreatorEraBadgeProps) {
  if (!badge) return null;

  const stage = badge.includes("Bronze")
    ? "Bronze"
    : badge.includes("Silver")
    ? "Silver"
    : "Gold";

  const sizeClasses =
    size === "xs"
      ? "px-1.5 py-0.5 text-[10px] gap-1"
      : size === "md"
      ? "px-2.5 py-1 text-xs gap-1.5"
      : "px-2 py-0.5 text-[11px] sm:text-xs gap-1.5";

  const dotSize = size === "xs" ? "w-2 h-2" : "w-2.5 h-2.5";

  const content = (
    <>
      <span
        className={`${dotSize} rounded-full shrink-0 border border-black/20`}
        style={{ background: getMedalGradient(stage) }}
        aria-hidden="true"
      />
      <span>{badge}</span>
    </>
  );

  const titleText = `${badge} — Era reached (based on peak combined fans from linked platforms)`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        title={titleText}
        className={`tap-scale inline-flex items-center rounded-[5px] font-bold tracking-tight border border-[#7A2253]/20 bg-[#FFF0F5] text-[#7A2253] hover:bg-[#FCE7F3] select-none whitespace-nowrap shrink-0 transition-colors cursor-pointer ${sizeClasses} ${className}`}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      title={titleText}
      className={`inline-flex items-center rounded-[5px] font-bold tracking-tight border border-[#7A2253]/20 bg-[#FFF0F5] text-[#7A2253] select-none whitespace-nowrap shrink-0 transition-colors ${sizeClasses} ${className}`}
    >
      {content}
    </span>
  );
}
