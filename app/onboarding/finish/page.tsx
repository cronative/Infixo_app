"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper, Copy, Share2, LayoutDashboard, ExternalLink, Check, Sparkles } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { initials } from "@/utils/format";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";

import { OnboardingService } from "@/services/OnboardingService";

const CONFETTI_COLORS = ["#803D63", "#d946ef", "#f59e0b", "#3b82f6", "#10b981", "#e6c583"];

function ConfettiBurst() {
  const [pieces, setPieces] = useState<{ left: number; color: string; delay: number; rotate: number; scale: number }[]>([]);

  useEffect(() => {
    setPieces(
      Array.from({ length: 40 }, (_, i) => ({
        left: Math.random() * 100,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 0.45,
        rotate: Math.random() * 360,
        scale: 0.7 + Math.random() * 0.6,
      }))
    );
  }, []);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-96 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotate}deg) scale(${p.scale})`,
          }}
        />
      ))}
    </div>
  );
}

export default function FinishStepPage() {
  const router = useRouter();
  const { profile, socials, totalAudience, theme, series } = useCreator();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    OnboardingService.setStep("finish");
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
  const handleStr = profile.username || "nikzios30";
  const profileUrl = `inflixo.com/${handleStr}`;
  const fullUrl = `${origin}/${handleStr}`;

  async function handleCopy() {
    const success = await copyToClipboard(fullUrl);
    if (success) {
      setCopied(true);
      showToast("Profile link copied to clipboard! 📋✨");
      setTimeout(() => setCopied(false), 2000);
    } else {
      showToast("Couldn't copy — copy it manually", "error");
    }
  }

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: profile.displayName || "Inflixo Profile", url: fullUrl });
      } catch {
        // user cancelled share — no-op
      }
    } else {
      handleCopy();
    }
  }

  return (
    <OnboardingLayout
      step="finish"
      preview={<LivePreviewCard profile={profile} socials={socials} totalAudience={totalAudience} themeKey={theme} series={series} />}
    >
      <div className="relative flex flex-col items-center justify-center overflow-hidden py-4">
        <ConfettiBurst />

        <div className="pop-in relative z-10 flex w-full max-w-md flex-col items-center text-center">
          {/* Circular Avatar Rendering */}
          <div className="relative mb-3">
            {profile.photoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photoDataUrl}
                alt={profile.displayName || "Creator"}
                className="w-20 h-20 rounded-full overflow-hidden object-cover aspect-square border-2 border-white shadow-md"
              />
            ) : (
              <div
                className="flex w-20 h-20 items-center justify-center rounded-full text-xl font-extrabold text-white border-2 border-white shadow-md bg-[#803D63]"
              >
                {initials(profile.displayName) || "IN"}
              </div>
            )}
            <div
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white shadow-md"
            >
              <PartyPopper className="h-4 w-4" />
            </div>
          </div>

          <h1 className="mt-2 text-3xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-4xl">
            You&apos;re <span className="text-gradient-premium">Live on Inflixo</span> 🎉
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Your creator profile is ready! Share your custom link across Instagram, YouTube, and WhatsApp.
          </p>

          {/* Clean Handle Box */}
          <div className="mt-6 flex w-full items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[#803D63]">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="truncate text-sm font-bold text-slate-900">{profileUrl}</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="tap-scale flex items-center gap-1.5 rounded-lg bg-[#803D63] hover:bg-[#6D3254] px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Action Buttons Hierarchy */}
          <div className="mt-6 w-full space-y-3">
            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="tap-scale w-full flex items-center justify-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6D3254] text-white font-medium py-3.5 px-4 text-sm shadow-md transition-all cursor-pointer"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Go to Creator Dashboard →</span>
            </button>

            {/* Secondary Action Buttons Side-by-Side */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <a
                href={`/${handleStr}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-scale flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-3 text-xs transition-colors cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>View Public Profile</span>
              </a>

              <button
                type="button"
                onClick={handleShare}
                className="tap-scale flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-3 text-xs transition-colors cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Share Profile</span>
              </button>
            </div>
          </div>

          {/* Summit 2027 Welcome Badge */}
          <div className="mt-5 w-full rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-center text-xs font-semibold text-indigo-950 shadow-2xs">
            🎉 Creator Summit 2027 Mission: You are creator #4,821 of 10,000 on early access.
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}


