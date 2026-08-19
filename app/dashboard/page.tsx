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
  Check,
  Sparkles,
  ArrowRight,
  CircleCheck,
  Circle,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { ThemeService } from "@/services/ThemeService";
import { formatCount } from "@/utils/format";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import {
  getSeriesUsage,
  getEpisodeUsage,
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
  const { profile, socials, series, theme, totalAudience } = useCreator();
  const { showToast } = useToast();
  const themeMeta = ThemeService.getThemeMeta(theme);

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

  const profileUrl = `inflixo.com/${profile.username || "username"}`;

  function handleCopyLink() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`https://${profileUrl}`);
      showToast("Link copied to clipboard! ✨");
    }
  }

  function handleCreateSeriesClick() {
    if (!canCreateSeries(series)) {
      setModalState({ isOpen: true, type: "series" });
    } else {
      router.push("/dashboard/series");
    }
  }

  function openLimitModal(type: "series" | "episode", seriesTitle?: string) {
    setModalState({ isOpen: true, type, seriesTitle });
  }

  // Setup Completion Tasks
  const isProfileDone = Boolean(profile.displayName && profile.username);
  const isInstagramDone = Boolean(socials.instagram.username || socials.instagram.url);
  const isYoutubeDone = Boolean(socials.youtube.username || socials.youtube.url);
  const isFacebookDone = Boolean(socials.facebook.username || socials.facebook.url);
  const isSeriesDone = series.length > 0;

  const tasks = [
    { label: "Profile created", done: isProfileDone, href: "/dashboard/profile" },
    { label: "Instagram connected", done: isInstagramDone, href: "/dashboard/socials" },
    { label: "Connect YouTube", done: isYoutubeDone, href: "/dashboard/socials" },
    { label: "Connect Facebook", done: isFacebookDone, href: "/dashboard/socials" },
    { label: "Create your first Series", done: isSeriesDone, href: "/dashboard/series" },
  ];

  const completedCount = tasks.filter((t) => t.done).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);
  const is100PercentComplete = progressPercent === 100;

  return (
    <div className="mx-auto max-w-5xl px-3 sm:px-8 py-4 sm:py-8 space-y-5">
      {/* 1. TOP WELCOME HEADER (Compact & Merged with Page Live Status & Actions) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-purple-200/80 bg-white p-5 shadow-xs">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-black text-slate-900 tracking-tight">
            Welcome back, {profile.displayName ? profile.displayName.split(" ")[0] : "Creator"} 👋
          </h1>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span className="flex items-center gap-1.5 text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Your page is live
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[#651FFF] font-black">{profileUrl}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="tap-scale flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5 text-[#651FFF]" /> Copy Link
          </button>
          <Link
            href={`/${profile.username || "username"}`}
            target="_blank"
            className="tap-scale flex items-center gap-1.5 rounded-2xl bg-[#651FFF] px-4 py-2 text-xs font-black text-white shadow-md shadow-purple-600/20 hover:bg-[#500CD6] transition-all"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View Profile
          </Link>
        </div>
      </div>

      {/* 2. HERO CARD = TOTAL FANBASE (Inflixo's #1 USP in Solid Brand Purple #651FFF) */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-200 bg-[#651FFF] p-6 text-white shadow-md shadow-purple-600/25">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-baseline gap-3">
              <h2 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-white">
                {formatCount(totalAudience)}
              </h2>
              <span className="font-display text-lg sm:text-2xl font-black uppercase tracking-wider text-purple-100">
                Total Fanbase
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm font-semibold text-purple-200">
              Your combined audience across all socials added to Inflixo.
            </p>
          </div>

          {/* Handle Badge */}
          <div className="flex items-center gap-2.5 rounded-2xl bg-white/20 border border-white/30 p-3.5 backdrop-blur-md self-start sm:self-auto">
            <Users className="h-5 w-5 text-white" />
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-purple-100">
                Creator Handle
              </p>
              <p className="text-xs font-black text-white">@{profile.username || "username"}</p>
            </div>
          </div>
        </div>

        {/* Compact Connected Socials Row (Account Display Name / Platform Name on top line + Username handle underneath when connected) */}
        <div className="mt-6 pt-4 border-t border-white/20 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Instagram */}
          <div className="flex items-center justify-between rounded-2xl bg-white/15 border border-white/25 px-3.5 py-3 shadow-2xs backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-2xs shrink-0">
                <InstagramIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white leading-none truncate">
                  {socials.instagram.name || "Instagram"}
                </p>
                {isInstagramDone && (
                  <p className="text-[10px] font-bold text-purple-100/90 truncate mt-0.5">
                    {extractHandle(socials.instagram.username || socials.instagram.url) || `@${profile.username}`}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              {isInstagramDone ? (
                <>
                  <p className="text-sm font-black text-white leading-none">
                    {formatCount(socials.instagram.followers)}
                  </p>
                  <p className="text-[9px] font-extrabold text-purple-200 uppercase tracking-wider mt-0.5">
                    Followers
                  </p>
                </>
              ) : (
                <Link
                  href="/dashboard/socials"
                  className="text-[11px] font-black text-white hover:text-purple-100 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl px-2.5 py-1 transition-all flex items-center gap-0.5"
                >
                  Connect <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>

          {/* YouTube */}
          <div className="flex items-center justify-between rounded-2xl bg-white/15 border border-white/25 px-3.5 py-3 shadow-2xs backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 text-white shadow-2xs shrink-0">
                <YoutubeIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white leading-none truncate">
                  {socials.youtube.channelTitle || "YouTube"}
                </p>
                {isYoutubeDone && (
                  <p className="text-[10px] font-bold text-purple-100/90 truncate mt-0.5">
                    {extractHandle(socials.youtube.username || socials.youtube.url) || `@${profile.username}`}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              {isYoutubeDone ? (
                <>
                  <p className="text-sm font-black text-white leading-none">
                    {formatCount(socials.youtube.subscribers)}
                  </p>
                  <p className="text-[9px] font-extrabold text-purple-200 uppercase tracking-wider mt-0.5">
                    Subscribers
                  </p>
                </>
              ) : (
                <Link
                  href="/dashboard/socials"
                  className="text-[11px] font-black text-white hover:text-purple-100 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl px-2.5 py-1 transition-all flex items-center gap-0.5"
                >
                  Connect <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>

          {/* Facebook */}
          <div className="flex items-center justify-between rounded-2xl bg-white/15 border border-white/25 px-3.5 py-3 shadow-2xs backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-2xs shrink-0">
                <FacebookIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white leading-none truncate">
                  {socials.facebook.name || "Facebook"}
                </p>
                {isFacebookDone && (
                  <p className="text-[10px] font-bold text-purple-100/90 truncate mt-0.5">
                    {extractHandle(socials.facebook.username || socials.facebook.url) || `@${profile.username}`}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              {isFacebookDone ? (
                <>
                  <p className="text-sm font-black text-white leading-none">
                    {formatCount(socials.facebook.followers)}
                  </p>
                  <p className="text-[9px] font-extrabold text-purple-200 uppercase tracking-wider mt-0.5">
                    Followers
                  </p>
                </>
              ) : (
                <Link
                  href="/dashboard/socials"
                  className="text-[11px] font-black text-white hover:text-purple-100 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl px-2.5 py-1 transition-all flex items-center gap-0.5"
                >
                  Connect <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. SLIM EARLY ACCESS BANNER */}
      <div className="rounded-2xl border border-purple-200/80 bg-white p-4 text-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-[#651FFF]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-xs font-black text-slate-900 uppercase">🚀 Early Access</span>
              <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.2 text-[10px] font-black">
                FREE
              </span>
            </div>
            <p className="text-xs font-bold text-slate-600 mt-0.5">
              <strong className="text-slate-900">{seriesUsage.current}/3 Series</strong> •{" "}
              <strong className="text-slate-900">{totalEpisodesUsage.current}/15 Episodes</strong> •{" "}
              <span className="text-purple-700 font-extrabold">Unlimited Theme Customization</span>
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/subscription"
          className="text-xs font-black text-[#651FFF] hover:text-[#500CD6] flex items-center gap-1 shrink-0 self-end sm:self-auto cursor-pointer"
        >
          View benefits <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* 4. SETUP PROGRESS WIDGET: "COMPLETE YOUR PAGE" */}
      {!is100PercentComplete && (
        <div className="rounded-3xl border border-purple-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-black text-slate-900 uppercase tracking-wider">
                Complete Your Page
              </h3>
              <span className="rounded-full bg-purple-100 text-[#651FFF] border border-purple-200 px-2.5 py-0.5 text-xs font-black">
                {progressPercent}% ready
              </span>
            </div>
            <Link
              href="/dashboard/profile"
              className="text-xs font-black text-[#651FFF] hover:underline flex items-center gap-1"
            >
              Complete setup <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full rounded-full bg-purple-100 overflow-hidden">
            <div
              className="h-full bg-[#651FFF] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Checklist Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {tasks.map((task, idx) => (
              <Link
                key={idx}
                href={task.href}
                className={`flex items-center gap-2.5 rounded-2xl p-2.5 text-xs font-extrabold border transition-all ${task.done
                  ? "bg-purple-50/60 text-purple-900 border-purple-100"
                  : "bg-slate-50 text-slate-700 border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/30"
                  }`}
              >
                {task.done ? (
                  <CircleCheck className="h-4 w-4 text-[#651FFF] shrink-0 fill-purple-100" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-400 shrink-0" />
                )}
                <span className={task.done ? "line-through text-slate-500 font-semibold" : ""}>
                  {task.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 5. MAIN QUICK ACTIONS (With Primary Purple + Create Series CTA) */}
      <div className="space-y-3">
        <p className="font-display text-xs font-black text-slate-900 uppercase tracking-wider">
          Quick actions
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {/* PRIMARY PURPLE CTA: + Create Series */}
          <button
            type="button"
            onClick={handleCreateSeriesClick}
            className="col-span-2 sm:col-span-2 tap-scale flex items-center justify-center gap-2.5 rounded-2xl bg-[#651FFF] px-5 py-3.5 text-center text-white shadow-md shadow-purple-600/20 hover:bg-[#500CD6] transition-all hover:scale-[1.01] cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white">
              <Plus className="h-5 w-5 stroke-[3]" />
            </div>
            <div className="text-left">
              <span className="font-display text-sm font-black text-white block">
                + Create Series
              </span>
              <span className="text-[10px] font-bold text-purple-100">
                Turn your content into parts
              </span>
            </div>
          </button>

          {/* SECONDARY ACTIONS */}
          <Link
            href="/dashboard/profile"
            className="tap-scale flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-purple-100 bg-white p-3 text-center transition-all hover:border-purple-300 hover:bg-purple-50/50 shadow-2xs"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-[#651FFF]">
              <UserRound className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-800">Edit Profile</span>
          </Link>

          <Link
            href="/dashboard/themes"
            className="tap-scale flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-purple-100 bg-white p-3 text-center transition-all hover:border-purple-300 hover:bg-purple-50/50 shadow-2xs"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-[#651FFF]">
              <Palette className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-800">Change Theme</span>
          </Link>

          <Link
            href="/dashboard/preview"
            className="tap-scale flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-purple-100 bg-white p-3 text-center transition-all hover:border-purple-300 hover:bg-purple-50/50 shadow-2xs"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-[#651FFF]">
              <Eye className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-800">Preview</span>
          </Link>

          {/* Add Episode Action (Hidden / Disabled if no series exists yet) */}
          {isSeriesDone && (
            <Link
              href="/dashboard/series"
              className="tap-scale flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-purple-100 bg-white p-3 text-center transition-all hover:border-purple-300 hover:bg-purple-50/50 shadow-2xs col-span-2 sm:col-span-1"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-[#651FFF]">
                <Play className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">Add Episode</span>
            </Link>
          )}
        </div>
      </div>

      {/* 6. YOUR SERIES WORKING AREA (Creator-centric Problem-Solution Copy) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="font-display text-base font-black text-slate-900">Your Series</h3>
            <p className="text-xs text-slate-500 font-medium">Keep your multi-part content organized in one place</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-purple-50 text-[#651FFF] border border-purple-200 px-3 py-1 text-xs font-black">
              {seriesUsage.current} / {seriesUsage.max}
            </span>
          </div>
        </div>

        {series.length === 0 ? (
          /* Creator-Centric Problem Copy Empty State */
          <div className="rounded-3xl border border-dashed border-purple-200 bg-white p-8 text-center shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-[#651FFF] shadow-2xs">
              <Layers className="h-7 w-7" />
            </div>
            <h4 className="font-display mt-4 text-xl font-black text-slate-900">
              Turn your content into a Series
            </h4>
            <p className="mx-auto mt-2 max-w-lg text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Have <strong>Part 1, Part 2, Part 3</strong> scattered across your Instagram, YouTube or Facebook?
              Put every part in one ordered Series so your audience can easily find what comes next.
            </p>

            <div className="mt-6 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleCreateSeriesClick}
                className="tap-scale inline-flex items-center gap-2 rounded-2xl bg-[#651FFF] px-6 py-3.5 text-xs font-black text-white shadow-md shadow-purple-600/20 hover:bg-[#500CD6] transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>Create Your First Series →</span>
              </button>
            </div>
          </div>
        ) : (
          /* Populated Series Cards */
          <div className="grid gap-4 sm:grid-cols-3">
            {series.map((s) => {
              const epUsage = getEpisodeUsage(s);
              return (
                <div
                  key={s.id}
                  className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-purple-200 transition-all"
                >
                  <div>
                    <div className="relative h-32 w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-100 flex items-center justify-center">
                      {s.posterDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.posterDataUrl} alt={s.title} className="h-full w-full object-cover" />
                      ) : (
                        <Film className="h-8 w-8 text-white/50" />
                      )}
                      <span className="absolute top-2 right-2 rounded-full bg-black/60 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-black text-white">
                        {epUsage.current} / {epUsage.max} Eps
                      </span>
                    </div>

                    <h4 className="font-display mt-3 truncate font-black text-slate-900 text-sm">
                      {s.title}
                    </h4>

                    {/* Episode Usage Bar */}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                        <span>{epUsage.current} / 5 Episodes</span>
                        <span
                          className={
                            epUsage.isLimitReached
                              ? "text-amber-600 font-extrabold"
                              : "text-[#651FFF] font-extrabold"
                          }
                        >
                          {epUsage.isLimitReached ? "Limit Reached" : `${epUsage.percentage}%`}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-purple-100 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${epUsage.isLimitReached ? "bg-amber-500" : "bg-[#651FFF]"
                            }`}
                          style={{ width: `${epUsage.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href="/dashboard/series"
                      className="text-xs font-bold text-slate-600 hover:text-[#651FFF] transition-colors"
                    >
                      Edit Series
                    </Link>

                    {epUsage.isLimitReached ? (
                      <button
                        type="button"
                        onClick={() => openLimitModal("episode", s.title)}
                        className="rounded-xl bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-extrabold text-amber-700"
                      >
                        Limit Reached
                      </button>
                    ) : (
                      <Link
                        href="/dashboard/series"
                        className="tap-scale flex items-center gap-1 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 text-[11px] font-extrabold text-[#651FFF] transition-colors"
                      >
                        <Plus className="h-3 w-3" /> Add Episode
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. SELECTED THEME CARD */}
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-purple-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-[#651FFF] border border-purple-100 shadow-2xs">
            <Palette className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selected theme</p>
            <p className="font-display font-black text-slate-900 truncate mt-0.5">{themeMeta.name}</p>
          </div>
        </div>
        <Link
          href="/dashboard/themes"
          className="tap-scale shrink-0 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition-colors"
        >
          Change
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
  );
}
