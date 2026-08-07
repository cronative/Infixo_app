"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper, Copy, Share2, LayoutDashboard, ExternalLink, QrCode, Check, Sparkles } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/Button";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { initials } from "@/utils/format";

const CONFETTI_COLORS = ["#7c3aed", "#d946ef", "#f59e0b", "#3b82f6", "#10b981", "#e6c583"];

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

import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";

export default function FinishStepPage() {
  const router = useRouter();
  const { profile, socials, totalAudience, theme } = useCreator();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const profileUrl = `inflixo.com/${profile.username || "you"}`;
  const fullUrl = `https://${profileUrl}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      showToast("Profile link copied to clipboard! 📋");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Couldn't copy — copy it manually", "error");
    }
  }

  async function handleShare() {
    if (navigator.share) {
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
      preview={<LivePreviewCard profile={profile} socials={socials} totalAudience={totalAudience} themeKey={theme} />}
    >
      <div className="relative flex flex-col items-center justify-center overflow-hidden py-4">
        <ConfettiBurst />

        <div className="pop-in relative z-10 flex w-full max-w-md flex-col items-center text-center">
          {/* Animated Celebration Icon / Avatar */}
          <div className="relative mb-3">
            {profile.photoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photoDataUrl}
                alt={profile.displayName || "Creator"}
                className="h-24 w-24 rounded-full object-cover ring-4 ring-inflixo-purple/30 shadow-xl"
              />
            ) : (
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full text-2xl font-black text-white ring-4 ring-inflixo-purple/30 shadow-xl"
                style={{ backgroundImage: "var(--gradient-premium)" }}
              >
                {initials(profile.displayName) || "IN"}
              </div>
            )}
            <div
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-white shadow-md"
            >
              <PartyPopper className="h-5 w-5" />
            </div>
          </div>

          <h1 className="mt-2 text-3xl font-extrabold leading-[1.15] tracking-tight text-inflixo-navy sm:text-4xl">
            You&apos;re <span className="text-gradient-premium">Live on Inflixo</span> 🎉
          </h1>
          <p className="mt-2 text-[15px] text-muted leading-relaxed">
            Your creator profile is ready! Share your custom link in your bio across Instagram, YouTube, and TikTok.
          </p>

          {/* Public Handle Box */}
          <div 
            className="mt-6 flex w-full items-center justify-between gap-3 rounded-2xl border border-inflixo-purple/30 bg-white p-3.5 shadow-sm transition-all hover:border-inflixo-purple/60"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-inflixo-purple-light text-inflixo-purple">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="truncate text-sm font-extrabold text-inflixo-purple">{profileUrl}</span>
            </div>
            <button
              onClick={handleCopy}
              className="tap-scale flex items-center gap-1.5 rounded-xl bg-inflixo-purple px-3 py-1.5 text-xs font-bold text-white hover:bg-inflixo-purple-dark transition-all"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 grid w-full grid-cols-2 gap-3">
            <Button variant="outline" icon={<ExternalLink className="h-4 w-4" />} onClick={() => router.push(`/${profile.username || "you"}`)}>
              View Profile
            </Button>
            <Button variant="secondary" icon={<Share2 className="h-4 w-4" />} onClick={handleShare}>
              Share Profile
            </Button>
          </div>

          <Button fullWidth size="lg" className="mt-4 shadow-lg" icon={<LayoutDashboard className="h-4 w-4" />} onClick={() => router.push("/dashboard")}>
            Go to Creator Dashboard
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
}

