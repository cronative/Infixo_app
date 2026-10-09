"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Lock,
  Heart,
  ExternalLink,
  Zap,
} from "lucide-react";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { CreatorProfile } from "@/types";

interface TrialExpiredEmotionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CreatorProfile;
}

export function TrialExpiredEmotionalModal({
  isOpen,
  onClose,
  profile,
}: TrialExpiredEmotionalModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const displayName = profile.displayName || "Creator";
  const handle = profile.username || "creator";

  const handleUpgrade = () => {
    onClose();
    router.push("/dashboard/subscription");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop with rich blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trial-modal-title"
        className="relative w-full max-w-lg rounded-3xl border border-rose-100 bg-white p-6 sm:p-8 shadow-2xl shadow-rose-950/15 overflow-hidden text-left z-10 transition-all transform animate-in zoom-in-95 duration-200"
      >
        {/* Ambient Top Decorative Gradient */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-gradient-to-br from-rose-200/50 via-amber-200/40 to-transparent blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-gradient-to-tr from-[#7A2253]/10 via-rose-100/40 to-transparent blur-2xl" />

        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close dialog"
          className="absolute top-4.5 right-4.5 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header with Avatar & Status Badge */}
        <div className="relative flex items-center gap-3.5 mb-5">
          <div className="relative">
            <CreatorAvatar
              src={profile.photoDataUrl}
              name={displayName}
              className="h-14 w-14 rounded-2xl border-2 border-white shadow-md ring-2 ring-rose-200"
            />
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm ring-2 ring-white">
              <Lock className="h-3 w-3" />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200/70 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>7-Day Free Trial Ended</span>
            </div>
            <p className="truncate text-xs font-semibold text-slate-500">
              @{handle} · Public profile is currently hidden
            </p>
          </div>
        </div>

        {/* Emotional Headline */}
        <div className="space-y-2 mb-4">
          <h2
            id="trial-modal-title"
            className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug"
          >
            Don&apos;t let your creative journey pause here, {displayName}! ❤️
          </h2>
          <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal">
            You poured your time and heart into setting up your links, organizing your series, and building your creator brand.
            Right now, because your free trial has ended, your public page (<span className="font-semibold text-slate-800">inflixo.com/@{handle}</span>) is <strong className="text-rose-600 font-semibold">hidden from fans, brands, and visitors</strong>.
          </p>
        </div>

        {/* What happens right now box */}
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-3.5 mb-5 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
            <span>Why your profile needs attention right now:</span>
          </p>

          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-200/60 text-rose-800 font-bold text-[10px]">
                1
              </span>
              <span>
                <strong>Bio link is inactive:</strong> Visitors clicking your Instagram, YouTube, or TikTok bio link see a private message.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-200/60 text-rose-800 font-bold text-[10px]">
                2
              </span>
              <span>
                <strong>Brand deals on hold:</strong> Brands cannot view your media kit rates or submit collaboration inquiries.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-200/60 text-rose-800 font-bold text-[10px]">
                3
              </span>
              <span>
                <strong>Keep all your hard work:</strong> All your custom links, series, reviews, and setup stay intact the moment you reactivate.
              </span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleUpgrade}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#7A2253_0%,#B0437A_100%)] hover:opacity-95 text-white py-3 px-5 text-sm font-bold shadow-lg shadow-[#7A2253]/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>Reactivate & Keep Profile Live</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] font-medium text-slate-500">
              Plans start at just <strong className="text-slate-800">₹99/month</strong>. Cancel anytime.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
            >
              Remind me later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
