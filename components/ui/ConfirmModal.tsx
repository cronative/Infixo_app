"use client";

import { AlertCircle, Trash2, Loader2 } from "lucide-react";
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
  /** Focus Cancel when the dialog opens (safer default for destructive actions). */
  focusCancel?: boolean;
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
  focusCancel = false,
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
      title={title}
      description={isDestructive ? "This action cannot be undone." : "Please review before proceeding."}
      icon={
        isDestructive ? (
          <Trash2 className="h-5 w-5 text-rose-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-[#7A2253]" />
        )
      }
      iconBoxClassName={
        isDestructive
          ? "bg-rose-50 border border-rose-200 text-rose-600"
          : "bg-[#FFF0F5] border border-[#FCE7F1] text-[#7A2253]"
      }
      wrapHeader
    >
      <ModalBody className="p-5 sm:p-6 text-left">
        <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
          {description}
        </p>
      </ModalBody>

      <ModalFooter className="px-5 sm:px-6 py-3.5">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          autoFocus={focusCancel}
          className="h-10 px-5 rounded-[5px] border border-[#e2e8f0] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`h-10 font-semibold text-xs px-5 rounded-[5px] transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5 disabled:opacity-50 text-white ${
            isDestructive
              ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
              : "bg-[#7A2253] hover:opacity-95 shadow-[#7A2253]/20"
          }`}
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <span>{loading ? "Processing..." : confirmText}</span>
        </button>
      </ModalFooter>
    </Modal>
  );
}
