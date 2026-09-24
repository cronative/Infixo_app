"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export type ModalSize = "sm" | "md" | "lg" | "xl";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: ModalSize;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  role?: "dialog" | "alertdialog";
  ariaLabel?: string;
  className?: string;
  headerClassName?: string;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "max-w-md", // ~448px (Confirmations, Alerts)
  md: "max-w-xl", // ~576px (Standard Forms, Settings)
  lg: "max-w-2xl", // ~672px (Detailed Forms, Series, Gigs)
  xl: "max-w-4xl", // ~896px (Complex Content, Previews)
};

export function Modal({
  isOpen,
  onClose,
  children,
  size = "md",
  title,
  description,
  icon,
  showCloseButton = true,
  closeOnBackdropClick = false,
  closeOnEscape = true,
  role = "dialog",
  ariaLabel,
  className = "",
  headerClassName = "",
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Background Scroll Lock & Escape Key Handler
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.scrollTo(0, scrollY);
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      role={role}
      aria-modal="true"
      aria-label={ariaLabel || title}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[999] w-screen h-[100dvh] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/50 animate-in fade-in duration-150"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${SIZE_CLASSES[size]} max-h-[92dvh] sm:max-h-[calc(100dvh-48px)] bg-white rounded-t-2xl sm:rounded-xl border border-[#e2e8f0] shadow-xl flex flex-col overflow-hidden text-left pb-[env(safe-area-inset-bottom)] sm:pb-0 animate-sheet-in ${className}`}
      >
        {/* Grab handle — mobile bottom-sheet affordance */}
        <div className="flex justify-center pt-2 sm:hidden" aria-hidden="true">
          <span className="h-1 w-9 rounded-full bg-[#cbd5e1]" />
        </div>

        {/* Optional Automatic Header */}
        {(title || showCloseButton) && (
          <div className={`flex items-center justify-between border-b border-[#e2e8f0] bg-white px-4 sm:px-5 py-3 shrink-0 ${headerClassName}`}>
            <div className="flex items-center gap-3 min-w-0 pr-2">
              {icon && (
                <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1f5f9] text-[#475569] shrink-0">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h3 className="text-base font-semibold text-[#0f172a] truncate">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-xs text-[#64748b] truncate mt-0.5">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Modal Content */}
        {children}
      </div>
    </div>,
    document.body
  );
}

export function ModalHeader({
  title,
  description,
  icon,
  onClose,
  showCloseButton = true,
  className = "",
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between border-b border-[#e2e8f0] bg-white px-4 sm:px-5 py-3 shrink-0 ${className}`}>
      <div className="flex items-center gap-3 min-w-0 pr-2">
        {icon && (
          <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1f5f9] text-[#475569] shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-[#0f172a] truncate">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-[#64748b] truncate mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>

      {showCloseButton && onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors cursor-pointer shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function ModalBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function ModalFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-end gap-2 border-t border-[#e2e8f0] bg-white px-4 sm:px-5 py-3 shrink-0 ${className}`}>
      {children}
    </div>
  );
}
