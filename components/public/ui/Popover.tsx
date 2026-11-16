"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { POPOVER_LINE } from "./tokens";

export interface PopoverProps {
  open: boolean;
  onClose: () => void;
  /** The button that toggles the popover (rendered inside the anchor). */
  trigger: ReactNode;
  /** Accessible name of the dialog. */
  label: string;
  /** Panel edge aligned to the anchor. */
  align?: "left" | "right";
  /** Panel width class, e.g. "w-[260px]". */
  widthClassName: string;
  /** Anchor wrapper classes (it is always `relative`). */
  className?: string;
  panelClassName?: string;
  children: ReactNode;
}

/**
 * Anchored popover with a small arrow under the trigger. Closes on a pointer
 * down outside the anchor and on Escape. Card surface, accent frame, 5px radius.
 */
export function Popover({ open, onClose, trigger, label, align = "left", widthClassName, className = "", panelClassName = "", children }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) closeRef.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {trigger}
      {open && (
        <span
          data-popover-arrow
          aria-hidden
          className={`absolute left-1/2 top-[calc(100%+3px)] z-50 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-l border-t ${POPOVER_LINE} bg-(--card-bg)`}
        />
      )}
      {open && (
        <div
          role="dialog"
          aria-label={label}
          className={`absolute ${align === "left" ? "left-0" : "right-0"} top-[calc(100%+8px)] z-40 ${widthClassName} rounded-[5px] border ${POPOVER_LINE} bg-(--card-bg) p-2 text-left backdrop-blur-md ${panelClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
