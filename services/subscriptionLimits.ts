import { Series } from "@/types";

export const EARLY_ACCESS_LIMITS = {
  maxSeries: 3,
  maxEpisodesPerSeries: 5,
};

export const CREATOR_PLAN_LIMITS = {
  maxSeries: Infinity,
  maxEpisodesPerSeries: Infinity,
};

export function getSeriesUsage(seriesList: Series[]) {
  const current = seriesList ? seriesList.length : 0;
  const max = EARLY_ACCESS_LIMITS.maxSeries;
  const isLimitReached = current >= max;
  return {
    current,
    max,
    isLimitReached,
    percentage: Math.min(100, Math.round((current / max) * 100)),
  };
}

export function getEpisodeUsage(seriesItem: Series) {
  const totalEpisodes = seriesItem && seriesItem.seasons
    ? seriesItem.seasons.reduce((acc, season) => acc + (season.episodes ? season.episodes.length : 0), 0)
    : 0;
  const max = EARLY_ACCESS_LIMITS.maxEpisodesPerSeries;
  const isLimitReached = totalEpisodes >= max;
  return {
    current: totalEpisodes,
    max,
    isLimitReached,
    percentage: Math.min(100, Math.round((totalEpisodes / max) * 100)),
  };
}

export function getTotalEpisodesUsage(seriesList: Series[]) {
  const totalEpisodes = seriesList
    ? seriesList.reduce(
        (acc, s) => acc + (s.seasons ? s.seasons.reduce((a, b) => a + (b.episodes ? b.episodes.length : 0), 0) : 0),
        0
      )
    : 0;
  const theoreticalMax = EARLY_ACCESS_LIMITS.maxSeries * EARLY_ACCESS_LIMITS.maxEpisodesPerSeries; // 15
  return {
    current: totalEpisodes,
    theoreticalMax,
  };
}

export function canCreateSeries(seriesList: Series[]): boolean {
  return (seriesList ? seriesList.length : 0) < EARLY_ACCESS_LIMITS.maxSeries;
}

export function canCreateEpisode(seriesItem: Series): boolean {
  const usage = getEpisodeUsage(seriesItem);
  return !usage.isLimitReached;
}
