import Link from "next/link";

/**
 * PRIMARY ACTIVE LOGO: Stadium Link Icon Arch Frame with Capital Letter 'I'
 * (Top & bottom rounded stadium link arches framing the bold center letter 'I')
 */
export function LogoStadiumLinkI({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Stadium Link Icon (Rounded Top & Bottom Link Arches) */}
      <g stroke="currentColor" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Top Stadium Link Arch */}
        <path d="M 28 42 L 28 24 C 28 14 38 10 50 10 C 62 10 72 14 72 24 L 72 42" />

        {/* Bottom Stadium Link Arch */}
        <path d="M 28 58 L 28 76 C 28 86 38 90 50 90 C 62 90 72 86 72 76 L 72 58" />

        {/* Inner Link Ring Sockets */}
        <path d="M 28 34 C 28 38 34 42 40 42" />
        <path d="M 72 34 C 72 38 66 42 60 42" />
        <path d="M 28 66 C 28 62 34 58 40 58" />
        <path d="M 72 66 C 72 62 66 58 60 58" />
      </g>

      {/* Upright Center Capital Letter 'I' - 100% BOLD & CRYSTAL CLEAR */}
      <g fill="currentColor">
        {/* Bold Top Serif Bar */}
        <rect x="33" y="22" width="34" height="8.5" rx="4.25" />

        {/* Solid Vertical Stem */}
        <rect x="44" y="30.5" width="12" height="39" rx="6" />

        {/* Bold Bottom Serif Bar */}
        <rect x="33" y="69.5" width="34" height="8.5" rx="4.25" />
      </g>
    </svg>
  );
}

/**
 * BACKUP 1: Universal 45-Degree Tilted Link Icon
 */
export function LogoUniversalLinkI({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g transform="rotate(-45 50 50)" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M 34 46 L 34 20 A 16 16 0 0 1 66 20 L 66 54 A 16 16 0 0 1 50 70 L 44 70" />
        <path d="M 66 54 L 66 80 A 16 16 0 0 1 34 80 L 34 46 A 16 16 0 0 1 50 30 L 56 30" />
      </g>
      <g fill="currentColor">
        <rect x="33" y="22" width="34" height="8.5" rx="4.25" />
        <rect x="44" y="30.5" width="12" height="39" rx="6" />
        <rect x="33" y="69.5" width="34" height="8.5" rx="4.25" />
      </g>
    </svg>
  );
}

/**
 * Primary Default Logo Icon Export -> Stadium Link Arch Frame + Center Letter 'I'
 */
export function InflixoLogoIcon({ className = "h-6 w-6" }: { className?: string }) {
  return <LogoStadiumLinkI className={className} />;
}

export function Logo({
  size = "md",
  href = "/",
  light = false,
  variant = "gradient",
  styleName = "stadium-link-i",
}: {
  size?: "sm" | "md" | "lg";
  href?: string;
  light?: boolean;
  variant?: "gradient" | "black" | "white" | "brand";
  styleName?: "stadium-link-i" | "universal-link-i";
}) {
  const dims = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12" }[size];
  const text = { sm: "text-lg", md: "text-xl", lg: "text-2xl" }[size];
  const iconSize = { sm: "h-5 w-5", md: "h-6.5 w-6.5", lg: "h-8 w-8" }[size];

  const badgeStyles = {
    gradient:
      "bg-gradient-to-br from-[#782BFB] via-[#6512FA] to-[#500CD6] text-white shadow-md shadow-purple-600/35",
    black: "bg-slate-900 text-white shadow-md shadow-slate-900/20",
    white: "bg-white border border-slate-200 text-[#0F172A] shadow-sm",
    brand: "bg-purple-100 text-[#651FFF] border border-purple-200",
  }[variant];

  return (
    <Link href={href} className="flex items-center gap-3 group cursor-pointer select-none">
      {/* Badge Squircle Container */}
      <div
        className={`flex ${dims} items-center justify-center rounded-2xl ${badgeStyles} group-hover:scale-105 transition-all duration-200`}
      >
        {styleName === "universal-link-i" ? (
          <LogoUniversalLinkI className={iconSize} />
        ) : (
          <LogoStadiumLinkI className={iconSize} />
        )}
      </div>

      {/* Brand Name Text */}
      <span
        className={`font-display ${text} font-black tracking-tight ${light ? "text-white" : "text-slate-900"
          } group-hover:text-[#6512FA] transition-colors`}
      >
        Inflixo
      </span>
    </Link>
  );
}
