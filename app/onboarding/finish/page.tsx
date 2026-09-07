"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Share2, LayoutDashboard, ExternalLink, Check, Sparkles, Loader2 } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { OnboardingService } from "@/services/OnboardingService";

const CONFETTI_COLORS = ["#b85c6b", "#d946ef", "#f59e0b", "#3b82f6", "#10b981", "#e6c583"];

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
  const { profile, socials, totalAudience, theme, series } = useCreator();
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
    <OnboardingLayout
      step="finish"
      preview={
        <LivePreviewCard
          profile={profile}
          socials={socials}
          totalAudience={totalAudience}
          themeKey={theme}
          series={series}
          isFinishStep={true}
        />
      }
    >
      <div className="relative flex flex-col items-center justify-center overflow-hidden py-4">
        <ConfettiBurst />

        <div className="pop-in relative z-10 flex w-full max-w-md flex-col items-center text-center">
          {/* Circular Creator Avatar with Green Success Check Badge */}
          <div className="relative mb-3">
            <CreatorAvatar
              src={profile.photoDataUrl}
              name={profile.displayName || "Creator"}
              className="w-20 h-20 sm:w-22 sm:h-22 rounded-full aspect-square object-cover overflow-hidden border-2 border-white shadow-md mx-auto"
              textClassName="text-2xl font-extrabold text-white"
              fallbackBgClass="bg-[#b85c6b]"
            />
            <div
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white shadow-md"
              title="Profile Ready"
            >
              <Check className="h-4 w-4 stroke-[3]" />
            </div>
          </div>

          <h1 className="mt-2 text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-[#181716]">
            You&apos;re Live on Inflixo 🎉
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#54514D] font-medium leading-relaxed max-w-sm">
            Your creator profile is ready. Share your Inflixo link with your audience and potential brand partners.
          </p>

          {/* Clean Public URL Box */}
          <div className="mt-6 flex w-full items-center justify-between gap-3 rounded-xl border border-[#E7E3DC] bg-white p-3 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#b85c6b]/[0.09] text-[#b85c6b]">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="truncate text-sm font-bold text-[#181716]">{displayUrl}</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="tap-scale flex items-center gap-1.5 rounded-lg bg-[#b85c6b] hover:bg-[#6F3456] px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer shrink-0 shadow-xs"
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

          {/* Primary & Secondary Action Buttons Hierarchy */}
          <div className="mt-6 w-full space-y-3">
            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleGoToDashboard}
              disabled={isLoadingDashboard}
              className="tap-scale w-full flex items-center justify-center gap-2 rounded-xl bg-[#b85c6b] hover:bg-[#6F3456] text-white font-bold h-11 text-sm transition-all cursor-pointer shadow-xs disabled:opacity-75"
            >
              {isLoadingDashboard ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Opening Dashboard...</span>
                </>
              ) : (
                <>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Go to Creator Dashboard →</span>
                </>
              )}
            </button>

            {/* Secondary Action Buttons Side-by-Side */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <a
                href={`/${handleStr}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-scale flex items-center justify-center gap-1.5 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#F8F7F3] text-[#181716] font-semibold h-10 px-3 text-xs transition-colors cursor-pointer text-center"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">View Public Profile</span>
              </a>

              <button
                type="button"
                onClick={handleShare}
                className="tap-scale flex items-center justify-center gap-1.5 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#F8F7F3] text-[#181716] font-semibold h-10 px-3 text-xs transition-colors cursor-pointer text-center"
              >
                <Share2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Share Profile</span>
              </button>
            </div>
          </div>

          {/* Creator Summit Mission Notice */}
          <div className="mt-6 w-full rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] p-4 text-center text-xs shadow-xs">
            <p className="font-bold text-[#181716] text-xs">Creator Mission 2027</p>
            <p className="mt-1 text-[#54514D] font-medium leading-relaxed">
              {verifiedCreatorNumber ? (
                `You’re creator #${verifiedCreatorNumber.toLocaleString()} joining Inflixo’s journey to empower 10,000 creators with Early Access.`
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
