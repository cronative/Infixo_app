"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, RefreshCw, ArrowRight } from "lucide-react";
import { InflixoLogoIcon } from "@/components/shared/Logo";
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
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [progress, setProgress] = useState(20);
  const [showTimeoutFallback, setShowTimeoutFallback] = useState(false);

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
      setProgress((prev) => (prev >= 92 ? 96 : prev + Math.floor(Math.random() * 6) + 2));
    }, 350);
    return () => clearInterval(pInterval);
  }, []);

  // 10-second timeout fallback
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowTimeoutFallback(true);
    }, 10000);
    return () => clearTimeout(timeout);
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
    ? "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-md px-4 text-center selection:bg-purple-100"
    : "flex flex-col items-center justify-center p-8 text-center w-full min-h-[320px]";

  const currentQuote = CREATOR_QUOTES[quoteIndex] || CREATOR_QUOTES[0];

  return (
    <div className={containerClass}>
      <div className="relative z-10 flex flex-col items-center max-w-lg w-full space-y-5">
        {/* Animated Brand Logo Container */}
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-[#151933]/20 animate-ping opacity-25" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#151933] text-white shadow-md">
            <InflixoLogoIcon className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Syncing Status Information */}
        <div className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <h3 className="font-display text-sm font-bold text-slate-900 tracking-tight">
              Inflixo
            </h3>
            <span className="rounded-full bg-[#151933]/[0.08] border border-[#151933]/20 px-2 py-0.5 text-[9px] font-bold text-[#151933] uppercase tracking-wider">
              Syncing
            </span>
          </div>

          <p className="text-xs font-medium text-slate-600 min-h-[18px]">
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
        <div className="min-h-[48px] flex items-center justify-center px-4 w-full">
          <p
            className={`text-sm sm:text-base font-semibold italic text-[#151933] leading-snug text-center transition-opacity duration-300 ${isFading ? "opacity-0" : "opacity-100"
              }`}
          >
            "{currentQuote}"
          </p>
        </div>

        {/* 10-Second Fallback Action */}
        {showTimeoutFallback && (
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs animate-fadeIn">
            <span className="text-slate-500">Taking longer than usual?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1 font-semibold text-[#151933] hover:underline"
              >
                <RefreshCw className="h-3 w-3" /> Retry
              </button>
              <span className="text-slate-300">•</span>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 hover:underline"
              >
                Go to Dashboard <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
