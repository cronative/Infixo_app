"use client";

import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BOXED_FOOTER_CTA, SECTION_FOOTER_CTA } from "./tokens";

export interface FooterCtaProps {
  /** Label, e.g. "View all series (12)". */
  children: ReactNode;
  /** Renders a Link; without it the bar is a button. */
  href?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  onPointerEnter?: () => void;
  "aria-expanded"?: boolean;
  /** Bordered button inside the section padding instead of a full-bleed bar. */
  boxed?: boolean;
  /** Replaces the default → arrow (e.g. a rotating chevron for "Show more"). */
  trailing?: ReactNode;
  className?: string;
}

/** Full-width 44px "View all" bar at the bottom of a Section (a link, or a button when there is no href). */
export function FooterCta(props: FooterCtaProps) {
  const cls = `${props.boxed ? BOXED_FOOTER_CTA : SECTION_FOOTER_CTA} ${props.className ?? ""}`;
  const content = (
    <>
      <span>{props.children}</span>
      {props.trailing ?? <ArrowRight className={`${props.boxed ? "h-4 w-4" : "h-3.5 w-3.5"} shrink-0`} />}
    </>
  );
  if (props.href !== undefined) {
    return (
      <Link href={props.href} onClick={props.onClick} className={cls}>
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={props.onClick}
      onPointerEnter={props.onPointerEnter}
      aria-expanded={props["aria-expanded"]}
      className={cls}
    >
      {content}
    </button>
  );
}
