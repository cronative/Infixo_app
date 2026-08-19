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
    ? "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FAF8FF]/95 backdrop-blur-xl px-4 text-center selection:bg-purple-100"
    : "flex flex-col items-center justify-center p-12 text-center w-full min-h-[320px]";

  return (
    <div className={containerClass}>
      {/* Glowing Ambient Light Orbs */}
      <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-purple-400/20 blur-3xl animate-pulse-glow" />

      <div className="relative z-10 flex flex-col items-center space-y-6 max-w-sm">
        {/* Animated Brand Logo Container */}
        <div className="relative flex h-20 w-20 items-center justify-center">
          {/* Pulsing Outer Glow Ring */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#782BFB] to-[#500CD6] opacity-30 blur-md animate-ping" />

          {/* Rotating Subtle Dashed Border Ring */}
          <div
            className="absolute -inset-2.5 rounded-[30px] border-2 border-dashed border-purple-500/40 animate-spin"
            style={{ animationDuration: "8s" }}
          />

          {/* Core Inflixo Logo Badge */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#782BFB] via-[#6512FA] to-[#500CD6] text-white shadow-2xl shadow-purple-600/40 border border-white/30">
            <InflixoLogoIcon className="h-9 w-9 text-white animate-pulse" />
          </div>
        </div>

        {/* Syncing Status Information */}
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <h3 className="font-display text-lg font-black tracking-tight text-slate-900">
              Inflixo
            </h3>
            <span className="rounded-full bg-purple-100 border border-purple-200 px-2.5 py-0.5 text-[10px] font-black text-[#6512FA] uppercase tracking-wider">
              Syncing
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-600 min-h-[20px]">
            {message}{dots}
          </p>
        </div>

        {/* Subtle Horizontal Progress Pulse Bar */}
        <div className="h-1.5 w-48 overflow-hidden rounded-full bg-purple-100 border border-purple-200/60">
          <div
            className="h-full w-full bg-gradient-to-r from-[#782BFB] via-[#6512FA] to-[#500CD6] animate-shimmer"
            style={{ backgroundSize: "200% 100%" }}
          />
        </div>
      </div>
    </div>
  );
}
