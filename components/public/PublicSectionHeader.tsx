"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { getPublicTheme, PUBLIC_TYPE } from "@/components/public/publicTheme";

interface PublicSectionHeaderProps {
  themeKey: string;
  title: ReactNode;
  icon?: ReactNode;
  /** Small muted text on the right, e.g. "4 series". */
  meta?: ReactNode;
  /** Optional one-line description under the title. */
  description?: ReactNode;
  /** "View all" style link on the right. */
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}

/** The one section heading used across all public pages. */
export function PublicSectionHeader({
  themeKey,
  title,
  icon,
  meta,
  description,
  action,
  className = "",
}: PublicSectionHeaderProps) {
  const t = getPublicTheme(themeKey);
  const c = t.colors;

  const actionContent = action ? (
    <>
      <span>{action.label}</span>
      <ChevronRight className="h-3.5 w-3.5" />
    </>
  ) : null;
  const actionClass = `tap-scale inline-flex min-h-8 shrink-0 items-center gap-0.5 rounded-lg px-1 ${PUBLIC_TYPE.label} transition-opacity hover:opacity-75`;

  return (
    <div className={`px-0.5 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 style={t.headingStyle} className={`flex min-w-0 items-center gap-2 ${PUBLIC_TYPE.sectionTitle}`}>
          {icon ? <span className="flex shrink-0 items-center opacity-70">{icon}</span> : null}
          <span className="min-w-0 break-words">{title}</span>
        </h2>
        {action ? (
          action.href ? (
            <Link href={action.href} onClick={action.onClick} style={{ color: c.accentText }} className={actionClass}>
              {actionContent}
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} style={{ color: c.accentText }} className={`${actionClass} cursor-pointer`}>
              {actionContent}
            </button>
          )
        ) : meta ? (
          <span style={{ color: c.mutedText }} className={`shrink-0 ${PUBLIC_TYPE.meta}`}>{meta}</span>
        ) : null}
      </div>
      {description ? (
        <p style={{ color: c.secondaryText }} className={`mt-0.5 ${PUBLIC_TYPE.metaRegular}`}>{description}</p>
      ) : null}
    </div>
  );
}
