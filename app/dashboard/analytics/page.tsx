"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Eye, MousePointerClick, Users, ExternalLink, RefreshCw } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { EmptyState } from "@/components/ui/EmptyState";

type AnalyticsTarget = {
  event_type: string;
  event_target: string | null;
  clicks: number;
};

type AnalyticsState = {
  loading: boolean;
  profileViews: number;
  uniqueVisitors: number;
  episodeClicks: number;
  topTargets: AnalyticsTarget[];
};

const EMPTY_ANALYTICS: AnalyticsState = {
  loading: false,
  profileViews: 0,
  uniqueVisitors: 0,
  episodeClicks: 0,
  topTargets: [],
};

export default function DashboardAnalyticsPage() {
  const { profile } = useCreator();
  const [analytics, setAnalytics] = useState<AnalyticsState>(EMPTY_ANALYTICS);
  const [period, setPeriod] = useState<"7d" | "30d">("30d");

  const query = useMemo(() => {
    if (profile.email) return `email=${encodeURIComponent(profile.email)}`;
    if (profile.username) return `username=${encodeURIComponent(profile.username)}`;
    if (profile.id) return `creatorId=${encodeURIComponent(profile.id)}`;
    return "";
  }, [profile.email, profile.id, profile.username]);

  useEffect(() => {
    if (!query) return;

    let ignore = false;

    async function loadAnalytics() {
      setAnalytics((current) => ({ ...current, loading: true }));

      try {
        const res = await fetch(`/api/creator/analytics?${query}&period=${period}`);
        const data = await res.json();

        if (ignore) return;
        setAnalytics({
          loading: false,
          profileViews: Number(data.metrics?.profileViews || 0),
          uniqueVisitors: Number(data.metrics?.uniqueVisitors || 0),
          episodeClicks: Number(data.metrics?.episodeClicks || 0),
          topTargets: Array.isArray(data.topTargets) ? data.topTargets : [],
        });
      } catch {
        if (!ignore) setAnalytics({ ...EMPTY_ANALYTICS, loading: false });
      }
    }

    void loadAnalytics();

    return () => {
      ignore = true;
    };
  }, [period, query]);

  const handleStr = profile.username || "username";
  const clickedParts = analytics.topTargets.filter((item) => item.event_type === "episode_click");

  return (
    <div className="space-y-4 sm:space-y-4.5 w-full pb-8 text-left">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Analytics
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#043084]/10 px-2.5 py-0.5 text-xs font-bold text-[#043084]">
              <BarChart3 className="h-3 w-3" />
              <span>{period === "7d" ? "Past 7 Days" : "Past 30 Days"}</span>
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
            Public profile opens, unique visitors, and series link click engagement.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <div className="rounded-xl border border-slate-200 bg-white p-1 shadow-2xs flex items-center">
            {(["7d", "30d"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={`h-7.5 rounded-lg px-2.5 text-xs font-bold transition-all cursor-pointer ${period === value
                    ? "bg-[#043084] text-white shadow-xs"
                    : "text-[#64748b] hover:bg-[#f8fafc] hover:text-[#043084]"
                  }`}
              >
                {value === "7d" ? "7 days" : "30 days"}
              </button>
            ))}
          </div>
          <Link
            href={`/${handleStr}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#043084] shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-300"
          >
            <span>Live Profile</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard
          icon={<Eye className="h-4 w-4" />}
          label="Profile opens"
          value={analytics.profileViews}
          helper="Public profile link opened"
          loading={analytics.loading}
        />
        <MetricCard
          icon={<Users className="h-4 w-4" />}
          label="Unique visitors"
          value={analytics.uniqueVisitors}
          helper="Approx browser visitors"
          loading={analytics.loading}
        />
        <MetricCard
          icon={<MousePointerClick className="h-4 w-4" />}
          label="Series part clicks"
          value={analytics.episodeClicks}
          helper="Episode links clicked from public series pages"
          loading={analytics.loading}
        />
      </section>

      <section className="rounded-xl border border-[#e2e8f0] bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-2.5">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-[#043084]">Top clicked series parts</h2>
            <p className="text-[11px] text-[#64748b]">Only clicks from public series pages are counted.</p>
          </div>
          {analytics.loading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#64748b]" />}
        </div>

        {clickedParts.length === 0 ? (
          <EmptyState
            icon={<BarChart3 className="h-7 w-7" />}
            title="No series clicks yet"
            description="Share your public profile and series links. Clicks will appear here after fans open episode links."
            className="border-none bg-transparent"
          />
        ) : (
          <div className="divide-y divide-[#e2e8f0]">
            {clickedParts.slice(0, 10).map((item, index) => (
              <div key={`${item.event_target}-${index}`} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs sm:text-sm font-semibold text-[#043084]">
                    {item.event_target || "Series part"}
                  </p>
                  <p className="text-[11px] text-[#64748b]">Public series episode link</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#043084]/[0.08] border border-[#043084]/10 px-2 py-0.5 text-[11px] font-bold text-[#043084]">
                  {Number(item.clicks || 0).toLocaleString("en-IN")} clicks
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  helper,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  helper: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-3.5 sm:p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#64748b]">{label}</span>
        <span className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-[#043084]">
          {icon}
        </span>
      </div>
      <p className="mt-2 text-2xl sm:text-[28px] font-bold leading-none tracking-tight text-[#043084] tabular-nums">
        {loading ? "..." : value.toLocaleString("en-IN")}
      </p>
      <p className="mt-1.5 text-[11px] text-[#64748b]">{helper}</p>
    </div>
  );
}
