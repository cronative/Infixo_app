"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight, BarChart3, Briefcase, Check, ChevronRight,
  Copy, ExternalLink, Film, Link2, MessageCircle, Plus,
  QrCode, RefreshCw, Share2, ShoppingBag, Sparkles, Star, Users,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { QRCode } from "@/components/creator-card/QRCode";
import { Modal, ModalBody } from "@/components/ui/Modal";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { formatSimplifiedSyncDate } from "@/lib/socialSyncDate";
import { buildProfileUrl, formatCount, formatQuantity } from "@/utils/format";
import type { DashboardSummary } from "@/lib/dashboardSummary";

const adminBtnClass =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-98 cursor-pointer";

function MetricSkeleton({ small = false }: { small?: boolean }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded bg-slate-100 ${small ? "h-3 w-16" : "h-6 w-20"}`} />;
}

export default function DashboardOverviewPage() {
  const { profile, loading: profileLoading, series } = useCreator();
  const { showToast } = useToast();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);

  const displayName = profile.displayName || "Creator";
  const handle = (profile.username || "").replace(/^@/, "");
  const profileUrl = buildProfileUrl(handle);
  const waiting = loading || profileLoading;

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

  const socialSummary = summary?.socials;
  const platforms = socialSummary
    ? Object.entries(socialSummary.accounts).flatMap(([key, value]) => {
        if (!value || typeof value !== "object" || !("url" in value)) return [];
        const account = value as { url?: string; username?: string; followers?: number; subscribers?: number; lastSyncedAt?: string };
        const count = account.subscribers ?? account.followers ?? 0;
        if (!account.url && !account.username && !count) return [];
        const username = account.username || account.url?.split("/").filter(Boolean).pop() || key;
        return [{ key, username: username.replace(/^@/, ""), count, syncedAt: account.lastSyncedAt || socialSummary.accounts.updatedAt }];
      })
    : [];

  const syncedAt = socialSummary?.accounts.updatedAt;
  const lastSynced = syncedAt && Number.isFinite(Date.parse(syncedAt))
    ? new Date(syncedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : "Live";

  const totalViews = summary?.analytics?.views ?? 0;
  const totalClicks = summary?.analytics?.clicks ?? 0;
  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0.0";

  return (
    <div className="w-full space-y-3 text-slate-900">
      {/* 1. ADMIN HEADER BAR - Sleek, tight, high-density */}
      <header className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[#e2e8f0] bg-white p-3 shadow-2xs">
        {/* Left: Identity & Live Link */}
        <div className="flex min-w-0 items-center gap-2.5">
          <CreatorAvatar
            src={profile.photoDataUrl}
            name={displayName}
            className="h-9 w-9 shrink-0 rounded-lg border border-[#e2e8f0]"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-[#181716] sm:text-base">
                {displayName}
              </h1>
              <span className="hidden sm:inline-block rounded-md bg-[#7A2253]/[0.08] px-1.5 py-0.5 text-[10.5px] font-bold text-[#7A2253]">
                @{handle}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <button
                type="button"
                onClick={copyProfile}
                className="group inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-[#7A2253] cursor-pointer transition-colors"
                title="Click to copy bio link"
              >
                <span>inflixo.com/{handle}</span>
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 opacity-60 group-hover:opacity-100" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setReload((v) => v + 1)}
            disabled={waiting}
            aria-label="Refresh data"
            className={`${adminBtnClass} w-8 px-0`}
            title="Refresh stats"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${waiting ? "animate-spin" : ""}`} />
          </button>

          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={adminBtnClass}
          >
            <span>View Live</span>
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>

          <div ref={shareRef} className="relative">
            <button
              ref={shareButtonRef}
              type="button"
              onClick={() => setShareOpen((v) => !v)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#7A2253] px-2.5 text-xs font-semibold text-white shadow-2xs hover:opacity-95 cursor-pointer transition-all active:scale-98"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </button>

            {shareOpen && (
              <div className="absolute right-0 z-30 mt-1 w-44 rounded-xl border border-[#e2e8f0] bg-white p-1 shadow-lg text-xs">
                <button
                  type="button"
                  onClick={copyProfile}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                  <span>Copy bio link</span>
                </button>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(profileUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShareOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Share on WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => { setShareOpen(false); setQrOpen(true); }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <QrCode className="h-3.5 w-3.5 text-slate-400" />
                  <span>QR Code</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. CORE METRICS STRIP (Tight 4-card grid, no fluff) */}
      <section aria-label="Key Performance Indicators" className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {/* Metric 1: Total Reach / Fanbase */}
        <Link
          href="/dashboard/socials"
          className="group rounded-xl border border-[#e2e8f0] bg-white p-3 shadow-2xs transition-all hover:border-[#7A2253]/40 hover:shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Reach</span>
            <Users className="h-3.5 w-3.5 text-[#7A2253]" />
          </div>
          <div className="mt-1 text-xl font-extrabold tracking-tight text-[#181716] tabular-nums sm:text-2xl">
            {waiting ? <MetricSkeleton /> : socialSummary ? formatCount(socialSummary.total) : "0"}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
            <span>{platforms.length > 0 ? `${platforms.length} platforms linked` : "No socials connected"}</span>
            <span className="font-semibold text-[#7A2253] group-hover:translate-x-0.5 transition-transform inline-flex items-center">
              Manage <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </Link>

        {/* Metric 2: 30-Day Profile Traffic */}
        <Link
          href="/dashboard/analytics"
          className="group rounded-xl border border-[#e2e8f0] bg-white p-3 shadow-2xs transition-all hover:border-[#7A2253]/40 hover:shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">30D Profile Views</span>
            <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div className="mt-1 text-xl font-extrabold tracking-tight text-[#181716] tabular-nums sm:text-2xl">
            {waiting ? <MetricSkeleton /> : formatCount(totalViews)}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
            <span>{totalClicks} link clicks · {ctr}% CTR</span>
            <span className="font-semibold text-[#7A2253] group-hover:translate-x-0.5 transition-transform inline-flex items-center">
              Stats <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </Link>

        {/* Metric 3: Video Series (OTT) */}
        <Link
          href="/dashboard/series"
          className="group rounded-xl border border-[#e2e8f0] bg-white p-3 shadow-2xs transition-all hover:border-[#7A2253]/40 hover:shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Video Series</span>
            <Film className="h-3.5 w-3.5 text-purple-600" />
          </div>
          <div className="mt-1 text-xl font-extrabold tracking-tight text-[#181716] tabular-nums sm:text-2xl">
            {waiting ? <MetricSkeleton /> : summary?.series?.count ?? series.length ?? 0}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
            <span>{summary?.series ? `${summary.series.episodes} episodes live` : "Organize OTT videos"}</span>
            <span className="font-semibold text-[#7A2253] group-hover:translate-x-0.5 transition-transform inline-flex items-center">
              Series <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </Link>

        {/* Metric 4: Bio Links & Brand Collabs */}
        <Link
          href="/dashboard/links"
          className="group rounded-xl border border-[#e2e8f0] bg-white p-3 shadow-2xs transition-all hover:border-[#7A2253]/40 hover:shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Bio Links</span>
            <Link2 className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="mt-1 text-xl font-extrabold tracking-tight text-[#181716] tabular-nums sm:text-2xl">
            {waiting ? <MetricSkeleton /> : summary?.links ?? 0}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
            <span>{summary?.mediakit ? `${summary.mediakit} collab packages` : "Custom bio links"}</span>
            <span className="font-semibold text-[#7A2253] group-hover:translate-x-0.5 transition-transform inline-flex items-center">
              Links <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </Link>
      </section>

      {/* 3. TWO-COLUMN WORKSTATION (Tight & High-Utility) */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-start">
        {/* LEFT COLUMN: Connected Socials & Active Assets (8 cols) */}
        <div className="space-y-3 lg:col-span-8">
          {/* Social Platforms Status Table */}
          <section className="rounded-xl border border-[#e2e8f0] bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#181716]">
                  Connected Social Reach
                </h2>
                <p className="text-[11px] text-slate-500">
                  Synced stats verified on your public Inflixo page
                </p>
              </div>
              <Link
                href="/dashboard/socials"
                className="inline-flex items-center gap-1 rounded-lg border border-[#e2e8f0] bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
              >
                <span>Edit Socials</span>
                <ArrowUpRight className="h-3 w-3 opacity-60" />
              </Link>
            </div>

            {waiting ? (
              <div className="space-y-2 py-3">
                <MetricSkeleton small />
                <MetricSkeleton small />
              </div>
            ) : platforms.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-slate-500">No social platforms linked yet.</p>
                <Link
                  href="/dashboard/socials"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#7A2253] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Connect Instagram / YouTube</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {platforms.map((platform) => {
                  const Icon =
                    platform.key === "instagram"
                      ? InstagramIcon
                      : platform.key === "youtube"
                      ? YoutubeIcon
                      : platform.key === "facebook"
                      ? FacebookIcon
                      : Users;
                  return (
                    <div key={platform.key} className="flex items-center justify-between py-2.5 first:pt-2.5 last:pb-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#181716] truncate">
                            @{platform.username}
                          </p>
                          <p className="text-[10px] text-slate-400 capitalize">
                            {platform.key} · Synced {formatSimplifiedSyncDate(platform.syncedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold text-[#181716] tabular-nums">
                          {formatCount(platform.count)}
                        </span>
                        <span className="ml-1 text-[10.5px] font-normal text-slate-500">
                          {platform.key === "youtube" ? "subscribers" : "followers"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Quick Content Assets Hub (Series & Links) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Box 1: OTT Video Series Hub */}
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-3 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Film className="h-4 w-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-[#181716]">OTT Video Series</h3>
                </div>
                <Link
                  href="/dashboard/series"
                  className="text-[11px] font-semibold text-[#7A2253] hover:underline"
                >
                  Manage →
                </Link>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Organize your YouTube, Instagram &amp; OTT videos in ordered series with seasons and episodes.
              </p>
              <div className="pt-1">
                <Link
                  href="/dashboard/series"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#e2e8f0] bg-slate-50 hover:bg-slate-100 py-1.5 text-xs font-semibold text-slate-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-[#7A2253]" />
                  <span>Create New Series</span>
                </Link>
              </div>
            </div>

            {/* Box 2: Bio Links Hub */}
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-3 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Link2 className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-[#181716]">Bio Links &amp; Buttons</h3>
                </div>
                <Link
                  href="/dashboard/links"
                  className="text-[11px] font-semibold text-[#7A2253] hover:underline"
                >
                  Manage →
                </Link>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Add priority links, social profiles, WhatsApp direct chat, and affiliate products.
              </p>
              <div className="pt-1">
                <Link
                  href="/dashboard/links"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#e2e8f0] bg-slate-50 hover:bg-slate-100 py-1.5 text-xs font-semibold text-slate-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-[#7A2253]" />
                  <span>Add Bio Link</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Studio Commands & Public Profile (4 cols) */}
        <div className="space-y-3 lg:col-span-4">
          {/* Quick Studio Commands */}
          <section className="rounded-xl border border-[#e2e8f0] bg-white p-3 shadow-2xs">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
              Studio Quick Tools
            </h2>
            <nav className="divide-y divide-slate-100 text-xs">
              <Link
                href="/dashboard/themes"
                className="flex items-center justify-between py-2 text-slate-700 hover:text-[#7A2253] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span className="font-medium">Customize Theme</span>
                </div>
                <ChevronRight className="h-3 w-3 text-slate-400" />
              </Link>

              <Link
                href="/dashboard/mediakit"
                className="flex items-center justify-between py-2 text-slate-700 hover:text-[#7A2253] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                  <span className="font-medium">Media Kit &amp; Rate Card</span>
                </div>
                <ChevronRight className="h-3 w-3 text-slate-400" />
              </Link>

              <Link
                href="/dashboard/products"
                className="flex items-center justify-between py-2 text-slate-700 hover:text-[#7A2253] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-3.5 w-3.5 text-pink-600" />
                  <span className="font-medium">Shop &amp; Recommendations</span>
                </div>
                <ChevronRight className="h-3 w-3 text-slate-400" />
              </Link>

              <Link
                href="/dashboard/reviews"
                className="flex items-center justify-between py-2 text-slate-700 hover:text-[#7A2253] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  <span className="font-medium">Client Testimonials</span>
                </div>
                <ChevronRight className="h-3 w-3 text-slate-400" />
              </Link>
            </nav>
          </section>

          {/* Live Link in Bio Card */}
          <div className="rounded-xl border border-[#e2e8f0] bg-gradient-to-b from-[#f8fafc] to-white p-3 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Your Link in Bio
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[9.5px] font-bold text-emerald-700">
                ● Live
              </span>
            </div>

            <div className="rounded-lg border border-[#e2e8f0] bg-white p-2.5 space-y-1">
              <p className="text-xs font-bold text-[#181716] truncate">
                {displayName}
              </p>
              <p className="text-[11px] text-slate-500 font-mono truncate">
                inflixo.com/{handle}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={copyProfile}
                className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-[#e2e8f0] bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-all"
              >
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </button>
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-[#7A2253] text-xs font-semibold text-white hover:opacity-95 cursor-pointer transition-all shadow-2xs"
              >
                <span>Preview</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Share / QR Modal */}
      <Modal isOpen={qrOpen} onClose={() => setQrOpen(false)} size="sm" title="Share your profile" description={`Scan to visit @${handle}`}>
        <ModalBody>
          <div className="flex flex-col items-center gap-4 py-2">
            <QRCode value={profileUrl} size={180} />
            <button type="button" onClick={copyProfile} className={adminBtnClass}>
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied!" : "Copy profile link"}</span>
            </button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}
