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
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-2xs ${
            isDestructive ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-[#F7EDF3] text-[#803D63] border border-[#ECE8EB]"
          }`}>
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1 min-w-0 flex-1 text-left">
            <h3 className="font-display text-base font-bold text-[#17131A] leading-snug">
              {title}
            </h3>
            <p className="text-xs font-medium text-[#6F6872] leading-relaxed">
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
          className="px-4 py-2 rounded-xl border border-[#ECE8EB] text-xs font-semibold text-[#6F6872] hover:bg-[#FAF8FA] hover:text-[#17131A] transition-colors cursor-pointer disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`font-semibold text-xs py-2 px-4.5 rounded-xl transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5 disabled:opacity-50 text-white ${
            isDestructive ? "bg-rose-600 hover:bg-rose-700" : "bg-[#803D63] hover:bg-[#6F3456]"
          }`}
        >
          <span>{loading ? "Processing..." : confirmText}</span>
        </button>
      </ModalFooter>
    </Modal>
  );
}
