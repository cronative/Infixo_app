"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Palette,
  Layers,
  Copy,
  Eye,
  UserRound,
  Plus,
  ExternalLink,
  ChevronRight,
  Film,
  Play,
  Sparkles,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { ThemeService } from "@/services/ThemeService";
import { formatCount, formatSyncDate } from "@/utils/format";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { AuthService } from "@/services/AuthService";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import {
  getSeriesUsage,
  getTotalEpisodesUsage,
  canCreateSeries,
} from "@/services/subscriptionLimits";
import { LimitReachedModal } from "@/components/ui/LimitReachedModal";

function extractHandle(handleOrUrl?: string): string | null {
  if (!handleOrUrl) return null;
  const trimmed = handleOrUrl.trim().replace(/\/$/, "");
  if (!trimmed) return null;
  if (!trimmed.includes("/") && !trimmed.includes("http")) {
    return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
  }
  const parts = trimmed.split("/");
  const last = parts[parts.length - 1];
  if (!last || last.includes("http")) return null;
  return last.startsWith("@") ? last : `@${last}`;
}

export default function DashboardOverviewPage() {
  const router = useRouter();
  const { profile, socials, series, theme, totalAudience, updateSocials } = useCreator();
  const { showToast } = useToast();
  const themeMeta = ThemeService.getThemeMeta(theme);

  const [isSyncing, setIsSyncing] = useState(false);

  function handleRefreshStats() {
    setIsSyncing(true);
    updateSocials({});
    showToast("Audience stats refreshed! ✨");
    setTimeout(() => {
      setIsSyncing(false);
    }, 400);
  }

  // Early Access Limit calculations
  const seriesUsage = getSeriesUsage(series);
  const totalEpisodesUsage = getTotalEpisodesUsage(series);

  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "series" | "episode";
    seriesTitle?: string;
  }>({
    isOpen: false,
    type: "series",
  });

  const handleStr = profile.username || "username";
  const profileUrl = `inflixo.com/${handleStr}`;

  async function handleCopyLink() {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
    const fullLink = `${origin}/${handleStr}`;
    const success = await copyToClipboard(fullLink);
    if (success) {
      showToast("Profile link copied to clipboard! ✨");
    } else {
      showToast("Could not copy link", "error");
    }
  }

  function handleCreateSeriesClick() {
    if (!canCreateSeries(series)) {
      setModalState({ isOpen: true, type: "series" });
    } else {
      router.push("/dashboard/series");
    }
  }

  const isInstagramDone = Boolean(socials.instagram.username || socials.instagram.url);
  const isYoutubeDone = Boolean(socials.youtube.username || socials.youtube.url);
  const isFacebookDone = Boolean(socials.facebook.username || socials.facebook.url);

  return (
    <div className="min-h-dvh bg-[#F9FAFB] text-slate-900 pb-12">
      <div className="mx-auto max-w-5xl px-3 sm:px-6 py-4 sm:py-6 space-y-5">
        
        {/* 1. CLEAN TOP HEADER (No Duplicate Welcome Card) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-display text-lg font-black text-slate-900 truncate">
              Welcome back, {profile.displayName ? profile.displayName.split(" ")[0] : "Creator"} 👋
            </h1>
            {/* Handle Copy Pill */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold text-[#803D63] hover:bg-indigo-100 transition-colors cursor-pointer shrink-0"
              title="Copy Profile Link"
            >
              <span>{profileUrl}</span>
              <Copy className="h-3 w-3 opacity-70" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <a
              href={`/${handleStr}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5 text-[#803D63]" />
              <span>View Public Profile ↗</span>
            </a>
            <button
              type="button"
              onClick={() => {
                AuthService.logout();
                router.push("/login");
              }}
              className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* 2. HERO CARD: TOTAL FANBASE & SOCIAL CHANNELS */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#803D63]">
                TOTAL FANBASE
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-[#111827] mt-0.5">
                {formatCount(totalAudience)}
              </h2>
              <p className="text-xs font-medium text-slate-500 mt-1">
                Combined audience count synced across all connected social channels.
              </p>
            </div>

            {/* Minimal Ghost Refresh Button */}
            <button
              type="button"
              onClick={handleRefreshStats}
              className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-[#803D63] transition-colors cursor-pointer"
              title={`Last synced: ${formatSyncDate(socials.updatedAt)}. Click to refresh.`}
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin text-[#803D63]" : ""}`} />
            </button>
          </div>

          {/* Social Channel Flat White Tiles */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Instagram */}
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-50 text-pink-600 border border-pink-100 shrink-0">
                  <InstagramIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {socials.instagram.name || "Instagram"}
                  </p>
                  <p className="text-[11px] font-medium text-slate-400 truncate">
                    {isInstagramDone ? extractHandle(socials.instagram.username || socials.instagram.url) || `@${handleStr}` : "Not connected"}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                {isInstagramDone ? (
                  <p className="text-sm font-extrabold text-[#111827]">
                    {formatCount(socials.instagram.followers)}
                  </p>
                ) : (
                  <Link href="/dashboard/socials" className="text-xs font-bold text-[#803D63] hover:underline">
                    Connect →
                  </Link>
                )}
              </div>
            </div>

            {/* YouTube */}
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100 shrink-0">
                  <YoutubeIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {socials.youtube.channelTitle || "YouTube"}
                  </p>
                  <p className="text-[11px] font-medium text-slate-400 truncate">
                    {isYoutubeDone ? extractHandle(socials.youtube.username || socials.youtube.url) || `@${handleStr}` : "Not connected"}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                {isYoutubeDone ? (
                  <p className="text-sm font-extrabold text-[#111827]">
                    {formatCount(socials.youtube.subscribers)}
                  </p>
                ) : (
                  <Link href="/dashboard/socials" className="text-xs font-bold text-[#803D63] hover:underline">
                    Connect →
                  </Link>
                )}
              </div>
            </div>

            {/* Facebook */}
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                  <FacebookIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {socials.facebook.name || "Facebook"}
                  </p>
                  <p className="text-[11px] font-medium text-slate-400 truncate">
                    {isFacebookDone ? extractHandle(socials.facebook.username || socials.facebook.url) || `@${handleStr}` : "Not connected"}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                {isFacebookDone ? (
                  <p className="text-sm font-extrabold text-[#111827]">
                    {formatCount(socials.facebook.followers)}
                  </p>
                ) : (
                  <Link href="/dashboard/socials" className="text-xs font-bold text-[#803D63] hover:underline">
                    Connect →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. SLIM EARLY ACCESS BANNER STRIP */}
        <div className="bg-[#F6EBF1] border border-[#E8DCE4] rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-900 font-medium">
            <Sparkles className="h-4 w-4 text-[#803D63] shrink-0" />
            <span>🎉 Early Access Active • <strong>{seriesUsage.current}/3 Series</strong> • <strong>{totalEpisodesUsage.current}/15 Episodes</strong></span>
          </div>
          <Link href="/dashboard/subscription" className="font-semibold text-[#803D63] hover:underline shrink-0">
            Plan Benefits →
          </Link>
        </div>

        {/* 4. CLEAN 4-COLUMN QUICK ACTIONS GRID */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#803D63] uppercase tracking-wider px-0.5">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Primary Action Card: Create Series */}
            <button
              type="button"
              onClick={handleCreateSeriesClick}
              className="tap-scale flex items-center gap-3 rounded-xl bg-[#803D63] hover:bg-[#6D3254] text-white font-bold p-3.5 shadow-xs transition-all cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white shrink-0">
                <Plus className="h-4 w-4" />
              </div>
              <span className="text-xs font-extrabold truncate">+ Create Series</span>
            </button>

            {/* Secondary Action 1: Add Episode */}
            <Link
              href="/dashboard/series"
              className="tap-scale flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 font-bold text-[#374151] p-3.5 shadow-2xs transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 shrink-0">
                <Play className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold truncate">Add Episode</span>
            </Link>

            {/* Secondary Action 2: Edit Profile */}
            <Link
              href="/dashboard/profile"
              className="tap-scale flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 font-bold text-[#374151] p-3.5 shadow-2xs transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 shrink-0">
                <UserRound className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold truncate">Edit Profile</span>
            </Link>

            {/* Secondary Action 3: Preview & Share */}
            <Link
              href="/dashboard/preview"
              className="tap-scale flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 font-bold text-[#374151] p-3.5 shadow-2xs transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 shrink-0">
                <Eye className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold truncate">Preview &amp; Share</span>
            </Link>
          </div>
        </div>

        {/* 5. SERIES & EPISODES SECTION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900">Your OTT Series</h3>
              <p className="text-xs text-slate-500 font-medium">Organized multi-part video series</p>
            </div>
            <span className="rounded-full bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-0.5 text-xs font-bold">
              {seriesUsage.current} / {seriesUsage.max} Series
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Existing Series Cards */}
            {series.map((s) => {
              const epCount = s.seasons?.reduce((acc, season) => acc + (season.episodes?.length || 0), 0) || 0;
              return (
                <div
                  key={s.id}
                  className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white shadow-2xs overflow-hidden hover:border-gray-300 transition-colors"
                >
                  <div>
                    {/* 16:9 Landscape Card Poster */}
                    <div className="relative w-full aspect-video rounded-t-xl overflow-hidden bg-slate-950 flex items-center justify-center">
                      {s.posterDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.posterDataUrl} alt={s.title} className="h-full w-full object-cover" />
                      ) : (
                        <Film className="h-8 w-8 text-slate-600" />
                      )}
                      {/* Crisp Neutral Counter Badge */}
                      <span className="absolute top-2 right-2 rounded-full bg-gray-100 text-gray-700 border border-gray-200 text-xs px-2.5 py-0.5 font-bold shadow-xs">
                        {epCount}/5 Eps
                      </span>
                    </div>

                    <div className="p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                        <h4 className="font-display text-sm font-semibold text-[#111827] truncate">
                          {s.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 font-medium line-clamp-1">
                        {s.genre || "Entertainment"} • {s.language || "English"}
                      </p>
                    </div>
                  </div>

                  {/* Micro-Actions Pair */}
                  <div className="p-3.5 pt-0 flex items-center justify-between border-t border-gray-100">
                    <Link
                      href="/dashboard/series"
                      className="text-xs font-semibold text-slate-600 hover:text-[#803D63] transition-colors"
                    >
                      Edit
                    </Link>
                    <Link
                      href="/dashboard/series"
                      className="bg-[#F6EBF1] text-[#803D63] font-medium text-xs px-3 py-1.5 rounded-lg border border-[#E8DCE4] hover:bg-indigo-100 transition-colors"
                    >
                      + Add Episode
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* Dashed Empty Slot Placeholder */}
            {series.length < 3 && (
              <button
                type="button"
                onClick={handleCreateSeriesClick}
                className="tap-scale flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-6 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer min-h-[220px]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-[#803D63] mb-2">
                  <Plus className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-900">+ Create Next Series</p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">({3 - series.length} slots remaining)</p>
              </button>
            )}
          </div>
        </div>

        {/* 6. PHASE 2 ANALYTICS PREPARATION STRIP */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center space-y-1 shadow-2xs">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#803D63] bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Phase 2 Feature</span>
          </div>
          <h4 className="font-display text-sm font-extrabold text-slate-900">
            Fanbase Insights &amp; Profile Analytics (Coming Soon)
          </h4>
          <p className="text-xs text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
            Detailed click-through rates, profile views, and video retention tracking will unlock in Phase 2.
          </p>
        </div>

        {/* 7. ACTIVE CARD THEME STRIP */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[#803D63] border border-indigo-100">
              <Palette className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Card Theme</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="font-display font-bold text-slate-900 text-xs truncate">{themeMeta.name}</p>
                {themeMeta.swatch && themeMeta.swatch.length > 0 && (
                  <div className="flex items-center gap-1 shrink-0">
                    {themeMeta.swatch.map((c, i) => (
                      <span key={i} className="h-2.5 w-2.5 rounded-full border border-slate-200" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/themes"
            className="shrink-0 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-1.5 text-xs font-bold text-[#803D63] transition-colors"
          >
            Change Theme →
          </Link>
        </div>

        {/* Limit Reached Modal Popup */}
        <LimitReachedModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState({ ...modalState, isOpen: false })}
          type={modalState.type}
          seriesTitle={modalState.seriesTitle}
        />
      </div>
    </div>
  );
}

