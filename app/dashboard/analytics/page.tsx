"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  ChevronDown,
  ExternalLink,
  Eye,
  Link2,
  MousePointerClick,
  RefreshCw,
  Tv,
  Users,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { PageHeader } from "@/components/dashboard/PageHeader";

type AnalyticsTarget = {
  event_type: string;
  event_target: string | null;
  clicks: number;
  series_title?: string | null;
  episode_title?: string | null;
  episode_number?: number | null;
  display_title?: string | null;
  display_subtitle?: string | null;
};

type AnalyticsState = {
  loading: boolean;
  profileViews: number;
  uniqueVisitors: number;
  episodeClicks: number;
  socialClicks: number;
  linkClicks: number;
  topTargets: AnalyticsTarget[];
};

const EMPTY_ANALYTICS: AnalyticsState = {
  loading: false,
  profileViews: 0,
  uniqueVisitors: 0,
  episodeClicks: 0,
  socialClicks: 0,
  linkClicks: 0,
  topTargets: [],
};

export default function DashboardAnalyticsPage() {
  const { profile, series: creatorSeries } = useCreator();
  const [analytics, setAnalytics] = useState<AnalyticsState>(EMPTY_ANALYTICS);
  const [period, setPeriod] = useState<"7d" | "30d">("7d");

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
        const httpResponse = await fetch(`/api/creator/analytics?${query}&period=${period}`);
        const apiResponse = await httpResponse.json();

        if (ignore) return;
        const metrics = apiResponse.data?.metrics || apiResponse.metrics;
        const topTargets = apiResponse.data?.topTargets || apiResponse.topTargets;
        if (httpResponse.ok && (apiResponse.status === 1 || apiResponse.success)) {
          setAnalytics({
            loading: false,
            profileViews: Number(metrics?.profileViews || 0),
            uniqueVisitors: Number(metrics?.uniqueVisitors || 0),
            episodeClicks: Number(metrics?.episodeClicks || 0),
            socialClicks: Number(metrics?.socialClicks || 0),
            linkClicks: Number(metrics?.linkClicks || 0),
            topTargets: Array.isArray(topTargets) ? topTargets : [],
          });
        } else {
          setAnalytics({ ...EMPTY_ANALYTICS, loading: false });
        }
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

  const resolveTargetInfo = (item: AnalyticsTarget) => {
    // If backend provided clean title (and not equal to raw ID), use it!
    if (item.display_title && item.display_title !== item.event_target) {
      return {
        title: item.display_title,
        subtitle:
          item.display_subtitle ||
          (item.event_type === "episode_click" ? "Series episode link" : "Profile target"),
        isSeries: item.event_type === "episode_click" || Boolean(item.series_title),
      };
    }

    const raw = String(item.event_target || "").trim();
    if (
      item.event_type === "episode_click" ||
      raw.includes("series_") ||
      raw.includes("ep_")
    ) {
      let sId = "";
      let epId = "";
      if (raw.includes(":")) {
        const parts = raw.split(":");
        sId = parts[0] || "";
        epId = parts[1] || "";
      } else if (raw.startsWith("series_")) {
        sId = raw;
      } else if (raw.startsWith("ep_")) {
        epId = raw;
      }

      const matchedSeries = creatorSeries?.find((s) => s.id === sId);
      const allEpisodes =
        matchedSeries?.seasons?.flatMap((sea) => sea.episodes || []) ||
        ((matchedSeries as any)?.episodes as any[] | undefined) ||
        [];
      let matchedEpisode = allEpisodes.find((e: any) => e.id === epId);

      if (!matchedEpisode && epId && creatorSeries) {
        for (const s of creatorSeries) {
          const sEps =
            s.seasons?.flatMap((sea) => sea.episodes || []) ||
            ((s as any)?.episodes as any[] | undefined) ||
            [];
          const ep = sEps.find((e: any) => e.id === epId);
          if (ep) {
            matchedEpisode = ep;
            break;
          }
        }
      }

      if (matchedSeries && matchedEpisode) {
        return {
          title: matchedSeries.title,
          subtitle: `Episode ${matchedEpisode.episodeNumber || 1}: ${matchedEpisode.title}`,
          isSeries: true,
        };
      }
      if (matchedSeries) {
        return {
          title: matchedSeries.title,
          subtitle: "Series link",
          isSeries: true,
        };
      }
      if (matchedEpisode) {
        return {
          title: matchedEpisode.title,
          subtitle: `Episode ${matchedEpisode.episodeNumber || 1}`,
          isSeries: true,
        };
      }
      return {
        title: item.series_title || "Series Episode",
        subtitle: "Series episode link",
        isSeries: true,
      };
    }

    if (item.event_type === "social_click") {
      let name = "Social profile link";
      if (raw.includes("instagram.com")) name = "Instagram";
      else if (raw.includes("youtube.com")) name = "YouTube";
      else if (raw.includes("twitter.com") || raw.includes("x.com")) name = "X (Twitter)";
      return {
        title: name,
        subtitle: raw || "Social link",
        isSeries: false,
      };
    }

    return {
      title: item.display_title || item.event_target || "Profile link",
      subtitle:
        item.display_subtitle ||
        (item.event_type === "link_click" ? "Custom bio link" : "Profile target"),
      isSeries: false,
    };
  };

  return (
    <PageContainer className="text-left">
      {/* ── Top Header Row ── */}
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <span>Analytics</span>
            <button
              type="button"
              onClick={() => setPeriod(period === "7d" ? "30d" : "7d")}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF5F7] border border-[#FCE7F3] px-2.5 py-0.5 text-xs font-semibold text-[#7A2253] hover:bg-[#FCE7F3]/60 transition-colors cursor-pointer"
            >
              <Calendar className="h-3 w-3 text-[#7A2253]" />
              <span>{period === "7d" ? "Past 7 Days" : "Past 30 Days"}</span>
              <ChevronDown className="h-3 w-3 text-[#7A2253]" />
            </button>
          </div>
        }
        subtitle="Public profile opens, unique visitors, and series link click engagement."
        actions={
          <>
            <div className="rounded-[5px] border border-[#e2e8f0] bg-white p-0.5 shadow-2xs flex items-center h-9">
              {(["7d", "30d"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPeriod(value)}
                  className={`rounded-[4px] px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    period === value
                      ? "bg-[#7A2253] text-white shadow-xs"
                      : "text-[#64748b] hover:text-[#0f172a]"
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
              className="inline-flex h-9 items-center gap-1.5 rounded-[5px] bg-[#7A2253] px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-[#681c46] transition-colors"
            >
              <span>Live Profile</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </>
        }
      />

      {/* ── 4 Metrics Cards ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={<Eye className="h-5 w-5" />}
          label="Profile opens"
          value={analytics.profileViews}
          helper="Public profile link opened"
          loading={analytics.loading}
        />
        <MetricCard
          icon={<Users className="h-5 w-5" />}
          label="Unique visitors"
          value={analytics.uniqueVisitors}
          helper="Approx browser visitors"
          loading={analytics.loading}
        />
        <MetricCard
          icon={<MousePointerClick className="h-5 w-5" />}
          label="Series episode clicks"
          value={analytics.episodeClicks}
          helper="Episode links clicked"
          loading={analytics.loading}
        />
        <MetricCard
          icon={<ExternalLink className="h-5 w-5" />}
          label="Social & link clicks"
          value={analytics.socialClicks + analytics.linkClicks}
          helper="Social handles & bio links"
          loading={analytics.loading}
        />
      </section>

      {/* ── Top Clicked Links & Series Parts ── */}
      <section className="rounded-[5px] border border-[#e2e8f0] bg-white shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[#e2e8f0] bg-[#f8fafc]/80 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-[#0f172a]">Top clicked links &amp; series parts</h2>
            <p className="text-xs text-[#64748b] mt-0.5">Real-time fan engagement across your public profile.</p>
          </div>
          {analytics.loading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#64748b]" />}
        </div>

        {analytics.topTargets.length === 0 ? (
          <EmptyState
            icon={<BarChart3 className="h-7 w-7" />}
            title="No click events yet"
            description="Share your public profile and series links. Fan clicks on your episodes and bio links will appear here."
            className="border-none bg-transparent py-8"
          />
        ) : (
          <div className="divide-y divide-[#e2e8f0]">
            {analytics.topTargets.slice(0, 10).map((item, index) => {
              const info = resolveTargetInfo(item);

              return (
                <div
                  key={`${item.event_target}-${index}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#f8fafc]/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-[#FFF5F7] border border-[#FCE7F3] text-[#7A2253] shadow-2xs">
                      {info.isSeries ? (
                        <Tv className="h-4 w-4" />
                      ) : (
                        <Link2 className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs sm:text-sm font-bold text-[#0f172a]">
                        {info.title}
                      </p>
                      <p className="truncate text-xs text-[#64748b] mt-0.5">{info.subtitle}</p>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full bg-[#FFF5F7] border border-[#FCE7F3] px-3 py-1 text-xs font-bold text-[#7A2253] shadow-2xs">
                    {Number(item.clicks || 0).toLocaleString("en-IN")} clicks
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </PageContainer>
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
    <div className="rounded-[5px] border border-[#e2e8f0] bg-white p-4 shadow-2xs flex items-start gap-3.5 hover:border-[#cbd5e1] transition-colors">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] bg-[#FFF5F7] border border-[#FCE7F3] text-[#7A2253] shadow-2xs">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-xs sm:text-sm font-bold text-[#0f172a] truncate">{label}</h3>
        <p className="mt-1 text-2xl sm:text-[26px] font-bold leading-none tracking-tight text-[#7A2253] tabular-nums">
          {loading ? "..." : value.toLocaleString("en-IN")}
        </p>
        <p className="mt-1.5 text-xs text-[#64748b] truncate">{helper}</p>
      </div>
    </div>
  );
}
