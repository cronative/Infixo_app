"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight, BarChart3, Briefcase, Camera, Check, ChevronDown,
  Copy, ExternalLink, Film, Link2, MessageCircle, QrCode,
  RefreshCw, Share2, ShoppingBag, Star, Users,
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

const actionClass = "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition-colors hover:border-[#B85C6B]/40 hover:text-[#B85C6B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B85C6B]";
const shareItemClass = "flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-[#B85C6B]";

function MetricSkeleton({ small = false }: { small?: boolean }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded bg-slate-100 ${small ? "h-3 w-20" : "h-7 w-24"}`} />;
}

export default function DashboardOverviewPage() {
  const { profile, loading: profileLoading } = useCreator();
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
      .then(async response => {
        const body = await response.json();
        if (!response.ok || body.status !== 1 || !body.data) throw new Error("Summary unavailable");
        return body.data as DashboardSummary;
      })
      .then(data => { if (!controller.signal.aborted) setSummary(data); })
      .catch(() => { if (!controller.signal.aborted) setSummary(null); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
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
    showToast(success ? "Profile link copied" : "Could not copy link", success ? "success" : "error");
  }

  const socialSummary = summary?.socials;
  const platforms = socialSummary ? Object.entries(socialSummary.accounts).flatMap(([key, value]) => {
    if (!value || typeof value !== "object" || !("url" in value)) return [];
    const account = value as { url?: string; username?: string; followers?: number; subscribers?: number; lastSyncedAt?: string };
    const count = account.subscribers ?? account.followers ?? 0;
    if (!account.url && !account.username && !count) return [];
    const username = account.username || account.url?.split("/").filter(Boolean).pop() || key;
    return [{ key, username: username.replace(/^@/, ""), count, syncedAt: account.lastSyncedAt || socialSummary.accounts.updatedAt }];
  }) : [];
  const syncedAt = socialSummary?.accounts.updatedAt;
  const lastSynced = syncedAt && Number.isFinite(Date.parse(syncedAt))
    ? new Date(syncedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : "—";

  const cards = [
    { title: "Series", path: "series", icon: Film, value: summary?.series?.count, noun: "series", detail: summary?.series ? formatQuantity(summary.series.episodes, "episode") : "" },
    { title: "Products", path: "products", icon: ShoppingBag, value: summary?.products, noun: "product", detail: "Manage your shop" },
    { title: "Links", path: "links", icon: Link2, value: summary?.links, noun: "link", detail: "Manage bio links" },
    { title: "Media Kit", path: "mediakit", icon: Briefcase, value: summary?.mediakit, noun: "package", detail: "Collaboration packages" },
    { title: "Reviews", path: "reviews", icon: Star, value: summary?.reviews, noun: "review", detail: "All client reviews" },
    { title: "Analytics", path: "analytics", icon: BarChart3, value: summary?.analytics?.views, noun: "view", detail: "Social & link clicks · 30 days" },
    { title: "Gear & Setup", path: "setup", icon: Camera, value: summary?.setup, noun: "item", detail: "Your creator setup" },
    { title: "Team", path: "team", icon: Users, value: summary?.team, noun: "member", detail: "Manage your team" },
  ];

  // Do not invent missing steps while their source is loading or unavailable.
  const completionReady = !waiting && summary && [summary.socials, summary.series, summary.products, summary.links, summary.mediakit].every(value => value !== null);
  const steps = [
    { done: Boolean(profile.displayName && (profile.bio || profile.category)), label: "Profile details", path: "profile" },
    { done: platforms.length > 0, label: "Connect socials", path: "socials" },
    { done: (summary?.links ?? 0) > 0, label: "Add a bio link", path: "links" },
    { done: (summary?.series?.count ?? 0) > 0, label: "Create a series", path: "series" },
    { done: (summary?.products ?? 0) > 0, label: "Add a product", path: "products" },
    { done: (summary?.mediakit ?? 0) > 0, label: "Set collaboration rates", path: "mediakit" },
  ];
  const completed = steps.filter(step => step.done).length;
  const nextStep = steps.find(step => !step.done);
  const unavailable = !waiting && (!summary || Object.values(summary).some(value => value === null));

  return (
    <div className="w-full space-y-3 text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <CreatorAvatar src={profile.photoDataUrl} name={displayName} className="h-10 w-10 shrink-0 rounded-lg border border-slate-200" />
          <div className="min-w-0">
            <h1 className="text-base font-semibold tracking-tight sm:text-lg">Overview</h1>
            <p className="max-w-full break-words text-xs text-slate-500">{displayName} <span className="mx-1 text-slate-300">/</span> @{handle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setReload(value => value + 1)} disabled={waiting} aria-label="Refresh overview" className={`${actionClass} w-8 px-0 disabled:opacity-50`}>
            <RefreshCw className={`h-3.5 w-3.5 ${waiting ? "animate-spin" : ""}`} />
          </button>
          <a href={profileUrl} target="_blank" rel="noopener noreferrer" className={actionClass}>View live <ExternalLink className="h-3 w-3" /></a>
          <div ref={shareRef} className="relative">
            <button ref={shareButtonRef} type="button" onClick={() => setShareOpen(value => !value)} aria-expanded={shareOpen} aria-controls="profile-share-options" className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#B85C6B] px-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B85C6B]">
              <Share2 className="h-3.5 w-3.5" /> Share Profile <ChevronDown className="h-3 w-3" />
            </button>
            {shareOpen && (
              <div id="profile-share-options" className="absolute right-0 z-30 mt-1 w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                <button type="button" onClick={copyProfile} className={shareItemClass}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy profile link</button>
                <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(profileUrl)}`} target="_blank" rel="noopener noreferrer" onClick={() => setShareOpen(false)} className={shareItemClass}><MessageCircle className="h-3.5 w-3.5" /> Share on WhatsApp</a>
                <button type="button" onClick={() => { setShareOpen(false); setQrOpen(true); }} className={shareItemClass}><QrCode className="h-3.5 w-3.5" /> Show QR code</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <section aria-label="Fanbase" aria-busy={waiting} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <Link href="/dashboard/socials" className="group grid gap-3 p-3 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#B85C6B] sm:grid-cols-[minmax(160px,0.8fr)_minmax(0,2fr)] sm:gap-4 sm:p-4">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-medium text-slate-500">Total Fanbase</p>
            <div className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{waiting ? <MetricSkeleton /> : socialSummary ? formatCount(socialSummary.total) : "—"}</div>
            <p className="mt-1.5 text-[11px] text-slate-500">{waiting ? "Loading socials…" : `Last synced: ${lastSynced}`}</p>
          </div>
          <div className="min-w-0 border-t border-slate-100 pt-2 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
            {waiting ? (
              <div className="space-y-3 py-1"><MetricSkeleton small /><MetricSkeleton small /><MetricSkeleton small /></div>
            ) : !socialSummary ? (
              <p className="py-2 text-xs text-slate-500">Social stats unavailable</p>
            ) : platforms.length === 0 ? (
              <div className="flex h-full flex-col justify-center gap-2 py-1">
                <p className="text-xs text-slate-500">Bring your audience into one place.</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#B85C6B]">Connect your socials <ArrowUpRight className="h-3 w-3" /></span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {platforms.map(platform => {
                  const Icon = platform.key === "instagram" ? InstagramIcon : platform.key === "youtube" ? YoutubeIcon : platform.key === "facebook" ? FacebookIcon : Users;
                  return (
                    <div key={platform.key} className="flex items-center gap-2 py-2 first:pt-0 last:pb-0">
                      <Icon className="h-4 w-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="break-all text-xs font-medium">@{platform.username}</p>
                        <p className="text-[10px] text-slate-400">{formatSimplifiedSyncDate(platform.syncedAt)}</p>
                      </div>
                      <p className="shrink-0 text-right text-xs font-semibold tabular-nums">{formatCount(platform.count)}<span className="ml-1 font-normal text-slate-500">{platform.key === "youtube" ? "subscribers" : "followers"}</span></p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Link>
      </section>

      <section aria-labelledby="studio-heading" aria-busy={waiting}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 id="studio-heading" className="text-xs font-semibold text-slate-600">My Studio</h2>
          {unavailable && <span role="status" className="text-[11px] text-slate-500">Some counts unavailable · refresh to retry</span>}
          {waiting && <span role="status" className="text-[11px] text-slate-400">Loading overview…</span>}
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {cards.map(card => {
            const Icon = card.icon;
            const hasCopy = card.path === "mediakit" && !waiting && card.value != null && card.value > 0;
            return (
              <article key={card.path} className="relative min-w-0 rounded-lg border border-slate-200 bg-white transition-colors hover:border-[#B85C6B]/50">
                <Link href={`/dashboard/${card.path}`} className="flex h-full min-h-32 flex-col rounded-lg p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B85C6B]">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600"><Icon className="h-3.5 w-3.5 shrink-0 text-[#B85C6B]" /><h3>{card.title}</h3><ArrowUpRight className="ml-auto h-3 w-3 shrink-0 text-slate-300" /></div>
                  <div className="mb-2 mt-3 text-xl font-semibold leading-tight tracking-tight tabular-nums sm:text-2xl">
                    {waiting ? <MetricSkeleton /> : card.value == null ? "—" : card.path === "analytics" && summary?.analytics ? (
                      <><span className="block">{formatQuantity(summary.analytics.views, "view")}</span><span className="block text-xs font-normal tracking-normal text-slate-500">{formatQuantity(summary.analytics.clicks, "click")} · 30 days</span></>
                    ) : formatQuantity(card.value, card.noun, card.noun === "series" ? "series" : undefined)}
                  </div>
                  <div className="mt-auto min-h-4 text-[11px] leading-relaxed text-slate-500">
                    {waiting ? <MetricSkeleton small /> : card.value == null ? "Unavailable" : card.value === 0 ? <span className="font-medium text-[#B85C6B]">+ Add</span> : hasCopy ? <span aria-hidden="true">&nbsp;</span> : card.path === "analytics" ? "Social & bio link clicks" : card.detail}
                  </div>
                </Link>
                {hasCopy && <button type="button" onClick={async () => { const ok = await copyToClipboard(`${profileUrl}/media-kit`); showToast(ok ? "Media kit link copied" : "Could not copy link", ok ? "success" : "error"); }} className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded text-[11px] font-medium text-[#B85C6B] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B85C6B]"><Copy className="h-3 w-3" /> Copy link</button>}
              </article>
            );
          })}
        </div>
      </section>

      {completionReady && nextStep && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs">
          <p className="text-slate-500">Profile setup <span className="ml-1 font-semibold text-slate-700">{Math.round(completed / steps.length * 100)}%</span><span className="mx-2 text-slate-300">·</span>{completed} of {steps.length} steps</p>
          <Link href={`/dashboard/${nextStep.path}`} className="inline-flex items-center gap-1 font-medium text-[#B85C6B]">{nextStep.label}<ArrowUpRight className="h-3 w-3" /></Link>
        </div>
      )}

      <Modal isOpen={qrOpen} onClose={() => setQrOpen(false)} size="sm" title="Share your profile" description={`Scan to visit @${handle}`}>
        <ModalBody>
          <div className="flex flex-col items-center gap-4 py-2"><QRCode value={profileUrl} size={180} /><button type="button" onClick={copyProfile} className={actionClass}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy profile link"}</button></div>
        </ModalBody>
      </Modal>
    </div>
  );
}
