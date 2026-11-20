"use client";

import { ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Close on Escape while open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label={title || undefined} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Dimmed Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* Sheet Container */}
      <div className="relative w-full max-w-lg rounded-t-[5px] sm:rounded-[5px] bg-white p-6 shadow-lg transition-transform animate-slide-up z-10 safe-bottom max-h-[85dvh] flex flex-col">
        {/* Drag Handle for Mobile */}
        <div className="w-12 h-1 bg-zinc-200 rounded-full mx-auto mb-4 shrink-0 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#ECECF0] shrink-0">
          <h3 className="text-base font-semibold text-[#18181B]">{title || ""}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#6B6B76] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 text-left">{children}</div>
      </div>
    </div>
  );
}
