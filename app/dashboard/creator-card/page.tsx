"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy, Download, Loader2, Share2 } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { ThemeService } from "@/services/ThemeService";
import { buildProfileUrl, formatCount } from "@/utils/format";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { formatCategoryDots } from "@/utils/format";
import { CARD_HEIGHT, CARD_WIDTH, CreatorCard } from "@/components/creator-card/CreatorCard";
import { deriveCardAppearance, useExportableImage } from "@/components/creator-card/cardAppearance";
import { cardFileName, downloadBlob, renderCardPng, shareCardFile } from "@/components/creator-card/cardExport";

const MAX_PREVIEW_WIDTH = 380;

export default function CreatorCardPage() {
  const { profile, totalAudience, theme, loading } = useCreator();
  const { showToast } = useToast();

  const username = (profile.username || "").replace(/^@/, "");
  const profileUrl = username ? buildProfileUrl(username) : "";
  const themeMeta = ThemeService.getThemeMeta(theme);

  const avatar = useExportableImage(profile.photoDataUrl, 480);
  const assetsReady = avatar.ready;

  const appearance = useMemo(() => deriveCardAppearance(themeMeta), [themeMeta]);
  const category = formatCategoryDots(profile.category, profile.customCategory);
  const fanbase = totalAudience > 0 ? formatCount(totalAudience) : null;
  const shareText = `Check out my Inflixo 👋\n${profileUrl}`;

  // ── Preview scaling (layout stays 540×960 so preview === export) ──
  const frameRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(el.clientWidth, MAX_PREVIEW_WIDTH) / CARD_WIDTH);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [username]);

  // ── Pre-rendered PNG so Share can open the native sheet within the tap gesture ──
  const renderKey = [
    username, profile.displayName, category, fanbase, profileUrl, theme, avatar.src?.length,
  ].join("|");
  const cached = useRef<{ key: string; blob: Blob } | null>(null);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const getBlob = useCallback(async () => {
    if (cached.current?.key === renderKey) return cached.current.blob;
    if (!cardRef.current) throw new Error("Card not mounted");
    const key = renderKey;
    const blob = await renderCardPng(cardRef.current);
    cached.current = { key, blob };
    return blob;
  }, [renderKey]);

  useEffect(() => {
    if (!username || !assetsReady || loading) return;
    const timer = setTimeout(() => {
      getBlob().catch(() => {
        /* rendered again on demand */
      });
    }, 700);
    return () => clearTimeout(timer);
  }, [username, assetsReady, loading, getBlob]);

  const handleDownload = async () => {
    setBusy("download");
    try {
      downloadBlob(await getBlob(), cardFileName(username));
      showToast("Creator Card downloaded ✨");
    } catch (err) {
      console.error("Creator Card export failed:", err);
      showToast("Could not create the card image. Please try again.", "error");
    } finally {
      setBusy(null);
    }
  };

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(profileUrl);
    if (ok) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      showToast("Profile link copied!");
    } else {
      showToast("Could not copy link", "error");
    }
    return ok;
  };

  const handleShare = async () => {
    setBusy("share");
    try {
      const blob = await getBlob();
      const result = await shareCardFile(blob, cardFileName(username), shareText);
      if (result === "shared") {
        showToast("Creator Card shared 🎉");
      } else if (result === "unsupported") {
        downloadBlob(blob, cardFileName(username));
        const copied = await copyToClipboard(profileUrl);
        showToast(copied ? "Card downloaded and profile link copied" : "Card downloaded — share it from your gallery");
      }
    } catch (err) {
      console.error("Creator Card share failed:", err);
      showToast("Could not create the card image. Please try again.", "error");
    } finally {
      setBusy(null);
    }
  };

  const disabled = !assetsReady || busy !== null;

  return (
    <div className="w-full space-y-4 pb-8 text-left sm:space-y-5">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0f172a]">Creator Card</h1>
        <p className="mt-0.5 text-xs font-medium text-[#475569] sm:text-[13px]">Share your Inflixo with one scan.</p>
      </div>

      {!username ? (
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 text-sm text-[#475569] shadow-xs">
          Set your username first so your card can link to your public profile.{" "}
          <Link href="/dashboard/profile" className="font-semibold text-[#043084] underline underline-offset-2">
            Go to Profile
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 lg:flex-row lg:items-start lg:justify-center lg:gap-10">
          <div ref={frameRef} className="w-full max-w-[380px]">
            <div
              className="relative mx-auto overflow-hidden rounded-[22px] shadow-[0_18px_50px_rgba(4,48,132,0.14)] ring-1 ring-black/5"
              style={{ width: CARD_WIDTH * scale, height: CARD_HEIGHT * scale }}
            >
              <div style={{ width: CARD_WIDTH, height: CARD_HEIGHT, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                <CreatorCard
                  ref={cardRef}
                  displayName={profile.displayName}
                  username={username}
                  category={category}
                  photoSrc={avatar.src}
                  fanbase={fanbase}
                  profileUrl={profileUrl}
                  appearance={appearance}
                />
              </div>
              {!assetsReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
                  <Loader2 className="h-6 w-6 animate-spin text-[#043084]" />
                </div>
              )}
            </div>
          </div>

          <div className="w-full max-w-[380px] space-y-2.5 lg:max-w-[300px] lg:pt-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={disabled}
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#043084] px-4 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {busy === "download" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download Card
            </button>
            <button
              type="button"
              onClick={handleShare}
              disabled={disabled}
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-4 text-sm font-semibold text-[#043084] shadow-xs transition-all hover:-translate-y-0.5 hover:border-[#cbd5e1] hover:bg-[#f8fafc] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {busy === "share" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
              Share Card
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-[#475569] transition-colors hover:bg-[#f1f5f9] hover:text-[#043084]"
            >
              {linkCopied ? <Check className="h-3.5 w-3.5 text-[#17845B]" /> : <Copy className="h-3.5 w-3.5" />}
              {linkCopied ? "Link copied" : "Copy Profile Link"}
            </button>

            <p className="pt-1 text-center text-[11px] font-medium text-[#64748b]">
              1080 × 1920 PNG · sized for Stories and Status
            </p>
            {!fanbase && !loading && (
              <p className="text-center text-[11px] text-[#64748b]">
                <Link href="/dashboard/socials" className="font-semibold text-[#043084] underline underline-offset-2">
                  Connect your socials
                </Link>{" "}
                to show your Total Fanbase on the card.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
