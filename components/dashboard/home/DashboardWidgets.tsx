"use client";

import { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clapperboard,
  Copy,
  IdCard,
  Briefcase,
  Link2,
  ShoppingBag,
  Film,
  Share2,
  Inbox,
  Star,
  Eye,
} from "lucide-react";
import { StatCard, StatCardGrid } from "@/components/dashboard/StatCard";
import { formatCount } from "@/utils/format";
import { formatFans, getCreatorEra, getEraProgress } from "@/lib/creatorEra";
import { eraFill, eraInk, getEraConfig } from "@/lib/eraConfig";
import { EraAwardMedal } from "@/components/shared/EraBadge";
import type { DashboardMetricKey, DashboardSummary } from "@/lib/dashboardSummary";

const CARD = "rounded-[5px] border border-[#E8E8EC] bg-white";
const BRAND = "#7A2253";

export function DashboardCard({ title, action, children, className = "" }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`${CARD} p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[14px] font-semibold text-[#18181B]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// ── 1. Brand Inbox ────────────────────────────────────────────

export function BrandInboxCard({
  inbox,
  loading,
  onShareMediaKit,
}: {
  inbox: DashboardSummary["inbox"] | null;
  loading: boolean;
  onShareMediaKit: () => void;
}) {
  const empty = !loading && (!inbox || (inbox.newRequests === 0 && inbox.unreadReviews === 0 && inbox.mediaKitViews7d === 0));

  if (empty) {
    return (
      <section className={`${CARD} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-[#F7EEF2] text-[#7A2253]">
            <Inbox className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[14px] font-semibold text-[#18181B]">Brand inbox is quiet</h2>
            <p className="mt-0.5 text-[12.5px] text-[#6B6B76]">Share your media kit so brands can see your rates and send requests.</p>
          </div>
        </div>
        <button type="button" onClick={onShareMediaKit} className="dash-btn-primary inline-flex shrink-0 items-center justify-center gap-1.5">
          <Share2 className="h-3.5 w-3.5" />
          <span>Share your media kit</span>
        </button>
      </section>
    );
  }

  const rows: { label: string; value: number; icon: ReactNode; cta: string; href: string; hot: boolean }[] = [
    { label: "New collab requests", value: inbox?.newRequests ?? 0, icon: <Inbox className="h-4 w-4" />, cta: "Reply", href: "/dashboard/mediakit#requests", hot: (inbox?.newRequests ?? 0) > 0 },
    { label: "Unread brand reviews", value: inbox?.unreadReviews ?? 0, icon: <Star className="h-4 w-4" />, cta: "View", href: "/dashboard/reviews", hot: (inbox?.unreadReviews ?? 0) > 0 },
    { label: "Media kit views · 7d", value: inbox?.mediaKitViews7d ?? 0, icon: <Eye className="h-4 w-4" />, cta: "View", href: "/dashboard/analytics", hot: false },
  ];

  return (
    <DashboardCard title="Brand inbox">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 rounded-[5px] border border-[#F0F0F3] bg-[#FAFAFB] px-3 py-2.5">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] ${row.hot ? "bg-[#7A2253] text-white" : "bg-white text-[#7A2253] border border-[#ECECF0]"}`}>
              {row.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] text-[#6B6B76]">{row.label}</p>
              <p className="text-[18px] font-semibold leading-tight text-[#18181B] tabular-nums">{loading ? "…" : formatCount(row.value)}</p>
            </div>
            <Link
              href={row.href}
              className={`inline-flex h-8 shrink-0 items-center rounded-[5px] px-3 text-[12.5px] font-medium transition-colors ${
                row.hot ? "bg-[#7A2253] text-white hover:bg-[#681c46]" : "border border-[#ECECF0] bg-white text-[#18181B] hover:border-[#7A2253]"
              }`}
            >
              {row.cta}
            </Link>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

// ── 2. 7-day metrics ──────────────────────────────────────────

export function Sparkline({ data, color = BRAND, width = 88, height = 22 }: { data: number[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(1, ...data);
  const step = data.length > 1 ? width / (data.length - 1) : width;
  const pts = data.map((v, i) => [i * step, height - 2 - (v / max) * (height - 4)] as const);
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden className="block">
      <polygon points={`0,${height} ${line} ${width},${height}`} fill={color} opacity={0.1} />
      <polyline points={line} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function ChangeBadge({ current, previous }: { current: number; previous: number }) {
  if (current === 0 && previous === 0) return null;
  const up = current >= previous;
  const text = previous === 0 ? "New" : `${Math.abs(Math.round(((current - previous) / previous) * 100))}%`;
  if (current === previous) {
    return <span className="rounded-full bg-[#F4F4F5] px-1.5 py-0.5 text-[11px] font-semibold text-[#6B6B76]">0%</span>;
  }
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${
        up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
      title="vs previous 7 days"
    >
      {up ? "▲" : "▼"} {text}
    </span>
  );
}

const METRIC_META: { key: DashboardMetricKey; label: string; tip: string }[] = [
  { key: "profileOpens", label: "Profile opens", tip: "Add your Inflixo link to your Instagram bio." },
  { key: "linkClicks", label: "Link clicks", tip: "Pin your most important link to the top." },
  { key: "seriesPlays", label: "Series plays", tip: "Share an episode link in your Stories." },
  { key: "shopClicks", label: "Shop clicks", tip: "Mark a product you love as Top Pick." },
];

export function WeeklyMetrics({ metrics, loading }: { metrics: DashboardSummary["metrics"] | null; loading: boolean }) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-semibold text-[#18181B]">Last 7 days</h2>
        <Link href="/dashboard/analytics" className="text-[12.5px] font-medium text-[#7A2253] hover:underline underline-offset-2">
          All analytics
        </Link>
      </div>
      <StatCardGrid cols={4}>
        {METRIC_META.map(({ key, label, tip }) => {
          const m = metrics?.[key];
          const quiet = !m || (m.current === 0 && m.previous === 0);
          return (
            <StatCard
              key={key}
              label={label}
              value={loading ? "…" : formatCount(m?.current ?? 0)}
              href="/dashboard/analytics"
              badge={m ? <ChangeBadge current={m.current} previous={m.previous} /> : undefined}
              footer={
                loading ? null : quiet ? (
                  <p className="line-clamp-2 text-[11.5px] leading-snug text-[#6B6B76]">{tip}</p>
                ) : (
                  <Sparkline data={m!.daily} />
                )
              }
            />
          );
        })}
      </StatCardGrid>
    </section>
  );
}

// ── 3. Top performers ─────────────────────────────────────────

function PerformerRow({ icon, label, title, count, unit, sub }: { icon: ReactNode; label: string; title?: string; count?: number; unit: string; sub?: string | null }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] bg-[#F7EEF2] text-[#7A2253]">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11.5px] uppercase tracking-wide text-[#8E8E93]">{label}</p>
        <p className="truncate text-[13.5px] font-medium text-[#18181B]" title={title}>{title ?? "—"}</p>
        {sub && <p className="truncate text-[12px] text-[#6B6B76]" title={sub}>{sub}</p>}
      </div>
      <span className="shrink-0 text-right text-[13px] font-semibold text-[#18181B] tabular-nums">
        {count ? `${formatCount(count)} ${unit}${count === 1 ? "" : "s"}` : <span className="font-normal text-[#A1A1AA]">No {unit}s</span>}
      </span>
    </li>
  );
}

export function TopPerformers({ top }: { top: DashboardSummary["top"] | null }) {
  const none = !top || (!top.link && !top.series && !top.product);
  return (
    <DashboardCard title="Top performers · 7d">
      {none ? (
        <p className="py-4 text-center text-[12.5px] text-[#6B6B76]">No clicks yet this week. Share your profile to see what fans love.</p>
      ) : (
        <ul className="-my-2.5 divide-y divide-[#F4F4F5]">
          <PerformerRow icon={<Link2 className="h-4 w-4" />} label="Top link" title={top!.link?.title} count={top!.link?.clicks} unit="click" />
          <PerformerRow
            icon={<Film className="h-4 w-4" />}
            label="Top series"
            title={top!.series?.title}
            count={top!.series?.plays}
            unit="play"
            sub={top!.series?.episode ? `Top episode: ${top!.series.episode.title} · ${formatCount(top!.series.episode.plays)}` : null}
          />
          <PerformerRow icon={<ShoppingBag className="h-4 w-4" />} label="Top product" title={top!.product?.name} count={top!.product?.clicks} unit="click" />
        </ul>
      )}
    </DashboardCard>
  );
}

// ── 4. Traffic sources ────────────────────────────────────────

const SOURCE_COLORS: Record<string, string> = {
  Instagram: "#E1306C",
  YouTube: "#FF0000",
  WhatsApp: "#25D366",
  Direct: "#7A2253",
  Other: "#A1A1AA",
};

export function TrafficSources({ sources }: { sources: DashboardSummary["sources"] | null }) {
  const total = (sources ?? []).reduce((sum, s) => sum + s.count, 0);
  return (
    <DashboardCard title="Traffic sources · 7d">
      {!sources || total === 0 ? (
        <p className="py-4 text-center text-[12.5px] text-[#6B6B76]">No visits yet. Add your link to your bio to see where fans come from.</p>
      ) : (
        <ul className="space-y-2.5">
          {sources.map((s) => {
            const pct = Math.round((s.count / total) * 100);
            return (
              <li key={s.source}>
                <div className="mb-1 flex items-center justify-between text-[12.5px]">
                  <span className="font-medium text-[#18181B]">{s.source}</span>
                  <span className="tabular-nums text-[#6B6B76]">
                    {formatCount(s.count)} · {pct}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F4F4F5]">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(3, pct)}%`, background: SOURCE_COLORS[s.source] ?? BRAND }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}

// ── 5. Quick actions ──────────────────────────────────────────

export function QuickActions({ addEpisodeHref, onCopyLink }: { addEpisodeHref: string; onCopyLink: () => void }) {
  const cls =
    "flex min-w-[112px] shrink-0 snap-start flex-col items-center justify-center gap-1.5 rounded-[5px] border border-[#E8E8EC] bg-white px-3 py-3 text-center text-[12.5px] font-medium text-[#18181B] transition-colors hover:border-[#7A2253] hover:text-[#7A2253] cursor-pointer lg:min-w-0";
  const icon = "h-4 w-4 text-[#7A2253]";
  const actions: { label: string; icon: ReactNode; href?: string; onClick?: () => void }[] = [
    { label: "Add Episode", icon: <Clapperboard className={icon} />, href: addEpisodeHref },
    { label: "Add Link", icon: <Link2 className={icon} />, href: "/dashboard/links?new=true" },
    { label: "Add Product", icon: <ShoppingBag className={icon} />, href: "/dashboard/products?new=true" },
    { label: "Update Media Kit", icon: <Briefcase className={icon} />, href: "/dashboard/mediakit" },
    { label: "Share Journey Card", icon: <IdCard className={icon} />, href: "/dashboard/creator-card" },
    { label: "Copy Link", icon: <Copy className={icon} />, onClick: onCopyLink },
  ];
  return (
    <section className="space-y-2.5">
      <h2 className="text-[14px] font-semibold text-[#18181B]">Quick actions</h2>
      <div className="flex snap-x gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-6 lg:overflow-visible">
        {actions.map((a) =>
          a.href ? (
            <Link key={a.label} href={a.href} className={cls}>
              {a.icon}
              <span className="leading-tight">{a.label}</span>
            </Link>
          ) : (
            <button key={a.label} type="button" onClick={a.onClick} className={cls}>
              {a.icon}
              <span className="leading-tight">{a.label}</span>
            </button>
          ),
        )}
      </div>
    </section>
  );
}

// ── 6. Era progress ───────────────────────────────────────────

export function EraProgressCard({ fans, onShare }: { fans: number; onShare: () => void }) {
  const era = getCreatorEra(fans);
  const progress = getEraProgress(fans);
  const cfg = getEraConfig(era?.era);
  return (
    <section className={`${CARD} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <EraAwardMedal era={cfg.name} stage={era?.stage ?? "Bronze"} size={38} />
          <div className="min-w-0">
            <p className="text-[12.5px] text-[#6B6B76]">
              {cfg.award} · {formatFans(fans)} fans
            </p>
            <p className="truncate text-[15px] font-semibold" style={{ color: eraInk(cfg.color) }}>
              {era?.badge ?? "Rising Bronze Creator"}
            </p>
          </div>
        </div>
        <button type="button" onClick={onShare} className="shrink-0 text-[12.5px] font-medium text-[#7A2253] hover:underline underline-offset-2 cursor-pointer">
          Share Era
        </button>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#F4F4F5]">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(3, progress.progressPercent)}%`, background: eraFill(cfg) }} />
      </div>
      <p className="mt-1.5 text-[12px] text-[#6B6B76]">
        {progress.nextBadge && progress.fansNeeded > 0 ? (
          <>
            <span className="font-semibold text-[#18181B]">{formatFans(progress.fansNeeded)}</span> fans to {progress.nextBadge}
          </>
        ) : (
          "You've reached the top Creator Era."
        )}
      </p>
    </section>
  );
}

// ── 7. Smart alerts ───────────────────────────────────────────

export interface SmartAlert {
  id: string;
  text: string;
  tone: "warn" | "info";
  cta: { label: string; href?: string; onClick?: () => void };
}

export function SmartAlerts({ alerts }: { alerts: SmartAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <section className="space-y-2" aria-label="Alerts">
      {alerts.map((a) => (
        <div
          key={a.id}
          className={`flex items-center gap-3 rounded-[5px] border px-3.5 py-2.5 ${
            a.tone === "warn" ? "border-amber-200 bg-amber-50" : "border-[#F3D9E5] bg-[#FDF5F9]"
          }`}
        >
          <AlertTriangle className={`h-4 w-4 shrink-0 ${a.tone === "warn" ? "text-amber-600" : "text-[#7A2253]"}`} />
          <p className="min-w-0 flex-1 text-[12.5px] font-medium text-[#18181B]">{a.text}</p>
          {a.cta.href ? (
            <Link href={a.cta.href} className="shrink-0 text-[12.5px] font-semibold text-[#7A2253] hover:underline underline-offset-2">
              {a.cta.label}
            </Link>
          ) : (
            <button type="button" onClick={a.cta.onClick} className="shrink-0 text-[12.5px] font-semibold text-[#7A2253] hover:underline underline-offset-2 cursor-pointer">
              {a.cta.label}
            </button>
          )}
        </div>
      ))}
    </section>
  );
}

/** "12 plays" chip for the Series / Shop / Links list rows. */
export function RowCount({ count, unit }: { count: number | undefined; unit: string }) {
  const n = count ?? 0;
  return (
    <span className={`shrink-0 text-[12px] tabular-nums ${n > 0 ? "font-semibold text-[#18181B]" : "text-[#A1A1AA]"}`} title="Last 7 days">
      {formatCount(n)} {unit}
      {n === 1 ? "" : "s"}
    </span>
  );
}
