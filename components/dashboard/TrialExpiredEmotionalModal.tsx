"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  X,
  Lock,
  Link2,
  Play,
  BarChart3,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  Rocket,
} from "lucide-react";
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

  const displayName = profile?.displayName || "Creator";
  const firstName = displayName.trim().split(" ")[0] || "Creator";
  const handle = profile?.username || "creator";
  const initials = (profile?.displayName || profile?.username || "CR")
    .trim()
    .slice(0, 2)
    .toUpperCase();

  const handleUpgrade = () => {
    onClose();
    router.push("/dashboard/subscription");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      {/* Dark blur backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
        aria-hidden="true"
      />

      {/* Main Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trial-modal-title"
        className="relative w-full max-w-[620px] rounded-[2rem] sm:rounded-[2.25rem] border border-pink-100 bg-white p-5 sm:p-7 shadow-2xl shadow-pink-950/20 overflow-hidden text-left z-10 transition-all transform animate-in zoom-in-95 duration-200"
      >
        {/* Soft pastel pink ambient background glow/waves */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-pink-200/50 via-rose-100/40 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-tr from-[#7A2253]/15 via-pink-100/40 to-transparent blur-3xl" />

        {/* Ambient floating doodle stars */}
        <div className="pointer-events-none absolute top-12 right-28 opacity-40">
          <svg className="w-3.5 h-3.5 text-amber-400 fill-current" viewBox="0 0 24 24">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
          </svg>
        </div>
        <div className="pointer-events-none absolute top-36 left-4 opacity-40">
          <svg className="w-3 h-3 text-pink-300 fill-current" viewBox="0 0 24 24">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
          </svg>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close dialog"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer z-20"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Top Header: Creator Avatar & Status Badge */}
        <div className="relative flex items-center gap-3.5 mb-4">
          {/* Avatar Container with doodle dashes & lock */}
          <div className="relative">
            {/* Pink doodle tick marks above avatar */}
            <svg
              className="absolute -top-3.5 right-0 w-5 h-5 text-pink-400 stroke-current pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
            >
              <path d="M6 18L10 6" />
              <path d="M14 18L18 6" />
            </svg>

            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#7A2253] via-[#8E2660] to-[#581838] flex items-center justify-center text-white font-extrabold text-xl shadow-md border-2 border-white ring-2 ring-pink-100 overflow-hidden">
              {profile?.photoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.photoDataUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            {/* Lock Badge */}
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#E11D48] text-white shadow-sm ring-2 ring-white">
              <Lock className="h-3 w-3" strokeWidth={2.5} />
            </span>
          </div>

          {/* User handle & Status */}
          <div className="min-w-0">
            <p className="truncate text-sm sm:text-base font-bold text-slate-900 leading-tight">
              @{handle}
            </p>
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#FFF1F2] border border-[#FECDD3] px-2.5 py-0.5 text-[11px] font-bold text-[#E11D48]">
              <span>Free Trial Ended</span>
            </div>
          </div>
        </div>

        {/* Hero Section: Emotional Headline & Copy + 3D Visual */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center">
          {/* Left Text */}
          <div className="sm:col-span-7">
            {/* "Hey Nikunj, ♥" */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold text-slate-900">Hey</span>
              <span className="relative inline-block text-xl sm:text-2xl font-extrabold text-[#7A2253]">
                {firstName},
                {/* Hand-drawn brush underline */}
                <svg
                  className="absolute -bottom-1 left-0 w-full h-2 text-pink-400 pointer-events-none"
                  viewBox="0 0 100 8"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M1 5.5C25 2 75 2 99 5.5"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="text-pink-500 text-lg leading-none select-none">♥</span>
            </div>

            {/* Subheadline with emotional hook */}
            <h2
              id="trial-modal-title"
              className="text-lg sm:text-[21px] font-bold text-slate-900 leading-snug tracking-tight mt-2"
            >
              Your profile couldn&apos;t be available for your lovely fans 💔
            </h2>

            {/* Explanatory Paragraph */}
            <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal mt-2.5">
              Your free trial period is over, so your Inflixo profile is currently hidden.
              Reactivate it now and get back to sharing your links, series, and creator journey
              with your fans, brands, and new visitors.
            </p>
          </div>

          {/* Right Visual: "Your fans are waiting!" + 3D Creator Illustration */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center relative mt-1 sm:mt-0">
            {/* Playful fan waiting callout */}
            <div className="flex items-center justify-center gap-1 mb-0.5 select-none self-end sm:self-center pr-2">
              <span className="font-['Caveat',cursive] text-lg sm:text-xl font-bold text-[#BE185D] -rotate-6 tracking-wide drop-shadow-sm">
                Your fans are waiting!
              </span>
              <svg
                className="w-5 h-5 text-[#BE185D] -rotate-12 fill-none stroke-current"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4 C 14 6, 18 14, 16 20" />
                <path d="M12 17 L 16 20 L 19 16" />
              </svg>
            </div>

            {/* 3D Creator Illustration */}
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
              <Image
                src="/images/trial-expired-creator-feathered.png"
                alt="Your fans are waiting on Inflixo"
                width={240}
                height={240}
                priority
                className="w-full h-full object-contain filter drop-shadow-md select-none pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* 3 Feature Preview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 my-4 sm:my-5">
          {/* Card 1: All Your Links */}
          <div className="rounded-2xl border border-pink-100 bg-[#FFF8FA] p-3 sm:p-3.5 text-center transition-all hover:bg-white hover:shadow-md hover:border-pink-200">
            <div className="relative inline-block mb-1.5">
              <div className="h-10 w-10 rounded-full bg-[#FFE4EC] text-[#E11D48] flex items-center justify-center mx-auto">
                <Link2 className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <svg
                className="absolute -top-1 -right-1.5 w-3.5 h-3.5 text-pink-400 stroke-current pointer-events-none"
                viewBox="0 0 16 16"
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M3 13L1 9" />
                <path d="M8 14L10 9" />
              </svg>
            </div>
            <p className="text-xs sm:text-[13px] font-bold text-slate-900">All Your Links</p>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Keep everything in one place
            </p>
          </div>

          {/* Card 2: Your Series */}
          <div className="rounded-2xl border border-pink-100 bg-[#FFF8FA] p-3 sm:p-3.5 text-center transition-all hover:bg-white hover:shadow-md hover:border-pink-200">
            <div className="relative inline-block mb-1.5">
              <div className="h-10 w-10 rounded-full bg-[#FFE4EC] text-[#E11D48] flex items-center justify-center mx-auto">
                <Play className="h-5 w-5 fill-current" />
              </div>
              <svg
                className="absolute -top-1 -right-1.5 w-3.5 h-3.5 text-pink-400 stroke-current pointer-events-none"
                viewBox="0 0 16 16"
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M3 13L1 9" />
                <path d="M8 14L10 9" />
              </svg>
            </div>
            <p className="text-xs sm:text-[13px] font-bold text-slate-900">Your Series</p>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Organize your stories beautifully
            </p>
          </div>

          {/* Card 3: Your Creator Brand */}
          <div className="rounded-2xl border border-purple-100 bg-[#FCF8FF] p-3 sm:p-3.5 text-center transition-all hover:bg-white hover:shadow-md hover:border-purple-200">
            <div className="relative inline-block mb-1.5">
              <div className="h-10 w-10 rounded-full bg-[#F3E8FF] text-[#7E22CE] flex items-center justify-center mx-auto">
                <BarChart3 className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <svg
                className="absolute -top-1 -right-1.5 w-3.5 h-3.5 text-purple-400 stroke-current pointer-events-none"
                viewBox="0 0 16 16"
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M3 13L1 9" />
                <path d="M8 14L10 9" />
              </svg>
            </div>
            <p className="text-xs sm:text-[13px] font-bold text-slate-900">Your Creator Brand</p>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Stay visible and grow faster
            </p>
          </div>
        </div>

        {/* Action Button: Reactivate My Profile with Doodle Burst */}
        <div className="relative">
          <button
            type="button"
            onClick={handleUpgrade}
            className="w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#7A2253] via-[#8C1D5E] to-[#A82570] hover:opacity-95 text-white py-3.5 px-6 text-sm sm:text-base font-bold shadow-xl shadow-[#7A2253]/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <Rocket className="h-5 w-5 shrink-0" />
            <span>Reactivate My Profile</span>
            <ArrowRight className="h-5 w-5 shrink-0" />
          </button>

          {/* Doodle burst marks on right side of button */}
          <div className="hidden sm:flex absolute -right-5.5 top-1/2 -translate-y-1/2 text-pink-400 pointer-events-none">
            <svg
              className="w-5 h-6 stroke-current"
              viewBox="0 0 20 24"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M4 4L14 8" />
              <path d="M2 12L16 12" />
              <path d="M4 20L14 16" />
            </svg>
          </div>
        </div>

        {/* Footer Reassurance Info */}
        <div className="flex items-center justify-center gap-3 pt-3.5 text-xs text-slate-600 font-medium">
          <div className="inline-flex items-center gap-1.5">
            <CreditCard className="h-4 w-4 text-slate-700" />
            <span>
              Just <strong className="text-rose-600 font-bold">₹99/month</strong>
            </span>
            <svg
              className="w-3.5 h-3.5 text-pink-400 stroke-current inline-block"
              viewBox="0 0 16 16"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M2 5L7 8" />
              <path d="M2 11L7 8" />
            </svg>
          </div>

          <span className="text-slate-300 font-light">|</span>

          <div className="inline-flex items-center gap-1.5 text-slate-700">
            <ShieldCheck className="h-4 w-4 text-[#E11D48]" />
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}
