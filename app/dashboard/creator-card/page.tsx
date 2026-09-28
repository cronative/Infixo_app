"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Check,
  Copy,
  Cpu,
  Download,
  LayoutTemplate,
  Loader2,
  Palette,
  Share2,
  Sparkles,
  Ticket,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { ThemeService } from "@/services/ThemeService";
import { buildProfileUrl, formatCount, formatCategoryDots } from "@/utils/format";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { CARD_HEIGHT, CARD_WIDTH, CreatorCard } from "@/components/creator-card/CreatorCard";
import {
  CARD_LAYOUTS,
  CARD_THEME_PRESETS,
  CardLayoutType,
  resolveCardAppearance,
  useExportableImage,
} from "@/components/creator-card/cardAppearance";
import { cardFileName, downloadBlob, renderCardPng, shareCardFile } from "@/components/creator-card/cardExport";

const MAX_PREVIEW_WIDTH = 380;

const LAYOUT_ICONS: Record<CardLayoutType, React.ComponentType<{ className?: string }>> = {
  classic: LayoutTemplate,
  minimal: Sparkles,
  badge: Ticket,
  cyber: Cpu,
  editorial: BookOpen,
};

export default function CreatorCardPage() {
  const { profile, totalAudience, theme, loading } = useCreator();
  const { showToast } = useToast();

  const [selectedLayout, setSelectedLayout] = useState<CardLayoutType>("classic");
  const [selectedThemeId, setSelectedThemeId] = useState<string>("profile");

  const username = (profile.username || "").replace(/^@/, "");
  const profileUrl = username ? buildProfileUrl(username) : "";
  const themeMeta = ThemeService.getThemeMeta(theme);

  const avatar = useExportableImage(profile.photoDataUrl, 480);
  const assetsReady = avatar.ready;

  const appearance = useMemo(
    () => resolveCardAppearance(selectedThemeId, themeMeta),
    [selectedThemeId, themeMeta]
  );

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
    username,
    profile.displayName,
    category,
    fanbase,
    profileUrl,
    theme,
    selectedLayout,
    selectedThemeId,
    avatar.src?.length,
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
    <div className="w-full space-y-5 pb-12 text-left sm:space-y-6">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0f172a]">
          Creator Card
        </h1>
        <p className="mt-0.5 text-xs font-medium text-[#475569] sm:text-[13px]">
          Choose your layout and color palette to share on Instagram Stories, WhatsApp Status, or print.
        </p>
      </div>

      {!username ? (
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 text-sm text-[#475569] shadow-xs">
          Set your username first so your card can link to your public profile.{" "}
          <Link href="/dashboard/profile" className="font-semibold text-[#043084] underline underline-offset-2">
            Go to Profile
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-7 lg:flex-row lg:items-start lg:justify-center lg:gap-10 xl:gap-14">
          {/* Card Preview Frame */}
          <div ref={frameRef} className="w-full max-w-[380px] shrink-0">
            <div
              className="relative mx-auto overflow-hidden rounded-[22px] shadow-[0_18px_50px_rgba(4,48,132,0.16)] ring-1 ring-black/5"
              style={{ width: CARD_WIDTH * scale, height: CARD_HEIGHT * scale }}
            >
              <div
                style={{
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                <CreatorCard
                  ref={cardRef}
                  displayName={profile.displayName}
                  username={username}
                  category={category}
                  photoSrc={avatar.src}
                  fanbase={fanbase}
                  profileUrl={profileUrl}
                  appearance={appearance}
                  layout={selectedLayout}
                />
              </div>
              {!assetsReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
                  <Loader2 className="h-6 w-6 animate-spin text-[#043084]" />
                </div>
              )}
            </div>

            <p className="mt-3 text-center text-[11px] font-medium text-[#64748b]">
              Exact 9:16 ratio · exports at 1080 × 1920 high resolution
            </p>
          </div>

          {/* Controls: Layouts, Themes & Actions */}
          <div className="w-full max-w-[440px] space-y-5 lg:pt-1">
            {/* 1. Layout Selector */}
            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-xs sm:p-5">
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-bold tracking-wider text-[#0f172a] uppercase">
                  1. Card Layout Style
                </span>
                <span className="text-[11px] font-medium text-[#64748b]">
                  {CARD_LAYOUTS.length} styles
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {CARD_LAYOUTS.map((layout) => {
                  const Icon = LAYOUT_ICONS[layout.id];
                  const active = selectedLayout === layout.id;
                  return (
                    <button
                      key={layout.id}
                      type="button"
                      onClick={() => setSelectedLayout(layout.id)}
                      className={`group relative flex items-start gap-3 rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                        active
                          ? "border-[#043084] bg-[#043084]/5 ring-1 ring-[#043084]"
                          : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                          active
                            ? "bg-[#043084] text-white"
                            : "bg-[#f1f5f9] text-[#475569] group-hover:bg-[#e2e8f0] group-hover:text-[#0f172a]"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-bold truncate ${
                              active ? "text-[#043084]" : "text-[#0f172a]"
                            }`}
                          >
                            {layout.name}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] leading-snug text-[#64748b] line-clamp-1">
                          {layout.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Theme / Color Palette Selector */}
            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-xs sm:p-5">
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-[#043084]" />
                  <span className="text-xs font-bold tracking-wider text-[#0f172a] uppercase">
                    2. Color Theme
                  </span>
                </div>
                <span className="text-[11px] font-medium text-[#64748b]">
                  {selectedThemeId === "profile" ? "Profile Theme" : "Custom Preset"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {/* Active Profile Theme Option */}
                <button
                  type="button"
                  onClick={() => setSelectedThemeId("profile")}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                    selectedThemeId === "profile"
                      ? "border-[#043084] bg-[#043084]/5 ring-1 ring-[#043084]"
                      : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {themeMeta.swatch.slice(0, 3).map((color, i) => (
                      <span
                        key={i}
                        className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span
                    className={`text-[11px] font-bold truncate max-w-full ${
                      selectedThemeId === "profile" ? "text-[#043084]" : "text-[#0f172a]"
                    }`}
                  >
                    My Theme
                  </span>
                </button>

                {/* Curated Presets */}
                {CARD_THEME_PRESETS.map((preset) => {
                  const active = selectedThemeId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedThemeId(preset.id)}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                        active
                          ? "border-[#043084] bg-[#043084]/5 ring-1 ring-[#043084]"
                          : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {preset.swatch.map((color, i) => (
                          <span
                            key={i}
                            className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-2xs"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <span
                        className={`text-[11px] font-bold truncate max-w-full ${
                          active ? "text-[#043084]" : "text-[#0f172a]"
                        }`}
                      >
                        {preset.name.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleDownload}
                disabled={disabled}
                className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#043084] px-4 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {busy === "download" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download Card (1080×1920)
              </button>

              <button
                type="button"
                onClick={handleShare}
                disabled={disabled}
                className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-4 text-sm font-semibold text-[#043084] shadow-xs transition-all hover:-translate-y-0.5 hover:border-[#cbd5e1] hover:bg-[#f8fafc] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {busy === "share" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                Share to Stories / Status
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-[#475569] transition-colors hover:bg-[#f1f5f9] hover:text-[#043084]"
              >
                {linkCopied ? <Check className="h-3.5 w-3.5 text-[#17845B]" /> : <Copy className="h-3.5 w-3.5" />}
                {linkCopied ? "Link copied" : "Copy Profile Link"}
              </button>

              {!fanbase && !loading && (
                <p className="pt-1 text-center text-[11px] text-[#64748b]">
                  <Link href="/dashboard/socials" className="font-semibold text-[#043084] underline underline-offset-2">
                    Connect your socials
                  </Link>{" "}
                  to display your Total Fanbase on your card.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
