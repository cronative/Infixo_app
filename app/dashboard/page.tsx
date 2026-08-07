"use client";

import Link from "next/link";
import { Users, Palette, CreditCard, Layers, Copy, Eye, UserRound, Plus, ExternalLink } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { ThemeService } from "@/services/ThemeService";
import { formatCount } from "@/utils/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";

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

function StatCard({
  icon,
  label,
  value,
  handle,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  handle?: string | null;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-inflixo-border/80 bg-white p-5 transition-all hover:border-inflixo-purple/40 hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-2xs ${accent}`}>
          {icon}
        </div>
        {handle ? (
          <span className="truncate rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-700 max-w-[130px]" title={handle}>
            {handle}
          </span>
        ) : (
          <span className="text-[11px] font-bold text-slate-400 italic">Not set</span>
        )}
      </div>

      <div className="mt-4">
        <p className="font-display text-2xl font-black text-slate-900 tracking-tight">{value}</p>
        <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-2xl border border-inflixo-border bg-white px-4 py-4 text-center transition-colors hover:border-inflixo-purple hover:bg-inflixo-purple-light/40"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-inflixo-purple-light text-inflixo-purple">
        {icon}
      </div>
      <span className="text-xs font-semibold text-inflixo-navy">{label}</span>
    </Link>
  );
}

export default function DashboardOverviewPage() {
  const { profile, socials, series, theme, subscription, totalAudience } = useCreator();
  const { showToast } = useToast();
  const themeMeta = ThemeService.getThemeMeta(theme);
  const profileUrl = `inflixo.com/${profile.username || "you"}`;

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8 sm:py-8">
      {/* Status banner */}
      <div
        className="flex flex-col gap-4 overflow-hidden rounded-3xl border border-inflixo-border p-5 sm:flex-row sm:items-center sm:justify-between"
        style={{
          backgroundImage: "linear-gradient(120deg, var(--inflixo-purple-light) 0%, #ffffff 60%)",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]" />
            <p className="text-sm font-bold text-inflixo-navy">
              Profile {profile.displayName ? "live" : "not published"}
            </p>
          </div>
          <p className="mt-1 text-sm text-inflixo-purple-dark font-semibold">{profileUrl}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(`https://${profileUrl}`);
              showToast("Link copied to clipboard");
            }}
            className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-inflixo-navy shadow-[var(--shadow-soft)] transition-all hover:-translate-y-px"
          >
            <Copy className="h-3.5 w-3.5" /> Copy Link
          </button>
          <Link
            href={`/${profile.username || "you"}`}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white shadow-[0_10px_20px_-10px_rgba(67,30,130,0.6)] transition-all hover:-translate-y-px"
            style={{ backgroundImage: "var(--gradient-premium)" }}
          >
            <ExternalLink className="h-3.5 w-3.5" /> View
          </Link>
        </div>
      </div>

      {/* Stats grid displaying Username Handle + Count */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5 text-white" />}
          accent="bg-inflixo-purple"
          label="Total Fanbase"
          value={formatCount(totalAudience)}
          handle={profile.username ? `@${profile.username}` : undefined}
        />
        <StatCard
          icon={<InstagramIcon className="h-5 w-5 text-white" />}
          accent="bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600"
          label="Instagram Followers"
          value={formatCount(socials.instagram.followers)}
          handle={socials.instagram.username || extractHandle(socials.instagram.url)}
        />
        <StatCard
          icon={<YoutubeIcon className="h-5 w-5 text-white" />}
          accent="bg-red-600"
          label="YouTube Subscribers"
          value={formatCount(socials.youtube.subscribers)}
          handle={socials.youtube.username || extractHandle(socials.youtube.url)}
        />
        <StatCard
          icon={<FacebookIcon className="h-5 w-5 text-white" />}
          accent="bg-blue-600"
          label="Facebook Followers"
          value={formatCount(socials.facebook.followers)}
          handle={socials.facebook.username || extractHandle(socials.facebook.url)}
        />
      </div>

      {/* Theme + Subscription row */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-3xl border border-inflixo-border bg-white p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-inflixo-purple-light text-inflixo-purple">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted">Selected theme</p>
            <p className="font-bold text-inflixo-navy">{themeMeta.name}</p>
          </div>
          <Link href="/dashboard/themes" className="ml-auto text-xs font-semibold text-inflixo-purple">
            Change
          </Link>
        </div>
        <div className="flex items-center gap-4 rounded-3xl border border-inflixo-border bg-white p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted">Subscription</p>
            <p className="font-bold capitalize text-inflixo-navy">{subscription.status}</p>
          </div>
          <Link href="/dashboard/subscription" className="ml-auto text-xs font-semibold text-inflixo-purple">
            Manage
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <p className="mb-3 mt-8 text-sm font-bold text-inflixo-navy">Quick actions</p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <QuickAction href="/dashboard/profile" icon={<UserRound className="h-4 w-4" />} label="Edit Profile" />
        <QuickAction href="/dashboard/series" icon={<Plus className="h-4 w-4" />} label="Add Episode" />
        <QuickAction href="/dashboard/series" icon={<Layers className="h-4 w-4" />} label="Create Series" />
        <QuickAction href="/dashboard/themes" icon={<Palette className="h-4 w-4" />} label="Change Theme" />
        <QuickAction href="/dashboard/preview" icon={<Eye className="h-4 w-4" />} label="Preview" />
        <QuickAction
          href="#"
          icon={<Copy className="h-4 w-4" />}
          label="Copy Link"
        />
      </div>

      {/* Recent series */}
      <p className="mb-3 mt-8 text-sm font-bold text-inflixo-navy">Recent series</p>
      {series.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-5 w-5" />}
          title="No series yet"
          description="Organize your content like OTT — add your first series."
          action={
            <Link href="/dashboard/series" className="text-sm font-semibold text-inflixo-purple">
              Create a series →
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {series.slice(0, 3).map((s) => (
            <div key={s.id} className="rounded-3xl border border-inflixo-border bg-white p-4">
              <div className="h-28 w-full overflow-hidden rounded-2xl bg-inflixo-navy">
                {s.posterDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.posterDataUrl} alt={s.title} className="h-full w-full object-cover" />
                )}
              </div>
              <p className="mt-3 truncate font-bold text-inflixo-navy">{s.title}</p>
              <p className="text-xs text-muted">
                {s.seasons.length} season{s.seasons.length !== 1 ? "s" : ""} ·{" "}
                {s.seasons.reduce((a, b) => a + b.episodes.length, 0)} episodes
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
