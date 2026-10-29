"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  Eye,
  FileText,
  Link2,
  MousePointerClick,
  Package,
  Send,
  ShoppingBag,
  Tv,
  Wrench,
} from "lucide-react";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { StatGrid, StatTile } from "@/components/dashboard/StatTile";
import { PAGE_COPY } from "@/components/dashboard/pageCopy";
import type { AnalyticsPeriod, AnalyticsSummary, AnalyticsTotals } from "@/lib/analyticsSummary";

const TILES: { key: keyof AnalyticsTotals; label: string; icon: React.ReactNode }[] = [
  { key: "profileViews", label: "Profile opens", icon: <Eye className="h-[30px] w-[30px]" strokeWidth={2.25} /> },
  { key: "seriesOpens", label: "Series opens", icon: <Tv className="h-[30px] w-[30px]" strokeWidth={2.25} /> },
  { key: "episodeClicks", label: "Episode clicks", icon: <MousePointerClick className="h-[30px] w-[30px]" strokeWidth={2.25} /> },
  { key: "linkClicks", label: "Link clicks", icon: <Link2 className="h-[30px] w-[30px]" strokeWidth={2.25} /> },
  { key: "productClicks", label: "Product clicks", icon: <ShoppingBag className="h-[30px] w-[30px]" strokeWidth={2.25} /> },
  { key: "setupClicks", label: "Setup clicks", icon: <Wrench className="h-[30px] w-[30px]" strokeWidth={2.25} /> },
  { key: "mediaKitViews", label: "Media kit views", icon: <FileText className="h-[30px] w-[30px]" strokeWidth={2.25} /> },
  { key: "collabPackageViews", label: "Package views", icon: <Package className="h-[30px] w-[30px]" strokeWidth={2.25} /> },
  { key: "collabRequests", label: "Collab requests", icon: <Send className="h-[30px] w-[30px]" strokeWidth={2.25} /> },
];

const fmt = (n: number) => n.toLocaleString("en-IN");

export default function DashboardAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("7d");
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openSeries, setOpenSeries] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(false);
    fetch(`/api/analytics?period=${period}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((summary: AnalyticsSummary) => {
        if (!ignore) setData(summary);
      })
      .catch(() => {
        if (!ignore) setError(true);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [period]);

  // Dashboard quick-stat links land on #section once the lists have rendered.
  useEffect(() => {
    if (!data || typeof window === "undefined" || !window.location.hash) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "start" });
  }, [data]);

  const items = data?.items;

  return (
    <PageContainer className="text-left">
      <PageHeader
        {...PAGE_COPY.analytics}
        actions={
          <div className="inline-flex h-8 items-center rounded-[5px] border border-[#ECECF0] bg-white p-0.5">
            {(["7d", "30d"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                aria-pressed={period === value}
                className={`h-7 px-3 rounded-[5px] text-[13px] font-medium transition-all cursor-pointer ${
                  period === value ? "bg-[#7A2253] text-white" : "text-[#6B6B76] hover:text-[#18181B]"
                }`}
              >
                {value === "7d" ? "7 days" : "30 days"}
              </button>
            ))}
          </div>
        }
      />

      {error && (
        <p className="mb-4 rounded-[5px] border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          Couldn&apos;t load analytics. Please refresh the page.
        </p>
      )}

      <StatGrid className="lg:grid-cols-5 scroll-mt-20">
        {TILES.map((tile) => (
          <StatTile
            key={tile.key}
            icon={tile.icon}
            value={loading || !data ? "…" : fmt(data.totals[tile.key])}
            label={tile.label}
          />
        ))}
      </StatGrid>

      <div className="space-y-5">
        <Section id="series" title="Series" icon={<Tv className="h-4 w-4" />} loading={loading} empty={!items?.series.some((s) => s.opens + s.episodeClicks > 0)}>
          {items?.series.map((s) => {
            const open = Boolean(openSeries[s.id]);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setOpenSeries((prev) => ({ ...prev, [s.id]: !open }))}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-[#FAFAFB] cursor-pointer"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-[#94a3b8] transition-transform ${open ? "" : "-rotate-90"}`} />
                    <span className="line-clamp-2 text-[13px] font-medium text-[#18181B]" title={s.title}>{s.title}</span>
                  </span>
                  <span className="flex shrink-0 gap-1.5">
                    <CountChip value={s.opens} unit="opens" />
                    <CountChip value={s.episodeClicks} unit="clicks" />
                  </span>
                </button>
                {open && (
                  <ul className="border-t border-[#ECECF0] bg-[#FAFAFB]">
                    {s.episodes.length === 0 ? (
                      <li className="px-10 py-2 text-[12px] text-[#6B6B76]">No episodes</li>
                    ) : (
                      s.episodes.map((ep) => (
                        <li key={ep.id} className="flex items-center justify-between gap-3 py-2 pl-10 pr-4">
                          <span className="line-clamp-2 text-[12px] text-[#6B6B76]" title={ep.title}>{ep.title}</span>
                          <CountChip value={ep.clicks} unit="clicks" />
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </Section>

        <Section id="links" title="Links" icon={<Link2 className="h-4 w-4" />} loading={loading} empty={!items?.links.some((l) => l.clicks > 0)}>
          {items?.links.map((l) => <Row key={l.id} name={l.title} chips={<CountChip value={l.clicks} unit="clicks" />} />)}
        </Section>

        <Section id="products" title="Products" icon={<ShoppingBag className="h-4 w-4" />} loading={loading} empty={!items?.products.some((p) => p.clicks > 0)}>
          {items?.products.map((p) => <Row key={p.id} name={p.name} chips={<CountChip value={p.clicks} unit="clicks" />} />)}
        </Section>

        <Section id="setup" title="My Setup" icon={<Wrench className="h-4 w-4" />} loading={loading} empty={!items?.setup.some((g) => g.clicks > 0)}>
          {items?.setup.map((g) => <Row key={g.id} name={g.name} chips={<CountChip value={g.clicks} unit="clicks" />} />)}
        </Section>

        <Section id="packages" title="Collab Packages" icon={<Package className="h-4 w-4" />} loading={loading} empty={!items?.packages.some((p) => p.views + p.requests > 0)}>
          {items?.packages.map((p) => (
            <Row
              key={p.id}
              name={p.title}
              chips={
                <>
                  <CountChip value={p.views} unit="views" />
                  <CountChip value={p.requests} unit="requests" />
                </>
              }
            />
          ))}
        </Section>
      </div>
    </PageContainer>
  );
}

function Section({
  id,
  title,
  icon,
  loading,
  empty,
  children,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
  loading: boolean;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <SectionCard id={id} title={title} icon={icon} className="scroll-mt-20" bodyClassName="">
      {loading ? (
        <p className="px-4 py-3 text-[13px] text-[#6B6B76]">Loading…</p>
      ) : empty ? (
        <p className="px-4 py-3 text-[13px] text-[#6B6B76]">No clicks yet</p>
      ) : (
        <ul className="divide-y divide-[#ECECF0]">{children}</ul>
      )}
    </SectionCard>
  );
}

function Row({ name, chips }: { name: string; chips: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="line-clamp-2 text-[13px] font-medium text-[#18181B]" title={name}>{name}</span>
      <span className="flex shrink-0 gap-1.5">{chips}</span>
    </li>
  );
}

function CountChip({ value, unit }: { value: number; unit: string }) {
  return (
    <span
      className={`inline-flex items-center h-6 rounded-[5px] border px-2 text-[12px] font-medium tabular-nums ${
        value > 0 ? "border-[#FCE7F3] bg-[#FFF5F7] text-[#7A2253]" : "border-[#ECECF0] bg-[#FAFAFB] text-[#6B6B76]"
      }`}
    >
      {fmt(value)} {unit}
    </span>
  );
}
