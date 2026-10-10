import type { Series, Episode } from "@/types";
type LegacySeries = Series & { episodes?: Episode[] };

export function getSeriesEpisodes(series: Series): Episode[] {
  return series.seasons?.flatMap((season) => season.episodes) || (series as LegacySeries).episodes || [];
}

