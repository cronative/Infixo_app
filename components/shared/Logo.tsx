import Link from "next/link";

/**
 * PRIMARY ACTIVE LOGO: Authentic Web Link Chain Icon with Capital Letter 'I'
 * (Interlocking Web Link chain loops framing a bold center letter 'I')
 */
export function LogoWebLinkI({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Web Link Chain Loops (Universal Bio-Link Icon) */}
      <g stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Top-Right Link Loop */}
        <path d="M 44 20 L 62 20 C 74 20 83 29 83 41 C 83 53 74 62 62 62 L 50 62" />

        {/* Bottom-Left Link Loop */}
        <path d="M 56 80 L 38 80 C 26 80 17 71 17 59 C 17 47 26 38 38 38 L 50 38" />
      </g>

      {/* Upright Center Capital Letter 'I' - 100% Bold & Crisp */}
      <g fill="currentColor">
        {/* Top Serif Bar */}
        <rect x="35" y="23" width="30" height="7.5" rx="3.75" />

        {/* Solid Vertical Stem */}
        <rect x="44" y="30.5" width="12" height="39" rx="6" />

        {/* Bottom Serif Bar */}
        <rect x="35" y="69.5" width="30" height="7.5" rx="3.75" />
      </g>
    </svg>
  );
}

/**
 * Primary Default Logo Icon Export -> Web Link Chain Icon + Letter 'I'
 */
export function InflixoLogoIcon({ className = "h-6 w-6" }: { className?: string }) {
  return <LogoWebLinkI className={className} />;
}

export function Logo({
  size = "md",
  href = "/",
  light = false,
  variant = "gradient",
  styleName = "hyundai-link-i",
}: {
  size?: "sm" | "md" | "lg";
  href?: string;
  light?: boolean;
  variant?: "gradient" | "black" | "white" | "brand";
  styleName?: "hyundai-link-i" | "stadium-link-i";
}) {
  const dims = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12" }[size];
  const text = { sm: "text-lg", md: "text-xl", lg: "text-2xl" }[size];
  const iconSize = { sm: "h-5 w-5", md: "h-6.5 w-6.5", lg: "h-8 w-8" }[size];

  const badgeStyles = {
    gradient: "bg-[#803D63] text-white",
    black: "bg-slate-900 text-white",
    white: "bg-white border border-slate-200 text-[#111827]",
    brand: "bg-[#803D63] text-white",
  }[variant];

  return (
    <Link href={href} className="flex items-center gap-2.5 group cursor-pointer select-none">
      {/* Badge Squircle Container */}
      <div
        className={`flex ${dims} items-center justify-center rounded-xl ${badgeStyles} transition-colors duration-200`}
      >
        <LogoWebLinkI className={iconSize} />
      </div>

      {/* Brand Name Text */}
      <span
        className={`font-display ${text} font-bold tracking-tight ${
          light ? "text-white" : "text-slate-900"
        } group-hover:text-[#803D63] transition-colors`}
      >
        Inflixo
      </span>
    </Link>
  );
}
