"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Share2, LayoutDashboard, ExternalLink, Check, Sparkles, Loader2 } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { OnboardingService } from "@/services/OnboardingService";

const CONFETTI_COLORS = ["#043084", "#3b82f6", "#10b981", "#f59e0b", "#6366f1", "#06b6d4"];

function ConfettiBurst() {
  const [pieces, setPieces] = useState<{ left: number; color: string; delay: number; rotate: number; scale: number }[]>([]);

  useEffect(() => {
    // Subtle, lightweight celebration effect (24 particles)
    setPieces(
      Array.from({ length: 24 }, (_, i) => ({
        left: 5 + Math.random() * 90,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 0.35,
        rotate: Math.random() * 360,
        scale: 0.6 + Math.random() * 0.5,
      }))
    );
  }, []);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-80 overflow-hidden opacity-85">
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
  const { profile } = useCreator();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  useEffect(() => {
    // Mark onboarding completed in storage and backend DB
    OnboardingService.setStep("finish");
  }, []);

  const handleStr = (profile.username || "creator").replace(/^@/, "");
  const productionDomain = "inflixo.com";
  const displayUrl = `${productionDomain}/${handleStr}`;
  const fullUrl = `https://${productionDomain}/${handleStr}`;

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
        await navigator.share({
          title: profile.displayName || "Inflixo Creator Profile",
          text: `Check out my creator profile on Inflixo:`,
          url: fullUrl,
        });
      } catch {
        // User cancelled share dialog — graceful no-op
      }
    } else {
      handleCopy();
    }
  }

  const handleGoToDashboard = () => {
    setIsLoadingDashboard(true);
    OnboardingService.setStep("finish");
    router.push("/dashboard");
  };

  // Check for verified sequence number from backend if present
  const rawCreatorNumber = (profile as any)?.creatorNumber ?? (profile as any)?.sequenceNumber;
  const verifiedCreatorNumber =
    typeof rawCreatorNumber === "number" && !isNaN(rawCreatorNumber) && rawCreatorNumber > 0
      ? rawCreatorNumber
      : null;

  return (
    <OnboardingLayout step="finish">
      <div className="relative flex flex-col items-center justify-center overflow-hidden py-1 sm:py-2">
        <ConfettiBurst />

        <div className="pop-in relative z-10 flex w-full max-w-[420px] flex-col items-center text-center">
          {/* Circular Creator Avatar with Green Success Check Badge */}
          <div className="relative mb-1.5">
            <CreatorAvatar
              src={profile.photoDataUrl}
              name={profile.displayName || "Creator"}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full aspect-square object-cover overflow-hidden border-2 border-white shadow-md mx-auto"
              textClassName="text-lg font-extrabold text-white"
              fallbackBgClass="bg-[#043084]"
            />
            <div
              className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#10b981] text-white ring-2 ring-white shadow-md"
              title="Profile Ready"
            >
              <Check className="h-2.5 w-2.5 stroke-[3]" />
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight text-[#043084]">
            You&apos;re Live on Inflixo 🎉
          </h1>
          <p className="mt-1 text-xs text-[#475569] font-medium leading-relaxed max-w-xs">
            Your creator profile is ready. Share your Inflixo link with your audience and brand partners.
          </p>

          {/* Clean Public URL Box */}
          <div className="mt-2.5 flex w-full items-center justify-between gap-2 rounded-xl border border-[#e2e8f0] bg-white p-2 shadow-2xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] text-[#043084]">
                <Sparkles className="h-3 w-3" />
              </span>
              <span className="truncate text-xs sm:text-sm font-bold text-[#043084]">{displayUrl}</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="tap-scale flex items-center gap-1 rounded-lg bg-[#043084] hover:bg-brand-hover px-2.5 py-1 text-xs font-bold text-white transition-all cursor-pointer shrink-0 shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 stroke-[3]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Primary & Secondary Action Buttons Hierarchy */}
          <div className="mt-2.5 w-full space-y-1.5">
            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleGoToDashboard}
              disabled={isLoadingDashboard}
              className="tap-scale w-full flex items-center justify-center gap-2 rounded-xl bg-[#043084] hover:bg-brand-hover text-white font-bold h-10 text-xs sm:text-sm transition-all cursor-pointer shadow-xs disabled:opacity-75"
            >
              {isLoadingDashboard ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Opening Dashboard...</span>
                </>
              ) : (
                <>
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Go to Creator Dashboard →</span>
                </>
              )}
            </button>

            {/* Secondary Action Buttons Side-by-Side */}
            <div className="grid grid-cols-2 gap-1.5 w-full">
              <a
                href={`/${handleStr}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-scale flex items-center justify-center gap-1.5 rounded-xl border border-[#e2e8f0] bg-white hover:bg-surface-soft text-[#043084] font-semibold h-8.5 px-2.5 text-xs transition-colors cursor-pointer text-center shadow-2xs"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate">View Public Profile</span>
              </a>

              <button
                type="button"
                onClick={handleShare}
                className="tap-scale flex items-center justify-center gap-1.5 rounded-xl border border-[#e2e8f0] bg-white hover:bg-surface-soft text-[#043084] font-semibold h-8.5 px-2.5 text-xs transition-colors cursor-pointer text-center shadow-2xs"
              >
                <Share2 className="h-3 w-3 shrink-0" />
                <span>Share Profile</span>
              </button>
            </div>
          </div>

          {/* Creator Summit Mission Notice */}
          <div className="mt-2.5 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-2.5 text-center text-xs shadow-2xs">
            <p className="font-bold text-[#181716] text-xs">Creator Mission 2027</p>
            <p className="mt-0.5 text-[#54514D] font-medium leading-relaxed text-[11px]">
              {verifiedCreatorNumber ? (
                `You’re creator #${verifiedCreatorNumber.toLocaleString()} joining Inflixo’s journey to empower creators with a better public profile.`
              ) : (
                "Welcome to Inflixo’s creator community. Let’s build your creator identity together."
              )}
            </p>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
