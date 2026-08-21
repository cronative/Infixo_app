"use client";

import { useEffect, useState } from "react";
import { Sparkles, Quote } from "lucide-react";
import { InflixoLogoIcon } from "@/components/shared/Logo";
import { CREATOR_QUOTES, getRandomQuoteIndex } from "@/data/creatorQuotes";

export function SyncingLoader({
  message = "Syncing your creator profile & content...",
  fullScreen = true,
}: {
  message?: string;
  fullScreen?: boolean;
}) {
  const [dots, setDots] = useState(".");
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [progress, setProgress] = useState(15);

  // Pick a random starting quote on every mount / page load
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
      setProgress((prev) => (prev >= 92 ? 95 : prev + Math.floor(Math.random() * 8) + 3));
    }, 400);
    return () => clearInterval(pInterval);
  }, []);

  // 5-second smooth quote rotation timer with fade effect
  useEffect(() => {
    const timer = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % CREATOR_QUOTES.length);
        setIsFading(false);
      }, 400);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const containerClass = fullScreen
    ? "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-md px-4 text-center selection:bg-purple-100"
    : "flex flex-col items-center justify-center p-8 text-center w-full min-h-[360px]";

  const currentQuote = CREATOR_QUOTES[quoteIndex] || CREATOR_QUOTES[0];

  return (
    <div className={containerClass}>
      <div className="relative z-10 flex flex-col items-center space-y-5 max-w-md w-full">
        {/* Animated Brand Logo Container */}
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#803D63] text-white border border-[#803D63] shadow-md animate-bounce">
            <InflixoLogoIcon className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Syncing Status Information */}
        <div className="space-y-1.5 text-center">
          <div className="flex items-center justify-center gap-2">
            <h3 className="font-display text-base font-bold text-slate-900">
              Inflixo
            </h3>
            <span className="rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-[10px] font-bold text-[#803D63] uppercase tracking-wider">
              Syncing
            </span>
          </div>

          <p className="text-xs font-medium text-slate-600 min-h-[20px]">
            {message}{dots}
          </p>
        </div>

        {/* Horizontal Progress Bar with Percentage */}
        <div className="w-56 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
            <span>Syncing Creator Data...</span>
            <span className="text-[#803D63] font-black">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200 shadow-2xs">
            <div
              className="h-full bg-gradient-to-r from-[#803D63] to-[#6D3254] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Big Italic Motivational Quote in Primary Brand Color (No Quotation Marks) */}
        <div className="min-h-[72px] flex items-center justify-center px-4 pt-2">
          <p
            className={`font-display text-base sm:text-lg font-black italic text-[#803D63] leading-relaxed tracking-tight transition-opacity duration-400 ${
              isFading ? "opacity-0" : "opacity-100"
            }`}
          >
            {currentQuote}
          </p>
        </div>
      </div>
    </div>
  );
}
