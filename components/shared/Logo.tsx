import Link from "next/link";

/**
 * PRIMARY ACTIVE LOGO: Hyundai-Style Slanted Link Oval with Italic Letter 'I'
 * (Slanted horizontal link chain oval framing a bold italicized letter 'I')
 */
export function LogoHyundaiLinkI({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Clean Vertical Slanted Oval Frame */}
      <g transform="rotate(-12 50 50)">
        <ellipse
          cx="50"
          cy="50"
          rx="23"
          ry="39"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Center Capital Letter 'I' */}
      <g transform="translate(50 50) skewX(-8) translate(-50 -50)" fill="currentColor">
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
 * BACKUP: Stadium Link Arch Frame with Center Letter 'I'
 */
export function LogoStadiumLinkI({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g stroke="currentColor" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M 28 42 L 28 24 C 28 14 38 10 50 10 C 62 10 72 14 72 24 L 72 42" />
        <path d="M 28 58 L 28 76 C 28 86 38 90 50 90 C 62 90 72 86 72 76 L 72 58" />
        <path d="M 28 34 C 28 38 34 42 40 42" />
        <path d="M 72 34 C 72 38 66 42 60 42" />
        <path d="M 28 66 C 28 62 34 58 40 58" />
        <path d="M 72 66 C 72 62 66 58 60 58" />
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
 * Primary Default Logo Icon Export -> Hyundai Slanted Link Oval + Italic Letter 'I'
 */
export function InflixoLogoIcon({ className = "h-6 w-6" }: { className?: string }) {
  return <LogoHyundaiLinkI className={className} />;
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
        {styleName === "stadium-link-i" ? (
          <LogoStadiumLinkI className={iconSize} />
        ) : (
          <LogoHyundaiLinkI className={iconSize} />
        )}
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
