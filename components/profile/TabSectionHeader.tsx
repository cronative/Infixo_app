import React, { ReactNode } from "react";

export interface TabSectionHeaderProps {
  title: string;
  subtitle: string;
  action?: ReactNode;
  primaryTextColor?: string;
  secondaryTextColor?: string;
  headingFontFamily?: string;
  className?: string;
}

export function TabSectionHeader({
  title,
  subtitle,
  action,
  primaryTextColor,
  secondaryTextColor,
  headingFontFamily,
  className = "",
}: TabSectionHeaderProps) {
  return (
    <div className={`w-full text-left ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h2
          style={{
            color: primaryTextColor,
            fontFamily: headingFontFamily,
            fontWeight: 800,
          }}
          className="text-lg sm:text-xl font-extrabold tracking-tight"
        >
          {title}
        </h2>

        {action && <div className="shrink-0">{action}</div>}
      </div>

      <p
        style={{ color: secondaryTextColor }}
        className="mt-1 mb-3 text-sm text-(--text-muted) font-normal leading-normal whitespace-normal break-words"
      >
        {subtitle}
      </p>
    </div>
  );
}

export const TAB_SECTION_CONTAINER_CLASS = "relative z-10 w-full text-left animate-fade-in";

export function TabSectionBody({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} className={`w-full ${className}`}>
      {children}
    </div>
  );
}
