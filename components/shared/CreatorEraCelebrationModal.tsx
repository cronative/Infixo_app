"use client";

import { useEffect, useState } from "react";
import { Sparkles, Share2, Download, Copy, Check } from "lucide-react";
import { CreatorEra } from "@/lib/creatorEra";
import { formatCount } from "@/utils/format";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useToast } from "@/contexts/ToastContext";

interface CreatorEraCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  era: CreatorEra | null;
  username: string;
  fanbase: number;
}

export function CreatorEraCelebrationModal({
  isOpen,
  onClose,
  era,
  username,
  fanbase,
}: CreatorEraCelebrationModalProps) {
  const { showToast } = useToast();
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Immediately mark celebration flag as seen in DB
    fetch("/api/creator/era/celebrate", { method: "POST" }).catch((e) =>
      console.error("Failed to clear celebration flag in DB:", e)
    );
  }, [isOpen]);

  if (!isOpen || !era) return null;

  const handle = username.replace(/^@/, "");
  const cardUrl = `/api/era-card/${handle}`;
  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${handle}`
    : `https://inflixo.com/${handle}`;

  async function handleShare() {
    setSharing(true);
    try {
      const response = await fetch(cardUrl);
      const blob = await response.blob();
      const file = new File([blob], `${handle}-creator-era.png`, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `I entered my ${era?.badge} Era on Inflixo! ✨`,
          text: `Check out my Creator Era on Inflixo: ${profileUrl} #MyCreatorEra`,
          files: [file],
        });
        showToast("Shared Creator Era card! 🎉");
        onClose();
        return;
      }
    } catch (e) {
      console.log("Web Share fallback:", e);
    } finally {
      setSharing(false);
    }

    // Fallback: download card image + copy profile link
    try {
      const a = document.createElement("a");
      a.href = cardUrl;
      a.download = `${handle}-creator-era.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      await copyToClipboard(`${profileUrl} · #MyCreatorEra`);
      showToast("Era card downloaded & link copied! ✨");
    } catch {
      showToast("Era card ready! Visit your profile to share.");
    }
    onClose();
  }

  // Pre-generate confetti pieces
  const confettiColors = ["#7A2253", "#F472B6", "#FBBF24", "#38BDF8", "#34D399", "#A855F7", "#F87171"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      {/* CSS Confetti Rain (3s) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {Array.from({ length: 40 }).map((_, i) => {
          const left = (i * 2.5) % 100;
          const animDelay = (i * 0.08) % 2;
          const animDuration = 2 + (i % 3);
          const color = confettiColors[i % confettiColors.length];
          const size = 6 + (i % 6);
          const isRound = i % 2 === 0;

          return (
            <span
              key={i}
              style={{
                position: "absolute",
                top: "-20px",
                left: `${left}%`,
                width: `${size}px`,
                height: `${size * (isRound ? 1 : 1.6)}px`,
                backgroundColor: color,
                borderRadius: isRound ? "50%" : "2px",
                opacity: 0.85,
                animation: `confetti-fall ${animDuration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${animDelay}s infinite`,
              }}
            />
          );
        })}
      </div>

      <style jsx global>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg) scale(0.7);
            opacity: 0;
          }
        }
      `}</style>

      {/* Main Celebration Card */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md bg-white rounded-[16px] border border-[#FCE7F3] shadow-2xl p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95 duration-300">
        {/* Glow Icon */}
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-[#7A2253] to-[#F472B6] text-white shadow-xl shadow-[#7A2253]/25 ring-8 ring-[#FFF0F5]">
          <Sparkles className="h-10 w-10 animate-spin" style={{ animationDuration: "6s" }} />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0F5] border border-[#FCE7F3] text-xs font-bold text-[#7A2253]">
            ✦ NEW CREATOR ERA UNLOCKED
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight leading-tight">
            You entered your {era.badge} Era ✨
          </h2>
          <p className="text-xs sm:text-sm text-[#64748b] font-medium leading-relaxed max-w-xs mx-auto">
            You achieved an all-time peak community of{" "}
            <strong className="text-[#0f172a]">{formatCount(fanbase)}</strong> fans across your
            connected social channels.
          </p>
        </div>

        {/* Card Preview Banner */}
        <div className="p-3 bg-[#FFF5F7] rounded-[10px] border border-[#FCE7F3] flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#7A2253] text-white font-extrabold text-xs">
              {era.stage}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#0f172a] truncate">{era.badge} Share Card</p>
              <p className="text-[11px] text-[#64748b]">1080×1920 Story PNG ready to post</p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-[#7A2253] shrink-0">#MyCreatorEra</span>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            className="tap-scale w-full flex items-center justify-center gap-2 py-3 px-5 rounded-[8px] bg-[#7A2253] hover:bg-[#681c46] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#7A2253]/20 transition-all cursor-pointer disabled:opacity-60"
          >
            <Share2 className="h-4 w-4" />
            <span>{sharing ? "Preparing Card..." : "Share Era Card"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-4 rounded-[8px] border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-xs font-semibold text-[#64748b] hover:text-[#0f172a] transition-colors cursor-pointer"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
