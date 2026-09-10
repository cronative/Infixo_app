"use client";

import { useEffect } from "react";
import { debugError } from "@/lib/debugLogger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    debugError("APP_ERROR_BOUNDARY", "Uncaught client error:", error?.message, error?.stack);
    console.error("🚨 Uncaught error on page:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 bg-[#FCF7F3] text-[#241618]">
      <div className="w-full max-w-md rounded-2xl border border-[#E4DAD5] bg-white p-6 shadow-md text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          ⚠️
        </div>
        <h2 className="text-xl font-bold tracking-tight text-[#241618]">
          Something went wrong
        </h2>
        <p className="text-xs text-[#6B5A5D] bg-slate-50 p-3 rounded-lg border border-slate-200 text-left font-mono break-words">
          {error?.message || "An unexpected error occurred while loading this page."}
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="rounded-xl bg-[#151933] hover:bg-[#2c1937] px-5 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl border border-[#E4DAD5] bg-white hover:bg-slate-50 px-5 py-2.5 text-xs font-bold text-[#241618] transition-colors cursor-pointer"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}
