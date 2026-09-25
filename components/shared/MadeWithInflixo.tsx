import { ExternalLink } from "lucide-react";
import { InflixoLogoIcon } from "@/components/shared/Logo";

interface MadeWithInflixoProps {
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  className?: string;
  disabled?: boolean;
  compact?: boolean;
}

export function MadeWithInflixo({
  color = "#043084",
  backgroundColor = "rgba(255,255,255,0.72)",
  borderColor = "rgba(4,48,132,0.18)",
  className = "",
  disabled = false,
  compact = false,
}: MadeWithInflixoProps) {
  return (
    <a
      href="/"
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => {
        if (disabled) event.preventDefault();
      }}
      style={{ color, backgroundColor, borderColor }}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-[10px] border font-extrabold shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${compact ? "h-7 gap-1.5 px-2.5 text-[10px]" : "h-9 gap-2 px-3.5 text-[12px] sm:text-[13px]"} ${className}`}
      aria-label="Visit Inflixo"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/45 to-transparent [animation:inflixo-sheen_4.5s_ease-in-out_infinite] motion-reduce:hidden"
      />
      <span className={`relative flex shrink-0 items-center justify-center rounded-md bg-current/10 transition-transform duration-200 group-hover:scale-105 ${compact ? "h-4 w-4" : "h-5 w-5"}`}>
        <InflixoLogoIcon color="current" className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      </span>
      <span className="relative whitespace-nowrap tracking-normal">Made with Inflixo</span>
      <ExternalLink className={`relative shrink-0 opacity-75 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${compact ? "h-3 w-3" : "h-3.5 w-3.5"}`} />
    </a>
  );
}
