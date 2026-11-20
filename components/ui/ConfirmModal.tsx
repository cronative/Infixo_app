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
          <AlertCircle className="h-5 w-5 text-[#C21B5C]" />
        )
      }
      iconBoxClassName={
        isDestructive
          ? "bg-rose-50 border border-rose-200 text-rose-600"
          : "bg-[#FFF6F2] border border-[#FFEDE6] text-[#C21B5C]"
      }
      wrapHeader
    >
      <ModalBody className="p-5 sm:p-6 text-left">
        <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
          {description}
        </p>
      </ModalBody>

      <ModalFooter className="px-5 sm:px-6 py-3.5">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          autoFocus={focusCancel}
          className="h-10 px-5 rounded-[5px] border border-[#ECECF0] bg-white text-xs font-semibold text-[#6B6B76] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors cursor-pointer disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`h-10 font-semibold text-xs px-5 rounded-[5px] transition-all cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50 text-white ${
            isDestructive
              ? "bg-[#DC2626] hover:bg-[#B91C1C]"
              : "bg-[#C21B5C] hover:bg-[#A3164E]"
          }`}
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <span>{loading ? "Processing..." : confirmText}</span>
        </button>
      </ModalFooter>
    </Modal>
  );
}
