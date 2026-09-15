"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, X, Share, PlusSquare, Sparkles } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const PWA_DISMISSED_KEY = "inflixo_pwa_prompt_dismissed";
const PWA_INSTALLED_KEY = "inflixo_pwa_installed";

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && window.navigator.standalone === true)
  );
}

function isIOSDevice() {
  if (typeof window === "undefined") return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent) && !("MSStream" in window);
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS] = useState(isIOSDevice);
  const [isStandalone] = useState(isStandaloneMode);

  useEffect(() => {
    // 1. Check if already installed / running in standalone PWA mode
    if (isStandalone) return;

    // 2. Show only once. If user closes/cancels/installs, do not show again.
    const isDismissed = localStorage.getItem(PWA_DISMISSED_KEY);
    const isInstalled = localStorage.getItem(PWA_INSTALLED_KEY);
    if (isDismissed || isInstalled) return;

    // 3. Detect iOS device
    // 4. Capture native Android / Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Wait 1.5s after load to smoothly show bottom banner
      setTimeout(() => {
        if (!localStorage.getItem(PWA_DISMISSED_KEY) && !localStorage.getItem(PWA_INSTALLED_KEY)) {
          setShowPrompt(true);
        }
      }, 1500);
    };

    const handleAppInstalled = () => {
      localStorage.setItem(PWA_INSTALLED_KEY, "true");
      localStorage.setItem(PWA_DISMISSED_KEY, "true");
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // 5. If iOS, show prompt after 2 seconds on mobile
    if (isIOS) {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        setTimeout(() => {
          if (!localStorage.getItem(PWA_DISMISSED_KEY) && !localStorage.getItem(PWA_INSTALLED_KEY)) {
            setShowPrompt(true);
          }
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
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isIOS, isStandalone]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      localStorage.setItem(PWA_DISMISSED_KEY, "true");
      if (outcome === "accepted") localStorage.setItem(PWA_INSTALLED_KEY, "true");
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(PWA_DISMISSED_KEY, "true");
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-fade-in-up">
      <div className="relative overflow-hidden rounded-3xl border border-[#e2e8f0] bg-white/95 p-4 sm:p-5 shadow-2xl shadow-[#151933]/15 backdrop-blur-xl">
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-10 left-1/2 h-20 w-40 -translate-x-1/2 rounded-full bg-[#151933]/10 blur-xl" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="tap-scale absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-[#f1f5f9] hover:text-[#151933] transition-colors"
          aria-label="Dismiss Install Prompt"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-center gap-3.5 pr-6">
          {/* App Icon */}
          <div className="relative h-13 w-13 shrink-0 overflow-hidden rounded-2xl border border-[#e2e8f0] shadow-md bg-[#151933]">
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
              <span className="inline-flex items-center gap-0.5 rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[9px] font-black text-[#151933] border border-[#e2e8f0]">
                <Sparkles className="h-2.5 w-2.5" /> FREE
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-tight">
              Fast, full-screen creator experience & offline access!
            </p>
          </div>
        </div>

        {/* Instructions / Action Area */}
        <div className="mt-3.5 pt-3 border-t border-[#e2e8f0]/60">
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
                <span className="inline-flex items-center gap-1 rounded-md bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-bold text-[#151933] border border-[#e2e8f0]">
                  <PlusSquare className="h-3 w-3" /> Add to Home Screen
                </span>
              </div>
            </div>
          ) : (
            /* Android / Chrome 1-Click Install Button */
            <button
              type="button"
              onClick={handleInstallClick}
              className="tap-scale w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#151933] hover:bg-brand-hover py-2.5 px-4 text-xs font-black text-white shadow-md shadow-[#151933]/20 transition-all hover:scale-[1.01] cursor-pointer"
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
