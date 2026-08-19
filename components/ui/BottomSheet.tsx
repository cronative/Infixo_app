"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Dimmed Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* Sheet Container */}
      <div className="relative w-full max-w-lg rounded-t-[28px] sm:rounded-3xl bg-white p-6 shadow-2xl transition-transform animate-slide-up z-10 safe-bottom max-h-[85dvh] flex flex-col">
        {/* Drag Handle for Mobile */}
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4 shrink-0 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 shrink-0">
          <h3 className="text-base font-black text-[#0F172A]">{title || ""}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
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
