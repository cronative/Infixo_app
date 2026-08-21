import { Series, PlanKey } from "@/types";

export interface PlanQuota {
  name: string;
  maxSeries: number;
  maxTotalEpisodes: number;
  maxGigs: number;
  description: string;
}

export const EARLY_ACCESS_LIMITS = {
  maxSeries: 2,
  maxEpisodesPerSeries: 5,
  maxTotalEpisodes: 10,
  maxGigs: 1,
};

export const PLAN_QUOTAS: Record<string, PlanQuota> = {
  early_access: {
    name: "Creator Early Access",
    maxSeries: 2,
    maxTotalEpisodes: 10,
    maxGigs: 1,
    description: "Free Early Access. 1 Collab Gig, Live Rate Cards, WhatsApp Lead Routing & 2 OTT Series.",
  },
  creator_pro: {
    name: "Creator Pro",
    maxSeries: 30,
    maxTotalEpisodes: 300,
    maxGigs: 3,
    description: "30 Series, 300 Episodes, 3 Collab Gigs & Zero Inflixo Branding.",
  },
  creator_VIP: {
    name: "Creator VIP",
    maxSeries: Infinity,
    maxTotalEpisodes: Infinity,
    maxGigs: Infinity,
    description: "Unlimited Series, Episodes, Collab Gigs & Media Kit.",
  },
};

export function getPlanQuota(planKey: string = "early_access"): PlanQuota {
  return PLAN_QUOTAS[planKey] || PLAN_QUOTAS.early_access;
}

export function getSeriesUsage(seriesList: Series[], planKey: string = "early_access") {
  const current = seriesList ? seriesList.length : 0;
  const quota = getPlanQuota(planKey);
  const max = quota.maxSeries;
  const isLimitReached = current >= max;
  return {
    current,
    max,
    isLimitReached,
    percentage: max === Infinity ? 0 : Math.min(100, Math.round((current / max) * 100)),
  };
}

export function getTotalEpisodesCount(seriesList: Series[]): number {
  if (!seriesList) return 0;
  return seriesList.reduce(
    (acc, s) => acc + (s.seasons ? s.seasons.reduce((a, b) => a + (b.episodes ? b.episodes.length : 0), 0) : 0),
    0
  );
}

export function getTotalEpisodesUsage(seriesList: Series[], planKey: string = "early_access") {
  const current = getTotalEpisodesCount(seriesList);
  const quota = getPlanQuota(planKey);
  const max = quota.maxTotalEpisodes;
  const isLimitReached = current >= max;
  return {
    current,
    max,
    theoreticalMax: max,
    isLimitReached,
    percentage: max === Infinity ? 0 : Math.min(100, Math.round((current / max) * 100)),
  };
}

export function getEpisodeUsage(seriesItem: Series, planKey: string = "early_access") {
  const totalEpisodes = seriesItem && seriesItem.seasons
    ? seriesItem.seasons.reduce((acc, season) => acc + (season.episodes ? season.episodes.length : 0), 0)
    : 0;
  const quota = getPlanQuota(planKey);
  const max = quota.maxTotalEpisodes;
  const isLimitReached = totalEpisodes >= max;
  return {
    current: totalEpisodes,
    max,
    isLimitReached,
    percentage: max === Infinity ? 0 : Math.min(100, Math.round((totalEpisodes / max) * 100)),
  };
}

export function getGigUsage(currentGigsCount: number, planKey: string = "early_access") {
  const quota = getPlanQuota(planKey);
  const max = quota.maxGigs;
  const isLimitReached = currentGigsCount >= max;
  return {
    current: currentGigsCount,
    max,
    isLimitReached,
    percentage: max === Infinity ? 0 : Math.min(100, Math.round((currentGigsCount / max) * 100)),
  };
}

export function canCreateSeries(seriesList: Series[], planKey: string = "early_access"): boolean {
  const usage = getSeriesUsage(seriesList, planKey);
  return !usage.isLimitReached;
}

export function canCreateEpisode(targetSeriesOrList?: Series | Series[], planKey: string = "early_access"): boolean {
  if (!targetSeriesOrList) return true;
  if (Array.isArray(targetSeriesOrList)) {
    const usage = getTotalEpisodesUsage(targetSeriesOrList, planKey);
    return !usage.isLimitReached;
  } else {
    const usage = getEpisodeUsage(targetSeriesOrList, planKey);
    return !usage.isLimitReached;
  }
}

export function canCreateGig(currentGigsCount: number, planKey: string = "early_access"): boolean {
  const usage = getGigUsage(currentGigsCount, planKey);
  return !usage.isLimitReached;
}
