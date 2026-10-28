import { Series } from "@/types";
import { getPlan, normalizePlanKey, PLANS, type PlanKey } from "@/config/plans";

/**
 * Plan limits in the shape the app has always used, derived from config/plans.ts
 * (the single source of truth). Infinity = unlimited.
 */
export interface PlanQuota {
  key: PlanKey;
  name: string;
  maxSeries: number;
  maxEpisodesPerSeries: number;
  maxGigs: number;
  maxReviews: number;
  maxCustomLinks: number;
  maxProducts: number;
  maxGearItems: number;
  maxTeamSeats: number;
  description: string;
}

function toQuota(key: PlanKey): PlanQuota {
  const plan = PLANS[key];
  const l = plan.limits;
  return {
    key,
    name: plan.name,
    maxSeries: l.series,
    maxEpisodesPerSeries: l.episodesPerSeries,
    maxGigs: l.collabPackages,
    maxReviews: l.reviews,
    maxCustomLinks: l.links,
    maxProducts: l.products,
    maxGearItems: l.gearItems,
    maxTeamSeats: l.teamSeats,
    description: plan.subtitle,
  };
}

/** Accepts stored keys incl. legacy "early_access" / "creator_pro" / "creator_VIP". */
export function getPlanQuota(planKey: string = "trial"): PlanQuota {
  return toQuota(normalizePlanKey(planKey));
}

/** Display name for a stored plan key: Trial, Starter, Pro, VIP. */
export function getPlanName(planKey?: string | null) {
  return getPlan(planKey).name;
}

const usage = (current: number, max: number) => ({
  current,
  max,
  isLimitReached: current >= max,
  percentage: max === Infinity ? 0 : Math.min(100, Math.round((current / max) * 100)),
});

export function getSeriesUsage(seriesList: Series[], planKey: string = "trial") {
  return usage(seriesList ? seriesList.length : 0, getPlanQuota(planKey).maxSeries);
}

export function countSeriesEpisodes(seriesItem: Series | null | undefined): number {
  return seriesItem?.seasons
    ? seriesItem.seasons.reduce((acc, season) => acc + (season.episodes ? season.episodes.length : 0), 0)
    : 0;
}

/** Episodes are limited per series. */
export function getEpisodeUsage(seriesItem: Series, planKey: string = "trial") {
  return usage(countSeriesEpisodes(seriesItem), getPlanQuota(planKey).maxEpisodesPerSeries);
}

/** The series with the most episodes, for "5 of 5 in Goa Tour" style usage. */
export function getFullestSeriesEpisodeUsage(seriesList: Series[], planKey: string = "trial") {
  const fullest = (seriesList || []).reduce<Series | null>(
    (best, s) => (!best || countSeriesEpisodes(s) > countSeriesEpisodes(best) ? s : best),
    null,
  );
  return { ...usage(countSeriesEpisodes(fullest), getPlanQuota(planKey).maxEpisodesPerSeries), series: fullest };
}

export function getGigUsage(currentGigsCount: number, planKey: string = "trial") {
  return usage(currentGigsCount, getPlanQuota(planKey).maxGigs);
}

export function getProductUsage(currentProductsCount: number, planKey: string = "trial") {
  return usage(currentProductsCount, getPlanQuota(planKey).maxProducts);
}

export function canCreateSeries(seriesList: Series[], planKey: string = "trial"): boolean {
  return !getSeriesUsage(seriesList, planKey).isLimitReached;
}

export function canCreateEpisode(targetSeries?: Series, planKey: string = "trial"): boolean {
  if (!targetSeries) return true;
  return !getEpisodeUsage(targetSeries, planKey).isLimitReached;
}

export function canCreateGig(currentGigsCount: number, planKey: string = "trial"): boolean {
  return !getGigUsage(currentGigsCount, planKey).isLimitReached;
}

export function canAddProduct(currentProductsCount: number, planKey: string = "trial"): boolean {
  return !getProductUsage(currentProductsCount, planKey).isLimitReached;
}
