import Link from "next/link";

export function InflixoLogoIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top Dot of 'i' */}
      <circle cx="40" cy="21" r="7.5" fill="currentColor" />

      {/* Main Stem of 'i' */}
      <path
        d="M 32.5 42.5 C 32.5 38.36 35.86 35 40 35 C 44.14 35 47.5 38.36 47.5 42.5 L 47.5 73.5 C 47.5 76.54 45.04 79 42 79 C 36.75 79 32.5 74.75 32.5 69.5 Z"
        fill="currentColor"
      />

      {/* Ribbon Fold Curl at Bottom Left */}
      <path
        d="M 32.5 69.5 C 32.5 74.75 36.75 79 42 79 C 45.04 79 47.5 76.54 47.5 73.5 C 47.5 71.5 45.5 67 41.5 64.5 C 37.5 62 33 65 32.5 69.5 Z"
        fill="currentColor"
        fillOpacity="0.8"
      />

      {/* 3D Inner Shadow curve */}
      <path
        d="M 47.5 73.5 C 47.5 70 44 65.5 41 64.5 C 43.5 68 45.5 71 47.5 73.5 Z"
        fill="black"
        fillOpacity="0.25"
      />

      {/* Right Rounded Play Button Triangle */}
      <path
        d="M 52.5 43.5 C 52.5 41.19 55.02 39.76 57 40.94 L 77.5 53.44 C 79.45 54.63 79.45 57.44 77.5 58.63 L 57 71.13 C 55.02 72.31 52.5 70.88 52.5 68.57 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Logo({ size = "md", href = "/", light = false }: { size?: "sm" | "md" | "lg"; href?: string; light?: boolean }) {
  const dims = { sm: "h-7 w-7", md: "h-9 w-9", lg: "h-11 w-11" }[size];
  const text = { sm: "text-lg", md: "text-xl", lg: "text-2xl" }[size];
  const iconSize = { sm: "h-4 w-4", md: "h-5.5 w-5.5", lg: "h-7 w-7" }[size];

  return (
    <Link href={href} className="flex items-center gap-2.5 group cursor-pointer select-none">
      {/* Electric Vivid Purple Gradient Squircle Badge matching logo */}
      <div
        className={`flex ${dims} items-center justify-center rounded-2xl text-white shadow-md shadow-purple-600/30 group-hover:scale-105 transition-all duration-200 bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#5B21B6]`}
      >
        <InflixoLogoIcon className={iconSize} />
      </div>

      {/* Brand Name Text */}
      <span className={`font-display ${text} font-extrabold tracking-tight ${light ? "text-white" : "text-slate-900"} group-hover:text-purple-600 transition-colors`}>
        Inflixo
      </span>
    </Link>
  );
}
