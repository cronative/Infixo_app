"use client";

import type { CSSProperties, MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { SECTION_ROW, SECTION_ROW_HOVER } from "./tokens";

/** Default row box: 16px sides, 10px vertical, ≥44px tall, accent @ 4% hover. */
export const LIST_ROW_PAD = `${SECTION_ROW} py-2.5 ${SECTION_ROW_HOVER}`;
const ARROW = "h-4 w-4 shrink-0 text-(--text-muted) transition-colors group-hover:text-(--text)";

export interface ListRowProps {
  /** Link target. External links open in a new tab. Without href (and onClick) the row is a plain div. */
  href?: string;
  external?: boolean;
  /** rel for external links (default "noopener noreferrer"). */
  rel?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  "aria-label"?: string;
  /** Icon, thumbnail or avatar on the left. */
  leading?: ReactNode;
  /** Title text: clamped to 2 lines, full text in the tooltip. */
  title: string;
  titleClassName?: string;
  titleStyle?: CSSProperties;
  /** A string renders as a muted line; any other node renders as given. */
  subtitle?: ReactNode;
  subtitleClassName?: string;
  subtitleStyle?: CSSProperties;
  /** Trailing meta (price, platform icon, social buttons) before the arrow. */
  meta?: ReactNode;
  /** Trailing arrow: ↗ for external, › for internal pages, or a custom node. */
  arrow?: "external" | "chevron" | ReactNode;
  /** Box classes (padding, gap, hover). Defaults to LIST_ROW_PAD with a 12px gap. */
  className?: string;
}

/** One divided row inside a Section: leading thumb · 2-line title + subtitle · meta · arrow. */
export function ListRow({
  href,
  external = false,
  rel = "noopener noreferrer",
  onClick,
  "aria-label": ariaLabel,
  leading,
  title,
  titleClassName = "text-[13px] font-medium leading-[18px] text-(--text)",
  titleStyle,
  subtitle,
  subtitleClassName = "text-xs text-(--text-muted)",
  subtitleStyle,
  meta,
  arrow,
  className = `gap-3 ${LIST_ROW_PAD}`,
}: ListRowProps) {
  const cls = `group flex items-center ${className}`;
  const body = (
    <>
      {leading}
      <span className="min-w-0 flex-1">
        <span style={titleStyle} title={title} className={`line-clamp-2 break-words ${titleClassName}`}>
          {title}
        </span>
        {subtitle != null && subtitle !== "" &&
          (typeof subtitle === "string" ? (
            <span style={subtitleStyle} className={`block break-words ${subtitleClassName}`}>
              {subtitle}
            </span>
          ) : (
            subtitle
          ))}
      </span>
      {meta}
      {arrow === "external" ? <ArrowUpRight className={ARROW} /> : arrow === "chevron" ? <ChevronRight className={ARROW} /> : arrow}
    </>
  );

  if (href && external) {
    return (
      <a href={href} target="_blank" rel={rel} onClick={onClick} aria-label={ariaLabel} className={cls}>
        {body}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} onClick={onClick} aria-label={ariaLabel} className={cls}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-label={ariaLabel} className={`${cls} w-full text-left cursor-pointer`}>
        {body}
      </button>
    );
  }
  return <div className={cls}>{body}</div>;
}
