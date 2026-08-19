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
    }, 3800);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Top Floating Toast Notification Layer */}
      <div className="fixed inset-x-0 top-4 sm:top-6 z-[100] flex flex-col items-center gap-2.5 px-4 pointer-events-none">
        {toasts.map((t) => {
          let bgClass = "bg-gradient-to-r from-slate-950 via-purple-950 to-indigo-950 text-white border-purple-400/40";
          let icon = <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />;

          if (t.type === "error") {
            bgClass = "bg-gradient-to-r from-rose-950 via-rose-900 to-slate-950 text-white border-rose-400/40";
            icon = <XCircle className="h-5 w-5 shrink-0 text-rose-300" />;
          } else if (t.type === "info") {
            bgClass = "bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 text-white border-indigo-400/40";
            icon = <Info className="h-5 w-5 shrink-0 text-sky-400" />;
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto animate-in slide-in-from-top-5 fade-in duration-300 flex w-full max-w-md items-center gap-3.5 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${bgClass}`}
              style={{ boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.45)" }}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/15 shadow-2xs">
                {icon}
              </div>
              <p className="flex-1 text-xs sm:text-sm font-extrabold text-white leading-relaxed">
                {t.message}
              </p>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-full p-1.5 text-white/60 hover:bg-white/20 hover:text-white transition-all"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
