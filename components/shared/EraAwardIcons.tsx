import type { SVGProps } from "react";

/** Custom award glyphs for eras lucide has no icon for. Stroke style matches lucide (24 grid, currentColor). */
type IconProps = SVGProps<SVGSVGElement> & { size?: number | string; color?: string };

function base({ size = 24, color = "currentColor", strokeWidth = 2, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
}

/** Flourish Laurel — two leafy branches forming a wreath. */
export function LaurelIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 20c-3.5-1.8-5.5-5.4-5-9.5" />
      <path d="M16 20c3.5-1.8 5.5-5.4 5-9.5" />
      <path d="M4.2 15.8c-1.6-.2-2.6-1.2-2.8-2.8 1.6.1 2.6 1 2.8 2.8Z" />
      <path d="M3.3 11.6c-1.3-.7-1.8-1.9-1.6-3.4 1.4.6 2 1.8 1.6 3.4Z" />
      <path d="M6.6 18.6c-1.5.5-2.8.1-3.8-1.1 1.6-.4 2.8 0 3.8 1.1Z" />
      <path d="M19.8 15.8c1.6-.2 2.6-1.2 2.8-2.8-1.6.1-2.6 1-2.8 2.8Z" />
      <path d="M20.7 11.6c1.3-.7 1.8-1.9 1.6-3.4-1.4.6-2 1.8-1.6 3.4Z" />
      <path d="M17.4 18.6c1.5.5 2.8.1 3.8-1.1-1.6-.4-2.8 0-3.8 1.1Z" />
      <path d="M10 20.5h4" />
      <path d="M12 4.5l1.1 2.2 2.4.3-1.8 1.7.5 2.4L12 10l-2.2 1.1.5-2.4L8.5 7l2.4-.3L12 4.5Z" />
    </svg>
  );
}

/** Inspire Torch — handle with a flame on top. */
export function TorchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 2.5c1.8 1.6 2.8 3.2 2.8 4.8a2.8 2.8 0 0 1-5.6 0c0-1 .4-1.9 1.1-2.6.2 1 .7 1.6 1.3 1.8-.3-1.3 0-2.6.4-4Z" />
      <path d="M8 11h8l-1.5 3h-5L8 11Z" />
      <path d="M10.5 14l.8 7.5h1.4l.8-7.5" />
    </svg>
  );
}
