interface MadeWithInflixoProps {
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  className?: string;
  disabled?: boolean;
  compact?: boolean;
}

export function MadeWithInflixo({
  color,
  className = "",
  disabled = false,
}: MadeWithInflixoProps) {
  return (
    <a
      href="https://inflixo.com"
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => {
        if (disabled) event.preventDefault();
      }}
      style={{ color: color || "#94a3b8" }}
      className={`group inline-flex items-center justify-center gap-2 text-xs font-medium transition-colors hover:opacity-100 opacity-75 ${className}`}
      aria-label="Powered by Inflixo"
    >
      <img
        src="/images/inflixo-logo-3d.png"
        alt="Inflixo"
        className="h-4.5 w-4.5 rounded-[5px] object-cover inline-block shrink-0 shadow-2xs group-hover:scale-110 transition-transform select-none"
      />
      <span className="tracking-normal">
        Powered by <strong className="font-semibold text-current">Inflixo</strong>
      </span>
    </a>
  );
}

export { PublicMadeWithInflixo } from "@/components/public/PublicMadeWithInflixo";
