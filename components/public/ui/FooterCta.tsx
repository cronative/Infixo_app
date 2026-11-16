"use client";

import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PLAIN_FOOTER_CTA, SECTION_FOOTER_CTA } from "./tokens";

export interface FooterCtaProps {
  /** Label, e.g. "View all series (12)". */
  children: ReactNode;
  /** Renders a Link; without it the bar is a button. */
  href?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  onPointerEnter?: () => void;
  "aria-expanded"?: boolean;
  /** Tabs layout: plain accent text bar instead of the tinted section footer. */
  plain?: boolean;
  /** Replaces the default → arrow (e.g. a rotating chevron for "Show more"). */
  trailing?: ReactNode;
  className?: string;
}

/** Full-width 44px "View all" bar at the bottom of a Section (a link, or a button when there is no href). */
export function FooterCta(props: FooterCtaProps) {
  const cls = `${props.plain ? PLAIN_FOOTER_CTA : SECTION_FOOTER_CTA} ${props.className ?? ""}`;
  const content = (
    <>
      <span>{props.children}</span>
      {props.trailing ?? <ArrowRight className="h-3.5 w-3.5 shrink-0" />}
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
