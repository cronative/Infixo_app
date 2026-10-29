"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Download,
  Heart,
  Loader2,
  Palette,
  Smartphone,
  Sparkles,
  Square,
  Wand2,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { ThemeService } from "@/services/ThemeService";
import { buildProfileUrl, formatCount, formatCategoryDots } from "@/utils/format";
import { CARD_HEIGHT, CARD_WIDTH, CreatorCard } from "@/components/creator-card/CreatorCard";
import {
  CardLayoutType,
  resolveCardAppearance,
  useExportableImage,
} from "@/components/creator-card/cardAppearance";
import { cardFileName, downloadBlob, renderCardPng } from "@/components/creator-card/cardExport";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PAGE_COPY } from "@/components/dashboard/pageCopy";

const MAX_PREVIEW_WIDTH = 380;

interface LayoutOption {
  id: CardLayoutType;
  name: string;
  subtitle: string;
}

const LAYOUT_OPTIONS: LayoutOption[] = [
  { id: "classic", name: "Classic Story", subtitle: "Banner style" },
  { id: "minimal", name: "Minimal Spotlight", subtitle: "Clean & centered" },
  { id: "badge", name: "VIP Pass", subtitle: "Festival style" },
  { id: "cyber", name: "Cyber Neon", subtitle: "Futuristic dark" },
  { id: "editorial", name: "Editorial Luxe", subtitle: "Magazine style" },
];

interface ThemeOption {
  id: string;
  name: string;
  swatch: [string, string, string];
}

const THEME_OPTIONS: ThemeOption[] = [
  { id: "profile", name: "My Theme", swatch: ["#D4A373", "#10B981", "#7A2253"] },
  { id: "royal", name: "Inflixo", swatch: ["#7A2253", "#2563EB", "#93C5FD"] },
  { id: "obsidian", name: "Midnight", swatch: ["#0F172A", "#2563EB", "#64748B"] },
  { id: "emerald", name: "Emerald", swatch: ["#03281E", "#D97706", "#D4A373"] },
  { id: "sunset", name: "Sunset", swatch: ["#881337", "#FB923C", "#FED7AA"] },
  { id: "cyber", name: "Electric", swatch: ["#0D091F", "#06B6D4", "#7C3AED"] },
  { id: "ivory", name: "Minimal", swatch: ["#F59E0B", "#EA580C", "#E2E8F0"] },
  { id: "monochrome", name: "Pure", swatch: ["#000000", "#64748B", "#E2E8F0"] },
];

interface QuickTag {
  id: string;
  emoji: string;
  label: string;
  tagline: string;
}

const QUICK_TAGS: QuickTag[] = [
  { id: "journey", emoji: "❤️", label: "Support My Journey", tagline: "Support my creative journey ❤️" },
  { id: "world", emoji: "✨", label: "Explore My World", tagline: "Scan to explore my world ✨" },
  { id: "community", emoji: "💖", label: "Built for Community", tagline: "Built with love for my community 💖" },
  { id: "connect", emoji: "💛", label: "Let's Connect", tagline: "Let's connect & collaborate 💛" },
  { id: "watch", emoji: "⭐", label: "Watch My Content", tagline: "Watch my latest videos & series ⭐" },
  { id: "follow", emoji: "🎬", label: "Follow for More", tagline: "Follow for exclusive content & updates 🎬" },
];

export default function CreatorCardPage() {
  const {
    profile,
    socials,
    totalAudience,
    theme,
    loading,
    isTrialExpired,
    openTrialExpiredModal,
  } = useCreator();
  const { showToast } = useToast();

  const [selectedLayout, setSelectedLayout] = useState<CardLayoutType>("editorial");
  const [selectedThemeId, setSelectedThemeId] = useState<string>("profile");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("journey");
  const [customTagline, setCustomTagline] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<"portrait" | "square">("portrait");

  const primaryPlatforms = useMemo<("instagram" | "youtube" | "facebook")[]>(() => {
    const list: ("instagram" | "youtube" | "facebook")[] = [];
    if (socials.instagram?.username || (socials.instagram?.followers ?? 0) > 0) list.push("instagram");
    if (socials.youtube?.username || (socials.youtube?.subscribers ?? 0) > 0) list.push("youtube");
    if (socials.facebook?.username || (socials.facebook?.followers ?? 0) > 0) list.push("facebook");
    return list.length > 0 ? list : ["instagram", "youtube"];
  }, [socials]);

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

  // Active message & sharing text
  const activePreset = QUICK_TAGS.find((p) => p.id === selectedPresetId) ?? QUICK_TAGS[0];
  const activeTagline = customTagline.trim() || activePreset.tagline;

  // Scale frame
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

  // PNG Cache
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
  const [busy, setBusy] = useState<"download" | null>(null);

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
      getBlob().catch(() => {});
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

  const disabled = !assetsReady || busy !== null;

  return (
    <PageContainer>
      <PageHeader {...PAGE_COPY.creatorCard} />

      {/* Trial Expired Alert Banner */}
      {isTrialExpired && (
        <div className="relative overflow-hidden rounded-[5px] border border-rose-200 bg-gradient-to-r from-rose-50 via-amber-50/70 to-rose-50 p-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-rose-500 text-white shadow-xs">
                <Heart className="h-4 w-4 fill-current animate-pulse" />
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
              className="shrink-0 inline-flex items-center gap-1.5 rounded-[5px] bg-[#7A2253] hover:bg-[#5d193f] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Keep Profile Live</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {!username ? (
        <div className="rounded-[5px] border border-(--border) bg-white p-5 text-sm text-[#475569] shadow-2xs">
          Set your username first so your card can link to your public profile.{" "}
          <Link href="/dashboard/profile" className="font-semibold text-[#7A2253] underline underline-offset-2">
            Go to Profile
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start pt-2">
          {/* ── Left Column: Live Card Preview & Aspect Ratio Toggle ── */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div ref={frameRef} className="w-full max-w-[380px]">
              <div
                className="relative mx-auto overflow-hidden rounded-[5px] shadow-[0_20px_50px_rgba(0,0,0,0.12)] ring-1 ring-black/5"
                style={{
                  width: CARD_WIDTH * scale,
                  height: aspectRatio === "portrait" ? CARD_HEIGHT * scale : CARD_WIDTH * scale,
                  transition: "height 0.25s ease-in-out",
                }}
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
                    platforms={primaryPlatforms}
                  />
                </div>
                {!assetsReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
                    <Loader2 className="h-6 w-6 animate-spin text-[#7A2253]" />
                  </div>
                )}
              </div>
            </div>

            {/* Segmented Aspect Ratio Toggle */}
            <div className="mt-4 inline-flex h-8 items-center p-0.5 bg-white border border-[#ECECF0] rounded-[5px]">
              <button
                type="button"
                onClick={() => setAspectRatio("portrait")}
                className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-[5px] text-[13px] font-medium transition-all cursor-pointer ${
                  aspectRatio === "portrait"
                    ? "bg-[#7A2253] text-white"
                    : "text-[#6B6B76] hover:text-[#18181B]"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Portrait (9:16)</span>
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio("square")}
                className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-[5px] text-[13px] font-medium transition-all cursor-pointer ${
                  aspectRatio === "square"
                    ? "bg-[#7A2253] text-white"
                    : "text-[#6B6B76] hover:text-[#18181B]"
                }`}
              >
                <Square className="h-3.5 w-3.5" />
                <span>Square (1:1)</span>
              </button>
            </div>
          </div>

          {/* ── Right Column: Layouts, Themes, Messages & Download ── */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Card Layout Style */}
            <div className="rounded-[5px] border border-[#ECECF0] bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#F7EEF2] text-[#7A2253] shrink-0">
                    <Wand2 className="h-4 w-4" />
                  </div>
                  <h2 className="text-[16px] font-semibold text-[#18181B]">1. Card Layout Style</h2>
                </div>
                <span className="text-[12px] text-[#6B6B76] font-normal">5 styles</span>
              </div>

              <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2.5">
                {LAYOUT_OPTIONS.map((layout) => {
                  const active = selectedLayout === layout.id;
                  return (
                    <button
                      key={layout.id}
                      type="button"
                      onClick={() => setSelectedLayout(layout.id)}
                      className={`group relative flex flex-col items-center rounded-[5px] border p-2 text-center transition-all cursor-pointer ${
                        active
                          ? "border-2 border-[#7A2253] bg-white shadow-none"
                          : "border-[#ECECF0] bg-[#FAFAFB] hover:border-[#cbd5e1] hover:bg-white"
                      }`}
                    >
                      {active && (
                        <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-[#7A2253] text-white flex items-center justify-center z-10">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                      )}

                      {/* Mini Mockup Illustration */}
                      <div className="w-full aspect-[9/13] rounded-[5px] relative overflow-hidden border border-[#ECECF0] mb-2 flex flex-col items-center justify-center">
                        {layout.id === "classic" && (
                          <div className="w-full h-full bg-[#F0F7FF] flex flex-col">
                            <div className="h-[32%] w-full bg-[#BFDBFE]" />
                            <div className="flex-1 flex flex-col items-center pt-1 px-1">
                              <div className="-mt-3.5 h-5 w-5 rounded-full bg-white border border-[#93C5FD] shadow-2xs flex items-center justify-center">
                                <div className="h-3 w-3 rounded-full bg-[#BFDBFE]" />
                              </div>
                              <div className="w-8 h-1 bg-[#CBD5E1] rounded-full mt-1.5" />
                              <div className="w-5 h-1 bg-[#E2E8F0] rounded-full mt-1" />
                              <div className="w-6 h-6 bg-white border border-[#CBD5E1] rounded-[2px] mt-2 flex items-center justify-center">
                                <div className="w-3.5 h-3.5 bg-[#64748B] rounded-[1px]" />
                              </div>
                            </div>
                          </div>
                        )}

                        {layout.id === "minimal" && (
                          <div className="w-full h-full bg-[#FFF7ED] flex flex-col items-center justify-center p-1.5">
                            <div className="h-5 w-5 rounded-full bg-[#FED7AA] border border-[#FDBA74]" />
                            <div className="w-8 h-1 bg-[#FED7AA] rounded-full mt-1.5" />
                            <div className="w-5 h-1 bg-[#FFEDD5] rounded-full mt-1" />
                            <div className="w-6 h-6 bg-white border border-[#FED7AA] rounded-[2px] mt-2 flex items-center justify-center">
                              <div className="w-3.5 h-3.5 bg-[#EA580C]/70 rounded-[1px]" />
                            </div>
                          </div>
                        )}

                        {layout.id === "badge" && (
                          <div className="w-full h-full bg-[#F5F3FF] flex flex-col items-center p-1">
                            <div className="w-3.5 h-1 bg-[#C4B5FD] rounded-full mt-0.5" />
                            <div className="h-5 w-5 rounded-full bg-[#DDD6FE] mt-1 border border-[#C4B5FD]" />
                            <div className="w-8 h-1 bg-[#DDD6FE] rounded-full mt-1" />
                            <div className="w-7 h-1.5 bg-[#EDE9FE] border-t border-b border-[#C4B5FD] mt-1.5" />
                            <div className="w-6 h-6 bg-white border border-[#DDD6FE] rounded-[2px] mt-1.5 flex items-center justify-center">
                              <div className="w-3.5 h-3.5 bg-[#7C3AED]/70 rounded-[1px]" />
                            </div>
                          </div>
                        )}

                        {layout.id === "cyber" && (
                          <div className="w-full h-full bg-[#0B0F19] flex flex-col items-center justify-center p-1.5">
                            <div className="h-5 w-5 rounded-full bg-[#1E293B] border border-[#38BDF8] shadow-[0_0_6px_rgba(56,189,248,0.5)]" />
                            <div className="w-8 h-1 bg-[#38BDF8]/60 rounded-full mt-1.5" />
                            <div className="w-5 h-1 bg-[#334155] rounded-full mt-1" />
                            <div className="w-6 h-6 bg-[#0F172A] border border-[#38BDF8]/50 rounded-[2px] mt-2 flex items-center justify-center">
                              <div className="w-3.5 h-3.5 bg-[#38BDF8] rounded-[1px]" />
                            </div>
                          </div>
                        )}

                        {layout.id === "editorial" && (
                          <div className="w-full h-full bg-[#FAF6F0] flex flex-col items-center justify-center p-1.5 relative overflow-hidden">
                            <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#EADBCC]" />
                            <div className="absolute -bottom-3 -left-3 w-8 h-8 rounded-full bg-[#EADBCC]" />
                            <div className="relative z-10 h-5 w-5 rounded-full bg-white border border-[#D4A373] shadow-2xs flex items-center justify-center">
                              <div className="h-3 w-3 rounded-full bg-[#7A2253]" />
                            </div>
                            <div className="relative z-10 w-8 h-1 bg-[#0F172A] rounded-full mt-1.5" />
                            <div className="relative z-10 w-5 h-1 bg-[#7A2253] rounded-full mt-1" />
                            <div className="relative z-10 w-6 h-6 bg-white border border-[#E2E8F0] rounded-[2px] mt-1.5 flex items-center justify-center shadow-2xs">
                              <div className="w-3.5 h-3.5 bg-[#0F172A] rounded-[1px]" />
                            </div>
                          </div>
                        )}
                      </div>

                      <span
                        className={`text-xs font-bold line-clamp-2 break-words max-w-full ${
                          active ? "text-[#7A2253]" : "text-[#0f172a]"
                        }`}
                      >
                        {layout.name}
                      </span>
                      <span className="text-[10px] text-[#64748b] line-clamp-2 break-words max-w-full mt-0.5">
                        {layout.subtitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Color Theme */}
            <div className="rounded-[5px] border border-[#ECECF0] bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#F7EEF2] text-[#7A2253] shrink-0">
                    <Palette className="h-4 w-4" />
                  </div>
                  <h2 className="text-[16px] font-semibold text-[#18181B]">2. Color Theme</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedThemeId("profile")}
                  className="text-[12px] font-medium text-[#7A2253] hover:underline cursor-pointer"
                >
                  Profile Theme
                </button>
              </div>

              <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2.5">
                {THEME_OPTIONS.map((t) => {
                  const active = selectedThemeId === t.id;
                  const dots =
                    t.id === "profile"
                      ? [themeMeta.swatch[0] || "#D4A373", themeMeta.swatch[1] || "#10B981", "#7A2253"]
                      : t.swatch;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedThemeId(t.id)}
                      className={`flex flex-col items-center justify-center gap-2 rounded-[5px] border p-2.5 text-center transition-all cursor-pointer ${
                        active
                          ? "border-2 border-[#7A2253] bg-white shadow-none"
                          : "border-[#ECECF0] bg-[#FAFAFB] hover:border-[#cbd5e1] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {dots.map((color, idx) => (
                          <span
                            key={idx}
                            className="h-3.5 w-3.5 rounded-full border border-black/10"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <span
                        className={`text-[12px] font-medium break-words max-w-full ${
                          active ? "text-[#7A2253]" : "text-[#18181B]"
                        }`}
                      >
                        {t.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Message & Tagline */}
            <div className="rounded-[5px] border border-[#ECECF0] bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#F7EEF2] text-[#7A2253] shrink-0">
                    <Heart className="h-4 w-4" />
                  </div>
                  <h2 className="text-[16px] font-semibold text-[#18181B]">3. Message &amp; Tagline</h2>
                </div>
                <span className="text-[12px] font-medium text-[#7A2253]">Use quick tags</span>
              </div>

              {/* 6 Quick Tag Pills */}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2 mb-3.5">
                {QUICK_TAGS.map((tag) => {
                  const active = selectedPresetId === tag.id && !customTagline.trim();
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        setSelectedPresetId(tag.id);
                        setCustomTagline("");
                      }}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-[5px] border px-2.5 py-2 text-[12px] font-medium transition-all cursor-pointer ${
                        active
                          ? "border-[#7A2253] bg-[#F7EEF2] text-[#7A2253]"
                          : "border-[#ECECF0] bg-[#FAFAFB] text-[#3F3F46] hover:border-[#cbd5e1] hover:bg-white"
                      }`}
                    >
                      <span className="shrink-0">{tag.emoji}</span>
                      <span className="break-words text-center leading-tight whitespace-normal">{tag.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Tagline Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[12px] text-[#6B6B76]">
                  <label htmlFor="custom-tagline-input" className="font-medium">
                    Custom tag line (optional)
                  </label>
                  <span>
                    {(customTagline.trim() || activePreset.tagline).length}/60
                  </span>
                </div>

                <div className="relative">
                  <input
                    id="custom-tagline-input"
                    type="text"
                    value={customTagline}
                    onChange={(e) => setCustomTagline(e.target.value)}
                    placeholder={activePreset.tagline}
                    maxLength={60}
                    className="w-full rounded-[5px] border border-[#ECECF0] bg-white px-3.5 py-2 text-[13px] text-[#18181B] placeholder-[#94a3b8] transition-colors focus:border-[#7A2253] focus:outline-none"
                  />
                  {customTagline && (
                    <button
                      type="button"
                      onClick={() => setCustomTagline("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#6B6B76] hover:text-[#18181B]"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <p className="text-[12px] text-[#6B6B76]">
                  Appears under the QR code on your card and in your shared Story caption.
                </p>
              </div>
            </div>

            {/* ── Main Download Button ── */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={disabled}
              className="w-full h-9 rounded-[5px] bg-[#7A2253] hover:bg-[#661842] text-white font-medium text-[13px] shadow-none flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "download" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Download Card (1080 × 1920 HD)</span>
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
