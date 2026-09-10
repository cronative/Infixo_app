"use client";

import React, { useEffect, useState, useRef } from "react";
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
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted || !isOpen) return null;

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
      className="fixed inset-0 z-[999] w-screen h-[100dvh] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${SIZE_CLASSES[size]} max-h-[calc(100dvh-32px)] sm:max-h-[calc(100dvh-48px)] bg-white rounded-2xl border border-[#e2e8f0] shadow-xl flex flex-col overflow-hidden text-left animate-in zoom-in-95 duration-150 ${className}`}
      >
        {/* Optional Automatic Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-white px-5 sm:px-6 py-3.5 sm:py-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              {icon && (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f1f5f9] text-[#3a2447] shrink-0">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#3a2447] truncate">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-xs text-[#475569] font-medium truncate mt-0.5">
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
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[#64748b] hover:text-[#3a2447] hover:bg-[#f1f5f9] transition-colors cursor-pointer shrink-0 border border-transparent hover:border-[#e2e8f0]"
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
    <div className={`flex items-center justify-between border-b border-[#e2e8f0] bg-white px-5 sm:px-6 py-3.5 sm:py-4 shrink-0 ${className}`}>
      <div className="flex items-center gap-3 min-w-0 pr-2">
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f1f5f9] text-[#3a2447] shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-display text-base sm:text-lg font-bold text-[#3a2447] truncate">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-[#475569] font-medium truncate mt-0.5">
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
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[#64748b] hover:text-[#3a2447] hover:bg-[#f1f5f9] transition-colors cursor-pointer shrink-0 border border-transparent hover:border-[#e2e8f0]"
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
    <div className={`flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 sm:py-5 ${className}`}>
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
    <div className={`flex items-center justify-end gap-2.5 border-t border-[#e2e8f0] bg-white px-5 sm:px-6 py-3.5 shrink-0 ${className}`}>
      {children}
    </div>
  );
}
