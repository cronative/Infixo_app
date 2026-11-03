"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  Copy,
  Link2,
  Package,
  ShoppingBag,
  Tv,
  Wrench,
} from "lucide-react";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { StatCard } from "@/components/dashboard/StatCard";
import { PAGE_COPY } from "@/components/dashboard/pageCopy";
import type { AnalyticsPeriod, AnalyticsSummary, AnalyticsTotals } from "@/lib/analyticsSummary";

const TILE_GROUPS: { label: string; tiles: { key: keyof AnalyticsTotals; label: string }[] }[] = [
  {
    label: "Profile",
    tiles: [
      { key: "profileViews", label: "Profile opens" },
      { key: "seriesOpens", label: "Series opens" },
      { key: "episodeClicks", label: "Episode clicks" },
    ],
  },
  {
    label: "Clicks",
    tiles: [
      { key: "linkClicks", label: "Link clicks" },
      { key: "productClicks", label: "Product clicks" },
      { key: "setupClicks", label: "Setup clicks" },
    ],
  },
  {
    label: "Brands",
    tiles: [
      { key: "mediaKitViews", label: "Media kit views" },
      { key: "collabPackageViews", label: "Package views" },
      { key: "collabRequests", label: "Collab requests" },
    ],
  },
];

const TOP_N = 5;

const fmt = (n: number) => n.toLocaleString("en-IN");

export default function DashboardAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("7d");
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openSeries, setOpenSeries] = useState<Record<string, boolean>>({});
  const { profile } = useCreator();
  const { showToast } = useToast();

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

  const copyProfileLink = async () => {
    const handle = (profile.username || "").replace(/^@/, "");
    const url = `${window.location.origin}/${handle}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Profile link copied");
    } catch {
      showToast(url);
    }
  };

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

      {TILE_GROUPS.map((group) => (
        <div key={group.label} className="mb-4 last:mb-5">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#9A9AA3]">{group.label}</p>
          {/* Always 3 across so each group stays one row (cards tighten on phones). */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {group.tiles.map((tile) => (
              <StatCard
                key={tile.key}
                label={<span className="max-sm:block max-sm:min-h-[30px] max-sm:whitespace-normal max-sm:text-[12px] max-sm:leading-[15px]">{tile.label}</span>}
                value={loading || !data ? "…" : fmt(data.totals[tile.key])}
                className="max-sm:px-3 max-sm:py-3"
              />
            ))}
          </div>
        </div>
      ))}

      <div className="grid grid-cols-1 items-stretch gap-3 md:max-[1199px]:grid-cols-2 min-[1200px]:grid-cols-3">
        <Section
          id="series"
          title="Series"
          icon={<Tv className="h-4 w-4" />}
          total={data?.totals.episodeClicks}
          unit="clicks"
          loading={loading}
          empty={!items?.series.some((s) => s.opens + s.episodeClicks > 0)}
          onCopyLink={copyProfileLink}
          items={[...(items?.series ?? [])].sort((a, b) => b.opens + b.episodeClicks - (a.opens + a.episodeClicks))}
          renderItem={(s) => {
            const open = Boolean(openSeries[s.id]);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setOpenSeries((prev) => ({ ...prev, [s.id]: !open }))}
                  aria-expanded={open}
                  className="flex min-h-[44px] w-full items-center justify-between gap-3 px-4 py-2 text-left hover:bg-[#FAFAFB] cursor-pointer"
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-[#A1A1AA] transition-transform ${open ? "" : "-rotate-90"}`} />
                    <span className="truncate text-[13px] font-medium text-[#18181B]" title={s.title}>{s.title}</span>
                  </span>
                  <Counts parts={[[s.opens, "opens"], [s.episodeClicks, "clicks"]]} />
                </button>
                {open && (
                  <ul className="divide-y divide-[#F1F1F4] border-t border-[#ECECF0] bg-[#FAFAFB]">
                    {s.episodes.length === 0 ? (
                      <li className="py-2 pl-9 pr-4 text-[12px] text-[#6B6B76]">No episodes</li>
                    ) : (
                      s.episodes.map((ep) => (
                        <li key={ep.id} className="flex items-center justify-between gap-3 py-2 pl-9 pr-4">
                          <span className="truncate text-[12px] text-[#52525B]" title={ep.title}>{ep.title}</span>
                          <Counts parts={[[ep.clicks, "clicks"]]} />
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </li>
            );
          }}
        />

        <Section
          id="links"
          title="Links"
          icon={<Link2 className="h-4 w-4" />}
          total={data?.totals.linkClicks}
          unit="clicks"
          loading={loading}
          empty={!items?.links.some((l) => l.clicks > 0)}
          onCopyLink={copyProfileLink}
          items={[...(items?.links ?? [])].sort((a, b) => b.clicks - a.clicks)}
          renderItem={(l) => <Row key={l.id} name={l.title} parts={[[l.clicks, "clicks"]]} />}
        />

        <Section
          id="products"
          title="Products"
          icon={<ShoppingBag className="h-4 w-4" />}
          total={data?.totals.productClicks}
          unit="clicks"
          loading={loading}
          empty={!items?.products.some((p) => p.clicks > 0)}
          onCopyLink={copyProfileLink}
          items={[...(items?.products ?? [])].sort((a, b) => b.clicks - a.clicks)}
          renderItem={(p) => <Row key={p.id} name={p.name} parts={[[p.clicks, "clicks"]]} />}
        />

        <Section
          id="setup"
          title="My Setup"
          icon={<Wrench className="h-4 w-4" />}
          total={data?.totals.setupClicks}
          unit="clicks"
          loading={loading}
          empty={!items?.setup.some((g) => g.clicks > 0)}
          onCopyLink={copyProfileLink}
          items={[...(items?.setup ?? [])].sort((a, b) => b.clicks - a.clicks)}
          renderItem={(g) => <Row key={g.id} name={g.name} parts={[[g.clicks, "clicks"]]} />}
        />

        <Section
          id="packages"
          title="Collab Packages"
          icon={<Package className="h-4 w-4" />}
          total={data?.totals.collabPackageViews}
          unit="views"
          loading={loading}
          empty={!items?.packages.some((p) => p.views + p.requests > 0)}
          onCopyLink={copyProfileLink}
          items={[...(items?.packages ?? [])].sort((a, b) => b.views + b.requests - (a.views + a.requests))}
          renderItem={(p) => <Row key={p.id} name={p.title} parts={[[p.views, "views"], [p.requests, "requests"]]} />}
        />
      </div>
    </PageContainer>
  );
}

function Section<T>({
  id,
  title,
  icon,
  total,
  unit,
  loading,
  empty,
  items,
  renderItem,
  onCopyLink,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  total?: number;
  unit: string;
  loading: boolean;
  empty: boolean;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  onCopyLink: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, TOP_N);

  return (
    <section id={id} className="flex min-w-0 scroll-mt-20 flex-col self-stretch rounded-[5px] border border-[#ECECF0] bg-white">
      <header className="flex items-center justify-between gap-3 rounded-t-[5px] border-b border-[#ECECF0] bg-[#7A2253]/[0.07] px-4 py-2.5">
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] bg-white text-[#7A2253]">{icon}</span>
          <h2 className="truncate text-[14px] font-semibold text-[#18181B]">{title}</h2>
        </span>
        {!loading && total !== undefined && (
          <span className="shrink-0 text-[12px] text-[#6B6B76]">
            <span className="font-semibold tabular-nums text-[#18181B]">{fmt(total)}</span> {unit}
          </span>
        )}
      </header>
      {loading ? (
        <p className="px-4 py-3 text-[13px] text-[#6B6B76]">Loading…</p>
      ) : empty ? (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <p className="min-w-0 truncate text-[12px] text-[#6B6B76]" title="No clicks yet — share your link to get started">No clicks yet — share your link to get started</p>
          <button
            type="button"
            onClick={onCopyLink}
            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-[5px] border border-[#E4E4E7] bg-white px-2 text-[12px] font-medium text-[#18181B] hover:border-[#7A2253] hover:text-[#7A2253] cursor-pointer"
          >
            <Copy className="h-3 w-3" />
            Copy link
          </button>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-[#ECECF0]">{visible.map(renderItem)}</ul>
          {items.length > TOP_N && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="mt-auto border-t border-[#ECECF0] px-4 py-2 text-left text-[12.5px] font-medium text-[#7A2253] hover:underline underline-offset-2 cursor-pointer"
            >
              {showAll ? "Show less" : `View all (${items.length})`}
            </button>
          )}
        </>
      )}
    </section>
  );
}

function Row({ name, parts }: { name: string; parts: [number, string][] }) {
  return (
    <li className="flex min-h-[44px] items-center justify-between gap-3 px-4 py-2">
      <span className="min-w-0 truncate text-[13px] font-medium text-[#18181B]" title={name}>{name}</span>
      <Counts parts={parts} />
    </li>
  );
}

/** Right-aligned counts: bold number + muted unit, "·" separated. */
function Counts({ parts }: { parts: [number, string][] }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[12px] text-[#6B6B76]">
      {parts.map(([value, unit], i) => (
        <span key={unit}>
          {i > 0 && <span className="mr-1.5 text-[#D4D4D8]">·</span>}
          <span className={`font-semibold tabular-nums ${value > 0 ? "text-[#18181B]" : "text-[#A1A1AA]"}`}>{fmt(value)}</span>{" "}
          {value === 1 ? unit.replace(/s$/, "") : unit}
        </span>
      ))}
    </span>
  );
}
