"use client";

import { useEffect, useRef } from "react";
import { Pencil, ExternalLink, FileSpreadsheet, Trash2 } from "lucide-react";

interface SeriesRowActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onViewLive: () => void;
  onImportCsv: () => void;
  onDelete: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function SeriesRowActionMenu({
  isOpen,
  onClose,
  onEdit,
  onViewLive,
  onImportCsv,
  onDelete,
  triggerRef,
}: SeriesRowActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        onClose();
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef?.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }

    function handleScroll(e: Event) {
      if (menuRef.current?.contains(e.target as Node)) return;
      onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Series options"
      onClick={(e) => e.stopPropagation()}
      className="absolute right-0 top-full mt-1 z-40 w-44 rounded-[5px] border border-[#e2e8f0] bg-white p-1 shadow-lg shadow-slate-900/10 animate-in fade-in zoom-in-95 duration-100"
    >
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onClose();
          onEdit();
        }}
        className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-1.5 text-xs font-medium text-[#0f172a] hover:bg-[#f8fafc] transition-colors cursor-pointer text-left"
      >
        <Pencil className="h-3.5 w-3.5 text-[#64748b]" />
        <span>Edit details</span>
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onClose();
          onViewLive();
        }}
        className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-1.5 text-xs font-medium text-[#0f172a] hover:bg-[#f8fafc] transition-colors cursor-pointer text-left"
      >
        <ExternalLink className="h-3.5 w-3.5 text-[#64748b]" />
        <span>View live</span>
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onClose();
          onImportCsv();
        }}
        className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-1.5 text-xs font-medium text-[#0f172a] hover:bg-[#f8fafc] transition-colors cursor-pointer text-left"
      >
        <FileSpreadsheet className="h-3.5 w-3.5 text-[#64748b]" />
        <span>Import CSV</span>
      </button>

      <div className="my-1 border-t border-slate-100" />

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onClose();
          onDelete();
        }}
        className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer text-left"
      >
        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
        <span>Delete Series</span>
      </button>
    </div>
  );
}
