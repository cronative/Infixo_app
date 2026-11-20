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
        {/* Animated brand logo: the gradient Inflixo wordmark with a soft glow */}
        <div className="relative flex items-center justify-center px-6 py-3">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF6A1A]/20 to-[#E8246F]/20 blur-2xl" />
          <Image
            src="/images/inflixo-wordmark-title-gulaal.png"
            alt="Inflixo"
            width={628}
            height={186}
            className="relative h-12 w-auto select-none animate-pulse motion-reduce:animate-none"
            priority
          />
        </div>

        {/* Syncing Status Information */}
        <div className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-1.5">
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
                className="h-full bg-gradient-to-r from-[#FF6A1A] to-[#E8246F] transition-all duration-300 ease-out"
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
