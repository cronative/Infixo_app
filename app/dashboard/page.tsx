"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Copy,
  ExternalLink,
  Film,
  Globe,
  Layers,
  Link2,
  MessageCircle,
  Palette,
  Play,
  Plus,
  QrCode,
  RefreshCw,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
  XTwitterIcon,
  LinkedinIcon,
  ThreadsIcon,
  SpotifyIcon,
} from "@/components/shared/BrandIcons";
import { QRCode } from "@/components/creator-card/QRCode";
import { Modal, ModalBody } from "@/components/ui/Modal";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { formatSimplifiedSyncDate } from "@/lib/socialSyncDate";
import { buildProfileUrl, formatCount } from "@/utils/format";
import { SocialService } from "@/services/SocialService";
import { customLinksRepository } from "@/repositories/localRepository";
import type { DashboardSummary } from "@/lib/dashboardSummary";
import type { SocialAccounts, CustomLink } from "@/types";

function MetricSkeleton({ small = false }: { small?: boolean }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded bg-slate-100 ${small ? "h-3 w-16" : "h-6 w-20"}`} />;
}

function extractUsername(url?: string | null): string {
  if (!url) return "";
  const cleaned = url.trim();
  if (cleaned.includes("/")) {
    const parts = cleaned.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    return last.replace(/^@/, "");
  }
  return cleaned.replace(/^@/, "");
}

export default function DashboardOverviewPage() {
  const { profile, socials, totalAudience, loading: profileLoading, series, theme, handleViewProfile } = useCreator();
  const { showToast } = useToast();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const shareRef = useRef<HTMLDivElement>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);

  const displayName = profile.displayName || "Creator";
  const handle = (profile.username || "").replace(/^@/, "");
  const profileUrl = buildProfileUrl(handle);
  const waiting = loading || profileLoading;

  // Load custom links on mount
  useEffect(() => {
    try {
      const stored = customLinksRepository.get();
      setCustomLinks(stored || []);
    } catch {
      setCustomLinks([]);
    }
  }, [reload]);

  // Load dashboard summary API
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch("/api/dashboard/summary", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || body.status !== 1 || !body.data) throw new Error("Summary unavailable");
        return body.data as DashboardSummary;
      })
      .then((data) => {
        if (!controller.signal.aborted) setSummary(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setSummary(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [profile.id, reload]);

  // Handle outside click for share popover
  useEffect(() => {
    if (!shareOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (shareRef.current && !shareRef.current.contains(event.target as Node)) setShareOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShareOpen(false);
        shareButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [shareOpen]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copyProfile() {
    const success = await copyToClipboard(profileUrl);
    setCopied(success);
    setShareOpen(false);
    showToast(success ? "Bio link copied to clipboard! ✨" : "Could not copy link", success ? "success" : "error");
  }

  // Merged socials combining useCreator() and summary (instant paint + server sync)
  const effectiveSocials: SocialAccounts = useMemo(() => ({
    ...socials,
    ...(summary?.socials?.accounts || {}),
  }), [socials, summary]);

  const effectiveTotalAudience = useMemo(() => {
    if (totalAudience > 0) return totalAudience;
    if (summary?.socials?.total && summary.socials.total > 0) return summary.socials.total;
    return SocialService.calculateTotalAudience(effectiveSocials);
  }, [totalAudience, summary, effectiveSocials]);

  // Extract platforms cleanly from effectiveSocials
  const platforms = useMemo(() => {
    const list: Array<{
      key: string;
      label: string;
      username: string;
      count: number;
      unit: string;
      syncedAt?: string;
      icon: React.ComponentType<{ className?: string }>;
      badgeBg: string;
    }> = [];

    const igHandle = effectiveSocials.instagram?.username || extractUsername(effectiveSocials.instagram?.url);
    const igFollowers = Number(effectiveSocials.instagram?.followers ?? 0);
    if (igHandle || igFollowers > 0 || effectiveSocials.instagram?.url) {
      list.push({
        key: "instagram",
        label: "Instagram",
        username: igHandle || "instagram",
        count: igFollowers,
        unit: "followers",
        syncedAt: effectiveSocials.instagram?.lastSyncedAt || effectiveSocials.updatedAt,
        icon: InstagramIcon,
        badgeBg: "bg-pink-50 text-pink-600",
      });
    }

    const ytHandle = effectiveSocials.youtube?.username || effectiveSocials.youtube?.channelTitle || extractUsername(effectiveSocials.youtube?.url);
    const ytSubs = Number(effectiveSocials.youtube?.subscribers ?? effectiveSocials.youtube?.followers ?? 0);
    if (ytHandle || ytSubs > 0 || effectiveSocials.youtube?.url) {
      list.push({
        key: "youtube",
        label: "YouTube",
        username: ytHandle || "youtube",
        count: ytSubs,
        unit: "subscribers",
        syncedAt: effectiveSocials.youtube?.lastSyncedAt || effectiveSocials.updatedAt,
        icon: YoutubeIcon,
        badgeBg: "bg-red-50 text-red-600",
      });
    }

    const fbHandle = effectiveSocials.facebook?.username || effectiveSocials.facebook?.name || extractUsername(effectiveSocials.facebook?.url);
    const fbFollowers = Number(effectiveSocials.facebook?.followers ?? 0);
    if (fbHandle || fbFollowers > 0 || effectiveSocials.facebook?.url) {
      list.push({
        key: "facebook",
        label: "Facebook",
        username: fbHandle || "facebook",
        count: fbFollowers,
        unit: "followers",
        syncedAt: effectiveSocials.facebook?.lastSyncedAt || effectiveSocials.updatedAt,
        icon: FacebookIcon,
        badgeBg: "bg-blue-50 text-blue-600",
      });
    }

    const twHandle = effectiveSocials.twitter?.username || extractUsername(effectiveSocials.twitter?.url);
    const twFollowers = Number(effectiveSocials.twitter?.followers ?? 0);
    if (twHandle || twFollowers > 0 || effectiveSocials.twitter?.url) {
      list.push({
        key: "twitter",
        label: "X (Twitter)",
        username: twHandle || "x",
        count: twFollowers,
        unit: "followers",
        syncedAt: effectiveSocials.twitter?.lastSyncedAt,
        icon: XTwitterIcon,
        badgeBg: "bg-slate-100 text-slate-800",
      });
    }

    const liHandle = effectiveSocials.linkedin?.username || extractUsername(effectiveSocials.linkedin?.url);
    const liFollowers = Number(effectiveSocials.linkedin?.followers ?? 0);
    if (liHandle || liFollowers > 0 || effectiveSocials.linkedin?.url) {
      list.push({
        key: "linkedin",
        label: "LinkedIn",
        username: liHandle || "linkedin",
        count: liFollowers,
        unit: "connections",
        syncedAt: effectiveSocials.linkedin?.lastSyncedAt,
        icon: LinkedinIcon,
        badgeBg: "bg-blue-50 text-[#0077b5]",
      });
    }

    const thHandle = effectiveSocials.threads?.username || extractUsername(effectiveSocials.threads?.url);
    const thFollowers = Number(effectiveSocials.threads?.followers ?? 0);
    if (thHandle || thFollowers > 0 || effectiveSocials.threads?.url) {
      list.push({
        key: "threads",
        label: "Threads",
        username: thHandle || "threads",
        count: thFollowers,
        unit: "followers",
        syncedAt: effectiveSocials.threads?.lastSyncedAt,
        icon: ThreadsIcon,
        badgeBg: "bg-slate-100 text-slate-900",
      });
    }

    const spHandle = effectiveSocials.spotify?.username || extractUsername(effectiveSocials.spotify?.url);
    const spFollowers = Number(effectiveSocials.spotify?.followers ?? 0);
    if (spHandle || spFollowers > 0 || effectiveSocials.spotify?.url) {
      list.push({
        key: "spotify",
        label: "Spotify",
        username: spHandle || "spotify",
        count: spFollowers,
        unit: "listeners",
        syncedAt: effectiveSocials.spotify?.lastSyncedAt,
        icon: SpotifyIcon,
        badgeBg: "bg-emerald-50 text-emerald-600",
      });
    }

    return list;
  }, [effectiveSocials]);

  // Derived Series stats
  const activeSeriesCount = summary?.series?.count ?? series.length ?? 0;
  const activeEpisodesCount = useMemo(() => {
    if (summary?.series?.episodes != null) return summary.series.episodes;
    return series.reduce((total, s) => {
      const eps = s.seasons?.reduce((seasonTotal, season) => seasonTotal + (season.episodes?.length || 0), 0) || 0;
      return total + eps;
    }, 0);
  }, [summary, series]);

  // Analytics stats
  const totalViews = summary?.analytics?.views ?? 0;
  const totalClicks = summary?.analytics?.clicks ?? 0;
  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0.0";

  // Bio links count
  const activeLinksCount = summary?.links ?? customLinks.length ?? 0;
  const collabPackagesCount = summary?.mediakit ?? 0;

  // Profile readiness checklist
  const hasProfile = Boolean(profile.username && profile.displayName);
  const hasSocials = platforms.length > 0;
  const hasSeries = activeSeriesCount > 0;
  const hasLinks = activeLinksCount > 0;

  const readinessScore = useMemo(() => {
    let score = 0;
    if (hasProfile) score += 25;
    if (hasSocials) score += 25;
    if (hasSeries) score += 25;
    if (hasLinks) score += 25;
    return score;
  }, [hasProfile, hasSocials, hasSeries, hasLinks]);

  return (
    <div className="w-full space-y-4">
      {/* 1. COMMAND HEADER: Hero Identity & Bio Link Strip */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Creator Profile Overview */}
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="relative shrink-0">
              <CreatorAvatar
                src={profile.photoDataUrl}
                name={displayName}
                className="h-12 w-12 rounded-xl border border-slate-200/80 object-cover shadow-2xs sm:h-13 sm:w-13"
              />
              <span
                className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500"
                title="Profile active"
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                  {displayName}
                </h1>
                {profile.isVerified && (
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[#7A2253]" />
                )}
                <span className="inline-flex items-center rounded-md bg-[#7A2253]/10 px-2 py-0.5 text-xs font-semibold text-[#7A2253]">
                  @{handle || "handle"}
                </span>
                {profile.category && (
                  <span className="hidden rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 sm:inline-block">
                    {profile.category}
                  </span>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Public Profile Active
                </span>
                <span className="text-slate-300">·</span>
                <span>Theme: <strong className="font-semibold text-slate-700 capitalize">{theme.replace(/-/g, " ")}</strong></span>
              </div>
            </div>
          </div>

          {/* Right Action Bar & Bio Link Pill */}
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {/* Interactive Bio Link Box */}
            <div className="flex h-9 items-center rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 text-xs text-slate-700 transition-colors hover:border-slate-300">
              <Globe className="mr-1.5 h-3.5 w-3.5 text-[#7A2253]" />
              <span className="font-medium text-slate-500 sm:inline">inflixo.com/</span>
              <span className="font-bold text-slate-800">{handle}</span>
              <button
                type="button"
                onClick={copyProfile}
                className="ml-2 inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] font-semibold text-slate-600 hover:bg-white hover:text-[#7A2253] cursor-pointer transition-colors shadow-2xs"
                title="Copy link"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* View Live Button */}
            <button
              type="button"
              onClick={handleViewProfile}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-98 shadow-2xs"
            >
              <span>View Live</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Share Menu */}
            <div ref={shareRef} className="relative">
              <button
                ref={shareButtonRef}
                type="button"
                onClick={() => setShareOpen((v) => !v)}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-[#7A2253] px-3.5 text-xs font-semibold text-white shadow-xs transition-all hover:opacity-95 active:scale-98"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Share</span>
              </button>

              {shareOpen && (
                <div className="absolute right-0 z-30 mt-1.5 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg text-xs animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={copyProfile}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                    <span>Copy profile link</span>
                  </button>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out my official link in bio: ${profileUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShareOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Share on WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => { setShareOpen(false); setQrOpen(true); }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <QrCode className="h-3.5 w-3.5 text-slate-400" />
                    <span>Show QR Code</span>
                  </button>
                </div>
              )}
            </div>

            {/* Reload button */}
            <button
              type="button"
              onClick={() => setReload((v) => v + 1)}
              disabled={waiting}
              aria-label="Refresh data"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 cursor-pointer shadow-2xs"
              title="Refresh stats"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${waiting ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </section>

      {/* 2. CORE METRICS STRIP: High-Density 4-KPI Grid */}
      <section aria-label="Key Performance Indicators" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* KPI 1: Total Reach */}
        <Link
          href="/dashboard/socials"
          className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs transition-all hover:border-[#7A2253]/40 hover:shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Reach</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7A2253]/10 text-[#7A2253]">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums">
            {waiting && effectiveTotalAudience === 0 ? <MetricSkeleton /> : formatCount(effectiveTotalAudience)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1">
              {platforms.length > 0 ? (
                <>
                  <div className="flex -space-x-1">
                    {platforms.slice(0, 3).map((p) => {
                      const Icon = p.icon;
                      return (
                        <div key={p.key} className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 ring-1 ring-white">
                          <Icon className="h-2.5 w-2.5" />
                        </div>
                      );
                    })}
                  </div>
                  <span className="ml-1 font-medium">{platforms.length} linked</span>
                </>
              ) : (
                <span>No socials linked</span>
              )}
            </div>
            <span className="inline-flex items-center font-semibold text-[#7A2253] group-hover:translate-x-0.5 transition-transform">
              Edit <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </Link>

        {/* KPI 2: 30D Profile Views */}
        <Link
          href="/dashboard/analytics"
          className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs transition-all hover:border-blue-400/40 hover:shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">30D Profile Views</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <BarChart3 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums">
            {waiting ? <MetricSkeleton /> : formatCount(totalViews)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{totalClicks} clicks · {ctr}% CTR</span>
            <span className="inline-flex items-center font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
              Stats <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </Link>

        {/* KPI 3: OTT Video Series */}
        <Link
          href="/dashboard/series"
          className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs transition-all hover:border-purple-400/40 hover:shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Video Series</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Film className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums">
            {waiting ? <MetricSkeleton /> : activeSeriesCount}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{activeEpisodesCount} episodes live</span>
            <span className="inline-flex items-center font-semibold text-purple-600 group-hover:translate-x-0.5 transition-transform">
              Series <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </Link>

        {/* KPI 4: Bio Links & Collabs */}
        <Link
          href="/dashboard/links"
          className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs transition-all hover:border-emerald-400/40 hover:shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Bio Links</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Link2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums">
            {waiting ? <MetricSkeleton /> : activeLinksCount}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{collabPackagesCount} collab packages</span>
            <span className="inline-flex items-center font-semibold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
              Links <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </Link>
      </section>

      {/* 3. MAIN WORKSTATION: Two-Column Layout (8 cols left / 4 cols right) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 items-start">
        {/* LEFT COLUMN: Audience Reach, Video Series & Bio Links (8 cols) */}
        <div className="space-y-4 lg:col-span-8">
          {/* Section A: Verified Social Audience Table */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 sm:text-sm">
                  Verified Social Channels
                </h2>
                <p className="text-[11px] text-slate-500">
                  Audience numbers displayed on your public Inflixo page
                </p>
              </div>
              <Link
                href="/dashboard/socials"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <span>Edit Channels</span>
                <ArrowUpRight className="h-3 w-3 opacity-60" />
              </Link>
            </div>

            {waiting ? (
              <div className="space-y-3 py-4">
                <MetricSkeleton small />
                <MetricSkeleton small />
              </div>
            ) : platforms.length === 0 ? (
              <div className="py-7 text-center space-y-2.5">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#7A2253]/10 text-[#7A2253]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">No social channels connected</p>
                  <p className="text-[11px] text-slate-500">Link your Instagram, YouTube or X to showcase verified reach.</p>
                </div>
                <Link
                  href="/dashboard/socials"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#7A2253] px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-95 shadow-xs transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Connect Social Accounts</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {platforms.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <div key={platform.key} className="flex items-center justify-between py-3 first:pt-3 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${platform.badgeBg}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            @{platform.username}
                          </p>
                          <p className="text-[10px] text-slate-400 capitalize">
                            {platform.label} · Synced {formatSimplifiedSyncDate(platform.syncedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold text-slate-900 tabular-nums sm:text-sm">
                          {formatCount(platform.count)}
                        </span>
                        <span className="ml-1 text-[11px] font-normal text-slate-500">
                          {platform.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section B: OTT Video Series (Inflixo Core Feature) */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 sm:text-sm">
                    OTT Video Series
                  </h2>
                  <span className="rounded bg-purple-50 px-1.5 py-0.2 text-[10px] font-bold text-purple-700">
                    Bingeable
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Organize your videos into seasons and episodes without algorithm clutter
                </p>
              </div>
              <Link
                href="/dashboard/series"
                className="inline-flex items-center gap-1 rounded-lg bg-[#7A2253] px-2.5 py-1 text-xs font-semibold text-white hover:opacity-95 shadow-xs transition-all"
              >
                <Plus className="h-3 w-3" />
                <span>New Series</span>
              </Link>
            </div>

            {series.length === 0 ? (
              <div className="py-7 text-center space-y-2.5">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Film className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">No Video Series created yet</p>
                  <p className="text-[11px] text-slate-500">
                    Turn your YouTube &amp; Instagram videos into an OTT Netflix-style series on your bio.
                  </p>
                </div>
                <Link
                  href="/dashboard/series"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-[#7A2253]" />
                  <span>Create Your First Series</span>
                </Link>
              </div>
            ) : (
              <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {series.slice(0, 4).map((s) => {
                  const episodes = s.seasons?.reduce((acc, season) => acc + (season.episodes?.length || 0), 0) || 0;
                  return (
                    <Link
                      key={s.id}
                      href="/dashboard/series"
                      className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5 transition-all hover:border-[#7A2253]/40 hover:bg-white hover:shadow-2xs"
                    >
                      {s.posterDataUrl ? (
                        <img
                          src={s.posterDataUrl}
                          alt={s.title}
                          className="h-12 w-10 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="flex h-12 w-10 items-center justify-center rounded-lg bg-purple-100/60 text-purple-600 shrink-0 border border-purple-200">
                          <Play className="h-4 w-4 fill-purple-600" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate group-hover:text-[#7A2253]">
                          {s.title}
                        </p>
                        <p className="text-[10.5px] text-slate-500 truncate">
                          {s.genre || "General"} · {episodes} episodes
                        </p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section C: Custom Bio Links Hub */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 sm:text-sm">
                  Custom Bio Links
                </h2>
                <p className="text-[11px] text-slate-500">
                  Priority buttons, shop links, and WhatsApp direct chat
                </p>
              </div>
              <Link
                href="/dashboard/links"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <span>Manage Links</span>
                <ArrowUpRight className="h-3 w-3 opacity-60" />
              </Link>
            </div>

            {customLinks.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-slate-500">No custom outbound links added yet.</p>
                <Link
                  href="/dashboard/links"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-[#7A2253]" />
                  <span>Add Priority Bio Link</span>
                </Link>
              </div>
            ) : (
              <div className="pt-2 divide-y divide-slate-100">
                {customLinks.slice(0, 3).map((link) => (
                  <div key={link.id} className="flex items-center justify-between py-2.5 first:pt-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                        <Link2 className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{link.title}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-xs">{link.url}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: Profile Preview, Readiness & Studio Tools (4 cols) */}
        <div className="space-y-4 lg:col-span-4">
          {/* Card 1: Live Bio Link Preview Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/80 to-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Live Bio Card
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live on Web
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <CreatorAvatar
                  src={profile.photoDataUrl}
                  name={displayName}
                  className="h-9 w-9 rounded-lg border border-slate-200 object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                  <p className="text-[11px] text-[#7A2253] font-medium truncate">@{handle}</p>
                </div>
              </div>
              {profile.bio && (
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {profile.bio}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={copyProfile}
                className="inline-flex h-8 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-all shadow-2xs"
              >
                <Copy className="h-3 w-3" />
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
              <button
                type="button"
                onClick={handleViewProfile}
                className="inline-flex h-8 items-center justify-center gap-1 rounded-xl bg-[#7A2253] text-xs font-semibold text-white hover:opacity-95 cursor-pointer transition-all shadow-xs"
              >
                <span>Preview</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Card 2: Profile Readiness Progress Bar */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Profile Readiness
              </h3>
              <span className="text-xs font-extrabold text-[#7A2253] tabular-nums">
                {readinessScore}%
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-[#7A2253] transition-all duration-500 rounded-full"
                style={{ width: `${readinessScore}%` }}
              />
            </div>

            <ul className="space-y-2 text-xs">
              <li className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-2">
                  {hasProfile ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-slate-300" />}
                  <span>Username &amp; Profile details</span>
                </div>
                {hasProfile && <span className="text-[10px] font-semibold text-emerald-600">Done</span>}
              </li>

              <li className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-2">
                  {hasSocials ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-slate-300" />}
                  <span>Connect Social Networks</span>
                </div>
                {!hasSocials && (
                  <Link href="/dashboard/socials" className="text-[10px] font-semibold text-[#7A2253] hover:underline">
                    Connect →
                  </Link>
                )}
              </li>

              <li className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-2">
                  {hasSeries ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-slate-300" />}
                  <span>Create OTT Video Series</span>
                </div>
                {!hasSeries && (
                  <Link href="/dashboard/series" className="text-[10px] font-semibold text-[#7A2253] hover:underline">
                    Create →
                  </Link>
                )}
              </li>

              <li className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-2">
                  {hasLinks ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-slate-300" />}
                  <span>Add Priority Bio Links</span>
                </div>
                {!hasLinks && (
                  <Link href="/dashboard/links" className="text-[10px] font-semibold text-[#7A2253] hover:underline">
                    Add link →
                  </Link>
                )}
              </li>
            </ul>
          </div>

          {/* Card 3: Studio Quick Tools */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 pb-2.5 border-b border-slate-100">
              Studio Quick Tools
            </h3>
            <nav className="divide-y divide-slate-100 text-xs">
              <Link
                href="/dashboard/themes"
                className="flex items-center justify-between py-2.5 text-slate-700 hover:text-[#7A2253] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Palette className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">Customize Theme &amp; Colors</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>

              <Link
                href="/dashboard/mediakit"
                className="flex items-center justify-between py-2.5 text-slate-700 hover:text-[#7A2253] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Media Kit &amp; Rate Card</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>

              <Link
                href="/dashboard/products"
                className="flex items-center justify-between py-2.5 text-slate-700 hover:text-[#7A2253] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="h-4 w-4 text-pink-600" />
                  <span className="font-medium">Shop &amp; Recommendations</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>

              <Link
                href="/dashboard/reviews"
                className="flex items-center justify-between py-2.5 text-slate-700 hover:text-[#7A2253] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">Client Testimonials</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
            </nav>
          </section>
        </div>
      </div>

      {/* QR Code Sharing Modal */}
      <Modal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        size="sm"
        title="Share your public profile"
        description={`Scan to visit inflixo.com/${handle}`}
      >
        <ModalBody>
          <div className="flex flex-col items-center gap-4 py-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <QRCode value={profileUrl} size={180} />
            </div>
            <p className="text-xs text-slate-500 font-mono">inflixo.com/{handle}</p>
            <button
              type="button"
              onClick={copyProfile}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#7A2253] px-4 text-xs font-semibold text-white shadow-xs hover:opacity-95 cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied!" : "Copy profile link"}</span>
            </button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}
