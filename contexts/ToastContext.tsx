"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { Check, Sparkles, AlertCircle, X } from "lucide-react";
import { ToastMessage } from "@/types";
import { generateId } from "@/utils/format";

interface ToastContextValue {
  showToast: (message: string, type?: ToastMessage["type"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  let chipClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
  let borderClass = "border-gray-200";
  let progressClass = "bg-emerald-500";
  let icon = <Check className="h-4 w-4 stroke-[3]" />;

  if (toast.type === "error") {
    chipClass = "bg-rose-50 text-rose-600 border-rose-100";
    borderClass = "border-rose-200";
    progressClass = "bg-rose-500";
    icon = <AlertCircle className="h-4 w-4 stroke-[2.5]" />;
  } else if (toast.type === "info") {
    chipClass = "bg-indigo-50 text-[#803D63] border-indigo-100";
    borderClass = "border-indigo-100";
    progressClass = "bg-[#803D63]";
    icon = <Sparkles className="h-4 w-4 text-[#803D63]" />;
  }

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden flex w-full max-w-sm items-center gap-3 rounded-xl border bg-white p-3.5 shadow-lg shadow-gray-200/50 transition-all animate-in fade-in slide-in-from-bottom-5 duration-300 ${borderClass}`}
    >
      {/* Icon Chip */}
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${chipClass}`}>
        {icon}
      </div>

      {/* Message */}
      <p className="flex-1 text-sm font-medium text-[#111827] leading-snug text-left">
        {toast.message}
      </p>

      {/* Close Button */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
        aria-label="Dismiss Toast"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Bottom Thin Countdown Progress Line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-100 overflow-hidden rounded-b-xl">
        <div
          className={`h-full ${progressClass}`}
          style={{
            animation: "toastProgress 3.5s linear forwards",
          }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage["type"] = "success") => {
    const id = generateId("toast");
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Fixed Bottom-Right Toast Viewport Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
