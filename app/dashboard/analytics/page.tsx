"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Eye, MousePointerClick, Users, ExternalLink, RefreshCw } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";

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
    <div className="space-y-6 w-full pb-12 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#151933]">
            Analytics
          </h1>
          <p className="text-xs sm:text-[13px] text-[#64748b] font-medium mt-0.5">
            Public profile opens and public series part clicks only.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-1 shadow-xs">
            {(["7d", "30d"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={`h-8 rounded-lg px-3 text-xs font-bold transition-colors ${
                  period === value
                    ? "bg-[#151933] text-white"
                    : "text-[#64748b] hover:bg-[#f8fafc] hover:text-[#151933]"
                }`}
              >
                {value === "7d" ? "7 days" : "30 days"}
              </button>
            ))}
          </div>
          <Link
            href={`/${handleStr}`}
            target="_blank"
            className="h-10 px-3.5 rounded-[10px] bg-[#151933] hover:bg-brand-hover text-xs sm:text-sm font-semibold text-white transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <span>Open page</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      <section className="rounded-[16px] border border-[#e2e8f0] bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-[#151933]">Top clicked series parts</h2>
            <p className="text-xs text-[#64748b]">Only clicks from public series pages are counted.</p>
          </div>
          {analytics.loading && <RefreshCw className="h-4 w-4 animate-spin text-[#64748b]" />}
        </div>

        {clickedParts.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <BarChart3 className="h-7 w-7 text-[#94a3b8]" />
            <p className="mt-3 text-sm font-semibold text-[#151933]">No series clicks yet</p>
            <p className="mt-1 max-w-sm text-xs text-[#64748b]">
              Share your public profile and series links. Clicks will appear here after fans open episode links.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#e2e8f0]">
            {clickedParts.slice(0, 10).map((item, index) => (
              <div key={`${item.event_target}-${index}`} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#151933]">
                    {item.event_target || "Series part"}
                  </p>
                  <p className="text-xs text-[#64748b]">Public series episode link</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#151933]/[0.08] border border-[#151933]/10 px-2.5 py-1 text-xs font-bold text-[#151933]">
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
    <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#64748b]">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] text-[#151933]">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-[32px] font-semibold leading-none tracking-tight text-[#151933] tabular-nums">
        {loading ? "..." : value.toLocaleString("en-IN")}
      </p>
      <p className="mt-2 text-xs text-[#64748b]">{helper}</p>
    </div>
  );
}
