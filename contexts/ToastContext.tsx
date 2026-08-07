"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { ToastMessage } from "@/types";
import { generateId } from "@/utils/format";

interface ToastContextValue {
  showToast: (message: string, type?: ToastMessage["type"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage["type"] = "success") => {
    const id = generateId("toast");
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-toast-in flex w-full max-w-sm items-center gap-2.5 rounded-2xl border border-inflixo-border bg-white/95 px-4 py-3 shadow-elevated backdrop-blur"
            style={{ boxShadow: "var(--shadow-elevated)" }}
          >
            {t.type === "success" && <CheckCircle2 className="h-5 w-5 shrink-0 text-inflixo-purple" />}
            {t.type === "error" && <XCircle className="h-5 w-5 shrink-0 text-rose-500" />}
            {t.type === "info" && <Info className="h-5 w-5 shrink-0 text-blue-500" />}
            <p className="flex-1 text-sm font-medium text-inflixo-navy">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-full p-1 text-muted hover:bg-surface-muted"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
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
