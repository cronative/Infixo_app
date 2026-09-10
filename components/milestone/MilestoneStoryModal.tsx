"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Sparkles,
  Download,
  Share2,
  Copy,
  Check,
  Palette,
  Eye,
  Sliders,
  ExternalLink,
  Loader2,
  Send,
} from "lucide-react";
import { toPng, toBlob } from "html-to-image";
import {
  MilestoneStoryCard,
  StoryThemeKey,
} from "@/components/milestone/MilestoneStoryCard";
import { MilestoneService, PlatformStatItem, MilestoneInfo } from "@/services/MilestoneService";
import { SocialAccounts } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { XTwitterIcon } from "@/components/shared/BrandIcons";

interface MilestoneStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  displayName: string;
  username: string;
  category?: string | null;
  photoUrl?: string | null;
  socials?: Partial<SocialAccounts> | null;
  otherSocials?: any[];
  totalAudience?: number;
}

const THEME_OPTIONS: { id: StoryThemeKey; label: string; previewColor: string; bgClass: string }[] = [
  { id: "midnight-gold", label: "Midnight Gold", previewColor: "#E6C583", bgClass: "from-[#201736] to-[#0c0915]" },
  { id: "neon-cyber", label: "Neon Cyber", previewColor: "#38BDF8", bgClass: "from-[#150930] to-[#090918]" },
  { id: "sunset-velvet", label: "Sunset Velvet", previewColor: "#FB7185", bgClass: "from-[#2e0d19] to-[#170710]" },
  { id: "minimal-luxe", label: "Minimal Luxe", previewColor: "#E2E8F0", bgClass: "from-[#1e2029] to-[#101115]" },
];

export function MilestoneStoryModal({
  isOpen,
  onClose,
  displayName,
  username,
  category,
  photoUrl,
  socials,
  otherSocials,
  totalAudience,
}: MilestoneStoryModalProps) {
  const { showToast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<StoryThemeKey>("midnight-gold");
  const [showPlatforms, setShowPlatforms] = useState(true);
  const [customNote, setCustomNote] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  // Calculate milestone details
  const finalTotal =
    typeof totalAudience === "number" && totalAudience > 0
      ? totalAudience
      : MilestoneService.calculateTotalAudience(socials, otherSocials);

  const milestoneInfo: MilestoneInfo = MilestoneService.getMilestoneDetails(
    finalTotal || 0,
    socials,
    displayName || "Creator",
    username || "creator"
  );

  // Reset custom note when milestone details change
  useEffect(() => {
    if (milestoneInfo.activePlatforms.length > 0) {
      const names = milestoneInfo.activePlatforms.map((p) => p.name).join(", ");
      setCustomNote(`Across ${names} & exclusive Inflixo series`);
    } else {
      setCustomNote("Grateful for every single supporter ❤️");
    }
  }, [milestoneInfo.formattedTotal]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      showToast("Generating 1080×1920 HD Story... 🎨");

      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2, // 540x960 * 2 = 1080x1920 Instagram Story Resolution
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `inflixo-milestone-${milestoneInfo.formattedTotal.toLowerCase()}-${username || "creator"}.png`;
      link.href = dataUrl;
      link.click();

      showToast("HD Story downloaded! Ready to post on Instagram ✨");
    } catch (err) {
      console.error("Story export error:", err);
      showToast("Could not download image. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativeShare = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);

      const blob = await toBlob(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });

      if (!blob) throw new Error("Could not generate image blob");

      const fileName = `milestone-${milestoneInfo.formattedTotal}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Milestone Unlocked: ${milestoneInfo.formattedTotal} Fanbase!`,
          text: milestoneInfo.captions.storyText,
        });
        showToast("Shared successfully! 🎉");
      } else {
        // Fallback for desktop or unsupported browsers
        handleDownload();
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Share error:", err);
        handleDownload();
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });

      if (!blob) throw new Error("Blob error");

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopiedImage(true);
        showToast("HD Story copied to clipboard! Paste directly into messages ✨");
        setTimeout(() => setCopiedImage(false), 2500);
      } else {
        handleDownload();
      }
    } catch (err) {
      console.error("Copy image error:", err);
      handleDownload();
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyCaption = async () => {
    const success = await copyToClipboard(milestoneInfo.captions.storyText);
    if (success) {
      setCopiedCaption(true);
      showToast("Celebration caption copied! ✨");
      setTimeout(() => setCopiedCaption(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(milestoneInfo.captions.whatsappText);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(milestoneInfo.captions.twitterText);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#13141a] border border-white/10 text-white shadow-2xl overflow-hidden my-auto flex flex-col md:flex-row max-h-[95vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT COLUMN: 9:16 Visual Canvas Preview */}
        <div className="md:w-1/2 p-6 flex flex-col items-center justify-center bg-[#090a0f] border-b md:border-b-0 md:border-r border-white/10 overflow-hidden relative">
          <div className="w-full flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-2 text-xs font-bold text-white/80">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>9:16 Instagram & WhatsApp Story</span>
            </div>
            <span className="text-[10px] font-semibold text-white/40 tracking-wider">
              1080 × 1920 HD
            </span>
          </div>

          {/* Scaled Preview Frame */}
          <div className="relative w-full flex items-center justify-center overflow-hidden py-2">
            {/* The scaled container for crisp viewing */}
            <div
              className="origin-center shadow-2xl rounded-2xl overflow-hidden border border-white/20 transition-transform duration-200"
              style={{
                transform: "scale(0.55)",
                width: "540px",
                height: "960px",
                margin: "-216px -121px", // Adjust bounding box for scale(0.55)
              }}
            >
              <MilestoneStoryCard
                ref={cardRef}
                displayName={displayName}
                username={username}
                category={category}
                photoUrl={photoUrl}
                totalFanbaseFormatted={milestoneInfo.formattedTotal}
                milestoneTitle={milestoneInfo.milestoneTitle}
                customNote={customNote}
                platforms={milestoneInfo.activePlatforms}
                theme={theme}
                showPlatforms={showPlatforms}
              />
            </div>
          </div>

          <p className="text-[11px] text-white/40 mt-3 text-center">
            Tap download or share to get crystal-clear 1080×1920 graphic
          </p>
        </div>

        {/* RIGHT COLUMN: Controls & Virality Launchpad */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto space-y-6">
          <div>
            {/* Header */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/10 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-400/20">
                <Sparkles className="w-3 h-3" />
                <span>Inflixo Viral Signature</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Share Your {milestoneInfo.formattedTotal} Milestone
              </h2>
              <p className="text-xs text-white/65 leading-relaxed">
                Turn your total fanbase into an organic billboard. When you post your story,
                followers and other creators discover your Inflixo link.
              </p>
            </div>

            {/* Theme Selector */}
            <div className="mt-6 space-y-2.5">
              <label className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>Choose Story Aesthetic</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {THEME_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                      theme === t.id
                        ? "bg-white/10 border-white/40 ring-2 ring-white/30 text-white"
                        : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: t.previewColor }}
                    />
                    <span className="truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Tagline */}
            <div className="mt-5 space-y-2">
              <label className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Story Note / Subtitle</span>
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                maxLength={90}
                placeholder="e.g. Grateful for 79,000+ strong family ❤️"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-xs focus:outline-none focus:border-amber-400/60 transition-colors"
              />
            </div>

            {/* Platform breakdown toggle */}
            <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-white">Show Platform Breakdown</p>
                <p className="text-[11px] text-white/50">Display Instagram, YouTube & Facebook badges</p>
              </div>
              <input
                type="checkbox"
                checked={showPlatforms}
                onChange={(e) => setShowPlatforms(e.target.checked)}
                className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Action Launch Buttons */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            {/* Primary Action: Direct Share / Download */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleNativeShare}
                disabled={isExporting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rendering...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Share to Stories</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={isExporting}
                className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Download HD (1080p)</span>
              </button>
            </div>

            {/* Secondary Actions: Quick Channels */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyImage}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
                title="Copy Image to Clipboard"
              >
                {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Card</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="p-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleShareTwitter}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
              >
                <XTwitterIcon className="w-3.5 h-3.5" />
                <span>Post on X</span>
              </button>
            </div>

            {/* Caption copy pill */}
            <button
              type="button"
              onClick={handleCopyCaption}
              className="w-full py-2 px-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-white/60 hover:text-white/90 text-[11px] flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="truncate pr-2">
                Caption: &ldquo;{milestoneInfo.captions.storyText.slice(0, 60)}...&rdquo;
              </span>
              <span className="shrink-0 font-bold text-amber-400 flex items-center gap-1">
                {copiedCaption ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedCaption ? "Copied" : "Copy"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
