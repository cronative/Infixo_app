"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CreatorGridBackground } from "@/components/shared/CreatorGridBackground";
import { CREATOR_QUOTES, getRandomQuoteIndex } from "@/data/creatorQuotes";

export function SyncingLoader({
  message = "Preparing your creator profile...",
  fullScreen = true,
  hideProgressBar = false,
}: {
  message?: string;
  fullScreen?: boolean;
  hideProgressBar?: boolean;
}) {
  const [dots, setDots] = useState(".");
  const [quoteIndex, setQuoteIndex] = useState(() => getRandomQuoteIndex());
  const [isFading, setIsFading] = useState(false);
  const [progress, setProgress] = useState(20);

  // Syncing dots animation (every 450ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 450);
    return () => clearInterval(interval);
  }, []);

  // Smooth progress bar advancement
  useEffect(() => {
    const pInterval = setInterval(() => {
      setProgress((prev) => (prev >= 92 ? 96 : prev + Math.floor(Math.random() * 6) + 2));
    }, 350);
    return () => clearInterval(pInterval);
  }, []);

  // 5-second smooth quote rotation timer with fade effect
  useEffect(() => {
    const timer = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % CREATOR_QUOTES.length);
        setIsFading(false);
      }, 300);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const containerClass = fullScreen
    ? "fixed inset-0 z-[9999] flex flex-col items-center justify-center px-4 text-center selection:bg-slate-200 overflow-hidden"
    : "flex flex-col items-center justify-center p-8 text-center w-full min-h-[320px]";

  const currentQuote = CREATOR_QUOTES[quoteIndex] || CREATOR_QUOTES[0];

  return (
    <div className={containerClass}>
      {/* Same background as login page */}
      {fullScreen && <CreatorGridBackground showWordmark variant="soft" wordmarkPlacement="center-bottom" />}
      <div className="relative z-10 flex flex-col items-center max-w-lg w-full space-y-4">
        {/* Animated Brand Logo Container */}
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-[22px] bg-[#151933]/10 blur-xl" />
          <div className="absolute inset-1 rounded-[18px] bg-[#151933]/12 animate-ping opacity-20" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#151933] shadow-[0_14px_36px_rgba(21,25,51,0.16)]">
            <Image
              src="/images/inflixo-logo-icon-white-transparent.png"
              alt="Inflixo"
              width={64}
              height={64}
              className="h-8 w-8 object-contain"
              priority
            />
          </div>
        </div>

        {/* Syncing Status Information */}
        <div className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <h3 className="font-display text-sm font-black text-[#151933] tracking-tight">
              Inflixo
            </h3>
            <span className="rounded-full bg-[#151933]/[0.07] border border-[#151933]/15 px-2 py-0.5 text-[9px] font-black text-[#151933] uppercase tracking-wider">
              Syncing
            </span>
          </div>

          <p className="text-xs font-semibold text-[#64748b] min-h-[18px]">
            {message}{dots}
          </p>
        </div>

        {/* Horizontal Progress Bar */}
        {!hideProgressBar && (
          <div className="w-48 space-y-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-[#151933] to-[#A24B5A] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Compact Motivational Quote */}
        <div className="min-h-[52px] flex items-center justify-center px-4 w-full">
          <p
            className={`max-w-xl text-base sm:text-xl font-black italic text-[#151933] leading-snug text-center transition-opacity duration-300 ${isFading ? "opacity-0" : "opacity-100"
              }`}
          >
            &ldquo;{currentQuote}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
