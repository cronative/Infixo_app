import { Series } from "@/types";

export interface PlanQuota {
  name: string;
  maxSeries: number;
  maxEpisodesPerSeries: number;
  maxTotalEpisodes: number;
  maxGigs: number;
  maxReviews: number;
  maxCustomLinks: number;
  hasRateCard: boolean;
  hasMediaKit: boolean;
  publicProfileDays?: number;
  description: string;
}

export const EARLY_ACCESS_LIMITS = {
  maxSeries: 3,
  maxEpisodesPerSeries: 5,
  maxTotalEpisodes: 15,
  maxGigs: 1,
};

export const PLAN_QUOTAS: Record<string, PlanQuota> = {
  early_access: {
    name: "Free Trial",
    maxSeries: 3,
    maxEpisodesPerSeries: 5,
    maxTotalEpisodes: 15,
    maxGigs: 1,
    maxReviews: 1,
    maxCustomLinks: 5,
    hasRateCard: false,
    hasMediaKit: false,
    publicProfileDays: 7,
    description: "7-day public profile trial with Inflixo branding, social stats, 3 series, 5 links, 1 review and 1 collab package.",
  },
  starter: {
    name: "Starter",
    maxSeries: 3,
    maxEpisodesPerSeries: 5,
    maxTotalEpisodes: 15,
    maxGigs: 1,
    maxReviews: 1,
    maxCustomLinks: 5,
    hasRateCard: false,
    hasMediaKit: false,
    description: "Keep your public profile live after trial with the same starter limits.",
  },
  creator_pro: {
    name: "Pro",
    maxSeries: 20,
    maxEpisodesPerSeries: 20,
    maxTotalEpisodes: 400,
    maxGigs: 3,
    maxReviews: 10,
    maxCustomLinks: 20,
    hasRateCard: true,
    hasMediaKit: true,
    description: "20 series, 20 episodes per series, 20 links, 3 collab packages, 10 reviews, rate card and default media kit.",
  },
  creator_VIP: {
    name: "VIP",
    maxSeries: Infinity,
    maxEpisodesPerSeries: Infinity,
    maxTotalEpisodes: Infinity,
    maxGigs: 10,
    maxReviews: Infinity,
    maxCustomLinks: Infinity,
    hasRateCard: true,
    hasMediaKit: true,
    description: "Unlimited series, episodes, links and reviews, 10 collab packages, custom media kit and premium features.",
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
  const max = quota.maxEpisodesPerSeries;
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
