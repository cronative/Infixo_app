"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, X, Share, PlusSquare, Sparkles } from "lucide-react";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone PWA mode
    const isRunningStandalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true);

    if (isRunningStandalone) {
      setIsStandalone(true);
      return;
    }

    // 2. Check if user recently dismissed prompt in this session
    const isDismissed = sessionStorage.getItem("inflixo_pwa_dismissed");
    if (isDismissed) return;

    // 3. Detect iOS device
    const userAgent = typeof window !== "undefined" ? window.navigator.userAgent.toLowerCase() : "";
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // 4. Capture native Android / Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Wait 1.5s after load to smoothly show bottom banner
      setTimeout(() => {
        setShowPrompt(true);
      }, 1500);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. If iOS, show prompt after 2 seconds on mobile
    if (isIosDevice) {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 2000);
      }
    }

    // 6. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("✅ Inflixo PWA Service Worker Registered"))
        .catch((err) => console.warn("PWA SW Register Error:", err));
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("inflixo_pwa_dismissed", "true");
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-fade-in-up">
      <div className="relative overflow-hidden rounded-3xl border border-[#E8DCE4] bg-white/95 p-4 sm:p-5 shadow-2xl shadow-[#803D63]/15 backdrop-blur-xl">
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-10 left-1/2 h-20 w-40 -translate-x-1/2 rounded-full bg-[#803D63]/10 blur-xl" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="tap-scale absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          aria-label="Dismiss Install Prompt"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-center gap-3.5 pr-6">
          {/* App Icon */}
          <div className="relative h-13 w-13 shrink-0 overflow-hidden rounded-2xl border border-[#E8DCE4] shadow-md bg-[#803D63]">
            <Image
              src="/logo-square.png"
              alt="Inflixo App Icon"
              width={52}
              height={52}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Text Info */}
          <div className="min-w-0 flex-1 space-y-0.5 text-left">
            <div className="flex items-center gap-1.5">
              <h4 className="font-display text-sm font-black text-slate-900 truncate">
                Install Inflixo App
              </h4>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-[#F6EBF1] px-2 py-0.5 text-[9px] font-black text-[#803D63] border border-[#E8DCE4]">
                <Sparkles className="h-2.5 w-2.5" /> FREE
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-tight">
              Fast, full-screen creator experience & offline access!
            </p>
          </div>
        </div>

        {/* Instructions / Action Area */}
        <div className="mt-3.5 pt-3 border-t border-[#E8DCE4]/60">
          {isIOS ? (
            /* iOS Safari Instructions */
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span>1. Tap Share icon</span>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                  <Share className="h-3.5 w-3.5" />
                </span>
                <span>at the bottom</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span>2. Select</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-[#F6EBF1] px-2 py-0.5 text-[11px] font-bold text-[#803D63] border border-[#E8DCE4]">
                  <PlusSquare className="h-3 w-3" /> Add to Home Screen
                </span>
              </div>
            </div>
          ) : (
            /* Android / Chrome 1-Click Install Button */
            <button
              type="button"
              onClick={handleInstallClick}
              className="tap-scale w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#803D63] hover:bg-[#6D3254] py-2.5 px-4 text-xs font-black text-white shadow-md shadow-[#803D63]/20 transition-all hover:scale-[1.01] cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Add to Home Screen</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
