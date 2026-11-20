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
  // Start at 0 so server and client render the same text (avoids a hydration mismatch),
  // then pick a random quote once mounted.
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [progress, setProgress] = useState(20);

  useEffect(() => {
    setQuoteIndex(getRandomQuoteIndex());
  }, []);

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
    ? "fixed inset-0 z-[9999] flex flex-col items-center justify-center px-4 text-center selection:bg-zinc-200 overflow-hidden"
    : "flex flex-col items-center justify-center p-8 text-center w-full min-h-[320px]";

  const currentQuote = CREATOR_QUOTES[quoteIndex] || CREATOR_QUOTES[0];

  return (
    <div className={containerClass}>
      {/* Same background as login page */}
      {fullScreen && <CreatorGridBackground showWordmark variant="soft" wordmarkPlacement="center-bottom" />}
      <div className="relative z-10 flex flex-col items-center max-w-lg w-full space-y-4">
        {/* Animated Brand Logo Container */}
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-[22px] bg-[#C21B5C]/15 blur-xl" />
          <div className="absolute inset-1 rounded-[18px] bg-[#C21B5C]/15 animate-ping opacity-25" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-[5px] overflow-hidden shadow-[0_14px_36px_rgba(194, 27, 92,0.25)] border border-[#C21B5C]/20">
            <Image
              src="/images/inflixo-logo-3d.png"
              alt="Inflixo"
              width={120}
              height={120}
              className="h-full w-full object-cover select-none"
              priority
            />
          </div>
        </div>

        {/* Syncing Status Information */}
        <div className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <h3 className="font-display text-sm font-black text-[#C21B5C] tracking-tight">
              Inflixo
            </h3>
            <span className="rounded-full bg-[#C21B5C]/[0.07] border border-[#C21B5C]/15 px-2 py-0.5 text-[9px] font-black text-[#C21B5C] uppercase tracking-wider">
              Syncing
            </span>
          </div>

          <p className="text-xs font-semibold text-[#6B6B76] min-h-[18px]">
            {message}{dots}
          </p>
        </div>

        {/* Horizontal Progress Bar */}
        {!hideProgressBar && (
          <div className="w-48 space-y-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 border border-zinc-200">
              <div
                className="h-full bg-gradient-to-r from-[#C21B5C] to-[#A24B5A] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Compact Motivational Quote */}
        <div className="min-h-[52px] flex items-center justify-center px-4 w-full">
          <p
            className={`max-w-xl text-base sm:text-xl font-black italic text-[#C21B5C] leading-snug text-center transition-opacity duration-300 ${isFading ? "opacity-0" : "opacity-100"
              }`}
          >
            &ldquo;{currentQuote}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
