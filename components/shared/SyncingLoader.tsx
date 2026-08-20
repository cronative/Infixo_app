"use client";

import { useEffect, useState } from "react";
import { InflixoLogoIcon } from "@/components/shared/Logo";

export function SyncingLoader({
  message = "Syncing your creator profile & content...",
  fullScreen = true,
}: {
  message?: string;
  fullScreen?: boolean;
}) {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 450);
    return () => clearInterval(interval);
  }, []);

  const containerClass = fullScreen
    ? "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-md px-4 text-center selection:bg-purple-100"
    : "flex flex-col items-center justify-center p-12 text-center w-full min-h-[320px]";

  return (
    <div className={containerClass}>
      <div className="relative z-10 flex flex-col items-center space-y-5 max-w-sm">
        {/* Animated Brand Logo Container */}
        <div className="relative flex h-16 w-16 items-center justify-center">
          {/* Core Inflixo Logo Badge */}
          <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-[#6366F1] text-white border border-[#6366F1]">
            <InflixoLogoIcon className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Syncing Status Information */}
        <div className="space-y-1.5 text-center">
          <div className="flex items-center justify-center gap-2">
            <h3 className="font-display text-base font-bold text-slate-900">
              Inflixo
            </h3>
            <span className="rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-[10px] font-bold text-[#6366F1] uppercase tracking-wider">
              Syncing
            </span>
          </div>

          <p className="text-xs font-medium text-slate-600 min-h-[20px]">
            {message}{dots}
          </p>
        </div>

        {/* Subtle Horizontal Progress Pulse Bar */}
        <div className="h-1 w-44 overflow-hidden rounded-full bg-slate-100 border border-slate-200">
          <div className="h-full w-full bg-[#6366F1] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
