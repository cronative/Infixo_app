"use client";

import { AlertCircle } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  description = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  isDestructive = false,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      role="alertdialog"
      showCloseButton={!loading}
      closeOnEscape={!loading}
      closeOnBackdropClick={!loading}
    >
      <ModalBody className="p-5 sm:p-6 space-y-3">
        <div className="flex items-start gap-3.5">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs ${isDestructive ? "bg-rose-50 text-[#ef4444] border border-rose-200" : "bg-[#f1f5f9] text-[#3a2447] border border-[#e2e8f0]"
            }`}>
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1 min-w-0 flex-1 text-left">
            <h3 className="font-display text-base font-bold text-[#3a2447] leading-snug">
              {title}
            </h3>
            <p className="text-xs font-medium text-[#475569] leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="px-5 sm:px-6 py-3.5">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 rounded-xl border border-[#e2e8f0] bg-white text-xs font-semibold text-[#3a2447] hover:bg-[#f8fafc] transition-colors cursor-pointer disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`font-semibold text-xs py-2 px-4.5 rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50 text-white ${isDestructive ? "bg-[#ef4444] hover:bg-rose-600" : "bg-[#3a2447] hover:bg-[#1e293b]"
            }`}
        >
          <span>{loading ? "Processing..." : confirmText}</span>
        </button>
      </ModalFooter>
    </Modal>
  );
}
