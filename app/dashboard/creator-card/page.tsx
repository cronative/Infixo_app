"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  Cpu,
  Download,
  Heart,
  HeartHandshake,
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

const EMOTIONAL_PRESETS = [
  {
    id: "journey",
    label: "Support My Journey",
    tagline: "Support my creative journey ❤️",
    shareMessage: "Support my creative journey! 💖 Scan or tap to explore all my series, store & exclusive links:",
    emoji: "❤️",
  },
  {
    id: "world",
    label: "Explore My World",
    tagline: "Scan to explore my world ✨",
    shareMessage: "Welcome to my creative universe! ✨ Everything I make and recommend, all in one place:",
    emoji: "✨",
  },
  {
    id: "community",
    label: "Built for Community",
    tagline: "Built with love for my community 💖",
    shareMessage: "Made with genuine love for all of you ❤️ Tap or scan to explore my official creator hub:",
    emoji: "💖",
  },
  {
    id: "connect",
    label: "Let's Connect",
    tagline: "Let's connect & collaborate 🤝",
    shareMessage: "Excited to share my official creator portfolio! 🤝 Check out my series & media kit:",
    emoji: "🤝",
  },
  {
    id: "official",
    label: "Official Bio Hub",
    tagline: "Official verified creator hub 🌟",
    shareMessage: "Here's my verified Inflixo creator hub 🌟 All my links, videos & store in one place:",
    emoji: "🌟",
  },
];

export default function CreatorCardPage() {
  const {
    profile,
    totalAudience,
    theme,
    loading,
    isTrialExpired,
    openTrialExpiredModal,
  } = useCreator();
  const { showToast } = useToast();

  const [selectedLayout, setSelectedLayout] = useState<CardLayoutType>("classic");
  const [selectedThemeId, setSelectedThemeId] = useState<string>("profile");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("journey");
  const [customTagline, setCustomTagline] = useState<string>("");

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

  // Active emotional message for the card and sharing caption
  const activePreset = EMOTIONAL_PRESETS.find((p) => p.id === selectedPresetId) ?? EMOTIONAL_PRESETS[0];
  const activeTagline = customTagline.trim() || activePreset.tagline;
  const sharePrefix = customTagline.trim() ? customTagline.trim() : activePreset.shareMessage;
  const shareText = `${sharePrefix}\n${profileUrl}`;

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
    activeTagline,
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
    if (isTrialExpired) {
      showToast("Your public profile is hidden (Trial ended) — Reactivate to share with fans ❤️", "error");
      openTrialExpiredModal();
      return;
    }
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
    if (isTrialExpired) {
      showToast("Your public profile is hidden (Trial ended) — Reactivate now ❤️", "error");
      openTrialExpiredModal();
      return;
    }
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
    if (isTrialExpired) {
      showToast("Your public profile is hidden (Trial ended) — Reactivate to share with fans ❤️", "error");
      openTrialExpiredModal();
      return;
    }
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
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0f172a]">
          Creator Card
        </h1>
        <p className="mt-0.5 text-xs font-medium text-[#475569] sm:text-[13px]">
          Design your custom card with emotional taglines, curated layouts, and high-impact themes to share on Stories & Status.
        </p>
      </div>

      {/* Emotional Trial-Expired Banner */}
      {isTrialExpired && (
        <div className="relative overflow-hidden rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 via-amber-50/70 to-rose-50 p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm">
                <Heart className="h-5 w-5 fill-current animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Don&apos;t let your creative journey pause here, {profile.displayName || "Creator"}! ❤️
                </h3>
                <p className="mt-0.5 text-xs text-slate-600 leading-relaxed max-w-xl">
                  Your 7-day free trial has ended. Right now, anyone scanning your Creator Card QR code sees that your profile is currently hidden. Reactivate your plan so fans and brands can explore your world.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openTrialExpiredModal}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[#043084] hover:bg-[#032363] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Keep Profile Live</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

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
                  customMessage={activeTagline}
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

          {/* Controls: Layouts, Themes, Emotional Message & Actions */}
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

            {/* 3. Emotional Message & Tagline */}
            <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-xs sm:p-5">
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-1.5">
                  <HeartHandshake className="h-4 w-4 text-rose-500" />
                  <span className="text-xs font-bold tracking-wider text-[#0f172a] uppercase">
                    3. Emotional Message & Tagline
                  </span>
                </div>
                <span className="text-[11px] font-medium text-rose-600">Connect with fans</span>
              </div>

              {/* Emotional Preset Pills */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {EMOTIONAL_PRESETS.map((preset) => {
                  const active = selectedPresetId === preset.id && !customTagline.trim();
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedPresetId(preset.id);
                        setCustomTagline("");
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                        active
                          ? "border-rose-500 bg-rose-50 text-rose-700 ring-1 ring-rose-500/50"
                          : "border-[#e2e8f0] bg-white text-[#475569] hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
                      }`}
                    >
                      <span>{preset.emoji}</span>
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Tagline input */}
              <div className="space-y-1.5">
                <label htmlFor="custom-tagline-input" className="text-[11px] font-medium text-[#64748b]">
                  Card tagline & Story caption:
                </label>
                <div className="relative">
                  <input
                    id="custom-tagline-input"
                    type="text"
                    value={customTagline}
                    onChange={(e) => setCustomTagline(e.target.value)}
                    placeholder={activePreset.tagline}
                    maxLength={60}
                    className="w-full rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-3.5 py-2 text-xs font-medium text-[#0f172a] placeholder-[#94a3b8] transition-colors focus:border-[#043084] focus:bg-white focus:outline-none"
                  />
                  {customTagline && (
                    <button
                      type="button"
                      onClick={() => setCustomTagline("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-700"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-[#94a3b8]">
                  Appears under the QR code on your card and in your shared Story caption.
                </p>
              </div>
            </div>

            {/* 4. Action Buttons */}
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
